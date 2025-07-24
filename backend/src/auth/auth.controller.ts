import { Controller, Get, Put, Post, Body, UseGuards, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard)
  @Get('verify-token')
  async verifyToken(@CurrentUser() user: User, @Req() req: Request) {
    console.log('Verify Token - Headers:', req.headers);
    console.log('Verify Token - Authorization header:', req.headers.authorization);
    console.log('Verify Token - User:', user);
    
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
    console.log('Auth Controller - Refresh token request received');
    
    if (!body.refreshToken) {
      throw new HttpException('Refresh token is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.authService.refreshAccessToken(body.refreshToken);
      console.log('Auth Controller - Refresh token result:', result ? 'Success' : 'Failed');
      
      if (!result) {
        throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }

      return result;
    } catch (error) {
      console.error('Auth Controller - Refresh token error:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException('Failed to refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  @Public()
  @Post('register')
  async register(@Body() body: { 
    email: string; 
    password: string; 
    name: string; 
    phone?: string;
    company?: string;
    isCompanyAccount?: boolean;
  }) {
    console.log('Auth Controller - Registration request for:', body.email);

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
        phone: body.phone,
        company: body.isCompanyAccount ? body.company : undefined,
        isCompanyAccount: body.isCompanyAccount || false,
        provider: 'EMAIL',
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

      // Generate tokens
      const tokens = await this.authService.generateTokens(user);

      // Transform role for frontend compatibility
      const userResponse = {
        ...user,
        role: user.role === 'USER' ? 'CUSTOMER' : user.role,
        password: undefined, // Remove password from response
      };

      return {
        user: userResponse,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      };
    } catch (error) {
      console.error('Auth Controller - Registration error:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    console.log('Auth Controller - Email login request for:', body.email);

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

      // Transform role for frontend compatibility
      const userResponse = {
        ...user,
        role: user.role === 'USER' ? 'CUSTOMER' : user.role,
        password: undefined, // Remove password from response
      };

      return {
        user: userResponse,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      };
    } catch (error) {
      console.error('Auth Controller - Login error:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}