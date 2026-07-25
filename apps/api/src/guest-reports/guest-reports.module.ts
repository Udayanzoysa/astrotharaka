import { Module } from '@nestjs/common';
import { GuestReportsController } from './guest-reports.controller';
import { GuestReportsService } from './guest-reports.service';
import { FreePreviewModule } from '../free-preview/free-preview.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [FreePreviewModule, SubscriptionsModule],
  controllers: [GuestReportsController],
  providers: [GuestReportsService],
})
export class GuestReportsModule {}
