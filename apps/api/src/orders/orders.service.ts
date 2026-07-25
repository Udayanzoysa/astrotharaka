import { HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes, LanguageCode as SharedLanguage } from '@astro/shared';
import {
  LanguageCode,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ReportStatus,
  UserStatus,
} from '@prisma/client';
import { createReadStream } from 'fs';
import { basename, extname, join } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { assertDevPaymentsAllowed } from '../common/runtime-flags';
import { resolveReportFilePath } from '../common/resolve-report-file';
import { ProductsService } from '../products/products.service';
import { QueueService } from '../queue/queue.service';
import { PayHereService } from '../payments/payhere.service';
import { PromotionsService } from '../promotions/promotions.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { StartPaymentDto } from './dto/start-payment.dto';
import { resolveBankSlipPath, saveBankSlipFile } from './bank-slip-storage';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => PayHereService))
    private readonly payHere: PayHereService,
    private readonly promotions: PromotionsService,
    private readonly subscriptions: SubscriptionsService,
    private readonly bankAccounts: BankAccountsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    await this.assertUserCanOrder(userId);

    const birth = await this.prisma.birthProfile.findFirst({
      where: { id: dto.birthProfileId, userId },
    });
    if (!birth) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Birth profile not found', HttpStatus.NOT_FOUND);
    }

    const product = await this.products.getActiveById(dto.productId);
    const price = product.prices[0];
    const amount = new Prisma.Decimal(price.amount);
    const language = dto.language ?? birth.preferredLanguage;

    if (product.supportedLanguages?.length && !product.supportedLanguages.includes(language)) {
      throw new AppException(
        ErrorCodes.VALIDATION_FAILED,
        `Report language ${language} is not supported for this product`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.useSubscriptionQuota) {
      await this.subscriptions.consumeQuota(userId, 'HOROSCOPE');
      const order = await this.prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            orderNumber: this.nextOrderNumber(),
            userId,
            productId: product.id,
            birthProfileId: birth.id,
            language,
            status: OrderStatus.AWAITING_PAYMENT,
            currency: price.currency,
            productPriceAmount: amount,
            discountAmount: amount,
            taxAmount: 0,
            totalAmount: 0,
          },
          include: this.orderInclude(),
        });
        const payment = await tx.payment.create({
          data: {
            orderId: created.id,
            method: PaymentMethod.DEV_CONFIRM,
            status: PaymentStatus.PENDING,
            amount: 0,
            currency: price.currency,
            idempotencyKey: `sub-quota-${created.id}`,
            providerRef: 'SUBSCRIPTION_QUOTA',
          },
        });
        return { created, paymentId: payment.id };
      });
      await this.confirmPaymentInternal(order.created.id, order.paymentId);
      return this.getMine(userId, order.created.id);
    }

    let discountAmount = new Prisma.Decimal(0);
    let promotionId: string | undefined;
    let promoCode: string | undefined;

    if (dto.promoCode?.trim()) {
      const quote = await this.promotions.validateForUser({
        userId,
        code: dto.promoCode,
        productId: product.id,
        orderAmount: amount,
      });
      discountAmount = new Prisma.Decimal(quote.discountAmount);
      promotionId = quote.promotionId;
      promoCode = quote.code;
    }

    const totalAmount = Prisma.Decimal.max(amount.minus(discountAmount), new Prisma.Decimal(0));

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: this.nextOrderNumber(),
          userId,
          productId: product.id,
          birthProfileId: birth.id,
          promotionId,
          promoCode,
          language,
          status: OrderStatus.AWAITING_PAYMENT,
          currency: price.currency,
          productPriceAmount: amount,
          discountAmount,
          taxAmount: 0,
          totalAmount,
        },
        include: this.orderInclude(),
      });

      if (promotionId) {
        await tx.promotionRedemption.create({
          data: {
            promotionId,
            userId,
            orderId: created.id,
          },
        });
      }

      return created;
    });

    return this.serializeOrder(order);
  }

  async listMine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: this.orderInclude(),
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.serializeOrder(o));
  }

  async getMine(userId: string, orderId: string) {
    const order = await this.findOwned(userId, orderId);
    return this.serializeOrder(order);
  }

  async startPayment(userId: string, orderId: string, dto: StartPaymentDto) {
    if (dto.method === PaymentMethod.DEV_CONFIRM) {
      assertDevPaymentsAllowed('DEV_CONFIRM payment');
    }

    const order = await this.findOwned(userId, orderId);

    if (
      order.status !== OrderStatus.AWAITING_PAYMENT &&
      order.status !== OrderStatus.PAYMENT_UNDER_REVIEW
    ) {
      throw new AppException(
        ErrorCodes.INVALID_ORDER_STATE,
        `Cannot pay order in status ${order.status}`,
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
      `pay-${orderId}-${dto.method}-${providerRef ?? 'x'}-${Date.now()}`;

    const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
    if (existing) {
      const refreshed = await this.findOwned(userId, orderId);
      return {
        payment: this.serializePayment(existing),
        order: this.serializeOrder(refreshed),
        checkout: await this.buildCheckout(dto.method, existing.id, refreshed),
      };
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          orderId: order.id,
          method: dto.method,
          status:
            dto.method === PaymentMethod.BANK_TRANSFER
              ? PaymentStatus.UNDER_REVIEW
              : PaymentStatus.PENDING,
          amount: order.totalAmount,
          currency: order.currency,
          bankSlipUrl,
          providerRef,
          bankAccountId,
          idempotencyKey,
        },
      });

      if (dto.method === PaymentMethod.BANK_TRANSFER) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAYMENT_UNDER_REVIEW },
        });
      }

      return created;
    });

    if (dto.method === PaymentMethod.DEV_CONFIRM) {
      await this.confirmPaymentInternal(order.id, payment.id);
      const refreshed = await this.findOwned(userId, orderId);
      return {
        payment: this.serializePayment(
          refreshed.payments.find((p) => p.id === payment.id) ?? payment,
        ),
        order: this.serializeOrder(refreshed),
        checkout: { type: 'dev_confirmed' as const },
      };
    }

    const refreshed = await this.findOwned(userId, orderId);
    return {
      payment: this.serializePayment(payment),
      order: this.serializeOrder(refreshed),
      checkout: await this.buildCheckout(dto.method, payment.id, refreshed),
    };
  }

  /** Local/dev helper: simulate PayHere webhook or finance approval. Disabled in production. */
  async confirmPayment(userId: string, orderId: string) {
    assertDevPaymentsAllowed('Customer payment self-confirm');
    const order = await this.findOwned(userId, orderId);
    const payment =
      order.payments.find((p) => p.status === PaymentStatus.PENDING) ??
      order.payments.find((p) => p.status === PaymentStatus.UNDER_REVIEW);

    if (!payment) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'No pending payment found', HttpStatus.NOT_FOUND);
    }

    await this.confirmPaymentInternal(order.id, payment.id);
    return this.getMine(userId, orderId);
  }

  /** Admin: confirm payment for an order (bank slip / finance review). */
  async adminConfirmPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!order) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Order not found', HttpStatus.NOT_FOUND);
    }
    if (
      order.status !== OrderStatus.AWAITING_PAYMENT &&
      order.status !== OrderStatus.PAYMENT_UNDER_REVIEW
    ) {
      throw new AppException(
        ErrorCodes.INVALID_ORDER_STATE,
        `Cannot confirm payment for order in status ${order.status}`,
        HttpStatus.CONFLICT,
      );
    }

    const payment =
      order.payments.find((p) => p.status === PaymentStatus.UNDER_REVIEW) ??
      order.payments.find((p) => p.status === PaymentStatus.PENDING) ??
      order.payments[0];

    if (!payment) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'No pending payment found', HttpStatus.NOT_FOUND);
    }

    await this.confirmPaymentInternal(order.id, payment.id);
  }

  async confirmPayHereWebhook(input: {
    orderId: string;
    paymentId?: string;
    amount?: string;
    currency?: string;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!order) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Order not found', HttpStatus.NOT_FOUND);
    }

    if (
      order.status === OrderStatus.GENERATING ||
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.PAID
    ) {
      return { status: 'already_processed' };
    }

    const payment =
      order.payments.find(
        (p) => p.method === PaymentMethod.PAYHERE && p.status === PaymentStatus.PENDING,
      ) ?? order.payments[0];

    if (!payment) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Payment not found', HttpStatus.NOT_FOUND);
    }

    if (input.paymentId) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { providerRef: input.paymentId },
      });
    }

    await this.confirmPaymentInternal(order.id, payment.id);
    return { status: 'confirmed' };
  }

  async getReportDownload(userId: string, orderId: string) {
    const order = await this.findOwned(userId, orderId);
    return this.buildReportView(order, `/api/v1/orders/${order.id}/report/file`);
  }

  /** Admin: view report content without customer ownership check. */
  async adminGetReport(orderId: string) {
    const order = await this.findById(orderId);
    return this.buildReportView(order, `/api/v1/admin/orders/${order.id}/report/file`, true);
  }

  async getReportFile(userId: string, orderId: string) {
    const order = await this.findOwned(userId, orderId);
    return this.buildReportFile(order);
  }

  async adminGetReportFile(orderId: string) {
    const order = await this.findById(orderId);
    return this.buildReportFile(order);
  }

  async getReportChartSvg(userId: string, orderId: string) {
    const order = await this.findOwned(userId, orderId);
    return this.buildReportChartSvg(order);
  }

  async adminGetReportChartSvg(orderId: string) {
    const order = await this.findById(orderId);
    return this.buildReportChartSvg(order);
  }

  private async findById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.orderInclude(),
    });
    if (!order) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Order not found', HttpStatus.NOT_FOUND);
    }
    return order;
  }

  private pickReadyReport(
    order: {
      orderNumber: string;
      reports: Array<{
        id?: string;
        version: number;
        status: ReportStatus;
        title?: string | null;
        contentText?: string | null;
        pdfStorageKey: string | null;
      }>;
    },
  ) {
    const report = order.reports
      .filter((r) => r.status === ReportStatus.READY)
      .sort((a, b) => b.version - a.version)[0];
    if (!report) {
      throw new AppException(ErrorCodes.REPORT_NOT_READY, 'Report is not ready yet', HttpStatus.CONFLICT);
    }
    return report;
  }

  private buildReportView(
    order: {
      id: string;
      orderNumber: string;
      reports: Array<{
        id: string;
        version: number;
        status: ReportStatus;
        title: string | null;
        contentText: string | null;
        pdfStorageKey: string | null;
      }>;
    },
    downloadUrl: string,
    admin = false,
  ) {
    const report = this.pickReadyReport(order);
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      reportId: report.id,
      version: report.version,
      title: report.title,
      status: report.status,
      downloadUrl,
      chartSvgUrl: admin
        ? `/api/v1/admin/orders/${order.id}/report/chart.svg`
        : `/api/v1/orders/${order.id}/report/chart.svg`,
      contentText: report.contentText,
      pdfStorageKey: report.pdfStorageKey,
    };
  }

  private buildReportFile(order: {
    orderNumber: string;
    reports: Array<{
      version: number;
      status: ReportStatus;
      contentText: string | null;
      pdfStorageKey: string | null;
    }>;
  }) {
    const report = this.pickReadyReport(order);
    const pdfPath = resolveReportFilePath(
      report.pdfStorageKey,
      this.config.get<string>('REPORTS_DIR'),
    );
    if (pdfPath) {
      return {
        filename: `${order.orderNumber}-v${report.version}.pdf`,
        contentType: 'application/pdf',
        stream: createReadStream(pdfPath),
        isPdf: true as const,
      };
    }
    return {
      filename: `${order.orderNumber}-v${report.version}.txt`,
      contentType: 'text/plain; charset=utf-8',
      body: report.contentText ?? 'Report content unavailable',
      isPdf: false as const,
    };
  }

  private buildReportChartSvg(order: {
    orderNumber: string;
    reports: Array<{
      version: number;
      status: ReportStatus;
      pdfStorageKey: string | null;
    }>;
  }) {
    const report = this.pickReadyReport(order);
    const reportsDir = this.config.get<string>('REPORTS_DIR', './uploads/reports');
    const candidates: string[] = [];
    const pdfPath = resolveReportFilePath(report.pdfStorageKey, reportsDir);
    if (pdfPath) {
      candidates.push(pdfPath.replace(/\.pdf$/i, '-kundali.svg'));
    }
    if (report.pdfStorageKey) {
      candidates.push(report.pdfStorageKey.replace(/\.pdf$/i, '-kundali.svg'));
    }
    candidates.push(
      join(reportsDir.replace(/[/\\]$/, ''), `${order.orderNumber}-v${report.version}-kundali.svg`),
    );
    const svgPath = candidates
      .map((p) => resolveReportFilePath(p, reportsDir))
      .find((p): p is string => Boolean(p));
    if (!svgPath) {
      throw new AppException(
        ErrorCodes.REPORT_NOT_READY,
        'Kundali chart is not ready yet',
        HttpStatus.CONFLICT,
      );
    }
    return {
      filename: `${order.orderNumber}-v${report.version}-kundali.svg`,
      contentType: 'image/svg+xml; charset=utf-8',
      stream: createReadStream(svgPath),
    };
  }

  private async confirmPaymentInternal(orderId: string, paymentId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.CONFIRMED, confirmedAt: new Date() },
      });

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.GENERATING,
          paidAt: new Date(),
        },
      });

      const latest = await tx.generatedReport.findFirst({
        where: { orderId },
        orderBy: { version: 'desc' },
      });
      const version = (latest?.version ?? 0) + 1;

      const report = await tx.generatedReport.create({
        data: {
          orderId,
          version,
          status: ReportStatus.QUEUED,
          language: order.language,
          title: `Report ${order.orderNumber}`,
        },
      });

      return { updated, report, birthProfileId: order.birthProfileId, language: order.language };
    });

    await this.queue.enqueueReportGenerate({
      orderId,
      birthProfileId: result.birthProfileId,
      language: result.language as unknown as SharedLanguage,
      requestId: result.report.id,
    });
  }

  private async assertUserCanOrder(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }
    if (user.status === UserStatus.BLOCKED || user.blockedAt) {
      throw new AppException(ErrorCodes.USER_BLOCKED, 'User account is blocked', HttpStatus.FORBIDDEN);
    }
  }

  private async findOwned(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: this.orderInclude(),
    });
    if (!order) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Order not found', HttpStatus.NOT_FOUND);
    }
    return order;
  }

  private orderInclude() {
    return {
      product: true,
      birthProfile: true,
      payments: { orderBy: { createdAt: 'desc' as const } },
      reports: { orderBy: { version: 'desc' as const } },
    };
  }

  private nextOrderNumber(): string {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `TRK-${stamp}-${rand}`;
  }

  private async buildCheckout(
    method: PaymentMethod,
    paymentId: string,
    order: {
      id: string;
      orderNumber: string;
      totalAmount: unknown;
      currency: string;
      product: { nameEn: string };
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
          confirmPath: `/api/v1/orders/${order.id}/payments/confirm`,
        };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: order.userId },
        include: { profile: true },
      });

      const fields = this.payHere.buildCheckout({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount),
        currency: order.currency,
        itemName: order.product.nameEn,
        customer: {
          fullName: user?.profile?.fullName,
          email: user?.email,
          phone: user?.profile?.mobileNumber ?? undefined,
        },
      });

      return {
        type: 'payhere' as const,
        paymentId,
        mode: this.payHere.mode(),
        sandboxCompletePath: '/api/v1/public/payments/payhere/sandbox-complete',
        ...fields,
      };
    }

    if (method === PaymentMethod.BANK_TRANSFER) {
      const accounts = await this.bankAccounts.listPublic();
      const fallback =
        accounts.length === 0
          ? [
              {
                id: 'env-fallback',
                bankName: this.config.get('BANK_NAME', 'Commercial Bank of Ceylon'),
                accountHolder: this.config.get('BANK_ACCOUNT_NAME', 'Taraka AstroAI Lanka'),
                accountNumber: this.config.get('BANK_ACCOUNT_NUMBER', '8001234567'),
                branch: this.config.get('BANK_BRANCH', 'Colombo'),
                sortOrder: 0,
              },
            ]
          : accounts;
      return {
        type: 'bank_transfer' as const,
        banks: fallback,
        suggestedReference: order.orderNumber,
        message:
          'Transfer the exact amount to one of the accounts below. Enter your bank reference and attach the slip for finance review.',
      };
    }

    return { type: 'unknown' as const };
  }

  async getBankSlipFile(userId: string, orderId: string, paymentId: string) {
    const order = await this.findOwned(userId, orderId);
    const payment = order.payments.find((p) => p.id === paymentId);
    if (!payment?.bankSlipUrl) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Bank slip not found', HttpStatus.NOT_FOUND);
    }
    return this.openBankSlip(payment.bankSlipUrl);
  }

  async adminGetBankSlipFile(orderId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, orderId },
    });
    if (!payment?.bankSlipUrl) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Bank slip not found', HttpStatus.NOT_FOUND);
    }
    return this.openBankSlip(payment.bankSlipUrl);
  }

  private openBankSlip(storageKey: string) {
    const path = resolveBankSlipPath(storageKey);
    if (!path) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Bank slip file missing', HttpStatus.NOT_FOUND);
    }
    const ext = extname(path).toLowerCase();
    const contentType =
      ext === '.pdf'
        ? 'application/pdf'
        : ext === '.png'
          ? 'image/png'
          : ext === '.webp'
            ? 'image/webp'
            : 'image/jpeg';
    return {
      stream: createReadStream(path),
      filename: basename(path),
      contentType,
    };
  }

  private serializePayment(payment: {
    id: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: unknown;
    currency: string;
    providerRef: string | null;
    bankSlipUrl: string | null;
    bankAccountId?: string | null;
    idempotencyKey: string;
    createdAt: Date;
    confirmedAt: Date | null;
  }) {
    return {
      id: payment.id,
      method: payment.method,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency,
      providerRef: payment.providerRef,
      bankSlipUrl: payment.bankSlipUrl,
      bankAccountId: payment.bankAccountId ?? null,
      idempotencyKey: payment.idempotencyKey,
      createdAt: payment.createdAt,
      confirmedAt: payment.confirmedAt,
    };
  }

  private serializeOrder(order: {
    id: string;
    orderNumber: string;
    userId: string;
    promotionId?: string | null;
    promoCode?: string | null;
    status: OrderStatus;
    language: LanguageCode;
    currency: string;
    productPriceAmount: unknown;
    discountAmount: unknown;
    taxAmount: unknown;
    totalAmount: unknown;
    createdAt: Date;
    paidAt: Date | null;
    completedAt: Date | null;
    product: { id: string; slug: string; nameEn: string; nameSi: string | null; nameTa: string | null };
    birthProfile: { id: string; fullName: string; birthPlaceName: string };
    payments: Array<{
      id: string;
      method: PaymentMethod;
      status: PaymentStatus;
      amount: unknown;
      currency: string;
      providerRef: string | null;
      bankSlipUrl: string | null;
      idempotencyKey: string;
      createdAt: Date;
      confirmedAt: Date | null;
    }>;
    reports: Array<{
      id: string;
      version: number;
      status: ReportStatus;
      language: LanguageCode;
      title: string | null;
      downloadUrl: string | null;
      readyAt: Date | null;
      pdfStorageKey?: string | null;
    }>;
  }) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      language: order.language,
      currency: order.currency,
      promoCode: order.promoCode ?? null,
      promotionId: order.promotionId ?? null,
      productPriceAmount: Number(order.productPriceAmount),
      discountAmount: Number(order.discountAmount),
      taxAmount: Number(order.taxAmount),
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      completedAt: order.completedAt,
      product: order.product,
      birthProfile: order.birthProfile,
      payments: order.payments.map((p) => ({
        ...this.serializePayment(p),
        slipDownloadPath: p.bankSlipUrl
          ? `/orders/${order.id}/payments/${p.id}/slip`
          : null,
      })),
      reports: order.reports.map((r) => ({
        id: r.id,
        version: r.version,
        status: r.status,
        language: r.language,
        title: r.title,
        downloadUrl: r.downloadUrl,
        chartSvgUrl:
          r.status === ReportStatus.READY
            ? `/api/v1/orders/${order.id}/report/chart.svg`
            : null,
        readyAt: r.readyAt,
      })),
    };
  }
}
