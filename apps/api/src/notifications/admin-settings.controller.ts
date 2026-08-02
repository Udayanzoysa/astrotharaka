import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  EMAIL_TEMPLATE_CATALOG,
  buildEmailVerify,
  buildPasswordChanged,
  buildPasswordReset,
  buildReportPdfEmail,
} from '@astro/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SmtpConfigService } from './smtp-config.service';
import { MailService } from './mail.service';
import { SiteSettingsService } from './site-settings.service';
import { SendTestEmailDto, UpdateSmtpSettingsDto } from './dto/smtp-settings.dto';
import {
  UpdateBrandingSettingsDto,
  UpdateFreemiumSettingsDto,
  UpdateSeoSettingsDto,
  UpdateVerificationSettingsDto,
} from './dto/site-settings.dto';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT)
export class AdminSettingsController {
  constructor(
    private readonly smtp: SmtpConfigService,
    private readonly mail: MailService,
    private readonly siteSettings: SiteSettingsService,
  ) {}

  @Get('smtp')
  getSmtp() {
    return this.smtp.getPublicConfig();
  }

  @Put('smtp')
  async saveSmtp(@Body() dto: UpdateSmtpSettingsDto) {
    await this.smtp.save({
      host: dto.host,
      port: dto.port,
      secure: dto.secure,
      user: dto.user,
      from: dto.from,
      pass: dto.pass,
    });
    return this.smtp.getPublicConfig();
  }

  @Post('smtp/test')
  async testSmtp(@Body() dto: SendTestEmailDto) {
    const built = buildEmailVerify({
      fullName: 'Admin',
      code: '123456',
      expiresMinutes: 15,
    });
    const result = await this.mail.send({
      to: dto.to,
      subject: `[Test] ${built.subject}`,
      text: built.text,
      html: built.html,
    });
    return result;
  }

  @Get('email-templates')
  listTemplates() {
    return {
      items: EMAIL_TEMPLATE_CATALOG,
      previews: {
        email_verify: buildEmailVerify({
          fullName: 'Udaya',
          code: '482913',
          expiresMinutes: 15,
        }),
        password_reset: buildPasswordReset({
          fullName: 'Udaya',
          code: '719204',
          expiresMinutes: 15,
        }),
        password_changed: buildPasswordChanged({ fullName: 'Udaya' }),
        report_pdf: buildReportPdfEmail({
          fullName: 'Udaya',
          productName: 'Full horoscope report',
          orderNumber: 'GUEST-DEMO01',
          downloadUrl: 'https://taraka.example/guest-report/demo',
          attached: true,
        }),
      },
    };
  }

  @Get('branding')
  getBranding() {
    return this.siteSettings.getBranding();
  }

  @Put('branding')
  saveBranding(@Body() dto: UpdateBrandingSettingsDto) {
    return this.siteSettings.saveBranding(dto);
  }

  @Get('seo')
  getSeo() {
    return this.siteSettings.getSeo();
  }

  @Put('seo')
  saveSeo(@Body() dto: UpdateSeoSettingsDto) {
    return this.siteSettings.saveSeo({
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      keywords: dto.keywords,
      googleAnalyticsId: dto.googleAnalyticsId ?? '',
      googleSearchConsoleCode: dto.googleSearchConsoleCode ?? '',
      ogImageUrl: dto.ogImageUrl ?? '',
    });
  }

  @Get('verification')
  getVerification() {
    return this.siteSettings.getVerificationSettings();
  }

  @Put('verification')
  saveVerification(@Body() dto: UpdateVerificationSettingsDto) {
    return this.siteSettings.saveVerificationSettings(dto);
  }

  @Get('freemium')
  getFreemium() {
    return this.siteSettings.getFreemium();
  }

  @Put('freemium')
  saveFreemium(@Body() dto: UpdateFreemiumSettingsDto) {
    return this.siteSettings.saveFreemium(dto);
  }
}
