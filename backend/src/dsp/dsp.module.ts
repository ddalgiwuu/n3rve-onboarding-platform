import { Module } from '@nestjs/common';
import { DSPController } from './dsp.controller';
import { DSPService } from './dsp.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DSPController],
  providers: [DSPService],
  exports: [DSPService],
})
export class DSPModule {}