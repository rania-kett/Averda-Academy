import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const VISION_MODEL = "claude-sonnet-4-20250514";

function getAnthropic(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
}

async function extractTextFromImagePng(
  pngBuffer: Buffer,
  pageNum: number,
  totalPages: number
): Promise<string> {
  const client = getAnthropic();
  const base64 = pngBuffer.toString("base64");
  const msg = await client.messages.create({
    model: VISION_MODEL,
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: base64,
            },
          },
          {
            type: "text",
            text: `Extract ALL text from this training slide image (page ${pageNum} of ${totalPages}). This is an Arabic safety training document. Return only the extracted text, preserving structure. Include all Arabic text, titles, bullet points, and table content. Use UTF-8 Arabic characters.`,
          },
        ],
      },
    ],
  });
  const block = msg.content.find((b) => b.type === "text");
  if (block && block.type === "text") {
    return block.text.trim();
  }
  return "";
}

export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const data = await pdfParse(buffer);
  return data.numpages || 1;
}

async function renderPageWithPdfJs(
  pdfPath: string,
  pageNumber: number
): Promise<Buffer | null> {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    verbosity: 0,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const scale = 150 / 72;
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(
    Math.floor(viewport.width),
    Math.floor(viewport.height)
  );
  const context = canvas.getContext("2d");
  await page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise;
  return canvas.toBuffer("image/png");
}

export type ExtractProgress = (info: {
  page: number;
  total: number;
}) => void;

/**
 * Primary: pdf2pic (ImageMagick). Fallback: pdfjs-dist + canvas PNG per page.
 * Concatenates Vision-extracted UTF-8 Arabic text from each page.
 */
export async function extractTextFromPdfFile(
  pdfPath: string,
  onProgress?: ExtractProgress
): Promise<{ text: string; pageCount: number; method: "pdf2pic" | "pdfjs" }> {
  const buffer = fs.readFileSync(pdfPath);
  const pageCount = await getPdfPageCount(buffer);
  let method: "pdf2pic" | "pdfjs" = "pdf2pic";
  const parts: string[] = [];

  let pdf2picOk = false;
  try {
    const mod = await import("pdf2pic");
    const fromPath = mod.fromPath as typeof import("pdf2pic").fromPath;
    const tmpDir = path.join(path.dirname(pdfPath), `.tmp-pdf-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    const convert = fromPath(pdfPath, {
      density: 150,
      saveFilename: "page",
      savePath: tmpDir,
      format: "png",
      width: 1200,
      height: 1600,
    });
    for (let i = 1; i <= pageCount; i++) {
      onProgress?.({ page: i, total: pageCount });
      const result = await convert(i, { responseType: "buffer" });
      let pngBuf: Buffer | undefined;
      if (result && typeof result === "object" && "buffer" in result) {
        pngBuf = result.buffer as Buffer;
      } else if (Buffer.isBuffer(result)) {
        pngBuf = result;
      } else if (result && typeof result === "object" && "path" in result) {
        const p = (result as { path: string }).path;
        if (p && fs.existsSync(p)) {
          pngBuf = fs.readFileSync(p);
        }
      }
      if (!pngBuf || pngBuf.length === 0) {
        throw new Error("pdf2pic returned empty buffer");
      }
      const text = await extractTextFromImagePng(pngBuf, i, pageCount);
      if (text) parts.push(`--- Page ${i} ---\n${text}`);
    }
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    pdf2picOk = true;
  } catch (e) {
    console.warn("pdf2pic pipeline failed, using pdfjs fallback:", e);
    method = "pdfjs";
  }

  if (!pdf2picOk) {
    for (let i = 1; i <= pageCount; i++) {
      onProgress?.({ page: i, total: pageCount });
      const pngBuf = await renderPageWithPdfJs(pdfPath, i);
      if (!pngBuf) continue;
      const text = await extractTextFromImagePng(pngBuf, i, pageCount);
      if (text) parts.push(`--- Page ${i} ---\n${text}`);
    }
  }

  const rawParse = await pdfParse(buffer);
  const selectable = (rawParse.text || "").trim();
  let combined = parts.join("\n\n").trim();
  if (!combined && selectable) {
    combined = selectable;
  }
  return { text: combined, pageCount, method };
}
