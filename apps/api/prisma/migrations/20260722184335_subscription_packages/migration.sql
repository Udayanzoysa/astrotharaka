-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuotaService" AS ENUM ('BABY_NAMES', 'PORONDAM', 'HOROSCOPE');

-- AlterTable
ALTER TABLE "_PromotionProducts" ADD CONSTRAINT "_PromotionProducts_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_PromotionProducts_AB_unique";

-- CreateTable
CREATE TABLE "SubscriptionPackage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameSi" TEXT,
    "nameTa" TEXT,
    "descriptionEn" TEXT,
    "descriptionSi" TEXT,
    "descriptionTa" TEXT,
    "priceLkr" DECIMAL(12,2) NOT NULL,
    "babyNamesQuota" INTEGER NOT NULL DEFAULT 3,
    "porondamQuota" INTEGER NOT NULL DEFAULT 2,
    "horoscopeQuota" INTEGER NOT NULL DEFAULT 2,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageCode" TEXT NOT NULL,
    "packageNameEn" TEXT NOT NULL,
    "packageNameSi" TEXT,
    "priceLkr" DECIMAL(12,2) NOT NULL,
    "babyNamesQuota" INTEGER NOT NULL,
    "porondamQuota" INTEGER NOT NULL,
    "horoscopeQuota" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "paymentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "babyNamesUsed" INTEGER NOT NULL DEFAULT 0,
    "porondamUsed" INTEGER NOT NULL DEFAULT 0,
    "horoscopeUsed" INTEGER NOT NULL DEFAULT 0,
    "monthCycle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPackage_code_key" ON "SubscriptionPackage"("code");

-- CreateIndex
CREATE INDEX "SubscriptionPackage_isActive_sortOrder_idx" ON "SubscriptionPackage"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_status_idx" ON "UserSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "UserSubscription_expiresAt_idx" ON "UserSubscription"("expiresAt");

-- CreateIndex
CREATE INDEX "UserSubscription_packageId_idx" ON "UserSubscription"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionUsage_subscriptionId_key" ON "SubscriptionUsage"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionUsage_userId_idx" ON "SubscriptionUsage"("userId");

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubscriptionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionUsage" ADD CONSTRAINT "SubscriptionUsage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "UserSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
