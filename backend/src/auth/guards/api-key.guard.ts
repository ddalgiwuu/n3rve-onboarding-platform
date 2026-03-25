import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'crypto';
import { IS_API_KEY } from '../decorators/api-key.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isApiKey = this.reflector.getAllAndOverride<boolean>(IS_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isApiKey) return true;

    const request = context.switchToHttp().getRequest();

    // Allow internal network (localhost)
    const ip = request.ip || request.connection?.remoteAddress;
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return true;
    }

    // Check x-api-key header
    const apiKey = request.headers['x-api-key'];
    const validKey = this.configService.get<string>('CATALOG_API_KEY');

    if (!validKey) {
      console.warn('CATALOG_API_KEY not configured');
      throw new UnauthorizedException('API key not configured');
    }

    const isValid = apiKey.length === validKey.length &&
      timingSafeEqual(Buffer.from(apiKey), Buffer.from(validKey));
    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
