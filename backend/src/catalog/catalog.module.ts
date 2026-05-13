import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { FugaApiService } from './fuga-api.service';
import { FugaSyncCron } from './fuga-sync.cron';
import { FugaCookieIngestController } from './fuga-cookie-ingest.controller';
import { FugaScoreSyncService } from './fuga-score-sync.service';
import { FugaScoreSyncCron } from './fuga-score-sync.cron';
import { SoftrCookieIngestController } from './softr-cookie-ingest.controller';
import { DropboxModule } from '../dropbox/dropbox.module';

@Module({
  imports: [DropboxModule],
  controllers: [
    CatalogController,
    FugaCookieIngestController,
    SoftrCookieIngestController,
  ],
  providers: [
    CatalogService,
    FugaApiService,
    FugaSyncCron,
    FugaScoreSyncService,
    FugaScoreSyncCron,
  ],
  exports: [CatalogService, FugaApiService, FugaScoreSyncService],
})
export class CatalogModule {}
