import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DailyHoroscopeController } from './daily-horoscope.controller';
import { DailyHoroscopeService } from './daily-horoscope.service';

@Module({
  imports: [PrismaModule],
  controllers: [DailyHoroscopeController],
  providers: [DailyHoroscopeService],
  exports: [DailyHoroscopeService],
})
export class DailyHoroscopeModule {}
