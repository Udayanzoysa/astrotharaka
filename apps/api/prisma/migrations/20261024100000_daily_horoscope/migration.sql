-- CreateEnum
CREATE TYPE "HoroscopePeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "DailyHoroscope" (
    "id" TEXT NOT NULL,
    "period" "HoroscopePeriod" NOT NULL DEFAULT 'DAILY',
    "periodKey" TEXT NOT NULL,
    "dateDisplay" TEXT NOT NULL,
    "panchanga" JSONB NOT NULL,
    "generalNotes" TEXT NOT NULL,
    "lagnaPredictions" JSONB NOT NULL,
    "socialPost" TEXT,
    "socialPostedAt" TIMESTAMP(3),
    "socialPostId" TEXT,
    "socialPostStatus" TEXT DEFAULT 'PENDING',
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyHoroscope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyHoroscope_period_periodKey_key" ON "DailyHoroscope"("period", "periodKey");

-- CreateIndex
CREATE INDEX "DailyHoroscope_period_periodKey_idx" ON "DailyHoroscope"("period", "periodKey");

-- CreateIndex
CREATE INDEX "DailyHoroscope_createdAt_idx" ON "DailyHoroscope"("createdAt");
