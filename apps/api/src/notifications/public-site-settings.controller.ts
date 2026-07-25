import { Controller, Get } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';

/** Public site branding + SEO for the web app (no auth). */
@Controller('site-settings')
export class PublicSiteSettingsController {
  constructor(private readonly siteSettings: SiteSettingsService) {}

  @Get('public')
  getPublic() {
    return this.siteSettings.getPublic();
  }
}
