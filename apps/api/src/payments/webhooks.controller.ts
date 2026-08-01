import { Body, Controller, HttpCode, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { SubscriptionCheckoutsService } from '../subscriptions/subscription-checkouts.service';
import { PayHereService } from './payhere.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly payHere: PayHereService,
    private readonly orders: OrdersService,
    private readonly subscriptionCheckouts: SubscriptionCheckoutsService,
    private readonly prisma: PrismaService,
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

    if (String(payload.status_code) !== '2') {
      return { status: 'ok' };
    }

    const checkoutId = payload.order_id;
    const [order, subCheckout] = await Promise.all([
      this.prisma.order.findUnique({ where: { id: checkoutId }, select: { id: true } }),
      this.prisma.subscriptionCheckout.findUnique({ where: { id: checkoutId }, select: { id: true } }),
    ]);

    if (order) {
      await this.orders.confirmPayHereWebhook({
        orderId: checkoutId,
        paymentId: payload.payment_id,
        amount: payload.payhere_amount,
        currency: payload.payhere_currency,
      });
    } else if (subCheckout) {
      await this.subscriptionCheckouts.confirmPayHereWebhook({
        checkoutId,
        paymentId: payload.payment_id,
      });
    } else {
      this.logger.warn(`PayHere notify: unknown checkout id ${checkoutId}`);
    }

    return { status: 'ok' };
  }
}
