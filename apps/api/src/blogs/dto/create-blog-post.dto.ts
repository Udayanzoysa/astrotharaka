import { BlogStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBlogPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleEn?: string;

  @IsOptional()
  @IsString()
  titleSi?: string;

  @IsOptional()
  @IsString()
  titleTa?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsOptional()
  @IsString()
  excerptEn?: string;

  @IsOptional()
  @IsString()
  excerptSi?: string;

  @IsOptional()
  @IsString()
  excerptTa?: string;

  @IsOptional()
  @IsString()
  contentEn?: string;

  @IsOptional()
  @IsString()
  contentSi?: string;

  @IsOptional()
  @IsString()
  contentTa?: string;

  @IsOptional()
  @IsString()
  metaTitleEn?: string;

  @IsOptional()
  @IsString()
  metaTitleSi?: string;

  @IsOptional()
  @IsString()
  metaTitleTa?: string;

  @IsOptional()
  @IsString()
  metaDescEn?: string;

  @IsOptional()
  @IsString()
  metaDescSi?: string;

  @IsOptional()
  @IsString()
  metaDescTa?: string;

  @IsOptional()
  @IsString()
  keywords?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsInt()
  readingTime?: number;
}
