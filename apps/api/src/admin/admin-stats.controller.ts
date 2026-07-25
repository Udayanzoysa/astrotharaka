import { Controller, Get, UseGuards } from '@nestjs/common';
import { OrderStatus, ReportStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT, UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FINANCE)
export class AdminStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getStats() {
    const [
      usersTotal,
      usersActive,
      usersBlocked,
      ordersByStatus,
      guestByStatus,
      revenueAgg,
      recentOrders,
      recentGuests,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'BLOCKED' } }),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.guestReport.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.aggregate({
        where: { status: { in: [OrderStatus.COMPLETED, OrderStatus.GENERATING, OrderStatus.PAID] } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      this.prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
          product: { select: { nameEn: true, slug: true } },
        },
      }),
      this.prisma.guestReport.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
          language: true,
          createdAt: true,
        },
      }),
    ]);

    const orderStatusCounts = Object.fromEntries(
      Object.values(OrderStatus).map((s) => [s, 0]),
    ) as Record<OrderStatus, number>;
    for (const row of ordersByStatus) {
      orderStatusCounts[row.status] = row._count._all;
    }

    const guestStatusCounts = Object.fromEntries(
      Object.values(ReportStatus).map((s) => [s, 0]),
    ) as Record<ReportStatus, number>;
    for (const row of guestByStatus) {
      guestStatusCounts[row.status] = row._count._all;
    }

    const completedRevenue = await this.prisma.order.aggregate({
      where: { status: OrderStatus.COMPLETED },
      _sum: { totalAmount: true },
    });

    return {
      users: {
        total: usersTotal,
        active: usersActive,
        blocked: usersBlocked,
      },
      orders: {
        total: Object.values(orderStatusCounts).reduce((a, b) => a + b, 0),
        byStatus: orderStatusCounts,
        paidLike: revenueAgg._count._all,
      },
      guestReports: {
        total: Object.values(guestStatusCounts).reduce((a, b) => a + b, 0),
        byStatus: guestStatusCounts,
      },
      revenue: {
        completedTotal: Number(completedRevenue._sum.totalAmount ?? 0),
        currency: 'LKR',
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        currency: o.currency,
        createdAt: o.createdAt,
        userEmail: o.user.email,
        productName: o.product.nameEn,
      })),
      recentGuestReports: recentGuests,
    };
  }
}
