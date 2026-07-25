import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '@astro/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { QueueService } from '../queue/queue.service';
import { CreateBirthProfileDto } from './dto/create-birth-profile.dto';
import { UpdateBirthProfileDto } from './dto/update-birth-profile.dto';

@Injectable()
export class BirthProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async create(userId: string, dto: CreateBirthProfileDto) {
    this.assertBirthTimeRules(dto.unknownBirthTime ?? false, dto.birthTime);

    const created = await this.prisma.birthProfile.create({
      data: {
        userId,
        fullName: dto.fullName,
        birthDate: new Date(dto.birthDate),
        birthTime: dto.unknownBirthTime ? null : this.parseTime(dto.birthTime!),
        unknownBirthTime: dto.unknownBirthTime ?? false,
        birthPlaceName: dto.birthPlaceName,
        latitude: dto.latitude,
        longitude: dto.longitude,
        timezone: dto.timezone ?? 'Asia/Colombo',
        preferredLanguage: dto.preferredLanguage ?? 'en',
        notes: dto.notes,
      },
    });

    // Optional: enqueue a sample calculation job for worker smoke testing
    await this.queue.enqueueAstrologyCalculate({
      birthProfileId: created.id,
      userId,
      requestId: created.id,
    });

    return this.withWarnings(created);
  }

  async list(userId: string) {
    const items = await this.prisma.birthProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => this.withWarnings(item));
  }

  async getOne(userId: string, id: string) {
    const item = await this.findOwned(userId, id);
    return this.withWarnings(item);
  }

  async update(userId: string, id: string, dto: UpdateBirthProfileDto) {
    await this.findOwned(userId, id);

    const unknownBirthTime = dto.unknownBirthTime;
    if (unknownBirthTime !== undefined || dto.birthTime !== undefined) {
      this.assertBirthTimeRules(
        unknownBirthTime ?? false,
        dto.birthTime,
      );
    }

    const data: Prisma.BirthProfileUpdateInput = {
      fullName: dto.fullName,
      birthPlaceName: dto.birthPlaceName,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezone,
      preferredLanguage: dto.preferredLanguage,
      notes: dto.notes,
    };

    if (dto.birthDate) {
      data.birthDate = new Date(dto.birthDate);
    }
    if (unknownBirthTime === true) {
      data.unknownBirthTime = true;
      data.birthTime = null;
    } else if (dto.birthTime) {
      data.unknownBirthTime = false;
      data.birthTime = this.parseTime(dto.birthTime);
    } else if (unknownBirthTime === false && dto.birthTime === undefined) {
      data.unknownBirthTime = false;
    }

    const updated = await this.prisma.birthProfile.update({
      where: { id },
      data,
    });
    return this.withWarnings(updated);
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.birthProfile.delete({ where: { id } });
    return { deleted: true };
  }

  private async findOwned(userId: string, id: string) {
    const item = await this.prisma.birthProfile.findFirst({ where: { id, userId } });
    if (!item) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Birth profile not found', HttpStatus.NOT_FOUND);
    }
    return item;
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
    const normalized = value.length === 5 ? `${value}:00` : value;
    return new Date(`1970-01-01T${normalized}Z`);
  }

  private withWarnings<T extends { unknownBirthTime: boolean }>(item: T) {
    return {
      ...item,
      accuracyWarning: item.unknownBirthTime
        ? 'Birth time is approximate or unknown; report accuracy may be reduced.'
        : null,
    };
  }
}
