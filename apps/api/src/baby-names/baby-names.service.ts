import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '@astro/shared';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { resolveLkPlace } from '../common/places-lk';
import { BabyNameStyle, CreateBabyNameDto } from './dto/create-baby-name.dto';
import { generateBabyNamesWithGemini, type BabyNameSuggestion } from './gemini-baby-names';

@Injectable()
export class BabyNamesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBabyNameDto) {
    const firstLetter = dto.firstLetter.trim();
    const secondLetter = dto.secondLetter.trim();
    if (!firstLetter || !secondLetter) {
      throw new AppException(
        ErrorCodes.VALIDATION_FAILED,
        'Starting letters are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const place = resolveLkPlace(dto.birthPlaceName);
    const publicToken = randomBytes(24).toString('hex');
    const birthTime = dto.birthTime?.trim() ? this.parseTime(dto.birthTime) : null;

    const generated = await generateBabyNamesWithGemini({
      birthDate: dto.birthDate,
      birthTime: dto.birthTime,
      birthPlaceName: place.matchedName,
      firstLetter,
      secondLetter,
      gender: dto.gender,
      styles: dto.styles,
    });

    const row = await this.prisma.babyNameRequest.create({
      data: {
        publicToken,
        birthDate: new Date(dto.birthDate),
        birthTime,
        birthPlaceName: place.matchedName,
        latitude: place.lat,
        longitude: place.lon,
        timezone: 'Asia/Colombo',
        firstLetter,
        secondLetter,
        gender: dto.gender ?? null,
        stylesJson: generated.styles as Prisma.InputJsonValue,
        namesJson: generated.names as Prisma.InputJsonValue,
        aiModel: generated.aiModel,
        status: 'READY',
      },
    });

    return this.serialize(row, generated.names, generated.styles);
  }

  async getByToken(token: string) {
    const row = await this.prisma.babyNameRequest.findUnique({ where: { publicToken: token } });
    if (!row) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Baby name request not found', HttpStatus.NOT_FOUND);
    }
    const names = Array.isArray(row.namesJson)
      ? (row.namesJson as BabyNameSuggestion[])
      : [];
    const styles = Array.isArray(row.stylesJson)
      ? (row.stylesJson as BabyNameStyle[])
      : [];
    return this.serialize(row, names, styles);
  }

  private parseTime(value: string): Date {
    const normalized = value.length === 5 ? `${value}:00` : value;
    return new Date(`1970-01-01T${normalized}Z`);
  }

  private serialize(
    row: {
      id: string;
      publicToken: string;
      birthDate: Date;
      birthTime: Date | null;
      birthPlaceName: string;
      firstLetter: string;
      secondLetter: string;
      gender: string | null;
      aiModel: string | null;
      status: string;
      createdAt: Date;
    },
    names: BabyNameSuggestion[],
    styles: BabyNameStyle[],
  ) {
    return {
      id: row.id,
      token: row.publicToken,
      birthDate: row.birthDate,
      birthTime: row.birthTime,
      birthPlaceName: row.birthPlaceName,
      firstLetter: row.firstLetter,
      secondLetter: row.secondLetter,
      gender: row.gender,
      styles,
      status: row.status,
      aiModel: row.aiModel,
      names,
      createdAt: row.createdAt,
    };
  }
}
