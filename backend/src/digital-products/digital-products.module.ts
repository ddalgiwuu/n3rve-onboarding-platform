import { Module } from '@nestjs/common';
import { DigitalProductsService } from './digital-products.service';
import { DigitalProductsController } from './digital-products.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DigitalProductsController],
  providers: [DigitalProductsService],
  exports: [DigitalProductsService]
})
export class DigitalProductsModule {}
