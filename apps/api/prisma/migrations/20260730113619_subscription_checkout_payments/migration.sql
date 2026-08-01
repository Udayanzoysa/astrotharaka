-- CreateEnum
CREATE TYPE "SubscriptionCheckoutStatus" AS ENUM ('AWAITING_PAYMENT', 'PAYMENT_UNDER_REVIEW', 'PAID', 'ACTIVATED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SubscriptionCheckout" (
    "id" TEXT NOT NULL,
    "checkoutNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageCode" TEXT NOT NULL,
    "packageNameEn" TEXT NOT NULL,
    "priceLkr" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "status" "SubscriptionCheckoutStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "userSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "SubscriptionCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "providerRef" TEXT,
    "bankSlipUrl" TEXT,
    "bankAccountId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCheckout_checkoutNumber_key" ON "SubscriptionCheckout"("checkoutNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCheckout_userSubscriptionId_key" ON "SubscriptionCheckout"("userSubscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionCheckout_userId_status_idx" ON "SubscriptionCheckout"("userId", "status");

-- CreateIndex
CREATE INDEX "SubscriptionCheckout_status_createdAt_idx" ON "SubscriptionCheckout"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_idempotencyKey_key" ON "SubscriptionPayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_checkoutId_idx" ON "SubscriptionPayment"("checkoutId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_providerRef_idx" ON "SubscriptionPayment"("providerRef");

-- AddForeignKey
ALTER TABLE "SubscriptionCheckout" ADD CONSTRAINT "SubscriptionCheckout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionCheckout" ADD CONSTRAINT "SubscriptionCheckout_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubscriptionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionCheckout" ADD CONSTRAINT "SubscriptionCheckout_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "SubscriptionCheckout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
