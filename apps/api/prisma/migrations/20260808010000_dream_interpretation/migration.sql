-- AlterEnum FreePreviewService
ALTER TYPE "FreePreviewService" ADD VALUE 'DREAM_INTERPRETATION';

-- AlterEnum QuotaService
ALTER TYPE "QuotaService" ADD VALUE 'DREAM_INTERPRETATION';

-- AlterTable SubscriptionPackage
ALTER TABLE "SubscriptionPackage" ADD COLUMN "dreamInterpretationQuota" INTEGER NOT NULL DEFAULT 5;

-- AlterTable UserSubscription
ALTER TABLE "UserSubscription" ADD COLUMN "dreamInterpretationQuota" INTEGER NOT NULL DEFAULT 5;

-- AlterTable SubscriptionUsage
ALTER TABLE "SubscriptionUsage" ADD COLUMN "dreamInterpretationUsed" INTEGER NOT NULL DEFAULT 0;

-- CreateTable DreamInterpretation
CREATE TABLE "DreamInterpretation" (
    "id" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "dreamText" TEXT NOT NULL,
    "reportJson" JSONB,
    "category" TEXT,
    "confidence" TEXT,
    "aiModel" TEXT,
    "errorMessage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DreamInterpretation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DreamInterpretation_publicToken_key" ON "DreamInterpretation"("publicToken");
CREATE INDEX "DreamInterpretation_createdAt_idx" ON "DreamInterpretation"("createdAt");
CREATE INDEX "DreamInterpretation_publicToken_idx" ON "DreamInterpretation"("publicToken");
