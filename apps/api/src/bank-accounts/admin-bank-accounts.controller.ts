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
import { BankAccountsService } from './bank-accounts.service';
import { UpsertBankAccountDto } from './dto/upsert-bank-account.dto';

@Controller('admin/bank-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT, UserRole.SUPER_ADMIN, UserRole.FINANCE)
export class AdminBankAccountsController {
  constructor(private readonly banks: BankAccountsService) {}

  @Get()
  list() {
    return this.banks.listAdmin();
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.banks.getAdmin(id);
  }

  @Post()
  create(@Body() dto: UpsertBankAccountDto) {
    return this.banks.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertBankAccountDto) {
    return this.banks.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.banks.deactivate(id);
  }
}
