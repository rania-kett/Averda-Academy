import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/prisma.js";
import { decryptSettingValue, encryptSettingValue } from "../utils/settingsCrypto.js";

export const ALLOWED_SETTING_KEYS = ["ANTHROPIC_API_KEY", "ELEVENLABS_API_KEY"] as const;
export type AllowedSettingKey = (typeof ALLOWED_SETTING_KEYS)[number];

const ENV_FALLBACK: Record<AllowedSettingKey, string> = {
  ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY",
  ELEVENLABS_API_KEY: "ELEVENLABS_API_KEY",
};

export function maskApiKey(value: string): string {
  const v = value.trim();
  if (v.length <= 8) return "****";
  return `${v.slice(0, 8)}****`;
}

async function readEncryptedFromDb(key: AllowedSettingKey): Promise<string | null> {
  try {
    const row = await prisma.appSettingKey.findUnique({ where: { key } });
    if (!row?.valueEncrypted) return null;
    return decryptSettingValue(row.valueEncrypted);
  } catch {
    return null;
  }
}

/** DB value takes priority over process.env */
export async function resolveAnthropicApiKey(): Promise<string | null> {
  const fromDb = await readEncryptedFromDb("ANTHROPIC_API_KEY");
  if (fromDb?.trim()) return fromDb.trim();
  const fromEnv = process.env.ANTHROPIC_API_KEY?.trim();
  return fromEnv || null;
}

export async function resolveElevenLabsApiKey(): Promise<string | null> {
  const fromDb = await readEncryptedFromDb("ELEVENLABS_API_KEY");
  if (fromDb?.trim()) return fromDb.trim();
  const fromEnv = process.env.ELEVENLABS_API_KEY?.trim();
  return fromEnv || null;
}

export type KeyMeta = {
  configured: boolean;
  masked: string | null;
  source: "db" | "env" | null;
};

export async function getKeyMeta(key: AllowedSettingKey): Promise<KeyMeta> {
  const fromDb = await readEncryptedFromDb(key);
  if (fromDb?.trim()) {
    return { configured: true, masked: maskApiKey(fromDb), source: "db" };
  }
  const envVal = process.env[ENV_FALLBACK[key]]?.trim();
  if (envVal) {
    return { configured: true, masked: maskApiKey(envVal), source: "env" };
  }
  return { configured: false, masked: null, source: null };
}

export async function saveIntegrationKey(
  key: AllowedSettingKey,
  value: string,
  updatedByUserId?: string
): Promise<void> {
  const trimmed = value.trim();
  if (trimmed.length < 8) {
    throw new Error("API key too short");
  }
  const valueEncrypted = encryptSettingValue(trimmed);
  await prisma.appSettingKey.upsert({
    where: { key },
    create: { key, valueEncrypted, updatedByUserId: updatedByUserId ?? null },
    update: { valueEncrypted, updatedByUserId: updatedByUserId ?? null },
  });
}

export async function testAnthropicKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = new Anthropic({ apiKey });
    await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with OK only." }],
    });
    return { success: true, message: "الاتصال بـ Anthropic ناجح" };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "فشل الاتصال";
    return { success: false, message: msg.slice(0, 200) };
  }
}

export async function testElevenLabsKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": apiKey },
    });
    if (!res.ok) {
      return { success: false, message: `ElevenLabs HTTP ${res.status}` };
    }
    return { success: true, message: "الاتصال بـ ElevenLabs ناجح" };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "فشل الاتصال";
    return { success: false, message: msg.slice(0, 200) };
  }
}

export async function testIntegrationKey(key: AllowedSettingKey): Promise<{ success: boolean; message: string }> {
  const resolved =
    key === "ANTHROPIC_API_KEY" ? await resolveAnthropicApiKey() : await resolveElevenLabsApiKey();
  if (!resolved) {
    return { success: false, message: "المفتاح غير مُعيَّن" };
  }
  if (key === "ANTHROPIC_API_KEY") return testAnthropicKey(resolved);
  return testElevenLabsKey(resolved);
}
