import { useTranslation } from "react-i18next";

type Props = {
  onOpenBasics: () => void;
};

export function BasicsGateBanner({ onOpenBasics }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const isArabic = lang === "ar";

  return (
    <div
      className="rounded-2xl border border-[#E2E8F0] bg-white p-5"
      dir={isArabic ? "rtl" : "ltr"}
      style={{
        borderLeft: "4px solid #F59E0B",
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#FEF3C7]" aria-hidden>
            <span className="text-[20px]">📘</span>
          </div>
          <h2 className="min-w-0 flex-1 text-right text-[16px] font-semibold text-[#111827]">
            {t("employee.basicsGate.title")}
          </h2>
        </div>

        <p className="text-[14px] leading-[1.7] text-[#6B7280]">{t("employee.basicsGate.subtitle")}</p>

        <button
          type="button"
          onClick={onOpenBasics}
          className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[#F59E0B] text-[15px] font-semibold text-white transition hover:bg-[#D97706] active:scale-[0.99]"
        >
          {t("employee.basicsGate.cta")}
        </button>

        <p className="text-center text-[13px] font-medium text-[#F59E0B]">{t("employee.basicsGate.toast")}</p>
      </div>
    </div>
  );
}

