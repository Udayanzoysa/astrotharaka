import type { NotifySendResult, ReportReadyWhatsAppMessage, WhatsAppNotifier } from './types';
import { FileWhatsAppNotifier } from './whatsapp-file';

/**
 * Meta WhatsApp Cloud API — text message (sandbox / approved number).
 * Template messages can replace this later for production opt-in flows.
 */
export class MetaWhatsAppNotifier implements WhatsAppNotifier {
  readonly providerName = 'meta-whatsapp';
  private readonly token: string;
  private readonly phoneNumberId: string;
  private readonly apiVersion: string;

  constructor() {
    this.token = process.env.WHATSAPP_TOKEN?.trim() ?? '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? '';
    this.apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';
  }

  async sendReportReady(message: ReportReadyWhatsAppMessage): Promise<NotifySendResult> {
    const to = normalizeE164(message.toE164);
    if (!to) {
      return {
        ok: false,
        skipped: true,
        reason: 'invalid_whatsapp_number',
        provider: this.providerName,
      };
    }

    const text = [
      `Hello ${message.fullName}, your Taraka report is ready.`,
      `Product: ${message.productName}`,
      `Order: ${message.orderNumber}`,
      `Open: ${message.downloadUrl}`,
    ].join('\n');

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Meta WhatsApp HTTP ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = (await response.json()) as {
        messages?: Array<{ id?: string }>;
      };
      return {
        ok: true,
        provider: this.providerName,
        externalId: data.messages?.[0]?.id,
      };
    } catch (error) {
      console.warn(
        `[notify.whatsapp] Meta API failed, falling back to file: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
      return new FileWhatsAppNotifier().sendReportReady(message);
    }
  }
}

/** Strip non-digits except leading +; return digits-only for Cloud API */
export function normalizeE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, '');
  const only = digits.startsWith('+') ? digits.slice(1) : digits;
  if (only.length < 9 || only.length > 15) return null;
  return only;
}
