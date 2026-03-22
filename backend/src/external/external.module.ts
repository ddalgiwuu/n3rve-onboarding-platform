import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { ExternalController } from './external.controller';
import { ExternalService } from './external.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [PrismaModule, WebsocketModule],
  controllers: [ExternalController],
  providers: [ExternalService, ApiKeyGuard],
})
export class ExternalModule {}
