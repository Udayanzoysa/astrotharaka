import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SubscribeDto {
  @IsUUID()
  packageId!: string;

  @IsOptional()
  @IsString()
  paymentRef?: string;
}
