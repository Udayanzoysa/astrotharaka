-- CreateTable
CREATE TABLE "BabyNameRequest" (
    "id" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "birthTime" TIME(0),
    "birthPlaceName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Colombo',
    "firstLetter" TEXT NOT NULL,
    "secondLetter" TEXT NOT NULL,
    "gender" TEXT,
    "namesJson" JSONB,
    "aiModel" TEXT,
    "errorMessage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BabyNameRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BabyNameRequest_publicToken_key" ON "BabyNameRequest"("publicToken");

-- CreateIndex
CREATE INDEX "BabyNameRequest_createdAt_idx" ON "BabyNameRequest"("createdAt");

-- CreateIndex
CREATE INDEX "BabyNameRequest_publicToken_idx" ON "BabyNameRequest"("publicToken");
