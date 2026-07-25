import { OrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class AdminOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
