-- Add photo proof path to EPI issuance
ALTER TABLE "EpiIssuance"
ADD COLUMN IF NOT EXISTS "photoProofPath" TEXT;

