-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "promotionId" TEXT;
ALTER TABLE "Order" ADD COLUMN "promoCode" TEXT;

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(12,2) NOT NULL,
    "minOrderAmount" DECIMAL(12,2),
    "maxRedemptions" INTEGER,
    "perCustomerLimit" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRedemption" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PromotionProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");
CREATE UNIQUE INDEX "PromotionRedemption_orderId_key" ON "PromotionRedemption"("orderId");
CREATE INDEX "PromotionRedemption_promotionId_userId_idx" ON "PromotionRedemption"("promotionId", "userId");
CREATE UNIQUE INDEX "_PromotionProducts_AB_unique" ON "_PromotionProducts"("A", "B");
CREATE INDEX "_PromotionProducts_B_index" ON "_PromotionProducts"("B");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PromotionProducts" ADD CONSTRAINT "_PromotionProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PromotionProducts" ADD CONSTRAINT "_PromotionProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
