import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';
import { OrdersService } from '../orders/orders.service';
import { SubscriptionCheckoutsService } from '../subscriptions/subscription-checkouts.service';
import { PayHereService } from './payhere.service';

class SandboxCompleteDto {
  @IsUUID()
  orderId!: string;

  @IsOptional()
  @IsString()
  paymentId?: string;
}

class SubscriptionSandboxCompleteDto {
  @IsUUID()
  checkoutId!: string;

  @IsOptional()
  @IsString()
  paymentId?: string;
}

/**
 * Local/sandbox helpers. PayHere cannot POST notify to localhost;
 * after checkout return, the web app calls sandbox-complete.
 */
@Controller('public/payments/payhere')
export class PayHerePublicController {
  constructor(
    private readonly payHere: PayHereService,
    private readonly orders: OrdersService,
    private readonly subscriptionCheckouts: SubscriptionCheckoutsService,
  ) {}

  @Post('sandbox-complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async sandboxComplete(@CurrentUser() user: JwtPayload, @Body() dto: SandboxCompleteDto) {
    if (this.payHere.mode() === 'live') {
      throw new ForbiddenException('sandbox-complete is disabled in live mode');
    }
    if (!this.payHere.isConfigured()) {
      throw new ForbiddenException('PayHere is not configured');
    }

    await this.orders.getMine(user.sub, dto.orderId);

    return this.orders.confirmPayHereWebhook({
      orderId: dto.orderId,
      paymentId: dto.paymentId ?? `sandbox-${Date.now()}`,
    });
  }

  @Post('subscription-sandbox-complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async subscriptionSandboxComplete(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubscriptionSandboxCompleteDto,
  ) {
    if (this.payHere.mode() === 'live') {
      throw new ForbiddenException('sandbox-complete is disabled in live mode');
    }
    if (!this.payHere.isConfigured()) {
      throw new ForbiddenException('PayHere is not configured');
    }

    await this.subscriptionCheckouts.getCheckout(user.sub, dto.checkoutId);

    return this.subscriptionCheckouts.confirmPayHereWebhook({
      checkoutId: dto.checkoutId,
      paymentId: dto.paymentId ?? `sandbox-${Date.now()}`,
    });
  }

  /** Alias notify path for PayHere dashboard configs / ngrok tunnels */
  @Post('notify')
  @HttpCode(200)
  async notifyAlias(@Body() body: Record<string, string>) {
    if (!this.payHere.verifyNotify(body)) {
      return { status: 'invalid_signature' };
    }
    if (String(body.status_code) === '2') {
      await this.orders.confirmPayHereWebhook({
        orderId: body.order_id,
        paymentId: body.payment_id,
        amount: body.payhere_amount,
        currency: body.payhere_currency,
      });
    }
    return { status: 'ok' };
  }
}
