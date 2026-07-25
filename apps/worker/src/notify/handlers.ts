import type { PrismaClient } from '@prisma/client';
import type { NotifyEmailJobPayload, NotifyWhatsAppJobPayload } from '@astro/shared';
import { createEmailNotifier, createWhatsAppNotifier } from './index';
import type { NotifySendResult } from './types';
import { resolvePdfPath } from './resolve-pdf';

function webBaseUrl(): string {
  return (process.env.WEB_APP_URL ?? 'http://localhost:3001').replace(/\/$/, '');
}

function orderDownloadUrl(orderId: string): string {
  return `${webBaseUrl()}/orders/${orderId}`;
}

function guestDownloadUrl(token: string): string {
  return `${webBaseUrl()}/guest-report/${encodeURIComponent(token)}`;
}

export async function handleNotifyEmail(
  prisma: PrismaClient,
  payload: NotifyEmailJobPayload,
): Promise<NotifySendResult> {
  const notifier = createEmailNotifier();

  if (payload.kind === 'guest_report_ready') {
    return sendGuestEmail(prisma, payload, notifier);
  }

  if (payload.kind !== 'report_ready') {
    return {
      ok: false,
      skipped: true,
      reason: `unsupported_kind:${payload.kind}`,
      provider: notifier.providerName,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { profile: true },
  });
  const order = payload.orderId
    ? await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: { product: true, birthProfile: true },
      })
    : null;
  const report = payload.reportId
    ? await prisma.generatedReport.findUnique({ where: { id: payload.reportId } })
    : null;

  if (!user?.email || !order || !report) {
    return {
      ok: false,
      skipped: true,
      reason: 'missing_user_order_or_report',
      provider: notifier.providerName,
    };
  }

  const attach = payload.attachPdf !== false;
  const pdfPath = attach ? resolvePdfPath(report.pdfStorageKey) : null;

  return notifier.sendReportReady({
    to: user.email,
    fullName: user.profile?.fullName ?? order.birthProfile.fullName,
    orderNumber: order.orderNumber,
    productName: order.product.nameEn,
    orderId: order.id,
    reportId: report.id,
    language: String(order.language),
    downloadUrl: orderDownloadUrl(order.id),
    pdfPath,
    pdfFilename: `${order.orderNumber}.pdf`,
  });
}

export async function handleNotifyWhatsApp(
  prisma: PrismaClient,
  payload: NotifyWhatsAppJobPayload,
): Promise<NotifySendResult> {
  const notifier = createWhatsAppNotifier();

  if (payload.kind === 'guest_report_ready') {
    return sendGuestWhatsApp(prisma, payload, notifier.providerName, (msg) =>
      notifier.sendReportReady(msg),
    );
  }

  if (payload.kind !== 'report_ready') {
    return {
      ok: false,
      skipped: true,
      reason: `unsupported_kind:${payload.kind}`,
      provider: notifier.providerName,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { profile: true },
  });
  const order = payload.orderId
    ? await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: { product: true, birthProfile: true },
      })
    : null;
  const report = payload.reportId
    ? await prisma.generatedReport.findUnique({ where: { id: payload.reportId } })
    : null;

  if (!order || !report) {
    return {
      ok: false,
      skipped: true,
      reason: 'missing_order_or_report',
      provider: notifier.providerName,
    };
  }

  const to = user?.profile?.whatsappNumber?.trim() || user?.profile?.mobileNumber?.trim();
  if (!to) {
    return {
      ok: false,
      skipped: true,
      reason: 'no_whatsapp_or_mobile_number',
      provider: notifier.providerName,
    };
  }

  return notifier.sendReportReady({
    toE164: to,
    fullName: user?.profile?.fullName ?? order.birthProfile.fullName,
    orderNumber: order.orderNumber,
    productName: order.product.nameEn,
    orderId: order.id,
    reportId: report.id,
    language: String(order.language),
    downloadUrl: orderDownloadUrl(order.id),
  });
}

async function sendGuestEmail(
  prisma: PrismaClient,
  payload: NotifyEmailJobPayload,
  notifier: {
    providerName: string;
    sendReportReady: (message: {
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
    }) => Promise<NotifySendResult>;
  },
): Promise<NotifySendResult> {
  if (!payload.guestReportId) {
    return {
      ok: false,
      skipped: true,
      reason: 'missing_guest_report_id',
      provider: notifier.providerName,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { profile: true },
  });
  const guest = await prisma.guestReport.findUnique({ where: { id: payload.guestReportId } });
  if (!user?.email || !guest) {
    return {
      ok: false,
      skipped: true,
      reason: 'missing_user_or_guest_report',
      provider: notifier.providerName,
    };
  }

  const token = payload.downloadToken || guest.downloadToken;
  const orderNumber = `GUEST-${guest.id.slice(0, 8).toUpperCase()}`;
  const attach = payload.attachPdf !== false;
  const pdfPath = attach ? resolvePdfPath(guest.pdfStorageKey) : null;

  return notifier.sendReportReady({
    to: user.email,
    fullName: user.profile?.fullName ?? guest.fullName,
    orderNumber,
    productName: guest.title || 'Full horoscope report',
    orderId: guest.id,
    reportId: guest.id,
    language: String(guest.language),
    downloadUrl: guestDownloadUrl(token),
    pdfPath,
    pdfFilename: `taraka-guest-${guest.fullName.replace(/[^\w.-]+/g, '_').slice(0, 40) || 'report'}.pdf`,
  });
}

async function sendGuestWhatsApp(
  prisma: PrismaClient,
  payload: NotifyWhatsAppJobPayload,
  providerName: string,
  send: (msg: {
    toE164: string;
    fullName: string;
    orderNumber: string;
    productName: string;
    orderId: string;
    reportId: string;
    language: string;
    downloadUrl: string;
  }) => Promise<NotifySendResult>,
): Promise<NotifySendResult> {
  if (!payload.guestReportId) {
    return { ok: false, skipped: true, reason: 'missing_guest_report_id', provider: providerName };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { profile: true },
  });
  const guest = await prisma.guestReport.findUnique({ where: { id: payload.guestReportId } });
  if (!guest) {
    return {
      ok: false,
      skipped: true,
      reason: 'missing_guest_report',
      provider: providerName,
    };
  }

  const to = user?.profile?.whatsappNumber?.trim() || user?.profile?.mobileNumber?.trim();
  if (!to) {
    return {
      ok: false,
      skipped: true,
      reason: 'no_whatsapp_or_mobile_number',
      provider: providerName,
    };
  }

  const token = payload.downloadToken || guest.downloadToken;
  const orderNumber = `GUEST-${guest.id.slice(0, 8).toUpperCase()}`;
  return send({
    toE164: to,
    fullName: user?.profile?.fullName ?? guest.fullName,
    orderNumber,
    productName: guest.title || 'Full horoscope report',
    orderId: guest.id,
    reportId: guest.id,
    language: String(guest.language),
    downloadUrl: guestDownloadUrl(token),
  });
}
