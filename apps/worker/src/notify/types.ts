export type NotifySendResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  provider: string;
  externalId?: string;
};

export type ReportReadyEmailMessage = {
  to: string;
  fullName: string;
  orderNumber: string;
  productName: string;
  orderId: string;
  reportId: string;
  language: string;
  downloadUrl: string;
  pdfPath?: string | null;
  pdfFilename?: string;
};

export type ReportReadyWhatsAppMessage = {
  toE164: string;
  fullName: string;
  orderNumber: string;
  productName: string;
  orderId: string;
  reportId: string;
  language: string;
  downloadUrl: string;
};

export interface EmailNotifier {
  readonly providerName: string;
  sendReportReady(message: ReportReadyEmailMessage): Promise<NotifySendResult>;
}

export interface WhatsAppNotifier {
  readonly providerName: string;
  sendReportReady(message: ReportReadyWhatsAppMessage): Promise<NotifySendResult>;
}
