-- AlterTable
ALTER TABLE "GuestReport" ADD COLUMN IF NOT EXISTS "focusTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];
