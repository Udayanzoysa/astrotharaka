import { Module } from '@nestjs/common';
import { AdminProductsController } from './admin-products.controller';
import { AdminPromotionsController } from './admin-promotions.controller';
import { AdminStatsController } from './admin-stats.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminGuestReportsController } from './admin-guest-reports.controller';
import { AdminPackagesController } from './admin-packages.controller';
import { AdminSubscriptionCheckoutsController } from './admin-subscription-checkouts.controller';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [ProductsModule, OrdersModule, SubscriptionsModule, NotificationsModule],
  controllers: [
    AdminProductsController,
    AdminPromotionsController,
    AdminStatsController,
    AdminOrdersController,
    AdminUsersController,
    AdminGuestReportsController,
    AdminPackagesController,
    AdminSubscriptionCheckoutsController,
  ],
  providers: [RolesGuard],
})
export class AdminModule {}
