import { Prisma } from "@prisma/client";
import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { evaluateBadgesAfterLessonComplete } from "../services/badgeService.js";
import { isHsseqIntroCourse, isLessonQuizCourse } from "../data/courseVisibility.js";
import { effectiveEmployeePdfUrl } from "../lib/publicCoursePdfUrl.js";

const router = Router();
router.use(authMiddleware);

function assertAssessmentPassed(user: {
  assessmentCompleted: boolean;
  assessmentScore: number | null;
}): void {
  if (!user.assessmentCompleted || (user.assessmentScore ?? 0) < 70) {
    throw new AppError(403, "ASSESSMENT_REQUIRED");
  }
}

/** DB migration not applied yet (P2021) — avoid crashing course list/detail */
function isMissingLessonQuizTable(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021";
}

router.get("/", async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "User not found");
    if (!user.categoryId) throw new AppError(400, "User category not set");
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        progress: { where: { userId } },
        quiz: { select: { id: true } },
        categories: true,
      },
    });
    let filtered = courses.filter((c) =>
      c.categories.some((cc) => cc.categoryId === user.categoryId)
    );

    if (!user.assessmentCompleted) {
      filtered = filtered.filter(
        (c) => !isHsseqIntroCourse(c.isHsseqFoundation, c.slug, c.title)
      );
    } else if ((user.assessmentScore ?? 0) >= 70 || !user.hsseqCourseRequired) {
      /* ≥70% or flag cleared → HSSEQ intro must not appear (handles stale/null score) */
      filtered = filtered.filter(
        (c) => !isHsseqIntroCourse(c.isHsseqFoundation, c.slug, c.title)
      );
    }

    const lessonQuizIds = filtered
      .filter((c) => isLessonQuizCourse(c.slug, c.title, c.pdfUrl))
      .map((c) => c.id);
    let lessonLatestByCourse = new Map<
      string,
      { percentage: number; score: number; total: number }
    >();
    if (lessonQuizIds.length > 0) {
      try {
        const attempts = await prisma.lessonQuizAttempt.findMany({
          where: { userId, courseId: { in: lessonQuizIds } },
          orderBy: { takenAt: "desc" },
          select: { courseId: true, percentage: true, score: true, total: true },
        });
        const seen = new Set<string>();
        for (const a of attempts) {
          if (seen.has(a.courseId)) continue;
          seen.add(a.courseId);
          lessonLatestByCourse.set(a.courseId, {
            percentage: a.percentage,
            score: a.score,
            total: a.total,
          });
        }
      } catch (e) {
        if (isMissingLessonQuizTable(e)) {
          console.warn(
            "[courses] LessonQuizAttempt table missing — run: npx prisma migrate deploy"
          );
        } else {
          throw e;
        }
      }
    }

    let sorted = [...filtered];
    if (user.assessmentCompleted && user.hsseqCourseRequired) {
      sorted.sort(
        (a, b) =>
          Number(isHsseqIntroCourse(b.isHsseqFoundation, b.slug, b.title)) -
          Number(isHsseqIntroCourse(a.isHsseqFoundation, a.slug, a.title))
      );
    }

    res.json({
      courses: sorted.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        icon: c.icon,
        coverColor: c.coverColor,
        pdfUrl: effectiveEmployeePdfUrl(c.pdfUrl, c.slug),
        pdfPageCount: c.pdfPageCount,
        order: c.order,
        isHsseqFoundation: c.isHsseqFoundation,
        hasQuiz: !!c.quiz,
        quizId: c.quiz?.id ?? null,
        hasLessonQuiz: isLessonQuizCourse(c.slug, c.title, c.pdfUrl),
        lessonQuizLatest: lessonLatestByCourse.get(c.id) ?? null,
        progress: c.progress[0] ?? null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/:id",
  param("id").notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Invalid id" });
        return;
      }
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(404, "User not found");
      if (!user.categoryId) throw new AppError(400, "User category not set");
      const course = await prisma.course.findUnique({
        where: { id: req.params!.id! },
        include: {
          progress: { where: { userId } },
          quiz: { select: { id: true } },
          categories: true,
        },
      });
      if (!course || !course.isActive) throw new AppError(404, "Course not found");
      if (!course.categories.some((cc) => cc.categoryId === user.categoryId)) {
        throw new AppError(403, "Forbidden");
      }
      assertAssessmentPassed(user);

      let lessonLatest: {
        percentage: number;
        score: number;
        total: number;
        takenAt: Date;
      } | null = null;
      if (isLessonQuizCourse(course.slug, course.title, course.pdfUrl)) {
        try {
          lessonLatest = await prisma.lessonQuizAttempt.findFirst({
            where: { userId, courseId: course.id },
            orderBy: { takenAt: "desc" },
            select: { percentage: true, score: true, total: true, takenAt: true },
          });
        } catch (e) {
          if (isMissingLessonQuizTable(e)) {
            console.warn(
              "[courses] LessonQuizAttempt table missing — run: npx prisma migrate deploy"
            );
            lessonLatest = null;
          } else {
            throw e;
          }
        }
      }

      res.json({
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          description: course.description,
          icon: course.icon,
          coverColor: course.coverColor,
          pdfUrl: effectiveEmployeePdfUrl(course.pdfUrl, course.slug),
          pdfPageCount: course.pdfPageCount,
          hasQuiz: !!course.quiz,
          hasLessonQuiz: isLessonQuizCourse(course.slug, course.title, course.pdfUrl),
          isHsseqFoundation: course.isHsseqFoundation,
          lessonQuizLatest: lessonLatest,
          progress: course.progress[0] ?? null,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/:id/progress",
  param("id").notEmpty(),
  body("pagesRead").isInt({ min: 0 }),
  body("timeSpentSecs").optional().isInt({ min: 0 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(404, "User not found");
      if (!user.categoryId) throw new AppError(400, "User category not set");
      const course = await prisma.course.findUnique({
        where: { id: req.params!.id! },
        include: { categories: true },
      });
      if (!course || !course.isActive) throw new AppError(404, "Course not found");
      if (!course.categories.some((cc) => cc.categoryId === user.categoryId)) {
        throw new AppError(403, "Forbidden");
      }
      assertAssessmentPassed(user);

      const { pagesRead, timeSpentSecs } = req.body as {
        pagesRead: number;
        timeSpentSecs?: number;
      };
      const totalPages = Math.max(1, course.pdfPageCount || 1);
      const pct = Math.min(100, (pagesRead / totalPages) * 100);
      const isCompleted = pct >= 80;

      const existing = await prisma.lessonProgress.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
      });
      const addTime = timeSpentSecs ?? 0;
      const newTime = (existing?.timeSpentSecs ?? 0) + addTime;

      const progress = await prisma.lessonProgress.upsert({
        where: { userId_courseId: { userId, courseId: course.id } },
        create: {
          userId,
          courseId: course.id,
          pagesRead,
          totalPages,
          completionPct: pct,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastAccessedAt: new Date(),
          timeSpentSecs: newTime,
        },
        update: {
          pagesRead: Math.max(existing?.pagesRead ?? 0, pagesRead),
          totalPages,
          completionPct: Math.max(existing?.completionPct ?? 0, pct),
          isCompleted: isCompleted || existing?.isCompleted,
          completedAt:
            isCompleted || existing?.isCompleted
              ? existing?.completedAt ?? new Date()
              : null,
          lastAccessedAt: new Date(),
          timeSpentSecs: newTime,
        },
      });

      let newBadges: string[] = [];
      if (isCompleted && !existing?.isCompleted) {
        newBadges = await evaluateBadgesAfterLessonComplete({
          userId,
          courseId: course.id,
          timeSpentSecs: newTime,
          completionPct: pct,
        });
      }

      res.json({ progress, newBadges });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
