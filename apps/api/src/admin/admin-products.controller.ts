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
import { UserRole } from '@prisma/client';
import { ErrorCodes } from '@astro/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { AppException } from '../common/errors/app.exception';
import { UpsertProductDto } from './dto/upsert-product.dto';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT, UserRole.SUPER_ADMIN)
export class AdminProductsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
  ) {}

  @Get()
  async list() {
    const items = await this.prisma.product.findMany({
      include: { prices: { where: { isCurrent: true }, take: 1 } },
      orderBy: { sortOrder: 'asc' },
    });
    return items.map((p) => this.products.serialize(p));
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { prices: { where: { isCurrent: true }, take: 1 } },
    });
    if (!product) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    return this.products.serialize(product);
  }

  @Post()
  async create(@Body() dto: UpsertProductDto) {
    const product = await this.prisma.product.create({
      data: {
        slug: dto.slug,
        nameEn: dto.nameEn,
        nameSi: dto.nameSi,
        nameTa: dto.nameTa,
        descriptionEn: dto.descriptionEn,
        descriptionSi: dto.descriptionSi,
        descriptionTa: dto.descriptionTa,
        estimatedMinutes: dto.estimatedMinutes ?? 15,
        supportedLanguages: dto.supportedLanguages ?? ['en', 'si', 'ta'],
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        prices: {
          create: {
            amount: dto.priceAmount,
            currency: dto.currency ?? 'LKR',
            isCurrent: true,
          },
        },
      },
      include: { prices: { where: { isCurrent: true }, take: 1 } },
    });
    return this.products.serialize(product);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertProductDto) {
    await this.prisma.productPrice.updateMany({
      where: { productId: id, isCurrent: true },
      data: { isCurrent: false },
    });

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        slug: dto.slug,
        nameEn: dto.nameEn,
        nameSi: dto.nameSi,
        nameTa: dto.nameTa,
        descriptionEn: dto.descriptionEn,
        descriptionSi: dto.descriptionSi,
        descriptionTa: dto.descriptionTa,
        estimatedMinutes: dto.estimatedMinutes ?? 15,
        supportedLanguages: dto.supportedLanguages ?? ['en', 'si', 'ta'],
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        prices: {
          create: {
            amount: dto.priceAmount,
            currency: dto.currency ?? 'LKR',
            isCurrent: true,
          },
        },
      },
      include: { prices: { where: { isCurrent: true }, take: 1 } },
    });
    return this.products.serialize(product);
  }
}
