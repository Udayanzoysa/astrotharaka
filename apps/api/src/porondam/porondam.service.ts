import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCodes } from '@astro/shared';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { resolveLkPlace } from '../common/places-lk';
import { AppException } from '../common/errors/app.exception';
import { CreatePorondamDto } from './dto/create-porondam.dto';
import { computePersonAnchors } from './chart-anchors';
import { generatePorondamWithGemini, type PorondamReport } from './gemini-porondam';

@Injectable()
export class PorondamService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePorondamDto) {
    const groomPlace = resolveLkPlace(dto.groomBirthPlace);
    const bridePlace = resolveLkPlace(dto.brideBirthPlace);

    const groom = computePersonAnchors({
      fullName: dto.groomName.trim(),
      birthDate: dto.groomBirthDate,
      birthTime: dto.groomBirthTime,
      birthPlaceName: groomPlace.matchedName,
      latitude: groomPlace.lat,
      longitude: groomPlace.lon,
    });

    const bride = computePersonAnchors({
      fullName: dto.brideName.trim(),
      birthDate: dto.brideBirthDate,
      birthTime: dto.brideBirthTime,
      birthPlaceName: bridePlace.matchedName,
      latitude: bridePlace.lat,
      longitude: bridePlace.lon,
    });

    const { report, aiModel } = await generatePorondamWithGemini(groom, bride);
    const publicToken = randomBytes(24).toString('hex');
    const anchors = { groom, bride };

    const row = await this.prisma.porondamMatch.create({
      data: {
        publicToken,
        groomName: groom.fullName,
        groomBirthDate: new Date(dto.groomBirthDate),
        groomBirthTime: this.parseTime(dto.groomBirthTime),
        groomPlaceName: groomPlace.matchedName,
        groomLatitude: groomPlace.lat,
        groomLongitude: groomPlace.lon,
        brideName: bride.fullName,
        brideBirthDate: new Date(dto.brideBirthDate),
        brideBirthTime: this.parseTime(dto.brideBirthTime),
        bridePlaceName: bridePlace.matchedName,
        brideLatitude: bridePlace.lat,
        brideLongitude: bridePlace.lon,
        timezone: 'Asia/Colombo',
        anchorsJson: anchors as unknown as Prisma.InputJsonValue,
        reportJson: report as unknown as Prisma.InputJsonValue,
        compatibilityScore: report.compatibility_score,
        aiModel,
        status: 'READY',
      },
    });

    return this.serialize(row, anchors, report);
  }

  async getByToken(token: string) {
    const row = await this.prisma.porondamMatch.findUnique({ where: { publicToken: token } });
    if (!row) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Porondam report not found', HttpStatus.NOT_FOUND);
    }
    const anchors = (row.anchorsJson ?? {}) as {
      groom?: ReturnType<typeof computePersonAnchors>;
      bride?: ReturnType<typeof computePersonAnchors>;
    };
    const report = (row.reportJson ?? null) as PorondamReport | null;
    return this.serialize(row, anchors, report);
  }

  private parseTime(value: string): Date {
    const normalized = value.length === 5 ? `${value}:00` : value;
    return new Date(`1970-01-01T${normalized}Z`);
  }

  private serialize(
    row: {
      id: string;
      publicToken: string;
      groomName: string;
      brideName: string;
      compatibilityScore: string | null;
      aiModel: string | null;
      status: string;
      createdAt: Date;
    },
    anchors: {
      groom?: ReturnType<typeof computePersonAnchors>;
      bride?: ReturnType<typeof computePersonAnchors>;
    },
    report: PorondamReport | null,
  ) {
    return {
      id: row.id,
      token: row.publicToken,
      groomName: row.groomName,
      brideName: row.brideName,
      compatibilityScore: row.compatibilityScore,
      status: row.status,
      aiModel: row.aiModel,
      anchors,
      report,
      createdAt: row.createdAt,
    };
  }
}
