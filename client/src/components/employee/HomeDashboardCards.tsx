import { Link } from "react-router-dom";
import { BookOpen, Lock, Star, PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, Pill } from "@/components/employee/ui/primitives";

export type HomeContinueCourse = {
  id: string;
  title: string;
  pct: number;
};

type Props = {
  coursesCompleted: number;
  coursesTotal: number;
  badgesCount: number;
  badgeIcons?: string[];
  level: number;
  continueCourse?: HomeContinueCourse | null;
  /** When the baseline assessment is not passed — show 0 progress and a lock affordance. */
  formationsLocked?: boolean;
};

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function HomeDashboardCards({
  coursesCompleted,
  coursesTotal,
  badgesCount,
  badgeIcons,
  level,
  continueCourse,
  formationsLocked = false,
}: Props) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.toLowerCase().startsWith("ar");

  const done = formationsLocked ? 0 : Math.max(0, Math.floor(coursesCompleted));
  const total = Math.max(0, Math.floor(coursesTotal));
  const remaining = Math.max(0, total - done);
  const pct = formationsLocked ? 0 : clampPct((done / Math.max(1, total)) * 100);

  const lvl = Math.max(1, Math.floor(level));
  const badges = Math.max(0, Math.floor(badgesCount));
  const icons = (badgeIcons ?? []).filter(Boolean).slice(0, 8);

  const cc = continueCourse?.id ? continueCourse : null;
  const ccPct = clampPct(Number(cc?.pct ?? 0));

  return (
    <div
      className={`grid items-stretch grid-cols-1 gap-[14px] md:grid-cols-2 ${
        cc ? "lg:grid-cols-3" : "lg:grid-cols-2"
      }`}
    >
      {/* 1) Formations */}
      <Link to="/courses" className="block">
        <Card className="cursor-pointer h-full flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-[#1a3a6e] dark:bg-[#1a3a6e]/20 dark:text-white" aria-hidden>
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[14px] font-extrabold text-[#1C1917] dark:text-white">
                  {formationsLocked ? (
                    <Lock className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  ) : null}
                  <span>{t("employee.homeDash.formations.title")}</span>
                </div>
                <div className="mt-2 text-[32px] font-extrabold tabular-nums leading-none text-[#1C1917] dark:text-white" dir="ltr">
                  {done}/{total}
                </div>
                <div className="mt-2 text-[13px] font-semibold text-[#1C1917]/60 dark:text-white/60">
                  {t("employee.homeDash.formations.hint", { n: remaining })}
                </div>
              </div>
            </div>
            <Pill tone="accent" className="shrink-0" title={t("employee.homeDash.formations.pill")}>
              {t("employee.homeDash.formations.pill")} ↗
            </Pill>
          </div>

          <div className="mt-auto pt-4">
            <div className="h-[8px] w-full overflow-hidden rounded-full bg-[#E7E5E4] dark:bg-[#44403C]">
              <div
                className="h-full w-full rounded-full"
                style={{
                  transformOrigin: isArabic ? "right" : "left",
                  transform: `scaleX(${pct / 100})`,
                  background: "#2E6198",
                }}
              />
            </div>
          </div>
        </Card>
      </Link>

      {/* Continue (only if an in-progress course exists) */}
      {cc && (
        <Link to={`/courses/${cc.id}`} className="block">
          <Card className="cursor-pointer h-full flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FFF0E6] text-[#EA580C] dark:bg-orange-500/20 dark:text-orange-300" aria-hidden>
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[14px] font-extrabold text-[#1C1917] dark:text-white">
                    <span>{t("employee.homeDash.continue.title")}</span>
                  </div>
                  <div
                    className={`mt-2 text-[32px] font-extrabold tabular-nums leading-none text-[#1C1917] dark:text-white${isArabic ? " text-end" : ""}`}
                    dir="ltr"
                  >
                    {Math.round(ccPct)}%
                  </div>
                  <div className="mt-2 text-[13px] font-semibold leading-snug text-[#1C1917]/60 dark:text-white/60">
                    {cc.title}
                  </div>
                </div>
              </div>
              <Pill tone="accent" className="shrink-0" title={t("employee.homeDash.formations.pill")}>
                {t("employee.homeDash.formations.pill")} ↗
              </Pill>
            </div>

            <div className="mt-auto pt-4">
              <div className="h-[8px] w-full overflow-hidden rounded-full bg-[#E7E5E4] dark:bg-[#44403C]">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    transformOrigin: isArabic ? "right" : "left",
                    transform: `scaleX(${ccPct / 100})`,
                    background: "#FB923C",
                  }}
                />
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* 2) Badges */}
      <Link to="/profile#badges" className="block">
        <Card className="cursor-pointer h-full flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-600/20 dark:text-emerald-200" aria-hidden>
                <Star className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-extrabold text-[#1C1917] dark:text-white">
                  {t("employee.homeDash.badges.title")}
                </div>
                <div className="mt-2 text-[32px] font-extrabold tabular-nums leading-none text-[#1C1917] dark:text-white">
                  {t("employee.homeDash.badges.value", { n: badges })}
                </div>
                <div className="mt-2 text-[13px] font-semibold text-[#1C1917]/60 dark:text-white/60">
                  {t("employee.homeDash.badges.hint")}
                </div>
              </div>
            </div>
            <Pill tone="success" className="shrink-0">{t("employee.homeDash.badges.pill", { level: lvl })}</Pill>
          </div>

          {/* Badge emojis row (visual fill + quick glance) */}
          {icons.length > 0 && (
            <div className="mt-auto pt-4 flex flex-wrap gap-2">
              {icons.map((ic, i) => (
                <span key={`${ic}-${i}`} className="group relative">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-xl border border-[#E7E5E4] bg-white text-[20px] transition-all duration-200 ease-out group-hover:-translate-y-[1px] group-hover:shadow-sm dark:border-[#44403C] dark:bg-[#292524]"
                    title={ic}
                    aria-hidden
                  >
                    {ic}
                  </span>
                  <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-[#111827] opacity-0 shadow-md transition-all duration-200 ease-out group-hover:opacity-100 dark:border-white/10 dark:bg-[#292524] dark:text-white">
                    {t("employee.homeDash.badges.title")}
                  </span>
                </span>
              ))}
            </div>
          )}
        </Card>
      </Link>
    </div>
  );
}

