import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBrandingSettingsDto {
  @IsString()
  @MaxLength(120)
  siteName!: string;

  @IsString()
  @MaxLength(500)
  description!: string;

  @IsString()
  @MaxLength(200)
  slogan!: string;

  @IsString()
  @MaxLength(500)
  logoUrl!: string;

  @IsString()
  @MaxLength(500)
  faviconUrl!: string;

  @IsString()
  @MaxLength(200)
  h1Text!: string;

  @IsString()
  @MaxLength(32)
  colorPrimary!: string;

  @IsString()
  @MaxLength(32)
  colorSecondary!: string;

  @IsString()
  @MaxLength(32)
  colorAccent!: string;

  @IsString()
  @IsIn(['rounded', 'pill', 'square'])
  buttonStyle!: string;

  @IsString()
  @IsIn(['en', 'si', 'ta'])
  defaultLanguage!: string;
}

export class UpdateSeoSettingsDto {
  @IsString()
  @MaxLength(200)
  metaTitle!: string;

  @IsString()
  @MaxLength(500)
  metaDescription!: string;

  @IsString()
  @MaxLength(500)
  keywords!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  googleAnalyticsId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  googleSearchConsoleCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImageUrl?: string;
}

export class UpdateVerificationSettingsDto {
  @IsString()
  @IsIn(['EMAIL', 'MOBILE'])
  verificationMethod!: string;
}
