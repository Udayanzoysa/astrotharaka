import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpsertSubscriptionPackageDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(2)
  nameEn!: string;

  @IsOptional()
  @IsString()
  nameSi?: string;

  @IsOptional()
  @IsString()
  nameTa?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  descriptionSi?: string;

  @IsOptional()
  @IsString()
  descriptionTa?: string;

  @IsNumber()
  @Min(0)
  priceLkr!: number;

  @IsInt()
  @Min(0)
  babyNamesQuota!: number;

  @IsInt()
  @Min(0)
  porondamQuota!: number;

  @IsInt()
  @Min(0)
  horoscopeQuota!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
