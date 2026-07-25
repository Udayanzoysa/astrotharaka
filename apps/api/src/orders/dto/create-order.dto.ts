import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { LanguageCode } from '@prisma/client';

export class CreateOrderDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  birthProfileId!: string;

  @IsOptional()
  @IsEnum(LanguageCode)
  language?: LanguageCode;

  @IsOptional()
  @IsString()
  @MinLength(2)
  promoCode?: string;

  /** Use monthly subscription horoscope quota instead of paying. */
  @IsOptional()
  @IsBoolean()
  useSubscriptionQuota?: boolean;
}
