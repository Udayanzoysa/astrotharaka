import { Module } from '@nestjs/common';
import { PorondamController } from './porondam.controller';
import { PorondamService } from './porondam.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { FreePreviewModule } from '../free-preview/free-preview.module';

@Module({
  imports: [SubscriptionsModule, FreePreviewModule],
  controllers: [PorondamController],
  providers: [PorondamService],
})
export class PorondamModule {}
