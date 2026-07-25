import { createHash } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '@astro/shared';
import { FreePreviewService as FreePreviewServiceKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

export type AccessMode = 'FREE_PREVIEW' | 'SUBSCRIPTION';

export type AuthorizeResult = {
  mode: AccessMode;
  guestKey: string;
};

@Injectable()
export class FreePreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  hashIp(ip: string | null | undefined): string | null {
    const normalized = (ip ?? '').trim();
    if (!normalized) return null;
    return createHash('sha256').update(normalized).digest('hex').slice(0, 32);
  }

  /**
   * Require a stable client guest key. Do not mint a new UUID when missing —
   * that would allow unlimited free previews by omitting the header.
   */
  normalizeGuestKey(raw: string | null | undefined): string {
    const value = (raw ?? '').trim();
    if (value && /^[a-zA-Z0-9_-]{8,64}$/.test(value)) return value;
    throw new AppException(
      ErrorCodes.VALIDATION_FAILED,
      'Missing or invalid guest key. Refresh the page and try again.',
      HttpStatus.BAD_REQUEST,
    );
  }

  async hasUsedPreview(opts: {
    userId?: string | null;
    guestKey?: string | null;
    ipHash?: string | null;
  }): Promise<boolean> {
    if (opts.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: opts.userId },
        select: { hasUsedFreePreview: true },
      });
      if (user?.hasUsedFreePreview) return true;
    }

    const or: Array<{ guestKey?: string; ipHash?: string; userId?: string }> = [];
    if (opts.guestKey) or.push({ guestKey: opts.guestKey });
    if (opts.ipHash) or.push({ ipHash: opts.ipHash });
    if (opts.userId) or.push({ userId: opts.userId });
    if (or.length === 0) return false;

    const existing = await this.prisma.freePreviewLog.findFirst({ where: { OR: or } });
    return Boolean(existing);
  }

  /**
   * Decide whether the caller may generate now.
   * - Active subscription → SUBSCRIPTION (caller must consumeQuota)
   * - Guest never used free preview → FREE_PREVIEW
   * - Guest already used → LOGIN_REQUIRED (register + buy package)
   * - Logged-in without active package → SUBSCRIPTION_REQUIRED (must buy)
   */
  async authorize(opts: {
    userId?: string | null;
    guestKeyRaw?: string | null;
    ip?: string | null;
    service: FreePreviewServiceKind;
  }): Promise<AuthorizeResult> {
    const guestKey = this.normalizeGuestKey(opts.guestKeyRaw);
    const ipHash = this.hashIp(opts.ip);
    const userId = opts.userId ?? null;

    // Registered users must have an active paid package — no free teaser on accounts
    if (userId) {
      const sub = await this.subscriptions.getActiveSubscription(userId);
      if (sub) {
        return { mode: 'SUBSCRIPTION', guestKey };
      }

      throw new AppException(
        ErrorCodes.SUBSCRIPTION_REQUIRED,
        'Please purchase a package to view full reports',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const used = await this.hasUsedPreview({ guestKey, ipHash });
    if (!used) {
      return { mode: 'FREE_PREVIEW', guestKey };
    }

    throw new AppException(
      ErrorCodes.LOGIN_REQUIRED,
      'Free preview already used. Please register or log in and buy a package.',
      HttpStatus.FORBIDDEN,
    );
  }

  async claimFreePreview(opts: {
    userId?: string | null;
    guestKey: string;
    ip?: string | null;
    service: FreePreviewServiceKind;
  }): Promise<void> {
    const ipHash = this.hashIp(opts.ip);
    await this.prisma.freePreviewLog.create({
      data: {
        userId: opts.userId ?? null,
        guestKey: opts.guestKey,
        ipHash,
        service: opts.service,
      },
    });

    if (opts.userId) {
      await this.prisma.user.update({
        where: { id: opts.userId },
        data: { hasUsedFreePreview: true },
      });
    }
  }

  async getStatus(opts: {
    userId?: string | null;
    guestKeyRaw?: string | null;
    ip?: string | null;
  }) {
    const guestKey = this.normalizeGuestKey(opts.guestKeyRaw);
    const ipHash = this.hashIp(opts.ip);
    let hasSubscription = false;
    if (opts.userId) {
      hasSubscription = Boolean(await this.subscriptions.getActiveSubscription(opts.userId));
    }
    // Guests only get the one-time free preview; accounts require a package.
    const guestUsed = await this.hasUsedPreview({ guestKey, ipHash });
    return {
      guestKey,
      hasUsedFreePreview: guestUsed,
      canUseFreePreview: !opts.userId && !guestUsed,
      hasActiveSubscription: hasSubscription,
    };
  }
}
