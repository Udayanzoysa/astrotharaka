import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCodes } from '@astro/shared';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { CreateDreamInterpretationDto } from './dto/create-dream-interpretation.dto';
import { generateDreamWithGemini, type DreamReport } from './gemini-dream';

@Injectable()
export class DreamInterpretationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDreamInterpretationDto) {
    const dreamText = dto.dreamText.trim();
    const { report, aiModel } = await generateDreamWithGemini(dreamText);
    const publicToken = randomBytes(24).toString('hex');

    const row = await this.prisma.dreamInterpretation.create({
      data: {
        publicToken,
        dreamText,
        reportJson: report as unknown as Prisma.InputJsonValue,
        category: report.category,
        confidence: report.confidence_score,
        aiModel,
        status: 'READY',
      },
    });

    return this.serialize(row, report);
  }

  async getByToken(token: string) {
    const row = await this.prisma.dreamInterpretation.findUnique({
      where: { publicToken: token },
    });
    if (!row) {
      throw new AppException(
        ErrorCodes.NOT_FOUND,
        'Dream interpretation not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const report = (row.reportJson ?? null) as DreamReport | null;
    return this.serialize(row, report);
  }

  private serialize(
    row: {
      id: string;
      publicToken: string;
      dreamText: string;
      category: string | null;
      confidence: string | null;
      aiModel: string | null;
      status: string;
      createdAt: Date;
    },
    report: DreamReport | null,
  ) {
    return {
      id: row.id,
      token: row.publicToken,
      dreamText: row.dreamText,
      category: row.category,
      confidence: row.confidence,
      status: row.status,
      aiModel: row.aiModel,
      report,
      createdAt: row.createdAt,
    };
  }
}
