import fs from "fs";
import path from "path";

export type CoursePdfEntry = { folder: string; filename: string; rel: string };

export function normCourseText(input: string): string {
  return (input ?? "")
    .normalize("NFC")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\.pdf$/i, "")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+\d+$/g, "")
    .trim();
}

export function listCoursePdfs(root: string): CoursePdfEntry[] {
  const out: CoursePdfEntry[] = [];
  if (!fs.existsSync(root)) return out;

  for (const entry of fs.readdirSync(root)) {
    const abs = path.join(root, entry);
    const stat = fs.statSync(abs);
    if (stat.isFile() && entry.toLowerCase().endsWith(".pdf")) {
      out.push({ folder: "", filename: entry, rel: `/courses/${entry}` });
      continue;
    }
    if (!stat.isDirectory()) continue;
    for (const file of fs.readdirSync(abs)) {
      if (!file.toLowerCase().endsWith(".pdf")) continue;
      out.push({ folder: entry, filename: file, rel: `/courses/${entry}/${file}` });
    }
  }
  return out;
}

export function findPdfForArabicTitle(titleAr: string, pdfs: CoursePdfEntry[]): string | null {
  const hay = normCourseText(titleAr);
  if (!hay) return null;

  let best: { rel: string; score: number } | null = null;
  for (const pdf of pdfs) {
    const name = normCourseText(pdf.filename);
    let score = 0;
    if (name === hay) score = 100;
    else if (name.includes(hay) || hay.includes(name)) score = 80;
    else {
      const hayWords = hay.split(" ").filter((w) => w.length > 2);
      const matched = hayWords.filter((w) => name.includes(w)).length;
      if (matched >= Math.max(2, Math.ceil(hayWords.length * 0.6))) score = 50 + matched;
    }
    if (!best || score > best.score) best = { rel: pdf.rel, score };
  }
  return best && best.score >= 50 ? best.rel : null;
}

export function coursesPublicDir(): string {
  const fromServer = path.join(process.cwd(), "client", "public", "courses");
  if (fs.existsSync(fromServer)) return fromServer;
  return path.join(process.cwd(), "..", "client", "public", "courses");
}
