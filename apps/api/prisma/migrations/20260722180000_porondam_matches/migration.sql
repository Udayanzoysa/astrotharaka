-- CreateTable
CREATE TABLE "PorondamMatch" (
    "id" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "groomBirthDate" DATE NOT NULL,
    "groomBirthTime" TIME(0) NOT NULL,
    "groomPlaceName" TEXT NOT NULL,
    "groomLatitude" DOUBLE PRECISION,
    "groomLongitude" DOUBLE PRECISION,
    "brideName" TEXT NOT NULL,
    "brideBirthDate" DATE NOT NULL,
    "brideBirthTime" TIME(0) NOT NULL,
    "bridePlaceName" TEXT NOT NULL,
    "brideLatitude" DOUBLE PRECISION,
    "brideLongitude" DOUBLE PRECISION,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Colombo',
    "anchorsJson" JSONB,
    "reportJson" JSONB,
    "compatibilityScore" TEXT,
    "aiModel" TEXT,
    "errorMessage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PorondamMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PorondamMatch_publicToken_key" ON "PorondamMatch"("publicToken");

-- CreateIndex
CREATE INDEX "PorondamMatch_createdAt_idx" ON "PorondamMatch"("createdAt");

-- CreateIndex
CREATE INDEX "PorondamMatch_publicToken_idx" ON "PorondamMatch"("publicToken");
