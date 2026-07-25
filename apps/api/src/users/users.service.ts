import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '@astro/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  parseDateOnly,
  parseTimeOnly,
  serializeCustomerProfile,
} from './profile-serialize';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      hasUsedFreePreview: user.hasUsedFreePreview,
      profile: serializeCustomerProfile(user.profile),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Profile not found', HttpStatus.NOT_FOUND);
    }

    const {
      email,
      birthDate,
      birthTime,
      unknownBirthTime,
      birthPlaceName,
      gender,
      ...rest
    } = dto;

    if (email) {
      const normalized = email.trim().toLowerCase();
      const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
      if (existing && existing.id !== userId) {
        throw new AppException(
          ErrorCodes.EMAIL_ALREADY_REGISTERED,
          'Email already registered',
          HttpStatus.CONFLICT,
        );
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: { email: normalized },
      });
    }

    const data: Prisma.CustomerProfileUpdateInput = { ...rest };

    if (birthDate !== undefined) {
      data.birthDate = birthDate ? parseDateOnly(String(birthDate)) : null;
    }
    if (unknownBirthTime !== undefined) {
      data.unknownBirthTime = unknownBirthTime;
      if (unknownBirthTime) data.birthTime = null;
    }
    if (birthTime !== undefined && unknownBirthTime !== true) {
      data.birthTime = birthTime ? parseTimeOnly(String(birthTime)) : null;
    }
    if (birthPlaceName !== undefined) {
      data.birthPlaceName = birthPlaceName;
    }
    if (gender !== undefined) {
      data.gender = gender || null;
    }

    await this.prisma.customerProfile.update({
      where: { userId },
      data,
    });

    return this.getMe(userId);
  }
}
