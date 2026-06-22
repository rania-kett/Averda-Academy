import { useTranslation } from "react-i18next";
import { persistAppLanguage } from "@/i18n/persistLanguage";

const langs = [
  { code: "en" as const, flagSrc: "/flags/gb.svg", label: "EN" },
  { code: "fr" as const, flagSrc: "/flags/fr.svg", label: "FR" },
  { code: "ar" as const, flagSrc: "/flags/ma.svg", label: "AR" },
];

export function LanguageSwitcher({
  variant = "dark",
  tone = "surface",
}: {
  variant?: "dark" | "employee" | "admin" | "pill";
  /** Pill variant only: `onDark` for navy sidebar chrome */
  tone?: "surface" | "onDark";
}) {
  const { i18n, t } = useTranslation();

  if (variant === "pill") {
    const shell =
      tone === "onDark"
        ? "border-white/20 bg-white/10"
        : "border-black/10 bg-white/70 dark:border-[#30363D] dark:bg-[#0D1117]/60";

    return (
      <div
        className={`inline-flex items-center rounded-full border p-0.5 ${shell}`}
        role="group"
        aria-label={t("common.language")}
        dir="ltr"
      >
        {langs.map((l) => {
          const active = i18n.language.startsWith(l.code);
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => persistAppLanguage(l.code)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-extrabold transition sm:px-2.5 sm:py-1.5 ${
                active
                  ? "bg-[#2E6198] text-white"
                  : tone === "onDark"
                    ? "text-white/70 hover:bg-white/15 hover:text-white"
                    : "text-slate-600 hover:bg-[#1e3a5f]/10 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#1e3a5f]/20 dark:hover:text-white"
              }`}
              aria-pressed={active}
              aria-label={l.label}
            >
              <img
                src={l.flagSrc}
                width="20"
                height="14"
                alt=""
                className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
                aria-hidden
              />
              <span>{l.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

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
      aria-label={t("common.language")}
      dir="ltr"
    >
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => persistAppLanguage(l.code)}
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
