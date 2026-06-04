import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { applyDocumentDirection } from "@/i18n/i18n";

type LangOpt = { key: "ar" | "fr" | "en"; label: string };

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith("ar")
    ? "ar"
    : i18n.language.startsWith("fr")
      ? "fr"
      : "en";

  const opts: LangOpt[] = useMemo(
    () => [
      { key: "ar", label: "AR" },
      { key: "fr", label: "FR" },
      { key: "en", label: "EN" },
    ],
    []
  );

  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-[#E7E5E4] bg-white p-1 dark:border-[#44403C] dark:bg-[#292524]">
      {opts.map((o) => {
        const active = current === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => {
              void i18n.changeLanguage(o.key);
              applyDocumentDirection(o.key);
            }}
            className={`min-h-[40px] rounded-2xl px-3 text-[12px] font-extrabold transition active:scale-[0.98] ${
              active
                ? "bg-[#1e3a5f] text-white"
                : "bg-transparent text-[#1C1917] hover:bg-[#1e3a5f]/10 dark:text-white dark:hover:bg-[#1e3a5f]/20"
            }`}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

