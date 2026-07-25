import { IsEmail, IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(4)
  code!: string;
}
