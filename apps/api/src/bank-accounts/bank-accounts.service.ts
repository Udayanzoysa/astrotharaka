import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '@astro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/errors/app.exception';
import { UpsertBankAccountDto } from './dto/upsert-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic() {
    return this.prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { bankName: 'asc' }],
      select: {
        id: true,
        bankName: true,
        accountHolder: true,
        accountNumber: true,
        branch: true,
        sortOrder: true,
      },
    });
  }

  listAdmin() {
    return this.prisma.bankAccount.findMany({
      orderBy: [{ sortOrder: 'asc' }, { bankName: 'asc' }],
    });
  }

  async getAdmin(id: string) {
    const row = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!row) {
      throw new AppException(ErrorCodes.NOT_FOUND, 'Bank account not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  create(dto: UpsertBankAccountDto) {
    return this.prisma.bankAccount.create({
      data: {
        bankName: dto.bankName.trim(),
        accountHolder: dto.accountHolder.trim(),
        accountNumber: dto.accountNumber.trim(),
        branch: dto.branch?.trim() || null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpsertBankAccountDto) {
    await this.getAdmin(id);
    return this.prisma.bankAccount.update({
      where: { id },
      data: {
        bankName: dto.bankName.trim(),
        accountHolder: dto.accountHolder.trim(),
        accountNumber: dto.accountNumber.trim(),
        branch: dto.branch?.trim() || null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async deactivate(id: string) {
    await this.getAdmin(id);
    return this.prisma.bankAccount.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
