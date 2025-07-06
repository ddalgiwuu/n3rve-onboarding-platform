import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { GoogleUser, JwtPayload } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async googleLogin(googleUser: GoogleUser | null) {
    if (!googleUser) {
      throw new Error('No user from google');
    }

    console.log('Google Login - Input user:', googleUser);

    let user = await this.usersService.findUserByGoogleId(googleUser.googleId);
    console.log('Google Login - Existing user found:', user);

    if (!user) {
      // Check if this email should be an admin
      const adminEmails = ['wonseok9706@gmail.com', 'chris@n3rve.com'];
      const isAdmin = adminEmails.includes(googleUser.email);

      console.log(
        'Google Login - Is admin email?',
        isAdmin,
        'for email:',
        googleUser.email,
      );

      user = await this.usersService.createUser({
        email: googleUser.email,
        googleId: googleUser.googleId,
        name: googleUser.name,
        profilePicture: googleUser.profilePicture,
        role: isAdmin ? 'ADMIN' : 'USER',
        emailVerified: true,
        isActive: true,
        isProfileComplete: isAdmin ? true : false,
        preferences: {
          language: 'KO',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      });
      console.log('Google Login - User created:', user);
    } else {
      // Check if existing user should be upgraded to admin
      const adminEmails = ['wonseok9706@gmail.com', 'chris@n3rve.com'];
      const isAdmin = adminEmails.includes(user.email);

      // Update role if user should be admin but isn't
      if (isAdmin && user.role !== 'ADMIN') {
        console.log('Google Login - Upgrading user to admin:', user.email);
        user = await this.usersService.updateUser(user.id, {
          role: 'ADMIN',
          isProfileComplete: true,
        });
      }

      await this.usersService.updateLastLogin(user.id);
      console.log('Google Login - Last login updated for existing user');
    }

    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      name: user.name,
      role: user.role,
    };

    console.log('Google Login - JWT Payload:', payload);

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });
    const refreshSecret = this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET');
    const refresh_token = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    console.log('Google Login - Tokens created, returning user:', user);

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.usersService.findUserByEmail(email);
  }

  async validateUser(id: string): Promise<User | null> {
    return this.usersService.findUserById(id);
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
