import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-facebook';
import type { OAuthProfile } from './types/oauth-profile';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('FACEBOOK_APP_ID') || 'disabled',
      clientSecret: config.get<string>('FACEBOOK_APP_SECRET') || 'disabled',
      callbackURL:
        config.get<string>('FACEBOOK_CALLBACK_URL') ||
        'http://localhost:3000/api/v1/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name', 'displayName'],
      scope: ['email'],
      enableProof: true,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: OAuthProfile) => void,
  ): void {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    const fullName =
      profile.displayName?.trim() ||
      [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') ||
      'Taraka User';

    if (!email) {
      done(new Error('Facebook account did not provide an email'));
      return;
    }

    done(null, {
      provider: 'FACEBOOK',
      providerUserId: profile.id,
      email,
      fullName,
    });
  }
}
