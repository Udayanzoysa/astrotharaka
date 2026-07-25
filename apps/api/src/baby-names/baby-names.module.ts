import { Module } from '@nestjs/common';
import { BabyNamesController } from './baby-names.controller';
import { BabyNamesService } from './baby-names.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { FreePreviewModule } from '../free-preview/free-preview.module';

@Module({
  imports: [SubscriptionsModule, FreePreviewModule],
  controllers: [BabyNamesController],
  providers: [BabyNamesService],
})
export class BabyNamesModule {}
