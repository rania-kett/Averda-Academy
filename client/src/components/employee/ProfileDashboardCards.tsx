import { BarChart3, BookOpen, Clock, Medal, Lock } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { EpiPassportItem } from "@/api/api";
import { translatedEmployeeBadgeName } from "@/i18n/badgeName";
import { Card } from "@/components/employee/ui/primitives";

type SparkPoint = { v: number };

const LEARNING_TREND: SparkPoint[] = [
  { v: 40 },
  { v: 65 },
  { v: 50 },
  { v: 80 },
  { v: 70 },
  { v: 95 },
  { v: 1013 },
];
const SCORE_TREND: SparkPoint[] = [
  { v: 60 },
  { v: 72 },
  { v: 68 },
  { v: 85 },
  { v: 78 },
  { v: 88 },
  { v: 90 },
];
const COURSES_TREND: SparkPoint[] = [
  { v: 0 },
  { v: 1 },
  { v: 1 },
  { v: 2 },
  { v: 2 },
  { v: 3 },
  { v: 3 },
];

function sparkTrend(data: SparkPoint[]) {
  const first = data[0]?.v ?? 0;
  const last = data[data.length - 1]?.v ?? 0;
  if (last > first) return { arrow: "↑", color: "#16a34a" };
  if (last === first) return { arrow: "→", color: "#6b7280" };
  return { arrow: "↓", color: "#6b7280" };
}

function TrendArrow({ data }: { data: SparkPoint[] }) {
  const { arrow, color } = useMemo(() => sparkTrend(data), [data]);
  return (
    <span className="text-[18px] font-bold leading-none" style={{ color }} aria-hidden>
      {arrow}
    </span>
  );
}

function MiniSparkline({ data, stroke }: { data: SparkPoint[]; stroke: string }) {
  return (
    <div className="mt-2 h-[30px] w-full min-w-[80px]">
      <ResponsiveContainer width="100%" height={30}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type Props = {
  coursesCompleted: number;
  coursesTotal: number;
  quizAvgPct: number;
  timeSpentSecs: number;
  passportItems: EpiPassportItem[];
  badgeIcons: { icon: string; earned: boolean; key: string; title?: unknown }[];
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

export function ProfileDashboardCards({
  coursesCompleted,
  coursesTotal,
  quizAvgPct,
  timeSpentSecs,
  passportItems,
  badgeIcons,
  level,
  xp,
  xpNext,
}: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const isArabic = lang === "ar";

  const done = Math.max(0, Math.floor(coursesCompleted));
  const total = Math.max(0, Math.floor(coursesTotal));
  const formationPct = clampPct((done / Math.max(1, total)) * 100);

  const avg = Math.max(0, Math.min(100, Math.round((quizAvgPct ?? 0) * 10) / 10));
  const avgPct = clampPct(avg);

  const mins = fmtMinutes(timeSpentSecs);

  const lvl = Math.max(1, Math.floor(level));
  const xpVal = Math.max(0, Math.floor(xp));
  const xpTarget = Math.max(1, Math.floor(xpNext));
  const xpPct = clampPct((xpVal / xpTarget) * 100);

  void passportItems;

  const avgLabel = useMemo(() => {
    if (avgPct >= 70) return lang === "ar" ? "فوق المتوسط" : lang === "fr" ? "Au-dessus de la moyenne" : "Above average";
    return lang === "ar" ? "يحتاج تحسين" : lang === "fr" ? "À améliorer" : "Needs improvement";
  }, [avgPct, lang]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 lg:grid-cols-3">
        {/* 1) Formations complétées */}
        <Link to="/courses" className="block">
          <Card className="h-full cursor-pointer transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-lg active:scale-[0.99]">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-[#1a3a6e] dark:bg-[#1a3a6e]/20 dark:text-white" aria-hidden>
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-extrabold text-[#1C1917] dark:text-white">
                {t("employee.profileDash.formations.title")}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-[32px] font-extrabold tabular-nums leading-none text-[#1C1917] dark:text-white" dir="ltr">
                  {done}/{total}
                </div>
                <TrendArrow data={COURSES_TREND} />
              </div>
              <MiniSparkline data={COURSES_TREND} stroke="#2E6198" />
              <div className="mt-4 h-[8px] w-full overflow-hidden rounded-full bg-[#E7E5E4] dark:bg-[#44403C]">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    transformOrigin: isArabic ? "right" : "left",
                    transform: `scaleX(${formationPct / 100})`,
                    background: "#2E6198",
                  }}
                />
              </div>
            </div>
          </div>
          </Card>
        </Link>

        {/* 2) Moyenne aux quiz */}
        <Card className="h-full">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" aria-hidden>
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-extrabold text-[#1C1917] dark:text-white">
                {t("employee.profileDash.quizAvg.title")}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-[32px] font-extrabold tabular-nums leading-none text-[#1C1917] dark:text-white" dir="ltr">
                  {avg}%
                </div>
                <TrendArrow data={SCORE_TREND} />
              </div>
              <MiniSparkline data={SCORE_TREND} stroke="#2E6198" />
              <div className="mt-3 text-[13px] font-semibold text-[#1C1917]/60 dark:text-white/60">
                {avgLabel}
              </div>
              <div className="mt-3 h-[8px] w-full overflow-hidden rounded-full bg-[#E7E5E4] dark:bg-[#44403C]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${avgPct}%`,
                    background: "#2E6198",
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 3) Temps d'apprentissage */}
        <Card className="h-full">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200" aria-hidden>
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-extrabold text-[#1C1917] dark:text-white">
                {t("employee.profileDash.time.title")}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-[32px] font-extrabold tabular-nums leading-none text-[#1C1917] dark:text-white" dir="ltr">
                  {t("employee.profileDash.time.value", { minutes: mins })}
                </div>
                <TrendArrow data={LEARNING_TREND} />
              </div>
              <MiniSparkline data={LEARNING_TREND} stroke="#4f7cac" />
              <div className="mt-2 text-[13px] font-semibold text-[#1C1917]/60 dark:text-white/60">
                {t("employee.profileDash.time.hint")}
              </div>
            </div>
          </div>
        </Card>

        {/* 4) Niveau & Badges */}
        <Link to="/badges" className="block lg:col-span-2">
          <Card className="h-full cursor-pointer transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-lg active:scale-[0.99] lg:col-span-2">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-200" aria-hidden>
                <Medal className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-extrabold text-[#1C1917] dark:text-white">
                  {t("employee.profileDash.levelBadges.title")}
                </div>
                <div className="mt-1 text-[15px] font-extrabold tabular-nums text-[#1C1917] dark:text-white" dir="ltr">
                  {t("employee.profileDash.levelBadges.level", { level: lvl, xp: xpVal })}
                </div>
                <div className="mt-3 h-[10px] w-full overflow-hidden rounded-full bg-[#E7E5E4] dark:bg-[#44403C]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${xpPct}%`,
                      background: "linear-gradient(90deg, #F59E0B, #22C55E)",
                    }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {badgeIcons.slice(0, 8).map((b) => (
                    <div key={b.key} className={`relative text-center ${b.earned ? "" : "opacity-50"}`}>
                      <div
                        className={`relative mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-[#E7E5E4] bg-white text-[22px] shadow-sm dark:border-[#44403C] dark:bg-[#292524] ${
                          b.earned ? "ring-1 ring-emerald-500/20" : ""
                        }`}
                        aria-hidden
                        title={b.key}
                      >
                        {b.icon}
                        {!b.earned && (
                          <span className="absolute -bottom-1 -end-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white dark:bg-white/15">
                            <Lock className="h-3.5 w-3.5" aria-hidden />
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate text-[11px] font-semibold text-[#1C1917]/60 dark:text-white/60">
                        {b.earned
                          ? translatedEmployeeBadgeName({ key: b.key, title: b.title }, t, lang)
                          : t("employee.badgesPage.locked")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}

