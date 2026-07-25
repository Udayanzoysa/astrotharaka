import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';
import { CreateOrderDto } from './dto/create-order.dto';
import { StartPaymentDto } from './dto/start-payment.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.ordersService.listMine(user.sub);
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getMine(user.sub, id);
  }

  @Post(':id/payments')
  startPayment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartPaymentDto,
  ) {
    return this.ordersService.startPayment(user.sub, id, dto);
  }

  @Get(':id/payments/:paymentId/slip')
  async getBankSlip(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.ordersService.getBankSlipFile(user.sub, id, paymentId);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${file.filename}"`,
    });
    return new StreamableFile(file.stream);
  }

  @Post(':id/payments/confirm')
  confirmPayment(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.confirmPayment(user.sub, id);
  }

  @Get(':id/report')
  getReport(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getReportDownload(user.sub, id);
  }

  @Get(':id/report/file')
  async getReportFile(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.ordersService.getReportFile(user.sub, id);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    if (file.isPdf) {
      return new StreamableFile(file.stream);
    }
    return new StreamableFile(Buffer.from(file.body, 'utf8'));
  }

  @Get(':id/report/chart.svg')
  async getReportChart(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.ordersService.getReportChartSvg(user.sub, id);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${file.filename}"`,
    });
    return new StreamableFile(file.stream);
  }
}
