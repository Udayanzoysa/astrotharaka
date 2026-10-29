-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "featuredImage" TEXT,
    "titleEn" TEXT NOT NULL,
    "titleSi" TEXT,
    "titleTa" TEXT,
    "excerptEn" TEXT,
    "excerptSi" TEXT,
    "excerptTa" TEXT,
    "contentEn" TEXT NOT NULL,
    "contentSi" TEXT,
    "contentTa" TEXT,
    "metaTitleEn" TEXT,
    "metaTitleSi" TEXT,
    "metaTitleTa" TEXT,
    "metaDescEn" TEXT,
    "metaDescSi" TEXT,
    "metaDescTa" TEXT,
    "keywords" TEXT,
    "category" TEXT DEFAULT 'Astrology',
    "tags" TEXT,
    "authorName" TEXT DEFAULT 'Taraka Team',
    "readingTime" INTEGER DEFAULT 3,
    "views" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT,
    "content" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogComment_blogPostId_createdAt_idx" ON "BlogComment"("blogPostId", "createdAt");

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
