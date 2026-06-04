import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { coursesApi, userApi } from "@/api/api";
import { Skeleton } from "@/components/employee/ui/Skeleton";
import { EmptyState } from "@/components/employee/ui/EmptyState";
import { Card, SectionTitle } from "@/components/employee/ui/primitives";
import { CourseCard } from "@/components/CourseCard";
import { CourseCardGrid } from "@/components/employee/CourseCardGrid";
import { getCourseCardStatus } from "@/utils/courseCardStatus";
import { isHsseqIntroFromCourse } from "@/utils/courseVisibility";
import { courseCardCellClassName } from "@/components/employee/CourseCardGrid";
import { CertificateButton } from "@/components/employee/CertificateButton";
import "./courseCardsMobile.css";

type CourseRow = {
  id: string;
  slug?: string;
  pdfUrl?: string;
  title: Record<string, string>;
  description?: Record<string, string> | string | null;
  icon: string;
  coverColor: string;
  pdfPageCount: number;
  hasQuiz: boolean;
  quizId?: string | null;
  hasLessonQuiz?: boolean;
  lessonQuizLatest?: { percentage: number; score: number; total: number } | null;
  isHsseqFoundation?: boolean;
  progress: { completionPct: number; isCompleted: boolean } | null;
};

export function CoursesPage() {
  const { t } = useTranslation();
  const [list, setList] = useState<CourseRow[]>([]);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [hsseqRequired, setHsseqRequired] = useState(true);
  const [meInfo, setMeInfo] = useState<{ name: string; role: string; avgScore: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "not_started" | "in_progress" | "completed">("all");
  const [lastReadTick, setLastReadTick] = useState(0);
  const loadingRef = useRef(false);
  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      try {
        const [me, cr] = await Promise.all([userApi.me(), coursesApi.list()]);
        const m = me.data as {
          user?: {
            name?: string;
            category?: { name?: { ar?: string; fr?: string; en?: string } } | null;
            assessmentCompleted?: boolean;
            hsseqCourseRequired?: boolean;
            assessmentScore?: number | null;
          };
          progress?: { avgQuizScore?: number };
        };
        setAssessmentDone(Boolean(m.user?.assessmentCompleted));
        setHsseqRequired(m.user?.hsseqCourseRequired !== false);
        setMeInfo({
          name: m.user?.name ?? "—",
          role: m.user?.category?.name?.ar ?? "—",
          avgScore: Number(m.progress?.avgQuizScore ?? 0),
        });
        let courses = (cr.data as { courses: CourseRow[] }).courses;
        const score = m.user?.assessmentScore ?? 0;
        const hideHsseq =
          !m.user?.assessmentCompleted ||
          score >= 70 ||
          m.user?.hsseqCourseRequired === false;
        courses = courses.filter((c) => {
          if (!isHsseqIntroFromCourse(c)) return true;
          return (
            !hideHsseq &&
            Boolean(m.user?.assessmentCompleted) &&
            m.user?.hsseqCourseRequired !== false
          );
        });
        if (m.user?.assessmentCompleted && m.user.hsseqCourseRequired !== false) {
          courses = [...courses].sort(
            (a, b) =>
              Number(isHsseqIntroFromCourse(b)) - Number(isHsseqIntroFromCourse(a))
          );
        }
        setList(courses);
      } finally {
        setLoading(false);
      }
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh when returning from a quiz/course page (fixes stale "En cours" after finishing).
  useEffect(() => {
    const onFocus = () => {
      void load();
      setLastReadTick((n) => n + 1);
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void load();
        setLastReadTick((n) => n + 1);
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  const filtered = useMemo(() => {
    if (tab === "all") return list;
    if (tab === "completed") return list.filter((c) => getCourseCardStatus(c) === "completed");
    if (tab === "not_started") {
      return list.filter((c) => {
        const status = getCourseCardStatus(c);
        return status === "not_started" || status === "locked";
      });
    }
    return list.filter((c) => getCourseCardStatus(c) === "in_progress");
  }, [list, tab]);

  const tabCounts = useMemo(() => {
    const counts: Record<Exclude<typeof tab, "all">, number> = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
    };
    for (const c of list) {
      const s = getCourseCardStatus(c);
      if (s === "not_started" || s === "locked") counts.not_started += 1;
      else if (s === "in_progress") counts.in_progress += 1;
      else if (s === "completed") counts.completed += 1;
    }
    return counts;
  }, [list]);

  const completionStats = useMemo(() => {
    const total = list.filter((c) => getCourseCardStatus(c) !== "locked").length;
    const completed = list.filter((c) => getCourseCardStatus(c) === "completed").length;
    return { total, completed, allDone: total > 0 && completed >= total };
  }, [list]);

  if (loading) {
    return (
      <div className="space-y-7">
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }

  if (!list.length) {
    return (
      <EmptyState
        title={t("employee.noCourses")}
        description={t("employee.coursesExt.emptyDesc")}
        ctaLabel={t("nav.home")}
        ctaTo="/home"
      />
    );
  }

  return (
    <div className="space-y-7">
      <Card>
        <SectionTitle>{t("nav.myTraining")}</SectionTitle>
        <div className="mt-2 text-[15px] leading-[1.65] text-[#57534E] dark:text-stone-400">
          {t("employee.librarySub")}
        </div>
        {meInfo && (
          <div className="mt-4">
            <CertificateButton
              allCoursesCompleted={completionStats.allDone}
              avgScore={meInfo.avgScore}
              employee={{ name: meInfo.name, role: meInfo.role, completionDate: new Date().toISOString() }}
            />
          </div>
        )}
        <div
          className="filter-buttons-container mt-5 grid grid-cols-2 gap-[14px] md:grid-cols-4"
          role="tablist"
          aria-label={t("nav.myTraining")}
        >
          {[
            { k: "all", label: t("common.all"), count: list.length },
            { k: "not_started", label: t("employee.notStarted"), count: tabCounts.not_started },
            { k: "in_progress", label: t("employee.inProgress"), count: tabCounts.in_progress },
            { k: "completed", label: t("employee.completed"), count: tabCounts.completed },
          ].map((x) => {
            const active = tab === (x.k as typeof tab);
            return (
              <button
                key={x.k}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(x.k as typeof tab)}
                className={`filter-button flex h-[54px] items-center justify-center gap-2 rounded-[14px] px-3 text-[16px] font-extrabold transition-all duration-200 ease-out active:scale-[0.97] active:opacity-90 ${
                  active
                    ? "bg-[#2E6198] text-white shadow-[0_10px_24px_rgba(46,97,152,0.35)] ring-1 ring-white/20"
                    : "bg-[#F3F4F6] text-[#111827]/70 hover:bg-[#E5E7EB] hover:text-[#111827] dark:bg-[#374151] dark:text-white/70 dark:hover:bg-[#4B5563] dark:hover:text-white"
                }`}
              >
                <span>{x.label}</span>
                <span
                  className={`inline-flex min-w-[26px] items-center justify-center rounded-full px-2 py-0.5 text-[12px] font-extrabold tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-black/5 text-[#111827]/70 dark:bg-white/10 dark:text-white/70"
                  }`}
                  dir="ltr"
                >
                  {x.count}
                </span>
              </button>
            );
          })}
        </div>

      </Card>

      {!filtered.length ? (
        <EmptyState
          title={
            tab === "completed"
              ? t("employee.coursesExt.emptyCompletedTitle")
              : tab === "in_progress"
                ? t("employee.coursesExt.emptyInProgressTitle")
                : tab === "not_started"
                  ? t("employee.notStarted")
                : t("common.noData")
          }
          description={t("employee.coursesExt.filteredEmptyDesc")}
          ctaLabel={t("employee.coursesExt.filteredCta")}
          ctaTo="/courses"
        />
      ) : (
        <CourseCardGrid lastReadTick={lastReadTick} className="courses-grid">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              assessmentCompleted={assessmentDone}
              hsseqRequired={hsseqRequired}
              className={`${courseCardCellClassName} course-card-courses`}
            />
          ))}
        </CourseCardGrid>
      )}
    </div>
  );
}
