import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/auth.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    });
  }

  async validate(payload: JwtPayload) {
    console.log('JWT Validate - Starting validation');
    console.log('JWT Validate - Payload:', JSON.stringify(payload, null, 2));
    console.log('JWT Validate - User ID from payload:', payload.sub);
    console.log('JWT Validate - Payload exp:', payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration');
    
    // Get the latest user data from database
    console.log('JWT Validate - Fetching user from database with ID:', payload.sub);
    const user = await this.usersService.findUserById(payload.sub);
    console.log('JWT Validate - User from DB:', user ? 'Found' : 'Not found');
    
    if (user) {
      console.log('JWT Validate - User details:', JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }, null, 2));
    }
    
    if (!user) {
      console.log('JWT Validate - User not found for ID:', payload.sub);
      return null;
    }
    
    console.log('JWT Validate - Validation successful for user:', user.id);
    return user;
  }
}
