import { BarChart3, BookOpen, Clock, Medal, Shield, ClipboardCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  coursesCompleted: number;
  coursesTotal: number;
  tasksPending: number;
  timeSpentSecs: number;
  safetyScore: number;
  quizAvgPct: number;
  level: number;
  xp: number;
  xpNext: number;
};

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function fmtMinutes(secs: number): number {
  const s = Number.isFinite(secs) ? Math.max(0, Math.floor(secs)) : 0;
  return Math.max(0, Math.round(s / 60));
}

export function ProgressDashboard({
  coursesCompleted,
  coursesTotal,
  tasksPending,
  timeSpentSecs,
  safetyScore,
  quizAvgPct,
  level,
  xp,
  xpNext,
}: Partial<Props>) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const isRTL = lang === "ar";

  const done = Math.max(0, Math.floor(coursesCompleted ?? 0));
  const total = Math.max(0, Math.floor(coursesTotal ?? 0));
  const totalSafe = Math.max(total, 1);
  const formationPct = clampPct((done / totalSafe) * 100);

  const pending = Math.max(0, Math.floor(tasksPending ?? 0));
  const mins = fmtMinutes(timeSpentSecs ?? 0);

  const safety = Math.max(0, Math.floor(safetyScore ?? 0));
  const avg = Math.max(0, Math.min(100, Math.round((quizAvgPct ?? 0) * 10) / 10));

  const lvl = Math.max(1, Math.floor(level ?? 1));
  const xpVal = Math.max(0, Math.floor(xp ?? 0));
  const xpTarget = Math.max(1, Math.floor(xpNext ?? Math.max(1000, xpVal)));
  const xpPct = clampPct((xpVal / xpTarget) * 100);

  const cardBase =
    "rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5";
  const iconWrapBase =
    "grid h-10 w-10 shrink-0 place-items-center rounded-xl";

  const formationsValue =
    total > 0
      ? t("employee.dashboard.formations.value", { done, total })
      : t("employee.dashboard.formations.valueEmpty");

  const formationsHelper =
    done > 0
      ? t("employee.dashboard.formations.helper")
      : t("employee.dashboard.formations.helperZero");

  const tasksValue =
    pending > 0
      ? t("employee.dashboard.tasks.value", { n: pending })
      : t("employee.dashboard.tasks.valueZero");

  const tasksHelper =
    pending > 0
      ? t("employee.dashboard.tasks.helper")
      : t("employee.dashboard.tasks.helperZero");

  const timeValue =
    mins > 0
      ? t("employee.dashboard.time.value", { minutes: mins })
      : t("employee.dashboard.time.valueZero");

  const timeHelper =
    mins > 0
      ? t("employee.dashboard.time.helper")
      : t("employee.dashboard.time.helperZero");

  const safetyValue = String(safety);
  const safetyHelper =
    safety > 0
      ? t("employee.dashboard.safety.helper")
      : t("employee.dashboard.safety.helperZero");

  const avgValue = `${avg}%`;
  const avgHelper =
    avg > 0
      ? t("employee.dashboard.quizAvg.helper")
      : t("employee.dashboard.quizAvg.helperZero");

  const levelValue = t("employee.dashboard.level.value", { level: lvl, xp: xpVal });
  const levelHelper =
    xpVal > 0
      ? t("employee.dashboard.level.helper")
      : t("employee.dashboard.level.helperZero");

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {/* Row 1 — Progress overview */}
        <div className={cardBase}>
          <div className="flex items-start gap-3">
            <div className={`${iconWrapBase} bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200`} aria-hidden>
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-[#111827] dark:text-white">
                {t("employee.dashboard.formations.title")}
              </div>
              <div className="mt-1 text-[18px] font-extrabold tabular-nums text-[#111827] dark:text-white">
                {formationsValue}
              </div>
              <div className="mt-1 text-[12px] font-semibold text-[#6B7280] dark:text-slate-300">
                {formationsHelper}
              </div>
              <div className="mt-3 h-[6px] w-full overflow-hidden rounded-full bg-emerald-100/70 dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${formationPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex items-start gap-3">
            <div
              className={`${iconWrapBase} ${
                pending > 0
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                  : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
              }`}
              aria-hidden
            >
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-[#111827] dark:text-white">
                {t("employee.dashboard.tasks.title")}
              </div>
              <div className="mt-1 text-[18px] font-extrabold tabular-nums text-[#111827] dark:text-white">
                {tasksValue}
              </div>
              <div className="mt-1 text-[12px] font-semibold text-[#6B7280] dark:text-slate-300">
                {tasksHelper}
              </div>
            </div>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex items-start gap-3">
            <div className={`${iconWrapBase} bg-blue-100 text-[#1a3a6e] dark:bg-[#1a3a6e]/20 dark:text-white`} aria-hidden>
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-[#111827] dark:text-white">
                {t("employee.dashboard.time.title")}
              </div>
              <div className="mt-1 text-[18px] font-extrabold tabular-nums text-[#111827] dark:text-white">
                {timeValue}
              </div>
              <div className="mt-1 text-[12px] font-semibold text-[#6B7280] dark:text-slate-300">
                {timeHelper}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {/* Row 2 — Performance */}
        <div className={cardBase}>
          <div className="flex items-start gap-3">
            <div className={`${iconWrapBase} bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200`} aria-hidden>
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-[#111827] dark:text-white">
                {t("employee.dashboard.safety.title")}
              </div>
              <div className="mt-1 text-[18px] font-extrabold tabular-nums text-[#111827] dark:text-white">
                {safetyValue}
              </div>
              <div className="mt-1 text-[12px] font-semibold text-[#6B7280] dark:text-slate-300">
                {safetyHelper}
              </div>
            </div>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex items-start gap-3">
            <div className={`${iconWrapBase} bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200`} aria-hidden>
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-[#111827] dark:text-white">
                {t("employee.dashboard.quizAvg.title")}
              </div>
              <div className="mt-1 text-[18px] font-extrabold tabular-nums text-[#111827] dark:text-white">
                {avgValue}
              </div>
              <div className="mt-1 text-[12px] font-semibold text-[#6B7280] dark:text-slate-300">
                {avgHelper}
              </div>
            </div>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex items-start gap-3">
            <div className={`${iconWrapBase} bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200`} aria-hidden>
              <Medal className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-[#111827] dark:text-white">
                {t("employee.dashboard.level.title")}
              </div>
              <div className="mt-1 text-[18px] font-extrabold tabular-nums text-[#111827] dark:text-white">
                {levelValue}
              </div>
              <div className="mt-1 text-[12px] font-semibold text-[#6B7280] dark:text-slate-300">
                {levelHelper}
              </div>
              <div className="mt-3 h-[6px] w-full overflow-hidden rounded-full bg-amber-100/70 dark:bg-white/10">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

