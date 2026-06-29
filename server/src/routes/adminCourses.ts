import { Router } from "express";
import fs from "fs";
import path from "path";
import { body, param, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { AppError } from "../middleware/errorHandler.js";
import { createCoursePdfUploader, ensureUploadDir } from "../middleware/upload.js";
import {
  generateQuizFromArabicText,
  questionsToPrismaJson,
} from "../services/claudeQuiz.js";
import { extractTextFromPdfFile, getPdfPageCount } from "../utils/pdfExtract.js";
import { extractRawTextFromPdfBuffer } from "../utils/pdfRawText.js";
import { isLessonQuizCourse } from "../data/courseVisibility.js";

const router = Router();
router.use(authMiddleware);
router.use(adminOnly);

function uploadDir(): string {
  // PDFs are stored under the client public folder so they are served as static assets.
  // Default: <repo>/client/public/courses
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "client", "public", "courses");
}

function pdfFilenameFromUrl(u: string): string {
  const raw = String(u || "").trim();
  return raw
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/(uploads|courses)\//, "")
    .replace(/^\/+/, "");
}

function guessCoursesFolderByTitle(titleAr: string): string | null {
  const t = String(titleAr || "");
  if (t.includes("السائق")) return "Drivers";
  if (t.includes("الكنس") || t.includes("كناس")) return "Sweepers";
  if (t.includes("الجمع") || t.includes("عمال الجمع")) return "Collect-Crew";
  return null;
}

function ensureCoursesUrlHasFolder(pdfUrl: string, titleAr: string): { pdfUrl: string; folder: string } {
  const u = String(pdfUrl || "").trim();
  const inferred = guessCoursesFolderByTitle(titleAr || "") || "Drivers";
  const m = u.match(/^\/courses\/([^/]+)\/([^/]+\.pdf)$/i);
  if (m) return { pdfUrl: u, folder: m[1]! };
  const m2 = u.match(/^\/courses\/([^/]+\.pdf)$/i);
  if (m2) return { pdfUrl: `/courses/${inferred}/${m2[1]}`, folder: inferred };
  return { pdfUrl: u, folder: inferred };
}

function folderFromCategoryCode(code: string | null | undefined): "Drivers" | "Sweepers" | "Collect-Crew" {
  const c = String(code || "").toLowerCase();
  const folderMap: Record<string, "Drivers" | "Sweepers" | "Collect-Crew"> = {
    driver: "Drivers",
    sweeper: "Sweepers",
    loader: "Collect-Crew",
    teamleader: "Collect-Crew",
    parkagent: "Collect-Crew",
    maintenance: "Collect-Crew",
  };
  return folderMap[c] ?? "Collect-Crew";
}

function safePdfFilename(original: string): string {
  const ext = ".pdf";
  const base = path
    .basename(original || "file.pdf", path.extname(original || "file.pdf"))
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  const name = base || `course-${Date.now()}`;
  return `${name}${ext}`;
}

const upload = () => createCoursePdfUploader(uploadDir());

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `course-${Date.now()}`;
}

router.get("/", async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { order: "asc" },
      include: {
        quiz: true,
        progress: true,
        categories: { include: { category: true } },
      },
    });
    const withStats = await Promise.all(
      courses.map(async (c) => {
        const [lpDone, quizDone, lessonQuizDone] = await Promise.all([
          prisma.lessonProgress.findMany({
            where: { courseId: c.id, isCompleted: true },
            select: { userId: true },
          }),
          prisma.quizAttempt.findMany({
            where: { passed: true, quiz: { courseId: c.id } },
            select: { userId: true },
          }),
          prisma.lessonQuizAttempt.findMany({
            where: { courseId: c.id, percentage: { gte: 70 } },
            select: { userId: true },
          }),
        ]);
        const completedUserIds = new Set<string>([
          ...lpDone.map((r) => r.userId),
          ...quizDone.map((r) => r.userId),
          ...lessonQuizDone.map((r) => r.userId),
        ]);
        const completed = completedUserIds.size;
        const totalUsers = await prisma.user.count({
          where: { role: "EMPLOYEE", isActive: true },
        });
        const rate =
          totalUsers > 0 ? Math.round((completed / totalUsers) * 100) : 0;
        const hasLessonQuiz = isLessonQuizCourse(c.slug, c.title, c.pdfUrl);
        const hasDbQuiz = Boolean(c.quiz);
        return {
          id: c.id,
          slug: c.slug,
          title: c.title,
          description: c.description,
          icon: c.icon,
          coverColor: c.coverColor,
          pdfUrl: c.pdfUrl,
          pdfPageCount: c.pdfPageCount,
          isActive: c.isActive,
          order: c.order,
          categories: (c.categories ?? []).map((cc) => cc.category).filter(Boolean),
          extractedTextLength: c.extractedText?.length ?? 0,
          quiz: c.quiz
            ? { id: c.quiz.id, questionCount: Array.isArray(c.quiz.questions) ? (c.quiz.questions as unknown[]).length : 0 }
            : null,
          hasLessonQuiz,
          hasQuiz: hasDbQuiz || hasLessonQuiz,
          completionRate: rate,
          updatedAt: c.updatedAt,
        };
      })
    );
    res.json({ courses: withStats });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  upload().single("pdf"),
  async (req, res, next) => {
    try {
      const b = req.body as Record<string, string>;
      const titleAr = b.titleAr?.trim();
      const titleFr = b.titleFr?.trim() || "";
      const titleEn = b.titleEn?.trim() || "";
      // We store PDFs under client/public/courses/<inferred-folder>/filename.pdf
      // Folder is inferred from Arabic title to match your existing public structure.
      const categoryIdsRaw = b.categoryIds;
      const categoryIds = (() => {
        if (!categoryIdsRaw) return [] as string[];
        try {
          const parsed = JSON.parse(categoryIdsRaw) as unknown;
          if (Array.isArray(parsed)) return parsed.map((x) => String(x)).filter(Boolean);
        } catch {
          // Allow comma-separated fallbacks: "id1,id2"
          return categoryIdsRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [] as string[];
      })();
      if (!titleAr) {
        throw new AppError(400, "titleAr is required");
      }
      if (!categoryIds.length) {
        throw new AppError(400, "categoryIds is required");
      }
      const file = req.file;
      if (!file) throw new AppError(400, "PDF file is required");

      const ud = uploadDir(); // <repo>/client/public/courses
      ensureUploadDir(ud);

      // Step 4/5 fix: always store `/courses/{Folder}/{filename}.pdf`
      // Folder derived from the first selected category (requested mapping).
      const firstCategoryId = categoryIds[0];
      const firstCategory = await prisma.category.findUnique({
        where: { id: firstCategoryId },
        select: { code: true },
      });
      const folder =
        folderFromCategoryCode(firstCategory?.code) || (guessCoursesFolderByTitle(titleAr || "") || "Drivers");

      const destDir = path.join(ud, folder);
      fs.mkdirSync(destDir, { recursive: true });
      const desiredName = safePdfFilename(file.originalname);
      let finalName = desiredName;
      let finalAbs = path.join(destDir, finalName);
      if (fs.existsSync(finalAbs)) {
        const stamp = Date.now();
        finalName = safePdfFilename(`${path.basename(desiredName, ".pdf")}-${stamp}.pdf`);
        finalAbs = path.join(destDir, finalName);
      }

      // Multer writes into `ud` root; move + rename.
      const srcAbs = path.join(ud, file.filename);
      fs.renameSync(srcAbs, finalAbs);

      const rel = `/courses/${folder}/${finalName}`;
      const buf = fs.readFileSync(finalAbs);
      const pageCount = await getPdfPageCount(buf);
      const rawText = await extractRawTextFromPdfBuffer(buf).catch(() => ({ text: "", pageCount }));
      const slug = slugify(titleAr);
      let finalSlug = slug;
      let n = 0;
      while (await prisma.course.findUnique({ where: { slug: finalSlug } })) {
        n++;
        finalSlug = `${slug}-${n}`;
      }
      const maxOrder = await prisma.course.aggregate({ _max: { order: true } });

      const course = await prisma.$transaction(async (tx) => {
        const cats = await tx.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } });
        if (cats.length !== categoryIds.length) throw new AppError(400, "Unknown categoryId");
        const created = await tx.course.create({
          data: {
            slug: finalSlug,
            title: { ar: titleAr, fr: titleFr, en: titleEn },
            description: {
              ar: b.descAr || "",
              fr: b.descFr || "",
              en: b.descEn || "",
            },
            icon: b.icon || "📘",
            coverColor: b.coverColor || "from-amber-500 to-orange-600",
            pdfUrl: rel,
            pdfPageCount: pageCount,
            extractedText: (rawText.text || "").slice(0, 50000),
            order: (maxOrder._max.order ?? 0) + 1,
            categories: {
              createMany: {
                data: categoryIds.map((categoryId) => ({ categoryId })),
              },
            },
          },
        });
        return created;
      });
      res.status(201).json({ course });
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  "/:id",
  param("id").notEmpty(),
  body("title").optional(),
  body("description").optional(),
  body("categoryIds").optional(),
  body("icon").optional(),
  body("coverColor").optional(),
  body("isActive").optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed" });
        return;
      }
      const id = req.params!.id!;
      const existing = await prisma.course.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "Course not found");
      const body = req.body as {
        title?: { ar: string; fr: string; en: string };
        description?: { ar: string; fr: string; en: string };
        categoryIds?: string[];
        icon?: string;
        coverColor?: string;
        isActive?: boolean;
      };
      const course = await prisma.$transaction(async (tx) => {
        if (Array.isArray(body.categoryIds)) {
          const ids = body.categoryIds.map((x) => String(x)).filter(Boolean);
          if (!ids.length) throw new AppError(400, "categoryIds must not be empty");
          const cats = await tx.category.findMany({ where: { id: { in: ids } }, select: { id: true } });
          if (cats.length !== ids.length) throw new AppError(400, "Unknown categoryId");
          await tx.courseCategory.deleteMany({ where: { courseId: id } });
          await tx.courseCategory.createMany({
            data: ids.map((categoryId) => ({ courseId: id, categoryId })),
          });
        }
        return tx.course.update({
          where: { id },
          data: {
            ...(body.title ? { title: body.title } : {}),
            ...(body.description ? { description: body.description } : {}),
            ...(body.icon !== undefined ? { icon: body.icon } : {}),
            ...(body.coverColor !== undefined ? { coverColor: body.coverColor } : {}),
            ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          },
        });
      });
      res.json({ course });
    } catch (e) {
      next(e);
    }
  }
);

router.delete("/:id", param("id").notEmpty(), async (req, res, next) => {
  try {
    const id = req.params!.id!;
    const existing = await prisma.course.findUnique({ where: { id }, select: { id: true, pdfUrl: true } });
    if (!existing) throw new AppError(404, "Course not found");

    // Best-effort remove uploaded PDF from disk (do this before DB delete so we still have pdfUrl).
    try {
      const ud = uploadDir();
      const pdfPath = path.join(ud, pdfFilenameFromUrl(existing.pdfUrl));
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    } catch {
      // Non-fatal: DB deletion should still succeed.
    }

    // Hard delete the course and its relations.
    // Relations with onDelete: Cascade will follow; others are explicitly removed.
    await prisma.$transaction(async (tx) => {
      await tx.courseCategory.deleteMany({ where: { courseId: id } });
      await tx.lessonProgress.deleteMany({ where: { courseId: id } });
      await tx.lessonQuizAttempt.deleteMany({ where: { courseId: id } });
      await tx.quizAttempt.deleteMany({ where: { quiz: { courseId: id } } });
      await tx.quiz.deleteMany({ where: { courseId: id } });
      await tx.course.delete({ where: { id } });
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/:id/generate-quiz",
  param("id").notEmpty(),
  body("regenerate").optional().isBoolean(),
  async (req, res, next) => {
    try {
      const id = req.params!.id!;
      const { regenerate } = (req.body || {}) as { regenerate?: boolean };
      const course = await prisma.course.findUnique({
        where: { id },
        include: { quiz: true },
      });
      if (!course) throw new AppError(404, "Course not found");
      if (course.quiz && !regenerate) {
        throw new AppError(409, "Quiz already exists — pass regenerate: true to replace");
      }
      const ud = uploadDir();
      const pdfPath = path.join(ud, pdfFilenameFromUrl(course.pdfUrl));
      if (!fs.existsSync(pdfPath)) {
        throw new AppError(400, "PDF file missing on server");
      }
      let extracted = course.extractedText ?? "";
      if (!extracted?.trim()) {
        const { text, pageCount, method } = await extractTextFromPdfFile(pdfPath);
        extracted = text;
        await prisma.course.update({
          where: { id },
          data: {
            extractedText: extracted,
            pdfPageCount: pageCount || course.pdfPageCount,
          },
        });
        if (!extracted?.trim()) {
          throw new AppError(
            400,
            "PDF text extraction failed — ensure the PDF is not a scanned image. Use OCR first."
          );
        }
        console.info(`Extraction used method: ${method}`);
      }
      const questions = await generateQuizFromArabicText(extracted);
      const json = questionsToPrismaJson(questions);
      if (course.quiz) {
        await prisma.quiz.update({
          where: { id: course.quiz.id },
          data: { questions: json, generatedAt: new Date() },
        });
      } else {
        await prisma.quiz.create({
          data: { courseId: id, questions: json },
        });
      }
      res.json({ success: true, questionCount: 10 });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
