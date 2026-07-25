import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FreePreviewService as FreePreviewKind } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { GuestReportsService } from './guest-reports.service';
import { CreateGuestReportDto } from './dto/create-guest-report.dto';
import { SendGuestReportDto } from './dto/send-guest-report.dto';
import { FreePreviewService } from '../free-preview/free-preview.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Controller('guest-reports')
export class GuestReportsController {
  constructor(
    private readonly guestReportsService: GuestReportsService,
    private readonly freePreview: FreePreviewService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async create(
    @Body() dto: CreateGuestReportDto,
    @CurrentUser() user: JwtPayload | null,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const access = await this.freePreview.authorize({
      userId: user?.sub,
      guestKeyRaw: req.header('x-guest-key'),
      ip: req.ip || req.socket.remoteAddress,
      service: FreePreviewKind.HOROSCOPE,
    });

    if (access.mode === 'SUBSCRIPTION' && user?.sub) {
      await this.subscriptions.consumeQuota(user.sub, 'HOROSCOPE');
    }

    const created = await this.guestReportsService.create(dto, {
      userId: user?.sub ?? null,
      isFreePreview: access.mode === 'FREE_PREVIEW',
      fullUnlocked: access.mode === 'SUBSCRIPTION',
    });

    if (access.mode === 'FREE_PREVIEW') {
      await this.freePreview.claimFreePreview({
        userId: user?.sub,
        guestKey: access.guestKey,
        ip: req.ip || req.socket.remoteAddress,
        service: FreePreviewKind.HOROSCOPE,
      });
    }

    res.setHeader('X-Guest-Key', access.guestKey);
    return { ...created, accessMode: access.mode, guestKey: access.guestKey };
  }

  @Get(':token')
  @UseGuards(OptionalJwtAuthGuard)
  getStatus(@Param('token') token: string, @CurrentUser() user: JwtPayload | null) {
    return this.guestReportsService.getStatus(token, user?.sub ?? null);
  }

  @Post(':token/send')
  @UseGuards(JwtAuthGuard)
  send(
    @Param('token') token: string,
    @Body() dto: SendGuestReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guestReportsService.sendToProfile(token, dto.channel, user.sub);
  }

  @Get(':token/file')
  @UseGuards(OptionalJwtAuthGuard)
  async getFile(
    @Param('token') token: string,
    @CurrentUser() user: JwtPayload | null,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.guestReportsService.getFile(token, user?.sub ?? null);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    return new StreamableFile(file.stream);
  }
}
