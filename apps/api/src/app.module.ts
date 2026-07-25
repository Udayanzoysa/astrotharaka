import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BirthProfilesModule } from './birth-profiles/birth-profiles.module';
import { QueueModule } from './queue/queue.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PromotionsModule } from './promotions/promotions.module';
import { AdminModule } from './admin/admin.module';
import { GuestReportsModule } from './guest-reports/guest-reports.module';
import { BabyNamesModule } from './baby-names/baby-names.module';
import { PorondamModule } from './porondam/porondam.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FreePreviewModule } from './free-preview/free-preview.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    HealthModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    BirthProfilesModule,
    QueueModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    PromotionsModule,
    BankAccountsModule,
    AdminModule,
    GuestReportsModule,
    BabyNamesModule,
    PorondamModule,
    SubscriptionsModule,
    FreePreviewModule,
  ],
})
export class AppModule {}
