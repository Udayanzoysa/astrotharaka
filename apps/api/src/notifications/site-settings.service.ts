import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BRANDING_DEFAULTS,
  BRANDING_SETTING_KEYS,
  SEO_DEFAULTS,
  SEO_SETTING_KEYS,
  type BrandingSettings,
  type SeoSettings,
} from './site-settings.types';

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBranding(): Promise<BrandingSettings> {
    const map = await this.loadKeys(Object.values(BRANDING_SETTING_KEYS));
    return {
      siteName: map.get(BRANDING_SETTING_KEYS.siteName) || BRANDING_DEFAULTS.siteName,
      description: map.get(BRANDING_SETTING_KEYS.description) || BRANDING_DEFAULTS.description,
      slogan: map.get(BRANDING_SETTING_KEYS.slogan) || BRANDING_DEFAULTS.slogan,
      logoUrl: map.get(BRANDING_SETTING_KEYS.logoUrl) || BRANDING_DEFAULTS.logoUrl,
      faviconUrl: map.get(BRANDING_SETTING_KEYS.faviconUrl) || BRANDING_DEFAULTS.faviconUrl,
      h1Text: map.get(BRANDING_SETTING_KEYS.h1Text) || BRANDING_DEFAULTS.h1Text,
      colorPrimary: map.get(BRANDING_SETTING_KEYS.colorPrimary) || BRANDING_DEFAULTS.colorPrimary,
      colorSecondary:
        map.get(BRANDING_SETTING_KEYS.colorSecondary) || BRANDING_DEFAULTS.colorSecondary,
      colorAccent: map.get(BRANDING_SETTING_KEYS.colorAccent) || BRANDING_DEFAULTS.colorAccent,
      buttonStyle: map.get(BRANDING_SETTING_KEYS.buttonStyle) || BRANDING_DEFAULTS.buttonStyle,
      defaultLanguage:
        map.get(BRANDING_SETTING_KEYS.defaultLanguage) || BRANDING_DEFAULTS.defaultLanguage,
    };
  }

  async saveBranding(input: BrandingSettings): Promise<BrandingSettings> {
    await this.upsertMany([
      { key: BRANDING_SETTING_KEYS.siteName, value: input.siteName.trim() },
      { key: BRANDING_SETTING_KEYS.description, value: input.description.trim() },
      { key: BRANDING_SETTING_KEYS.slogan, value: input.slogan.trim() },
      { key: BRANDING_SETTING_KEYS.logoUrl, value: input.logoUrl.trim() },
      { key: BRANDING_SETTING_KEYS.faviconUrl, value: input.faviconUrl.trim() },
      { key: BRANDING_SETTING_KEYS.h1Text, value: input.h1Text.trim() },
      { key: BRANDING_SETTING_KEYS.colorPrimary, value: input.colorPrimary.trim() },
      { key: BRANDING_SETTING_KEYS.colorSecondary, value: input.colorSecondary.trim() },
      { key: BRANDING_SETTING_KEYS.colorAccent, value: input.colorAccent.trim() },
      { key: BRANDING_SETTING_KEYS.buttonStyle, value: input.buttonStyle.trim() },
      { key: BRANDING_SETTING_KEYS.defaultLanguage, value: input.defaultLanguage.trim() },
    ]);
    return this.getBranding();
  }

  async getSeo(): Promise<SeoSettings> {
    const map = await this.loadKeys(Object.values(SEO_SETTING_KEYS));
    return {
      metaTitle: map.get(SEO_SETTING_KEYS.metaTitle) || SEO_DEFAULTS.metaTitle,
      metaDescription: map.get(SEO_SETTING_KEYS.metaDescription) || SEO_DEFAULTS.metaDescription,
      keywords: map.get(SEO_SETTING_KEYS.keywords) || SEO_DEFAULTS.keywords,
      googleAnalyticsId: map.get(SEO_SETTING_KEYS.googleAnalyticsId) || SEO_DEFAULTS.googleAnalyticsId,
      googleSearchConsoleCode:
        map.get(SEO_SETTING_KEYS.googleSearchConsoleCode) || SEO_DEFAULTS.googleSearchConsoleCode,
      ogImageUrl: map.get(SEO_SETTING_KEYS.ogImageUrl) || SEO_DEFAULTS.ogImageUrl,
    };
  }

  async saveSeo(input: SeoSettings): Promise<SeoSettings> {
    await this.upsertMany([
      { key: SEO_SETTING_KEYS.metaTitle, value: input.metaTitle.trim() },
      { key: SEO_SETTING_KEYS.metaDescription, value: input.metaDescription.trim() },
      { key: SEO_SETTING_KEYS.keywords, value: input.keywords.trim() },
      { key: SEO_SETTING_KEYS.googleAnalyticsId, value: input.googleAnalyticsId.trim() },
      {
        key: SEO_SETTING_KEYS.googleSearchConsoleCode,
        value: input.googleSearchConsoleCode.trim(),
      },
      { key: SEO_SETTING_KEYS.ogImageUrl, value: input.ogImageUrl.trim() },
    ]);
    return this.getSeo();
  }

  async getPublic() {
    const [branding, seo] = await Promise.all([this.getBranding(), this.getSeo()]);
    return { branding, seo };
  }

  private async loadKeys(keys: string[]) {
    const rows = await this.prisma.systemSetting.findMany({
      where: { key: { in: keys } },
    });
    return new Map(rows.map((r) => [r.key, r.value]));
  }

  async getVerificationSettings(): Promise<{ verificationMethod: string }> {
    const map = await this.loadKeys(['VERIFICATION_METHOD']);
    return {
      verificationMethod: map.get('VERIFICATION_METHOD') || 'EMAIL',
    };
  }

  async saveVerificationSettings(input: { verificationMethod: string }): Promise<{ verificationMethod: string }> {
    await this.upsertMany([
      { key: 'VERIFICATION_METHOD', value: input.verificationMethod },
    ]);
    return this.getVerificationSettings();
  }

  private async upsertMany(rows: Array<{ key: string; value: string }>) {
    await this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.systemSetting.upsert({
          where: { key: row.key },
          create: { key: row.key, value: row.value },
          update: { value: row.value },
        }),
      ),
    );
  }
}
