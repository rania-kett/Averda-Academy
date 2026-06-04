import type { LegacyQuizQuestionJson } from "@/types";

export type QuizAttemptDetail = {
  questionId: number;
  emoji?: string | null;
  question: LegacyQuizQuestionJson["question"];
  options: LegacyQuizQuestionJson["options"];
  selected: string;
  correct: string;
  isCorrect: boolean;
  explanation: LegacyQuizQuestionJson["explanation"];
};

export type QuizTracking = {
  scoreHistory: number[];
  retries: number;
  incorrectQuestions: number[];
};

export type OfflineQuizState = {
  version: 1;
  courseId: string;
  updatedAt: number;
  questions: LegacyQuizQuestionJson[];
  step: number;
  answers: Record<string, string>;
  tracking: QuizTracking;
};

function key(courseId: string) {
  return `quizState:v1:${courseId}`;
}

export function loadOfflineQuizState(courseId: string): OfflineQuizState | null {
  try {
    const raw = localStorage.getItem(key(courseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfflineQuizState;
    if (parsed?.version !== 1) return null;
    if (parsed.courseId !== courseId) return null;
    if (!Array.isArray(parsed.questions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveOfflineQuizState(state: OfflineQuizState): void {
  try {
    localStorage.setItem(key(state.courseId), JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

export function clearOfflineQuizState(courseId: string): void {
  try {
    localStorage.removeItem(key(courseId));
  } catch {
    // ignore
  }
}

export function evaluateOfflineAttempt(opts: {
  questions: LegacyQuizQuestionJson[];
  answers: Record<string, string>;
}): { score: number; passed: boolean; details: QuizAttemptDetail[] } {
  const { questions, answers } = opts;
  let correctCount = 0;
  const details: QuizAttemptDetail[] = questions.map((q) => {
    const selected = answers[String(q.id)] ?? "";
    const isCorrect = selected === q.correct;
    if (isCorrect) correctCount++;
    return {
      questionId: q.id,
      emoji: q.emoji ?? null,
      question: q.question,
      options: q.options,
      selected,
      correct: q.correct,
      isCorrect,
      explanation: q.explanation,
    };
  });
  const score = Math.round((correctCount / Math.max(1, questions.length)) * 100);
  return { score, passed: score >= 70, details };
}

