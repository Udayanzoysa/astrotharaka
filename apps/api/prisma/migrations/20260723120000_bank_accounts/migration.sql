-- Admin-managed bank accounts + payment linkage / reference search
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "branch" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BankAccount_isActive_sortOrder_idx" ON "BankAccount"("isActive", "sortOrder");

ALTER TABLE "Payment" ADD COLUMN "bankAccountId" TEXT;

CREATE INDEX "Payment_providerRef_idx" ON "Payment"("providerRef");
CREATE INDEX "Payment_bankAccountId_idx" ON "Payment"("bankAccountId");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
