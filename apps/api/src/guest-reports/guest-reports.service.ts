import { createReadStream } from 'fs';
import { basename } from 'path';
import { randomBytes } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from '@astro/shared';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { QueueService } from '../queue/queue.service';
import { CreateGuestReportDto } from './dto/create-guest-report.dto';
import { resolveLkPlace } from '../common/places-lk';
import { resolveReportFilePath } from '../common/resolve-report-file';
import { parseTimeOnly } from '../users/profile-serialize';

const GUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type RawSection = { heading: string; body: string };
type PreviewSection = {
  heading: string;
  /** First paragraph only (guest-readable). */
  body: string;
  /** True when more detail exists beyond the free paragraph. */
  locked: boolean;
  /** Short blur teaser of locked follow-up text. */
  teaser: string | null;
};

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function paragraphBlocks(body: string): string[] {
  const blocks = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (blocks.length > 0) return blocks;
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length ? [lines[0]] : body.trim() ? [body.trim()] : [];
}

function firstParagraph(body: string): string {
  const blocks = paragraphBlocks(body);
  if (blocks.length > 0) return blocks[0];
  return body.slice(0, 220);
}

function teaserWords(body: string, count = 10): string {
  const words = body.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const take = Math.min(count, words.length);
  return `${words.slice(0, take).join(' ')}${words.length > take ? '…' : ''}`;
}

function parseSections(text: string): RawSection[] {
  const raw = text.trim();
  if (!raw) return [];

  const parts = raw
    .split(/^##\s+/m)
    .map((p) => p.trim())
    .filter(Boolean);

  const sections: RawSection[] = [];
  for (const part of parts) {
    const nl = part.indexOf('\n');
    if (nl === -1) {
      if (sections.length === 0 && !/^#{1,6}\s/.test(part)) {
        continue;
      }
      sections.push({ heading: part.slice(0, 80), body: part });
    } else {
      const heading = part.slice(0, nl).trim().replace(/^#+\s*/, '').slice(0, 80);
      const body = part.slice(nl + 1).trim();
      if (heading && body) sections.push({ heading, body });
    }
  }

  if (sections.length === 0) {
    const paragraphs = raw
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (let i = 0; i < paragraphs.length; i += 1) {
      const p = paragraphs[i];
      const firstLine = p.split('\n')[0]?.trim() ?? `Section ${i + 1}`;
      const heading = firstLine.length <= 60 ? firstLine : `Section ${i + 1}`;
      const body =
        firstLine.length <= 60 ? p.split('\n').slice(1).join('\n').trim() || p : p;
      sections.push({ heading, body });
    }
  }

  return sections.length ? sections : [{ heading: 'Preview', body: raw }];
}

function buildPreview(text: string | null | undefined) {
  const full = (text ?? '').trim();
  if (!full) {
    return {
      previewText: '',
      previewSections: [] as PreviewSection[],
      previewWordCount: 0,
      totalWordCount: 0,
      totalSections: 0,
      locked: false,
    };
  }

  const totalWordCount = wordCount(full);
  const sections = parseSections(full);
  const previewSections: PreviewSection[] = sections.map((section) => {
    const paras = paragraphBlocks(section.body);
    const free = paras[0] ?? firstParagraph(section.body);
    const rest = paras.slice(1).join('\n\n');
    const hasMore = rest.length > 0 || wordCount(section.body) > wordCount(free) + 8;
    return {
      heading: section.heading,
      body: free,
      locked: hasMore,
      teaser: hasMore ? teaserWords(rest || section.body.slice(free.length), 10) : null,
    };
  });

  const previewText = previewSections.map((s) => `${s.heading}\n\n${s.body}`).join('\n\n');
  const anyLocked = previewSections.some((s) => s.locked);

  return {
    previewText,
    previewSections,
    previewWordCount: wordCount(previewText),
    totalWordCount,
    totalSections: sections.length,
    locked: anyLocked,
  };
}

@Injectable()
export class GuestReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
  ) {}

  async create(
    dto: CreateGuestReportDto,
    access?: {
      userId?: string | null;
      isFreePreview?: boolean;
      fullUnlocked?: boolean;
    },
  ) {
    this.assertBirthTimeRules(dto.unknownBirthTime ?? false, dto.birthTime);

    const place = resolveLkPlace(dto.birthPlaceName);
    const latitude = dto.latitude ?? place.lat;
    const longitude = dto.longitude ?? place.lon;
    const placeResolved = !place.usedDefault ? place.matchedName : dto.birthPlaceName.trim();

    const downloadToken = randomBytes(32).toString('hex');
    const isFreePreview = access?.isFreePreview ?? true;
    const fullUnlocked = access?.fullUnlocked ?? false;

    const created = await this.prisma.guestReport.create({
      data: {
        downloadToken,
        userId: access?.userId ?? null,
        isFreePreview,
        fullUnlocked,
        fullName: dto.fullName.trim(),
        gender: dto.gender,
        email: dto.email.trim().toLowerCase(),
        mobile: dto.mobile?.trim() || null,
        birthDate: new Date(dto.birthDate),
        birthTime: dto.unknownBirthTime ? null : this.parseTime(dto.birthTime!),
        unknownBirthTime: dto.unknownBirthTime ?? false,
        birthPlaceName: placeResolved,
        latitude,
        longitude,
        timezone: dto.timezone ?? 'Asia/Colombo',
        language: dto.language ?? 'si',
        status: ReportStatus.QUEUED,
        expiresAt: new Date(Date.now() + GUEST_TTL_MS),
      },
    });

    try {
      await this.queue.enqueueGuestReport({ guestReportId: created.id });
    } catch (error) {
      await this.prisma.guestReport.update({
        where: { id: created.id },
        data: {
          status: ReportStatus.FAILED,
          errorMessage:
            error instanceof Error
              ? `Queue unavailable: ${error.message}`
              : 'Queue unavailable',
        },
      });
      throw error;
    }

    const warnings: string[] = [];
    if (dto.unknownBirthTime) {
      warnings.push('Birth time is approximate or unknown; Lagna accuracy may be reduced.');
    }
    if (place.usedDefault && dto.latitude == null) {
      warnings.push(
        `Place "${dto.birthPlaceName.trim()}" was not matched; using Colombo coordinates for the chart.`,
      );
    }

    return {
      id: created.id,
      downloadToken: created.downloadToken,
      status: created.status,
      language: created.language,
      expiresAt: created.expiresAt,
      resolvedPlace: placeResolved,
      latitude,
      longitude,
      placeDefaulted: place.usedDefault && dto.latitude == null,
      accuracyWarning: warnings.length ? warnings.join(' ') : null,
      isFreePreview,
      fullUnlocked,
    };
  }

  async getStatus(token: string, _userId?: string | null) {
    const report = await this.findByToken(token);
    const ready = report.status === ReportStatus.READY;

    // Guest free-preview stays locked forever. Full content only when the
    // report was generated under an active paid package (fullUnlocked=true).
    const unlockFull = report.fullUnlocked && !report.isFreePreview;

    let preview: ReturnType<typeof buildPreview> | {
      previewText: string;
      previewSections: PreviewSection[];
      previewWordCount: number;
      totalWordCount: number;
      totalSections: number;
      locked: boolean;
    };

    if (!ready) {
      preview = {
        previewText: '',
        previewSections: [],
        previewWordCount: 0,
        totalWordCount: 0,
        totalSections: 0,
        locked: false,
      };
    } else if (unlockFull) {
      const sections = parseSections(report.contentText ?? '').map((s) => ({
        heading: s.heading,
        body: s.body,
        locked: false,
        teaser: null,
      }));
      const previewText = sections.map((s) => `${s.heading}\n\n${s.body}`).join('\n\n');
      preview = {
        previewText,
        previewSections: sections,
        previewWordCount: wordCount(previewText),
        totalWordCount: wordCount(report.contentText ?? ''),
        totalSections: sections.length,
        locked: false,
      };
    } else {
      preview = buildPreview(report.contentText);
    }

    return {
      id: report.id,
      downloadToken: report.downloadToken,
      status: report.status,
      language: report.language,
      title: report.title,
      fullName: report.fullName,
      birthPlaceName: report.birthPlaceName,
      birthDate: report.birthDate,
      errorMessage: report.errorMessage,
      readyAt: report.readyAt,
      expiresAt: report.expiresAt,
      isFreePreview: !unlockFull,
      fullUnlocked: unlockFull,
      previewText: preview.previewText,
      previewSections: preview.previewSections,
      previewWordCount: preview.previewWordCount,
      totalWordCount: preview.totalWordCount,
      totalSections: preview.totalSections,
      locked: preview.locked,
    };
  }

  async sendToProfile(token: string, channel: 'email' | 'whatsapp', userId: string) {
    const report = await this.findByToken(token);
    const allowed = report.fullUnlocked && !report.isFreePreview;
    if (!allowed) {
      throw new AppException(
        ErrorCodes.FORBIDDEN,
        'Sending requires a full report generated with an active package',
        HttpStatus.FORBIDDEN,
      );
    }
    if (report.status !== ReportStatus.READY) {
      throw new AppException(
        ErrorCodes.REPORT_NOT_READY,
        'Guest report is not ready yet',
        HttpStatus.CONFLICT,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) {
      throw new AppException(ErrorCodes.UNAUTHORIZED, 'Sign in required', HttpStatus.UNAUTHORIZED);
    }

    if (channel === 'email') {
      const to = user.email?.trim();
      if (!to) {
        throw new AppException(
          ErrorCodes.VALIDATION_FAILED,
          'Add an email address in Settings / your account profile',
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.queue.enqueueNotifyEmail(
        {
          userId,
          kind: 'guest_report_ready',
          guestReportId: report.id,
          downloadToken: report.downloadToken,
          attachPdf: true,
        },
        `email-guest-${report.id}-${Date.now()}`,
      );
      return { ok: true, channel, destination: to };
    }

    const to =
      user.profile?.whatsappNumber?.trim() ||
      user.profile?.mobileNumber?.trim() ||
      '';
    if (!to) {
      throw new AppException(
        ErrorCodes.VALIDATION_FAILED,
        'Add a WhatsApp or mobile number in Settings',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.queue.enqueueNotifyWhatsApp(
      {
        userId,
        kind: 'guest_report_ready',
        guestReportId: report.id,
        downloadToken: report.downloadToken,
      },
      `wa-guest-${report.id}-${Date.now()}`,
    );
    return { ok: true, channel, destination: to };
  }

  async getFile(token: string, _userId?: string | null) {
    const report = await this.findByToken(token);

    // PDF only for reports generated with an active package — guest teaser stays locked
    const allowed = report.fullUnlocked && !report.isFreePreview;

    if (!allowed) {
      throw new AppException(
        ErrorCodes.FORBIDDEN,
        'Full PDF requires generating the report with an active subscription package',
        HttpStatus.FORBIDDEN,
      );
    }
    if (report.status !== ReportStatus.READY || !report.pdfStorageKey) {
      throw new AppException(
        ErrorCodes.REPORT_NOT_READY,
        'Guest report PDF is not ready yet',
        HttpStatus.CONFLICT,
      );
    }
    const pdfPath = resolveReportFilePath(
      report.pdfStorageKey,
      this.config.get<string>('REPORTS_DIR'),
    );
    if (!pdfPath) {
      throw new AppException(
        ErrorCodes.NOT_FOUND,
        'Guest report PDF file missing',
        HttpStatus.NOT_FOUND,
      );
    }
    const safeName = report.fullName.replace(/[^\w.-]+/g, '_').slice(0, 40) || 'guest';
    return {
      filename: `taraka-guest-${safeName}.pdf`,
      contentType: 'application/pdf',
      stream: createReadStream(pdfPath),
      basename: basename(pdfPath),
    };
  }

  private async findByToken(token: string) {
    const report = await this.prisma.guestReport.findUnique({ where: { downloadToken: token } });
    if (!report) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Guest report not found', HttpStatus.NOT_FOUND);
    }
    if (report.expiresAt && report.expiresAt.getTime() < Date.now()) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Guest report has expired', HttpStatus.NOT_FOUND);
    }
    return report;
  }

  private assertBirthTimeRules(unknownBirthTime: boolean, birthTime?: string): void {
    if (!unknownBirthTime && !birthTime) {
      throw new AppException(
        ErrorCodes.VALIDATION_FAILED,
        'birthTime is required unless unknownBirthTime is true',
      );
    }
  }

  private parseTime(value: string): Date {
    return parseTimeOnly(value);
  }
}
