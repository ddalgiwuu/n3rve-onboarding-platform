import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FugaScoreSyncService } from './fuga-score-sync.service';

/**
 * Weekly FUGA Score (Softr) marketing sync.
 *
 * Scheduled Monday 03:00 server time — 3 hours after FugaSyncCron's catalog
 * pull (Monday 00:00). The stagger ensures CatalogProduct UPCs are populated
 * before FUGA Score matching runs against them, and avoids simultaneous load
 * spikes. Cron failures never throw out of this handler — they are observable
 * through the SoftrSession.lastSyncAt staleness check (PR-3 surfaces this in
 * SyncRun + alerts).
 */
@Injectable()
export class FugaScoreSyncCron {
  private readonly logger = new Logger(FugaScoreSyncCron.name);

  constructor(private readonly syncService: FugaScoreSyncService) {}

  @Cron('0 3 * * 1')
  async handleWeeklySync(): Promise<void> {
    this.logger.log('Starting weekly FUGA Score sync (Monday 03:00)');
    try {
      const result = await this.syncService.runSync({ source: 'cron' });
      this.logger.log(
        `Weekly FUGA Score cron finished status=${result.status} ` +
          `updated=${result.counters.updated} errors=${result.counters.errors}`,
      );
    } catch (err) {
      this.logger.error(`Weekly FUGA Score cron threw: ${(err as Error).message}`, (err as Error).stack);
    }
  }
}
