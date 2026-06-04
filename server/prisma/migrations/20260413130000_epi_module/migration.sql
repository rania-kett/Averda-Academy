-- CreateTable
CREATE TABLE "EpiProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shoeSize" TEXT,
    "gloveSize" TEXT,
    "vestSize" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EpiProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpiIssuance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "size" TEXT,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReplacementAt" TIMESTAMP(3),

    CONSTRAINT "EpiIssuance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpiReceptionConfirmation" (
    "id" TEXT NOT NULL,
    "issuanceId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureName" TEXT,
    "notes" TEXT,

    CONSTRAINT "EpiReceptionConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpiReplacementRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuanceId" TEXT,
    "itemType" TEXT NOT NULL,
    "requestedSize" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "EpiReplacementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpiComplianceProof" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpiComplianceProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpiFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpiFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EpiProfile_userId_key" ON "EpiProfile"("userId");

-- CreateIndex
CREATE INDEX "EpiIssuance_userId_status_idx" ON "EpiIssuance"("userId", "status");

-- CreateIndex
CREATE INDEX "EpiReceptionConfirmation_issuanceId_confirmedAt_idx" ON "EpiReceptionConfirmation"("issuanceId", "confirmedAt");

-- CreateIndex
CREATE INDEX "EpiReplacementRequest_userId_status_createdAt_idx" ON "EpiReplacementRequest"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "EpiComplianceProof_userId_createdAt_idx" ON "EpiComplianceProof"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EpiFeedback_userId_createdAt_idx" ON "EpiFeedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "EpiProfile" ADD CONSTRAINT "EpiProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpiIssuance" ADD CONSTRAINT "EpiIssuance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpiReceptionConfirmation" ADD CONSTRAINT "EpiReceptionConfirmation_issuanceId_fkey" FOREIGN KEY ("issuanceId") REFERENCES "EpiIssuance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpiReplacementRequest" ADD CONSTRAINT "EpiReplacementRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpiReplacementRequest" ADD CONSTRAINT "EpiReplacementRequest_issuanceId_fkey" FOREIGN KEY ("issuanceId") REFERENCES "EpiIssuance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpiComplianceProof" ADD CONSTRAINT "EpiComplianceProof_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpiFeedback" ADD CONSTRAINT "EpiFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

