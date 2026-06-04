import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.0-flash";

export type TriLang = { ar: string; fr: string; en: string };
export type Lang = keyof TriLang;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitError(err: unknown): boolean {
  const anyErr = err as { status?: number; message?: string } | null;
  return anyErr?.status === 429 || Boolean(anyErr?.message?.includes("429"));
}

async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  opts?: { maxRetries?: number; baseDelayMs?: number }
): Promise<T> {
  const maxRetries = opts?.maxRetries ?? 5;
  const baseDelayMs = opts?.baseDelayMs ?? 1200;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      if (!isRateLimitError(e) || attempt > maxRetries) throw e;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`Gemini rate limited (429). Retry ${attempt}/${maxRetries} in ${delay}ms`);
      await sleep(delay);
    }
  }
}

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: MODEL });
}

function parseJsonObject(raw: string): Record<string, unknown> {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(s);
  if (fence) s = fence[1].trim();
  const objMatch = /\{[\s\S]*\}/.exec(s);
  if (objMatch) s = objMatch[0];
  const parsed = JSON.parse(s) as unknown;
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Response is not a JSON object");
  }
  return parsed as Record<string, unknown>;
}

function normalizeTriLang(v: unknown): TriLang {
  const o = v as Partial<Record<Lang, unknown>> | null;
  const ar = String(o?.ar ?? "").trim();
  const fr = String(o?.fr ?? "").trim();
  const en = String(o?.en ?? "").trim();
  if (!ar || !fr || !en) {
    throw new Error("Missing ar/fr/en translation");
  }
  return { ar, fr, en };
}

export async function translateToTriLang(opts: {
  sourceLang: Lang;
  text: string;
  field: "title" | "description";
}): Promise<TriLang> {
  const model = getModel();
  const text = (opts.text || "").trim();
  if (!text) throw new Error("Text is empty");

  const instructions =
    opts.field === "title"
      ? `Translate the course TITLE into Arabic (Modern Standard Arabic), French, and English.
Keep it concise. Preserve emojis and punctuation.`
      : `Translate the course DESCRIPTION into Arabic (Modern Standard Arabic), French, and English.
Keep it natural and professional for employee training content. Preserve any bullet points.`;

  const system = `Return ONLY valid JSON, no markdown.
Schema: {"ar":"...","fr":"...","en":"..."}.
Do not include any extra keys.`;

  const user = `${instructions}

The original language is: ${opts.sourceLang}
Text:
${text}`;

  const res = await withGeminiRetry(
    () =>
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: {
          maxOutputTokens: opts.field === "title" ? 512 : 1024,
          temperature: 0.2,
        },
      }),
    { maxRetries: 5, baseDelayMs: 1500 }
  );

  const out = res.response.text();
  if (!out?.trim()) throw new Error("Empty response from model");
  return normalizeTriLang(parseJsonObject(out));
}

