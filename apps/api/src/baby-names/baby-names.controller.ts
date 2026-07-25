import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { FreePreviewService as FreePreviewKind } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { BabyNamesService } from './baby-names.service';
import { CreateBabyNameDto } from './dto/create-baby-name.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { FreePreviewService } from '../free-preview/free-preview.service';

@Controller('baby-names')
export class BabyNamesController {
  constructor(
    private readonly babyNames: BabyNamesService,
    private readonly subscriptions: SubscriptionsService,
    private readonly freePreview: FreePreviewService,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async create(
    @CurrentUser() user: JwtPayload | null,
    @Body() dto: CreateBabyNameDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const access = await this.freePreview.authorize({
      userId: user?.sub,
      guestKeyRaw: req.header('x-guest-key'),
      ip: req.ip || req.socket.remoteAddress,
      service: FreePreviewKind.BABY_NAMES,
    });

    if (access.mode === 'SUBSCRIPTION' && user?.sub) {
      await this.subscriptions.consumeQuota(user.sub, 'BABY_NAMES');
    }

    const result = await this.babyNames.create(dto);

    if (access.mode === 'FREE_PREVIEW') {
      await this.freePreview.claimFreePreview({
        userId: user?.sub,
        guestKey: access.guestKey,
        ip: req.ip || req.socket.remoteAddress,
        service: FreePreviewKind.BABY_NAMES,
      });
      // Teaser: first 3 names only
      const names = Array.isArray(result.names) ? result.names.slice(0, 3) : result.names;
      res.setHeader('X-Guest-Key', access.guestKey);
      return {
        ...result,
        names,
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
    return this.babyNames.getByToken(token);
  }
}
