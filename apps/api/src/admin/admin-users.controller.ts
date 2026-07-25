import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import {
  ErrorCodes,
  buildSimpleHtmlEmail,
  getOutreachTemplate,
} from '@astro/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { AdminUserPatchDto } from './dto/admin-user-patch.dto';
import { AdminPromoEmailDto, AdminUsersBulkDto } from './dto/admin-outreach.dto';
import { MailService } from '../notifications/mail.service';
import { SiteSettingsService } from '../notifications/site-settings.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
export class AdminUsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly siteSettings: SiteSettingsService,
  ) {}

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('status') status?: UserStatus,
    @Query('role') role?: UserRole,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ) {
    const page = Math.max(1, Number(pageRaw) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw) || 20));
    const where: Prisma.UserWhereInput = {};

    if (status && Object.values(UserStatus).includes(status)) {
      where.status = status;
    }
    if (role && Object.values(UserRole).includes(role)) {
      where.role = role;
    }
    if (q?.trim()) {
      const term = q.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { profile: { fullName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          profile: {
            select: {
              fullName: true,
              mobileNumber: true,
              whatsappNumber: true,
              preferredLanguage: true,
              emailMarketingConsent: true,
              whatsappMarketingConsent: true,
            },
          },
          oauthAccounts: { select: { provider: true } },
          _count: { select: { orders: true } },
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      items: items.map((u) => this.mapUser(u)),
    };
  }

  @Patch('bulk')
  async bulkPatch(@Body() dto: AdminUsersBulkDto, @CurrentUser() actor: JwtPayload) {
    const ids = dto.ids.filter((id) => id !== actor.sub);
    if (!ids.length) {
      throw new AppException(
        ErrorCodes.VALIDATION_FAILED,
        'No eligible users selected',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data: Prisma.UserUpdateManyMutationInput = { status: dto.status };
    if (dto.status === UserStatus.BLOCKED) {
      data.blockedAt = new Date();
    } else if (dto.status === UserStatus.ACTIVE) {
      data.blockedAt = null;
    }

    const result = await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data,
    });

    return { updated: result.count };
  }

  @Post('promo-email')
  async sendPromo(@Body() dto: AdminPromoEmailDto) {
    const branding = await this.siteSettings.getBranding();
    const users = await this.resolvePromoRecipients(dto);
    let sent = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const user of users) {
      const name = user.profile?.fullName || 'there';
      const built = buildSimpleHtmlEmail(
        dto.subject.trim(),
        [`Hello ${name},`, '', dto.message.trim(), '', `— ${branding.siteName}`].join('\n'),
        branding.siteName,
      );
      try {
        await this.mail.send({
          to: user.email,
          subject: built.subject,
          text: built.text,
          html: built.html,
        });
        sent += 1;
      } catch (err) {
        failures.push({
          email: user.email,
          error: err instanceof Error ? err.message : 'send failed',
        });
      }
    }

    return { sent, total: users.length, failures };
  }

  @Post(':id/email-report')
  async emailAccountReport(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: { select: { fullName: true } },
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { orderNumber: true, status: true, createdAt: true, totalAmount: true, currency: true },
        },
      },
    });
    if (!user) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }

    const branding = await this.siteSettings.getBranding();
    const template = getOutreachTemplate('account_activity_report');
    const orderLines = user.orders.length
      ? user.orders
          .map(
            (o) =>
              `- ${o.orderNumber}: ${o.status} · ${o.currency} ${o.totalAmount} · ${o.createdAt.toISOString().slice(0, 10)}`,
          )
          .join('\n')
      : '- No orders yet';

    const extra = [
      `Account status: ${user.status}`,
      `Role: ${user.role}`,
      `Orders: ${user._count.orders}`,
      `Email verified: ${user.emailVerifiedAt ? 'yes' : 'no'}`,
      '',
      'Recent orders:',
      orderLines,
    ].join('\n');

    const text =
      template?.emailText({
        fullName: user.profile?.fullName || 'there',
        siteName: branding.siteName,
        extraMessage: extra,
      }) || extra;

    const built = buildSimpleHtmlEmail(
      template?.emailSubject || `Your ${branding.siteName} account activity summary`,
      text,
      branding.siteName,
    );

    const result = await this.mail.send({
      to: user.email,
      subject: built.subject,
      text: built.text,
      html: built.html,
    });

    return { ok: result.ok, provider: result.provider, email: user.email };
  }

  @Patch(':id')
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUserPatchDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }

    if (dto.role !== undefined) {
      if (actor.role !== UserRole.SUPER_ADMIN) {
        throw new AppException(
          ErrorCodes.FORBIDDEN,
          'Only SUPER_ADMIN can change roles',
          HttpStatus.FORBIDDEN,
        );
      }
      if (id === actor.sub) {
        throw new AppException(
          ErrorCodes.VALIDATION_FAILED,
          'Cannot change your own role',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (!dto.status && !dto.role) {
      throw new AppException(
        ErrorCodes.VALIDATION_FAILED,
        'Nothing to update',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.status === UserStatus.BLOCKED) {
      data.status = UserStatus.BLOCKED;
      data.blockedAt = new Date();
    } else if (dto.status === UserStatus.ACTIVE) {
      data.status = UserStatus.ACTIVE;
      data.blockedAt = null;
    } else if (dto.status) {
      data.status = dto.status;
    }
    if (dto.role) {
      data.role = dto.role;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        profile: {
          select: {
            fullName: true,
            mobileNumber: true,
            whatsappNumber: true,
            preferredLanguage: true,
            emailMarketingConsent: true,
            whatsappMarketingConsent: true,
          },
        },
        oauthAccounts: { select: { provider: true } },
        _count: { select: { orders: true } },
      },
    });

    return this.mapUser(updated);
  }

  private mapUser(
    u: {
      id: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      emailVerifiedAt: Date | null;
      blockedAt: Date | null;
      createdAt: Date;
      passwordHash?: string | null;
      profile: {
        fullName: string;
        mobileNumber: string | null;
        whatsappNumber: string | null;
        preferredLanguage: string;
        emailMarketingConsent: boolean;
        whatsappMarketingConsent: boolean;
      } | null;
      oauthAccounts: Array<{ provider: string }>;
      _count: { orders: number };
    },
  ) {
    const providers = u.oauthAccounts.map((a) => a.provider);
    const authMethods: string[] = [...providers];
    if (u.passwordHash) authMethods.push('EMAIL');
    if (!authMethods.length) authMethods.push('EMAIL');

    return {
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      emailVerifiedAt: u.emailVerifiedAt,
      blockedAt: u.blockedAt,
      createdAt: u.createdAt,
      profile: u.profile
        ? {
            fullName: u.profile.fullName,
            mobileNumber: u.profile.mobileNumber,
            whatsappNumber: u.profile.whatsappNumber,
            preferredLanguage: u.profile.preferredLanguage,
            emailMarketingConsent: u.profile.emailMarketingConsent,
            whatsappMarketingConsent: u.profile.whatsappMarketingConsent,
          }
        : null,
      authMethods: [...new Set(authMethods)],
      ordersCount: u._count.orders,
    };
  }

  private async resolvePromoRecipients(dto: AdminPromoEmailDto) {
    const segment = dto.segment || (dto.userIds?.length ? 'selected' : 'active_marketing');

    if (segment === 'selected') {
      if (!dto.userIds?.length) {
        throw new AppException(
          ErrorCodes.VALIDATION_FAILED,
          'Select at least one user',
          HttpStatus.BAD_REQUEST,
        );
      }
      return this.prisma.user.findMany({
        where: { id: { in: dto.userIds } },
        include: { profile: { select: { fullName: true } } },
      });
    }

    if (segment === 'all_active') {
      return this.prisma.user.findMany({
        where: { status: UserStatus.ACTIVE, role: UserRole.CUSTOMER },
        take: 200,
        include: { profile: { select: { fullName: true } } },
      });
    }

    return this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        role: UserRole.CUSTOMER,
        profile: { emailMarketingConsent: true },
      },
      take: 200,
      include: { profile: { select: { fullName: true } } },
    });
  }
}
