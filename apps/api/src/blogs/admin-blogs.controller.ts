import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BlogsService } from './blogs.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { QueryBlogPostDto } from './dto/query-blog-post.dto';
import { UploadBlogImageDto } from './dto/create-blog-comment.dto';

@Controller('admin/blogs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT, UserRole.SUPER_ADMIN)
export class AdminBlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  list(@Query() query: QueryBlogPostDto) {
    return this.blogsService.adminListPosts(query);
  }

  @Post('upload-image')
  uploadImage(@Body() dto: UploadBlogImageDto) {
    return this.blogsService.saveBlogImage(dto);
  }

  @Post()
  create(@Body() dto: CreateBlogPostDto) {
    return this.blogsService.adminCreatePost(dto);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogsService.adminGetPost(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogsService.adminUpdatePost(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogsService.adminDeletePost(id);
  }

  @Patch('comments/:commentId/toggle')
  toggleComment(@Param('commentId', ParseUUIDPipe) commentId: string) {
    return this.blogsService.adminToggleComment(commentId);
  }

  @Delete('comments/:commentId')
  deleteComment(@Param('commentId', ParseUUIDPipe) commentId: string) {
    return this.blogsService.adminDeleteComment(commentId);
  }
}
