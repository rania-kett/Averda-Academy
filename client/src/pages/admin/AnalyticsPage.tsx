import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/api/api";
import { BarChart3, CheckCircle2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { adminCardPadded, adminMuted, adminTableWrap } from "@/components/admin/adminClasses";
import { useTheme } from "@/context/ThemeContext";

export function AnalyticsPage() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chartAxis = isDark ? "#94a3b8" : "#64748b";
  const [courseScores, setCourseScores] = useState<{ title: unknown; avgScore: number }[]>([]);
  const [weekly, setWeekly] = useState<{ week: string; rate: number }[]>([]);
  const [problems, setProblems] = useState<
    { courseTitle: unknown; questionPreview: string; wrongRate: number }[]
  >([]);
  const [heatmap, setHeatmap] = useState<{
    users: { id: string; name: string }[];
    courses: { id: string; title: unknown }[];
    cells: { userId: string; courseId: string; completionPct: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  useEffect(() => {
    void (async () => {
      try {
        const [cs, w, pq, hm] = await Promise.all([
          adminApi.analyticsCourseScores(),
          adminApi.analyticsWeekly(),
          adminApi.analyticsQuestions(),
          adminApi.analyticsHeatmap(),
        ]);
        setCourseScores((cs.data as { courses: typeof courseScores }).courses);
        setWeekly((w.data as { weekly: typeof weekly }).weekly);
        setProblems((pq.data as { questions: typeof problems }).questions.slice(0, 20));
        setHeatmap(hm.data as typeof heatmap);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-[#161B22]" />;
  }

  const hasHeatmapData = Boolean(heatmap?.users.length && heatmap.courses.length);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.analytics.title")}</h1>
        <p className={`mt-2 text-sm font-semibold ${adminMuted}`}>
          نظرة عامة على تقدم الموظفين والدورات التدريبية
        </p>
      </div>

      <section>
        <h2 className="mb-4 font-semibold">{t("admin.analytics.avgByCourse")}</h2>
        <div className={`h-72 ${adminCardPadded}`}>
          {courseScores.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseScores.map((c, i) => ({ name: `C${i + 1}`, score: c.avgScore }))}>
                <XAxis dataKey="name" stroke={chartAxis} tick={{ fill: chartAxis }} />
                <YAxis stroke={chartAxis} tick={{ fill: chartAxis }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#161B22" : "#ffffff",
                    border: isDark ? "1px solid #30363d" : "1px solid #e2e8f0",
                    borderRadius: 8,
                    color: isDark ? "#f1f5f9" : "#0f172a",
                  }}
                />
                <Bar dataKey="score" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500">
                <BarChart3 className="h-6 w-6" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-[#6B7280] dark:text-slate-400">لا توجد بيانات اختبارات بعد</p>
              <Link
                to="/admin/courses"
                className="rounded-xl bg-averda px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#163056]"
              >
                إنشاء اختبار
              </Link>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-semibold">{t("admin.analytics.weekly")}</h2>
        <div className={`h-72 ${adminCardPadded}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekly}>
              <XAxis dataKey="week" stroke={chartAxis} tick={{ fill: chartAxis }} />
              <YAxis stroke={chartAxis} tick={{ fill: chartAxis }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#161B22" : "#ffffff",
                  border: isDark ? "1px solid #30363d" : "1px solid #e2e8f0",
                  borderRadius: 8,
                  color: isDark ? "#f1f5f9" : "#0f172a",
                }}
              />
              <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-semibold">{t("admin.analytics.problemQ")}</h2>
        <div className={adminTableWrap}>
          <table className="w-full text-sm text-[#0F172A] dark:text-slate-100">
            <thead className="border-b border-[#E2E8F0] text-start text-slate-600 dark:border-[#30363D] dark:text-slate-400">
              <tr>
                <th className="p-3">{t("admin.analytics.question")}</th>
                <th className="p-3">{t("common.courses")}</th>
                <th className="p-3">{t("admin.analytics.wrongPct")}</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p, i) => (
                <tr key={i} className="border-t border-[#E2E8F0] dark:border-[#30363D]">
                  <td className="p-3 max-w-md truncate">{p.questionPreview}</td>
                  <td className="p-3">
                    {(p.courseTitle as Record<string, string>)?.[lang] ?? "—"}
                  </td>
                  <td className="p-3 tabular-nums">{p.wrongRate}%</td>
                </tr>
              ))}
              {!problems.length && (
                <tr className="border-t border-[#E2E8F0] dark:border-[#30363D]">
                  <td colSpan={3} className="p-8">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <CheckCircle2 className="h-9 w-9 text-[#22c55e]" aria-hidden />
                      <p className="text-sm font-extrabold text-[#15803d] dark:text-emerald-200">
                        لم يتم رصد أسئلة إشكالية بعد
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {hasHeatmapData && heatmap && (
        <section>
          <h2 className="mb-4 font-semibold">{t("admin.analytics.heatmap")}</h2>
          <div className={`overflow-x-auto ${adminCardPadded}`}>
            <div className="flex gap-1 min-w-max">
              <div className="w-32 shrink-0" />
              {heatmap.courses.map((c) => (
                <div key={c.id} className={`w-16 shrink-0 truncate text-center text-xs ${adminMuted}`}>
                  {(c.title as Record<string, string>)?.[lang]?.slice(0, 6) ?? "—"}
                </div>
              ))}
            </div>
            {heatmap.users.map((u) => (
              <div key={u.id} className="flex items-center gap-1 py-1">
                <div className="w-32 shrink-0 truncate text-xs">{u.name}</div>
                {heatmap.courses.map((c) => {
                  const cell = heatmap.cells.find(
                    (x) => x.userId === u.id && x.courseId === c.id
                  );
                  const pct = cell?.completionPct ?? 0;
                  const bg =
                    pct >= 100
                      ? "bg-emerald-600"
                      : pct >= 50
                        ? "bg-amber-600"
                        : pct > 0
                          ? "bg-orange-700"
                          : "bg-slate-200 dark:bg-stone-800";
                  return (
                    <div
                      key={c.id}
                      title={`${pct}%`}
                      className={`h-8 w-16 shrink-0 rounded ${bg}`}
                    />
                  );
                })}
              </div>
            ))}
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#E2E8F0] pt-3 text-xs font-semibold text-[#64748b] dark:border-[#30363D] dark:text-slate-400">
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-8 rounded bg-emerald-600" aria-hidden />
                مكتمل
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-8 rounded bg-slate-200 dark:bg-stone-800" aria-hidden />
                لم يبدأ
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
