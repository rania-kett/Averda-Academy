import { isHsseqIntroCourse } from "../data/courseVisibility.js";

export type CourseProgressRow = {
  id: string;
  slug: string;
  title: unknown;
  pdfUrl?: string | null;
  isHsseqFoundation?: boolean;
};

export type LessonProgressRow = {
  courseId: string;
  isCompleted: boolean;
  completionPct: number;
};

export type LessonQuizAttemptRow = {
  courseId: string;
  percentage: number;
  takenAt?: Date;
};

export type QuizAttemptRow = {
  passed: boolean;
  quiz?: { courseId: string } | null;
};

/** Matches client `getCourseCardStatus` — lesson quiz pass (≥70) or reading complete or AI quiz pass. */
export function isEmployeeCourseCompleted(
  courseId: string,
  progressByCourse: Map<string, LessonProgressRow>,
  latestLessonQuizByCourse: Map<string, { percentage: number }>,
  passedQuizCourseIds: Set<string>
): boolean {
  const quizPct = latestLessonQuizByCourse.get(courseId)?.percentage;
  if (quizPct != null && quizPct >= 70) return true;
  const p = progressByCourse.get(courseId);
  if (p?.isCompleted) return true;
  if (passedQuizCourseIds.has(courseId)) return true;
  return false;
}

export function isEmployeeCourseStarted(
  courseId: string,
  progressByCourse: Map<string, LessonProgressRow>,
  latestLessonQuizByCourse: Map<string, { percentage: number }>,
  passedQuizCourseIds: Set<string>
): boolean {
  if (
    isEmployeeCourseCompleted(
      courseId,
      progressByCourse,
      latestLessonQuizByCourse,
      passedQuizCourseIds
    )
  ) {
    return false;
  }
  const p = progressByCourse.get(courseId);
  if ((p?.completionPct ?? 0) > 0) return true;
  if (latestLessonQuizByCourse.has(courseId)) return true;
  return false;
}

export function latestLessonQuizByCourseId(
  attempts: LessonQuizAttemptRow[]
): Map<string, { percentage: number }> {
  const sorted = [...attempts].sort(
    (a, b) => new Date(b.takenAt ?? 0).getTime() - new Date(a.takenAt ?? 0).getTime()
  );
  const map = new Map<string, { percentage: number }>();
  for (const a of sorted) {
    if (!map.has(a.courseId)) {
      map.set(a.courseId, { percentage: a.percentage });
    }
  }
  return map;
}

export function passedQuizCourseIdsFromAttempts(
  attempts: QuizAttemptRow[]
): Set<string> {
  const ids = new Set<string>();
  for (const a of attempts) {
    if (a.passed && a.quiz?.courseId) ids.add(a.quiz.courseId);
  }
  return ids;
}

export function visibleCoursesForEmployee(
  assigned: CourseProgressRow[],
  assessmentCompleted: boolean,
  assessmentScore: number | null,
  hsseqCourseRequired: boolean
): CourseProgressRow[] {
  let visible = assigned;
  if (assessmentCompleted && !hsseqCourseRequired) {
    visible = assigned.filter(
      (c) => !isHsseqIntroCourse(c.isHsseqFoundation ?? false, c.slug, c.title)
    );
  }
  return visible;
}

export function assessmentPassedForProgress(
  assessmentCompleted: boolean,
  assessmentScore: number | null
): boolean {
  return assessmentCompleted === true && (assessmentScore ?? 0) >= 70;
}

export function computeEmployeeCourseMetrics(
  visibleCourses: CourseProgressRow[],
  progress: LessonProgressRow[],
  lessonQuizAttempts: LessonQuizAttemptRow[],
  quizAttempts: QuizAttemptRow[],
  assessmentCompleted: boolean,
  assessmentScore: number | null
): {
  coursesDone: number;
  coursesTotal: number;
  status: "not_started" | "in_progress" | "completed";
  hasStarted: boolean;
} {
  const coursesTotal = visibleCourses.length;
  const passed = assessmentPassedForProgress(assessmentCompleted, assessmentScore);

  const progressByCourse = new Map(progress.map((p) => [p.courseId, p]));
  const latestQuiz = latestLessonQuizByCourseId(lessonQuizAttempts);
  const passedQuiz = passedQuizCourseIdsFromAttempts(quizAttempts);

  if (!passed) {
    return {
      coursesDone: 0,
      coursesTotal,
      status: "not_started",
      hasStarted: false,
    };
  }

  let coursesDone = 0;
  let hasStarted = false;
  for (const c of visibleCourses) {
    if (isEmployeeCourseCompleted(c.id, progressByCourse, latestQuiz, passedQuiz)) {
      coursesDone++;
    } else if (isEmployeeCourseStarted(c.id, progressByCourse, latestQuiz, passedQuiz)) {
      hasStarted = true;
    }
  }

  const status: "not_started" | "in_progress" | "completed" =
    coursesTotal > 0 && coursesDone >= coursesTotal
      ? "completed"
      : coursesDone > 0 || hasStarted
        ? "in_progress"
        : "not_started";

  return { coursesDone, coursesTotal, status, hasStarted };
}
