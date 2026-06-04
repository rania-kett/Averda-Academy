import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import { Skeleton } from "@/components/employee/ui/Skeleton";
import { EmptyState } from "@/components/employee/ui/EmptyState";
import { Card, Pill } from "@/components/employee/ui/primitives";
import { userApi } from "@/api/api";
import { employeeBadgeNameKey } from "@/i18n/badgeName";

type Challenge = {
  id: string;
  group: "onboarding" | "operational" | "learning" | "performance" | "final";
  icon: string;
  title: Record<"ar" | "fr" | "en", string>;
  typeText: Record<"ar" | "fr" | "en", string>;
  details: Record<"ar" | "fr" | "en", string>;
  tasks: Record<"ar" | "fr" | "en", string[]>;
  impactBadges: string[];
  progressText: string;
  current: number;
  total: number;
  pct: number;
  done?: boolean;
};

export function ChallengesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  const [loading, setLoading] = useState(true);
  const [earnedKeys, setEarnedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    let ok = true;
    const load = async () => {
      try {
        const { data } = await userApi.badges();
        const rows = (data as { badges?: { key: string; earned: boolean }[] }).badges ?? [];
        const set = new Set(rows.filter((b) => b.earned).map((b) => b.key));
        if (ok) setEarnedKeys(set);
      } finally {
        if (ok) setLoading(false);
      }
    };
    void load();

    // Keep challenges responsive when user returns from a quiz.
    const onFocus = () => void load();
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      ok = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const challenges = useMemo<Challenge[]>(() => {
    const mission = (m: Omit<Challenge, "progressText" | "pct" | "done" | "current" | "total">) => {
      const total = m.impactBadges.length;
      const current = m.impactBadges.filter((k) => earnedKeys.has(k)).length;
      const isDone = total > 0 && current >= total;
      const progressText = `${isDone ? total : current}/${total}`;
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      return { ...m, current, total, progressText, pct, done: isDone } satisfies Challenge;
    };

    return [
      mission({
        id: "c1_onboarding_completion_sprint",
        group: "onboarding",
        icon: "🧩",
        title: {
          en: "Onboarding Completion Sprint",
          fr: "Sprint de complétion d’onboarding",
          ar: "سباق إكمال الاندماج",
        },
        typeText: { en: "Global onboarding mission", fr: "Mission d'intégration", ar: "مهمة اندماج" },
        tasks: {
          en: [
            "Complete profile setup",
            "Log in for first time + confirm account",
            "Read safety & company intro materials",
            "Acknowledge onboarding policy",
          ],
          fr: [
            "Compléter le profil",
            "Première connexion + confirmation du compte",
            "Lire les supports intro (sécurité + entreprise)",
            "Valider la politique d’onboarding",
          ],
          ar: ["إكمال إعداد الملف الشخصي", "أول تسجيل دخول + تأكيد الحساب", "قراءة مواد السلامة ومقدمة الشركة", "الإقرار بسياسة الاندماج"],
        },
        impactBadges: ["active_user", "consistent_learner", "safety_compliant"],
        details: {
          en: "A full first-week sprint: get set up, learn the basics, and validate the onboarding policy.",
          fr: "Sprint d’entrée : configuration, apprentissage des bases, et validation de la politique d’onboarding.",
          ar: "سباق الأسبوع الأول: إعداد الحساب، تعلم الأساسيات، والإقرار بسياسة الاندماج.",
        },
      }),
      mission({
        id: "c2_field_readiness_preparation",
        group: "operational",
        icon: "🦺",
        title: { en: "Field Readiness Preparation", fr: "Préparation à l’opérationnel", ar: "الجاهزية للميدان" },
        typeText: { en: "Operational readiness mission", fr: "Mission de préparation terrain", ar: "مهمة جاهزية" },
        tasks: {
          en: ["Verify all assigned PPE items", "Report missing or damaged equipment", "Confirm readiness checklist with supervisor/system"],
          fr: ["Vérifier tous les EPI attribués", "Signaler tout équipement manquant/endommagé", "Confirmer la checklist de préparation"],
          ar: ["التحقق من كل معدات الوقاية المخصصة", "الإبلاغ عن المعدات الناقصة/التالفة", "تأكيد قائمة الجاهزية مع النظام/المشرف"],
        },
        impactBadges: ["fully_equipped", "safety_compliant"],
        details: {
          en: "Be field-ready: your assigned PPE must be complete and compliant.",
          fr: "Prêt terrain : EPI complet et conformité assurée.",
          ar: "جاهزية ميدانية: معدات كاملة وامتثال.",
        },
      }),
      mission({
        id: "c3_equipment_verification_cycle",
        group: "operational",
        icon: "📦",
        title: { en: "Equipment Verification Cycle", fr: "Cycle de vérification EPI", ar: "دورة التحقق من المعدات" },
        typeText: { en: "Logistics validation loop", fr: "Validation logistique", ar: "تحقق لوجستي" },
        tasks: {
          en: ["Scan/confirm each received item", "Validate quantities vs assigned list", "Flag inconsistencies"],
          fr: ["Scanner/confirmer chaque élément reçu", "Valider les quantités vs liste attribuée", "Signaler les incohérences"],
          ar: ["تأكيد/مسح كل عنصر مستلم", "مطابقة الكميات مع القائمة", "الإبلاغ عن أي اختلافات"],
        },
        impactBadges: ["fully_equipped", "safety_compliant"],
        details: {
          en: "Traceability loop: make sure what you received matches what was assigned.",
          fr: "Traçabilité : vérifier que la dotation reçue correspond à l’attribution.",
          ar: "التتبّع: تأكد أن المستلم يطابق المخصص.",
        },
      }),
      mission({
        id: "c4_ppe_adaptation_validation_loop",
        group: "operational",
        icon: "📏",
        title: { en: "PPE Adaptation & Validation Loop", fr: "Boucle d’ajustement & validation", ar: "دورة الملاءمة والتحقق" },
        typeText: { en: "Safety usability mission", fr: "Mission d’usage sécurité", ar: "مهمة ملاءمة" },
        tasks: {
          en: ["Test PPE in real/simulated usage", "Confirm comfort and proper sizing", "Submit validation for each item"],
          fr: ["Tester les EPI en usage réel/simulé", "Confirmer confort et taille", "Soumettre une validation par item"],
          ar: ["اختبار معدات الوقاية في استخدام حقيقي/محاكى", "تأكيد الراحة والمقاس", "إرسال تحقق لكل عنصر"],
        },
        impactBadges: ["perfect_fit", "safety_compliant"],
        details: {
          en: "Make sure PPE is usable in real conditions and validated item-by-item.",
          fr: "Garantir que les EPI sont utilisables et validés pour chaque item.",
          ar: "تأكد من قابلية الاستخدام والتحقق لكل عنصر.",
        },
      }),
      mission({
        id: "c5_structured_learning_path_completion",
        group: "learning",
        icon: "📚",
        title: { en: "Structured Learning Path Completion", fr: "Parcours d’apprentissage structuré", ar: "إكمال مسار تعلّم منظّم" },
        typeText: { en: "Training mission", fr: "Mission formation", ar: "مهمة تدريب" },
        tasks: {
          en: ["Complete safety modules in sequence", "Pass quizzes per module", "Review incorrect answers"],
          fr: ["Compléter des modules sécurité en séquence", "Réussir les quiz", "Revoir les erreurs"],
          ar: ["إكمال وحدات السلامة بالتتابع", "اجتياز الاختبارات", "مراجعة الإجابات الخاطئة"],
        },
        impactBadges: ["consistent_learner", "quiz_master", "safety_champion"],
        details: {
          en: "Complete the mandatory learning path and keep improving with review.",
          fr: "Terminer le parcours obligatoire et progresser via la revue des erreurs.",
          ar: "أكمل المسار الإلزامي وتطوّر بمراجعة الأخطاء.",
        },
      }),
      mission({
        id: "c6_competency_validation_assessment",
        group: "learning",
        icon: "🧠",
        title: { en: "Competency Validation Assessment", fr: "Évaluation de compétence", ar: "تقييم الكفاءة" },
        typeText: { en: "Evaluation mission", fr: "Mission d’évaluation", ar: "مهمة تقييم" },
        tasks: {
          en: ["Final multi-topic assessment", "Practical scenario questions", "Minimum passing threshold required"],
          fr: ["Évaluation finale multi-thèmes", "Questions scénarios", "Seuil minimum requis"],
          ar: ["تقييم نهائي متعدد المواضيع", "أسئلة سيناريوهات عملية", "تحقيق حد أدنى للنجاح"],
        },
        impactBadges: ["quiz_master", "safety_champion"],
        details: {
          en: "Demonstrate true understanding with a high-stakes validation assessment.",
          fr: "Prouver la compréhension via une évaluation de validation.",
          ar: "أثبت الفهم عبر تقييم تحقّق.",
        },
      }),
      mission({
        id: "c7_operational_discipline_cycle",
        group: "performance",
        icon: "🔁",
        title: { en: "Operational Discipline Cycle", fr: "Cycle de discipline opérationnelle", ar: "دورة الانضباط التشغيلي" },
        typeText: { en: "Behavioral consistency mission", fr: "Mission de régularité", ar: "مهمة انتظام" },
        tasks: {
          en: ["Daily login for defined period", "Acknowledge tasks regularly", "Maintain interaction streak"],
          fr: ["Connexion quotidienne sur une période", "Accuser réception des tâches", "Maintenir une série d’interactions"],
          ar: ["تسجيل دخول يومي لفترة محددة", "تأكيد المهام بانتظام", "الحفاظ على سلسلة التفاعل"],
        },
        impactBadges: ["active_user", "quick_responder"],
        details: {
          en: "Build operational discipline with consistent daily interaction.",
          fr: "Renforcer la discipline via une interaction régulière.",
          ar: "ابنِ الانضباط عبر تفاعل يومي منتظم.",
        },
      }),
      mission({
        id: "c8_responsiveness_under_sla",
        group: "performance",
        icon: "⚡",
        title: { en: "Responsiveness Under SLA", fr: "Réactivité sous SLA", ar: "الاستجابة ضمن SLA" },
        typeText: { en: "Performance mission", fr: "Mission de performance", ar: "مهمة أداء" },
        tasks: {
          en: ["Respond to assigned tasks/notifications", "Confirm actions within 24h SLA", "Avoid delayed validations"],
          fr: ["Répondre aux tâches/notifications", "Confirmer sous 24h", "Éviter les retards"],
          ar: ["الاستجابة للمهام/الإشعارات", "تأكيد خلال 24 ساعة", "تجنب التأخيرات"],
        },
        impactBadges: ["quick_responder", "safety_compliant"],
        details: {
          en: "Stay responsive and close tasks quickly within defined SLA.",
          fr: "Rester réactif et clôturer rapidement selon le SLA.",
          ar: "كن سريع الاستجابة وأغلق المهام ضمن SLA.",
        },
      }),
      mission({
        id: "c9_end_to_end_compliance_closure",
        group: "final",
        icon: "🛡️",
        title: { en: "End-to-End Compliance Closure", fr: "Clôture conformité de bout en bout", ar: "إغلاق الامتثال الشامل" },
        typeText: { en: "Final integrity mission", fr: "Mission finale d’intégrité", ar: "مهمة نهائية" },
        tasks: {
          en: ["Verify all training completed", "Verify all PPE received + validated", "Confirm all acknowledgments done"],
          fr: ["Vérifier toutes les formations", "Vérifier EPI reçu + validé", "Confirmer tous les accusés"],
          ar: ["التحقق من إكمال التدريب", "التحقق من استلام/تحقق معدات الوقاية", "تأكيد كل الإقرارات"],
        },
        impactBadges: ["safety_champion", "safety_compliant", "fully_equipped", "quiz_master"],
        details: {
          en: "No gaps: training + PPE + acknowledgments all fully closed.",
          fr: "Zéro gap : formation + EPI + confirmations, tout clôturé.",
          ar: "بدون ثغرات: تدريب + معدات + إقرارات مكتملة.",
        },
      }),
    ];
  }, [earnedKeys]);

  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div className="space-y-7">
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!challenges.length) {
    return (
      <EmptyState
        title={t("common.noData")}
        description={t("employee.challenges.empty")}
        ctaLabel={t("nav.myTraining")}
        ctaTo="/courses"
      />
    );
  }

  return (
    <div className="space-y-7">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[26px] font-extrabold tracking-[-0.6px] leading-[1.15] text-[#1C1917] dark:text-[#F5F5F4] md:text-[28px]">
              {t("employee.challenges.title")}
            </div>
            <div className="mt-2 text-[15px] leading-[1.65] text-[#57534E] dark:text-stone-400">
              {t("employee.challenges.subtitle")}
            </div>
            <div className="mt-2 text-[14px] font-semibold leading-[1.6] text-[#1C1917]/60 dark:text-white/60">
              {lang === "ar"
                ? "التحديات هي أهداف بسيطة تساعدك على إكمال التدريب وتجميع الشارات خطوة بخطوة."
                : lang === "fr"
                  ? "Les défis sont des objectifs simples pour avancer et gagner des badges étape par étape."
                  : "Challenges are simple goals to help you progress and earn badges step-by-step."}
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-averda/10 text-averda">
            <Target className="h-6 w-6" aria-hidden />
          </div>
        </div>
      </Card>

      {(
        [
          { key: "onboarding" as const, title: t("employee.challenges.groups.onboarding") },
          { key: "operational" as const, title: t("employee.challenges.groups.operational") },
          { key: "learning" as const, title: t("employee.challenges.groups.learning") },
          { key: "performance" as const, title: t("employee.challenges.groups.performance") },
          { key: "final" as const, title: t("employee.challenges.groups.final") },
        ] as const
      ).map((g) => {
        const items = challenges.filter((c) => c.group === g.key);
        if (!items.length) return null;
        return (
          <section key={g.key} className="space-y-4">
            <div className="rounded-2xl border border-[#E7E5E4] bg-white px-4 py-3 dark:border-[#44403C] dark:bg-[#292524]">
              <div className="border-s-4 border-averda ps-3 text-[18px] font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                {g.title}
              </div>
            </div>
            {items.map((c) => {
              const expanded = !!open[c.id];
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl border bg-white shadow-sm md:shadow-[0_4px_16px_rgba(0,0,0,0.07)] dark:bg-[#292524] ${
                    c.done ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/15" : "border-[#E7E5E4] dark:border-[#44403C]"
                  }`}
                >
                  <button
                    type="button"
                    className={`flex w-full items-start justify-between gap-4 px-[18px] py-5 text-start transition-all duration-200 ease-out active:scale-[0.97] active:opacity-90 ${
                      c.done ? "hover:bg-emerald-100/60 dark:hover:bg-emerald-500/10" : "hover:bg-averda/10 dark:hover:bg-averda/20"
                    }`}
                    onClick={() => setOpen((m) => ({ ...m, [c.id]: !expanded }))}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                            c.done ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" : "bg-averda/10 text-averda"
                          }`}
                          aria-hidden
                        >
                          <span className="text-[18px] leading-none">{c.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-[16px] font-extrabold leading-[1.3] ${
                              c.done ? "text-emerald-900 dark:text-emerald-100" : "text-[#1C1917] dark:text-[#F5F5F4]"
                            }`}
                          >
                            {c.title[lang]}
                          </div>
                          <div className={`mt-1 text-[13px] font-semibold ${c.done ? "text-emerald-900/70 dark:text-emerald-100/70" : "text-[#1C1917]/60 dark:text-white/60"}`}>
                            {c.typeText[lang]}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-extrabold tabular-nums",
                            c.done
                              ? "bg-emerald-600 text-white"
                              : c.current > 0
                                ? "bg-amber-500 text-white"
                                : "bg-red-600 text-white",
                          ].join(" ")}
                          dir="ltr"
                        >
                          {c.progressText}
                        </span>
                        {c.done ? (
                          <Pill tone="success">{t("employee.challenges.status.completed")}</Pill>
                        ) : (
                          <Pill tone="neutral">{t("employee.challenges.status.inProgress")}</Pill>
                        )}
                        <Pill tone={c.done ? "success" : "neutral"}>
                          {t("employee.challenges.labels.badges")} • {c.impactBadges.length}
                        </Pill>
                      </div>

                      <div className={`mt-4 h-1 w-full overflow-hidden rounded-full ${c.done ? "bg-emerald-200/60 dark:bg-emerald-500/10" : "bg-[#E7E5E4] dark:bg-[#44403C]"}`}>
                        <div
                          className="h-full w-full rounded-full"
                          style={{
                            transformOrigin: lang === "ar" ? "right" : "left",
                            transform: `scaleX(${
                              (() => {
                                const p = Math.max(0, Math.min(100, c.pct));
                                if (p <= 0) return 0;
                                // Ensure tiny progress is still visible.
                                return Math.max(2, p) / 100;
                              })()
                            })`,
                            background: c.done ? "#10B981" : c.current > 0 ? "#F59E0B" : "#DC2626",
                            transition: "transform 600ms cubic-bezier(0.34, 1.2, 0.64, 1)",
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-1 shrink-0">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[13px] font-extrabold transition-all duration-200 ease-out ${
                          expanded
                            ? "border-black/10 bg-black/5 text-[#111827] dark:border-white/10 dark:bg-white/10 dark:text-white"
                            : "border-black/10 bg-white/70 text-[#111827] dark:border-white/10 dark:bg-white/5 dark:text-white"
                        }`}
                      >
                        <span>{lang === "ar" ? "التفاصيل" : lang === "fr" ? "Détails" : "Details"}</span>
                        {expanded ? <ChevronUp className="h-4.5 w-4.5" aria-hidden /> : <ChevronDown className="h-4.5 w-4.5" aria-hidden />}
                      </span>
                    </div>
                  </button>

                  {expanded && (
                    <div className={`px-[18px] pb-[18px] text-[15px] leading-[1.65] ${c.done ? "text-emerald-900/80 dark:text-emerald-100/80" : "text-[#57534E] dark:text-stone-300"}`}>
                      <div className={`inline-block rounded-lg px-3 py-2 ${c.done ? "bg-white/70 dark:bg-white/5" : "bg-[#F5F5F4] dark:bg-white/5"}`}>
                        {c.details[lang]}
                      </div>
                      <div className="mt-3">
                        <div className="text-[12px] font-extrabold uppercase tracking-wide text-[#78716C] dark:text-stone-400">
                          {t("employee.challenges.labels.tasks")}
                        </div>
                        <ul className="mt-2 space-y-1">
                          {c.tasks[lang].map((x) => (
                            <li key={x} className="text-[14px] leading-[1.6]">
                              - {x}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-3">
                        <div className="text-[12px] font-extrabold uppercase tracking-wide text-[#78716C] dark:text-stone-400">
                          {t("employee.challenges.labels.impact")}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {c.impactBadges.map((k) => {
                            const nameKey = employeeBadgeNameKey(k);
                            const label = t(nameKey);
                            return (
                              <Pill key={k} tone={earnedKeys.has(k) ? "success" : "neutral"}>
                                {label === nameKey ? k.replaceAll("_", " ") : label}
                              </Pill>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}

    </div>
  );
}

