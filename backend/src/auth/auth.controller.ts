import { Controller, Get, Put, Body, UseGuards, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
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
      console.log('Google OAuth callback - received user:', req.user);
      
      if (!req.user) {
        throw new Error('No user data received from Google');
      }
      
      const result = await this.authService.googleLogin(req.user);
      
      // Always use production frontend URL
      const frontendUrl = 'https://n3rve-onboarding.com';
      
      // Use the user returned from googleLogin which has the updated role
      const profileComplete = result.user?.isProfileComplete || false;

      // Log for debugging
      console.log('Google OAuth callback - redirecting to:', frontendUrl);
      console.log('Profile complete:', profileComplete);

      res.redirect(
        `${frontendUrl}/auth/callback?access_token=${result.access_token}&refresh_token=${result.refresh_token}&profile_complete=${profileComplete}`,
      );
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Return a JSON error response for debugging
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

  @Public()
  @Get('test')
  async test() {
    return {
      status: 'ok',
      mongoUri: this.configService.get('MONGODB_URI') ? 'configured' : 'missing',
      jwtSecret: this.configService.get('JWT_SECRET') ? 'configured' : 'missing',
      googleClientId: this.configService.get('GOOGLE_CLIENT_ID') ? 'configured' : 'missing',
      googleClientSecret: this.configService.get('GOOGLE_CLIENT_SECRET') ? 'configured' : 'missing',
      nodeEnv: this.configService.get('NODE_ENV') || 'not set',
      corsOrigin: this.configService.get('CORS_ORIGIN') || 'not set',
    };
  }
  
  @Public()
  @Get('debug')
  async debug() {
    try {
      // Test database connection
      const dbTest = await this.usersService.findOne('test@example.com').catch(() => null);
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: this.configService.get('NODE_ENV') || 'not set',
          MONGODB_URI: this.configService.get('MONGODB_URI') ? 'configured' : 'missing',
          JWT_SECRET: this.configService.get('JWT_SECRET') ? 'configured' : 'missing',
          GOOGLE_CLIENT_ID: this.configService.get('GOOGLE_CLIENT_ID') ? 'configured' : 'missing',
          GOOGLE_CLIENT_SECRET: this.configService.get('GOOGLE_CLIENT_SECRET') ? 'configured' : 'missing',
          GOOGLE_CALLBACK_URL: this.configService.get('GOOGLE_CALLBACK_URL') || 'using default',
          CORS_ORIGIN: this.configService.get('CORS_ORIGIN') || 'not set',
        },
        database: {
          connected: dbTest !== null ? 'maybe' : 'connection test performed',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
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

  @Public()
  @Get('test-login')
  async testLogin(@Res() res: Response) {
    try {
      // Create or find test user
      const testEmail = 'test@n3rve.com';
      let user = await this.usersService.findOne(testEmail);
      
      if (!user) {
        user = await this.usersService.create({
          email: testEmail,
          googleId: 'test-google-id',
          name: 'Test Admin User',
          profilePicture: '',
          role: 'ADMIN',
          emailVerified: true,
          isActive: true,
          isProfileComplete: true,
          preferences: {
            language: 'KO',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        });
      }

      const result = await this.authService.googleLogin({
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture || '',
        provider: 'google',
        accessToken: 'test-token',
      });
      
      const frontendUrl = 'https://n3rve-onboarding.com';
      
      res.redirect(
        `${frontendUrl}/auth/callback?access_token=${result.access_token}&refresh_token=${result.refresh_token}&profile_complete=true`,
      );
    } catch (error) {
      console.error('Test login error:', error);
      res.status(500).json({ error: 'Test login failed' });
    }
  }
}