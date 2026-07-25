-- CreateTable
CREATE TABLE "GuestReport" (
    "id" TEXT NOT NULL,
    "downloadToken" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "birthTime" TIME(0),
    "unknownBirthTime" BOOLEAN NOT NULL DEFAULT false,
    "birthPlaceName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Colombo',
    "language" "LanguageCode" NOT NULL DEFAULT 'si',
    "status" "ReportStatus" NOT NULL DEFAULT 'QUEUED',
    "title" TEXT,
    "contentText" TEXT,
    "pdfStorageKey" TEXT,
    "engineVersion" TEXT,
    "aiModel" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "readyAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "GuestReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestReport_downloadToken_key" ON "GuestReport"("downloadToken");

-- CreateIndex
CREATE INDEX "GuestReport_status_idx" ON "GuestReport"("status");

-- CreateIndex
CREATE INDEX "GuestReport_createdAt_idx" ON "GuestReport"("createdAt");
