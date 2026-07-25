import { Module, forwardRef } from '@nestjs/common';
import { PayHereService } from './payhere.service';
import { WebhooksController } from './webhooks.controller';
import { PayHerePublicController } from './payhere-public.controller';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, forwardRef(() => OrdersModule)],
  controllers: [WebhooksController, PayHerePublicController],
  providers: [PayHereService],
  exports: [PayHereService],
})
export class PaymentsModule {}
