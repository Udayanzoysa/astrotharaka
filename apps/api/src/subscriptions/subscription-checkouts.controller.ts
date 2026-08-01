import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { SubscriptionCheckoutsService } from './subscription-checkouts.service';
import { StartPaymentDto } from '../orders/dto/start-payment.dto';
import { IsUUID } from 'class-validator';

class CreateCheckoutDto {
  @IsUUID()
  packageId!: string;
}

@Controller('subscriptions/checkouts')
@UseGuards(JwtAuthGuard)
export class SubscriptionCheckoutsController {
  constructor(private readonly checkouts: SubscriptionCheckoutsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCheckoutDto) {
    return this.checkouts.createCheckout(user.sub, dto.packageId);
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.checkouts.getCheckout(user.sub, id);
  }

  @Post(':id/payments')
  startPayment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartPaymentDto,
  ) {
    return this.checkouts.startPayment(user.sub, id, dto);
  }
}
