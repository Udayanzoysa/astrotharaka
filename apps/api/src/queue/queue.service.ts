import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  AstrologyCalculateJobPayload,
  GuestReportJobPayload,
  NotifyEmailJobPayload,
  NotifyWhatsAppJobPayload,
  QUEUE_NAMES,
  ReportGenerateJobPayload,
} from '@astro/shared';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly connection: { host: string; port: number; password?: string };
  private readonly astrologyQueue: Queue<AstrologyCalculateJobPayload>;
  private readonly reportQueue: Queue<ReportGenerateJobPayload>;
  private readonly guestReportQueue: Queue<GuestReportJobPayload>;
  private readonly emailQueue: Queue<NotifyEmailJobPayload>;
  private readonly whatsappQueue: Queue<NotifyWhatsAppJobPayload>;

  constructor(private readonly config: ConfigService) {
    this.connection = {
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.config.get('REDIS_PORT', 6379)),
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
    };

    this.astrologyQueue = new Queue(QUEUE_NAMES.ASTROLOGY_CALCULATE, {
      connection: this.connection,
    });
    this.reportQueue = new Queue(QUEUE_NAMES.REPORT_GENERATE, {
      connection: this.connection,
    });
    this.guestReportQueue = new Queue(QUEUE_NAMES.GUEST_REPORT, {
      connection: this.connection,
    });
    this.emailQueue = new Queue(QUEUE_NAMES.NOTIFY_EMAIL, {
      connection: this.connection,
    });
    this.whatsappQueue = new Queue(QUEUE_NAMES.NOTIFY_WHATSAPP, {
      connection: this.connection,
    });
  }

  async enqueueAstrologyCalculate(payload: AstrologyCalculateJobPayload): Promise<void> {
    try {
      await this.astrologyQueue.add('calculate', payload, {
        jobId: `astrology-${payload.requestId}`,
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to enqueue astrology job (Redis may be down): ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  async enqueueReportGenerate(payload: ReportGenerateJobPayload): Promise<void> {
    try {
      await this.reportQueue.add('generate', payload, {
        jobId: `report-${payload.requestId}`,
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to enqueue report job: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  async enqueueGuestReport(payload: GuestReportJobPayload): Promise<void> {
    await this.guestReportQueue.add('generate', payload, {
      jobId: `guest-${payload.guestReportId}`,
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async enqueueNotifyEmail(payload: NotifyEmailJobPayload, jobId?: string): Promise<void> {
    await this.emailQueue.add(payload.kind, payload, {
      jobId: jobId ?? `email-${payload.guestReportId || payload.reportId}-${Date.now()}`,
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async enqueueNotifyWhatsApp(payload: NotifyWhatsAppJobPayload, jobId?: string): Promise<void> {
    await this.whatsappQueue.add(payload.kind, payload, {
      jobId: jobId ?? `wa-${payload.guestReportId || payload.reportId}-${Date.now()}`,
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.astrologyQueue.close(),
      this.reportQueue.close(),
      this.guestReportQueue.close(),
      this.emailQueue.close(),
      this.whatsappQueue.close(),
    ]);
  }
}
