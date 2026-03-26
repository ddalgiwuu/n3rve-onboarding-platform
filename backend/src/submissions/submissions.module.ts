import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesModule } from '../files/files.module';
import { DropboxModule } from '../dropbox/dropbox.module';
import { SavedArtistsModule } from '../saved-artists/saved-artists.module';

@Module({
  imports: [PrismaModule, FilesModule, DropboxModule, SavedArtistsModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
