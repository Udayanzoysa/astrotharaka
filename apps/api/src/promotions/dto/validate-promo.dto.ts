import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class ValidatePromoDto {
  @IsString()
  code!: string;

  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderAmount?: number;
}
