import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { FreePreviewService } from './free-preview.service';

function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const part = raw
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`));
  if (!part) return undefined;
  return decodeURIComponent(part.slice(name.length + 1));
}

@Controller('free-preview')
export class FreePreviewController {
  constructor(private readonly freePreview: FreePreviewService) {}

  @Get('status')
  @UseGuards(OptionalJwtAuthGuard)
  async status(@CurrentUser() user: JwtPayload | null, @Req() req: Request) {
    const fromCookie = readCookie(req, 'taraka_fp');
    const fromHeader = req.header('x-guest-key');
    return this.freePreview.getStatus({
      userId: user?.sub,
      guestKeyRaw: fromHeader || fromCookie,
      ip: req.ip || req.socket.remoteAddress,
    });
  }
}
