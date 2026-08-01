import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SubscriptionCheckoutStatus,
} from '@prisma/client';
import { ErrorCodes } from '@astro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { assertDevPaymentsAllowed } from '../common/runtime-flags';
import { PayHereService } from '../payments/payhere.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { saveBankSlipFile, resolveBankSlipPath } from '../orders/bank-slip-storage';
import { StartPaymentDto } from '../orders/dto/start-payment.dto';
import { SubscriptionsService } from './subscriptions.service';
import { createReadStream, existsSync } from 'fs';
import { StreamableFile } from '@nestjs/common';

@Injectable()
export class SubscriptionCheckoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly payHere: PayHereService,
    private readonly bankAccounts: BankAccountsService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async createCheckout(userId: string, packageId: string) {
    const pkg = await this.prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Package not available', HttpStatus.NOT_FOUND);
    }

    const pending = await this.prisma.subscriptionCheckout.findFirst({
      where: {
        userId,
        packageId,
        status: { in: [SubscriptionCheckoutStatus.AWAITING_PAYMENT, SubscriptionCheckoutStatus.PAYMENT_UNDER_REVIEW] },
      },
      include: { payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (pending) {
      return this.serializeCheckout(pending);
    }

    const checkout = await this.prisma.subscriptionCheckout.create({
      data: {
        checkoutNumber: this.nextCheckoutNumber(),
        userId,
        packageId: pkg.id,
        packageCode: pkg.code,
        packageNameEn: pkg.nameEn,
        priceLkr: pkg.priceLkr,
        currency: 'LKR',
        status: SubscriptionCheckoutStatus.AWAITING_PAYMENT,
      },
      include: { payments: true },
    });

    return this.serializeCheckout(checkout);
  }

  async getCheckout(userId: string, checkoutId: string) {
    const checkout = await this.findOwned(userId, checkoutId);
    return this.serializeCheckout(checkout);
  }

  async startPayment(userId: string, checkoutId: string, dto: StartPaymentDto) {
    if (dto.method === PaymentMethod.DEV_CONFIRM) {
      assertDevPaymentsAllowed('DEV_CONFIRM subscription payment');
    }

    const checkout = await this.findOwned(userId, checkoutId);

    if (
      checkout.status !== SubscriptionCheckoutStatus.AWAITING_PAYMENT &&
      checkout.status !== SubscriptionCheckoutStatus.PAYMENT_UNDER_REVIEW
    ) {
      throw new AppException(
        ErrorCodes.INVALID_ORDER_STATE,
        `Cannot pay checkout in status ${checkout.status}`,
        HttpStatus.CONFLICT,
      );
    }

    let bankSlipUrl = dto.bankSlipUrl?.trim() || null;
    let providerRef =
      dto.method === PaymentMethod.PAYHERE
        ? `payhere-${randomUUID()}`
        : dto.providerRef?.trim() || null;
    let bankAccountId: string | null = dto.bankAccountId ?? null;

    if (dto.method === PaymentMethod.BANK_TRANSFER) {
      if (!providerRef || providerRef.length < 3) {
        throw new AppException(
          ErrorCodes.VALIDATION_FAILED,
          'Bank transfer reference number is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!bankAccountId) {
        throw new AppException(
          ErrorCodes.VALIDATION_FAILED,
          'Please select the bank account you transferred to',
          HttpStatus.BAD_REQUEST,
        );
      }
      const bank = await this.prisma.bankAccount.findFirst({
        where: { id: bankAccountId, isActive: true },
      });
      if (!bank) {
        throw new AppException(
          ErrorCodes.NOT_FOUND,
          'Selected bank account is not available',
          HttpStatus.NOT_FOUND,
        );
      }
      if (dto.slipBase64?.trim()) {
        try {
          const raw = dto.slipBase64.includes(',')
            ? dto.slipBase64.split(',').pop()!
            : dto.slipBase64;
          const buffer = Buffer.from(raw, 'base64');
          bankSlipUrl = saveBankSlipFile({
            originalname: dto.slipFileName || 'slip.pdf',
            mimetype: dto.slipMimeType || 'application/pdf',
            size: buffer.length,
            buffer,
          });
        } catch (err) {
          throw new AppException(
            ErrorCodes.VALIDATION_FAILED,
            err instanceof Error ? err.message : 'Invalid bank slip',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      if (!bankSlipUrl) {
        throw new AppException(
          ErrorCodes.VALIDATION_FAILED,
          'Please attach your bank transfer slip',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const idempotencyKey =
      dto.idempotencyKey ??
      `subpay-${checkoutId}-${dto.method}-${providerRef ?? 'x'}-${Date.now()}`;

    const existing = await this.prisma.subscriptionPayment.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      const refreshed = await this.findOwned(userId, checkoutId);
      return {
        payment: this.serializePayment(existing),
        checkout: this.serializeCheckout(refreshed),
        checkoutResult: await this.buildCheckout(dto.method, existing.id, refreshed),
      };
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.subscriptionPayment.create({
        data: {
          checkoutId: checkout.id,
          method: dto.method,
          status:
            dto.method === PaymentMethod.BANK_TRANSFER
              ? PaymentStatus.UNDER_REVIEW
              : PaymentStatus.PENDING,
          amount: checkout.priceLkr,
          currency: checkout.currency,
          bankSlipUrl,
          providerRef,
          bankAccountId,
          idempotencyKey,
        },
      });

      if (dto.method === PaymentMethod.BANK_TRANSFER) {
        await tx.subscriptionCheckout.update({
          where: { id: checkout.id },
          data: { status: SubscriptionCheckoutStatus.PAYMENT_UNDER_REVIEW },
        });
      }

      return created;
    });

    if (dto.method === PaymentMethod.DEV_CONFIRM) {
      await this.confirmPaymentInternal(checkout.id, payment.id);
      const refreshed = await this.findOwned(userId, checkoutId);
      return {
        payment: this.serializePayment(
          refreshed.payments.find((p) => p.id === payment.id) ?? payment,
        ),
        checkout: this.serializeCheckout(refreshed),
        checkoutResult: { type: 'dev_confirmed' as const },
      };
    }

    const refreshed = await this.findOwned(userId, checkoutId);
    return {
      payment: this.serializePayment(payment),
      checkout: this.serializeCheckout(refreshed),
      checkoutResult: await this.buildCheckout(dto.method, payment.id, refreshed),
    };
  }

  async confirmPayHereWebhook(input: { checkoutId: string; paymentId?: string }) {
    const checkout = await this.prisma.subscriptionCheckout.findUnique({
      where: { id: input.checkoutId },
      include: { payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!checkout) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Subscription checkout not found', HttpStatus.NOT_FOUND);
    }

    if (
      checkout.status === SubscriptionCheckoutStatus.ACTIVATED ||
      checkout.status === SubscriptionCheckoutStatus.PAID
    ) {
      return { status: 'already_processed' as const };
    }

    const payment =
      checkout.payments.find(
        (p) => p.method === PaymentMethod.PAYHERE && p.status === PaymentStatus.PENDING,
      ) ?? checkout.payments[0];

    if (!payment) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'No pending payment found', HttpStatus.NOT_FOUND);
    }

    await this.confirmPaymentInternal(checkout.id, payment.id, input.paymentId);
    return { status: 'ok' as const };
  }

  async adminList(status?: SubscriptionCheckoutStatus, q?: string) {
    const where: Prisma.SubscriptionCheckoutWhereInput = {};
    if (status) where.status = status;
    if (q?.trim()) {
      const term = q.trim();
      where.OR = [
        { checkoutNumber: { contains: term, mode: 'insensitive' } },
        { packageCode: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { profile: { fullName: { contains: term, mode: 'insensitive' } } } },
        { user: { profile: { mobileNumber: { contains: term, mode: 'insensitive' } } } },
        { user: { profile: { whatsappNumber: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const items = await this.prisma.subscriptionCheckout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        payments: { orderBy: { createdAt: 'desc' }, include: { bankAccount: true } },
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true, mobileNumber: true, whatsappNumber: true } },
          },
        },
        package: { select: { code: true, nameEn: true } },
      },
    });

    return items.map((c) => this.serializeCheckout(c));
  }

  async adminGetOne(checkoutId: string) {
    const checkout = await this.prisma.subscriptionCheckout.findUnique({
      where: { id: checkoutId },
      include: {
        payments: { orderBy: { createdAt: 'desc' }, include: { bankAccount: true } },
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true, mobileNumber: true, whatsappNumber: true } },
          },
        },
        package: true,
        subscription: true,
      },
    });
    if (!checkout) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Checkout not found', HttpStatus.NOT_FOUND);
    }
    return this.serializeCheckout(checkout);
  }

  /** Admin: approve bank transfer and activate subscription. */
  async adminConfirm(checkoutId: string) {
    const checkout = await this.prisma.subscriptionCheckout.findUnique({
      where: { id: checkoutId },
      include: { payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!checkout) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Checkout not found', HttpStatus.NOT_FOUND);
    }
    if (
      checkout.status !== SubscriptionCheckoutStatus.AWAITING_PAYMENT &&
      checkout.status !== SubscriptionCheckoutStatus.PAYMENT_UNDER_REVIEW
    ) {
      throw new AppException(
        ErrorCodes.INVALID_ORDER_STATE,
        `Cannot confirm checkout in status ${checkout.status}`,
        HttpStatus.CONFLICT,
      );
    }

    const payment =
      checkout.payments.find((p) => p.status === PaymentStatus.UNDER_REVIEW) ??
      checkout.payments.find((p) => p.status === PaymentStatus.PENDING) ??
      checkout.payments[0];

    if (!payment) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'No pending payment found', HttpStatus.NOT_FOUND);
    }

    await this.confirmPaymentInternal(checkout.id, payment.id);
    return this.adminGetOne(checkoutId);
  }

  /** Admin: submit bank transfer on behalf of a user. */
  async adminSubmitBankPayment(
    checkoutId: string,
    dto: StartPaymentDto & { userId?: string },
  ) {
    const checkout = await this.prisma.subscriptionCheckout.findUnique({
      where: { id: checkoutId },
    });
    if (!checkout) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Checkout not found', HttpStatus.NOT_FOUND);
    }
    return this.startPayment(checkout.userId, checkoutId, {
      ...dto,
      method: PaymentMethod.BANK_TRANSFER,
    });
  }

  async adminGetBankSlip(checkoutId: string, paymentId: string) {
    const payment = await this.prisma.subscriptionPayment.findFirst({
      where: { id: paymentId, checkoutId },
    });
    if (!payment?.bankSlipUrl) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Bank slip not found', HttpStatus.NOT_FOUND);
    }
    return this.openBankSlip(payment.bankSlipUrl);
  }

  async adminReject(checkoutId: string) {
    const checkout = await this.prisma.subscriptionCheckout.findUnique({
      where: { id: checkoutId },
      include: { payments: true },
    });
    if (!checkout) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Checkout not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.$transaction([
      this.prisma.subscriptionPayment.updateMany({
        where: { checkoutId, status: { in: [PaymentStatus.PENDING, PaymentStatus.UNDER_REVIEW] } },
        data: { status: PaymentStatus.REJECTED },
      }),
      this.prisma.subscriptionCheckout.update({
        where: { id: checkoutId },
        data: { status: SubscriptionCheckoutStatus.CANCELLED },
      }),
    ]);
    return this.adminGetOne(checkoutId);
  }

  private async confirmPaymentInternal(
    checkoutId: string,
    paymentId: string,
    payhereRef?: string,
  ) {
    const checkout = await this.prisma.subscriptionCheckout.findUnique({
      where: { id: checkoutId },
      include: { payments: true },
    });
    if (!checkout) return;

    if (checkout.status === SubscriptionCheckoutStatus.ACTIVATED) return;

    await this.prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.CONFIRMED,
        confirmedAt: new Date(),
        ...(payhereRef ? { providerRef: payhereRef } : {}),
      },
    });

    await this.prisma.subscriptionCheckout.update({
      where: { id: checkoutId },
      data: { status: SubscriptionCheckoutStatus.PAID, paidAt: new Date() },
    });

    const paymentRef =
      checkout.payments.find((p) => p.id === paymentId)?.method === PaymentMethod.PAYHERE
        ? 'PAYHERE'
        : 'BANK_TRANSFER';

    const sub = await this.subscriptions.subscribe(
      checkout.userId,
      checkout.packageId,
      paymentRef,
    );

    await this.prisma.subscriptionCheckout.update({
      where: { id: checkoutId },
      data: {
        status: SubscriptionCheckoutStatus.ACTIVATED,
        activatedAt: new Date(),
        userSubscriptionId: sub.id,
      },
    });
  }

  private async findOwned(userId: string, checkoutId: string) {
    const checkout = await this.prisma.subscriptionCheckout.findFirst({
      where: { id: checkoutId, userId },
      include: {
        payments: { orderBy: { createdAt: 'desc' }, include: { bankAccount: true } },
        user: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
        package: { select: { code: true, nameEn: true, nameSi: true, nameTa: true } },
      },
    });
    if (!checkout) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Checkout not found', HttpStatus.NOT_FOUND);
    }
    return checkout;
  }

  private async buildCheckout(
    method: PaymentMethod,
    paymentId: string,
    checkout: {
      id: string;
      checkoutNumber: string;
      priceLkr: Prisma.Decimal | number | string;
      currency: string;
      packageNameEn: string;
      userId: string;
    },
  ) {
    if (method === PaymentMethod.PAYHERE) {
      if (!this.payHere.isConfigured()) {
        return {
          type: 'payhere_unconfigured' as const,
          message:
            'PayHere credentials missing. Set PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET.',
          paymentId,
        };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: checkout.userId },
        include: { profile: true },
      });

      const webBase = this.config
        .get<string>('WEB_APP_URL', 'http://localhost:3001')
        .replace(/\/$/, '');

      const fields = this.payHere.buildCheckout({
        orderId: checkout.id,
        orderNumber: checkout.checkoutNumber,
        amount: Number(checkout.priceLkr),
        currency: checkout.currency,
        itemName: `Subscription: ${checkout.packageNameEn}`,
        customer: {
          fullName: user?.profile?.fullName,
          email: user?.email,
          phone: user?.profile?.mobileNumber ?? undefined,
        },
        returnPath: `${webBase}/checkout/subscription/${checkout.id}?payhere=return`,
        cancelPath: `${webBase}/checkout/subscription/${checkout.id}?payhere=cancel`,
      });

      return {
        type: 'payhere' as const,
        paymentId,
        mode: this.payHere.mode(),
        ...(this.payHere.mode() === 'sandbox'
          ? {
              sandboxCompletePath:
                '/api/v1/public/payments/payhere/subscription-sandbox-complete',
            }
          : {}),
        checkoutId: checkout.id,
        ...fields,
      };
    }

    if (method === PaymentMethod.BANK_TRANSFER) {
      const accounts = await this.bankAccounts.listPublic();
      return {
        type: 'bank_transfer' as const,
        banks: accounts,
        suggestedReference: checkout.checkoutNumber,
        message:
          'Transfer the exact amount, enter your reference number, and attach the bank slip.',
      };
    }

    return { type: 'unknown' as const };
  }

  private openBankSlip(key: string): StreamableFile {
    const path = resolveBankSlipPath(key);
    if (!path || !existsSync(path)) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Bank slip file missing', HttpStatus.NOT_FOUND);
    }
    return new StreamableFile(createReadStream(path));
  }

  private nextCheckoutNumber(): string {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `SUB-${stamp}-${rand}`;
  }

  private serializePayment(p: {
    id: string;
    checkoutId: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: Prisma.Decimal | number | string;
    currency: string;
    providerRef: string | null;
    bankSlipUrl: string | null;
    bankAccountId: string | null;
    createdAt: Date;
    confirmedAt: Date | null;
  }) {
    return {
      id: p.id,
      checkoutId: p.checkoutId,
      method: p.method,
      status: p.status,
      amount: Number(p.amount),
      currency: p.currency,
      providerRef: p.providerRef,
      hasBankSlip: Boolean(p.bankSlipUrl),
      bankAccountId: p.bankAccountId,
      createdAt: p.createdAt.toISOString(),
      confirmedAt: p.confirmedAt?.toISOString() ?? null,
    };
  }

  serializeCheckout(
    c: {
      id: string;
      checkoutNumber: string;
      userId: string;
      packageId: string;
      packageCode: string;
      packageNameEn: string;
      priceLkr: Prisma.Decimal | number | string;
      currency: string;
      status: SubscriptionCheckoutStatus;
      userSubscriptionId: string | null;
      createdAt: Date;
      updatedAt: Date;
      paidAt: Date | null;
      activatedAt: Date | null;
      payments?: Array<{
        id: string;
        checkoutId: string;
        method: PaymentMethod;
        status: PaymentStatus;
        amount: Prisma.Decimal | number | string;
        currency: string;
        providerRef: string | null;
        bankSlipUrl: string | null;
        bankAccountId: string | null;
        createdAt: Date;
        confirmedAt: Date | null;
        bankAccount?: {
          bankName: string;
          accountNumber: string;
        } | null;
      }>;
      user?: {
        id: string;
        email: string;
        profile: {
          fullName: string;
          mobileNumber?: string | null;
          whatsappNumber?: string | null;
        } | null;
      };
      package?: { code: string; nameEn: string };
    },
  ) {
    return {
      id: c.id,
      checkoutNumber: c.checkoutNumber,
      userId: c.userId,
      packageId: c.packageId,
      packageCode: c.packageCode,
      packageNameEn: c.packageNameEn,
      priceLkr: Number(c.priceLkr),
      currency: c.currency,
      status: c.status,
      userSubscriptionId: c.userSubscriptionId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      paidAt: c.paidAt?.toISOString() ?? null,
      activatedAt: c.activatedAt?.toISOString() ?? null,
      payments: (c.payments ?? []).map((p) => ({
        ...this.serializePayment(p),
        bankAccount: p.bankAccount
          ? { bankName: p.bankAccount.bankName, accountNumber: p.bankAccount.accountNumber }
          : null,
      })),
      userEmail: c.user?.email ?? null,
      userName: c.user?.profile?.fullName ?? null,
      userMobile: c.user?.profile?.mobileNumber ?? null,
      userWhatsapp: c.user?.profile?.whatsappNumber ?? null,
    };
  }
}
