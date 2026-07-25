-- AlterTable
ALTER TABLE "User" ADD COLUMN "hasUsedFreePreview" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GuestReport" ADD COLUMN "userId" TEXT,
ADD COLUMN "isFreePreview" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "fullUnlocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "FreePreviewService" AS ENUM ('HOROSCOPE', 'BABY_NAMES', 'PORONDAM');

-- CreateTable
CREATE TABLE "FreePreviewLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestKey" TEXT,
    "ipHash" TEXT,
    "service" "FreePreviewService" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreePreviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreePreviewLog_guestKey_idx" ON "FreePreviewLog"("guestKey");

-- CreateIndex
CREATE INDEX "FreePreviewLog_ipHash_idx" ON "FreePreviewLog"("ipHash");

-- CreateIndex
CREATE INDEX "FreePreviewLog_userId_idx" ON "FreePreviewLog"("userId");

-- CreateIndex
CREATE INDEX "FreePreviewLog_createdAt_idx" ON "FreePreviewLog"("createdAt");

-- CreateIndex
CREATE INDEX "GuestReport_userId_idx" ON "GuestReport"("userId");

-- AddForeignKey
ALTER TABLE "GuestReport" ADD CONSTRAINT "GuestReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreePreviewLog" ADD CONSTRAINT "FreePreviewLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
