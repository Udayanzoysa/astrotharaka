import 'dotenv/config';
import { Queue, Worker, Job } from 'bullmq';
import { PrismaClient, OrderStatus, ReportStatus } from '@prisma/client';
import {
  AstrologyCalculateJobPayload,
  GuestReportJobPayload,
  NotifyEmailJobPayload,
  NotifyWhatsAppJobPayload,
  QUEUE_NAMES,
  ReportGenerateJobPayload,
} from '@astro/shared';
import { calculateChart } from './astrology-client';
import { createNarrativeAdapter } from './ai';
import { guestReportPdfPath, reportPdfPath } from './pdf-report';
import { renderReportPdfSmart } from './pdf';
import { closeChromiumBrowser } from './pdf/chromium-pdf';
import { writeKundaliSvg } from './kundali';
import { createEmailNotifier, createWhatsAppNotifier } from './notify';
import { handleNotifyEmail, handleNotifyWhatsApp } from './notify/handlers';
import { bindSmtpPrisma } from './notify/smtp-config';
import type { ChartResult } from './chart/types';
import { birthDateIso, birthTimeIso } from './birth-datetime';

function assertRealChart(chart: ChartResult, context: string): void {
  if (!chart.placeholder) return;
  const isProd = (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
  const allowStub = !isProd && process.env.ALLOW_PLACEHOLDER_CHART === 'true';
  const msg =
    'Accurate Lagna requires astrology-engine (Swiss Ephemeris). Start the engine at ASTROLOGY_ENGINE_URL — refusing placeholder chart.';
  console.error(`[${context}] ${msg}`);
  if (!allowStub) {
    throw new Error(msg);
  }
  console.warn(`[${context}] ALLOW_PLACEHOLDER_CHART=true — continuing with stub`);
}

function productNameForLanguage(
  product: { nameEn: string; nameSi: string | null; nameTa: string | null },
  language: string,
): string {
  if (language === 'si') return product.nameSi || product.nameEn;
  if (language === 'ta') return product.nameTa || product.nameEn;
  return product.nameEn;
}

function guestProductName(language: string, full: boolean): string {
  if (full) {
    if (language === 'si') return 'මූලික උපන් සිතියම් වාර්තාව';
    if (language === 'ta') return 'அடிப்படை பிறப்பு வரைபட அறிக்கை';
    return 'Basic Birth Chart Report';
  }
  if (language === 'si') return 'නොමිලේ ක්ෂණික ජාතක වාර්තාව';
  if (language === 'ta') return 'இலவச உடனடி ஜாதக அறிக்கை';
  return 'Free Instant Birth Report';
}

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

const prisma = new PrismaClient();
bindSmtpPrisma(prisma);
const narrativeAdapter = createNarrativeAdapter();

const emailQueue = new Queue<NotifyEmailJobPayload>(QUEUE_NAMES.NOTIFY_EMAIL, { connection });
const whatsappQueue = new Queue<NotifyWhatsAppJobPayload>(QUEUE_NAMES.NOTIFY_WHATSAPP, {
  connection,
});

async function handleAstrology(job: Job<AstrologyCalculateJobPayload>): Promise<ChartResult> {
  const payload = job.data;
  console.log(`[astrology.calculate] job=${job.id} birthProfileId=${payload.birthProfileId}`);

  const birth = await prisma.birthProfile.findUnique({ where: { id: payload.birthProfileId } });
  if (!birth) {
    throw new Error(`Birth profile ${payload.birthProfileId} not found`);
  }

  return calculateChart({
    birthProfileId: birth.id,
    fullName: birth.fullName,
    birthDate: birthDateIso(birth.birthDate),
    birthTime: birth.unknownBirthTime ? null : birthTimeIso(birth.birthTime),
    unknownBirthTime: birth.unknownBirthTime,
    latitude: birth.latitude,
    longitude: birth.longitude,
    timezone: birth.timezone,
    language: birth.preferredLanguage,
  });
}

async function enqueueNotifyJobs(input: {
  orderId: string;
  reportId: string;
  userId: string;
}): Promise<void> {
  const payload = {
    orderId: input.orderId,
    reportId: input.reportId,
    userId: input.userId,
    kind: 'report_ready' as const,
  };
  try {
    await emailQueue.add('report_ready', payload, {
      jobId: `email-${input.reportId}`,
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    await whatsappQueue.add('report_ready', payload, {
      jobId: `wa-${input.reportId}`,
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  } catch (error) {
    console.warn(
      `[report.generate] notify enqueue failed: ${
        error instanceof Error ? error.message : 'unknown'
      }`,
    );
  }
}

async function failReport(requestId: string, orderId: string, message: string): Promise<void> {
  await prisma.generatedReport.update({
    where: { id: requestId },
    data: { status: ReportStatus.FAILED, errorMessage: message.slice(0, 1000) },
  });
  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.FAILED },
  });
}

async function handleReportGenerate(job: Job<ReportGenerateJobPayload>): Promise<unknown> {
  const { orderId, requestId, birthProfileId, language } = job.data;
  console.log(`[report.generate] order=${orderId} report=${requestId} language=${language}`);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true, birthProfile: true },
    });
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const report = await prisma.generatedReport.findUniqueOrThrow({ where: { id: requestId } });
    const birth = order.birthProfile;

    await prisma.generatedReport.update({
      where: { id: requestId },
      data: { status: ReportStatus.CALCULATING, errorMessage: null },
    });

    const chart = await calculateChart({
      birthProfileId: birthProfileId || birth.id,
      fullName: birth.fullName,
      birthDate: birthDateIso(birth.birthDate),
      birthTime: birth.unknownBirthTime ? null : birthTimeIso(birth.birthTime),
      unknownBirthTime: birth.unknownBirthTime,
      latitude: birth.latitude,
      longitude: birth.longitude,
      timezone: birth.timezone,
      language: String(language),
    });
    assertRealChart(chart, `report.generate order=${orderId}`);

    await prisma.generatedReport.update({
      where: { id: requestId },
      data: {
        status: ReportStatus.GENERATING_CONTENT,
        engineVersion: chart.engineVersion,
        aiModel: narrativeAdapter.modelName,
      },
    });

    const profileGender = (
      await prisma.customerProfile.findUnique({
        where: { userId: order.userId },
        select: { gender: true },
      })
    )?.gender;

    const narrative = await narrativeAdapter.generate({
      language: String(language),
      productSlug: order.product.slug,
      productName: productNameForLanguage(order.product, String(language)),
      fullName: birth.fullName,
      birthPlace: birth.birthPlaceName,
      birthDate: birthDateIso(birth.birthDate),
      unknownBirthTime: birth.unknownBirthTime,
      orderNumber: order.orderNumber,
      chart,
      gender: profileGender,
    });

    await prisma.generatedReport.update({
      where: { id: requestId },
      data: {
        status: ReportStatus.RENDERING_PDF,
        contentText: narrative.plainText,
        title: narrative.title,
        aiModel: narrative.aiModel,
        engineVersion: chart.engineVersion,
      },
    });

    const pdfPath = reportPdfPath(order.orderNumber, report.version);
    const svgPath = writeKundaliSvg({
      orderNumber: order.orderNumber,
      version: report.version,
      chart,
      fullName: birth.fullName,
    });
    const pdfResult = await renderReportPdfSmart({
      outputPath: pdfPath,
      title: narrative.title,
      orderNumber: order.orderNumber,
      fullName: birth.fullName,
      birthPlace: birth.birthPlaceName,
      birthDate: birthDateIso(birth.birthDate),
      language: String(language),
      unknownBirthTime: birth.unknownBirthTime,
      gender: profileGender,
      chart,
      sections: narrative.sections,
    });
    console.log(`[pdf] order=${order.orderNumber} engine=${pdfResult.engine} path=${pdfPath}`);

    await prisma.generatedReport.update({
      where: { id: requestId },
      data: {
        status: ReportStatus.READY,
        pdfStorageKey: pdfPath,
        downloadUrl: `/api/v1/orders/${orderId}/report/file`,
        readyAt: new Date(),
        errorMessage: null,
        contentText: narrative.plainText,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
    });

    await enqueueNotifyJobs({
      orderId,
      reportId: requestId,
      userId: order.userId,
    });

    console.log(
      `[report.generate] completed order=${orderId} pdf=${pdfPath} svg=${svgPath} ai=${narrative.aiModel}`,
    );
    return { ok: true, orderId, requestId, pdfPath, svgPath, aiModel: narrative.aiModel };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Report generation failed';
    console.error(`[report.generate] failed order=${orderId}: ${message}`);
    await failReport(requestId, orderId, message);
    throw error;
  }
}

async function handleGuestReport(job: Job<GuestReportJobPayload>): Promise<unknown> {
  const { guestReportId } = job.data;
  console.log(`[guest.report] id=${guestReportId}`);

  try {
    const guest = await prisma.guestReport.findUnique({ where: { id: guestReportId } });
    if (!guest) {
      throw new Error(`Guest report ${guestReportId} not found`);
    }

    const language = String(guest.language);
    const orderNumber = `GUEST-${guestReportId.slice(0, 8).toUpperCase()}`;

    await prisma.guestReport.update({
      where: { id: guestReportId },
      data: { status: ReportStatus.CALCULATING, errorMessage: null },
    });

    const chart = await calculateChart({
      birthProfileId: guestReportId,
      fullName: guest.fullName,
      birthDate: birthDateIso(guest.birthDate),
      birthTime: guest.unknownBirthTime ? null : birthTimeIso(guest.birthTime),
      unknownBirthTime: guest.unknownBirthTime,
      latitude: guest.latitude,
      longitude: guest.longitude,
      timezone: guest.timezone,
      language,
    });

    assertRealChart(chart, `guest.report id=${guestReportId}`);

    await prisma.guestReport.update({
      where: { id: guestReportId },
      data: {
        status: ReportStatus.GENERATING_CONTENT,
        engineVersion: chart.engineVersion,
        aiModel: narrativeAdapter.modelName,
      },
    });

    const fullReport = guest.fullUnlocked === true && guest.isFreePreview === false;

    const narrative = await narrativeAdapter.generate({
      language,
      productSlug: fullReport ? 'guest-full' : 'guest-instant',
      productName: guestProductName(language, fullReport),
      fullName: guest.fullName,
      gender: guest.gender,
      email: guest.email,
      mobile: guest.mobile,
      birthPlace: guest.birthPlaceName,
      birthDate: birthDateIso(guest.birthDate),
      unknownBirthTime: guest.unknownBirthTime,
      orderNumber,
      fullReport,
      focusTopics: Array.isArray(guest.focusTopics) ? guest.focusTopics : [],
      chart,
    });

    await prisma.guestReport.update({
      where: { id: guestReportId },
      data: {
        status: ReportStatus.RENDERING_PDF,
        contentText: narrative.plainText,
        title: narrative.title,
        aiModel: narrative.aiModel,
        engineVersion: chart.engineVersion,
      },
    });

    const pdfPath = guestReportPdfPath(guestReportId);
    const svgPath = writeKundaliSvg({
      orderNumber,
      version: 1,
      chart,
      fullName: guest.fullName,
    });
    const pdfResult = await renderReportPdfSmart({
      outputPath: pdfPath,
      title: narrative.title,
      orderNumber,
      fullName: guest.fullName,
      birthPlace: guest.birthPlaceName,
      birthDate: birthDateIso(guest.birthDate),
      language,
      unknownBirthTime: guest.unknownBirthTime,
      gender: guest.gender,
      chart,
      sections: narrative.sections,
    });
    console.log(`[pdf] guest=${guestReportId} engine=${pdfResult.engine} path=${pdfPath}`);

    await prisma.guestReport.update({
      where: { id: guestReportId },
      data: {
        status: ReportStatus.READY,
        pdfStorageKey: pdfPath,
        readyAt: new Date(),
        errorMessage: null,
        contentText: narrative.plainText,
      },
    });

    console.log(
      `[guest.report] completed id=${guestReportId} pdf=${pdfPath} svg=${svgPath} ai=${narrative.aiModel}`,
    );
    return { ok: true, guestReportId, pdfPath, svgPath, aiModel: narrative.aiModel };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Guest report generation failed';
    console.error(`[guest.report] failed id=${guestReportId}: ${message}`);
    await prisma.guestReport.update({
      where: { id: guestReportId },
      data: { status: ReportStatus.FAILED, errorMessage: message.slice(0, 1000) },
    });
    throw error;
  }
}

async function handleStub(job: Job, label: string): Promise<{ ok: true }> {
  console.log(`[${label}] job=${job.id} data=${JSON.stringify(job.data)}`);
  return { ok: true };
}

const emailNotifier = createEmailNotifier();
const whatsappNotifier = createWhatsAppNotifier();

const workers = [
  new Worker(QUEUE_NAMES.ASTROLOGY_CALCULATE, handleAstrology, { connection }),
  new Worker(QUEUE_NAMES.REPORT_GENERATE, handleReportGenerate, { connection }),
  new Worker(QUEUE_NAMES.GUEST_REPORT, handleGuestReport, { connection }),
  new Worker(QUEUE_NAMES.PDF_RENDER, (job) => handleStub(job, QUEUE_NAMES.PDF_RENDER), {
    connection,
  }),
  new Worker(
    QUEUE_NAMES.NOTIFY_EMAIL,
    async (job: Job<NotifyEmailJobPayload>) => {
      const result = await handleNotifyEmail(prisma, job.data);
      console.log(`[notify.email] result=${JSON.stringify(result)}`);
      return result;
    },
    { connection },
  ),
  new Worker(
    QUEUE_NAMES.NOTIFY_WHATSAPP,
    async (job: Job<NotifyWhatsAppJobPayload>) => {
      const result = await handleNotifyWhatsApp(prisma, job.data);
      console.log(`[notify.whatsapp] result=${JSON.stringify(result)}`);
      return result;
    },
    { connection },
  ),
];

for (const worker of workers) {
  worker.on('failed', (job, err) => {
    console.error(`[worker] queue=${worker.name} job=${job?.id} failed: ${err.message}`);
  });
  worker.on('completed', (job) => {
    console.log(`[worker] queue=${worker.name} job=${job.id} completed`);
  });
}

console.log(
  `AstroGuruAI worker started (narrative=${narrativeAdapter.modelName}, email=${emailNotifier.providerName}, whatsapp=${whatsappNotifier.providerName}). Listening on BullMQ queues...`,
);

async function shutdown(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
  await Promise.all([emailQueue.close(), whatsappQueue.close()]);
  await closeChromiumBrowser();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
