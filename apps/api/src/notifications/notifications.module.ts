import { Module } from '@nestjs/common';
import { SmtpConfigService } from './smtp-config.service';
import { MailService } from './mail.service';
import { SmsService } from './sms.service';
import { SiteSettingsService } from './site-settings.service';
import { AdminSettingsController } from './admin-settings.controller';
import { PublicSiteSettingsController } from './public-site-settings.controller';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  controllers: [AdminSettingsController, PublicSiteSettingsController],
  providers: [SmtpConfigService, MailService, SmsService, SiteSettingsService, RolesGuard],
  exports: [SmtpConfigService, MailService, SmsService, SiteSettingsService],
})
export class NotificationsModule {}
