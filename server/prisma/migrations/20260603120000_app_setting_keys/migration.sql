-- Encrypted API keys for admin settings UI (Anthropic, ElevenLabs)
CREATE TABLE IF NOT EXISTS "AppSettingKey" (
    "key" TEXT NOT NULL,
    "valueEncrypted" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedByUserId" TEXT,

    CONSTRAINT "AppSettingKey_pkey" PRIMARY KEY ("key")
);
