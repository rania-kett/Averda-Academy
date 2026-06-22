import { Check, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";
import { persistAppLanguage, resolveCurrentLng } from "@/i18n/persistLanguage";
import type { SupportedLng } from "@/i18n/i18n";

const LANG_OPTIONS: { code: SupportedLng; flagSrc: string; labelKey: string }[] = [
  { code: "en", flagSrc: "/flags/gb.svg", labelKey: "common.langEnglish" },
  { code: "fr", flagSrc: "/flags/fr.svg", labelKey: "common.langFrench" },
  { code: "ar", flagSrc: "/flags/ma.svg", labelKey: "common.langArabic" },
];

type Props = {
  onLanguageChange?: (code: SupportedLng) => void;
  className?: string;
};

export function AppPreferencesPanel({ onLanguageChange, className = "" }: Props) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const currentLng = resolveCurrentLng(i18n.language);

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#161B22] ${className}`}
    >
      <div>
        <div className="mb-2 text-sm font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
          {t("common.language")}
        </div>
        <div className="space-y-2">
          {LANG_OPTIONS.map((l) => {
            const active = currentLng === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  persistAppLanguage(l.code);
                  onLanguageChange?.(l.code);
                }}
                className={`flex min-h-[56px] w-full items-center justify-between rounded-2xl border px-4 text-start text-sm font-extrabold transition active:scale-[0.97] ${
                  active
                    ? "border-[#1e3a5f] bg-[#1e3a5f]/10 text-[#1e3a5f] dark:border-white/15 dark:bg-white/10 dark:text-white"
                    : "border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-[#1e3a5f]/10 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F5F5F4] dark:hover:bg-white/10"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <img
                    src={l.flagSrc}
                    width="20"
                    height="14"
                    alt=""
                    className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
                    aria-hidden
                  />
                  {t(l.labelKey)}
                </span>
                {active ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-sm font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
          {t("employee.layout.appearance")}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex min-h-[56px] w-full items-center justify-between rounded-2xl border border-[#E7E5E4] bg-white px-4 text-sm font-extrabold text-[#1C1917] transition hover:bg-[#1e3a5f]/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F5F5F4] dark:hover:bg-white/10"
        >
          <span className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-[#1e3a5f] dark:text-white" aria-hidden />
            {t("employee.layout.darkMode")}
          </span>
          <span
            className={`relative h-[28px] w-[52px] shrink-0 rounded-full transition-colors ${
              theme === "dark" ? "bg-[#1e3a5f]" : "bg-[#D6D3D1]"
            }`}
            dir="ltr"
            aria-hidden
          >
            <span
              className="absolute top-[3px] start-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform duration-200 ease"
              style={{ transform: theme === "dark" ? "translateX(24px)" : "translateX(0px)" }}
            />
          </span>
        </button>
      </div>
    </section>
  );
}
