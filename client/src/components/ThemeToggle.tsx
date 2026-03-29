import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";

type Variant = "employee" | "admin";

const baseBtn =
  "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-offset-2";

export function ThemeToggle({
  variant = "employee",
  tone = "surface",
}: {
  variant?: Variant;
  /** Use `onDark` for controls sitting on the dark admin sidebar / mobile bar */
  tone?: "surface" | "onDark";
}) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const styles =
    tone === "onDark"
      ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
      : variant === "employee"
        ? "border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-[#F5F5F4] dark:border-[#44403C] dark:bg-[#292524] dark:text-white dark:hover:bg-[#44403C]"
        : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/80";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${baseBtn} ${styles}`}
      aria-label={isDark ? t("common.themeLight") : t("common.themeDark")}
      aria-pressed={isDark}
    >
      <span className="sr-only">
        {isDark ? t("common.themeLight") : t("common.themeDark")}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            role="presentation"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ rotate: -85, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 85, opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <Moon className="h-5 w-5" strokeWidth={2} />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            role="presentation"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ rotate: 85, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -85, opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <Sun className="h-5 w-5 text-amber-500" strokeWidth={2} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
