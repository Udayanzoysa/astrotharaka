import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '@astro/shared';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';

export type QuotaKind = 'BABY_NAMES' | 'PORONDAM' | 'HOROSCOPE' | 'DREAM_INTERPRETATION';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  serializePackage(pkg: {
    id: string;
    code: string;
    nameEn: string;
    nameSi: string | null;
    nameTa: string | null;
    descriptionEn: string | null;
    descriptionSi: string | null;
    descriptionTa: string | null;
    priceLkr: Prisma.Decimal | number | string;
    babyNamesQuota: number;
    porondamQuota: number;
    horoscopeQuota: number;
    dreamInterpretationQuota: number;
    durationDays: number;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: pkg.id,
      code: pkg.code,
      nameEn: pkg.nameEn,
      nameSi: pkg.nameSi,
      nameTa: pkg.nameTa,
      descriptionEn: pkg.descriptionEn,
      descriptionSi: pkg.descriptionSi,
      descriptionTa: pkg.descriptionTa,
      priceLkr: Number(pkg.priceLkr),
      babyNamesQuota: pkg.babyNamesQuota,
      porondamQuota: pkg.porondamQuota,
      horoscopeQuota: pkg.horoscopeQuota,
      dreamInterpretationQuota: pkg.dreamInterpretationQuota,
      durationDays: pkg.durationDays,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    };
  }

  serializeSubscription(
    sub: {
      id: string;
      userId: string;
      packageId: string;
      packageCode: string;
      packageNameEn: string;
      packageNameSi: string | null;
      priceLkr: Prisma.Decimal | number | string;
      babyNamesQuota: number;
      porondamQuota: number;
      horoscopeQuota: number;
      dreamInterpretationQuota: number;
      durationDays: number;
      startAt: Date;
      expiresAt: Date;
      status: SubscriptionStatus;
      paymentRef: string | null;
      createdAt: Date;
      usage: {
        babyNamesUsed: number;
        porondamUsed: number;
        horoscopeUsed: number;
        dreamInterpretationUsed: number;
        monthCycle: string;
      } | null;
    },
  ) {
    const babyUsed = sub.usage?.babyNamesUsed ?? 0;
    const porUsed = sub.usage?.porondamUsed ?? 0;
    const horUsed = sub.usage?.horoscopeUsed ?? 0;
    const dreamUsed = sub.usage?.dreamInterpretationUsed ?? 0;
    return {
      id: sub.id,
      userId: sub.userId,
      packageId: sub.packageId,
      packageCode: sub.packageCode,
      packageNameEn: sub.packageNameEn,
      packageNameSi: sub.packageNameSi,
      priceLkr: Number(sub.priceLkr),
      babyNamesQuota: sub.babyNamesQuota,
      porondamQuota: sub.porondamQuota,
      horoscopeQuota: sub.horoscopeQuota,
      dreamInterpretationQuota: sub.dreamInterpretationQuota,
      babyNamesUsed: babyUsed,
      porondamUsed: porUsed,
      horoscopeUsed: horUsed,
      dreamInterpretationUsed: dreamUsed,
      babyNamesRemaining: Math.max(0, sub.babyNamesQuota - babyUsed),
      porondamRemaining: Math.max(0, sub.porondamQuota - porUsed),
      horoscopeRemaining: Math.max(0, sub.horoscopeQuota - horUsed),
      dreamInterpretationRemaining: Math.max(0, sub.dreamInterpretationQuota - dreamUsed),
      durationDays: sub.durationDays,
      startAt: sub.startAt.toISOString(),
      expiresAt: sub.expiresAt.toISOString(),
      status: sub.status,
      paymentRef: sub.paymentRef,
      monthCycle: sub.usage?.monthCycle ?? null,
      createdAt: sub.createdAt.toISOString(),
    };
  }

  async listPublicPackages() {
    const items = await this.prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return items.map((p) => this.serializePackage(p));
  }

  async listAllPackages() {
    const items = await this.prisma.subscriptionPackage.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return items.map((p) => this.serializePackage(p));
  }

  async getPackage(id: string) {
    const pkg = await this.prisma.subscriptionPackage.findUnique({ where: { id } });
    if (!pkg) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Package not found', HttpStatus.NOT_FOUND);
    }
    return this.serializePackage(pkg);
  }

  async createPackage(data: {
    code: string;
    nameEn: string;
    nameSi?: string;
    nameTa?: string;
    descriptionEn?: string;
    descriptionSi?: string;
    descriptionTa?: string;
    priceLkr: number;
    babyNamesQuota: number;
    porondamQuota: number;
    horoscopeQuota: number;
    dreamInterpretationQuota: number;
    durationDays?: number;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const existing = await this.prisma.subscriptionPackage.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new AppException(ErrorCodes.CONFLICT, 'Package code already exists', HttpStatus.CONFLICT);
    }
    const pkg = await this.prisma.subscriptionPackage.create({
      data: {
        code: data.code,
        nameEn: data.nameEn,
        nameSi: data.nameSi ?? null,
        nameTa: data.nameTa ?? null,
        descriptionEn: data.descriptionEn ?? null,
        descriptionSi: data.descriptionSi ?? null,
        descriptionTa: data.descriptionTa ?? null,
        priceLkr: data.priceLkr,
        babyNamesQuota: data.babyNamesQuota,
        porondamQuota: data.porondamQuota,
        horoscopeQuota: data.horoscopeQuota,
        dreamInterpretationQuota: data.dreamInterpretationQuota,
        durationDays: data.durationDays ?? 30,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    return this.serializePackage(pkg);
  }

  async updatePackage(
    id: string,
    data: {
      code?: string;
      nameEn?: string;
      nameSi?: string | null;
      nameTa?: string | null;
      descriptionEn?: string | null;
      descriptionSi?: string | null;
      descriptionTa?: string | null;
      priceLkr?: number;
      babyNamesQuota?: number;
      porondamQuota?: number;
      horoscopeQuota?: number;
      dreamInterpretationQuota?: number;
      durationDays?: number;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    const existing = await this.prisma.subscriptionPackage.findUnique({ where: { id } });
    if (!existing) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Package not found', HttpStatus.NOT_FOUND);
    }
    if (data.code && data.code !== existing.code) {
      const clash = await this.prisma.subscriptionPackage.findUnique({
        where: { code: data.code },
      });
      if (clash) {
        throw new AppException(ErrorCodes.CONFLICT, 'Package code already exists', HttpStatus.CONFLICT);
      }
    }
    const pkg = await this.prisma.subscriptionPackage.update({
      where: { id },
      data: {
        code: data.code ?? existing.code,
        nameEn: data.nameEn ?? existing.nameEn,
        nameSi: data.nameSi === undefined ? existing.nameSi : data.nameSi,
        nameTa: data.nameTa === undefined ? existing.nameTa : data.nameTa,
        descriptionEn:
          data.descriptionEn === undefined ? existing.descriptionEn : data.descriptionEn,
        descriptionSi:
          data.descriptionSi === undefined ? existing.descriptionSi : data.descriptionSi,
        descriptionTa:
          data.descriptionTa === undefined ? existing.descriptionTa : data.descriptionTa,
        priceLkr: data.priceLkr ?? existing.priceLkr,
        babyNamesQuota: data.babyNamesQuota ?? existing.babyNamesQuota,
        porondamQuota: data.porondamQuota ?? existing.porondamQuota,
        horoscopeQuota: data.horoscopeQuota ?? existing.horoscopeQuota,
        dreamInterpretationQuota:
          data.dreamInterpretationQuota ?? existing.dreamInterpretationQuota,
        durationDays: data.durationDays ?? existing.durationDays,
        isActive: data.isActive ?? existing.isActive,
        sortOrder: data.sortOrder ?? existing.sortOrder,
      },
    });
    return this.serializePackage(pkg);
  }

  /** Soft-delete: deactivate so historical subscriptions stay valid. */
  async deactivatePackage(id: string) {
    const pkg = await this.prisma.subscriptionPackage.findUnique({ where: { id } });
    if (!pkg) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Package not found', HttpStatus.NOT_FOUND);
    }
    const updated = await this.prisma.subscriptionPackage.update({
      where: { id },
      data: { isActive: false },
    });
    return this.serializePackage(updated);
  }

  /** Expire any past-due ACTIVE subscriptions for a user (or globally if no userId). */
  async expireDueSubscriptions(userId?: string) {
    const now = new Date();
    await this.prisma.userSubscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { lt: now },
        ...(userId ? { userId } : {}),
      },
      data: { status: SubscriptionStatus.EXPIRED },
    });
  }

  async getActiveSubscription(userId: string) {
    await this.expireDueSubscriptions(userId);
    return this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      include: { usage: true },
      orderBy: { expiresAt: 'desc' },
    });
  }

  async getMySubscription(userId: string) {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) return null;
    return this.serializeSubscription(sub);
  }

  async subscribe(userId: string, packageId: string, paymentRef = 'ADMIN_ASSIGN') {
    const pkg = await this.prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Package not available', HttpStatus.NOT_FOUND);
    }

    const existing = await this.getActiveSubscription(userId);
    if (existing) {
      await this.prisma.userSubscription.update({
        where: { id: existing.id },
        data: { status: SubscriptionStatus.CANCELLED },
      });
    }

    const startAt = new Date();
    const expiresAt = new Date(startAt);
    expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);
    const monthCycle = `${startAt.toISOString().slice(0, 10)}_${expiresAt.toISOString().slice(0, 10)}`;

    const sub = await this.prisma.userSubscription.create({
      data: {
        userId,
        packageId: pkg.id,
        packageCode: pkg.code,
        packageNameEn: pkg.nameEn,
        packageNameSi: pkg.nameSi,
        priceLkr: pkg.priceLkr,
        babyNamesQuota: pkg.babyNamesQuota,
        porondamQuota: pkg.porondamQuota,
        horoscopeQuota: pkg.horoscopeQuota,
        dreamInterpretationQuota: pkg.dreamInterpretationQuota,
        durationDays: pkg.durationDays,
        startAt,
        expiresAt,
        status: SubscriptionStatus.ACTIVE,
        paymentRef,
        usage: {
          create: {
            userId,
            babyNamesUsed: 0,
            porondamUsed: 0,
            horoscopeUsed: 0,
            dreamInterpretationUsed: 0,
            monthCycle,
          },
        },
      },
      include: { usage: true },
    });

    return this.serializeSubscription(sub);
  }

  /**
   * Verify active subscription + remaining quota, then increment usage by 1.
   * Call before generating baby names / porondam / horoscope / dream interpretation.
   */
  async consumeQuota(userId: string, service: QuotaKind) {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) {
      throw new AppException(
        ErrorCodes.SUBSCRIPTION_REQUIRED,
        'Active monthly subscription required',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    if (!sub.usage) {
      throw new AppException(
        ErrorCodes.INTERNAL_ERROR,
        'Subscription usage record missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const usedKey =
      service === 'BABY_NAMES'
        ? 'babyNamesUsed'
        : service === 'PORONDAM'
          ? 'porondamUsed'
          : service === 'DREAM_INTERPRETATION'
            ? 'dreamInterpretationUsed'
            : 'horoscopeUsed';
    const quotaKey =
      service === 'BABY_NAMES'
        ? 'babyNamesQuota'
        : service === 'PORONDAM'
          ? 'porondamQuota'
          : service === 'DREAM_INTERPRETATION'
            ? 'dreamInterpretationQuota'
            : 'horoscopeQuota';

    const used = sub.usage[usedKey];
    const quota = sub[quotaKey];
    if (used >= quota) {
      throw new AppException(
        ErrorCodes.QUOTA_EXCEEDED,
        `${service} monthly quota exhausted — upgrade or renew`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    await this.prisma.subscriptionUsage.update({
      where: { id: sub.usage.id },
      data: { [usedKey]: used + 1 },
    });

    return this.getMySubscription(userId);
  }

  /** Admin: list recent subscriptions */
  async listSubscriptions(take = 50) {
    await this.expireDueSubscriptions();
    const items = await this.prisma.userSubscription.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: { usage: true, user: { select: { email: true } } },
    });
    return items.map((s) => ({
      ...this.serializeSubscription(s),
      userEmail: s.user.email,
    }));
  }
}
