import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import { FugaScoreSyncService } from './fuga-score-sync.service';

/**
 * Endpoint NanoClaw (or operator scripts) calls to push a fresh
 * fugascore.softr.app session cookie. Mirrors FugaCookieIngestController but
 * targets a different upstream so the two cookies stay isolated — token
 * confusion between FUGA portal and Softr would cost a debugging session.
 *
 * Auth: shared-secret Bearer, env var `SOFTR_COOKIE_INGEST_SECRET`.
 * Effects:
 *   - Persists cookie to SoftrSession Mongo row (overwrites previous).
 *   - Triggers FugaScoreSyncService.runSync({ source: 'cookie-ingest-debounce' })
 *     if no successful sync has run in the last 30 min — the service's own
 *     single-flight lock collapses concurrent ingests safely.
 */
@Controller('admin')
export class SoftrCookieIngestController {
  private readonly logger = new Logger(SoftrCookieIngestController.name);
  private static readonly DEBOUNCE_MS = 30 * 60 * 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly syncService: FugaScoreSyncService,
  ) {}

  @Post('softr-cookie')
  @Public()
  @HttpCode(200)
  async ingest(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: { cookie?: string; source?: string },
  ): Promise<{
    ok: true;
    updatedAt: string;
    syncTriggered: boolean;
    syncSkippedReason?: string;
  }> {
    this.assertSecret(authHeader);
    const cookie = (body?.cookie || '').trim();
    if (!cookie) {
      throw new UnauthorizedException('Missing cookie in request body');
    }
    const source = body?.source || 'nanoclaw';
    const { updatedAt } = await this.syncService.setSessionCookie(cookie, source);

    const debounce = await this.maybeTriggerSync();
    return {
      ok: true,
      updatedAt: updatedAt.toISOString(),
      syncTriggered: debounce.triggered,
      ...(debounce.reason ? { syncSkippedReason: debounce.reason } : {}),
    };
  }

  private assertSecret(authHeader: string | undefined): void {
    const expected = this.configService.get<string>('SOFTR_COOKIE_INGEST_SECRET');
    if (!expected) {
      this.logger.error('SOFTR_COOKIE_INGEST_SECRET not configured — refusing all ingests');
      throw new UnauthorizedException('Ingest endpoint not configured');
    }
    const presented = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
    if (!presented || !this.constantTimeEqual(presented, expected)) {
      throw new UnauthorizedException('Invalid ingest secret');
    }
  }

  private constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return mismatch === 0;
  }

  private async maybeTriggerSync(): Promise<{ triggered: boolean; reason?: string }> {
    const lastSyncAt = await this.syncService.getLastSyncAt();
    const now = Date.now();
    if (lastSyncAt && now - lastSyncAt.getTime() < SoftrCookieIngestController.DEBOUNCE_MS) {
      const minsAgo = Math.round((now - lastSyncAt.getTime()) / 60_000);
      return {
        triggered: false,
        reason: `last sync ${minsAgo}m ago (debounce ${SoftrCookieIngestController.DEBOUNCE_MS / 60_000}m)`,
      };
    }

    // Fire-and-forget. Service's single-flight lock collapses concurrent calls.
    void this.syncService
      .runSync({ source: 'cookie-ingest-debounce' })
      .then((result) =>
        this.logger.log(
          `Auto-sync after cookie refresh — status=${result.status}, ` +
            `updated=${result.counters.updated}, errors=${result.counters.errors}`,
        ),
      )
      .catch((err) => this.logger.error(`Auto-sync after cookie refresh failed: ${(err as Error).message}`));
    return { triggered: true };
  }
}
