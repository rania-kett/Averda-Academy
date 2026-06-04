import { useTranslation } from "react-i18next";

type Props = {
  onStart: () => void;
};

const GOLD = "#F5A623";

export function AssessmentBanner({ onStart }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const isArabic = lang === "ar";

  return (
    <div
      className="overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm dark:border-amber-500/30 dark:from-amber-950/40 dark:to-[#2C2C2E]"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="text-3xl" aria-hidden>
            🎯
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-extrabold text-[#111827] dark:text-white">
              {t("employee.assessmentBanner.title")}
            </h2>
            <p className="mt-2 text-[16px] leading-[1.65] text-[#4B5563] dark:text-[#D1D5DB]">
              {t("employee.assessmentBanner.subtitle")}
            </p>
            <p className="mt-4 text-[14px] font-semibold text-[#92400E] dark:text-amber-200/90">
              {t("employee.assessmentBanner.requiredNote")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="inline-flex min-h-[56px] shrink-0 items-center justify-center gap-2 rounded-2xl px-5 text-[16px] font-bold text-[#111827] transition active:scale-[0.97] sm:self-center"
          style={{ backgroundColor: GOLD }}
        >
          {t("employee.assessmentBanner.startCta")}
          <span aria-hidden>{isArabic ? "←" : "→"}</span>
        </button>
      </div>
    </div>
  );
}
