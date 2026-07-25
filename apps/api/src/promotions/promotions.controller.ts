import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { ProductsService } from '../products/products.service';

@Controller('promotions')
@UseGuards(JwtAuthGuard)
export class PromotionsController {
  constructor(
    private readonly promotions: PromotionsService,
    private readonly products: ProductsService,
  ) {}

  @Post('validate')
  async validate(@CurrentUser() user: JwtPayload, @Body() dto: ValidatePromoDto) {
    const product = await this.products.getActiveById(dto.productId);
    const amount = dto.orderAmount ?? Number(product.prices[0].amount);
    return this.promotions.validateForUser({
      userId: user.sub,
      code: dto.code,
      productId: dto.productId,
      orderAmount: amount,
    });
  }
}
