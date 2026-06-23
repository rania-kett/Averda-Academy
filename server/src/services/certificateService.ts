/**
 * Averda Academy — Premium Certificate
 * HTML → PDF via Puppeteer
 * Language: AR | FR | EN from employee profile
 */
import fs from "fs";
import path from "path";
import type { Response } from "express";
import { fileURLToPath } from "url";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  computeEmployeeCourseMetrics,
  visibleCoursesForEmployee,
} from "../utils/employeeCourseProgress.js";
import { buildCertificateDocument } from "../utils/certificateTemplate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type Lang = "AR" | "FR" | "EN";

export interface CertificateOptions {
  recipientName: string;
  role: string;
  courseName: string;
  score: number;
  language?: Lang;
  completionDate?: Date;
  outputPath: string;
}

const ROLES: Record<string, Record<Lang, string>> = {
  driver: { AR: "سائق", FR: "Chauffeur", EN: "Driver" },
  sweeper: { AR: "عامل نظافة", FR: "Balayeur", EN: "Sweeper" },
  loader: { AR: "عامل تحميل", FR: "Chargeur", EN: "Loader" },
  teamLeader: { AR: "رئيس فريق", FR: "Chef d'Équipe", EN: "Team Leader" },
  parkAgent: { AR: "عامل حديقة", FR: "Agent de Parc", EN: "Park Agent" },
  maintenance: { AR: "صيانة", FR: "Agent de Maintenance", EN: "Maintenance" },
};

function normalizeLang(raw?: string | null): Lang {
  if (raw === "FR" || raw === "EN") return raw;
  return "AR";
}

function getLogoBase64(): string {
  const candidates = [
    path.join(__dirname, "../../client/public/averda_logo.png"),
    path.join(__dirname, "../assets/averda_logo.png"),
    path.join(process.cwd(), "client/public/averda_logo.png"),
    path.join(process.cwd(), "../client/public/averda_logo.png"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;
    }
  }
  return "";
}

function courseTitleForLang(
  courses: { title: unknown; slug: string }[],
  lang: Lang
): string {
  for (const c of courses) {
    const t = c.title as { ar?: string; fr?: string; en?: string };
    const pick = lang === "AR" ? t.ar : lang === "FR" ? t.fr : t.en;
    if (pick) return pick;
    if (t.ar) return t.ar;
    if (t.fr) return t.fr;
    if (t.en) return t.en;
    if (c.slug) return c.slug;
  }
  return lang === "AR"
    ? "برنامج السلامة والامتثال المهني"
    : lang === "FR"
      ? "Programme de sécurité et conformité professionnelle"
      : "Safety and Professional Compliance Program";
}

function buildHTML(opts: CertificateOptions): string {
  const lang = opts.language ?? "AR";
  const roleKey = opts.role.toLowerCase();
  const roleTranslated = ROLES[opts.role]?.[lang] ?? ROLES[roleKey]?.[lang] ?? opts.role;

  return buildCertificateDocument({
    recipientName: opts.recipientName,
    role: roleTranslated,
    programName: opts.courseName,
    score: opts.score,
    language: lang,
    completionDate: opts.completionDate,
    logoBase64: getLogoBase64(),
  });
}

const CERT_PDF_TIMEOUT_MS = 60_000;
const FONT_READY_MS = 4_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function renderCertificatePdf(html: string): Promise<Buffer> {
  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-web-security",
      "--allow-file-access-from-files",
    ],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(20_000);
    await page.setViewport({ width: 1122, height: 794, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise((resolve) => setTimeout(resolve, FONT_READY_MS)),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const buf = await page.pdf({
      width: "297mm",
      height: "210mm",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(buf);
  } finally {
    await browser.close();
  }
}

export async function generateCertificate(opts: CertificateOptions): Promise<string> {
  const html = buildHTML(opts);

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await withTimeout(
      renderCertificatePdf(html),
      CERT_PDF_TIMEOUT_MS,
      "Certificate PDF generation"
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Certificate PDF generation failed";
    throw new AppError(500, msg);
  }

  fs.mkdirSync(path.dirname(opts.outputPath), { recursive: true });
  fs.writeFileSync(opts.outputPath, pdfBuffer);
  return opts.outputPath;
}

export async function generateTrainingCertificate(params: {
  userId: string;
  employeeName: string;
  courseTitles: string[];
  uploadDir: string;
  role?: string;
  score?: number;
  courseName?: string;
  language?: Lang;
}): Promise<string> {
  const certDir = path.join(params.uploadDir, "certificates");
  const filename = `${params.userId}-cert.pdf`;
  const outPath = path.join(certDir, filename);
  const lang = params.language ?? "AR";

  await generateCertificate({
    recipientName: params.employeeName,
    role: params.role ?? "driver",
    courseName:
      params.courseName ??
      params.courseTitles.find((t) => /[\u0600-\u06FF]/.test(t)) ??
      params.courseTitles[0] ??
      courseTitleForLang([], lang),
    score: params.score ?? 100,
    language: lang,
    outputPath: outPath,
  });

  return `/uploads/certificates/${filename}`;
}

function resolveUploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

export async function issueEmployeeCertificate(uid: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: uid, role: "EMPLOYEE" },
    include: {
      category: true,
      progress: true,
      attempts: { include: { quiz: true } },
      lessonQuizAttempts: true,
    },
  });
  if (!user) throw new AppError(404, "Employee not found");
  if (!user.categoryId) throw new AppError(400, "Employee category not set");

  const assigned = await prisma.course.findMany({
    where: { isActive: true, categories: { some: { categoryId: user.categoryId } } },
    select: {
      id: true,
      slug: true,
      title: true,
      isHsseqFoundation: true,
      pdfUrl: true,
    },
  });

  const visible = visibleCoursesForEmployee(
    assigned,
    user.assessmentCompleted,
    user.assessmentScore,
    user.hsseqCourseRequired
  );

  const metrics = computeEmployeeCourseMetrics(
    visible,
    user.progress,
    user.lessonQuizAttempts ?? [],
    user.attempts ?? [],
    user.assessmentCompleted,
    user.assessmentScore
  );

  if (metrics.coursesTotal === 0 || metrics.coursesDone < metrics.coursesTotal) {
    throw new AppError(400, "Employee has not completed all assigned courses");
  }

  const scores = [
    ...(user.attempts ?? []).map((a) => a.score),
    ...(user.lessonQuizAttempts ?? []).map((a) => a.percentage),
  ];
  const avgScore =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  if (avgScore < 70) {
    throw new AppError(400, "Employee average score below certificate threshold");
  }

  const lang = normalizeLang(user.language);
  const courseName = courseTitleForLang(visible, lang);

  const pdfUrl = await generateTrainingCertificate({
    userId: uid,
    employeeName: user.name,
    courseTitles: visible.map((c) => courseTitleForLang([c], lang)),
    uploadDir: resolveUploadDir(),
    role: user.category?.code ?? "driver",
    score: avgScore,
    courseName,
    language: lang,
  });

  await prisma.certificate.create({ data: { userId: uid, pdfUrl } });
  return pdfUrl;
}

export function certificatePathFromUrl(pdfUrl: string): string {
  const rel = pdfUrl.replace(/^\/uploads\//, "").replace(/\\/g, "/");
  return path.join(resolveUploadDir(), rel);
}

export function buildCertificateDownloadName(employeeName: string): string {
  const cleaned = (employeeName || "employee").replace(/[\\/:*?"<>|]/g, "-").trim();
  return `certificate-${cleaned.slice(0, 60)}-averda.pdf`;
}

function contentDispositionHeader(downloadName: string): string {
  const asciiFallback =
    downloadName.replace(/[^\x20-\x7E]/g, "").replace(/["\\]/g, "").trim() ||
    "certificate-averda.pdf";
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`;
}

export function sendCertificatePdf(res: Response, pdfUrl: string, downloadName: string): void {
  const absPath = certificatePathFromUrl(pdfUrl);
  if (!fs.existsSync(absPath)) {
    throw new AppError(500, "Certificate file missing after generation");
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", contentDispositionHeader(downloadName));
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.sendFile(path.resolve(absPath));
}
