import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BlogStatus, Prisma } from '@prisma/client';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { QueryBlogPostDto } from './dto/query-blog-post.dto';
import { CreateBlogCommentDto, UploadBlogImageDto } from './dto/create-blog-comment.dto';

@Injectable()
export class BlogsService {
  private readonly logger = new Logger(BlogsService.name);
  private readonly uploadsDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.uploadsDir = resolve(process.cwd(), 'uploads', 'blogs');
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  // Helper to generate SEO-friendly slug
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async ensureUniqueSlug(desiredSlug: string, currentId?: string): Promise<string> {
    let slug = this.slugify(desiredSlug);
    if (!slug) {
      slug = `post-${randomUUID().substring(0, 8)}`;
    }

    let candidate = slug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.blogPost.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!existing || (currentId && existing.id === currentId)) {
        return candidate;
      }

      counter += 1;
      candidate = `${slug}-${counter}`;
    }
  }

  // Calculate estimated reading time in minutes
  private calculateReadingTime(content?: string): number {
    if (!content) return 2;
    // Strip HTML tags for word count
    const plainText = content.replace(/<[^>]*>/g, ' ').trim();
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 180));
  }

  // Upload blog image from Base64
  saveBlogImage(dto: UploadBlogImageDto): { url: string; filename: string } {
    let base64 = dto.imageBase64.trim();
    let ext = 'png';

    const mimeMatch = base64.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/);
    if (mimeMatch) {
      ext = mimeMatch[1].toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
      base64 = base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    } else if (dto.fileName) {
      const parts = dto.fileName.split('.');
      if (parts.length > 1) {
        ext = parts.pop()!.toLowerCase();
      }
    }

    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) ? ext : 'png';
    const filename = `blog-${Date.now()}-${randomUUID().substring(0, 8)}.${safeExt}`;
    const filePath = join(this.uploadsDir, filename);

    try {
      const buffer = Buffer.from(base64, 'base64');
      writeFileSync(filePath, buffer);
      this.logger.log(`Saved blog image: ${filename} (${buffer.length} bytes)`);
      return {
        url: `/api/v1/blogs/media/${filename}`,
        filename,
      };
    } catch (err: any) {
      this.logger.error(`Failed to save blog image: ${err?.message}`);
      throw new BadRequestException('Could not process the uploaded image.');
    }
  }

  getMediaFilePath(filename: string): string {
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const fullPath = join(this.uploadsDir, sanitized);
    if (!existsSync(fullPath)) {
      throw new NotFoundException('Blog media file not found');
    }
    return fullPath;
  }

  // --- Admin Methods ---

  async adminListPosts(query: QueryBlogPostDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 15));
    const skip = (page - 1) * limit;

    const where: Prisma.BlogPostWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { titleEn: { contains: q, mode: 'insensitive' } },
        { titleSi: { contains: q, mode: 'insensitive' } },
        { titleTa: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.blogPost.count({ where }),
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          _count: {
            select: { comments: true },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminGetPost(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    return post;
  }

  async adminCreatePost(dto: CreateBlogPostDto) {
    const rawSlug = dto.slug?.trim() || dto.titleEn;
    const slug = await this.ensureUniqueSlug(rawSlug);

    const readingTime =
      dto.readingTime ||
      this.calculateReadingTime(dto.contentEn || dto.contentSi || dto.contentTa);

    const isPublished = dto.status === BlogStatus.PUBLISHED;

    return this.prisma.blogPost.create({
      data: {
        slug,
        status: dto.status || BlogStatus.DRAFT,
        featuredImage: dto.featuredImage,
        titleEn: dto.titleEn,
        titleSi: dto.titleSi,
        titleTa: dto.titleTa,
        excerptEn: dto.excerptEn,
        excerptSi: dto.excerptSi,
        excerptTa: dto.excerptTa,
        contentEn: dto.contentEn,
        contentSi: dto.contentSi,
        contentTa: dto.contentTa,
        metaTitleEn: dto.metaTitleEn || dto.titleEn,
        metaTitleSi: dto.metaTitleSi || dto.titleSi,
        metaTitleTa: dto.metaTitleTa || dto.titleTa,
        metaDescEn: dto.metaDescEn || dto.excerptEn,
        metaDescSi: dto.metaDescSi || dto.excerptSi,
        metaDescTa: dto.metaDescTa || dto.excerptTa,
        keywords: dto.keywords,
        category: dto.category || 'Astrology',
        tags: dto.tags,
        authorName: dto.authorName || 'Taraka Team',
        readingTime,
        publishedAt: isPublished ? new Date() : null,
      },
    });
  }

  async adminUpdatePost(id: string, dto: UpdateBlogPostDto) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    let slug = existing.slug;
    if (dto.slug && dto.slug.trim() !== existing.slug) {
      slug = await this.ensureUniqueSlug(dto.slug.trim(), id);
    } else if (!dto.slug && dto.titleEn && dto.titleEn !== existing.titleEn && existing.status === BlogStatus.DRAFT) {
      // Auto-update slug if draft
      slug = await this.ensureUniqueSlug(dto.titleEn, id);
    }

    let publishedAt = existing.publishedAt;
    if (dto.status === BlogStatus.PUBLISHED && !existing.publishedAt) {
      publishedAt = new Date();
    }

    const readingTime =
      dto.readingTime ||
      this.calculateReadingTime(
        dto.contentEn || existing.contentEn || dto.contentSi || existing.contentSi || '',
      );

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...dto,
        slug,
        readingTime,
        publishedAt,
      },
    });
  }

  async adminDeletePost(id: string) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }
    return this.prisma.blogPost.delete({ where: { id } });
  }

  async adminToggleComment(commentId: string) {
    const comment = await this.prisma.blogComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.prisma.blogComment.update({
      where: { id: commentId },
      data: { isApproved: !comment.isApproved },
    });
  }

  async adminDeleteComment(commentId: string) {
    return this.prisma.blogComment.delete({ where: { id: commentId } });
  }

  // --- Public Customer Methods ---

  async publicListPosts(query: QueryBlogPostDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 9));
    const skip = (page - 1) * limit;

    const where: Prisma.BlogPostWhereInput = {
      status: BlogStatus.PUBLISHED,
    };

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.tag) {
      where.tags = { contains: query.tag, mode: 'insensitive' };
    }

    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { titleEn: { contains: q, mode: 'insensitive' } },
        { titleSi: { contains: q, mode: 'insensitive' } },
        { titleTa: { contains: q, mode: 'insensitive' } },
        { excerptEn: { contains: q, mode: 'insensitive' } },
        { excerptSi: { contains: q, mode: 'insensitive' } },
        { excerptTa: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.blogPost.count({ where }),
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          slug: true,
          status: true,
          featuredImage: true,
          titleEn: true,
          titleSi: true,
          titleTa: true,
          excerptEn: true,
          excerptSi: true,
          excerptTa: true,
          category: true,
          tags: true,
          authorName: true,
          readingTime: true,
          views: true,
          publishedAt: true,
          createdAt: true,
          _count: {
            select: { comments: true },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async publicGetPostBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: {
        slug,
        status: BlogStatus.PUBLISHED,
      },
      include: {
        comments: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            userName: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Article not found');
    }

    // Increment views asynchronously
    this.prisma.blogPost
      .update({
        where: { id: post.id },
        data: { views: { increment: 1 } },
      })
      .catch((err) => this.logger.warn(`Failed to increment views: ${err.message}`));

    return post;
  }

  async publicAddComment(slug: string, dto: CreateBlogCommentDto, userId?: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: BlogStatus.PUBLISHED },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Article not found');
    }

    return this.prisma.blogComment.create({
      data: {
        blogPostId: post.id,
        userId: userId || null,
        userName: dto.userName.trim(),
        userEmail: dto.userEmail?.trim(),
        content: dto.content.trim(),
        isApproved: true, // auto-approve comments by default, admin can toggle/delete
      },
    });
  }
}
