import { motion } from "framer-motion";
import type { AxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { coursesApi } from "@/api/api";
import { ArrowLeft, FileText } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { getCoursePdfUrl } from "@/data/employeeCoursePdfBySlug";
import { isLessonQuizFromCourse } from "@/utils/courseVisibility";
import { LessonQuiz } from "@/components/employee/LessonQuiz";
import { useAuth } from "@/context/AuthContext";
import { SoundButton } from "@/components/SoundButton";
import "./CourseViewerPage.css";

const ENV_API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const LOCAL_PDF_HOST_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1):3001(?=\/(?:courses|uploads)\/)/;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePdfUrl(url: string): string {
  const localRelativeUrl = url.replace(LOCAL_PDF_HOST_RE, "");
  return ENV_API_BASE
    ? localRelativeUrl.replace(new RegExp(`^${escapeRegExp(ENV_API_BASE)}(?=/(?:courses|uploads)/)`), "")
    : localRelativeUrl;
}

export function CourseViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { state } = useAuth();
  const [course, setCourse] = useState<{
    title: Record<string, string>;
    description: Record<string, string>;
    pdfUrl: string;
    pdfPageCount: number;
    slug: string;
    hasQuiz: boolean;
    hasLessonQuiz?: boolean;
    lessonQuizLatest?: { percentage: number; score: number; total: number } | null;
    progress: { pagesRead: number; completionPct: number; isCompleted: boolean } | null;
  } | null>(null);
  const [lessonQuizOpen, setLessonQuizOpen] = useState(false);
  /** Same ordering as `QuizPage` / `coursesApi.list()` — next item in catalog, or back to list. */
  const continueLessonQuizToNextCourse = useCallback(async () => {
    setLessonQuizOpen(false);
    if (!id) {
      navigate("/courses");
      return;
    }
    try {
      const { data } = await coursesApi.list();
      const rows = (data as { courses?: { id: string }[] }).courses ?? [];
      const idx = rows.findIndex((c) => c.id === id);
      const next = idx >= 0 ? rows[idx + 1] : undefined;
      if (next?.id) {
        navigate(`/courses/${next.id}`, { replace: true });
      } else {
        navigate("/courses", { replace: true });
      }
    } catch {
      navigate("/courses", { replace: true });
    }
  }, [id, navigate]);
  const [pageNumber] = useState(1);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [pdfDownloadHover, setPdfDownloadHover] = useState(false);
  const [pdfOpenHover, setPdfOpenHover] = useState(false);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const isArabic = lang === "ar";

  const [isMobile] = useState(
    () => typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  );
  const [hasRead, setHasRead] = useState(() => {
    if (!id) return false;
    try {
      return localStorage.getItem(`read_${id}`) === "true";
    } catch {
      return false;
    }
  });
  const syncReadFromStorage = useCallback(() => {
    if (!id) return false;
    try {
      const read = localStorage.getItem(`read_${id}`) === "true";
      setHasRead(read);
      return read;
    } catch {
      return false;
    }
  }, [id]);
  const markCourseRead = useCallback(() => {
    if (!id) return;
    try {
      localStorage.setItem(`read_${id}`, "true");
      localStorage.setItem(`lastRead_${id}`, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setHasRead(true);
    setIframeLoaded(true);
  }, [id]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const secs = useRef(0);
  const startCourseQuiz = useCallback(() => {
    if (!id || !course) return;
    const lessonKind = isLessonQuizFromCourse(course);
    if (lessonKind) {
      setLessonQuizOpen(true);
      return;
    }
    navigate(`/quiz/${id}`);
  }, [id, navigate, course, state.kind, state.kind === "employee" ? state.user.assessmentCompleted : null, state.kind === "employee" ? state.user.assessmentScore : null]);

  const save = useCallback(async (opts?: { silent?: boolean }) => {
    if (!id || !course) return;
    try {
      await coursesApi.progress(id, {
        pagesRead: pageNumber,
        timeSpentSecs: secs.current,
      });
      secs.current = 0;
      if (!opts?.silent) toast(t("common.progressSaved"), "success");
    } catch {
      // Avoid spamming toasts for background autosave.
      if (!opts?.silent) toast(t("common.error"), "error");
    }
  }, [id, course, pageNumber, t, toast]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setIframeError(false);
    setIframeLoaded(false);
    void (async () => {
      try {
        const { data } = await coursesApi.get(id);
        const c = (data as { course: unknown }).course as NonNullable<typeof course>;

        if (state.kind === "employee") {
          const passed =
            Boolean(state.user.assessmentCompleted) && (state.user.assessmentScore ?? 0) >= 70;
          if (!passed) {
            toast(
              lang === "ar" ? "أكمل اختبار التقييم واجتزه (70٪) للوصول إلى الدورات." : t("common.error"),
              "error"
            );
            navigate("/home", { replace: true });
            return;
          }
        }
        setCourse(c);
      } catch (e) {
        const err = e as AxiosError<{ error?: string }>;
        if (err.response?.status === 403 && err.response?.data?.error === "ASSESSMENT_REQUIRED") {
          toast(
            lang === "ar" ? "أكمل اختبار التقييم أولاً من الرئيسية." : t("common.error"),
            "error"
          );
          navigate("/home", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, toast, t, lang, state.kind, state.kind === "employee" ? state.user.assessmentCompleted : null, state.kind === "employee" ? state.user.assessmentScore : null]);

  useEffect(() => {
    timer.current = setInterval(() => {
      secs.current += 30;
    }, 30000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      void save({ silent: true });
    }, 30000);
    return () => clearInterval(iv);
  }, [save]);

  const courseSlug = course?.slug?.trim() ?? "";
  const titleAr = course?.title?.ar?.trim() ?? "";
  const apiPdf = course?.pdfUrl?.trim() ?? "";
  const apiPdfLooksValid =
    apiPdf.startsWith("/courses/") && !/Ø|%C3%98/.test(apiPdf);
  const pdfUrlRaw = apiPdfLooksValid
    ? apiPdf
    : getCoursePdfUrl(courseSlug) || getCoursePdfUrl(titleAr);
  const pdfUrl = pdfUrlRaw ? normalizePdfUrl(pdfUrlRaw) : "";

  useEffect(() => {
    setIframeError(false);
    const read = syncReadFromStorage();
    setIframeLoaded(read);
  }, [id, pdfUrl, syncReadFromStorage]);

  useEffect(() => {
    if (!isMobile || !id) return;
    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      const read = syncReadFromStorage();
      if (read) setIframeLoaded(true);
    };
    window.addEventListener("focus", onReturn);
    window.addEventListener("pageshow", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      window.removeEventListener("focus", onReturn);
      window.removeEventListener("pageshow", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [id, isMobile, syncReadFromStorage]);

  const pdfUnavailable = !pdfUrl || iframeError;
  const lessonQuizCourse = course ? isLessonQuizFromCourse(course) : false;
  const onLastSlide =
    (Boolean(pdfUrl) && iframeLoaded && !iframeError) || (pdfUnavailable && lessonQuizCourse);
  const pct = pdfUnavailable || !iframeLoaded ? 0 : 100;
  const quizUnlockedByViewer = onLastSlide;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  if (loading || !course) {
    return <div className="h-96 animate-pulse rounded-2xl bg-stone-200 dark:bg-white/5" />;
  }

  const pageTotal = Math.max(course.pdfPageCount ?? 0, 1);
  const formatPageCounter = (n: number) => {
    if (!isArabic) return String(n);
    try {
      return new Intl.NumberFormat("ar").format(n);
    } catch {
      return String(n);
    }
  };
  const navyActionClass =
    "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#1e3a5f] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#163056] active:scale-[0.98] sm:flex-initial";
  const quizCtaClass =
    "flex min-h-[52px] w-full items-center justify-center rounded-[12px] bg-[#1e3a5f] px-4 py-3 text-[17px] font-extrabold text-white shadow-md transition hover:bg-[#163056] active:scale-[0.99]";

  const pageCounterPill = (
    <span
      style={{
        background: "#f0f0f0",
        borderRadius: "20px",
        padding: "4px 12px",
        fontSize: "13px",
        color: "#666",
        fontWeight: 600,
        lineHeight: 1.4,
      }}
    >
      {formatPageCounter(pageNumber)} / {formatPageCounter(pageTotal)}
    </span>
  );

  const courseTitle = course.title[lang] || course.title.ar;

  const markPdfOpened = () => {
    if (!id) return;
    try {
      localStorage.setItem(`lastRead_${id}`, new Date().toISOString());
    } catch {
      /* ignore */
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;
    const safeName = (courseTitle ?? "course").replace(/[/\\?%*:|"<>]/g, "-");
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(pdfUrl, "_blank");
    }
  };

  const pdfRenderShell = !pdfUrl ? (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <FileText className="h-12 w-12 text-[#A8A29E]" />
      <p className="text-[#57534E] dark:text-stone-400">{t("course.pdfUnavailable")}</p>
    </div>
  ) : iframeError ? (
    <div className="px-4 py-10 text-center">
      <p className="text-[#57534E] dark:text-stone-400">
        {lang === "ar" ? "تعذّر تحميل الملف" : t("employee.viewer.pdfLoadError")}
      </p>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${navyActionClass} mt-4 inline-flex`}
      >
        {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
      </a>
    </div>
  ) : (
    <div className="w-full space-y-4">
      <div className="flex justify-end">{pageCounterPill}</div>
      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          background: "white",
        }}
      >
        <div
          style={{
            width: "100%",
            overflow: "hidden",
            borderRadius: "12px",
          }}
        >
          {isMobile ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                markCourseRead();
                markPdfOpened();
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                width: "100%",
                minHeight: "280px",
                background: hasRead
                  ? "linear-gradient(135deg, #065f46 0%, #059669 100%)"
                  : "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)",
                borderRadius: "16px",
                textDecoration: "none",
                padding: "32px 24px",
                boxSizing: "border-box",
                boxShadow: hasRead
                  ? "0 4px 20px rgba(6,95,70,0.35)"
                  : "0 4px 20px rgba(30,58,95,0.3)",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "38px",
                }}
              >
                {hasRead ? "✅" : "🎓"}
              </div>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    color: "white",
                    fontSize: "18px",
                    fontWeight: 700,
                    margin: "0 0 8px 0",
                  }}
                >
                  {hasRead
                    ? lang === "ar"
                      ? "تمت القراءة - يمكنك بدء الاختبار"
                      : lang === "fr"
                        ? "Lecture terminée — vous pouvez commencer le quiz"
                        : "Reading complete — you can start the quiz"
                    : lang === "ar"
                      ? "اضغط لقراءة الدورة"
                      : lang === "fr"
                        ? "Appuyez pour lire le cours"
                        : "Tap to read the course"}
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: "13px",
                    margin: 0,
                  }}
                >
                  {courseTitle}
                </p>
              </div>
              <div
                className={hasRead ? undefined : "open-course-btn"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: hasRead ? "transparent" : "white",
                  color: hasRead ? "white" : "#1e3a5f",
                  padding: hasRead ? "8px 20px" : "10px 24px",
                  borderRadius: "24px",
                  fontSize: hasRead ? "13px" : "14px",
                  fontWeight: 600,
                  marginTop: "8px",
                  border: hasRead ? "1.5px solid rgba(255,255,255,0.85)" : "none",
                }}
              >
                {hasRead
                  ? lang === "ar"
                    ? "أعد القراءة"
                    : lang === "fr"
                      ? "Relire le cours"
                      : "Read again"
                  : lang === "ar"
                    ? "📖 افتح الدورة"
                    : lang === "fr"
                      ? "📖 Ouvrir le cours"
                      : "📖 Open course"}
              </div>
              {!hasRead && (
                <p
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "11px",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  {lang === "ar"
                    ? "📌 بعد قراءة الدورة، ارجع لهذه الصفحة وابدأ الاختبار"
                    : lang === "fr"
                      ? "📌 Après la lecture, revenez sur cette page pour commencer le quiz"
                      : "📌 After reading, return to this page to start the quiz"}
                </p>
              )}
            </a>
          ) : (
            <iframe
              key={pdfUrl}
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              style={{
                width: "100%",
                height: "75vh",
                border: "none",
                borderRadius: "12px",
                display: "block",
                background: "white",
                maxWidth: "100%",
                overflow: "hidden",
              }}
              title={courseTitle}
              onLoad={() => {
                setIframeLoaded(true);
                markPdfOpened();
              }}
              onError={() => setIframeError(true)}
            />
          )}
        </div>
      </div>
      <div
        className="pdf-action-buttons"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          margin: "16px 0",
          flexWrap: "wrap",
        }}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <button
          type="button"
          onClick={() => void handleDownload()}
          onMouseEnter={() => setPdfDownloadHover(true)}
          onMouseLeave={() => setPdfDownloadHover(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minWidth: "160px",
            padding: "11px 24px",
            background: pdfDownloadHover ? "#163056" : "#1e3a5f",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            transition: "background 0.15s ease",
          }}
        >
          {lang === "ar" ? "⬇️ تحميل PDF" : lang === "fr" ? "⬇️ Télécharger le PDF" : "⬇️ Download PDF"}
        </button>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setPdfOpenHover(true)}
          onMouseLeave={() => setPdfOpenHover(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minWidth: "160px",
            padding: "11px 24px",
            background: pdfOpenHover ? "#f0f4f8" : "white",
            color: "#1e3a5f",
            border: "1.5px solid #1e3a5f",
            borderRadius: "10px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
            transition: "background 0.15s ease",
          }}
        >
          {lang === "ar" ? "↗️ فتح في نافذة جديدة" : `↗️ ${t("employee.viewer.openPdfNewTab")}`}
        </a>
      </div>
    </div>
  );

  const courseQuizAvailable = course.hasQuiz;
  // Ensure exactly ONE quiz CTA appears (avoid overlapping detectors / duplicate buttons).
  const quizKind: "lesson" | "course" | "none" = lessonQuizCourse ? "lesson" : courseQuizAvailable ? "course" : "none";


  return (
    <div
      className="relative mx-auto flex w-full flex-col"
      style={{ maxWidth: "860px", margin: "0 auto", padding: "0 16px 32px" }}
      dir="ltr"
    >
      {/* Top controls (match reference layout) */}
      <div className="flex items-center justify-between" dir="ltr">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E5E4] bg-white text-[#1C1917] shadow-sm transition hover:bg-slate-50 active:scale-[0.98] dark:border-[#44403C] dark:bg-[#292524] dark:text-white dark:hover:bg-white/10"
          aria-label={lang === "ar" ? "رجوع" : lang === "fr" ? "Retour" : "Back"}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <SoundButton ariaLabel="تشغيل الصوت" onClick={() => { /* TTS later */ }} />
      </div>

      {/* Course title */}
      <div className="mt-2" dir={isArabic ? "rtl" : "ltr"}>
        <h1 className="text-right text-[20px] font-extrabold leading-snug text-[#1C1917] dark:text-[#F5F5F4] md:text-[22px]">
          {course.title[lang] || course.title.ar}
        </h1>
      </div>

      {/* Thin progress bar */}
      <div className="mt-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#E7E5E4] dark:bg-[#44403C]">
          <motion.div
            className="h-full bg-[#1e3a5f]"
            style={{ transformOrigin: "left" }}
            animate={{ scaleX: pct / 100 }}
            transition={{ type: "tween", duration: 0.25 }}
          />
        </div>
      </div>

      {/* PDF document viewer */}
      <div className="mt-4 w-full">
        {!pdfUrl ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div
              role="status"
              className="flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-[#E7E5E4] bg-[#F5F5F4] px-6 py-10 text-center shadow-inner dark:border-[#44403C] dark:bg-[#1C1917]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E7E5E4] bg-white text-[#57534E] dark:border-[#44403C] dark:bg-[#292524] dark:text-stone-400">
                <FileText className="h-9 w-9" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="text-balance text-sm leading-relaxed text-[#57534E] dark:text-stone-400">
                {t("employee.viewer.noPdfYet")}
              </p>
            </div>
          </div>
        ) : (
          pdfRenderShell
        )}
      </div>

      {lessonQuizCourse && (
        <div className="mt-4 space-y-2" dir="rtl">
          {course.lessonQuizLatest != null && (
            <p className="text-center text-[13px] font-semibold text-[#57534E] dark:text-stone-400">
              {t("employee.viewer.latestLessonQuizResult", {
                pct: course.lessonQuizLatest.percentage,
                score: course.lessonQuizLatest.score,
                total: course.lessonQuizLatest.total,
              })}
            </p>
          )}
        </div>
      )}

      {/* Quiz CTAs */}
      {!pdfUnavailable && (
        <div className="mt-4 pb-6" style={{ direction: "ltr" as const }}>
          {quizKind === "lesson" && quizUnlockedByViewer && (
            <button
              type="button"
              onClick={startCourseQuiz}
              dir="rtl"
              className={`mt-4 ${quizCtaClass}`}
            >
              {t("employee.viewer.startLessonQuiz")}
            </button>
          )}

          {quizKind === "course" && quizUnlockedByViewer && (
            <button
              type="button"
              onClick={startCourseQuiz}
              dir={lang === "ar" ? "rtl" : "ltr"}
              className={`mt-4 ${quizCtaClass}`}
            >
              {t("employee.viewer.takeQuiz")}
            </button>
          )}

        </div>
      )}

      {/* No PDF but lesson has quiz — primary CTA only */}
      {pdfUnavailable && lessonQuizCourse && (
        <div className="mt-4 pb-6" dir="rtl">
          <button
            type="button"
            onClick={startCourseQuiz}
            dir="rtl"
            className={quizCtaClass}
          >
            {t("employee.viewer.startLessonQuiz")}
          </button>
        </div>
      )}

      {/* No PDF but course has a standard quiz — primary CTA */}
      {pdfUnavailable && !lessonQuizCourse && quizKind === "course" && (
        <div className="mt-4 pb-6" dir={lang === "ar" ? "rtl" : "ltr"}>
          <button
            type="button"
            onClick={startCourseQuiz}
            className={quizCtaClass}
          >
            {t("employee.viewer.takeQuiz")}
          </button>
        </div>
      )}

      {id && lessonQuizOpen && lessonQuizCourse && (
        <div
          className="fixed inset-0 z-[10060] overflow-y-auto bg-[#F5F5F4] dark:bg-[#0c0c0c]"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          dir="rtl"
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-auto w-full max-w-3xl px-4 py-6">
            <LessonQuiz
              courseId={id}
              onClose={() => setLessonQuizOpen(false)}
              onContinue={continueLessonQuizToNextCourse}
              onSubmitted={async () => {
                if (!id) return;
                try {
                  const { data } = await coursesApi.get(id);
                  const c = (data as { course: unknown }).course as NonNullable<typeof course>;
                  setCourse(c);
                } catch {
                  // ignore
                }
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
