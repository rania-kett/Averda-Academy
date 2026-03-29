import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { coursesApi } from "@/api/api";
import { Lock } from "lucide-react";

type CourseRow = {
  id: string;
  title: Record<string, string>;
  icon: string;
  coverColor: string;
  pdfPageCount: number;
  hasQuiz: boolean;
  progress: { completionPct: number; isCompleted: boolean } | null;
};

export function CoursesPage() {
  const { t, i18n } = useTranslation();
  const [list, setList] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await coursesApi.list();
        setList((data as { courses: CourseRow[] }).courses);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  const statusPill = (c: CourseRow) => {
    const p = c.progress;
    if (!p || p.completionPct <= 0)
      return {
        cls: "bg-[#F5F5F4] text-[#1C1917] dark:bg-[#44403C] dark:text-white",
        label: t("employee.notStarted"),
      };
    if (p.isCompleted || p.completionPct >= 100)
      return {
        cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-600/30 dark:text-emerald-300",
        label: t("employee.completed"),
      };
    return {
      cls: "bg-amber-100 text-amber-900 dark:bg-amber-600/30 dark:text-amber-200",
      label: t("employee.inProgress"),
    };
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-stone-200 dark:bg-white/5" />
        ))}
      </div>
    );
  }

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-[#E7E5E4] bg-white p-12 text-center text-[#57534E] dark:border-[#44403C] dark:bg-[#292524] dark:text-stone-400">
        {t("employee.noCourses")}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[#1C1917] dark:text-[#F5F5F4]">{t("employee.courseLibrary")}</h1>
      <p className="mb-6 text-[#57534E] dark:text-stone-400">{t("employee.librarySub")}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => {
          const pill = statusPill(c);
          const title = c.title[lang] || c.title.ar || c.title.en;
          return (
            <motion.div
              key={c.id}
              whileHover={{ y: -2 }}
              className="relative overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white shadow-lg dark:border-[#44403C] dark:bg-[#292524]"
            >
              <Link to={`/courses/${c.id}`} className="block p-5">
                <div
                  className={`mb-4 flex h-24 items-center justify-center rounded-xl bg-gradient-to-br ${c.coverColor} text-5xl`}
                >
                  {c.icon}
                </div>
                <h2 className="mb-2 line-clamp-2 text-lg font-bold text-[#1C1917] dark:text-[#F5F5F4]">{title}</h2>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs ${pill.cls}`}>{pill.label}</span>
                  {!c.hasQuiz && (
                    <span className="flex items-center gap-1 text-xs text-[#57534E] dark:text-stone-400">
                      <Lock className="h-4 w-4" /> {t("employee.quizLocked")}
                    </span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-[#E7E5E4] dark:bg-[#44403C]">
                  <div
                    className="h-full rounded-full bg-employee-amber transition-all"
                    style={{ width: `${c.progress?.completionPct ?? 0}%` }}
                  />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
