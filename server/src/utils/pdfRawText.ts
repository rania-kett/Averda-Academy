import pdfParse from "pdf-parse";

export async function extractRawTextFromPdfBuffer(buf: Buffer): Promise<{ text: string; pageCount: number }> {
  const parsed = await pdfParse(buf);
  const text = String(parsed.text || "").trim();
  const pageCount = Number(parsed.numpages || 1) || 1;
  return { text, pageCount };
}

