import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmployeeCourseCardContent } from "@/components/employee/EmployeeCourseCardContent";
import { courseCardCellClassName } from "@/components/employee/CourseCardGrid";
import { courseCardWrapperStyle } from "@/components/employee/courseCardLayout";
import { courseHasQuizReady, isCourseLocked } from "@/utils/courseLock";
import { getCourseCardStatus } from "@/utils/courseCardStatus";
import { isHsseqIntroFromCourse } from "@/utils/courseVisibility";
import { resolveCourseCardVisual } from "@/data/courseSlugCardVisuals";

export type CourseCardCourse = {
  id: string;
  slug?: string;
  pdfUrl?: string;
  title: Record<string, string>;
  description?: Record<string, string> | string | null;
  icon: string;
  coverColor: string;
  hasQuiz?: boolean;
  quizId?: string | null;
  hasLessonQuiz?: boolean;
  lessonQuizLatest?: { percentage: number; score?: number; total?: number } | null;
  isHsseqFoundation?: boolean;
  progress?: { completionPct: number } | null;
};

type Props = {
  course: CourseCardCourse;
  assessmentCompleted: boolean;
  hsseqRequired?: boolean;
  className?: string;
};

export function CourseCard({
  course,
  assessmentCompleted,
  hsseqRequired = true,
  className = courseCardCellClassName,
}: Props) {
  const { t, i18n } = useTranslation();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const title = course.title?.[lang] || course.title?.ar || course.title?.en || "—";
  const description =
    typeof course.description === "string"
      ? course.description
      : course.description?.[lang] || course.description?.ar || course.description?.fr || course.description?.en || "";
  const status = getCourseCardStatus(course);
  const locked = isCourseLocked(course, { assessmentCompleted });
  const assessmentLocked = !assessmentCompleted;
  const showQuizNotReady = locked && assessmentCompleted && !courseHasQuizReady(course);
  const requiredHsseq = assessmentCompleted && hsseqRequired && isHsseqIntroFromCourse(course);
  const startedNotDone = (course.progress?.completionPct ?? 0) > 0 && status !== "completed";
  const showLastRead = status === "in_progress" || startedNotDone;
  const lastPct = course.lessonQuizLatest?.percentage ?? null;
  const retryLabel = lang === "ar" ? "أعد المحاولة" : lang === "fr" ? "Réessayer" : "Retry";
  const assessmentLockedLabel =
    lang === "ar"
      ? "أكمل اختبار التقييم أولاً"
      : lang === "fr"
        ? "Terminez d'abord l'évaluation"
        : "Complete the assessment first";

  const { icon, coverColor } = resolveCourseCardVisual(
    course.slug,
    course.icon,
    course.coverColor
  );

  const cardContent = (
    <EmployeeCourseCardContent
      title={title}
      description={description.trim()}
      titleAr={course.title?.ar ?? ""}
      courseId={course.id}
      lang={lang}
      showLastRead={showLastRead}
      requiredHsseq={requiredHsseq}
      hsseqPillLabel={t("employee.home.hsseqRequiredPill")}
      status={status}
      lastPct={lastPct}
      retryLabel={retryLabel}
      showQuizNotReady={showQuizNotReady}
      completedLabel={t("employee.completed")}
      quizLockedLabel={t("employee.quizLocked")}
      notStartedLabel={t("employee.notStarted")}
      lessonQuizLatestLabel={t("employee.coursesExt.lessonQuizLatest", { pct: lastPct ?? 0 })}
      coverColor={coverColor}
      icon={icon}
    />
  );

  if (locked) {
    return (
      <div className={className}>
        <div
          className="group relative w-full course-card-shell"
          style={{
            ...courseCardWrapperStyle,
            cursor: "not-allowed",
            opacity: assessmentLocked ? 1 : 0.6,
          }}
          aria-disabled="true"
          title={assessmentLocked ? assessmentLockedLabel : undefined}
          onMouseEnter={() => assessmentLocked && setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
          onFocus={() => assessmentLocked && setTooltipOpen(true)}
          onBlur={() => setTooltipOpen(false)}
        >
          {assessmentLocked ? (
            <>
              {tooltipOpen && (
                <div className="pointer-events-none absolute left-1/2 top-0 z-[10] -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-xl bg-[#111827] px-3 py-2 text-[12px] font-semibold text-white shadow-lg">
                  {assessmentLockedLabel}
                </div>
              )}
              <div
                className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center rounded-2xl"
                style={{
                  background: "rgba(0,0,0,0.45)",
                }}
                aria-hidden
              >
                <span className="text-[32px] leading-none">
                🔒
                </span>
              </div>
            </>
          ) : (
            <div
              className="pointer-events-none absolute inset-0 z-[5] flex items-start justify-end overflow-hidden rounded-2xl p-3"
              aria-hidden
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-xl text-white backdrop-blur-sm">
                🔒
              </span>
            </div>
          )}
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Link
        to={`/courses/${course.id}`}
        className="course-card-shell relative block w-full no-underline transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
        style={courseCardWrapperStyle}
      >
        {cardContent}
      </Link>
    </div>
  );
}
