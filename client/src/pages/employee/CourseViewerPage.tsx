import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Document, Page, pdfjs } from "react-pdf";
import { coursesApi } from "@/api/api";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { BackNavButton } from "@/components/BackNavButton";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export function CourseViewerPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const toast = useToast();
  const [course, setCourse] = useState<{
    title: Record<string, string>;
    description: Record<string, string>;
    pdfUrl: string;
    pdfPageCount: number;
    hasQuiz: boolean;
    progress: { pagesRead: number; completionPct: number; isCompleted: boolean } | null;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfErr, setPdfErr] = useState(false);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const secs = useRef(0);

  const save = useCallback(async () => {
    if (!id || !course) return;
    try {
      await coursesApi.progress(id, {
        pagesRead: page,
        timeSpentSecs: secs.current,
      });
      secs.current = 0;
      toast(t("common.progressSaved"), "success");
    } catch {
      toast(t("common.error"), "error");
    }
  }, [id, course, page, t, toast]);

  useEffect(() => {
    if (!id) return;
    setPdfErr(false);
    setNumPages(0);
    setPage(1);
    void (async () => {
      try {
        const { data } = await coursesApi.get(id);
        const c = (data as { course: typeof course }).course;
        setCourse(c);
        if (c?.progress?.pagesRead) setPage(Math.max(1, c.progress.pagesRead));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
      void save();
    }, 30000);
    return () => clearInterval(iv);
  }, [save]);

  const hasPdfSource = Boolean(course?.pdfUrl?.trim());
  const pdfUnavailable = !hasPdfSource || pdfErr;
  const total = pdfUnavailable
    ? 0
    : Math.max(course?.pdfPageCount ?? 0, numPages, 1);
  const pct = pdfUnavailable ? 0 : Math.min(100, (page / Math.max(total, 1)) * 100);
  const canComplete =
    !pdfUnavailable && pct >= 80 && !course?.progress?.isCompleted;
  const completed = course?.progress?.isCompleted;

  if (loading || !course) {
    return <div className="h-96 animate-pulse rounded-2xl bg-stone-200 dark:bg-white/5" />;
  }

  const pdfSrc = course.pdfUrl?.trim() ?? "";

  return (
    <div className="space-y-4">
      <BackNavButton to="/courses" label={t("nav.backToCourses")} />
      <div>
        <h1 className="text-xl font-bold text-[#1C1917] dark:text-[#F5F5F4]">{course.title[lang] || course.title.ar}</h1>
        <p className="line-clamp-2 text-sm text-[#57534E] dark:text-stone-400">
          {course.description[lang] || course.description.ar}
        </p>
      </div>

      <div className="h-2 rounded-full bg-[#E7E5E4] dark:bg-[#44403C]">
        <motion.div
          className="h-full rounded-full bg-employee-amber"
          animate={{ width: `${pct}%` }}
        />
      </div>
      {!pdfUnavailable && (
        <p className="text-center text-sm text-[#57534E] dark:text-stone-400">
          {t("employee.viewer.pageOf", { current: page, total })}
        </p>
      )}

      <div className="flex min-h-[420px] justify-center overflow-auto rounded-2xl border border-[#E7E5E4] bg-white/80 p-4 dark:border-[#44403C] dark:bg-[#292524]/50">
        {pdfUnavailable ? (
          <div
            role="status"
            className="flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-[#E7E5E4] bg-[#F5F5F4] px-6 py-12 text-center shadow-inner dark:border-[#44403C] dark:bg-[#1C1917]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E7E5E4] bg-white text-[#57534E] dark:border-[#44403C] dark:bg-[#292524] dark:text-stone-400">
              <FileText className="h-9 w-9" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="text-balance text-sm leading-relaxed text-[#57534E] dark:text-stone-400">
              {t("employee.viewer.noPdfYet")}
            </p>
          </div>
        ) : (
          <Document
            file={pdfSrc}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              setPdfErr(false);
            }}
            onLoadError={() => setPdfErr(true)}
            loading={<div className="p-8 text-[#57534E] dark:text-stone-400">{t("common.loading")}</div>}
            className="max-w-full"
          >
            <Page
              pageNumber={page}
              width={Math.min(560, typeof window !== "undefined" ? window.innerWidth - 48 : 560)}
              className="shadow-xl"
              renderTextLayer
              renderAnnotationLayer
            />
          </Document>
        )}
      </div>

      {!pdfUnavailable && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl border border-[#E7E5E4] bg-white px-6 font-semibold text-[#1C1917] transition hover:bg-[#F5F5F4] active:scale-[0.97] disabled:opacity-30 dark:border-[#44403C] dark:bg-[#292524] dark:text-white dark:hover:bg-[#44403C]"
          >
            <ChevronLeft className="h-6 w-6 rtl:rotate-180" /> {t("employee.viewer.prev")}
          </button>
          <button
            type="button"
            disabled={page >= total}
            onClick={() => setPage((p) => Math.min(total, p + 1))}
            className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl border border-[#E7E5E4] bg-white px-6 font-semibold text-[#1C1917] transition hover:bg-[#F5F5F4] active:scale-[0.97] disabled:opacity-30 dark:border-[#44403C] dark:bg-[#292524] dark:text-white dark:hover:bg-[#44403C]"
          >
            {t("employee.viewer.next")} <ChevronRight className="h-6 w-6 rtl:rotate-180" />
          </button>
        </div>
      )}

      {canComplete && (
        <button
          type="button"
          onClick={async () => {
            if (!id) return;
            try {
              await coursesApi.progress(id, { pagesRead: total, timeSpentSecs: secs.current });
              toast(t("common.saved"), "success");
              const { data } = await coursesApi.get(id);
              setCourse((data as { course: typeof course }).course);
            } catch {
              toast(t("common.error"), "error");
            }
          }}
          className="w-full min-h-[52px] rounded-xl bg-employee-teal font-bold text-[#1C1917]"
        >
          {t("employee.viewer.markComplete")}
        </button>
      )}

      {completed && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-employee-amber/40 dark:bg-employee-amber/10">
          {course.hasQuiz ? (
            <button
              type="button"
              onClick={() => nav(`/quiz/${id}`)}
              className="min-h-[52px] w-full rounded-xl bg-[#F59E0B] px-6 font-bold text-[#1C1917]"
            >
              {t("employee.viewer.takeQuiz")}
            </button>
          ) : (
            <p className="text-[#57534E] dark:text-stone-400">{t("employee.viewer.quizSoonLong")}</p>
          )}
        </div>
      )}
    </div>
  );
}
