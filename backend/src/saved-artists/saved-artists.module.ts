import { Module } from '@nestjs/common';
import { SavedArtistsController } from './saved-artists.controller';
import { SavedArtistsService } from './saved-artists.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SavedArtistsController],
  providers: [SavedArtistsService],
  exports: [SavedArtistsService],
})
export class SavedArtistsModule {}