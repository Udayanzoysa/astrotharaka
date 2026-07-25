-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- AlterTable: new default for status is PENDING_VERIFICATION (existing rows stay as-is)
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';

-- Backfill verified timestamp for already-active users
UPDATE "User" SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", "createdAt") WHERE "status" = 'ACTIVE';

-- CreateEnum
CREATE TYPE "AuthChallengePurpose" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "AuthChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "purpose" "AuthChallengePurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthChallenge_email_purpose_idx" ON "AuthChallenge"("email", "purpose");

-- CreateIndex
CREATE INDEX "AuthChallenge_userId_idx" ON "AuthChallenge"("userId");

-- AddForeignKey
ALTER TABLE "AuthChallenge" ADD CONSTRAINT "AuthChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
