import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
