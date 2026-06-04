import Anthropic from "@anthropic-ai/sdk";
import type { Prisma } from "@prisma/client";
import { resolveAnthropicApiKey } from "./integrationKeys.js";

const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are an expert training content specialist for a Moroccan transport and logistics company. Your job is to create professional employee assessment quizzes.

You will receive course material written in Arabic. You must generate exactly 10 multiple-choice questions that test genuine understanding of the material.

STRICT OUTPUT FORMAT — return ONLY a valid JSON array, no markdown, no explanation, no preamble. If you add anything outside the JSON array, the system will break.

Each question object must follow this exact structure:
{
  "id": number (1-10),
  "difficulty": "easy" | "medium" | "hard",
  "question": { "ar": "...", "fr": "...", "en": "..." },
  "options": {
    "A": { "ar": "...", "fr": "...", "en": "..." },
    "B": { "ar": "...", "fr": "...", "en": "..." },
    "C": { "ar": "...", "fr": "...", "en": "..." },
    "D": { "ar": "...", "fr": "...", "en": "..." }
  },
  "correct": "A" | "B" | "C" | "D",
  "explanation": { "ar": "...", "fr": "...", "en": "..." }
}

Distribution: 4 easy questions, 4 medium, 2 hard.
Questions must be based STRICTLY on the provided material — no external knowledge.
All translations must be natural and accurate — not literal machine translation.
Arabic text in the JSON must use proper Modern Standard Arabic (فصحى).`;

const RETRY_SYSTEM = `${SYSTEM_PROMPT}

CRITICAL: Your previous response was not valid JSON. Output ONLY the raw JSON array. No markdown fences. No commentary.`;

export type QuizQuestionJson = {
  id: number;
  emoji?: string;
  difficulty: "easy" | "medium" | "hard";
  question: { ar: string; fr: string; en: string };
  options: {
    A: { ar: string; fr: string; en: string };
    B: { ar: string; fr: string; en: string };
    C: { ar: string; fr: string; en: string };
    D: { ar: string; fr: string; en: string };
  };
  correct: "A" | "B" | "C" | "D";
  explanation: { ar: string; fr: string; en: string };
};

async function getClient(): Promise<Anthropic> {
  const key = await resolveAnthropicApiKey();
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({ apiKey: key });
}

function cleanPdfText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s*\d+\s*$/gm, "")
    .trim();
}

/** ~6000 tokens via char estimate ÷ 4 */
function trimToTokenBudget(text: string, maxTokens = 6000): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

function parseJsonArray(raw: string): QuizQuestionJson[] {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(s);
  if (fence) s = fence[1].trim();
  const arrayMatch = /\[[\s\S]*\]/.exec(s);
  if (arrayMatch) s = arrayMatch[0];
  const parsed = JSON.parse(s) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Response is not a JSON array");
  return parsed as QuizQuestionJson[];
}

function validateQuestions(qs: QuizQuestionJson[]): void {
  if (qs.length !== 10) throw new Error(`Expected 10 questions, got ${qs.length}`);
  const langs = ["ar", "fr", "en"] as const;
  for (const q of qs) {
    if (!q.question || !q.options || !q.explanation) throw new Error("Invalid question shape");
    for (const lang of langs) {
      if (!q.question[lang]?.trim()) throw new Error(`Missing question.${lang}`);
      for (const key of ["A", "B", "C", "D"] as const) {
        if (!q.options[key]?.[lang]?.trim()) throw new Error(`Missing option ${key}.${lang}`);
      }
      if (!q.explanation[lang]?.trim()) throw new Error(`Missing explanation.${lang}`);
    }
    if (!["A", "B", "C", "D"].includes(q.correct)) throw new Error("Invalid correct option");
  }
}

export async function generateQuizFromArabicText(
  extractedText: string
): Promise<QuizQuestionJson[]> {
  const cleaned = cleanPdfText(extractedText);
  if (!cleaned) {
    throw new Error(
      "PDF text extraction failed — ensure the PDF is not a scanned image. Use OCR first."
    );
  }
  const body = trimToTokenBudget(cleaned);
  const client = await getClient();
  const userMessage = `Course material (Arabic):\n${body}\n\nGenerate the 10 quiz questions now.`;

  async function call(system: string): Promise<QuizQuestionJson[]> {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 16384,
      system,
      messages: [{ role: "user", content: userMessage }],
    });
    const textBlock = msg.content.find((b: { type: string }) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Empty response from model");
    }
    try {
      const qs = parseJsonArray(textBlock.text);
      validateQuestions(qs);
      return qs;
    } catch (firstErr) {
      const retry = await client.messages.create({
        model: MODEL,
        max_tokens: 16384,
        system: RETRY_SYSTEM,
        messages: [
          {
            role: "user",
            content: `${userMessage}\n\nPrevious output was invalid: ${String(firstErr)}. Fix and output valid JSON array only.`,
          },
        ],
      });
      const tb = retry.content.find((b: { type: string }) => b.type === "text");
      if (!tb || tb.type !== "text") throw new Error("Empty retry response");
      const qs = parseJsonArray(tb.text);
      validateQuestions(qs);
      return qs;
    }
  }

  return call(SYSTEM_PROMPT);
}

export function questionsToPrismaJson(
  qs: QuizQuestionJson[]
): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(qs)) as Prisma.InputJsonValue;
}
