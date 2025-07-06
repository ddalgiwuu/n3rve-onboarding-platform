import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('config-check')
  configCheck() {
    return {
      mongoUri: this.configService.get('MONGODB_URI') ? 'configured' : 'missing',
      jwtSecret: this.configService.get('JWT_SECRET') ? 'configured' : 'missing',
      googleClientId: this.configService.get('GOOGLE_CLIENT_ID') ? 'configured' : 'missing',
      googleClientSecret: this.configService.get('GOOGLE_CLIENT_SECRET') ? 'configured' : 'missing',
      nodeEnv: this.configService.get('NODE_ENV') || 'not set',
    };
  }
}