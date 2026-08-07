import { Module } from '@nestjs/common';
import { DreamInterpretationsController } from './dream-interpretations.controller';
import { DreamInterpretationsService } from './dream-interpretations.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { FreePreviewModule } from '../free-preview/free-preview.module';

@Module({
  imports: [SubscriptionsModule, FreePreviewModule],
  controllers: [DreamInterpretationsController],
  providers: [DreamInterpretationsService],
})
export class DreamInterpretationsModule {}
