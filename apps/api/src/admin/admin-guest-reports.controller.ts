import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Prisma, ReportStatus, UserRole } from '@prisma/client';
import {
  ErrorCodes,
  OUTREACH_TEMPLATES,
  buildSimpleHtmlEmail,
  getOutreachTemplate,
} from '@astro/shared';
import { createReadStream } from 'fs';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { resolveReportFilePath } from '../common/resolve-report-file';
import { AdminGuestOutreachDto } from './dto/admin-outreach.dto';
import { MailService } from '../notifications/mail.service';
import { SmsService } from '../notifications/sms.service';
import { SiteSettingsService } from '../notifications/site-settings.service';

@Controller('admin/guest-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
export class AdminGuestReportsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly sms: SmsService,
    private readonly siteSettings: SiteSettingsService,
  ) {}

  @Get()
  async list(
    @Query('status') status?: ReportStatus,
    @Query('q') q?: string,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ) {
    const page = Math.max(1, Number(pageRaw) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw) || 20));
    const where: Prisma.GuestReportWhereInput = {};

    if (status && Object.values(ReportStatus).includes(status)) {
      where.status = status;
    }
    if (q?.trim()) {
      const term = q.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { fullName: { contains: term, mode: 'insensitive' } },
        { mobile: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.guestReport.count({ where }),
      this.prisma.guestReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          fullName: true,
          gender: true,
          email: true,
          mobile: true,
          birthPlaceName: true,
          language: true,
          status: true,
          title: true,
          createdAt: true,
          readyAt: true,
          expiresAt: true,
        },
      }),
    ]);

    return { total, page, pageSize, items };
  }

  @Get('outreach-templates')
  listOutreachTemplates() {
    return {
      items: OUTREACH_TEMPLATES.filter((t) =>
        t.channels.some((c) => c === 'email' || c === 'sms'),
      ).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        channels: t.channels,
      })),
    };
  }

  @Post('outreach')
  async sendOutreach(@Body() dto: AdminGuestOutreachDto) {
    const template = getOutreachTemplate(dto.templateId);
    if (!template) {
      throw new AppException(
        ErrorCodes.VALIDATION_FAILED,
        'Unknown outreach template',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!template.channels.includes(dto.channel)) {
      throw new AppException(
        ErrorCodes.VALIDATION_FAILED,
        `Template does not support ${dto.channel}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const branding = await this.siteSettings.getBranding();
    const webUrl = this.config.get<string>('WEB_APP_URL') || 'http://localhost:3001';
    const signupUrl = `${webUrl.replace(/\/$/, '')}/register`;

    const guests = await this.prisma.guestReport.findMany({
      where: { id: { in: dto.ids } },
      select: { id: true, fullName: true, email: true, mobile: true },
    });

    let sent = 0;
    const failures: Array<{ id: string; error: string }> = [];

    for (const guest of guests) {
      const vars = {
        fullName: guest.fullName,
        siteName: branding.siteName,
        signupUrl,
        extraMessage: dto.extraMessage,
      };

      try {
        if (dto.channel === 'email') {
          if (!guest.email) throw new Error('missing email');
          const text = template.emailText(vars);
          const built = buildSimpleHtmlEmail(template.emailSubject, text, branding.siteName);
          await this.mail.send({
            to: guest.email,
            subject: built.subject,
            text: built.text,
            html: built.html,
          });
        } else {
          if (!guest.mobile) throw new Error('missing mobile');
          await this.sms.send({ to: guest.mobile, body: template.smsText(vars) });
        }
        sent += 1;
      } catch (err) {
        failures.push({
          id: guest.id,
          error: err instanceof Error ? err.message : 'send failed',
        });
      }
    }

    return { sent, total: guests.length, failures };
  }

  @Get(':id/file')
  async getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.prisma.guestReport.findUnique({ where: { id } });
    if (!report) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Guest report not found', HttpStatus.NOT_FOUND);
    }
    if (report.status !== ReportStatus.READY || !report.pdfStorageKey) {
      throw new AppException(
        ErrorCodes.REPORT_NOT_READY,
        'Guest report PDF is not ready yet',
        HttpStatus.CONFLICT,
      );
    }
    const pdfPath = resolveReportFilePath(
      report.pdfStorageKey,
      this.config.get<string>('REPORTS_DIR'),
    );
    if (!pdfPath) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Guest report PDF file missing', HttpStatus.NOT_FOUND);
    }
    const safeName = report.fullName.replace(/[^\w.-]+/g, '_').slice(0, 40) || 'guest';
    const filename = `taraka-guest-${safeName}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(createReadStream(pdfPath), {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    const report = await this.prisma.guestReport.findUnique({ where: { id } });
    if (!report) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Guest report not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: report.id,
      fullName: report.fullName,
      gender: report.gender,
      email: report.email,
      mobile: report.mobile,
      birthDate: report.birthDate,
      birthTime: report.birthTime,
      unknownBirthTime: report.unknownBirthTime,
      birthPlaceName: report.birthPlaceName,
      latitude: report.latitude,
      longitude: report.longitude,
      timezone: report.timezone,
      language: report.language,
      status: report.status,
      title: report.title,
      contentText: report.contentText,
      hasPdf: Boolean(
        resolveReportFilePath(report.pdfStorageKey, this.config.get<string>('REPORTS_DIR')),
      ),
      engineVersion: report.engineVersion,
      aiModel: report.aiModel,
      errorMessage: report.errorMessage,
      readyAt: report.readyAt,
      expiresAt: report.expiresAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }
}
