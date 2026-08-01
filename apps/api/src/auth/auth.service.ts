import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { ErrorCodes, buildPasswordChanged } from '@astro/shared';
import { AuthChallengePurpose, OAuthProvider, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './types/jwt-payload';
import { AuthChallengeService } from './auth-challenge.service';
import type { OAuthProfile } from './types/oauth-profile';
import { serializeCustomerProfile } from '../users/profile-serialize';
import { MailService } from '../notifications/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly challenges: AuthChallengeService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppException(
        ErrorCodes.EMAIL_ALREADY_REGISTERED,
        'Email is already registered',
        HttpStatus.CONFLICT,
      );
    }

    const saltRounds = Number(this.config.get('BCRYPT_SALT_ROUNDS', 10));
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        status: UserStatus.PENDING_VERIFICATION,
        profile: {
          create: {
            fullName: dto.fullName,
            mobileNumber: dto.mobileNumber,
            preferredLanguage: dto.preferredLanguage ?? 'en',
          },
        },
      },
      include: { profile: true },
    });

    await this.challenges.issue({
      email,
      userId: user.id,
      purpose: AuthChallengePurpose.EMAIL_VERIFY,
      fullName: dto.fullName,
    });

    return {
      requiresVerification: true as const,
      email,
      message: 'Check your email for a verification link.',
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: unknown }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { profile: true },
    });

    if (!user) {
      throw new AppException(
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status === UserStatus.BLOCKED || user.blockedAt) {
      throw new AppException(ErrorCodes.USER_BLOCKED, 'User account is blocked', HttpStatus.FORBIDDEN);
    }

    if (!user.passwordHash) {
      throw new AppException(
        ErrorCodes.SOCIAL_LOGIN_REQUIRED,
        'This account uses Google or Facebook sign-in',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new AppException(
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status === UserStatus.PENDING_VERIFICATION || !user.emailVerifiedAt) {
      throw new AppException(
        ErrorCodes.EMAIL_NOT_VERIFIED,
        'Email is not verified. Enter the OTP sent to your email.',
        HttpStatus.FORBIDDEN,
      );
    }

    const accessToken = await this.signToken(user.id, user.email, user.role);
    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ accessToken: string; user: unknown }> {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    if (!user) {
      throw new AppException(ErrorCodes.INVALID_OTP, 'Invalid verification code', HttpStatus.BAD_REQUEST);
    }

    const result = await this.challenges.consume({
      email,
      purpose: AuthChallengePurpose.EMAIL_VERIFY,
      code: dto.code,
    });
    if (!result.ok) {
      throw new AppException(
        result.reason === 'expired' ? ErrorCodes.OTP_EXPIRED : ErrorCodes.INVALID_OTP,
        result.reason === 'expired' ? 'Verification code has expired' : 'Invalid verification code',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
      include: { profile: true },
    });

    const accessToken = await this.signToken(updated.id, updated.email, updated.role);
    return {
      accessToken,
      user: this.sanitizeUser(updated),
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    // Always generic response to avoid account enumeration
    const generic = {
      ok: true as const,
      message: 'If the account needs verification, a new code was sent.',
    };

    if (!user || user.status === UserStatus.BLOCKED) {
      return generic;
    }

    if (user.emailVerifiedAt && user.status === UserStatus.ACTIVE) {
      return generic;
    }

    await this.challenges.issue({
      email,
      userId: user.id,
      purpose: AuthChallengePurpose.EMAIL_VERIFY,
      fullName: user.profile?.fullName ?? undefined,
    });

    return {
      ...generic,
      message: 'If the account needs verification, a new verification link was sent.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const generic = {
      ok: true as const,
      message: 'If an account exists, a password reset link was sent to your email.',
    };

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    if (!user || user.status === UserStatus.BLOCKED) {
      return generic;
    }

    await this.challenges.issue({
      email,
      userId: user.id,
      purpose: AuthChallengePurpose.PASSWORD_RESET,
      fullName: user.profile?.fullName ?? undefined,
    });

    return generic;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    if (!user) {
      throw new AppException(ErrorCodes.INVALID_OTP, 'Invalid or expired reset code', HttpStatus.BAD_REQUEST);
    }

    const result = await this.challenges.consume({
      email,
      purpose: AuthChallengePurpose.PASSWORD_RESET,
      code: dto.code,
    });
    if (!result.ok) {
      throw new AppException(
        result.reason === 'expired' ? ErrorCodes.OTP_EXPIRED : ErrorCodes.INVALID_OTP,
        result.reason === 'expired' ? 'Reset code has expired' : 'Invalid or expired reset code',
        HttpStatus.BAD_REQUEST,
      );
    }

    const saltRounds = Number(this.config.get('BCRYPT_SALT_ROUNDS', 10));
    const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        // Completing reset also confirms mailbox ownership
        status: user.status === UserStatus.BLOCKED ? user.status : UserStatus.ACTIVE,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    });

    await this.sendPasswordChangedMail(email, user.profile?.fullName);

    return { ok: true as const, message: 'Password updated. You can log in.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user?.passwordHash) {
      throw new AppException(
        ErrorCodes.SOCIAL_LOGIN_REQUIRED,
        'Password change is not available for social-only accounts',
        HttpStatus.BAD_REQUEST,
      );
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppException(
        ErrorCodes.INVALID_CREDENTIALS,
        'Current password is incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const saltRounds = Number(this.config.get('BCRYPT_SALT_ROUNDS', 10));
    const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await this.sendPasswordChangedMail(user.email, user.profile?.fullName);
    return { ok: true as const, message: 'Password updated.' };
  }

  private async sendPasswordChangedMail(email: string, fullName?: string | null) {
    const built = buildPasswordChanged({ fullName: fullName ?? undefined });
    await this.mail.send({
      to: email,
      subject: built.subject,
      text: built.text,
      html: built.html,
    });
  }

  async loginWithOAuth(profile: OAuthProfile): Promise<{ accessToken: string; user: unknown }> {
    const email = profile.email.toLowerCase();
    const provider = profile.provider as OAuthProvider;

    const linked = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId: profile.providerUserId,
        },
      },
      include: { user: { include: { profile: true } } },
    });

    if (linked) {
      if (linked.user.status === UserStatus.BLOCKED || linked.user.blockedAt) {
        throw new AppException(ErrorCodes.USER_BLOCKED, 'User account is blocked', HttpStatus.FORBIDDEN);
      }
      const accessToken = await this.signToken(linked.user.id, linked.user.email, linked.user.role);
      return { accessToken, user: this.sanitizeUser(linked.user) };
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (user) {
      if (user.status === UserStatus.BLOCKED || user.blockedAt) {
        throw new AppException(ErrorCodes.USER_BLOCKED, 'User account is blocked', HttpStatus.FORBIDDEN);
      }

      await this.prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider,
          providerUserId: profile.providerUserId,
          email,
        },
      });

      if (user.status !== UserStatus.ACTIVE || !user.emailVerifiedAt) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            status: UserStatus.ACTIVE,
            emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          },
          include: { profile: true },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: null,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
          profile: {
            create: {
              fullName: profile.fullName || email.split('@')[0],
              preferredLanguage: 'en',
            },
          },
          oauthAccounts: {
            create: {
              provider,
              providerUserId: profile.providerUserId,
              email,
            },
          },
        },
        include: { profile: true },
      });
    }

    const accessToken = await this.signToken(user.id, user.email, user.role);
    return { accessToken, user: this.sanitizeUser(user) };
  }

  webAppUrl(): string {
    return this.config.get<string>('WEB_APP_URL', 'http://localhost:3001');
  }

  private async signToken(userId: string, email: string, role: string): Promise<string> {
    const payload: JwtPayload = { sub: userId, email, role };
    const expiresIn = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '1d');
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: expiresIn as `${number}d` | `${number}h` | `${number}m` | `${number}s`,
    });
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: Date;
    emailVerifiedAt?: Date | null;
    hasUsedFreePreview?: boolean;
    profile: Parameters<typeof serializeCustomerProfile>[0];
  }): unknown {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      createdAt: user.createdAt,
      hasUsedFreePreview: Boolean(user.hasUsedFreePreview),
      profile: serializeCustomerProfile(user.profile),
    };
  }
}
