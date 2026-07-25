-- AlterTable
ALTER TABLE "GuestReport" ADD COLUMN "gender" TEXT NOT NULL DEFAULT 'unspecified';
ALTER TABLE "GuestReport" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "GuestReport" ADD COLUMN "mobile" TEXT;

-- Drop defaults after backfill (new rows must supply values from the form)
ALTER TABLE "GuestReport" ALTER COLUMN "gender" DROP DEFAULT;
ALTER TABLE "GuestReport" ALTER COLUMN "email" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "GuestReport_email_idx" ON "GuestReport"("email");
