import { FileEmailNotifier } from './email-file';
import { SmtpEmailNotifier } from './email-smtp';
import { FileWhatsAppNotifier } from './whatsapp-file';
import { MetaWhatsAppNotifier } from './whatsapp-meta';
import type { EmailNotifier, WhatsAppNotifier } from './types';

/** Always try SMTP (DB/admin or env); SmtpEmailNotifier falls back to file. */
export function createEmailNotifier(): EmailNotifier {
  return new SmtpEmailNotifier();
}

export function createWhatsAppNotifier(): WhatsAppNotifier {
  if (process.env.WHATSAPP_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()) {
    return new MetaWhatsAppNotifier();
  }
  return new FileWhatsAppNotifier();
}

export type {
  EmailNotifier,
  WhatsAppNotifier,
  ReportReadyEmailMessage,
  ReportReadyWhatsAppMessage,
  NotifySendResult,
} from './types';
