import { createHash } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '@astro/shared';
import { FreePreviewService as FreePreviewServiceKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SiteSettingsService } from '../notifications/site-settings.service';

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
    private readonly siteSettings: SiteSettingsService,
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

  private windowStart(hours: number): Date {
    return new Date(Date.now() - hours * 60 * 60 * 1000);
  }

  /** Count free previews for this browser session key inside the rolling window. */
  async countGuestUses(guestKey: string, since: Date): Promise<number> {
    return this.prisma.freePreviewLog.count({
      where: {
        guestKey,
        createdAt: { gte: since },
      },
    });
  }

  /**
   * Soft IP abuse cap (not a hard "1 forever" gate).
   * Allows shared NAT / office Wi‑Fi while blocking key-rotation spam.
   */
  async countIpUses(ipHash: string, since: Date): Promise<number> {
    return this.prisma.freePreviewLog.count({
      where: {
        ipHash,
        createdAt: { gte: since },
      },
    });
  }

  async getUsage(opts: {
    guestKey: string;
    ipHash?: string | null;
  }) {
    const freemium = await this.siteSettings.getFreemium();
    const since = this.windowStart(freemium.guestPreviewWindowHours);
    const used = await this.countGuestUses(opts.guestKey, since);
    const remaining = Math.max(0, freemium.guestPreviewLimit - used);
    const ipUsed = opts.ipHash ? await this.countIpUses(opts.ipHash, since) : 0;
    // Soft cap: same IP can burn through several browser sessions, not unlimited.
    const ipCap = freemium.guestPreviewLimit * 10;
    return {
      limit: freemium.guestPreviewLimit,
      windowHours: freemium.guestPreviewWindowHours,
      used,
      remaining,
      ipUsed,
      ipCap,
      ipBlocked: Boolean(opts.ipHash) && ipUsed >= ipCap,
    };
  }

  /**
   * Decide whether the caller may generate now.
   * - Active subscription → SUBSCRIPTION (caller must consumeQuota)
   * - Guest under limit in window → FREE_PREVIEW
   * - Guest at/over limit → LOGIN_REQUIRED
   * - Logged-in without active package → SUBSCRIPTION_REQUIRED
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

    const usage = await this.getUsage({ guestKey, ipHash });
    if (usage.remaining > 0 && !usage.ipBlocked) {
      return { mode: 'FREE_PREVIEW', guestKey };
    }

    throw new AppException(
      ErrorCodes.LOGIN_REQUIRED,
      `Free preview limit reached (${usage.limit} per visit). Please register or log in and buy a package.`,
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

    const usage = await this.getUsage({ guestKey, ipHash });
    const canUseFreePreview = !opts.userId && usage.remaining > 0 && !usage.ipBlocked;

    return {
      guestKey,
      limit: usage.limit,
      used: usage.used,
      remaining: usage.remaining,
      windowHours: usage.windowHours,
      hasUsedFreePreview: usage.remaining <= 0 || usage.ipBlocked,
      canUseFreePreview,
      hasActiveSubscription: hasSubscription,
    };
  }
}
