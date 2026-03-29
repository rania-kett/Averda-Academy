import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  evaluateBadgesAfterQuizAttempt,
  parseQuizQuestions,
} from "../services/badgeService.js";
import type { QuizQuestionJson } from "../services/claudeQuiz.js";

const router = Router();
router.use(authMiddleware);

function courseVisibleForUser(
  targetGroup: ("DRIVER" | "WORKER")[],
  userGroup: "DRIVER" | "WORKER"
): boolean {
  if (targetGroup.length === 2) return true;
  return targetGroup.includes(userGroup);
}

function shuffleQuestions(qs: QuizQuestionJson[]): QuizQuestionJson[] {
  const order = [...qs].sort(() => Math.random() - 0.5);
  return order.map((q) => {
    const keys = ["A", "B", "C", "D"] as const;
    const opts = keys.map((k) => ({ k, v: q.options[k] }));
    const shuffled = [...opts].sort(() => Math.random() - 0.5);
    const newOptions = {
      A: shuffled[0]!.v,
      B: shuffled[1]!.v,
      C: shuffled[2]!.v,
      D: shuffled[3]!.v,
    };
    const correctOriginal = q.correct;
    const idx = shuffled.findIndex((o) => o.k === correctOriginal);
    const newCorrect = (["A", "B", "C", "D"] as const)[idx]!;
    return {
      ...q,
      options: newOptions,
      correct: newCorrect,
    };
  });
}

router.get("/:courseId", param("courseId").notEmpty(), async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "User not found");
    const course = await prisma.course.findUnique({
      where: { id: req.params!.courseId! },
      include: { quiz: true },
    });
    if (!course || !course.isActive) throw new AppError(404, "Course not found");
    if (!courseVisibleForUser(course.targetGroup, user.group)) {
      throw new AppError(403, "Forbidden");
    }
    if (!course.quiz) {
      res.json({ quiz: null, message: "Quiz not available" });
      return;
    }
    const raw = course.quiz.questions;
    const questions = parseQuizQuestions(raw);
    const prepared = shuffleQuestions(questions);
    res.json({
      quizId: course.quiz.id,
      courseId: course.id,
      questions: prepared.map((q) => ({
        id: q.id,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/:courseId/attempt",
  param("courseId").notEmpty(),
  body("answers").isObject(),
  body("timeSpent").isInt({ min: 0 }),
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
        where: { id: req.params!.courseId! },
        include: { quiz: true },
      });
      if (!course?.quiz) throw new AppError(404, "Quiz not found");
      if (!courseVisibleForUser(course.targetGroup, user.group)) {
        throw new AppError(403, "Forbidden");
      }
      const { answers, timeSpent } = req.body as {
        answers: Record<string, string>;
        timeSpent: number;
      };
      const questions = parseQuizQuestions(course.quiz.questions);
      let correct = 0;
      const details: {
        questionId: number;
        selected: string;
        correct: string;
        isCorrect: boolean;
        explanation: QuizQuestionJson["explanation"];
      }[] = [];
      for (const q of questions) {
        const sel = answers[String(q.id)] ?? answers[q.id as unknown as string];
        const isCorrect = sel === q.correct;
        if (isCorrect) correct++;
        details.push({
          questionId: q.id,
          selected: sel ?? "",
          correct: q.correct,
          isCorrect,
          explanation: q.explanation,
        });
      }
      const score = Math.round((correct / 10) * 100);
      const passed = score >= 70;
      const attempt = await prisma.quizAttempt.create({
        data: {
          userId,
          quizId: course.quiz.id,
          score,
          answers: answers as object,
          passed,
          timeSpent,
        },
      });
      const newBadges = await evaluateBadgesAfterQuizAttempt({
        userId,
        quizId: course.quiz.id,
        courseId: course.id,
        score,
        passed,
      });
      res.json({
        attemptId: attempt.id,
        score,
        passed,
        details,
        newBadges,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
