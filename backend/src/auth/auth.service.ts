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

    let user = await this.usersService.findUserByGoogleId(googleUser.googleId);

    if (!user) {
      const adminEmails = ['wonseok9706@gmail.com', 'chris@n3rve.com', 'ckalargiros@gmail.com'];
      const isAdmin = adminEmails.includes(googleUser.email);

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
    } else {
      const adminEmails = ['wonseok9706@gmail.com', 'chris@n3rve.com', 'ckalargiros@gmail.com'];
      const isAdmin = adminEmails.includes(user.email);

      if (isAdmin && user.role !== 'ADMIN') {
        user = await this.usersService.updateUser(user.id, {
          role: 'ADMIN',
          isProfileComplete: true,
        });
      }

      await this.usersService.updateLastLogin(user.id);
    }

    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      name: user.name,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });
    const refreshSecret = this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET');
    const refresh_token = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

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

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string } | null> {
    try {
      const refreshSecret = this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.usersService.findUserById(payload.sub);

      if (!user || !user.isActive) {
        return null;
      }

      const newPayload: JwtPayload = {
        email: user.email,
        sub: user.id,
        name: user.name,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '24h',
      });

      return { accessToken };
    } catch (error) {
      return null;
    }
  }
}
