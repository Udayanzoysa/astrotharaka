import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { extname } from 'path';
import { BlogsService } from './blogs.service';
import { QueryBlogPostDto } from './dto/query-blog-post.dto';
import { CreateBlogCommentDto } from './dto/create-blog-comment.dto';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  list(@Query() query: QueryBlogPostDto) {
    return this.blogsService.publicListPosts(query);
  }

  @Get('media/:filename')
  streamMedia(@Param('filename') filename: string, @Res({ passthrough: true }) res: Response) {
    const filePath = this.blogsService.getMediaFilePath(filename);
    const ext = extname(filePath).toLowerCase();
    const mimeType = MIME_MAP[ext] || 'application/octet-stream';

    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    const fileStream = createReadStream(filePath);
    return new StreamableFile(fileStream);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.blogsService.publicGetPostBySlug(slug);
  }

  @Post(':slug/comments')
  addComment(
    @Param('slug') slug: string,
    @Body() dto: CreateBlogCommentDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id;
    return this.blogsService.publicAddComment(slug, dto, userId);
  }
}
