import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSmtpSettingsDto {
  @IsString()
  host!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @IsBoolean()
  secure!: boolean;

  @IsString()
  user!: string;

  @IsString()
  from!: string;

  /** Leave blank to keep the saved password. */
  @IsOptional()
  @IsString()
  pass?: string;
}

export class SendTestEmailDto {
  @IsEmail()
  to!: string;
}
