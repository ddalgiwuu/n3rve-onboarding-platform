import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    console.log('JwtAuthGuard: Request URL:', request.url);
    console.log('JwtAuthGuard: Authorization header:', request.headers?.authorization);
    console.log('JwtAuthGuard: Has Bearer token:', !!request.headers?.authorization?.startsWith('Bearer '));
    
    return super.canActivate(context);
  }
}