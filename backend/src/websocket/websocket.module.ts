import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebsocketGateway } from './websocket.gateway';
import { QCGateway } from './qc.gateway';

@Module({
  imports: [ConfigModule],
  providers: [WebsocketGateway, QCGateway],
  exports: [WebsocketGateway, QCGateway],
})
export class WebsocketModule {}
