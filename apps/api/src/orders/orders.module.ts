import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ProductsModule } from '../products/products.module';
import { PaymentsModule } from '../payments/payments.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';

@Module({
  imports: [
    ProductsModule,
    PromotionsModule,
    SubscriptionsModule,
    BankAccountsModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}