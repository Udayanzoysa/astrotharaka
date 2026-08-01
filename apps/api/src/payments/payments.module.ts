import { Module, forwardRef } from '@nestjs/common';
import { PayHereService } from './payhere.service';
import { WebhooksController } from './webhooks.controller';
import { PayHerePublicController } from './payhere-public.controller';
import { OrdersModule } from '../orders/orders.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [WebhooksController, PayHerePublicController],
  providers: [PayHereService],
  exports: [PayHereService],
})
export class PaymentsModule {}