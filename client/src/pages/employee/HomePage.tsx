import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { userApi, coursesApi } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/employee/ui/Skeleton";
import { RoleAvatar, roleAvatarKindFromCategoryCode } from "@/components/employee/ui/RoleAvatar";
import { Card, Pill, SectionTitle } from "@/components/employee/ui/primitives";
import { CourseCard } from "@/components/CourseCard";
import { CourseCardGrid } from "@/components/employee/CourseCardGrid";
import { HomeDashboardCards, type HomeContinueCourse } from "@/components/employee/HomeDashboardCards";
import { isHsseqIntroFromCourse } from "@/utils/courseVisibility";
import { reminderPoolFor, type ReminderLang } from "@/data/reminders";
import { AssessmentBanner } from "@/components/employee/AssessmentBanner";
import { AssessmentModal } from "@/components/employee/AssessmentModal";
import { getCategoryDefByCode } from "@/config/categories";
import { translatedEmployeeBadgeName } from "@/i18n/badgeName";
import { courseCardCellClassName } from "@/components/employee/CourseCardGrid";
import {
  EMPLOYEE_ASSESSMENT_QUIZ_ID,
  FOCUS_ASSESSMENT_EVENT,
  scrollToAssessmentQuizCard,
  type FocusAssessmentLocationState,
} from "@/utils/employeeAssessmentFocus";
import { getCourseCardStatus } from "@/utils/courseCardStatus";
import "./courseCardsMobile.css";

type Me = {
  user: {
    name: string;
    avatarColor: string;
    category?: { id: string; code: string; name: { fr?: string; en?: string; ar?: string } } | null;
    badges: { earnedAt: string; badge: { key: string; icon: string; title: unknown } }[];
    assessmentCompleted?: boolean;
    assessmentScore?: number | null;
    hsseqCourseRequired?: boolean;
  };
  progress: { overallCompletionPct: number; coursesCompleted: number; coursesTotal: number; avgQuizScore: number };
};

type HomeCourse = {
  id: string;
  slug?: string;
  pdfUrl?: string;
  title: Record<string, string>;
  description?: Record<string, string> | string | null;
  icon: string;
  coverColor: string;
  isHsseqFoundation?: boolean;
  hasLessonQuiz?: boolean;
  hasQuiz?: boolean;
  quizId?: string | null;
  lessonQuizLatest?: { percentage: number; score: number; total: number } | null;
  progress: { completionPct: number; lastAccessedAt: string } | null;
};

export { EMPLOYEE_ASSESSMENT_QUIZ_ID } from "@/utils/employeeAssessmentFocus";

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { state, updateEmployeeUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [me, setMe] = useState<Me | null>(null);
  const [courses, setCourses] = useState<HomeCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminderKey, setReminderKey] = useState<string | null>(null);
  const [reminderTone, setReminderTone] = useState<"safety" | "course" | "emergency" | "general">("general");
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [lastReadTick, setLastReadTick] = useState(0);

  const refreshLock = useRef(false);
  const refreshHome = useCallback(async () => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    const [m, c] = await Promise.all([userApi.me(), coursesApi.list()]);
    const meData = m.data as Me;
    setMe(meData);
    setCourses((c.data as { courses: HomeCourse[] }).courses);
    updateEmployeeUser({
      assessmentCompleted: meData.user.assessmentCompleted,
      assessmentScore: meData.user.assessmentScore,
      hsseqCourseRequired: meData.user.hsseqCourseRequired,
    });
    refreshLock.current = false;
  }, [updateEmployeeUser]);

  useEffect(() => {
    let ok = true;
    void (async () => {
      try {
        await refreshHome();
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, [refreshHome]);

  // Refresh when coming back from another page (prevents stale status pills after finishing a quiz).
  useEffect(() => {
    const onFocus = () => {
      void refreshHome();
      setLastReadTick((n) => n + 1);
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void refreshHome();
        setLastReadTick((n) => n + 1);
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshHome]);

  const name =
    state.kind === "employee" ? state.user.name : me?.user.name ?? "";
  const pct = me?.progress.overallCompletionPct ?? 0;

  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  const categoryLabel = useMemo(() => {
    const c = me?.user.category;
    const m = (c?.name ?? {}) as Record<string, string | undefined>;
    return (m[lang] || m.fr || m.en || c?.code || "").trim();
  }, [lang, me?.user.category]);

  const categoryMeta = useMemo(() => getCategoryDefByCode(me?.user.category?.code), [me?.user.category?.code]);

  const motivation = useMemo(() => {
    if (pct <= 0) return t("employee.home.motivate0");
    if (pct <= 40) return t("employee.home.motivate40");
    if (pct <= 79) return t("employee.home.motivate79");
    if (pct <= 99) return t("employee.home.motivate99");
    return t("employee.home.motivate100");
  }, [pct, t]);

  const assessmentDone = Boolean(me?.user.assessmentCompleted);
  const hsseqRequired = me?.user.hsseqCourseRequired !== false;
  const assessmentScore = me?.user.assessmentScore ?? 0;
  /** Passed baseline: taken and score ≥ 70. */
  const assessmentPassed = assessmentDone && assessmentScore >= 70;
  const assessmentFailed = assessmentDone && !assessmentPassed;

  const runAssessmentFocus = useCallback(() => {
    if (loading) return;
    window.requestAnimationFrame(() => {
      scrollToAssessmentQuizCard();
    });
  }, [loading]);

  useEffect(() => {
    const onEvent = () => runAssessmentFocus();
    window.addEventListener(FOCUS_ASSESSMENT_EVENT, onEvent);
    return () => window.removeEventListener(FOCUS_ASSESSMENT_EVENT, onEvent);
  }, [runAssessmentFocus]);

  useEffect(() => {
    const navState = location.state as FocusAssessmentLocationState | null;
    if (!navState?.focusAssessment || loading) return;
    const tId = window.setTimeout(() => {
      runAssessmentFocus();
      navigate("/home", { replace: true, state: null });
    }, 120);
    return () => window.clearTimeout(tId);
  }, [location.state, loading, runAssessmentFocus, navigate]);
  /** No course access until the onboarding assessment is completed. */
  const coursesLocked = !assessmentDone;

  const coursesVisible = useMemo(() => {
    const score = assessmentScore;
    const hideHsseq = !assessmentDone || score >= 70 || me?.user.hsseqCourseRequired === false;
    return courses.filter((c) => {
      if (!isHsseqIntroFromCourse(c)) return true;
      return !hideHsseq && assessmentDone && hsseqRequired;
    });
  }, [courses, assessmentScore, me?.user.hsseqCourseRequired, assessmentDone, hsseqRequired]);

  const sortedForHome = useMemo(() => {
    const list = [...coursesVisible];
    if (assessmentDone && hsseqRequired) {
      list.sort((a, b) => Number(isHsseqIntroFromCourse(b)) - Number(isHsseqIntroFromCourse(a)));
    }
    return list;
  }, [coursesVisible, assessmentDone, hsseqRequired]);

  const mainHomeCourses = useMemo(() => sortedForHome, [sortedForHome]);

  const continueCourse = useMemo<HomeContinueCourse | null>(() => {
    if (!assessmentPassed) return null;
    const candidate = coursesVisible
      .filter((c) => getCourseCardStatus(c) === "in_progress")
      .sort((a, b) => {
        const ta = a.progress?.lastAccessedAt ? new Date(a.progress.lastAccessedAt).getTime() : 0;
        const tb = b.progress?.lastAccessedAt ? new Date(b.progress.lastAccessedAt).getTime() : 0;
        return tb - ta;
      })[0];

    if (!candidate) return null;
    const title = candidate.title?.[lang] || candidate.title?.ar || candidate.title?.en || "—";
    const quizPct = candidate.lessonQuizLatest?.percentage;
    const pct =
      quizPct != null && quizPct < 70 ? quizPct : candidate.progress?.completionPct ?? 0;
    return { id: candidate.id, title, pct };
  }, [assessmentPassed, coursesVisible, lang]);

  const roleKind = useMemo(() => {
    const categoryCode = me?.user.category?.code ?? null;
    const employeeId = state.kind === "employee" ? state.user.employeeId : null;
    return roleAvatarKindFromCategoryCode(categoryCode, employeeId);
  }, [me?.user.category?.code, state.kind, state.kind === "employee" ? state.user.employeeId : null]);

  const roleLabel = useMemo(() => {
    if (roleKind === "unknown") return categoryLabel || t("employee.roleLabels.unknown");
    return t(`employee.roleLabels.${roleKind}`);
  }, [categoryLabel, roleKind, t]);

  const reminderPool = useMemo(() => {
    const categoryCode = me?.user.category?.code ?? null;
    const employeeId = state.kind === "employee" ? state.user.employeeId : null;
    const kind = roleAvatarKindFromCategoryCode(categoryCode, employeeId);
    return reminderPoolFor(kind, lang as ReminderLang);
  }, [me?.user.category?.code, state, lang]);

  const pickReminder = useCallback(() => {
    const pool = reminderPool.pool;
    if (pool.length === 0) return;
    const idx = Math.floor(Math.random() * pool.length);
    const row = pool[idx]!;
    const key = `reminder:v2:${idx}:${row.tone}`;
    setReminderKey(key);
    setReminderTone(row.tone);
    try {
      localStorage.setItem("daily_reminder_key", key);
    } catch {
      /* ignore */
    }
  }, [reminderPool.pool]);

  useEffect(() => {
    if (!me) return;
    const sessionFlag = "daily_reminder_session_seen";
    const storedKey = (() => {
      try {
        return localStorage.getItem("daily_reminder_key");
      } catch {
        return null;
      }
    })();
    const seenThisSession = (() => {
      try {
        return sessionStorage.getItem(sessionFlag) === "1";
      } catch {
        return false;
      }
    })();

    if (seenThisSession && storedKey) {
      setReminderKey(storedKey);
      if (storedKey.startsWith("reminder:v2:")) {
        const tone = storedKey.split(":")[3];
        if (tone === "emergency" || tone === "course" || tone === "safety" || tone === "general") {
          setReminderTone(tone);
        }
      }
      return;
    }
    pickReminder();
    try {
      sessionStorage.setItem(sessionFlag, "1");
    } catch {
      /* ignore */
    }
  }, [me, pickReminder]);

  const reminderText = useMemo(() => {
    if (!reminderKey) return null;
    if (reminderKey.startsWith("reminder:v2:")) {
      const parts = reminderKey.split(":");
      const idx = Number(parts[2]);
      if (!Number.isFinite(idx)) return null;
      const row = reminderPool.pool[idx];
      return row?.text ?? null;
    }
    const parts = reminderKey.split(":");
    if (parts[0] === "reminder" && parts.length >= 3) {
      return parts.slice(2).join(":") || null;
    }
    return null;
  }, [reminderKey, reminderPool.pool]);

  const reminderStyles = useMemo(() => {
    const tone = reminderTone;
    const warmBase = "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/20";
    if (tone === "emergency") {
      return {
        wrap: warmBase,
        label: "text-red-700 dark:text-red-300",
      };
    }
    if (tone === "course") {
      return {
        wrap: warmBase,
        label: "text-blue-700 dark:text-blue-300",
      };
    }
    if (tone === "safety") {
      return {
        wrap: warmBase,
        label: "text-amber-800 dark:text-amber-300",
      };
    }
    return {
      wrap: warmBase,
      label: "text-emerald-800 dark:text-emerald-300",
    };
  }, [reminderTone]);

  const badgeTitleFor = useCallback(
    (b: { title: unknown; key: string }) => translatedEmployeeBadgeName(b, t, lang),
    [lang, t]
  );

  if (loading) {
    return (
      <div className="space-y-7">
        <Skeleton className="h-44" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const firstName = name.split(" ")[0] || name;
  const pageDir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div className="home-page-container space-y-7" dir={pageDir}>
      {/* Welcome card */}
      <Card tint="accent5" className="py-6">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <RoleAvatar
            categoryCode={me?.user.category?.code}
            employeeId={state.kind === "employee" ? state.user.employeeId : null}
            className="h-10 w-10 shrink-0 md:h-12 md:w-12"
            title={name}
          />
          <div className="min-w-0">
            <div className="text-[26px] font-extrabold tracking-[-0.6px] leading-[1.15] text-[#1C1917] dark:text-[#F5F5F4] md:text-[28px]">
              {t("employee.home.welcome", { name: firstName })}
            </div>
            <div className="mt-2 text-[14px] leading-[1.65] text-[#57534E] dark:text-stone-400 md:text-[15px]">
              {t("employee.home.intro")}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {categoryMeta ? (
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-extrabold"
                  style={{ backgroundColor: categoryMeta.bgColor, color: categoryMeta.color }}
                >
                  <categoryMeta.icon className="h-4 w-4" aria-hidden strokeWidth={2.4} />
                  <span>{categoryMeta.label[lang as "ar" | "fr" | "en"]}</span>
                </span>
              ) : (
                <Pill tone="accent">{roleLabel}</Pill>
              )}
              <div className="text-[14px] font-semibold text-averda dark:text-white">{motivation}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Daily reminder card (keep design + logic) */}
      {reminderText && (
        <div
          dir={pageDir}
          className={`rounded-2xl border p-[18px] ${reminderStyles.wrap} md:shadow-[0_4px_16px_rgba(0,0,0,0.07)]`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className={`text-[13px] font-extrabold ${reminderStyles.label}`}>
              {t("employee.home.reminderTitle")}
            </div>
            <button
              type="button"
              onClick={pickReminder}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white/70 text-[#1C1917] transition hover:bg-white active:scale-[0.97] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              aria-label={t("employee.home.reminderShuffleAria")}
              title={t("employee.home.reminderShuffleTitle")}
            >
              <RotateCcw className="h-4.5 w-4.5" aria-hidden />
            </button>
          </div>
          <div className="mt-3 text-[20px] font-extrabold leading-[1.6] text-[#1C1917] dark:text-[#F5F5F4] md:text-[22px]">
            {reminderText}
          </div>
        </div>
      )}

      {/* Baseline assessment — required before any course progress counts or unlocks */}
      {(!assessmentDone || assessmentFailed) && (
        <div
          id={EMPLOYEE_ASSESSMENT_QUIZ_ID}
          className="scroll-mt-28 space-y-0 rounded-2xl transition-shadow duration-300"
        >
          {!assessmentDone ? (
            <AssessmentBanner onStart={() => setAssessmentOpen(true)} />
          ) : (
            <div
              className="overflow-hidden rounded-2xl border border-rose-400/40 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm dark:border-rose-500/30 dark:from-rose-950/40 dark:to-[#2C2C2E]"
              dir={pageDir}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden>
                    ⚠️
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[18px] font-extrabold text-[#111827] dark:text-white">
                      {t("employee.assessmentBanner.failTitle")}
                    </h2>
                    <p className="mt-2 text-[16px] leading-[1.65] text-[#4B5563] dark:text-[#D1D5DB]">
                      {t("employee.assessmentBanner.failSubtitle")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssessmentOpen(true)}
                  className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#2E6198] px-5 text-[16px] font-bold text-white transition active:scale-[0.97] sm:w-auto"
                >
                  {t("employee.assessmentBanner.retryCta")}
                </button>
                <p className="text-[14px] font-semibold text-rose-800 dark:text-rose-200/90">
                  {t("employee.assessmentBanner.requiredNote")}
                </p>
              </div>
            </div>
          )}
          <AssessmentModal
            isOpen={assessmentOpen}
            onComplete={async () => {
              setAssessmentOpen(false);
              await refreshHome();
            }}
          />
        </div>
      )}

      {/* Home dashboard cards (clickable → profile sections) */}
      <HomeDashboardCards
        coursesCompleted={me?.progress.coursesCompleted ?? 0}
        coursesTotal={me?.progress.coursesTotal ?? 0}
        badgesCount={(me?.user.badges ?? []).length}
        badgeIcons={(me?.user.badges ?? []).slice(0, 8).map((b) => b.badge.icon)}
        level={Math.max(1, Math.floor(((me?.user.badges ?? []).length || 0) / 3) + 1)}
        continueCourse={continueCourse}
        formationsLocked={coursesLocked}
      />

      {/* Course list (lightweight; main entry is bottom tab) */}
      <section className="space-y-4">
        <SectionTitle
          right={
            <Link to="/courses" className="text-[13px] font-semibold text-averda active:opacity-90">
              {t("employee.seeAll")}
            </Link>
          }
        >
          {t("employee.home.myCourses")}
        </SectionTitle>
        {/* Mobile: 1-row horizontal scroll (easier scan, less redundancy). Desktop: small grid. */}
        <CourseCardGrid lastReadTick={lastReadTick}>
          {mainHomeCourses.slice(0, 6).map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              assessmentCompleted={assessmentDone}
              hsseqRequired={hsseqRequired}
              className={`${courseCardCellClassName} course-card-home`}
            />
          ))}
        </CourseCardGrid>
      </section>

      {/* Badges (keep) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="mt-3 text-lg font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
            {t("employee.home.myBadges")}
          </h2>
          <Link
            to="/badges"
            className="min-h-[48px] rounded-xl px-3 py-3 text-sm font-semibold text-averda hover:bg-averda/10 active:scale-[0.97]"
          >
            {t("employee.home.seeAllBadges")}
          </Link>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          {(me?.user.badges ?? []).slice(0, 6).map((ub) => (
            <motion.div
              key={ub.badge.key}
              className="flex w-[88px] shrink-0 flex-col items-center justify-between rounded-2xl border border-[#E7E5E4] bg-white px-2 py-3 text-center shadow-sm dark:border-[#44403C] dark:bg-[#292524]"
              whileTap={{ scale: 0.97 }}
            >
              <div className="text-[44px] leading-none" aria-hidden>
                {ub.badge.icon}
              </div>
              <div className="mt-2 w-full truncate text-[12px] font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                {badgeTitleFor(ub.badge)}
              </div>
            </motion.div>
          ))}
          {(!me?.user.badges || me.user.badges.length === 0) && (
            <div className="rounded-2xl border border-[#E7E5E4] bg-white p-4 text-sm text-[#57534E] dark:border-[#44403C] dark:bg-[#292524] dark:text-stone-400">
              {t("employee.home.noBadgesYet")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
