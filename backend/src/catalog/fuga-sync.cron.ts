import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CatalogService } from './catalog.service';

@Injectable()
export class FugaSyncCron {
  private readonly logger = new Logger(FugaSyncCron.name);

  constructor(private readonly catalogService: CatalogService) {}

  @Cron('0 0 * * 1') // Every Monday at midnight (server time)
  async handleWeeklySync(): Promise<void> {
    this.logger.log('Starting weekly FUGA pull sync...');

    try {
      const result = await this.catalogService.pullFromFuga();

      this.logger.log(
        `Weekly FUGA sync complete — created: ${result.created}, updated: ${result.updated}, errors: ${result.errors.length}`,
      );

      if (result.errors.length > 0) {
        this.logger.warn(
          `Weekly sync completed with ${result.errors.length} error(s):\n${result.errors.slice(0, 10).join('\n')}`,
        );
      }
    } catch (error) {
      // Never let cron failures crash the process
      this.logger.error(`Weekly FUGA sync threw an unexpected error: ${error.message}`, error.stack);
    }
  }
}
