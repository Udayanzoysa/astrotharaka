import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { LanguageCode } from '@prisma/client';

export class CreateBirthProfileDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsDateString()
  birthDate!: string;

  @ValidateIf((o: CreateBirthProfileDto) => !o.unknownBirthTime)
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
  preferredLanguage?: LanguageCode;

  @IsOptional()
  @IsString()
  notes?: string;
}
