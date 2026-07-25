import { UserRole, UserStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class AdminUserPatchDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
