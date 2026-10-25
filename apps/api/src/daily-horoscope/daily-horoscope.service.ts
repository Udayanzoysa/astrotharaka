import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DailyHoroscopeAiGenerator } from './ai-generator';
import { FacebookPublisher } from './facebook-publisher';
import { DailyHoroscopePayload, LagnaPrediction, PanchangaData } from './types';
import { HoroscopePeriod } from '@prisma/client';

@Injectable()
export class DailyHoroscopeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DailyHoroscopeService.name);
  private readonly aiGenerator = new DailyHoroscopeAiGenerator();
  private readonly facebookPublisher = new FacebookPublisher();
  private cronInterval: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log('DailyHoroscopeService initialized. Starting morning cron worker...');
    // Run an initial check 5 seconds after startup
    setTimeout(() => {
      this.checkAndRunMorningCron().catch((err) =>
        this.logger.error(`Initial morning cron check failed: ${err.message}`),
      );
    }, 5000);

    // Periodic check every 15 minutes
    this.cronInterval = setInterval(
      () => {
        this.checkAndRunMorningCron().catch((err) =>
          this.logger.error(`Periodic morning cron check failed: ${err.message}`),
        );
      },
      15 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.cronInterval) {
      clearInterval(this.cronInterval);
      this.cronInterval = null;
    }
  }

  /**
   * Returns current Sri Lanka date string (YYYY-MM-DD)
   */
  getTodayDateStr(): string {
    const now = new Date();
    // UTC+5:30 for Sri Lanka
    const slOffset = 5.5 * 60 * 60 * 1000;
    const slDate = new Date(now.getTime() + slOffset);
    return slDate.toISOString().slice(0, 10);
  }

  /**
   * Retrieve today's horoscope. If not found, generate it on demand.
   */
  async getToday(period: HoroscopePeriod = HoroscopePeriod.DAILY) {
    const todayStr = this.getTodayDateStr();
    return this.getByDate(todayStr, period);
  }

  /**
   * Retrieve horoscope for a specific date / periodKey.
   */
  async getByDate(dateStr: string, period: HoroscopePeriod = HoroscopePeriod.DAILY) {
    const existing = await this.prisma.dailyHoroscope.findUnique({
      where: {
        period_periodKey: {
          period,
          periodKey: dateStr,
        },
      },
    });

    if (existing) {
      return this.parseRecord(existing);
    }

    // Auto-generate on first request
    return this.generateAndSave(dateStr, period, false, false);
  }

  /**
   * Generate and persist horoscope for date.
   */
  async generateAndSave(
    dateStr: string,
    period: HoroscopePeriod = HoroscopePeriod.DAILY,
    force = false,
    publishSocial = false,
    aiProviderPreference?: 'gemini' | 'openai',
  ) {
    if (!force) {
      const existing = await this.prisma.dailyHoroscope.findUnique({
        where: {
          period_periodKey: {
            period,
            periodKey: dateStr,
          },
        },
      });
      if (existing) return existing;
    }

    this.logger.log(`Generating daily horoscope for date: ${dateStr} (force=${force}, ai=${aiProviderPreference || 'auto'})`);
    const { payload, aiProvider, aiModel } = await this.aiGenerator.generate(dateStr, aiProviderPreference);

    let socialPostedAt: Date | null = null;
    let socialPostId: string | null = null;
    let socialPostStatus = 'PENDING';

    if (publishSocial) {
      const pubResult = await this.facebookPublisher.publish(payload);
      if (pubResult.success) {
        socialPostedAt = new Date();
        socialPostId = pubResult.postId || null;
        socialPostStatus = 'POSTED';
      } else {
        socialPostStatus = pubResult.error ? `FAILED: ${pubResult.error}` : 'SKIPPED';
      }
    }

    const stringifiedDateDisplay =
      typeof payload.dateDisplay === 'string'
        ? payload.dateDisplay
        : JSON.stringify(payload.dateDisplay);

    const stringifiedGeneralNotes =
      typeof payload.generalNotes === 'string'
        ? payload.generalNotes
        : JSON.stringify(payload.generalNotes);

    const stringifiedSocialPost =
      typeof payload.socialPost === 'string'
        ? payload.socialPost
        : payload.socialPost
        ? JSON.stringify(payload.socialPost)
        : null;

    const saved = await this.prisma.dailyHoroscope.upsert({
      where: {
        period_periodKey: {
          period,
          periodKey: dateStr,
        },
      },
      create: {
        period,
        periodKey: dateStr,
        dateDisplay: stringifiedDateDisplay,
        panchanga: payload.panchanga as any,
        generalNotes: stringifiedGeneralNotes,
        lagnaPredictions: payload.lagnaPredictions as any,
        socialPost: stringifiedSocialPost,
        socialPostedAt,
        socialPostId,
        socialPostStatus,
        aiProvider,
        aiModel,
      },
      update: {
        dateDisplay: stringifiedDateDisplay,
        panchanga: payload.panchanga as any,
        generalNotes: stringifiedGeneralNotes,
        lagnaPredictions: payload.lagnaPredictions as any,
        socialPost: stringifiedSocialPost,
        ...(publishSocial
          ? { socialPostedAt, socialPostId, socialPostStatus }
          : {}),
        aiProvider,
        aiModel,
      },
    });

    return this.parseRecord(saved);
  }

  parseRecord(record: any) {
    if (!record) return null;
    const parseField = (val: any) => {
      if (typeof val !== 'string') return val;
      try {
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {}
      return val;
    };

    return {
      ...record,
      dateDisplay: parseField(record.dateDisplay),
      generalNotes: parseField(record.generalNotes),
      socialPost: parseField(record.socialPost),
    };
  }

  /**
   * Admin update of existing horoscope content (General notes, lagna predictions, panchanga, social post).
   */
  async updateHoroscope(
    dateStr: string,
    updateData: {
      dateDisplay?: string;
      panchanga?: PanchangaData;
      generalNotes?: string;
      lagnaPredictions?: LagnaPrediction[];
      socialPost?: string;
    },
    period: HoroscopePeriod = HoroscopePeriod.DAILY,
  ) {
    return this.prisma.dailyHoroscope.update({
      where: {
        period_periodKey: {
          period,
          periodKey: dateStr,
        },
      },
      data: {
        ...(updateData.dateDisplay ? { dateDisplay: updateData.dateDisplay } : {}),
        ...(updateData.panchanga ? { panchanga: updateData.panchanga as any } : {}),
        ...(updateData.generalNotes ? { generalNotes: updateData.generalNotes } : {}),
        ...(updateData.lagnaPredictions
          ? { lagnaPredictions: updateData.lagnaPredictions as any }
          : {}),
        ...(updateData.socialPost !== undefined ? { socialPost: updateData.socialPost } : {}),
      },
    });
  }

  /**
   * Manually trigger social media posting for a date.
   */
  async publishSocial(dateStr?: string) {
    const targetDate = dateStr || this.getTodayDateStr();
    let record = await this.prisma.dailyHoroscope.findUnique({
      where: {
        period_periodKey: {
          period: HoroscopePeriod.DAILY,
          periodKey: targetDate,
        },
      },
    });

    if (!record) {
      record = await this.generateAndSave(targetDate, HoroscopePeriod.DAILY, false, false);
    }
    if (!record) {
      throw new Error(`Failed to load or generate daily horoscope for ${targetDate}`);
    }

    const payload: DailyHoroscopePayload = {
      date: record.periodKey,
      dateDisplay: record.dateDisplay,
      panchanga: record.panchanga as unknown as PanchangaData,
      generalNotes: record.generalNotes,
      lagnaPredictions: record.lagnaPredictions as unknown as LagnaPrediction[],
      socialPost: record.socialPost || '',
    };

    const pubResult = await this.facebookPublisher.publish(payload);

    const updated = await this.prisma.dailyHoroscope.update({
      where: { id: record.id },
      data: {
        socialPostedAt: pubResult.success ? new Date() : record.socialPostedAt,
        socialPostId: pubResult.postId || record.socialPostId,
        socialPostStatus: pubResult.success
          ? 'POSTED'
          : pubResult.error
          ? `FAILED: ${pubResult.error}`
          : 'SKIPPED',
      },
    });

    return { result: pubResult, horoscope: updated };
  }

  /**
   * Morning Cron: checks if morning 5:00 AM+ has arrived and today's record is created/posted.
   */
  async checkAndRunMorningCron() {
    const now = new Date();
    // UTC+5:30
    const slDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const slHour = slDate.getUTCHours();
    const todayStr = slDate.toISOString().slice(0, 10);

    // Only run if 5 AM or later in Sri Lanka
    if (slHour < 5) {
      return;
    }

    const existing = await this.prisma.dailyHoroscope.findUnique({
      where: {
        period_periodKey: {
          period: HoroscopePeriod.DAILY,
          periodKey: todayStr,
        },
      },
    });

    if (!existing) {
      this.logger.log(`Morning Cron: Generating daily horoscope for today (${todayStr}) and publishing to Facebook...`);
      await this.generateAndSave(todayStr, HoroscopePeriod.DAILY, false, true);
    } else if (existing.socialPostStatus !== 'POSTED') {
      this.logger.log(`Morning Cron: Today's horoscope exists but social post is ${existing.socialPostStatus}. Retrying Facebook publish...`);
      await this.publishSocial(todayStr);
    }
  }
}
