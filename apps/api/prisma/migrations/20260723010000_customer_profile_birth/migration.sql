-- AlterTable
ALTER TABLE "CustomerProfile" ADD COLUMN "birthDate" DATE,
ADD COLUMN "birthTime" TIME(0),
ADD COLUMN "unknownBirthTime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "birthPlaceName" TEXT;
