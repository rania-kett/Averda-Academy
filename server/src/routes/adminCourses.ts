import { Router } from "express";
import fs from "fs";
import path from "path";
import { body, param, validationResult } from "express-validator";
import type { UserGroup } from "@prisma/client";
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

const router = Router();
router.use(authMiddleware);
router.use(adminOnly);

function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

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
      },
    });
    const withStats = await Promise.all(
      courses.map(async (c) => {
        const completed = await prisma.lessonProgress.count({
          where: { courseId: c.id, isCompleted: true },
        });
        const totalUsers = await prisma.user.count({
          where: { role: "EMPLOYEE", isActive: true },
        });
        const rate =
          totalUsers > 0 ? Math.round((completed / totalUsers) * 100) : 0;
        return {
          id: c.id,
          slug: c.slug,
          title: c.title,
          description: c.description,
          icon: c.icon,
          coverColor: c.coverColor,
          pdfUrl: c.pdfUrl,
          pdfPageCount: c.pdfPageCount,
          targetGroup: c.targetGroup,
          isActive: c.isActive,
          order: c.order,
          extractedTextLength: c.extractedText?.length ?? 0,
          quiz: c.quiz
            ? { id: c.quiz.id, questionCount: Array.isArray(c.quiz.questions) ? (c.quiz.questions as unknown[]).length : 0 }
            : null,
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

const upload = () => createCoursePdfUploader(uploadDir());

router.post(
  "/",
  upload().single("pdf"),
  async (req, res, next) => {
    try {
      const b = req.body as Record<string, string>;
      const titleAr = b.titleAr?.trim();
      const titleFr = b.titleFr?.trim() || "";
      const titleEn = b.titleEn?.trim() || "";
      if (!titleAr) {
        throw new AppError(400, "titleAr is required");
      }
      const file = req.file;
      if (!file) throw new AppError(400, "PDF file is required");
      const ud = uploadDir();
      ensureUploadDir(ud);
      const rel = `/uploads/${file.filename}`;
      const abs = path.join(ud, file.filename);
      const buf = fs.readFileSync(abs);
      const pageCount = await getPdfPageCount(buf);
      const tg = (b.targetGroup || "BOTH") as string;
      const targetGroup =
        tg === "DRIVER"
          ? (["DRIVER"] as ("DRIVER" | "WORKER")[])
          : tg === "WORKER"
            ? (["WORKER"] as ("DRIVER" | "WORKER")[])
            : (["DRIVER", "WORKER"] as ("DRIVER" | "WORKER")[]);
      const slug = slugify(titleAr);
      let finalSlug = slug;
      let n = 0;
      while (await prisma.course.findUnique({ where: { slug: finalSlug } })) {
        n++;
        finalSlug = `${slug}-${n}`;
      }
      const maxOrder = await prisma.course.aggregate({ _max: { order: true } });
      const course = await prisma.course.create({
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
          targetGroup,
          order: (maxOrder._max.order ?? 0) + 1,
        },
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
  body("targetGroup").optional(),
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
        targetGroup?: "DRIVER" | "WORKER" | "BOTH";
        icon?: string;
        coverColor?: string;
        isActive?: boolean;
      };
      const targetGroup: UserGroup[] | undefined =
        body.targetGroup === "DRIVER"
          ? ["DRIVER"]
          : body.targetGroup === "WORKER"
            ? ["WORKER"]
            : body.targetGroup === "BOTH"
              ? ["DRIVER", "WORKER"]
              : undefined;
      const course = await prisma.course.update({
        where: { id },
        data: {
          ...(body.title ? { title: body.title } : {}),
          ...(body.description ? { description: body.description } : {}),
          ...(targetGroup ? { targetGroup: targetGroup as UserGroup[] } : {}),
          ...(body.icon !== undefined ? { icon: body.icon } : {}),
          ...(body.coverColor !== undefined ? { coverColor: body.coverColor } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        },
      });
      res.json({ course });
    } catch (e) {
      next(e);
    }
  }
);

router.delete("/:id", param("id").notEmpty(), async (req, res, next) => {
  try {
    await prisma.course.update({
      where: { id: req.params!.id! },
      data: { isActive: false },
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
      const pdfPath = path.join(
        ud,
        course.pdfUrl.replace(/^\/uploads\//, "")
      );
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
