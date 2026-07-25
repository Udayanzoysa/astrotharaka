import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { FreePreviewService as FreePreviewKind } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { PorondamService } from './porondam.service';
import { CreatePorondamDto } from './dto/create-porondam.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { FreePreviewService } from '../free-preview/free-preview.service';

@Controller('porondam')
export class PorondamController {
  constructor(
    private readonly porondam: PorondamService,
    private readonly subscriptions: SubscriptionsService,
    private readonly freePreview: FreePreviewService,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async create(
    @CurrentUser() user: JwtPayload | null,
    @Body() dto: CreatePorondamDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const access = await this.freePreview.authorize({
      userId: user?.sub,
      guestKeyRaw: req.header('x-guest-key'),
      ip: req.ip || req.socket.remoteAddress,
      service: FreePreviewKind.PORONDAM,
    });

    if (access.mode === 'SUBSCRIPTION' && user?.sub) {
      await this.subscriptions.consumeQuota(user.sub, 'PORONDAM');
    }

    const result = await this.porondam.create(dto);

    if (access.mode === 'FREE_PREVIEW') {
      await this.freePreview.claimFreePreview({
        userId: user?.sub,
        guestKey: access.guestKey,
        ip: req.ip || req.socket.remoteAddress,
        service: FreePreviewKind.PORONDAM,
      });

      // Teaser: keep summary + first 3 porondam rows; blur dosha
      const report = result.report
        ? {
            ...result.report,
            porondam_details: (result.report.porondam_details ?? []).slice(0, 3),
            dosha_analysis: '🔒 Full dosha analysis unlocks with a subscription package.',
          }
        : result.report;

      res.setHeader('X-Guest-Key', access.guestKey);
      return {
        ...result,
        report,
        accessMode: access.mode,
        guestKey: access.guestKey,
        locked: true,
        teaserHint: true,
      };
    }

    res.setHeader('X-Guest-Key', access.guestKey);
    return { ...result, accessMode: access.mode, guestKey: access.guestKey, locked: false };
  }

  @Get(':token')
  getOne(@Param('token') token: string) {
    return this.porondam.getByToken(token);
  }
}
