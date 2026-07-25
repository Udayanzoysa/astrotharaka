import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { assertDevPaymentsAllowed } from '../common/runtime-flags';
import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('packages')
  listPackages() {
    return this.subscriptions.listPublicPackages();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  mySubscription(@CurrentUser() user: JwtPayload) {
    return this.subscriptions.getMySubscription(user.sub);
  }

  /**
   * Instant self-activate (local only). Production: admin assigns after bank/PayHere,
   * or use ALLOW_DEV_PAYMENTS=true outside production.
   */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(@CurrentUser() user: JwtPayload, @Body() dto: SubscribeDto) {
    assertDevPaymentsAllowed('Self-serve package activation');
    return this.subscriptions.subscribe(
      user.sub,
      dto.packageId,
      dto.paymentRef ?? 'DEV_CONFIRM',
    );
  }
}
