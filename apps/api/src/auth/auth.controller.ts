import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FacebookOAuthGuard, GoogleOAuthGuard } from './oauth.guards';
import type { OAuthProfile } from './types/oauth-profile';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.sub, dto);
  }

  @Get('providers')
  providers() {
    return {
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      facebook: Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    };
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleAuth() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.finishOAuth(req, res);
  }

  @Get('facebook')
  @UseGuards(FacebookOAuthGuard)
  facebookAuth() {
    // Passport redirects to Facebook
  }

  @Get('facebook/callback')
  @UseGuards(FacebookOAuthGuard)
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    return this.finishOAuth(req, res);
  }

  private async finishOAuth(req: Request, res: Response) {
    const web = this.authService.webAppUrl();
    try {
      const profile = req.user as OAuthProfile;
      if (!profile?.email) {
        res.redirect(`${web}/login?error=oauth_email_required`);
        return;
      }
      const session = await this.authService.loginWithOAuth(profile);
      const url = new URL('/auth/callback', web);
      url.searchParams.set('accessToken', session.accessToken);
      res.redirect(url.toString());
    } catch {
      res.redirect(`${web}/login?error=oauth_failed`);
    }
  }
}
