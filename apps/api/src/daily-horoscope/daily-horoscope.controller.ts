import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DailyHoroscopeService } from './daily-horoscope.service';
import { HoroscopePeriod } from '@prisma/client';

@Controller('daily-horoscope')
export class DailyHoroscopeController {
  constructor(private readonly service: DailyHoroscopeService) {}

  @Get('today')
  async getToday(@Query('period') period?: string) {
    const p = (period?.toUpperCase() as HoroscopePeriod) || HoroscopePeriod.DAILY;
    const data = await this.service.getToday(p);
    return { success: true, data };
  }

  @Get(':date')
  async getByDate(@Param('date') date: string, @Query('period') period?: string) {
    const p = (period?.toUpperCase() as HoroscopePeriod) || HoroscopePeriod.DAILY;
    const data = await this.service.getByDate(date, p);
    return { success: true, data };
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(
    @Body()
    body: {
      date?: string;
      period?: string;
      force?: boolean;
      publishSocial?: boolean;
      aiProvider?: 'gemini' | 'openai';
    },
  ) {
    const targetDate = body.date || this.service.getTodayDateStr();
    const p = (body.period?.toUpperCase() as HoroscopePeriod) || HoroscopePeriod.DAILY;
    const force = Boolean(body.force);
    const publishSocial = Boolean(body.publishSocial);

    const data = await this.service.generateAndSave(
      targetDate,
      p,
      force,
      publishSocial,
      body.aiProvider,
    );
    return { success: true, message: `Horoscope generated for ${targetDate}`, data };
  }

  @Post('publish-social')
  @HttpCode(HttpStatus.OK)
  async publishSocial(@Body() body: { date?: string }) {
    const result = await this.service.publishSocial(body.date);
    return { success: true, ...result };
  }

  @Post('update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Body()
    body: {
      date: string;
      period?: string;
      dateDisplay?: string;
      panchanga?: any;
      generalNotes?: string;
      lagnaPredictions?: any;
      socialPost?: string;
    },
  ) {
    const p = (body.period?.toUpperCase() as HoroscopePeriod) || HoroscopePeriod.DAILY;
    const data = await this.service.updateHoroscope(
      body.date,
      {
        dateDisplay: body.dateDisplay,
        panchanga: body.panchanga,
        generalNotes: body.generalNotes,
        lagnaPredictions: body.lagnaPredictions,
        socialPost: body.socialPost,
      },
      p,
    );
    return { success: true, message: 'Horoscope updated successfully', data };
  }
}
