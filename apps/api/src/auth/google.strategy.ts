import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';
import type { OAuthProfile } from './types/oauth-profile';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'disabled',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || 'disabled',
      callbackURL:
        config.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:3000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    const fullName =
      profile.displayName?.trim() ||
      [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') ||
      'Taraka User';

    if (!email) {
      done(new Error('Google account did not provide an email'), undefined);
      return;
    }

    const oauth: OAuthProfile = {
      provider: 'GOOGLE',
      providerUserId: profile.id,
      email,
      fullName,
    };
    done(null, oauth);
  }
}
