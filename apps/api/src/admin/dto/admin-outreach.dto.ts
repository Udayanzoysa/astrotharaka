import {
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { UserStatus } from '@prisma/client';

export class AdminUsersBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsEnum(UserStatus)
  status!: UserStatus;
}

export class AdminPromoEmailDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  userIds?: string[];

  @IsOptional()
  @IsIn(['selected', 'active_marketing', 'all_active'])
  segment?: 'selected' | 'active_marketing' | 'all_active';

  @IsString()
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MaxLength(5000)
  message!: string;
}

export class AdminGuestOutreachDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsString()
  templateId!: string;

  @IsIn(['email', 'sms'])
  channel!: 'email' | 'sms';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  extraMessage?: string;
}
