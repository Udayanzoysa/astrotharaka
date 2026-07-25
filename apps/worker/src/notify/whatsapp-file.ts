import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { NotifySendResult, ReportReadyWhatsAppMessage, WhatsAppNotifier } from './types';

function notificationsDir(): string {
  return process.env.NOTIFICATIONS_DIR
    ? process.env.NOTIFICATIONS_DIR
    : join(process.cwd(), 'uploads', 'notifications');
}

export class FileWhatsAppNotifier implements WhatsAppNotifier {
  readonly providerName = 'file-whatsapp';

  async sendReportReady(message: ReportReadyWhatsAppMessage): Promise<NotifySendResult> {
    const dir = join(notificationsDir(), 'whatsapp');
    mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = join(dir, `${stamp}-${message.orderNumber}.txt`);
    const body = [
      `To: ${message.toE164}`,
      `Kind: report_ready`,
      '',
      `Hello ${message.fullName}, your Taraka report is ready.`,
      `Product: ${message.productName}`,
      `Order: ${message.orderNumber}`,
      `Link: ${message.downloadUrl}`,
    ].join('\n');
    writeFileSync(path, body, 'utf8');
    console.log(`[notify.whatsapp] wrote ${path}`);
    return { ok: true, provider: this.providerName, externalId: path };
  }
}
