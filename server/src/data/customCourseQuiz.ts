import { Router } from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { evaluateBadgesAfterLessonQuizAttempt } from "../services/badgeService.js";
import { isFootrestReportingCourse, isTrafficLawCourse } from "../data/courseVisibility.js";

type QType = "single" | "multi" | "tf";
type Def = { id: number; type: QType; correct: number[] };

// Keep the canonical answers server-side so badges/challenges can be trusted.
const TRAFFIC_LAW: Def[] = [
  { id: 1, type: "single", correct: [1] },
  { id: 2, type: "single", correct: [2] },
  { id: 3, type: "tf", correct: [1] },
  { id: 4, type: "multi", correct: [0, 2, 3] },
  { id: 5, type: "single", correct: [1] },
  { id: 6, type: "tf", correct: [0] },
  { id: 7, type: "multi", correct: [0, 1, 3, 4] },
  { id: 8, type: "single", correct: [1] },
  { id: 9, type: "multi", correct: [0, 1, 2] },
  { id: 10, type: "tf", correct: [1] },
];

const FOOTREST: Def[] = [
  { id: 1, type: "single", correct: [1] },
  { id: 2, type: "tf", correct: [1] },
  { id: 3, type: "single", correct: [1] },
  { id: 4, type: "tf", correct: [1] },
  { id: 5, type: "single", correct: [1] },
  { id: 6, type: "multi", correct: [0, 1, 3] },
  { id: 7, type: "single", correct: [1] },
  { id: 8, type: "tf", correct: [0] },
  { id: 9, type: "multi", correct: [0, 1, 3] },
  { id: 10, type: "single", correct: [1] },
];

function asSortedUnique(ns: number[]): number[] {
  return Array.from(new Set(ns)).sort((a, b) => a - b);
}

function sameSet(a: number[], b: number[]): boolean {
  const aa = asSortedUnique(a);
  const bb = asSortedUnique(b);
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false;
  return true;
}

function pickDefs(kind: "traffic" | "footrest"): Def[] {
  return kind === "traffic" ? TRAFFIC_LAW : FOOTREST;
}

const router = Router();
router.use(authMiddleware);

router.post(
  "/submit",
  body("courseId").isString().isLength({ min: 1 }),
  body("answers").isObject(),
  async (req, res, next) => {
    try {
      const vr = validationResult(req);
      if (!vr.isEmpty()) throw new AppError(400, "Invalid request");
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");

      const { courseId, answers } = req.body as {
        courseId: string;
        answers: Record<string, number[]>;
      };

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(404, "User not found");
      if (!user.categoryId) throw new AppError(400, "User category not set");

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { categories: true },
      });
      if (!course || !course.isActive) throw new AppError(404, "Course not found");
      if (!course.categories.some((cc) => cc.categoryId === user.categoryId)) throw new AppError(403, "Forbidden");

      const kind = isTrafficLawCourse(course.slug, course.title, course.pdfUrl)
        ? "traffic"
        : isFootrestReportingCourse(course.slug, course.title, course.pdfUrl)
          ? "footrest"
          : null;
      if (!kind) throw new AppError(404, "Quiz not found");

      const defs = pickDefs(kind);
      const total = defs.length;
      let score = 0;
      const details = defs.map((q) => {
        const sel = asSortedUnique(answers[String(q.id)] ?? []);
        const ok = sameSet(sel, q.correct);
        if (ok) score++;
        return { questionId: q.id, selected: sel, correct: q.correct, is_correct: ok };
      });
      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

      const prev = await prisma.lessonQuizAttempt.count({ where: { userId, courseId } });
      const row = await prisma.lessonQuizAttempt.create({
        data: {
          userId,
          courseId,
          score,
          total,
          percentage,
          answers: details as unknown as object,
          attemptNumber: prev + 1,
        },
      });

      const newBadges = await evaluateBadgesAfterLessonQuizAttempt({
        userId,
        courseId,
        percentage,
      });

      res.json({
        attemptId: row.id,
        score,
        total,
        percentage,
        newBadges,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;

