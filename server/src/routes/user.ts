import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  scoreAssessment,
  validateAssessmentAnswers,
} from "../data/assessmentQuestions.js";
import {
  computeEmployeeCourseMetrics,
  visibleCoursesForEmployee,
} from "../utils/employeeCourseProgress.js";
import { NEW_BADGES, NEW_BADGE_KEYS } from "../services/badgeCatalog.js";
import { evaluateBadgesAfterLessonComplete } from "../services/badgeService.js";

const router = Router();
router.use(authMiddleware);

router.get("/me", async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: { include: { badge: true } },
        progress: { include: { course: true } },
        attempts: true,
        lessonQuizAttempts: true,
        certificates: true,
        category: true,
      },
    });
    if (!user) throw new AppError(404, "Not found");
    if (role === "ADMIN") {
      res.json({
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
        progress: null,
      });
      return;
    }

    // Ensure canonical badge catalog exists and compute any missing automatic badges (idempotent).
    try {
      await evaluateBadgesAfterLessonComplete({
        userId,
        courseId: "",
        timeSpentSecs: 0,
        completionPct: 0,
      });
    } catch {
      /* ignore badge eval errors */
    }
    const assigned = await prisma.course.findMany({
      where: { isActive: true },
      include: { categories: true },
    });
    const visible =
      user.categoryId == null
        ? []
        : assigned.filter((c) =>
            c.categories.some((cc) => cc.categoryId === user.categoryId)
          );
    const visibleForProgress = visibleCoursesForEmployee(
      visible.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        pdfUrl: c.pdfUrl,
        isHsseqFoundation: c.isHsseqFoundation,
      })),
      user.assessmentCompleted,
      user.assessmentScore,
      user.hsseqCourseRequired
    );
    const metrics = computeEmployeeCourseMetrics(
      visibleForProgress,
      user.progress,
      user.lessonQuizAttempts ?? [],
      user.attempts ?? [],
      user.assessmentCompleted,
      user.assessmentScore
    );
    const completed = metrics.coursesDone;
    const overallPct =
      metrics.coursesTotal > 0
        ? Math.round((completed / metrics.coursesTotal) * 100)
        : 0;
    const totalTimeSpentSecs = user.progress.reduce(
      (sum, p) => sum + (p.timeSpentSecs ?? 0),
      0
    );
    const courseAttemptScores = (user.attempts ?? [])
      .map((a) => Number(a.score))
      .filter((n) => Number.isFinite(n));
    const lessonAttemptScores = (user.lessonQuizAttempts ?? [])
      .map((a) => Number(a.percentage))
      .filter((n) => Number.isFinite(n));
    const allScores = [...courseAttemptScores, ...lessonAttemptScores];
    const avgScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;
    res.json({
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        category: user.category,
        language: user.language,
        avatarColor: user.avatarColor,
        badges: (user.badges ?? []).filter((ub) =>
          Object.values(NEW_BADGE_KEYS).includes(ub.badge.key as any)
        ),
        certificates: user.certificates,
        assessmentCompleted: user.assessmentCompleted,
        assessmentScore: user.assessmentScore,
        assessmentTakenAt: user.assessmentTakenAt,
        hsseqCourseRequired: user.hsseqCourseRequired,
      },
      progress: {
        overallCompletionPct: overallPct,
        coursesCompleted: completed,
        coursesTotal: metrics.coursesTotal,
        avgQuizScore: avgScore,
        totalTimeSpentSecs,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/assessment",
  body("answers")
    .isArray({ min: 10, max: 10 })
    .custom((arr) => Array.isArray(arr) && arr.every((x) => typeof x === "number")),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const { answers } = req.body as { answers: unknown };
      if (!validateAssessmentAnswers(answers)) {
        throw new AppError(400, "Invalid answers");
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(404, "User not found");
      const prevScore = user.assessmentScore ?? 0;
      if (user.assessmentCompleted && prevScore >= 70) {
        throw new AppError(400, "Assessment already passed");
      }
      const { correct, scorePercent } = scoreAssessment(answers);
      const hsseqCourseRequired = false;
      await prisma.user.update({
        where: { id: userId },
        data: {
          assessmentCompleted: true,
          assessmentScore: scorePercent,
          assessmentTakenAt: new Date(),
          hsseqCourseRequired,
        },
      });
      res.json({
        ok: true,
        correct,
        total: 10,
        scorePercent,
        hsseqCourseRequired,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/me",
  body("language").optional().isIn(["AR", "FR", "EN"]),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const { language } = req.body as { language?: "AR" | "FR" | "EN" };
      if (!language) {
        res.json({ ok: true });
        return;
      }
      await prisma.user.update({
        where: { id: userId },
        data: { language },
      });
      res.json({ ok: true, language });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/notifications", async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: 50,
    });
    res.json({ notifications: rows });
  } catch (e) {
    next(e);
  }
});

router.put(
  "/notifications/:id/read",
  param("id").notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const id = req.params!.id!;
      const row = await prisma.notification.findUnique({ where: { id } });
      if (!row || row.userId !== userId) throw new AppError(404, "Not found");
      await prisma.notification.update({ where: { id }, data: { isRead: true } });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

router.put("/notifications/read-all", async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/badges", async (req, res, next) => {
  try {
    const { userId } = (req as AuthedRequest).user;
    // Ensure automatic badges are up-to-date before returning the list.
    try {
      await evaluateBadgesAfterLessonComplete({
        userId,
        courseId: "",
        timeSpentSecs: 0,
        completionPct: 0,
      });
    } catch {
      /* ignore */
    }
    // Return ONLY the new badge system (and ensure these rows exist).
    const keys = NEW_BADGES.map((b) => b.key);
    const all = await prisma.badge.findMany({ where: { key: { in: keys } }, orderBy: { key: "asc" } });
    const earned = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const earnedSet = new Set(earned.map((e) => e.badgeId));
    res.json({
      badges: all.map((b) => ({
        ...b,
        earned: earnedSet.has(b.id),
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
