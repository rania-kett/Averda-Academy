import { isLessonQuizFromCourse } from "@/utils/courseVisibility";

/** Course has an admin-prepared quiz (standard, lesson, or linked quiz id). */
export function courseHasQuizReady(course: {
  hasQuiz?: boolean;
  quizId?: string | null;
  hasLessonQuiz?: boolean;
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  return (
    Boolean(course.hasQuiz) ||
    Boolean(course.quizId) ||
    Boolean(course.hasLessonQuiz) ||
    isLessonQuizFromCourse(course)
  );
}

/**
 * Courses are locked only when:
 * 1) onboarding assessment not completed, or
 * 2) no quiz is prepared for the course.
 */
export function isCourseLocked(
  course: {
    hasQuiz?: boolean;
    quizId?: string | null;
    hasLessonQuiz?: boolean;
    slug?: string;
    title?: Record<string, string>;
    pdfUrl?: string;
  },
  user: { assessmentCompleted?: boolean } | null | undefined
): boolean {
  if (!user?.assessmentCompleted) return true;
  if (!courseHasQuizReady(course)) return true;
  return false;
}
