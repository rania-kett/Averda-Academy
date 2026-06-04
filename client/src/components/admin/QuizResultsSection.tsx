import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/api/api";
import { adminCardPadded, adminMuted } from "@/components/admin/adminClasses";
import { BookOpen, CheckCircle2, Layers, Shield } from "lucide-react";
import { RoleAvatar, roleAvatarKindFromCategoryCode } from "@/components/employee/ui/RoleAvatar";

export function QuizResultsSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const isArabic = lang === "ar";

  const [summary, setSummary] = useState<{
    avgAssessmentPercent: number;
    assessmentPassRatePercent: number;
    avgRoadSafetyLessonPercent: number;
    totalLessonQuizAttempts: number;
  } | null>(null);
  const [assessmentRows, setAssessmentRows] = useState<
    {
      id: string;
      employeeId: string;
      name: string;
      category: { code: string; name: unknown } | null;
      percentage: number;
      status: string;
      takenAt: string | null;
    }[]
  >([]);
  const [lessonRows, setLessonRows] = useState<
    {
      id: string;
      employeeName: string;
      courseTitle: unknown;
      attemptNumber: number;
      score: number;
      total: number;
      percentage: number;
      bestPercentage: number;
      takenAt: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [aPage, setAPage] = useState(1);
  const [lPage, setLPage] = useState(1);
  const [aTotal, setATotal] = useState(0);
  const [lTotal, setLTotal] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    void (async () => {
      try {
        const [s, a, l] = await Promise.all([
          adminApi.quizResultsSummary(),
          adminApi.quizResultsAssessment({ page: String(aPage) }),
          adminApi.quizResultsLessons({ page: String(lPage) }),
        ]);
        setSummary(s.data as typeof summary);
        const ad = a.data as {
          results: typeof assessmentRows;
          total: number;
        };
        setAssessmentRows(ad.results);
        setATotal(ad.total);
        const ld = l.data as { attempts: typeof lessonRows; total: number };
        setLessonRows(ld.attempts);
        setLTotal(ld.total);
      } finally {
        setLoading(false);
      }
    })();
  }, [aPage, lPage]);

  const aTotalPages = Math.max(1, Math.ceil(aTotal / PAGE_SIZE));
  const lTotalPages = Math.max(1, Math.ceil(lTotal / PAGE_SIZE));

  if (loading || !summary) {
    return (
      <div className={`${adminCardPadded} animate-pulse`}>
        <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  const catName = (name: unknown) => {
    const o = name as Record<string, string> | undefined;
    return o?.[lang] || o?.en || "—";
  };

  const courseTitle = (title: unknown) => {
    const o = title as Record<string, string> | undefined;
    return o?.[lang] || o?.en || "—";
  };

  const StatCard = ({
    label,
    value,
    Icon,
    iconBg,
  }: {
    label: string;
    value: string;
    Icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
  }) => (
    <div className={adminCardPadded + " p-[16px]"}>
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconBg}`} aria-hidden>
        <Icon className="h-5 w-5" />
      </div>
      <div className={`mt-3 text-[12px] font-semibold ${adminMuted}`}>{label}</div>
      <div className="mt-1 text-[24px] font-extrabold tabular-nums text-averda dark:text-white">{value}</div>
    </div>
  );

  const ProgressPct = ({ pct }: { pct: number }) => (
    <div className="flex items-center gap-3">
      <div className="min-w-[44px] text-[13px] font-extrabold tabular-nums text-[#111827] dark:text-white" dir="ltr">
        {pct}%
      </div>
      <div className="h-2 w-[120px] overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#30363D]">
        <div className="h-full rounded-full bg-averda" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );

  return (
    <section className="space-y-6 text-start" dir={isArabic ? "rtl" : "ltr"}>
      <h2 className="text-xl font-extrabold text-[#0F172A] dark:text-slate-100">{t("admin.quizResults.sectionTitle")}</h2>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("admin.quizResults.avgAssessment")}
          value={`${summary.avgAssessmentPercent}%`}
          Icon={Shield}
          iconBg="bg-[#DBEAFE] text-averda dark:bg-white/10 dark:text-white"
        />
        <StatCard
          label={t("admin.quizResults.assessmentPassRate")}
          value={`${summary.assessmentPassRatePercent}%`}
          Icon={CheckCircle2}
          iconBg="bg-[#D1FAE5] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
        />
        <StatCard
          label={t("admin.quizResults.avgLessonQuizzes")}
          value={`${summary.avgRoadSafetyLessonPercent}%`}
          Icon={BookOpen}
          iconBg="bg-[#EDE9FE] text-purple-700 dark:bg-purple-500/15 dark:text-purple-200"
        />
        <StatCard
          label={t("admin.quizResults.totalLessonAttempts")}
          value={String(summary.totalLessonQuizAttempts)}
          Icon={Layers}
          iconBg="bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
        />
      </div>

      <div className={adminCardPadded}>
        <h3 className="mb-3 text-[16px] font-semibold text-[#0F172A] dark:text-slate-100">
          {t("admin.quizResults.assessmentTableTitle")}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] text-start text-[12px] font-semibold uppercase tracking-wide text-[#6B7280] dark:bg-white/5 dark:text-slate-400">
                <th className="px-4 py-3">{t("admin.quizResults.colEmployee")}</th>
                <th className="px-4 py-3">{t("admin.quizResults.colGroup")}</th>
                <th className="px-4 py-3">{t("admin.quizResults.colPercent")}</th>
                <th className="px-4 py-3">{t("admin.quizResults.colStatus")}</th>
                <th className="px-4 py-3">{t("admin.quizResults.colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {assessmentRows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#F3F4F6] bg-white hover:bg-[#F9FAFB] dark:border-[#30363D] dark:bg-[#161B22] dark:hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <RoleAvatar
                        kind={roleAvatarKindFromCategoryCode(r.category?.code, r.employeeId)}
                        className="h-9 w-9"
                        title={r.name}
                        employeeId={r.employeeId}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-extrabold text-[#111827] dark:text-white">{r.name}</div>
                        <div className="text-[12px] font-semibold text-[#6B7280] dark:text-slate-400" dir="ltr">
                          {r.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-[#111827] dark:text-white">
                    {r.category ? catName(r.category.name) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ProgressPct pct={r.percentage} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex h-[30px] items-center rounded-full px-3 text-[12px] font-extrabold ${
                        r.percentage >= 70
                          ? "bg-[#D1FAE5] text-[#065F46] dark:bg-emerald-600/20 dark:text-emerald-200"
                          : "bg-[#FEE2E2] text-[#991B1B] dark:bg-red-600/20 dark:text-red-200"
                      }`}
                    >
                      {r.percentage >= 70 ? t("admin.quizResults.pass") : t("admin.quizResults.fail")}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[13px] font-semibold text-[#6B7280] dark:text-slate-400">
                    {r.takenAt?.slice(0, 10) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            disabled={aPage <= 1}
            className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 font-extrabold text-[#111827] disabled:opacity-40 dark:border-[#30363D] dark:bg-[#161B22] dark:text-white"
            onClick={() => setAPage((p) => Math.max(1, p - 1))}
          >
            {t("common.pagination.prev")}
          </button>
          <span className={adminMuted}>
            {t("common.pagination.pageOf", { current: aPage, total: aTotalPages })}
          </span>
          <button
            type="button"
            disabled={aPage >= aTotalPages}
            className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 font-extrabold text-[#111827] disabled:opacity-40 dark:border-[#30363D] dark:bg-[#161B22] dark:text-white"
            onClick={() => setAPage((p) => p + 1)}
          >
            {t("common.pagination.next")}
          </button>
        </div>
      </div>

      <div className={adminCardPadded}>
        <h3 className="mb-3 font-semibold text-[#0F172A] dark:text-slate-100">
          {t("admin.quizResults.lessonAttemptsTitle")}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] text-start text-[12px] font-semibold uppercase tracking-wide text-[#6B7280] dark:bg-white/5 dark:text-slate-400">
                <th className="px-4 py-3">{t("admin.quizResults.colEmployee")}</th>
                <th className="px-4 py-3">{t("admin.quizResults.colCourse")}</th>
                <th className="px-4 py-3">{t("admin.quizResults.colAttempt")}</th>
                <th className="px-4 py-3">{t("admin.quizResults.colScore")}</th>
                <th className="px-4 py-3">{t("admin.quizResults.colPercent")}</th>
                <th className="px-4 py-3">{t("admin.quizResults.colBest")}</th>
                <th className="px-4 py-3">{t("admin.quizResults.colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {lessonRows.map((r) => (
                <tr key={r.id} className="border-b border-[#F3F4F6] bg-white hover:bg-[#F9FAFB] dark:border-[#30363D] dark:bg-[#161B22] dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-[13px] font-extrabold text-[#111827] dark:text-white">{r.employeeName}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-[#111827] dark:text-white">{courseTitle(r.courseTitle)}</td>
                  <td className="px-4 py-3 tabular-nums text-[13px] font-extrabold text-[#111827] dark:text-white">{r.attemptNumber}</td>
                  <td className="px-4 py-3 tabular-nums text-[13px] font-semibold text-[#111827] dark:text-white">
                    {r.score}/{r.total}
                  </td>
                  <td className="px-4 py-3">
                    <ProgressPct pct={r.percentage} />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[13px] font-extrabold text-averda dark:text-white">{r.bestPercentage}%</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[13px] font-semibold text-[#6B7280] dark:text-slate-400">
                    {r.takenAt.slice(0, 19).replace("T", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            disabled={lPage <= 1}
            className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 font-extrabold text-[#111827] disabled:opacity-40 dark:border-[#30363D] dark:bg-[#161B22] dark:text-white"
            onClick={() => setLPage((p) => Math.max(1, p - 1))}
          >
            {t("common.pagination.prev")}
          </button>
          <span className={adminMuted}>
            {t("common.pagination.pageOf", { current: lPage, total: lTotalPages })}
          </span>
          <button
            type="button"
            disabled={lPage >= lTotalPages}
            className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 font-extrabold text-[#111827] disabled:opacity-40 dark:border-[#30363D] dark:bg-[#161B22] dark:text-white"
            onClick={() => setLPage((p) => p + 1)}
          >
            {t("common.pagination.next")}
          </button>
        </div>
      </div>
    </section>
  );
}
