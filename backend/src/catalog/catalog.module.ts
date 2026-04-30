import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { FugaApiService } from './fuga-api.service';
import { FugaSyncCron } from './fuga-sync.cron';
import { FugaCookieIngestController } from './fuga-cookie-ingest.controller';
import { DropboxModule } from '../dropbox/dropbox.module';

@Module({
  imports: [DropboxModule],
  controllers: [CatalogController, FugaCookieIngestController],
  providers: [CatalogService, FugaApiService, FugaSyncCron],
  exports: [CatalogService, FugaApiService],
})
export class CatalogModule {}
