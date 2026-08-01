import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { SubscriptionCheckoutStatus, UserRole } from '@prisma/client';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SubscriptionCheckoutsService } from '../subscriptions/subscription-checkouts.service';
import { StartPaymentDto } from '../orders/dto/start-payment.dto';
import { IsUUID } from 'class-validator';

class AdminCreateCheckoutDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  packageId!: string;
}

@Controller('admin/subscription-checkouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT, UserRole.SUPER_ADMIN, UserRole.FINANCE)
export class AdminSubscriptionCheckoutsController {
  constructor(private readonly checkouts: SubscriptionCheckoutsService) {}

  @Get()
  list(
    @Query('status') status?: SubscriptionCheckoutStatus,
    @Query('q') q?: string,
  ) {
    return this.checkouts.adminList(status, q);
  }

  @Post()
  createForUser(@Body() dto: AdminCreateCheckoutDto) {
    return this.checkouts.createCheckout(dto.userId, dto.packageId);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.checkouts.adminGetOne(id);
  }

  @Patch(':id/confirm')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.checkouts.adminConfirm(id);
  }

  @Patch(':id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.checkouts.adminReject(id);
  }

  /** Admin uploads bank slip on behalf of customer */
  @Post(':id/payments')
  submitPayment(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StartPaymentDto) {
    return this.checkouts.adminSubmitBankPayment(id, dto);
  }

  @Get(':id/payments/:paymentId/slip')
  async getSlip(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.checkouts.adminGetBankSlip(id, paymentId);
    res.set({ 'Content-Disposition': 'inline; filename="bank-slip"' });
    return file;
  }
}
