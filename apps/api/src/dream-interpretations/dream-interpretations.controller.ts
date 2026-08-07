import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { FreePreviewService as FreePreviewKind } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { DreamInterpretationsService } from './dream-interpretations.service';
import { CreateDreamInterpretationDto } from './dto/create-dream-interpretation.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { FreePreviewService } from '../free-preview/free-preview.service';

const TEASER_DEEP = '🔒 Full deep analysis unlocks with a monthly subscription package.';
const TEASER_ADVICE = '🔒 Daily guidance unlocks with a monthly subscription package.';

@Controller('dream-interpretations')
export class DreamInterpretationsController {
  constructor(
    private readonly dreams: DreamInterpretationsService,
    private readonly subscriptions: SubscriptionsService,
    private readonly freePreview: FreePreviewService,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async create(
    @CurrentUser() user: JwtPayload | null,
    @Body() dto: CreateDreamInterpretationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const access = await this.freePreview.authorize({
      userId: user?.sub,
      guestKeyRaw: req.header('x-guest-key'),
      ip: req.ip || req.socket.remoteAddress,
      service: FreePreviewKind.DREAM_INTERPRETATION,
    });

    if (access.mode === 'SUBSCRIPTION' && user?.sub) {
      await this.subscriptions.consumeQuota(user.sub, 'DREAM_INTERPRETATION');
    }

    const result = await this.dreams.create(dto);

    if (access.mode === 'FREE_PREVIEW') {
      await this.freePreview.claimFreePreview({
        userId: user?.sub,
        guestKey: access.guestKey,
        ip: req.ip || req.socket.remoteAddress,
        service: FreePreviewKind.DREAM_INTERPRETATION,
      });

      const report = result.report
        ? {
            ...result.report,
            deep_analysis: TEASER_DEEP,
            actionable_advice: TEASER_ADVICE,
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
    return this.dreams.getByToken(token);
  }
}
