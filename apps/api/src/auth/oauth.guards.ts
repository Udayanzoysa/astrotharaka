import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { OAuthRedirectException } from '../common/errors/oauth-redirect.exception';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService) {
    super({ session: false });
  }

  canActivate(context: ExecutionContext) {
    if (!this.config.get<string>('GOOGLE_CLIENT_ID') || !this.config.get<string>('GOOGLE_CLIENT_SECRET')) {
      const web = this.config.get<string>('WEB_APP_URL', 'http://localhost:3001');
      throw new OAuthRedirectException(`${web}/login?error=google_not_configured`);
    }
    return super.canActivate(context);
  }
}

@Injectable()
export class FacebookOAuthGuard extends AuthGuard('facebook') {
  constructor(private readonly config: ConfigService) {
    super({ session: false });
  }

  canActivate(context: ExecutionContext) {
    if (!this.config.get<string>('FACEBOOK_APP_ID') || !this.config.get<string>('FACEBOOK_APP_SECRET')) {
      const web = this.config.get<string>('WEB_APP_URL', 'http://localhost:3001');
      throw new OAuthRedirectException(`${web}/login?error=facebook_not_configured`);
    }
    return super.canActivate(context);
  }
}
