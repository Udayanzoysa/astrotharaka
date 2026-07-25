import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AuthChallengeService } from './auth-challenge.service';
import { GoogleStrategy } from './google.strategy';
import { FacebookStrategy } from './facebook.strategy';
import { FacebookOAuthGuard, GoogleOAuthGuard } from './oauth.guards';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({}),
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthChallengeService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    GoogleOAuthGuard,
    FacebookOAuthGuard,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
