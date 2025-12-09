import { Module } from '@nestjs/common';
import { FeatureReportsService } from './feature-reports.service';
import { FeatureReportsController } from './feature-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeatureReportsController],
  providers: [FeatureReportsService],
  exports: [FeatureReportsService]
})
export class FeatureReportsModule {}
