import { createHash, randomInt } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthChallengePurpose } from '@prisma/client';
import { buildEmailVerify, buildPasswordReset } from '@astro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../notifications/mail.service';

@Injectable()
export class AuthChallengeService {
  private readonly logger = new Logger(AuthChallengeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  generateCode(): string {
    return String(randomInt(100000, 999999));
  }

  hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  ttlMinutes(): number {
    return Number(this.config.get('OTP_TTL_MINUTES', 15));
  }

  returnDevCode(): boolean {
    // Never leak OTPs in production, even if misconfigured.
    if ((this.config.get('NODE_ENV', 'development') ?? '').toLowerCase() === 'production') {
      return false;
    }
    return this.config.get<string>('OTP_RETURN_IN_RESPONSE', '') === 'true';
  }

  async issue(input: {
    email: string;
    userId?: string;
    purpose: AuthChallengePurpose;
    fullName?: string;
  }): Promise<{ code: string; expiresAt: Date }> {
    const email = input.email.toLowerCase();
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.ttlMinutes() * 60_000);

    await this.prisma.authChallenge.updateMany({
      where: {
        email,
        purpose: input.purpose,
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    await this.prisma.authChallenge.create({
      data: {
        email,
        userId: input.userId,
        purpose: input.purpose,
        codeHash: this.hashCode(code),
        expiresAt,
      },
    });

    await this.deliverCode({
      email,
      code,
      purpose: input.purpose,
      expiresAt,
      fullName: input.fullName,
    });

    return { code, expiresAt };
  }

  async consume(input: {
    email: string;
    purpose: AuthChallengePurpose;
    code: string;
    maxAttempts?: number;
  }): Promise<{ ok: true } | { ok: false; reason: 'invalid' | 'expired' }> {
    const email = input.email.toLowerCase();
    const challenge = await this.prisma.authChallenge.findFirst({
      where: {
        email,
        purpose: input.purpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      return { ok: false, reason: 'invalid' };
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      return { ok: false, reason: 'expired' };
    }

    const maxAttempts = input.maxAttempts ?? 5;
    if (challenge.attempts >= maxAttempts) {
      return { ok: false, reason: 'invalid' };
    }

    const match = challenge.codeHash === this.hashCode(input.code.trim());
    await this.prisma.authChallenge.update({
      where: { id: challenge.id },
      data: {
        attempts: { increment: 1 },
        consumedAt: match ? new Date() : undefined,
      },
    });

    if (!match) {
      return { ok: false, reason: 'invalid' };
    }
    return { ok: true };
  }

  private async deliverCode(input: {
    email: string;
    code: string;
    purpose: AuthChallengePurpose;
    expiresAt: Date;
    fullName?: string;
  }): Promise<void> {
    let verificationLink: string | undefined;

    if (input.purpose === AuthChallengePurpose.EMAIL_VERIFY) {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'VERIFICATION_METHOD' },
      });
      const verificationMethod = setting?.value || 'EMAIL';

      if (verificationMethod === 'EMAIL') {
        const webAppUrl = this.config.get<string>('WEB_APP_URL') || 'http://localhost:3001';
        verificationLink = `${webAppUrl}/verify-email?email=${encodeURIComponent(
          input.email,
        )}&code=${input.code}`;
      }
    }

    const built =
      input.purpose === AuthChallengePurpose.EMAIL_VERIFY
        ? buildEmailVerify({
            fullName: input.fullName,
            code: input.code,
            expiresMinutes: this.ttlMinutes(),
            verificationLink,
          })
        : buildPasswordReset({
            fullName: input.fullName,
            code: input.code,
            expiresMinutes: this.ttlMinutes(),
          });

    const result = await this.mail.send({
      to: input.email,
      subject: built.subject,
      text: built.text,
      html: built.html,
    });
    this.logger.log(
      `OTP email purpose=${input.purpose} to=${input.email} provider=${result.provider}`,
    );
  }
}
