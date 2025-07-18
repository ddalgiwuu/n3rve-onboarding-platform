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
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'secret';
    console.log('JwtStrategy: Initialized with secret:', jwtSecret.substring(0, 10) + '...');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true, // Pass request to validate method
    });
  }

  async validate(req: any, payload: JwtPayload) {
    console.log('JWT Validate - Starting validation');
    console.log('JWT Validate - Authorization header:', req.headers?.authorization);
    console.log('JWT Validate - Payload:', JSON.stringify(payload, null, 2));
    console.log('JWT Validate - User ID from payload:', payload.sub);
    console.log('JWT Validate - Payload exp:', payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration');
    console.log('JWT Validate - Current time:', new Date().toISOString());
    
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
