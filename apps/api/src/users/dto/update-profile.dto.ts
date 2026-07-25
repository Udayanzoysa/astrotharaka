import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LanguageCode } from '@prisma/client';

function emptyStringToNull(value: unknown): unknown {
  if (value === '') return null;
  return value;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsEnum(LanguageCode)
  preferredLanguage?: LanguageCode;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @ValidateIf((_, v) => v != null)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'birthDate must be YYYY-MM-DD' })
  birthDate?: string | null;

  /** HH:mm or HH:mm:ss */
  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @ValidateIf((_, v) => v != null)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'birthTime must be HH:mm',
  })
  birthTime?: string | null;

  @IsOptional()
  @IsBoolean()
  unknownBirthTime?: boolean;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @MinLength(2)
  birthPlaceName?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @ValidateIf((_, v) => v != null && v !== '')
  @IsIn(['female', 'male', 'other'])
  gender?: string | null;

  @IsOptional()
  @IsBoolean()
  emailMarketingConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappMarketingConsent?: boolean;
}
