import { Controller, Get, Put, Post, Body, UseGuards, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { GoogleUser } from './interfaces/auth.interface';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

interface RequestWithGoogleUser extends Request {
  user: GoogleUser;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(
    @Req() req: RequestWithGoogleUser,
    @Res() res: Response,
  ) {
    try {
      if (!req.user) {
        throw new Error('No user data received from Google');
      }
      
      const result = await this.authService.googleLogin(req.user);
      
      // Use environment-appropriate frontend URL
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') ||
        (this.configService.get<string>('NODE_ENV') === 'production'
          ? 'https://n3rve-onboarding-platform.vercel.app'
          : 'http://localhost:3000');
      
      // Use the user returned from googleLogin which has the updated role
      const profileComplete = result.user?.isProfileComplete || false;

      res.redirect(
        `${frontendUrl}/auth/callback?access_token=${result.access_token}&refresh_token=${result.refresh_token}&profile_complete=${profileComplete}`,
      );
    } catch (error) {
      // Return a JSON error response
      res.status(500).json({
        error: 'OAuth callback failed',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          user: req.user,
        } : undefined,
      });
    }
  }


  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: User) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  logout() {
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateData: { company: string; phone: string },
  ) {
    const updatedUser = await this.usersService.updateUser(user.id, {
      company: updateData.company,
      phone: updateData.phone,
      isProfileComplete: true,
    });
    return updatedUser;
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify-token')
  async verifyToken(@CurrentUser() user: User, @Req() req: Request) {
    return {
      status: 'authenticated',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string }) {
    
    if (!body.refreshToken) {
      throw new HttpException('Refresh token is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.authService.refreshAccessToken(body.refreshToken);
      if (!result) {
        throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException('Failed to refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  @Public()
  @Post('register')
  @Throttle({ short: { ttl: 60000, limit: 3 } }) // 3 registrations per minute
  async register(@Body() body: { 
    email: string; 
    password: string; 
    name: string; 
    phone?: string;
    company?: string;
    isCompanyAccount?: boolean;
  }) {
    if (!body.email || !body.password || !body.name) {
      throw new HttpException('Email, password, and name are required', HttpStatus.BAD_REQUEST);
    }

    if (body.password.length < 8) {
      throw new HttpException('Password must be at least 8 characters', HttpStatus.BAD_REQUEST);
    }

    try {
      // Check if user already exists
      const existingUser = await this.usersService.findOne(body.email);
      
      if (existingUser) {
        throw new HttpException('Email already exists', HttpStatus.CONFLICT);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);

      // Create user
      const user = await this.usersService.create({
        email: body.email,
        password: hashedPassword,
        name: body.name,
        phone: body.phone || null,
        company: body.isCompanyAccount ? body.company : null,
        isCompanyAccount: body.isCompanyAccount || false,
        provider: 'EMAIL',
        role: 'USER',
        googleId: '',
        profilePicture: '',
        isProfileComplete: true,
        emailVerified: true,
        isActive: true,
        preferences: {
          language: 'KO',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      });

      // Generate tokens
      const tokens = await this.authService.generateTokens(user);

      // Transform role for frontend compatibility, exclude password
      const { password: _pw, ...userWithoutPassword } = user;
      const userResponse = {
        ...userWithoutPassword,
        role: user.role === 'USER' ? 'CUSTOMER' : user.role,
      };

      return {
        user: userResponse,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public()
  @Post('login')
  @Throttle({ short: { ttl: 60000, limit: 5 } }) // 5 login attempts per minute
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new HttpException('Email and password are required', HttpStatus.BAD_REQUEST);
    }

    try {
      // Find user by email
      const user = await this.usersService.findOne(body.email);
      
      if (!user) {
        throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
      }

      // Check if user has a password (was created with email/password)
      if (!user.password || user.provider !== 'EMAIL') {
        throw new HttpException('Please use Google login for this account', HttpStatus.UNAUTHORIZED);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(body.password, user.password);
      
      if (!isPasswordValid) {
        throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new HttpException('Account is deactivated', HttpStatus.FORBIDDEN);
      }

      // Update last login
      await this.usersService.updateLastLogin(user.id);

      // Generate tokens
      const tokens = await this.authService.generateTokens(user);

      // Transform role for frontend compatibility, exclude password
      const { password: _pw, ...userWithoutPassword } = user;
      const userResponse = {
        ...userWithoutPassword,
        role: user.role === 'USER' ? 'CUSTOMER' : user.role,
      };

      return {
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}