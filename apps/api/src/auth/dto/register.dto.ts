import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LanguageCode } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @IsOptional()
  @IsEnum(LanguageCode)
  preferredLanguage?: LanguageCode;
}
