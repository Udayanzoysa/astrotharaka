import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UpsertSubscriptionPackageDto } from '../subscriptions/dto/upsert-package.dto';
import { SubscribeDto } from '../subscriptions/dto/subscribe.dto';
import { IsUUID } from 'class-validator';

class AdminAssignSubscriptionDto extends SubscribeDto {
  @IsUUID()
  userId!: string;
}

@Controller('admin/packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT, UserRole.SUPER_ADMIN)
export class AdminPackagesController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get()
  list() {
    return this.subscriptions.listAllPackages();
  }

  @Get('subscriptions')
  listSubscriptions() {
    return this.subscriptions.listSubscriptions(100);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptions.getPackage(id);
  }

  @Post()
  create(@Body() dto: UpsertSubscriptionPackageDto) {
    return this.subscriptions.createPackage(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertSubscriptionPackageDto) {
    return this.subscriptions.updatePackage(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptions.deactivatePackage(id);
  }

  @Post('assign')
  assign(@Body() dto: AdminAssignSubscriptionDto) {
    return this.subscriptions.subscribe(dto.userId, dto.packageId, dto.paymentRef ?? 'ADMIN_ASSIGN');
  }
}
