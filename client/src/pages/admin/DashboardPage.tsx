import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import type { TooltipProps } from "recharts";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { adminCardPadded, adminMuted } from "@/components/admin/adminClasses";
import { useTheme } from "@/context/ThemeContext";

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chartTick = isDark ? "#94a3b8" : "#64748b";
  const chartLabel = isDark ? "#f1f5f9" : "#0f172a";
  const toast = useToast();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  const [data, setData] = useState<{
    stats: {
      activeEmployees: number;
      newThisMonth: number;
      completionsWeek: number;
      avgQuizScore: number;
      atRiskCount: number;
    };
    recentActivity: { id: string; employeeName: string; courseTitle: unknown; score: number; attemptedAt: string }[];
    completionByCourse: { title: unknown; rate: number }[];
    topScores: { score: number; name: string; employeeId: string }[];
  } | null>(null);
  const [courseScores, setCourseScores] = useState<
    { title: unknown; avgScore: number; courseId: string; attemptCount?: number }[]
  >([]);
  const [atRisk, setAtRisk] = useState<
    { userId: string; user?: { name: string; employeeId: string } }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [d, cs, ar] = await Promise.all([
          adminApi.stats(),
          adminApi.analyticsCourseScores(),
          adminApi.analyticsAtRisk(),
        ]);
        setData(d.data as typeof data);
        setCourseScores((cs.data as { courses: typeof courseScores }).courses);
        setAtRisk((ar.data as { atRisk: typeof atRisk }).atRisk);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const barData = courseScores.map((c) => {
    const fullTitle =
      ((c.title as Record<string, string>)?.[lang] ||
        (c.title as Record<string, string>)?.en ||
        "—")!;
    return {
      name: fullTitle,
      fullName: fullTitle,
      score: c.avgScore,
    };
  });

  const formatScorePct = (v: number) =>
    Number.isInteger(v) ? `${v}%` : `${Number(v).toFixed(1)}%`;

  const CourseBarTooltip = ({
    active,
    payload,
  }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload as { fullName: string; score: number };
    return (
      <div
        className="rounded-lg border px-3 py-2 text-sm shadow-lg"
        style={{
          backgroundColor: isDark ? "#161B22" : "#ffffff",
          borderColor: isDark ? "#30363d" : "#e2e8f0",
          color: chartLabel,
        }}
      >
        <p className="font-semibold leading-snug">{row.fullName}</p>
        <p className="mt-1 text-xs opacity-95">
          {t("admin.dash.tooltipAvgScore")}:{" "}
          <span className="font-semibold tabular-nums">{formatScorePct(row.score)}</span>
        </p>
      </div>
    );
  };

  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-[#161B22]" />
        ))}
      </div>
    );
  }

  const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#14B8A6"];

  return (
    <div className="space-y-8 text-start text-[#0F172A] dark:text-slate-100">
      <h1 className="text-2xl font-bold text-[#0F172A] dark:text-slate-100">{t("admin.dash.title")}</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { k: t("admin.dash.activeEmp"), v: data.stats.activeEmployees, sub: t("admin.dash.newMonth", { n: data.stats.newThisMonth }) },
          { k: t("admin.dash.completedWeek"), v: data.stats.completionsWeek, sub: "" },
          { k: t("admin.dash.avgScore"), v: `${data.stats.avgQuizScore}%`, sub: "" },
          { k: t("admin.dash.atRisk"), v: data.stats.atRiskCount, sub: "" },
        ].map((s, i) => (
          <motion.div
            key={s.k}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={adminCardPadded}
          >
            <p className={`text-sm ${adminMuted}`}>{s.k}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-[#0F172A] dark:text-slate-100">{s.v}</p>
            {s.sub && <p className="mt-1 text-xs text-emerald-600 dark:text-accent-emerald">{s.sub}</p>}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={adminCardPadded}>
          <h2 className="mb-4 text-start font-semibold text-[#0F172A] dark:text-slate-100">{t("admin.dash.recent")}</h2>
          <ul className="space-y-3 text-sm">
            {data.recentActivity.slice(0, 10).map((a) => (
              <li
                key={a.id}
                className="flex justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-600/50"
              >
                <span className="text-start">
                  {a.employeeName} — {(a.courseTitle as { en?: string })?.en ?? "Course"}
                </span>
                <span className="tabular-nums text-emerald-600 dark:text-accent-emerald">{a.score}%</span>
              </li>
            ))}
            {!data.recentActivity.length && (
              <li className={adminMuted}>{t("common.noData")}</li>
            )}
          </ul>
        </div>
        <div className={adminCardPadded}>
          <h2 className="mb-4 text-start font-semibold text-[#0F172A] dark:text-slate-100">{t("admin.dash.completionDonut")}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.completionByCourse.map((c, i) => ({
                    name: (c.title as { en?: string })?.en ?? `C${i}`,
                    value: c.rate,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.completionByCourse.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={adminCardPadded}>
        <h2 className="mb-2 text-start font-semibold text-[#0F172A] dark:text-slate-100">{t("admin.analytics.avgByCourse")}</h2>
        <p className={`mb-4 text-xs ${adminMuted}`}>{t("admin.dash.chartLegendHint")}</p>
        {courseScores.length === 0 ? (
          <div
            className={`flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-slate-200 px-4 py-12 text-center text-sm leading-relaxed dark:border-slate-600 ${adminMuted}`}
          >
            {t("admin.dash.noQuizDataYet")}
          </div>
        ) : (
          <div className="h-96 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 28, right: 12, left: 4, bottom: 88 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTick} opacity={0.5} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartTick, fontSize: 10 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={86}
                  tickFormatter={(v: string) =>
                    v.length > 28 ? `${v.slice(0, 26)}…` : v
                  }
                />
                <YAxis
                  tick={{ fill: chartTick }}
                  domain={[0, 100]}
                  label={{
                    value: t("admin.dash.axisScore"),
                    angle: -90,
                    position: "insideLeft",
                    fill: chartLabel,
                  }}
                />
                <Tooltip
                  cursor={{ fill: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.12)" }}
                  content={CourseBarTooltip}
                />
                <Bar
                  dataKey="score"
                  fill="#6366F1"
                  name={t("admin.dash.avgQuizLabel")}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={56}
                >
                  <LabelList
                    dataKey="score"
                    position="top"
                    fill={chartLabel}
                    fontSize={11}
                    fontWeight={600}
                    formatter={(v: number) => formatScorePct(v)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={adminCardPadded}>
          <h2 className="mb-4 text-start font-semibold text-[#0F172A] dark:text-slate-100">{t("admin.dash.atRiskTable")}</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b border-slate-200 bg-slate-50 text-start ${adminMuted} dark:border-slate-600 dark:bg-slate-900/40`}>
                  <th className="px-3 py-2 font-medium">{t("admin.employees.colName")}</th>
                  <th className="px-3 py-2 font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.slice(0, 10).map((row) => (
                  <tr key={row.userId} className="border-t border-slate-200 dark:border-slate-600">
                    <td className="px-3 py-3 text-start text-[#0F172A] dark:text-slate-100">
                      {row.user?.name ?? "—"}{" "}
                      <span className={adminMuted}>({row.user?.employeeId})</span>
                    </td>
                    <td className="px-3 py-3 text-start">
                      <button
                        type="button"
                        className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 transition hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30"
                        onClick={() => toast(t("common.featureComingSoon"), "info")}
                      >
                        {t("common.sendReminder")}
                      </button>
                    </td>
                  </tr>
                ))}
                {!atRisk.length && (
                  <tr>
                    <td colSpan={2} className={`py-4 text-start ${adminMuted}`}>
                      {t("common.noData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className={adminCardPadded}>
          <h2 className="mb-4 text-start font-semibold text-[#0F172A] dark:text-slate-100">{t("admin.dash.topPerformers")}</h2>
          <ul className="space-y-2 text-sm">
            {data.topScores.map((s, i) => (
              <li key={i} className="flex justify-between gap-2 text-start">
                <span>
                  {s.name} ({s.employeeId})
                </span>
                <span className="text-emerald-600 tabular-nums dark:text-accent-emerald">{s.score}%</span>
              </li>
            ))}
            {!data.topScores.length && <li className={adminMuted}>{t("common.noData")}</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
