import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { userApi, coursesApi } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { ChevronRight } from "lucide-react";

type Me = {
  user: { name: string; avatarColor: string; badges: { badge: { key: string; icon: string; title: unknown } }[] };
  progress: { overallCompletionPct: number; coursesCompleted: number; coursesTotal: number; avgQuizScore: number };
};

export function HomePage() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [courses, setCourses] = useState<
    { id: string; title: Record<string, string>; icon: string; coverColor: string; progress: { completionPct: number; lastAccessedAt: string } | null }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    void (async () => {
      try {
        const [m, c] = await Promise.all([userApi.me(), coursesApi.list()]);
        if (!ok) return;
        setMe(m.data as Me);
        setCourses((c.data as { courses: typeof courses }).courses.slice(0, 3));
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  const name =
    state.kind === "employee" ? state.user.name : me?.user.name ?? "";
  const pct = me?.progress.overallCompletionPct ?? 0;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 rounded-2xl bg-stone-200 dark:bg-white/5" />
        <div className="h-24 rounded-2xl bg-stone-200 dark:bg-white/5" />
      </div>
    );
  }

  const sortedContinue = [...courses].sort((a, b) => {
    const ta = a.progress?.lastAccessedAt ? new Date(a.progress.lastAccessedAt).getTime() : 0;
    const tb = b.progress?.lastAccessedAt ? new Date(b.progress.lastAccessedAt).getTime() : 0;
    return tb - ta;
  });
  const cont = sortedContinue.find((c) => (c.progress?.completionPct ?? 0) < 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1917] dark:text-[#F5F5F4]">{t("employee.greeting", { name })}</h1>
        <p className="text-[#57534E] dark:text-stone-400">{t("employee.motivate")}</p>
      </div>

      <div className="rounded-2xl border border-[#E7E5E4] bg-[#F5F5F4] p-6 dark:border-[#44403C] dark:bg-[#292524]">
        <p className="mb-4 text-center text-sm text-[#57534E] dark:text-stone-400">{t("employee.overallProgress")}</p>
        <div className="flex justify-center">
          <svg width={140} height={140} className="-rotate-90 text-[#E7E5E4] dark:text-[#44403C]">
            <circle cx={70} cy={70} r={r} fill="none" stroke="currentColor" strokeWidth={12} />
            <motion.circle
              cx={70}
              cy={70}
              r={r}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
        </div>
        <p className="mt-4 text-center text-lg font-semibold text-employee-amber">
          {t("employee.coursesDone", {
            done: me?.progress.coursesCompleted ?? 0,
            total: me?.progress.coursesTotal ?? 0,
          })}
        </p>
      </div>

      {cont && (
        <Link
          to={`/courses/${cont.id}`}
          className="flex min-h-[52px] items-center justify-between rounded-2xl border border-emerald-200 bg-[#F0FDF4] px-4 py-4 transition hover:opacity-95 dark:border-emerald-800/50 dark:bg-emerald-950/25"
        >
          <div>
            <p className="text-sm text-teal-700 dark:text-employee-teal">{t("employee.continue")}</p>
            <p className="font-bold text-[#1C1917] dark:text-[#F5F5F4]">
              {(cont.title as Record<string, string>).ar ||
                (cont.title as Record<string, string>).en}
            </p>
          </div>
          <ChevronRight className="h-6 w-6 text-employee-teal rtl:rotate-180" />
        </Link>
      )}

      <div>
        <h2 className="mb-3 text-lg font-bold text-[#1C1917] dark:text-[#F5F5F4]">{t("employee.badges")}</h2>
        <div className="flex flex-wrap gap-3">
          {me?.user.badges?.length ? (
            me.user.badges.map((ub) => (
              <motion.div
                key={ub.badge.key}
                title={JSON.stringify(ub.badge.title)}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-[#E7E5E4] bg-white text-2xl shadow-lg dark:border-[#44403C] dark:bg-[#292524]"
                whileHover={{ scale: 1.05 }}
              >
                {ub.badge.icon}
              </motion.div>
            ))
          ) : (
            <p className="text-[#57534E] dark:text-stone-400">{t("common.noData")}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-xl bg-[#F5F5F4] py-4 dark:bg-white/5">
          <div className="text-2xl font-bold text-employee-amber">—</div>
          <div className="text-[#57534E] dark:text-stone-400">{t("employee.stats.streak")}</div>
        </div>
        <div className="rounded-xl bg-[#F5F5F4] py-4 dark:bg-white/5">
          <div className="text-2xl font-bold text-employee-teal">{me?.progress.avgQuizScore ?? 0}%</div>
          <div className="text-[#57534E] dark:text-stone-400">{t("employee.stats.avgScore")}</div>
        </div>
        <div className="rounded-xl bg-[#F5F5F4] py-4 dark:bg-white/5">
          <div className="text-2xl font-bold text-[#1C1917] dark:text-[#F5F5F4]">0</div>
          <div className="text-[#57534E] dark:text-stone-400">{t("employee.stats.certs")}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1C1917] dark:text-[#F5F5F4]">{t("nav.courses")}</h2>
        <Link to="/courses" className="text-employee-amber">
          {t("employee.seeAll")}
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {courses.map((c) => (
          <Link
            key={c.id}
            to={`/courses/${c.id}`}
            className="rounded-xl border border-[#E7E5E4] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-[#44403C] dark:bg-[#292524]"
          >
            <div className="mb-2 text-3xl">{c.icon}</div>
            <div className="line-clamp-2 font-semibold text-[#1C1917] dark:text-[#F5F5F4]">
              {(c.title as Record<string, string>).ar ||
                (c.title as Record<string, string>).en}
            </div>
            <div className="mt-2 h-2 rounded-full bg-[#E7E5E4] dark:bg-[#44403C]">
              <div
                className="h-full rounded-full bg-employee-amber"
                style={{ width: `${c.progress?.completionPct ?? 0}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
