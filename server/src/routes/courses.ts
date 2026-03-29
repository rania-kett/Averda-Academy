import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { evaluateBadgesAfterLessonComplete } from "../services/badgeService.js";

const router = Router();
router.use(authMiddleware);

function courseVisibleForUser(
  targetGroup: ("DRIVER" | "WORKER")[],
  userGroup: "DRIVER" | "WORKER"
): boolean {
  if (targetGroup.length === 2) return true;
  return targetGroup.includes(userGroup);
}

router.get("/", async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "User not found");
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        progress: { where: { userId } },
        quiz: { select: { id: true } },
      },
    });
    const filtered = courses.filter((c) =>
      courseVisibleForUser(c.targetGroup, user.group)
    );
    res.json({
      courses: filtered.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        icon: c.icon,
        coverColor: c.coverColor,
        pdfUrl: c.pdfUrl,
        pdfPageCount: c.pdfPageCount,
        order: c.order,
        hasQuiz: !!c.quiz,
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
      const course = await prisma.course.findUnique({
        where: { id: req.params!.id! },
        include: {
          progress: { where: { userId } },
          quiz: { select: { id: true } },
        },
      });
      if (!course || !course.isActive) throw new AppError(404, "Course not found");
      if (!courseVisibleForUser(course.targetGroup, user.group)) {
        throw new AppError(403, "Forbidden");
      }
      res.json({
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          description: course.description,
          icon: course.icon,
          coverColor: course.coverColor,
          pdfUrl: course.pdfUrl,
          pdfPageCount: course.pdfPageCount,
          hasQuiz: !!course.quiz,
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
      const course = await prisma.course.findUnique({
        where: { id: req.params!.id! },
      });
      if (!course || !course.isActive) throw new AppError(404, "Course not found");
      if (!courseVisibleForUser(course.targetGroup, user.group)) {
        throw new AppError(403, "Forbidden");
      }
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
