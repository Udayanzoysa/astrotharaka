import { Module } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccountsController } from './bank-accounts.controller';
import { AdminBankAccountsController } from './admin-bank-accounts.controller';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  controllers: [BankAccountsController, AdminBankAccountsController],
  providers: [BankAccountsService, RolesGuard],
  exports: [BankAccountsService],
})
export class BankAccountsModule {}
