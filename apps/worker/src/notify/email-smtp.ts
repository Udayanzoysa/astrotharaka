import { createTransport } from 'nodemailer';
import { existsSync } from 'fs';
import { buildReportPdfEmail } from '@astro/shared';
import type { EmailNotifier, NotifySendResult, ReportReadyEmailMessage } from './types';
import { FileEmailNotifier } from './email-file';
import { loadSmtpConfig } from './smtp-config';

export class SmtpEmailNotifier implements EmailNotifier {
  readonly providerName = 'smtp';

  async sendReportReady(message: ReportReadyEmailMessage): Promise<NotifySendResult> {
    const cfg = await loadSmtpConfig();
    const built = buildReportPdfEmail({
      fullName: message.fullName,
      productName: message.productName,
      orderNumber: message.orderNumber,
      downloadUrl: message.downloadUrl,
      attached: Boolean(message.pdfPath && existsSync(message.pdfPath)),
    });

    if (!cfg.host || !cfg.user || !cfg.pass) {
      return new FileEmailNotifier().sendReportReady(message);
    }

    try {
      const transport = createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass },
      });

      const attachments =
        message.pdfPath && existsSync(message.pdfPath)
          ? [
              {
                filename: message.pdfFilename || `${message.orderNumber}.pdf`,
                path: message.pdfPath,
                contentType: 'application/pdf',
              },
            ]
          : undefined;

      const info = await transport.sendMail({
        from: cfg.from,
        to: message.to,
        subject: built.subject,
        text: built.text,
        html: built.html,
        attachments,
      });
      return {
        ok: true,
        provider: this.providerName,
        externalId: String(info.messageId ?? ''),
      };
    } catch (error) {
      console.warn(
        `[notify.email] SMTP failed, falling back to file: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
      return new FileEmailNotifier().sendReportReady(message);
    }
  }
}
