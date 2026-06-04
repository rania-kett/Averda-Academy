import Anthropic from "@anthropic-ai/sdk";
import { resolveAnthropicApiKey } from "./integrationKeys.js";

export const AI_MODEL = "claude-sonnet-4-5";

export async function getAnthropicClient(): Promise<Anthropic> {
  const apiKey = await resolveAnthropicApiKey();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({ apiKey });
}

function extractJson(raw: string): string {
  let s = String(raw || "").trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(s);
  if (fence) s = fence[1].trim();
  // Try object first
  const obj = /\{[\s\S]*\}/.exec(s);
  if (obj) return obj[0];
  // Else array
  const arr = /\[[\s\S]*\]/.exec(s);
  if (arr) return arr[0];
  return s;
}

export async function claudeJson<T>(params: {
  system: string;
  user: string;
  maxTokens: number;
  endpointLabel: string;
  retryOnce?: boolean;
}): Promise<{ parsed: T; rawText: string; durationMs: number; tokensUsed?: number }> {
  const client = await getAnthropicClient();
  const started = Date.now();

  async function call(system: string): Promise<{ text: string; tokensUsed?: number }> {
    const msg = await client.messages.create({
      model: AI_MODEL,
      max_tokens: params.maxTokens,
      system,
      messages: [{ role: "user", content: params.user }],
    });
    const tb = msg.content.find((b: { type: string }) => b.type === "text");
    const text = tb && tb.type === "text" ? tb.text : "";
    const tokensUsed =
      (msg as any)?.usage?.output_tokens != null
        ? Number((msg as any).usage.output_tokens) + Number((msg as any).usage.input_tokens ?? 0)
        : undefined;
    return { text, tokensUsed };
  }

  let lastText = "";
  let tokensUsed: number | undefined;
  try {
    const r1 = await call(params.system);
    lastText = r1.text;
    tokensUsed = r1.tokensUsed;
    const json = extractJson(lastText);
    const parsed = JSON.parse(json) as T;
    const durationMs = Date.now() - started;
    console.info(`[Claude] ${params.endpointLabel} | tokens_used=${tokensUsed ?? "?"} | duration_ms=${durationMs}`);
    return { parsed, rawText: lastText, durationMs, tokensUsed };
  } catch (e1: any) {
    if (!params.retryOnce) {
      const durationMs = Date.now() - started;
      console.info(`[Claude] ${params.endpointLabel} | tokens_used=${tokensUsed ?? "?"} | duration_ms=${durationMs}`);
      throw e1;
    }
    const retrySystem = `${params.system}\n\nCRITICAL: Return ONLY valid JSON. No markdown. No commentary.`;
    const r2 = await call(retrySystem);
    lastText = r2.text;
    tokensUsed = r2.tokensUsed;
    const json = extractJson(lastText);
    const parsed = JSON.parse(json) as T;
    const durationMs = Date.now() - started;
    console.info(`[Claude] ${params.endpointLabel} | tokens_used=${tokensUsed ?? "?"} | duration_ms=${durationMs}`);
    return { parsed, rawText: lastText, durationMs, tokensUsed };
  }
}

