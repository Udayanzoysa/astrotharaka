import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBlogCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  userName!: string;

  @IsOptional()
  @IsEmail()
  userEmail?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  content!: string;
}

export class UploadBlogImageDto {
  @IsString()
  imageBase64!: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}
