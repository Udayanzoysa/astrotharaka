import { Module, forwardRef } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionCheckoutsService } from './subscription-checkouts.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionCheckoutsController } from './subscription-checkouts.controller';
import { PaymentsModule } from '../payments/payments.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';

@Module({
  imports: [forwardRef(() => PaymentsModule), BankAccountsModule],
  controllers: [SubscriptionsController, SubscriptionCheckoutsController],
  providers: [SubscriptionsService, SubscriptionCheckoutsService],
  exports: [SubscriptionsService, SubscriptionCheckoutsService],
})
export class SubscriptionsModule {}
