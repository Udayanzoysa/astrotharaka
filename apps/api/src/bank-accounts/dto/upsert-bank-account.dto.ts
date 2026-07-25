import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpsertBankAccountDto {
  @IsString()
  @MaxLength(120)
  bankName!: string;

  @IsString()
  @MaxLength(120)
  accountHolder!: string;

  @IsString()
  @MaxLength(64)
  accountNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  branch?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
