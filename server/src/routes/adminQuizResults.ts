import { Router } from "express";
import { query, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";

const router = Router();
router.use(authMiddleware);
router.use(adminOnly);

const PAGE_SIZE = 20;

function parsePage(query: Record<string, unknown> | undefined): number {
  const p = Number(query?.page);
  if (!Number.isFinite(p) || p < 1) return 1;
  return Math.floor(p);
}

router.get(
  "/assessment",
  query("page").optional().isInt({ min: 1 }),
  query("status").optional().isIn(["all", "pass", "fail"]),
  query("categoryId").optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const q = req.query ?? {};
      const page = parsePage(q);
      const status = (q.status as string) || "all";
      const categoryId = q.categoryId as string | undefined;

      const where = {
        role: "EMPLOYEE" as const,
        assessmentCompleted: true,
        ...(categoryId ? { categoryId } : {}),
        ...(status === "pass"
          ? { assessmentScore: { gte: 70 } }
          : status === "fail"
            ? { assessmentScore: { lt: 70 } }
            : {}),
      };

      const [total, rows] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          include: { category: true },
          orderBy: { assessmentTakenAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
      ]);

      res.json({
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE) || 1,
        results: rows.map((u) => {
          const pct = u.assessmentScore ?? 0;
          const pass = pct >= 70;
          return {
            id: u.id,
            employeeId: u.employeeId,
            name: u.name,
            category: u.category
              ? { id: u.category.id, code: u.category.code, name: u.category.name }
              : null,
            score: pct,
            total: 10,
            percentage: pct,
            status: pass ? "pass" : "fail",
            takenAt: u.assessmentTakenAt?.toISOString() ?? null,
          };
        }),
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/lessons",
  query("page").optional().isInt({ min: 1 }),
  query("courseSlug").optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const q = req.query ?? {};
      const page = parsePage(q);
      const courseSlug = q.courseSlug as string | undefined;

      const where = {
        ...(courseSlug ? { course: { slug: courseSlug } } : {}),
      };

      const [total, attempts, bestRows] = await Promise.all([
        prisma.lessonQuizAttempt.count({ where }),
        prisma.lessonQuizAttempt.findMany({
          where,
          include: {
            user: { select: { id: true, employeeId: true, name: true } },
            course: { select: { id: true, slug: true, title: true } },
          },
          orderBy: { takenAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.lessonQuizAttempt.groupBy({
          by: ["userId", "courseId"],
          _max: { percentage: true },
        }),
      ]);

      const bestMap = new Map(
        bestRows.map((b) => [`${b.userId}:${b.courseId}`, b._max.percentage ?? 0])
      );

      res.json({
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE) || 1,
        attempts: attempts.map((a) => ({
          id: a.id,
          employeeId: a.user.employeeId,
          employeeName: a.user.name,
          courseId: a.courseId,
          courseSlug: a.course.slug,
          courseTitle: a.course.title,
          attemptNumber: a.attemptNumber,
          score: a.score,
          total: a.total,
          percentage: a.percentage,
          bestPercentage: bestMap.get(`${a.userId}:${a.courseId}`) ?? a.percentage,
          takenAt: a.takenAt.toISOString(),
        })),
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/summary", async (_req, res, next) => {
  try {
    const completed = await prisma.user.findMany({
      where: { role: "EMPLOYEE", assessmentCompleted: true },
      select: { assessmentScore: true },
    });
    const assessmentScores = completed
      .map((u) => u.assessmentScore)
      .filter((s): s is number => s != null);
    const avgAssessment =
      assessmentScores.length > 0
        ? Math.round(
            assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length
          )
        : 0;
    const passCount = assessmentScores.filter((s) => s >= 70).length;
    const assessmentPassRate =
      assessmentScores.length > 0
        ? Math.round((passCount / assessmentScores.length) * 100)
        : 0;

    const lessonAttemptsForAvg = await prisma.lessonQuizAttempt.findMany({
      select: { percentage: true },
    });
    const avgLessonQuiz =
      lessonAttemptsForAvg.length > 0
        ? Math.round(
            lessonAttemptsForAvg.reduce((a, b) => a + b.percentage, 0) /
              lessonAttemptsForAvg.length
          )
        : 0;

    const totalLessonAttempts = await prisma.lessonQuizAttempt.count();

    res.json({
      avgAssessmentPercent: avgAssessment,
      assessmentPassRatePercent: assessmentPassRate,
      avgRoadSafetyLessonPercent: avgLessonQuiz,
      totalLessonQuizAttempts: totalLessonAttempts,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
