import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { LanguageCode } from '@prisma/client';

export class UpsertProductDto {
  @IsString()
  @MinLength(2)
  slug!: string;

  @IsString()
  @MinLength(2)
  nameEn!: string;

  @IsOptional()
  @IsString()
  nameSi?: string;

  @IsOptional()
  @IsString()
  nameTa?: string;

  @IsString()
  @MinLength(2)
  descriptionEn!: string;

  @IsOptional()
  @IsString()
  descriptionSi?: string;

  @IsOptional()
  @IsString()
  descriptionTa?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  supportedLanguages?: LanguageCode[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsNumber()
  @Min(0)
  priceAmount!: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
