import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  evaluateBadgesAfterQuizAttempt,
  evaluateBadgesAfterLessonQuizAttempt,
  parseQuizQuestions,
} from "../services/badgeService.js";
import type { QuizQuestionJson } from "../services/claudeQuiz.js";
import { isBasicsGuidanceCourse, isRoadTrafficSafetyCourse, isSweepingSafetyCourse } from "../data/courseVisibility.js";
import { ROAD_SAFETY_LESSON_QUESTIONS, scoreRoadSafetyAnswers } from "../data/roadSafetyLessonQuiz.js";
import { SWEEPING_LESSON_QUESTIONS, scoreSweepingAnswers } from "../data/sweepingLessonQuiz.js";
import { ASSESSMENT_QUESTIONS, scoreAssessment } from "../data/assessmentQuestions.js";

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

function asI18nText(s: string): { ar: string; fr: string; en: string } {
  return { ar: s, fr: s, en: s };
}

function lessonQuizToQuestions(defs: { id: number; type: string; emoji: string; text: string; options: string[]; correct: number[]; explanation: string }[]): QuizQuestionJson[] {
  return defs.map((q) => {
    const opts = q.options.slice(0, 4);
    while (opts.length < 4) {
      // Duplicate last option to satisfy QuizQuestionJson shape.
      opts.push(opts[opts.length - 1] ?? "—");
    }
    const letters = ["A", "B", "C", "D"] as const;
    const correctIdx = q.correct?.[0] ?? 0;
    const correct = letters[Math.max(0, Math.min(3, correctIdx))]!;
    return {
      id: q.id,
      emoji: q.emoji,
      difficulty: "easy",
      question: asI18nText(q.text),
      options: {
        A: asI18nText(opts[0]!),
        B: asI18nText(opts[1]!),
        C: asI18nText(opts[2]!),
        D: asI18nText(opts[3]!),
      },
      correct,
      explanation: asI18nText(q.explanation),
    };
  });
}

router.get("/:courseId", param("courseId").notEmpty(), async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "User not found");
    if (!user.categoryId) throw new AppError(400, "User category not set");
    assertAssessmentPassed(user);
    const course = await prisma.course.findUnique({
      where: { id: req.params!.courseId! },
      include: { quiz: true, categories: true },
    });
    if (!course || !course.isActive) throw new AppError(404, "Course not found");
    if (!course.categories.some((cc) => cc.categoryId === user.categoryId)) {
      throw new AppError(403, "Forbidden");
    }
    if (!course.quiz) {
      // Fallback: built-in onboarding quizzes (road safety / sweeping) should behave like a normal course quiz.
      const isRoad = isRoadTrafficSafetyCourse(course.slug, course.title, course.pdfUrl);
      const isSweep = isSweepingSafetyCourse(course.slug, course.title, course.pdfUrl);
      if (!isRoad && !isSweep) {
        res.json({ quiz: null, message: "Quiz not available" });
        return;
      }
      const defs = isRoad ? ROAD_SAFETY_LESSON_QUESTIONS : SWEEPING_LESSON_QUESTIONS;
      res.json({
        quizId: null,
        courseId: course.id,
        questions: lessonQuizToQuestions(defs).map((q) => ({
          id: q.id,
          emoji: q.emoji ?? null,
          difficulty: q.difficulty,
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
        })),
      });
      return;
    }
    const raw = course.quiz.questions;
    const questions = parseQuizQuestions(raw) as any[];
    const hasV2Types = questions.some((q) => typeof (q as any)?.type === "string");
    if (hasV2Types) {
      res.json({
        quizId: course.quiz.id,
        courseId: course.id,
        questions,
      });
      return;
    }
    const prepared = shuffleQuestions(questions as any);
    res.json({
      quizId: course.quiz.id,
      courseId: course.id,
      questions: prepared.map((q: any) => ({
        id: q.id,
        emoji: q.emoji ?? null,
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
      if (!user.categoryId) throw new AppError(400, "User category not set");
      assertAssessmentPassed(user);
      const course = await prisma.course.findUnique({
        where: { id: req.params!.courseId! },
        include: { quiz: true, categories: true },
      });
      if (!course) throw new AppError(404, "Course not found");
      if (!course.categories.some((cc) => cc.categoryId === user.categoryId)) {
        throw new AppError(403, "Forbidden");
      }
      const { answers, timeSpent } = req.body as {
        answers: Record<string, string>;
        timeSpent: number;
      };

      // Normal case: generated quiz exists.
      if (course.quiz) {
        const questions = parseQuizQuestions(course.quiz.questions) as any[];
        let correctCount = 0;
        const wrongIds: number[] = [];
        const answeredIds: number[] = [];
        const details: {
          questionId: number;
          selected: unknown;
          correct: unknown;
          isCorrect: boolean;
          explanation: QuizQuestionJson["explanation"];
        }[] = [];
        const coerceId = (x: any) => (typeof x === "number" ? x : Number(x));
        const normalizeBool = (v: any) => (typeof v === "boolean" ? v : String(v).toLowerCase() === "true");

        for (const q of questions) {
          const qid = coerceId((q as any)?.id);
          const key = String(qid);
          const sel = (answers as any)[key];
          if (sel === undefined) continue;
          answeredIds.push(qid);

          const type = String((q as any)?.type || "mcq");
          let isCorrect = false;
          let correctVal: unknown = (q as any)?.correct ?? (q as any)?.correct_index ?? (q as any)?.correct_indexes ?? (q as any)?.correct_order;

          if (type === "true_false") {
            const got = normalizeBool(sel);
            const want = Boolean((q as any)?.correct);
            isCorrect = got === want;
            correctVal = want;
          } else if (type === "multi_select") {
            const got = Array.isArray(sel) ? sel.map((x) => Number(x)).sort((a, b) => a - b) : [];
            const want = Array.isArray((q as any)?.correct_indexes)
              ? ((q as any).correct_indexes as unknown[]).map((x) => Number(x)).sort((a, b) => a - b)
              : [];
            isCorrect = got.length === want.length && got.every((v, i) => v === want[i]);
            correctVal = want;
          } else if (type === "order") {
            const got = Array.isArray(sel) ? sel.map((x) => Number(x)) : [];
            const want = Array.isArray((q as any)?.correct_order) ? (q as any).correct_order.map((x: any) => Number(x)) : [];
            isCorrect = got.length === want.length && got.every((v, i) => v === want[i]);
            correctVal = want;
          } else {
            // MCQ legacy: client sends letter; AI v2 may send correct_index and client answers index.
            const wantLetter = (q as any)?.correct;
            const wantIndex = (q as any)?.correct_index;
            if (typeof wantLetter === "string") {
              isCorrect = String(sel) === wantLetter;
              correctVal = wantLetter;
            } else if (typeof wantIndex === "number") {
              isCorrect = Number(sel) === wantIndex;
              correctVal = wantIndex;
            } else {
              isCorrect = String(sel) === String((q as any)?.correct ?? "");
              correctVal = (q as any)?.correct ?? null;
            }
          }

          if (isCorrect) correctCount++;
          else wrongIds.push(qid);
          details.push({
            questionId: qid,
            selected: sel ?? null,
            correct: correctVal,
            isCorrect,
            explanation: q.explanation,
          });
        }
        const totalAnswered = Math.max(1, answeredIds.length);
        const score = Math.round((correctCount / totalAnswered) * 100);
        const passed = score >= 70;
        const attemptNumber = (await prisma.quizAttempt.count({ where: { userId, quizId: course.quiz.id } })) + 1;
        const attempt = await prisma.quizAttempt.create({
          data: {
            userId,
            quizId: course.quiz.id,
            score,
            answers: answers as object,
            attemptNumber,
            wrongQuestionIds: wrongIds as unknown as object,
            questionIds: answeredIds as unknown as object,
            passed,
            timeSpent,
          } as any,
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
        return;
      }

      // Fallback: onboarding built-in quizzes for courses without a generated quiz.
      const isRoad = isRoadTrafficSafetyCourse(course.slug, course.title, course.pdfUrl);
      const isSweep = isSweepingSafetyCourse(course.slug, course.title, course.pdfUrl);
      const isBasics = isBasicsGuidanceCourse(course.slug, course.title, course.pdfUrl);
      if (isBasics) throw new AppError(404, "Quiz not found");
      if (!isRoad && !isSweep) throw new AppError(404, "Quiz not found");

      const letters = ["A", "B", "C", "D"] as const;
      const toIndex = (L: string | undefined): number => {
        const i = letters.indexOf((L as any) ?? "A");
        return i >= 0 ? i : 0;
      };
      const defs = isRoad ? ROAD_SAFETY_LESSON_QUESTIONS : SWEEPING_LESSON_QUESTIONS;
      const normalized = defs
        .filter((q) => answers[String(q.id)] !== undefined && answers[String(q.id)] !== null)
        .map((q) => ({
          questionId: q.id,
          selectedIndices: [toIndex(answers[String(q.id)])],
        }));
      if (normalized.length === 0) {
        res.status(400).json({ error: "No answers submitted" });
        return;
      }
      const scored = isRoad ? scoreRoadSafetyAnswers(normalized) : scoreSweepingAnswers(normalized);
      const prev = await prisma.lessonQuizAttempt.count({ where: { userId, courseId: course.id } });
      const attemptNumber = prev + 1;
      const row = await prisma.lessonQuizAttempt.create({
        data: {
          userId,
          courseId: course.id,
          score: scored.score,
          total: scored.total,
          percentage: scored.percentage,
          answers: scored.details as unknown as object,
          attemptNumber,
        },
      });

      const newBadges = await evaluateBadgesAfterLessonQuizAttempt({
        userId,
        courseId: course.id,
        percentage: scored.percentage,
      });

      res.json({
        attemptId: row.id,
        score: scored.percentage,
        passed: scored.percentage >= 70,
        details: scored.details.map((d) => ({
          questionId: d.questionId,
          selected: letters[Math.max(0, Math.min(3, d.selected?.[0] ?? 0))] ?? "A",
          correct: letters[Math.max(0, Math.min(3, d.correct?.[0] ?? 0))] ?? "A",
          isCorrect: d.is_correct,
          explanation: asI18nText(defs.find((q) => q.id === d.questionId)?.explanation ?? ""),
        })),
        newBadges,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
