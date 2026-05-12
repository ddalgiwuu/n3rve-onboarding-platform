import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import fetch from 'node-fetch';

/**
 * Fetches marketing metadata from FUGA Score (Softr/Airtable) and merges it
 * into Submission.marketing.
 *
 * Replaces the standalone backend/scripts/sync-fuga-score.js that was never
 * wired into Nest and only ran once in 6 weeks. This service is invoked by
 *   - FugaScoreSyncCron (weekly, Mondays 3am, staggered after FugaSyncCron)
 *   - Admin trigger endpoint (PR-3) for manual runs / dry-runs
 *   - SoftrCookieIngestController debounced auto-sync after a fresh cookie
 *
 * Auth strategy: shared SoftrSession DB cookie (NanoClaw-managed), with env
 * var SOFTR_SESSION_COOKIE as a fallback. n3rve has no Softr PAT because the
 * fugascore.softr.app workspace is FUGA-owned and we are guests — see plan
 * cross-validation thread 5a7f3576 for the auth-strategy decision.
 *
 * Concurrency: single-flight lock inside this service guards against the cron,
 * admin trigger, and cookie-ingest debounce racing each other. In-memory lock
 * is acceptable because n3rve-backend on Fly is single-instance today. If Fly
 * scales out, swap for a SyncRun-row TTL lock.
 *
 * Atomicity: each per-submission marketing patch goes through
 * `$runCommandRaw` $set with the dotted-path pattern that catalog.service.ts
 * already uses at line 1511. No full-JSON read-modify-write so sibling fields
 * (user-entered marketing, fugaScoreSyncedAt, etc.) survive concurrent edits.
 */

export type RunSyncSource = 'cron' | 'admin' | 'cookie-ingest-debounce' | 'cli';
export type RunSyncStatus = 'SUCCESS' | 'AUTH_ERROR' | 'PARTIAL' | 'FAILED' | 'SKIPPED_LOCKED';

export interface RunSyncOptions {
  dryRun?: boolean;
  source: RunSyncSource;
}

export interface RunSyncResult {
  status: RunSyncStatus;
  source: RunSyncSource;
  dryRun: boolean;
  startedAt: Date;
  endedAt: Date;
  counters: {
    fetched: number;
    matched: number;
    updated: number;
    ambiguous: number;
    noMatch: number;
    errors: number;
  };
  errors: string[];
}

const SOFTR_KEY = 'current';
const SOFTR_APP_ID = 'bf622201-d159-45f9-ad28-b9b2e157ec1a';
const SOFTR_PAGE_ID = '3ddf04c0-43c2-47f0-970f-ccc76734789f';
const PROJECTS_BLOCK = 'a579465c-6667-4896-a127-92fa9b242e72';
const PROJECTS_DS = 'd292b4ec-6904-4110-984f-e49e240bf748';
const SOFTR_PROJECTS_URL = `https://fugascore.softr.app/v1/datasource/applications/${SOFTR_APP_ID}/pages/${SOFTR_PAGE_ID}/blocks/${PROJECTS_BLOCK}/datasources/${PROJECTS_DS}/records`;

const MAX_ERROR_ENTRIES = 10;
const MAX_ERROR_LENGTH = 200;

@Injectable()
export class FugaScoreSyncService {
  private readonly logger = new Logger(FugaScoreSyncService.name);

  // 30s in-memory cache for the DB cookie — matches FugaApiService pattern.
  private cachedDbCookie: string | null = null;
  private cachedDbCookieAt = 0;
  private static readonly DB_COOKIE_CACHE_MS = 30 * 1000;

  // Single-flight lock — only one sync in flight regardless of caller.
  private inFlight: Promise<RunSyncResult> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== PUBLIC API ====================

  async runSync(opts: RunSyncOptions): Promise<RunSyncResult> {
    if (this.inFlight) {
      this.logger.warn(`[${opts.source}] sync already running — collapsing into in-flight call`);
      return this.inFlight.then((result) => ({
        ...result,
        status: 'SKIPPED_LOCKED',
        source: opts.source,
      }));
    }
    this.inFlight = this.runSyncImpl(opts);
    try {
      return await this.inFlight;
    } finally {
      this.inFlight = null;
    }
  }

  /**
   * Persist a new Softr session cookie pushed by NanoClaw or operator.
   */
  async setSessionCookie(cookie: string, source = 'nanoclaw'): Promise<{ updatedAt: Date }> {
    const trimmed = cookie.trim();
    if (!trimmed) {
      throw new Error('Empty Softr cookie value');
    }
    const row = await this.prisma.softrSession.upsert({
      where: { key: SOFTR_KEY },
      create: { key: SOFTR_KEY, cookie: trimmed, source },
      update: { cookie: trimmed, source },
    });
    this.cachedDbCookie = trimmed;
    this.cachedDbCookieAt = Date.now();
    this.logger.log(`SoftrSession updated by ${source} (length=${trimmed.length})`);
    return { updatedAt: row.updatedAt };
  }

  async getLastSyncAt(): Promise<Date | null> {
    const row = await this.prisma.softrSession.findUnique({
      where: { key: SOFTR_KEY },
      select: { lastSyncAt: true },
    });
    return row?.lastSyncAt ?? null;
  }

  // ==================== IMPL ====================

  private async runSyncImpl(opts: RunSyncOptions): Promise<RunSyncResult> {
    const dryRun = !!opts.dryRun;
    const startedAt = new Date();
    const counters = { fetched: 0, matched: 0, updated: 0, ambiguous: 0, noMatch: 0, errors: 0 };
    const errors: string[] = [];

    this.logger.log(`[${opts.source}] FUGA Score sync starting (dryRun=${dryRun})`);

    // Step 1: Fetch projects from Softr.
    let projects: any[];
    try {
      projects = await this.fetchProjects();
    } catch (err: any) {
      const msg = (err as Error).message || String(err);
      if (msg.startsWith('AUTH_ERROR')) {
        this.logger.error(`[${opts.source}] Softr auth failed: ${msg}`);
        return this.finalizeRun({ status: 'AUTH_ERROR', source: opts.source, dryRun, startedAt, counters, errors: [this.truncateError(msg)] });
      }
      this.logger.error(`[${opts.source}] Softr fetch failed: ${msg}`);
      return this.finalizeRun({ status: 'FAILED', source: opts.source, dryRun, startedAt, counters, errors: [this.truncateError(msg)] });
    }
    counters.fetched = projects.length;

    if (projects.length === 0) {
      // Zero records typically means cookie is silently rejected — log loudly.
      this.logger.warn(`[${opts.source}] Softr returned 0 projects — cookie may be silently invalid`);
      return this.finalizeRun({ status: 'PARTIAL', source: opts.source, dryRun, startedAt, counters, errors: ['Zero projects returned from Softr'] });
    }

    // Step 2: Load submissions once for matching.
    const submissions = await this.prisma.submission.findMany({
      select: { id: true, albumTitle: true, labelName: true, release: true },
    });

    // Step 3: Per-project match + atomic update.
    for (const project of projects) {
      try {
        const match = this.matchProject(project, submissions);
        if (match.kind === 'ambiguous') {
          counters.ambiguous++;
          this.logger.warn(`[${opts.source}] AMBIGUOUS: ${match.reason}`);
          continue;
        }
        if (match.kind === 'none') {
          counters.noMatch++;
          continue;
        }
        counters.matched++;

        const patch = this.buildMarketingPatch(project);
        if (Object.keys(patch).length === 0) continue;

        if (!dryRun) {
          await this.applyAtomicMarketingPatch(match.submissionId, patch);
        }
        counters.updated++;
      } catch (err: any) {
        counters.errors++;
        if (errors.length < MAX_ERROR_ENTRIES) {
          errors.push(this.truncateError(`project ${project?.id || '?'}: ${(err as Error).message}`));
        }
      }
    }

    // Step 4: Persist lastSyncAt on the Softr session.
    if (!dryRun) {
      await this.recordSyncedAt(startedAt);
    }

    const status: RunSyncStatus = counters.errors === 0 ? 'SUCCESS' : 'PARTIAL';
    return this.finalizeRun({ status, source: opts.source, dryRun, startedAt, counters, errors });
  }

  // ==================== MATCHING ====================

  private matchProject(
    project: any,
    submissions: Array<{ id: string; albumTitle: string | null; labelName: string | null; release: any }>,
  ): { kind: 'unique'; submissionId: string } | { kind: 'ambiguous'; reason: string } | { kind: 'none' } {
    const f = project.fields || {};
    const projectName = (f['Project Name'] || '').trim();
    const label = (f['Label'] || '').trim();
    const upcsRaw = f['Product UPCs - Unique'] || f['Digital Products'] || '';

    // UPC primary.
    const upcList = Array.isArray(upcsRaw)
      ? upcsRaw.map(String).map((u) => u.trim()).filter(Boolean)
      : typeof upcsRaw === 'string'
        ? upcsRaw.split(',').map((u) => u.trim()).filter(Boolean)
        : [];
    for (const upc of upcList) {
      const hit = submissions.find((s) => (s.release as any)?.upc === upc);
      if (hit) return { kind: 'unique', submissionId: hit.id };
    }

    // Name+label fallback — strict: non-empty normalized label AND exactly one candidate.
    if (!projectName || !label) {
      return { kind: 'none' };
    }
    const normProjectName = this.normalize(projectName);
    const normLabel = this.normalize(label);
    const candidates = submissions.filter((s) => {
      const subName = this.normalize(s.albumTitle || '');
      const subLabel = this.normalize(s.labelName || '');
      if (!subName || !subLabel) return false;
      return subName === normProjectName && subLabel === normLabel;
    });
    if (candidates.length === 1) return { kind: 'unique', submissionId: candidates[0].id };
    if (candidates.length > 1) {
      return {
        kind: 'ambiguous',
        reason: `"${projectName}" + "${label}" matched ${candidates.length} submissions: ${candidates.map((c) => c.id).join(', ')}`,
      };
    }
    return { kind: 'none' };
  }

  private normalize(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // ==================== MAPPER ====================

  /**
   * Translate Softr project fields → canonical Submission.marketing keys.
   *
   * Critical: writes `mainGenre` (matches UI in CatalogDetail.tsx:846), NOT
   * the legacy `genre` that the old script wrote. All arrays are normalized
   * to string[] including subgenres (gap in the old script — would crash
   * `.join()` if Softr returned a string).
   */
  private buildMarketingPatch(project: any): Record<string, unknown> {
    const f = project.fields || {};
    const patch: Record<string, unknown> = {};

    if (f['Elevator Pitch']) patch.mainPitch = f['Elevator Pitch'];
    if (f['Social Media Rollout Plan']) patch.socialMediaPlan = f['Social Media Rollout Plan'];
    if (f['Marketing Spend']) patch.marketingSpend = f['Marketing Spend'];
    if (f['Priority Level']) patch.priorityLevel = f['Priority Level'];
    if (f['Main Genre']) patch.mainGenre = f['Main Genre']; // canonical name (NOT `genre`)
    if (f['Subgenre(s)']) patch.subgenres = this.toStringArray(f['Subgenre(s)']);
    if (f['Mood(s)']) patch.moods = this.toStringArray(f['Mood(s)']);
    if (f['Instruments']) patch.instruments = this.toStringArray(f['Instruments']);
    if (f['Listening Link']) patch.listeningLink = f['Listening Link'];
    if (f['Client Project Code']) patch.projectCode = f['Client Project Code'];
    if (f['Frontline / Catalog']) patch.frontlineCatalog = f['Frontline / Catalog'];
    if (f['Label Notes']) patch.labelNotes = f['Label Notes'];
    if (f['Project Start Date']) patch.projectStartDate = f['Project Start Date'];
    if (f['Project ID']) patch.fugaProjectId = f['Project ID'];
    if (f['Fact Sheets / Project Deck (URL)']) patch.factSheetUrl = f['Fact Sheets / Project Deck (URL)'];

    if (Object.keys(patch).length > 0) {
      patch.fugaScoreRecordId = project.id;
      patch.fugaScoreSyncedAt = new Date().toISOString();
    }
    return patch;
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  }

  // ==================== ATOMIC UPDATE ====================

  /**
   * Atomic per-doc $set using $runCommandRaw — matches the established pattern
   * in catalog.service.ts:1511. No read-modify-write of the marketing object,
   * sibling fields cannot be clobbered by concurrent writers.
   */
  private async applyAtomicMarketingPatch(submissionId: string, patch: Record<string, unknown>): Promise<void> {
    const $set: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      $set[`marketing.${k}`] = v;
    }
    if (Object.keys($set).length === 0) return;

    await this.prisma.$runCommandRaw({
      update: 'Submission',
      updates: [
        {
          q: { _id: { $oid: submissionId } },
          u: { $set },
          multi: false,
        },
      ],
    } as any);
  }

  // ==================== HTTP / AUTH ====================

  private async fetchProjects(): Promise<any[]> {
    const cookie = await this.resolveCookie();
    if (!cookie) {
      throw new Error('AUTH_ERROR: no Softr cookie configured — push one via /admin/softr-cookie or set SOFTR_SESSION_COOKIE');
    }

    const tryOnce = async (cookieVal: string): Promise<{ status: number; body: any }> => {
      const res = await fetch(SOFTR_PROJECTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieVal },
        body: JSON.stringify({}),
      });
      const status = res.status;
      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = { raw: await res.text() };
      }
      return { status, body };
    };

    let { status, body } = await tryOnce(cookie);
    if (status === 401) {
      // Invalidate cache + single retry — picks up cookie if a fresh one was pushed
      // between our last cache read and now.
      this.cachedDbCookie = null;
      const fresh = await this.resolveCookie();
      if (fresh && fresh !== cookie) {
        ({ status, body } = await tryOnce(fresh));
      }
    }

    if (status === 401) {
      throw new Error('AUTH_ERROR: Softr returned 401 — cookie stale, push fresh cookie from browser');
    }
    if (status < 200 || status >= 300) {
      throw new Error(`Softr returned ${status}: ${JSON.stringify(body).slice(0, 200)}`);
    }
    if (Array.isArray(body?.items)) return body.items;
    return [];
  }

  private async resolveCookie(): Promise<string | null> {
    const dbCookie = await this.getDbCookie();
    if (dbCookie) return dbCookie;
    const envCookie = this.configService.get<string>('SOFTR_SESSION_COOKIE');
    return envCookie?.trim() || null;
  }

  private async getDbCookie(): Promise<string | null> {
    const now = Date.now();
    if (this.cachedDbCookie !== null && now - this.cachedDbCookieAt < FugaScoreSyncService.DB_COOKIE_CACHE_MS) {
      return this.cachedDbCookie || null;
    }
    try {
      const row = await this.prisma.softrSession.findUnique({
        where: { key: SOFTR_KEY },
        select: { cookie: true },
      });
      this.cachedDbCookie = row?.cookie ?? '';
      this.cachedDbCookieAt = now;
      return row?.cookie ?? null;
    } catch (err) {
      this.logger.warn(`Failed to read SoftrSession from DB: ${(err as Error).message}`);
      return null;
    }
  }

  private async recordSyncedAt(when: Date): Promise<void> {
    try {
      await this.prisma.softrSession.update({
        where: { key: SOFTR_KEY },
        data: { lastSyncAt: when },
      });
    } catch (err) {
      // Row may not exist if cookie came from env. Non-fatal.
      this.logger.debug(`Could not record SoftrSession.lastSyncAt: ${(err as Error).message}`);
    }
  }

  // ==================== UTIL ====================

  private finalizeRun(args: {
    status: RunSyncStatus;
    source: RunSyncSource;
    dryRun: boolean;
    startedAt: Date;
    counters: RunSyncResult['counters'];
    errors: string[];
  }): RunSyncResult {
    const endedAt = new Date();
    const result: RunSyncResult = {
      status: args.status,
      source: args.source,
      dryRun: args.dryRun,
      startedAt: args.startedAt,
      endedAt,
      counters: args.counters,
      errors: args.errors.slice(0, MAX_ERROR_ENTRIES),
    };
    this.logger.log(
      `[${result.source}] FUGA Score sync ${result.status} ` +
        `(dryRun=${result.dryRun}, fetched=${result.counters.fetched}, ` +
        `matched=${result.counters.matched}, updated=${result.counters.updated}, ` +
        `ambiguous=${result.counters.ambiguous}, noMatch=${result.counters.noMatch}, ` +
        `errors=${result.counters.errors}) in ${endedAt.getTime() - result.startedAt.getTime()}ms`,
    );
    return result;
  }

  private truncateError(msg: string): string {
    return msg.length > MAX_ERROR_LENGTH ? msg.slice(0, MAX_ERROR_LENGTH) + '…' : msg;
  }
}
