import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '@astro/shared';
import { DiscountType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';

export type PromoQuote = {
  promotionId: string;
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  totalAmount: number;
};

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateForUser(input: {
    userId: string;
    code: string;
    productId: string;
    orderAmount: Prisma.Decimal | number;
  }): Promise<PromoQuote> {
    const code = input.code.trim().toUpperCase();
    const amount = new Prisma.Decimal(input.orderAmount);
    const now = new Date();

    const promo = await this.prisma.promotion.findUnique({
      where: { code },
      include: { products: { select: { id: true } } },
    });

    if (!promo || !promo.isActive) {
      throw new AppException(ErrorCodes.INVALID_PROMO, 'Invalid promotional code', HttpStatus.BAD_REQUEST);
    }

    if (promo.startsAt && promo.startsAt > now) {
      throw new AppException(ErrorCodes.PROMO_EXPIRED, 'Promotional code is not active yet', HttpStatus.BAD_REQUEST);
    }
    if (promo.endsAt && promo.endsAt < now) {
      throw new AppException(ErrorCodes.PROMO_EXPIRED, 'Promotional code has expired', HttpStatus.BAD_REQUEST);
    }

    if (promo.minOrderAmount && amount.lessThan(promo.minOrderAmount)) {
      throw new AppException(
        ErrorCodes.INVALID_PROMO,
        `Minimum order amount is ${Number(promo.minOrderAmount)}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (promo.products.length > 0 && !promo.products.some((p) => p.id === input.productId)) {
      throw new AppException(
        ErrorCodes.INVALID_PROMO,
        'Promotional code is not valid for this product',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (promo.maxRedemptions != null) {
      const used = await this.prisma.promotionRedemption.count({
        where: { promotionId: promo.id },
      });
      if (used >= promo.maxRedemptions) {
        throw new AppException(
          ErrorCodes.PROMO_LIMIT_REACHED,
          'Promotional code usage limit reached',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const userUsed = await this.prisma.promotionRedemption.count({
      where: { promotionId: promo.id, userId: input.userId },
    });
    if (userUsed >= promo.perCustomerLimit) {
      throw new AppException(
        ErrorCodes.PROMO_LIMIT_REACHED,
        'You have already used this promotional code',
        HttpStatus.BAD_REQUEST,
      );
    }

    const discountAmount = this.calculateDiscount(amount, promo.discountType, promo.discountValue);
    const totalAmount = Prisma.Decimal.max(amount.minus(discountAmount), new Prisma.Decimal(0));

    return {
      promotionId: promo.id,
      code: promo.code,
      name: promo.name,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      discountAmount: Number(discountAmount),
      totalAmount: Number(totalAmount),
    };
  }

  calculateDiscount(
    amount: Prisma.Decimal,
    type: DiscountType,
    value: Prisma.Decimal,
  ): Prisma.Decimal {
    if (type === DiscountType.PERCENT) {
      const raw = amount.mul(value).div(100);
      return Prisma.Decimal.min(raw, amount);
    }
    return Prisma.Decimal.min(value, amount);
  }
}
