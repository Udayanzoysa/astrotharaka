import { Body, Controller, HttpCode, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from '../orders/orders.service';
import { PayHereService } from './payhere.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly payHere: PayHereService,
    private readonly orders: OrdersService,
  ) {}

  /**
   * PayHere server-to-server notify URL (form-urlencoded).
   * Must remain public (no JWT).
   */
  @Post('payhere')
  @HttpCode(200)
  async payHereNotify(@Req() req: Request, @Body() body: Record<string, string>) {
    const payload = { ...body, ...(req.body as Record<string, string>) };
    this.logger.log(`PayHere notify order_id=${payload.order_id} status=${payload.status_code}`);

    if (!this.payHere.verifyNotify(payload)) {
      this.logger.warn('PayHere notify signature invalid');
      return { status: 'invalid_signature' };
    }

    // status_code 2 = success
    if (String(payload.status_code) === '2') {
      await this.orders.confirmPayHereWebhook({
        orderId: payload.order_id,
        paymentId: payload.payment_id,
        amount: payload.payhere_amount,
        currency: payload.payhere_currency,
      });
    }

    return { status: 'ok' };
  }
}
