import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DiscountType, UserRole } from '@prisma/client';
import { ErrorCodes } from '@astro/shared';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';

class UpsertPromotionDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  name!: string;

  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @IsNumber()
  @Min(0)
  discountValue!: number;

  @IsOptional()
  @IsNumber()
  minOrderAmount?: number;

  @IsOptional()
  @IsInt()
  maxRedemptions?: number;

  @IsOptional()
  @IsInt()
  perCustomerLimit?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('admin/promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT, UserRole.SUPER_ADMIN)
export class AdminPromotionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Promotion not found', HttpStatus.NOT_FOUND);
    }
    return promo;
  }

  @Post()
  create(@Body() dto: UpsertPromotionDto) {
    return this.prisma.promotion.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount,
        maxRedemptions: dto.maxRedemptions,
        perCustomerLimit: dto.perCustomerLimit ?? 1,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertPromotionDto) {
    return this.prisma.promotion.update({
      where: { id },
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount,
        maxRedemptions: dto.maxRedemptions,
        perCustomerLimit: dto.perCustomerLimit ?? 1,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }
}
