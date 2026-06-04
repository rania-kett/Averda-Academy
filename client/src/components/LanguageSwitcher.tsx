import { useTranslation } from "react-i18next";
import { applyDocumentDirection } from "@/i18n/i18n";
import type { SupportedLng } from "@/i18n/i18n";

const langs: { code: SupportedLng; flagSrc: string; label: string }[] = [
  { code: "ar", flagSrc: "/flags/ma.svg", label: "AR" },
  { code: "fr", flagSrc: "/flags/fr.svg", label: "FR" },
  { code: "en", flagSrc: "/flags/gb.svg", label: "EN" },
];

export function LanguageSwitcher({
  variant = "dark",
}: {
  variant?: "dark" | "employee" | "admin";
}) {
  const { i18n } = useTranslation();
  const base =
    variant === "employee"
      ? "border-[#E7E5E4] bg-white text-[#1C1917] dark:border-[#44403C] dark:bg-[#292524] dark:text-white"
      : variant === "admin"
        ? "border-white/20 bg-white/10 text-white"
        : "border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

  const inactiveHover =
    variant === "admin"
      ? "hover:bg-white/15"
      : "hover:bg-[#F5F5F4] dark:hover:bg-[#44403C]";

  return (
    <div
      className={`inline-flex rounded-lg border p-1 gap-1 ${base}`}
      role="group"
      aria-label={i18n.t("common.language")}
    >
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => {
            void i18n.changeLanguage(l.code);
            applyDocumentDirection(l.code);
          }}
          className={`flex min-h-[52px] min-w-[52px] items-center justify-center gap-1 rounded-md px-2 text-sm font-semibold transition ${
            i18n.language.startsWith(l.code)
              ? "bg-[#1e3a5f] text-white"
              : inactiveHover
          }`}
          aria-pressed={i18n.language.startsWith(l.code)}
          aria-label={l.label}
        >
          <img src={l.flagSrc} width="20" height="14" alt="" className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover" />
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
}
