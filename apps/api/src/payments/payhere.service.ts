import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type PayHereCheckoutFields = {
  actionUrl: string;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  hash: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
};

@Injectable()
export class PayHereService {
  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.merchantId() && this.merchantSecret());
  }

  mode(): 'sandbox' | 'live' {
    return this.config.get<string>('PAYHERE_MODE', 'sandbox') === 'live' ? 'live' : 'sandbox';
  }

  actionUrl(): string {
    return this.mode() === 'live'
      ? 'https://www.payhere.lk/pay/checkout'
      : 'https://sandbox.payhere.lk/pay/checkout';
  }

  buildCheckout(input: {
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: string;
    itemName: string;
    customer?: { fullName?: string; email?: string; phone?: string };
    returnPath?: string;
    cancelPath?: string;
  }): PayHereCheckoutFields {
    const merchantId = this.merchantId();
    const secret = this.merchantSecret();
    if (!merchantId || !secret) {
      throw new Error('PayHere is not configured');
    }

    const amount = this.formatAmount(input.amount);
    const currency = (input.currency || 'LKR').toUpperCase();
    const hash = this.checkoutHash(merchantId, input.orderId, amount, currency, secret);

    const nameParts = (input.customer?.fullName ?? 'Customer').trim().split(/\s+/);
    const firstName = nameParts[0] ?? 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'Taraka';

    const returnBase = this.config
      .get<string>('PAYHERE_RETURN_URL', 'http://localhost:3001/orders')
      .replace(/\/$/, '');
    const cancelBase = this.config
      .get<string>('PAYHERE_CANCEL_URL', 'http://localhost:3001/orders')
      .replace(/\/$/, '');

    const returnUrl = input.returnPath ?? `${returnBase}/${input.orderId}?payhere=return`;
    const cancelUrl = input.cancelPath ?? `${cancelBase}/${input.orderId}?payhere=cancel`;

    return {
      actionUrl: this.actionUrl(),
      merchant_id: merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: this.config.get<string>(
        'PAYHERE_NOTIFY_URL',
        'http://localhost:3000/api/v1/webhooks/payhere',
      ),
      order_id: input.orderId,
      items: input.itemName.slice(0, 100),
      currency,
      amount,
      hash,
      first_name: firstName,
      last_name: lastName,
      email: input.customer?.email,
      phone: input.customer?.phone,
      address: 'Colombo',
      city: 'Colombo',
      country: 'Sri Lanka',
    };
  }

  verifyNotify(payload: Record<string, string>): boolean {
    const secret = this.merchantSecret();
    const merchantId = this.merchantId();
    if (!secret || !merchantId) return false;

    const localSig = this.md5Upper(
      merchantId +
        payload.order_id +
        payload.payhere_amount +
        payload.payhere_currency +
        payload.status_code +
        this.md5Upper(secret),
    );

    return localSig === (payload.md5sig ?? '').toUpperCase();
  }

  formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  private checkoutHash(
    merchantId: string,
    orderId: string,
    amount: string,
    currency: string,
    secret: string,
  ): string {
    return this.md5Upper(merchantId + orderId + amount + currency + this.md5Upper(secret));
  }

  private md5Upper(value: string): string {
    return createHash('md5').update(value).digest('hex').toUpperCase();
  }

  private merchantId(): string {
    return this.config.get<string>('PAYHERE_MERCHANT_ID', '').trim();
  }

  private merchantSecret(): string {
    return this.config.get<string>('PAYHERE_MERCHANT_SECRET', '').trim();
  }
}
