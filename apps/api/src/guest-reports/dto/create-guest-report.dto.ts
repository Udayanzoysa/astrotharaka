import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { LanguageCode } from '@prisma/client';

export enum GuestGender {
  female = 'female',
  male = 'male',
  other = 'other',
}

export class CreateGuestReportDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEnum(GuestGender)
  gender!: GuestGender;

  @IsEmail()
  email!: string;

  @IsOptional()
  @ValidateIf((_, v) => typeof v === 'string' && v.trim().length > 0)
  @IsString()
  @Matches(/^[+0-9\s()-]{7,20}$/, {
    message: 'mobile must be a valid phone number',
  })
  mobile?: string;

  @IsDateString()
  birthDate!: string;

  @ValidateIf((o: CreateGuestReportDto) => !o.unknownBirthTime)
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'birthTime must be HH:mm or HH:mm:ss' })
  birthTime?: string;

  @IsOptional()
  @IsBoolean()
  unknownBirthTime?: boolean;

  @IsString()
  @MinLength(2)
  birthPlaceName!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsEnum(LanguageCode)
  language?: LanguageCode;
}
