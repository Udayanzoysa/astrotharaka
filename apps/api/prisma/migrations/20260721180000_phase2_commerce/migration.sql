-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'AWAITING_PAYMENT', 'PAYMENT_UNDER_REVIEW', 'PAID', 'GENERATING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'FAILED', 'REJECTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYHERE', 'BANK_TRANSFER', 'DEV_CONFIRM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('QUEUED', 'CALCULATING', 'GENERATING_CONTENT', 'RENDERING_PDF', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameSi" TEXT,
    "nameTa" TEXT,
    "descriptionEn" TEXT NOT NULL,
    "descriptionSi" TEXT,
    "descriptionTa" TEXT,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 15,
    "supportedLanguages" "LanguageCode"[],
    "samplePreviewUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "amount" DECIMAL(12,2) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "birthProfileId" TEXT NOT NULL,
    "language" "LanguageCode" NOT NULL DEFAULT 'en',
    "status" "OrderStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "productPriceAmount" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "providerRef" TEXT,
    "bankSlipUrl" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedReport" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ReportStatus" NOT NULL DEFAULT 'QUEUED',
    "language" "LanguageCode" NOT NULL,
    "title" TEXT,
    "contentText" TEXT,
    "pdfStorageKey" TEXT,
    "downloadUrl" TEXT,
    "engineVersion" TEXT,
    "aiModel" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "readyAt" TIMESTAMP(3),
    CONSTRAINT "GeneratedReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "ProductPrice_productId_isCurrent_idx" ON "ProductPrice"("productId", "isCurrent");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE UNIQUE INDEX "GeneratedReport_orderId_version_key" ON "GeneratedReport"("orderId", "version");
CREATE INDEX "GeneratedReport_orderId_idx" ON "GeneratedReport"("orderId");

-- AddForeignKey
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_birthProfileId_fkey" FOREIGN KEY ("birthProfileId") REFERENCES "BirthProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedReport" ADD CONSTRAINT "GeneratedReport_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
