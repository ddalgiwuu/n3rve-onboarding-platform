import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CatalogService } from './catalog.service';
import { exec } from 'child_process';
import * as path from 'path';

@Injectable()
export class FugaSyncCron {
  private readonly logger = new Logger(FugaSyncCron.name);

  constructor(private readonly catalogService: CatalogService) {}

  @Cron('0 0 * * 1') // Every Monday at midnight (server time)
  async handleWeeklySync(): Promise<void> {
    this.logger.log('Starting weekly FUGA pull sync...');

    try {
      // Step 1: Pull catalog data from FUGA
      const result = await this.catalogService.pullFromFuga();

      this.logger.log(
        `Weekly FUGA catalog sync complete — created: ${result.created}, updated: ${result.updated}, errors: ${result.errors.length}`,
      );

      if (result.errors.length > 0) {
        this.logger.warn(
          `Catalog sync completed with ${result.errors.length} error(s):\n${result.errors.slice(0, 10).join('\n')}`,
        );
      }

      // Step 2: Sync audio files from FUGA to Dropbox
      await this.syncAudioFiles();

      // Step 3: Fix audio mapping in DB
      await this.fixAudioMapping();
    } catch (error) {
      // Never let cron failures crash the process
      this.logger.error(`Weekly FUGA sync threw an unexpected error: ${error.message}`, error.stack);
    }
  }

  private syncAudioFiles(): Promise<void> {
    return new Promise((resolve) => {
      const scriptPath = path.resolve(__dirname, '../../scripts/sync-fuga-audio.js');
      this.logger.log('Starting FUGA→Dropbox audio sync...');

      exec(`node ${scriptPath}`, { timeout: 30 * 60 * 1000 }, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Audio sync error: ${error.message}`);
        }
        if (stdout) {
          // Extract summary line
          const summary = stdout.split('\n').filter(l => l.startsWith('✅') || l.startsWith('🎵') || l.startsWith('❌'));
          summary.forEach(l => this.logger.log(`Audio sync: ${l}`));
        }
        resolve();
      });
    });
  }

  private fixAudioMapping(): Promise<void> {
    return new Promise((resolve) => {
      const scriptPath = path.resolve(__dirname, '../../scripts/fix-audio-mapping.js');
      this.logger.log('Starting audio mapping fix...');

      exec(`node ${scriptPath}`, { timeout: 30 * 60 * 1000 }, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Audio mapping fix error: ${error.message}`);
        }
        if (stdout) {
          const summary = stdout.split('\n').filter(l => l.startsWith('✅') || l.startsWith('⬇️') || l.startsWith('❌'));
          summary.forEach(l => this.logger.log(`Mapping fix: ${l}`));
        }
        resolve();
      });
    });
  }
}
