-- CreateTable
CREATE TABLE IF NOT EXISTS "EpiRenewalRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemLabel" TEXT,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "EpiRenewalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EpiRenewalRequest_userId_status_createdAt_idx" ON "EpiRenewalRequest"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EpiRenewalRequest_status_createdAt_idx" ON "EpiRenewalRequest"("status", "createdAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "EpiRenewalRequest" ADD CONSTRAINT "EpiRenewalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
