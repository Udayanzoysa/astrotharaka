import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class StartPaymentDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  /** Existing storage key if slip already uploaded */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bankSlipUrl?: string;

  /** Customer bank transfer reference number */
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  providerRef?: string;

  /** Which admin bank account the customer paid into */
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  /** Base64-encoded bank slip (PDF/JPG/PNG/WEBP), without data: prefix */
  @IsOptional()
  @IsString()
  slipBase64?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slipFileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  slipMimeType?: string;
}
