import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import { ErrorCodes } from '@astro/shared';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { AppException } from '../common/errors/app.exception';
import { AdminOrderStatusDto } from './dto/admin-order-status.dto';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT, UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FINANCE)
export class AdminOrdersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  @Get()
  async list(
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('q') q?: string,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ) {
    const page = Math.max(1, Number(pageRaw) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw) || 20));
    const where: Prisma.OrderWhereInput = {};

    if (status && Object.values(OrderStatus).includes(status)) {
      where.status = status;
    }

    const paymentFilter: Prisma.PaymentWhereInput = {};
    if (paymentStatus && Object.values(PaymentStatus).includes(paymentStatus)) {
      paymentFilter.status = paymentStatus;
    }
    if (
      paymentMethod &&
      ['PAYHERE', 'BANK_TRANSFER', 'DEV_CONFIRM'].includes(paymentMethod)
    ) {
      paymentFilter.method = paymentMethod as PaymentMethod;
    }
    if (Object.keys(paymentFilter).length) {
      where.payments = { some: paymentFilter };
    }

    if (q?.trim()) {
      const term = q.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { birthProfile: { fullName: { contains: term, mode: 'insensitive' } } },
        { payments: { some: { providerRef: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, email: true, role: true, status: true } },
          product: { select: { id: true, slug: true, nameEn: true } },
          birthProfile: { select: { id: true, fullName: true, birthPlaceName: true } },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { bankAccount: true },
          },
          reports: {
            orderBy: { version: 'desc' },
            take: 1,
            select: { id: true, status: true, version: true, readyAt: true },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      items: items.map((o) => this.serialize(o)),
    };
  }

  @Get(':id/report')
  getReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.adminGetReport(id);
  }

  @Get(':id/report/file')
  async getReportFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.orders.adminGetReportFile(id);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    if (file.isPdf) {
      return new StreamableFile(file.stream);
    }
    return new StreamableFile(Buffer.from(file.body, 'utf8'));
  }

  @Get(':id/report/chart.svg')
  async getReportChart(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.orders.adminGetReportChartSvg(id);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${file.filename}"`,
    });
    return new StreamableFile(file.stream);
  }

  @Get(':id/payments/:paymentId/slip')
  async getBankSlip(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.orders.adminGetBankSlipFile(id, paymentId);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${file.filename}"`,
    });
    return new StreamableFile(file.stream);
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.findOne(id);
    return this.serialize(order);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminOrderStatusDto,
  ) {
    const order = await this.findOne(id);

    if (dto.status === OrderStatus.PAID || dto.status === OrderStatus.GENERATING) {
      await this.orders.adminConfirmPayment(id);
      return this.serialize(await this.findOne(id));
    }

    if (dto.status === OrderStatus.CANCELLED) {
      if (
        order.status === OrderStatus.COMPLETED ||
        order.status === OrderStatus.REFUNDED ||
        order.status === OrderStatus.GENERATING
      ) {
        throw new AppException(
          ErrorCodes.INVALID_ORDER_STATE,
          `Cannot cancel order in status ${order.status}`,
          HttpStatus.CONFLICT,
        );
      }
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id },
          data: { status: OrderStatus.CANCELLED },
        });
        await tx.payment.updateMany({
          where: {
            orderId: id,
            status: { in: [PaymentStatus.PENDING, PaymentStatus.UNDER_REVIEW] },
          },
          data: { status: PaymentStatus.REJECTED },
        });
      });
      return this.serialize(await this.findOne(id));
    }

    throw new AppException(
      ErrorCodes.INVALID_ORDER_STATE,
      `Unsupported admin transition to ${dto.status}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  private async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            profile: { select: { fullName: true, mobileNumber: true } },
          },
        },
        product: { select: { id: true, slug: true, nameEn: true, nameSi: true } },
        birthProfile: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          include: { bankAccount: true },
        },
        reports: { orderBy: { version: 'desc' } },
      },
    });
    if (!order) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Order not found', HttpStatus.NOT_FOUND);
    }
    return order;
  }

  private serialize(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    language: string;
    currency: string;
    promoCode: string | null;
    productPriceAmount: unknown;
    discountAmount: unknown;
    taxAmount: unknown;
    totalAmount: unknown;
    createdAt: Date;
    paidAt: Date | null;
    completedAt: Date | null;
    user: {
      id: string;
      email: string;
      role: string;
      status: string;
      profile?: { fullName: string; mobileNumber: string | null } | null;
    };
    product: { id: string; slug: string; nameEn: string; nameSi?: string | null };
    birthProfile: {
      id: string;
      fullName: string;
      birthPlaceName: string;
      birthDate?: Date;
      birthTime?: Date | null;
      unknownBirthTime?: boolean;
      timezone?: string;
    };
    payments: Array<{
      id: string;
      method: string;
      status: PaymentStatus;
      amount: unknown;
      currency: string;
      providerRef: string | null;
      bankSlipUrl: string | null;
      bankAccountId?: string | null;
      createdAt: Date;
      confirmedAt: Date | null;
      bankAccount?: {
        id: string;
        bankName: string;
        accountHolder: string;
        accountNumber: string;
        branch: string | null;
      } | null;
    }>;
    reports: Array<{
      id: string;
      version: number;
      status: string;
      language?: string;
      title?: string | null;
      readyAt: Date | null;
      errorMessage?: string | null;
    }>;
  }) {
    const readyReport = order.reports.find((r) => r.status === 'READY');
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      language: order.language,
      currency: order.currency,
      promoCode: order.promoCode,
      productPriceAmount: Number(order.productPriceAmount),
      discountAmount: Number(order.discountAmount),
      taxAmount: Number(order.taxAmount),
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      completedAt: order.completedAt,
      hasReadyReport: Boolean(readyReport),
      user: order.user,
      product: order.product,
      birthProfile: {
        id: order.birthProfile.id,
        fullName: order.birthProfile.fullName,
        birthPlaceName: order.birthProfile.birthPlaceName,
        birthDate: order.birthProfile.birthDate,
        birthTime: order.birthProfile.birthTime,
        unknownBirthTime: order.birthProfile.unknownBirthTime,
        timezone: order.birthProfile.timezone,
      },
      payments: order.payments.map((p) => ({
        id: p.id,
        method: p.method,
        status: p.status,
        amount: Number(p.amount),
        currency: p.currency,
        providerRef: p.providerRef,
        bankSlipUrl: p.bankSlipUrl,
        bankAccountId: p.bankAccountId ?? null,
        bankAccount: p.bankAccount
          ? {
              id: p.bankAccount.id,
              bankName: p.bankAccount.bankName,
              accountHolder: p.bankAccount.accountHolder,
              accountNumber: p.bankAccount.accountNumber,
              branch: p.bankAccount.branch,
            }
          : null,
        slipDownloadPath: p.bankSlipUrl
          ? `/admin/orders/${order.id}/payments/${p.id}/slip`
          : null,
        createdAt: p.createdAt,
        confirmedAt: p.confirmedAt,
      })),
      reports: order.reports.map((r) => ({
        id: r.id,
        version: r.version,
        status: r.status,
        language: r.language,
        title: r.title,
        readyAt: r.readyAt,
        errorMessage: r.errorMessage ?? null,
      })),
    };
  }
}
