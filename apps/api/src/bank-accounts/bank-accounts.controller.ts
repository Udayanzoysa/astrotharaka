import { Controller, Get } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';

@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly banks: BankAccountsService) {}

  /** Public list of active bank accounts for checkout. */
  @Get()
  list() {
    return this.banks.listPublic();
  }
}
