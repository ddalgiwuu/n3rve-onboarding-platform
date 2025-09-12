import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleProfile, GoogleUser } from '../interfaces/auth.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') ||
      (configService.get<string>('NODE_ENV') === 'production' 
        ? 'https://n3rve-onboarding.com/api/auth/google/callback'
        : 'http://localhost:3001/api/auth/google/callback');
    
    console.log('Google Strategy Configuration:', {
      clientID: clientID ? 'configured' : 'missing',
      clientSecret: clientSecret ? 'configured' : 'missing',
      callbackURL,
      NODE_ENV: configService.get<string>('NODE_ENV'),
    });
    
    if (!clientID || !clientSecret) {
      console.error('❌ Google OAuth credentials are missing!');
    }
    
    super({
      clientID: clientID || '',
      clientSecret: clientSecret || '',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): void {
    try {
      console.log('Google Strategy Validate - Profile received:', {
        id: profile.id,
        displayName: profile.displayName,
        emails: profile.emails?.length || 0,
      });
      
      const { displayName, emails, photos, id } = profile;
      
      if (!emails || emails.length === 0) {
        console.error('❌ No email received from Google');
        return done(new Error('No email received from Google'), false);
      }
      
      const user: GoogleUser = {
        googleId: id,
        email: emails[0].value,
        name: displayName,
        profilePicture: photos?.[0]?.value || undefined,
        provider: 'google',
        accessToken,
      };
      
      console.log('✅ Google Strategy Validate - User created:', user);
      done(null, user);
    } catch (error) {
      console.error('❌ Google Strategy Validate Error:', error);
      done(error as Error, false);
    }
  }
}
