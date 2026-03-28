import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/qc',
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://n3rve-onboarding.com',
      'https://n3rve-onboarding-platform.vercel.app',
    ],
    credentials: true,
  },
})
export class QCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('QCGateway');

  // Track connected clients by type
  private frontendClients = new Map<string, Socket>(); // sessionId -> socket
  private openClawClient: Socket | null = null;

  constructor(private configService: ConfigService) {}

  handleConnection(client: Socket) {
    const apiKey =
      client.handshake.auth?.apiKey ||
      client.handshake.headers['x-api-key'];
    const validKey = this.configService.get<string>('OPENCLAW_API_KEY');

    if (apiKey && apiKey === validKey) {
      // OpenClaw connection
      this.openClawClient = client;
      this.logger.log('OpenClaw connected');
      client.emit('connected', { role: 'openclaw' });
    } else {
      // Frontend client connection - accept all (JWT validation is optional here since it's advisory QC)
      const sessionId = client.handshake.auth?.sessionId || client.id;
      this.frontendClients.set(sessionId, client);
      this.logger.log(`Frontend client connected: ${sessionId}`);
      client.emit('connected', { role: 'frontend', sessionId });
    }
  }

  handleDisconnect(client: Socket) {
    if (client === this.openClawClient) {
      this.openClawClient = null;
      this.logger.log('OpenClaw disconnected');
    } else {
      // Remove from frontend clients
      for (const [sessionId, socket] of this.frontendClients.entries()) {
        if (socket === client) {
          this.frontendClients.delete(sessionId);
          this.logger.log(`Frontend client disconnected: ${sessionId}`);
          break;
        }
      }
    }
  }

  // Frontend sends QC request -> relay to OpenClaw
  @SubscribeMessage('qc-request')
  handleQCRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      requestId: string;
      sessionId: string;
      step: number;
      data: any;
    },
  ) {
    this.logger.debug(
      `QC request from ${data.sessionId}, step ${data.step}`,
    );

    if (this.openClawClient) {
      this.openClawClient.emit('qc-request', data);
      // Notify frontend that request was forwarded
      client.emit('qc-status', {
        requestId: data.requestId,
        status: 'processing',
        message: 'QC check in progress...',
      });
    } else {
      // OpenClaw not connected - return status
      client.emit('qc-status', {
        requestId: data.requestId,
        status: 'unavailable',
        message: 'OpenClaw QC service is not connected',
      });
    }
  }

  // OpenClaw sends QC result -> relay to frontend
  @SubscribeMessage('qc-result')
  handleQCResult(
    @ConnectedSocket() _client: Socket,
    @MessageBody()
    data: {
      requestId: string;
      sessionId: string;
      results: Array<{
        severity: string;
        category: string;
        field?: string;
        dsp?: string;
        message: string;
        messageKo: string;
        suggestion?: string;
        suggestedValue?: string;
      }>;
      summary: {
        errors: number;
        warnings: number;
        info: number;
        isValid: boolean;
      };
    },
  ) {
    this.logger.debug(
      `QC result for session ${data.sessionId}: ${data.summary.errors} errors, ${data.summary.warnings} warnings`,
    );

    const frontendSocket = this.frontendClients.get(data.sessionId);
    if (frontendSocket) {
      frontendSocket.emit('qc-result', data);
    } else {
      // Broadcast to all frontend clients (fallback)
      this.server.emit('qc-result', data);
    }
  }

  // Public method for other services to push QC notifications
  broadcastQCUpdate(event: string, data: any) {
    this.server.emit(event, data);
  }
}
