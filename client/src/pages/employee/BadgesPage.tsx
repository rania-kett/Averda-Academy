import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { userApi } from "@/api/api";
import { Skeleton } from "@/components/employee/ui/Skeleton";
import { translatedEmployeeBadgeName } from "@/i18n/badgeName";

type EarnedRow = {
  earnedAt: string;
  badge: { id?: string; key: string; icon: string; title: unknown };
};

type AllBadge = {
  id: string;
  key: string;
  icon: string;
  title: unknown;
  earned: boolean;
};

function formatDDMMYYYY(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

type GroupKey = "learning" | "safety" | "engagement" | "advanced";

const GROUPS: { key: GroupKey; label: { ar: string; fr: string; en: string } }[] = [
  { key: "learning", label: { en: "Learning", fr: "Apprentissage", ar: "التعلّم" } },
  { key: "safety", label: { en: "Safety & PPE", fr: "Sécurité & EPI", ar: "السلامة وEPI" } },
  { key: "engagement", label: { en: "Engagement", fr: "Engagement", ar: "الالتزام" } },
  { key: "advanced", label: { en: "Advanced", fr: "Avancé", ar: "متقدم" } },
];

function groupForKey(key: string): GroupKey {
  if (key === "safety_starter" || key === "quiz_master" || key === "consistent_learner") return "learning";
  if (key === "fully_equipped" || key === "perfect_fit" || key === "safety_compliant" || key === "detail_oriented") return "safety";
  if (key === "active_user" || key === "quick_responder" || key === "challenge_trifecta") return "engagement";
  return "advanced";
}

function toneForKey(key: string): "green" | "blue" | "purple" | "yellow" | "orange" {
  if (key === "fully_equipped" || key === "perfect_fit" || key === "safety_compliant") return "green";
  if (key === "detail_oriented") return "orange";
  if (key === "safety_starter" || key === "quiz_master" || key === "consistent_learner") return "blue";
  if (key === "active_user") return "yellow";
  if (key === "quick_responder") return "orange";
  if (key === "challenge_trifecta") return "purple";
  return "purple";
}

function clsForTone(t: ReturnType<typeof toneForKey>) {
  // Unlocked cards are crisp white with a colored accent.
  if (t === "green") return "border-emerald-200 bg-white text-[#0F172A] dark:border-emerald-900/40 dark:bg-[#292524] dark:text-[#F5F5F4]";
  if (t === "blue") return "border-blue-200 bg-white text-[#0F172A] dark:border-blue-900/40 dark:bg-[#292524] dark:text-[#F5F5F4]";
  if (t === "yellow") return "border-amber-200 bg-white text-[#0F172A] dark:border-amber-900/40 dark:bg-[#292524] dark:text-[#F5F5F4]";
  if (t === "orange") return "border-orange-200 bg-white text-[#0F172A] dark:border-orange-900/40 dark:bg-[#292524] dark:text-[#F5F5F4]";
  return "border-purple-200 bg-white text-[#0F172A] dark:border-purple-900/40 dark:bg-[#292524] dark:text-[#F5F5F4]";
}

function accentForTone(t: ReturnType<typeof toneForKey>) {
  if (t === "green") return "bg-emerald-500";
  if (t === "blue") return "bg-blue-500";
  if (t === "yellow") return "bg-amber-500";
  if (t === "orange") return "bg-orange-500";
  return "bg-purple-500";
}

function iconRingForTone(t: ReturnType<typeof toneForKey>) {
  if (t === "green") return "ring-emerald-200 bg-emerald-50 text-emerald-700 dark:ring-emerald-900/40 dark:bg-emerald-500/10 dark:text-emerald-200";
  if (t === "blue") return "ring-blue-200 bg-blue-50 text-blue-700 dark:ring-blue-900/40 dark:bg-blue-500/10 dark:text-blue-200";
  if (t === "yellow") return "ring-amber-200 bg-amber-50 text-amber-800 dark:ring-amber-900/40 dark:bg-amber-500/10 dark:text-amber-200";
  if (t === "orange") return "ring-orange-200 bg-orange-50 text-orange-700 dark:ring-orange-900/40 dark:bg-orange-500/10 dark:text-orange-200";
  return "ring-purple-200 bg-purple-50 text-purple-700 dark:ring-purple-900/40 dark:bg-purple-500/10 dark:text-purple-200";
}

export function BadgesPage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  const [loading, setLoading] = useState(true);
  const [earned, setEarned] = useState<EarnedRow[]>([]);
  const [all, setAll] = useState<AllBadge[]>([]);

  useEffect(() => {
    let ok = true;
    void (async () => {
      try {
        const [meRes, allRes] = await Promise.all([userApi.me(), userApi.badges()]);
        if (!ok) return;
        const me = meRes.data as { user: { badges: EarnedRow[] } };
        const allPayload = allRes.data as { badges: AllBadge[] };
        setEarned(me.user.badges ?? []);
        setAll(allPayload.badges ?? []);
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  const earnedAtByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of earned) {
      m.set(e.badge.key, e.earnedAt);
    }
    return m;
  }, [earned]);

  const conditionText = (key: string) => {
    const cond: Record<string, { ar: string; fr: string; en: string }> = {
      safety_starter: { ar: "أكمل أول دورة", fr: "Terminer la première formation", en: "Complete your first course" },
      quiz_master: { ar: "احصل على 100% في اختبار", fr: "Obtenir 100% à un quiz", en: "Score 100% in a quiz" },
      consistent_learner: { ar: "أكمل 5 دورات", fr: "Terminer 5 formations", en: "Complete 5 courses" },
      fully_equipped: { ar: "كل EPI المطلوبة مستلمة", fr: "Tous les EPI requis sont reçus", en: "All required PPE received" },
      perfect_fit: { ar: "كل fit مؤكد", fr: "Fit confirmé pour tous les EPI", en: "Fit confirmed for all PPE" },
      safety_compliant: { ar: "لا يوجد EPI ناقص", fr: "Aucun équipement manquant", en: "No missing equipment" },
      detail_oriented: { ar: "أدخل كل المقاسات", fr: "Renseigner toutes les tailles", en: "Fill in all sizes" },
      active_user: { ar: "5 أيام تسجيل دخول متتالية", fr: "5 jours d’affilée", en: "5-day login streak" },
      quick_responder: { ar: "تأكيد خلال 24 ساعة", fr: "Confirmer sous 24h", en: "Confirm within 24h" },
      challenge_trifecta: { ar: "أكمل 3 تحديات", fr: "Terminer 3 défis", en: "Complete 3 challenges" },
      safety_champion: { ar: "امتثال 100% + كل الاختبارات ناجحة", fr: "100% conformité + quiz réussis", en: "100% compliance + all quizzes passed" },
      top_performer: { ar: "افتح كل الشارات", fr: "Débloquer tous les badges", en: "Unlock all badges" },
    };
    return (cond[key] ?? { ar: "واصل التقدم", fr: "Continuez", en: "Keep going" })[lang];
  };

  const grouped = useMemo(() => {
    const buckets = new Map<GroupKey, AllBadge[]>();
    for (const g of GROUPS) buckets.set(g.key, []);
    for (const b of all) buckets.get(groupForKey(b.key))!.push(b);
    for (const [k, arr] of buckets) {
      arr.sort((a, b) => a.key.localeCompare(b.key));
      buckets.set(k, arr);
    }
    return buckets;
  }, [all]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="truncate text-2xl font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
          {t("employee.badgesPage.title")}
        </h1>
      </div>

      {GROUPS.map((g) => {
        const rows = grouped.get(g.key) ?? [];
        if (!rows.length) return null;
        const earnedInGroup = rows.filter((b) => earnedAtByKey.has(b.key)).length;
        const totalInGroup = rows.length;
        return (
          <section key={g.key} className="space-y-3">
            <div className="rounded-2xl border border-[#E7E5E4] bg-white px-4 py-3 dark:border-[#44403C] dark:bg-[#292524]">
              <div className="flex items-center justify-between gap-3">
                <div className="border-s-4 border-averda ps-3 text-[15px] font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                  {g.label[lang]}
                </div>
                <div className="text-[12px] font-semibold text-[#1C1917]/60 dark:text-white/60" dir="ltr">
                  ({earnedInGroup}/{totalInGroup})
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {rows.map((b) => {
                const earnedAt = earnedAtByKey.get(b.key);
                const earnedNow = b.earned && !!earnedAt;
                const title = translatedEmployeeBadgeName(b, t, lang);
                const desc = (() => {
                  const m = (b as any).description as Record<string, string> | undefined;
                  return (m?.[lang] || m?.ar || m?.en || m?.fr || "").trim();
                })();
                const tone = toneForKey(b.key);
                return (
                  <div
                    key={b.id}
                    className={`relative overflow-hidden rounded-2xl border p-4 text-start shadow-sm ${
                      earnedNow
                        ? `${clsForTone(tone)} shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:shadow-none`
                        : "border-[#E7E5E4] bg-[#F5F5F4] text-[#44403C] opacity-50 shadow-none dark:border-[#44403C] dark:bg-[#1C1917] dark:text-stone-300"
                    }`}
                  >
                    {earnedNow ? (
                      <div
                        className="pointer-events-none absolute -inset-12 opacity-40 blur-2xl"
                        style={{ background: "radial-gradient(circle at 30% 20%, rgba(16,185,129,0.25), transparent 55%)" }}
                        aria-hidden
                      />
                    ) : null}
                    {earnedNow ? (
                      <div className={`absolute inset-x-0 top-0 h-1.5 ${accentForTone(tone)}`} aria-hidden />
                    ) : (
                      <div className="absolute inset-x-0 top-0 h-1.5 bg-[#D6D3D1] dark:bg-white/10" aria-hidden />
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${
                            earnedNow
                              ? iconRingForTone(tone)
                              : "bg-white text-[#78716C] ring-[#E7E5E4] dark:bg-white/5 dark:text-stone-300 dark:ring-white/10"
                          }`}
                          aria-hidden
                        >
                          <span className={`text-[24px] leading-none ${earnedNow ? "" : "grayscale"}`}>{b.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <div className={`text-[15px] font-extrabold leading-tight ${earnedNow ? "text-[#0F172A] dark:text-white" : ""}`} title={title}>
                            {title}
                          </div>
                          <div className={`mt-1 text-[12px] font-semibold leading-relaxed ${earnedNow ? "text-[#475569] dark:text-stone-300" : "text-[#78716C] dark:text-stone-400"}`}>
                            {desc || conditionText(b.key)}
                          </div>
                        </div>
                      </div>

                      {!earnedNow ? (
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[#E7E5E4] bg-white/70 text-[#78716C] backdrop-blur-[2px] dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
                          <Lock className="h-4 w-4" aria-hidden />
                        </span>
                      ) : null}
                    </div>
                    <div
                      className={`mt-3 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        earnedNow
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                          : "bg-black/5 text-[#78716C] dark:bg-white/10 dark:text-stone-300"
                      }`}
                      dir="ltr"
                    >
                      {(earnedNow ? t("employee.badgesPage.unlocked") : t("employee.badgesPage.locked"))} •{" "}
                      {earnedNow ? formatDDMMYYYY(earnedAt) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

