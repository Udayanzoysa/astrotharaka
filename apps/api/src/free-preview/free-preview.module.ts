import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { FreePreviewController } from './free-preview.controller';
import { FreePreviewService } from './free-preview.service';

@Module({
  imports: [SubscriptionsModule, NotificationsModule],
  controllers: [FreePreviewController],
  providers: [FreePreviewService],
  exports: [FreePreviewService],
})
export class FreePreviewModule {}
