import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { EmailNotifier, NotifySendResult, ReportReadyEmailMessage } from './types';

function notificationsDir(): string {
  return process.env.NOTIFICATIONS_DIR
    ? process.env.NOTIFICATIONS_DIR
    : join(process.cwd(), 'uploads', 'notifications');
}

export class FileEmailNotifier implements EmailNotifier {
  readonly providerName = 'file-email';

  async sendReportReady(message: ReportReadyEmailMessage): Promise<NotifySendResult> {
    const dir = join(notificationsDir(), 'email');
    mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = join(dir, `${stamp}-${message.orderNumber}.txt`);
    const body = [
      `To: ${message.to}`,
      `Subject: Taraka — your report is ready (${message.orderNumber})`,
      '',
      `Hello ${message.fullName},`,
      '',
      `Your ${message.productName} is ready.`,
      `Order: ${message.orderNumber}`,
      `Language: ${message.language}`,
      '',
      `Open your account to download:`,
      message.downloadUrl,
      '',
      '— Taraka (තාරකා)',
    ].join('\n');
    writeFileSync(path, body, 'utf8');
    console.log(`[notify.email] wrote ${path}`);
    return { ok: true, provider: this.providerName, externalId: path };
  }
}
