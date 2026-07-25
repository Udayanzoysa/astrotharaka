import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '@astro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { prices: { where: { isCurrent: true }, take: 1 } },
      orderBy: { sortOrder: 'asc' },
    });
    return products.map((p) => this.serialize(p));
  }

  async getBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { prices: { where: { isCurrent: true }, take: 1 } },
    });
    if (!product) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    return this.serialize(product);
  }

  async getActiveById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true },
      include: { prices: { where: { isCurrent: true }, take: 1 } },
    });
    if (!product || product.prices.length === 0) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Product not found', HttpStatus.NOT_FOUND);
    }
    return product;
  }

  serialize(product: {
    id: string;
    slug: string;
    nameEn: string;
    nameSi: string | null;
    nameTa: string | null;
    descriptionEn: string;
    descriptionSi: string | null;
    descriptionTa: string | null;
    estimatedMinutes: number;
    supportedLanguages: string[];
    samplePreviewUrl: string | null;
    isActive?: boolean;
    sortOrder?: number;
    prices: Array<{ currency: string; amount: unknown }>;
  }) {
    const price = product.prices[0];
    return {
      id: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameSi: product.nameSi,
      nameTa: product.nameTa,
      descriptionEn: product.descriptionEn,
      descriptionSi: product.descriptionSi,
      descriptionTa: product.descriptionTa,
      estimatedMinutes: product.estimatedMinutes,
      supportedLanguages: product.supportedLanguages,
      samplePreviewUrl: product.samplePreviewUrl,
      isActive: product.isActive ?? true,
      sortOrder: product.sortOrder ?? 0,
      price: price
        ? { currency: price.currency, amount: Number(price.amount) }
        : null,
    };
  }
}
