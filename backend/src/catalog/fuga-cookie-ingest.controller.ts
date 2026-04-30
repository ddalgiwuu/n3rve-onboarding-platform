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
import { CatalogService } from './catalog.service';
import { FugaApiService } from './fuga-api.service';

/**
 * Endpoint NanoClaw (and other automation) calls to push a fresh FUGA portal
 * session cookie into n3rve-backend.
 *
 * Auth: shared-secret Bearer token, env var `FUGA_COOKIE_INGEST_SECRET`.
 *       This is intentionally separate from JWT user auth — NanoClaw is a
 *       service, not a logged-in user.
 *
 * Side effects:
 *   - Persists cookie to FugaSession Mongo row (overwrites previous).
 *   - Triggers a `pullFromFuga()` if no sync has run in the last 30 minutes.
 *     The debounce stops repeated NanoClaw pushes from spamming sync.
 */
@Controller('admin')
export class FugaCookieIngestController {
  private readonly logger = new Logger(FugaCookieIngestController.name);
  private static readonly DEBOUNCE_MS = 30 * 60 * 1000; // 30 minutes
  private syncInFlight = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly fugaApi: FugaApiService,
    private readonly catalogService: CatalogService,
  ) {}

  @Post('fuga-cookie')
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
    const { updatedAt } = await this.fugaApi.setSessionCookie(cookie, source);

    // Debounce: only trigger sync if last successful sync was > 30 min ago
    // and no sync is currently running.
    const debounceResult = await this.maybeTriggerSync();

    return {
      ok: true,
      updatedAt: updatedAt.toISOString(),
      syncTriggered: debounceResult.triggered,
      ...(debounceResult.reason ? { syncSkippedReason: debounceResult.reason } : {}),
    };
  }

  private assertSecret(authHeader: string | undefined): void {
    const expected = this.configService.get<string>('FUGA_COOKIE_INGEST_SECRET');
    if (!expected) {
      this.logger.error('FUGA_COOKIE_INGEST_SECRET not configured — refusing all ingests');
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

  /**
   * Fire-and-forget: kick off pullFromFuga in the background if eligible.
   * Returns whether a sync was actually started (or why it was skipped).
   */
  private async maybeTriggerSync(): Promise<{ triggered: boolean; reason?: string }> {
    if (this.syncInFlight) {
      return { triggered: false, reason: 'sync already running' };
    }
    const lastSyncAt = await this.fugaApi.getLastSyncAt();
    const now = Date.now();
    if (lastSyncAt && now - lastSyncAt.getTime() < FugaCookieIngestController.DEBOUNCE_MS) {
      const minsAgo = Math.round((now - lastSyncAt.getTime()) / 60_000);
      return { triggered: false, reason: `last sync ${minsAgo}m ago (debounce ${FugaCookieIngestController.DEBOUNCE_MS / 60_000}m)` };
    }

    this.syncInFlight = true;
    // Don't await — let the HTTP response return immediately.
    void this.catalogService
      .pullFromFuga()
      .then(async (result) => {
        this.logger.log(
          `Auto-sync after cookie refresh — created: ${result.created}, updated: ${result.updated}, errors: ${result.errors.length}`,
        );
        await this.fugaApi.recordSessionSyncedAt(new Date());
      })
      .catch((err) => {
        this.logger.error(`Auto-sync after cookie refresh failed: ${(err as Error).message}`);
      })
      .finally(() => {
        this.syncInFlight = false;
      });

    return { triggered: true };
  }
}
