import { courseHasQuizReady } from "@/utils/courseLock";

export type CourseCardStatus = "locked" | "not_started" | "in_progress" | "completed";

export type CourseCardStatusInput = {
  lessonQuizLatest?: { percentage: number } | null;
  progress?: { completionPct: number } | null;
  hasQuiz?: boolean;
  quizId?: string | null;
  hasLessonQuiz?: boolean;
  slug?: string;
  pdfUrl?: string;
};

export function getCourseCardStatus(course: CourseCardStatusInput): CourseCardStatus {
  if (!courseHasQuizReady(course)) return "locked";
  const quizResult = course.lessonQuizLatest?.percentage ?? null;
  if (quizResult == null) {
    const opened = (course.progress?.completionPct ?? 0) > 0;
    return opened ? "in_progress" : "not_started";
  }
  if (quizResult >= 70) return "completed";
  return "in_progress";
}

export function getCourseLockReason(
  course: CourseCardStatusInput,
  opts: { assessmentCompleted: boolean; lang: "ar" | "fr" | "en" }
): string {
  const { assessmentCompleted, lang } = opts;
  if (!assessmentCompleted) {
    return lang === "ar"
      ? "أكمل اختبار التقييم الأولي أولاً"
      : lang === "fr"
        ? "Terminez d'abord l'évaluation initiale"
        : "Complete the initial assessment first";
  }
  if (!courseHasQuizReady(course)) {
    return lang === "ar"
      ? "الاختبار غير جاهز بعد"
      : lang === "fr"
        ? "Le quiz n'est pas encore prêt"
        : "Quiz not ready yet";
  }
  return lang === "ar"
    ? "هذه الدورة مقفلة"
    : lang === "fr"
      ? "Ce cours est verrouillé"
      : "This course is locked";
}
