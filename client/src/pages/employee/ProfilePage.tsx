import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { userApi, epiApi, type EpiCatalogItem, type EpiPassportItem, type EpiProfile } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { applyDocumentDirection } from "@/i18n/i18n";
import { RoleAvatar } from "@/components/employee/ui/RoleAvatar";
import { Card, Pill, PrimaryButton, SectionTitle } from "@/components/employee/ui/primitives";
import { ProfileDashboardCards } from "@/components/employee/ProfileDashboardCards";
import { EpiModal } from "@/components/employee/epi/EpiModal";
import { getCategoryDefByCode } from "@/config/categories";
import { translatedEmployeeBadgeName } from "@/i18n/badgeName";
import { buildEpiProgress } from "@/utils/epiProgress";
import { FOCUS_EPI_EVENT, type FocusEpiLocationState } from "@/utils/employeeEpiFocus";
import { CertificateButton } from "@/components/employee/CertificateButton";
import { displayEmployeeName } from "@/utils/displayEmployeeName";
import { resolveCertificateLocale } from "@/utils/certificateTemplate";

type MePayload = {
  user: {
    employeeId: string;
    name: string;
    role: "EMPLOYEE";
    category?: { id: string; code: string; name: { fr?: string; en?: string; ar?: string } } | null;
    language: "AR" | "FR" | "EN";
    avatarColor: string;
    badges: { earnedAt: string; badge: { key: string; icon: string; title: unknown } }[];
  };
  progress: {
    coursesCompleted: number;
    coursesTotal: number;
    avgQuizScore: number;
    totalTimeSpentSecs: number;
    overallCompletionPct?: number;
  };
};

type EpiSummary = {
  profileComplete: boolean;
  profile: EpiProfile | null;
  catalog?: EpiCatalogItem[];
  categoryDefaults?: {
    categoryId: string;
    itemCode: string;
    required: boolean;
    lifetimeDaysOverride: number | null;
    sortOrder: number;
  }[];
  passport: EpiPassportItem[];
};

function formatDDMMYYYY(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { state, logout, updateEmployeeUser } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [me, setMe] = useState<MePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState<"AR" | "FR" | "EN">("AR");
  const [epiOpen, setEpiOpen] = useState(false);
  const [epiSummary, setEpiSummary] = useState<EpiSummary | null>(null);
  const [epiLoading, setEpiLoading] = useState(false);

  void me;

  const loadEpiSummary = useCallback(async () => {
    if (state.kind !== "employee") return;
    setEpiLoading(true);
    try {
      const res = await epiApi.summary();
      setEpiSummary(res.data as EpiSummary);
    } catch {
      setEpiSummary(null);
    } finally {
      setEpiLoading(false);
    }
  }, [state.kind]);

  const runEpiFocus = useCallback(() => {
    void loadEpiSummary();
    setEpiOpen(true);
  }, [loadEpiSummary]);

  useEffect(() => {
    const onEvent = () => runEpiFocus();
    window.addEventListener(FOCUS_EPI_EVENT, onEvent);
    return () => window.removeEventListener(FOCUS_EPI_EVENT, onEvent);
  }, [runEpiFocus]);

  useEffect(() => {
    const navState = location.state as FocusEpiLocationState | null;
    if (!navState?.focusEpi || loading) return;
    const tId = window.setTimeout(() => {
      runEpiFocus();
      nav("/profile", { replace: true, state: null });
    }, 120);
    return () => window.clearTimeout(tId);
  }, [location.state, loading, runEpiFocus, nav]);

  useEffect(() => {
    let ok = true;
    void (async () => {
      try {
        const { data } = await userApi.me();
        if (!ok) return;
        const payload = data as MePayload;
        setMe(payload);
        setLanguage(payload.user.language);
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (state.kind !== "employee") {
      setEpiSummary(null);
      setEpiLoading(false);
      return;
    }
    void loadEpiSummary();
  }, [loading, state.kind, loadEpiSummary]);

  useEffect(() => {
    if (!epiOpen || loading || state.kind !== "employee") return;
    void loadEpiSummary();
  }, [epiOpen, loading, state.kind, loadEpiSummary]);

  const emp = state.kind === "employee" ? state.user : null;
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const employeeDisplayName = me ? displayEmployeeName(me.user.name, lang) : "";
  const categoryMeta = useMemo(() => getCategoryDefByCode(me?.user.category?.code), [me?.user.category?.code]);
  const badgeRows = useMemo(() => {
    const rows = me?.user.badges ?? [];
    return [...rows].sort(
      (a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
    );
  }, [me]);

  const saveLanguage = async () => {
    if (!emp || !me) return;
    setSaving(true);
    try {
      await userApi.updateMe({ language });
      const lng = language.toLowerCase();
      void i18n.changeLanguage(lng);
      applyDocumentDirection(lng);
      updateEmployeeUser({ language });
      setMe((m) => (m ? { ...m, user: { ...m.user, language } } : m));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !me) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-2xl bg-stone-200 dark:bg-white/5" />
        <div className="h-40 rounded-2xl bg-stone-200 dark:bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <EpiModal isOpen={epiOpen} onClose={() => setEpiOpen(false)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-2xl font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
            {t("employee.profile.title")}
          </h1>
        </div>
        <button
          type="button"
          className="h-[42px] rounded-[10px] border-[1.5px] border-[#dc2626] bg-white px-4 text-[15px] font-bold text-[#dc2626] transition active:scale-[0.96] active:opacity-90 hover:bg-red-50 dark:bg-transparent dark:hover:bg-red-500/10"
          onClick={() => {
            logout();
            nav("/login", { replace: true });
          }}
        >
          {t("employee.profile.logout")}
        </button>
      </div>

      {/* Hero */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <RoleAvatar
              categoryCode={me.user.category?.code ?? null}
              employeeId={me.user.employeeId}
              className="h-16 w-16 ring-1 ring-black/10 dark:ring-white/20"
              title={employeeDisplayName}
            />
            <div
              className={`min-w-0 flex-1 ${lang === "ar" ? "text-right" : "text-left"}`}
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              <div className="truncate text-[26px] font-extrabold tracking-[-0.6px] leading-[1.15] text-[#1C1917] dark:text-[#F5F5F4]">
                {employeeDisplayName}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {categoryMeta ? (
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-extrabold"
                    style={{ backgroundColor: categoryMeta.bgColor, color: categoryMeta.color }}
                  >
                    <categoryMeta.icon className="h-4 w-4" aria-hidden strokeWidth={2.4} />
                    <span>{categoryMeta.label[lang as "ar" | "fr" | "en"]}</span>
                  </span>
                ) : (
                  <Pill tone="accent">{t("employee.roleLabels.unknown")}</Pill>
                )}
                <Pill tone="neutral">
                  <span dir="ltr">{me.user.employeeId}</span>
                </Pill>
              </div>
              <div className="mt-3 text-[13px] font-medium text-[#1C1917]/60 dark:text-white/70">
                {t("employee.profile.language")}: {t(`langNames.${me.user.language}` as const)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6" id="formations">
          <ProfileDashboardCards
            coursesCompleted={me.progress.coursesCompleted ?? 0}
            coursesTotal={me.progress.coursesTotal ?? 0}
            quizAvgPct={me.progress.avgQuizScore ?? 0}
            timeSpentSecs={me.progress.totalTimeSpentSecs ?? 0}
            passportItems={epiSummary?.passport ?? []}
            badgeIcons={[
              ...(badgeRows.slice(0, 8).map((ub) => ({
                icon: ub.badge.icon,
                earned: true,
                key: ub.badge.key,
                title: ub.badge.title,
              })) ?? []),
              // placeholder locked slots
              ...Array.from({ length: Math.max(0, 8 - Math.min(8, badgeRows.length)) }).map((_, i) => ({
                icon: "🏅",
                earned: false,
                key: `locked-${i}`,
              })),
            ]}
            level={Math.max(1, Math.floor((badgeRows.length || 0) / 3) + 1)}
            xp={1000}
            xpNext={2000}
          />
        </div>
      </Card>

      {/* Achievements / Certificate */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF8E1] text-[22px]" aria-hidden>
              🏆
            </div>
            <div className="min-w-0">
              <div className="truncate text-[16px] font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                {t("employee.profile.achievementsTitle")}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-[#57534E] dark:text-stone-400">
                {t("employee.profile.achievementsSubtitle")}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <CertificateButton
            allCoursesCompleted={(me.progress.coursesTotal ?? 0) > 0 && (me.progress.coursesCompleted ?? 0) >= (me.progress.coursesTotal ?? 0)}
            avgScore={me.progress.avgQuizScore ?? 0}
            employee={{
              name: employeeDisplayName,
              role: categoryMeta?.label[lang as "ar" | "fr" | "en"] ?? "—",
              completionDate: new Date().toISOString(),
              locale: resolveCertificateLocale(language),
            }}
          />
        </div>
      </Card>

      <Card id="employee-epi-section">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-averda/10 text-[22px]" aria-hidden>
              🦺
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-[16px] font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                  {t("employee.epi.title")}
                </div>
              </div>
              <div className="mt-1 text-[13px] font-semibold text-[#57534E] dark:text-stone-400">
                {t("employee.epi.subtitle")}
              </div>
            </div>
          </div>
        </div>

        {(() => {
          const { counts } = buildEpiProgress(epiSummary);
          const { received, pending, needs, total, pct } = counts;

          return (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[13px] font-extrabold text-[#1C1917] dark:text-white">
                    {epiLoading ? t("common.loading") : t("employee.epi.receipt.progress", { received, total })}
                  </div>
                  <div className="mt-2 h-[8px] w-full overflow-hidden rounded-full bg-[#E7E5E4] dark:bg-[#44403C]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #1a3a6e, #2E6198)",
                        transition: "width 500ms ease",
                      }}
                    />
                  </div>
                </div>

                <div
                  className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#1a3a6e ${pct * 3.6}deg, var(--epi-ring-track, rgba(0,0,0,0.08)) 0deg)`,
                  }}
                  aria-hidden
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-[14px] font-extrabold tabular-nums text-[#1C1917] dark:bg-[#292524] dark:text-white">
                    {pct}%
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-extrabold text-white">
                  ✓
                  {t("employee.epi.kpis.received", { n: received })}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-[13px] font-extrabold text-white">
                  ⏳
                  {t("employee.epi.kpis.pending", { n: pending })}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-[13px] font-extrabold text-white">
                  ✗
                  {t("employee.epi.kpis.needs", { n: needs })}
                </span>
              </div>

              <div className="mt-4">
                <PrimaryButton
                  type="button"
                  onClick={() => setEpiOpen(true)}
                  className="w-full bg-[#1a3a6e] hover:bg-[#163056] active:bg-[#12284b]"
                >
                  {t("employee.epi.manageCta")}
                </PrimaryButton>
              </div>
            </div>
          );
        })()}
      </Card>

      {/* Settings */}
      <Card>
        <SectionTitle>{t("common.settings")}</SectionTitle>
        <div className="mt-4 grid gap-3">
          <div>
            <label className="text-[13px] font-medium text-[#57534E] dark:text-stone-400">
              {t("employee.profile.langLabel")}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "AR" | "FR" | "EN")}
              className="mt-2 h-[54px] w-full rounded-[14px] border border-[#E7E5E4] bg-white px-4 text-[16px] font-semibold text-[#1C1917] outline-none focus:ring-2 focus:ring-averda/25 dark:border-[#44403C] dark:bg-[#292524] dark:text-[#F5F5F4]"
            >
              <option value="AR">{t("langNames.AR")}</option>
              <option value="FR">{t("langNames.FR")}</option>
              <option value="EN">{t("langNames.EN")}</option>
            </select>
          </div>
          <PrimaryButton
            type="button"
            disabled={saving}
            onClick={() => void saveLanguage()}
            className="w-full bg-[#1a3a6e] hover:bg-[#163056] active:bg-[#12284b]"
          >
            {saving ? t("common.loading") : t("employee.profile.saveLang")}
          </PrimaryButton>
        </div>
      </Card>

      <Card>
        <SectionTitle
          right={
            <Link
              to="/badges"
              className="see-all-link inline-flex min-h-[44px] items-center rounded-xl px-3 text-[14px] transition hover:bg-averda/10 active:scale-[0.97] dark:hover:bg-white/10"
            >
              {t("employee.seeAll")}
            </Link>
          }
        >
          <span id="badges">{t("employee.profile.badgesTitle")}</span>
        </SectionTitle>
        {badgeRows.length ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {badgeRows.map((ub) => (
              <div
                key={`${ub.badge.key}-${ub.earnedAt}`}
                className="relative overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white p-4 text-center shadow-sm ring-1 ring-emerald-500/10 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md dark:border-[#44403C] dark:bg-[#292524] dark:ring-emerald-400/10"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center text-[38px] leading-none" aria-hidden>
                  {ub.badge.icon}
                </div>
                <div className="mt-2 line-clamp-2 text-[13px] font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                  {translatedEmployeeBadgeName(ub.badge, t, lang)}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-[#1C1917]/60 dark:text-white/60" dir="ltr">
                  {formatDDMMYYYY(ub.earnedAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[15px] leading-[1.65] text-[#57534E] dark:text-stone-400">
            {t("employee.profile.noBadges")}
          </p>
        )}
      </Card>
    </div>
  );
}

