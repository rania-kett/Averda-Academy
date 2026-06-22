import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/api";
import type { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import type { AdminUser } from "@/context/AuthContext";
import averdaLogo from "@/assets/averda_logo.png";
import { applyDocumentDirection } from "@/i18n/i18n";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import "@/pages/employee/LoginPage.css";

const LOGIN_LANG_FLAGS: Record<"en" | "fr" | "ar", string> = {
  en: "/flags/gb.svg",
  fr: "/flags/fr.svg",
  ar: "/flags/ma.svg",
};

export function AdminLoginPage() {
  const { t, i18n } = useTranslation();
  const { setAdminSession } = useAuth();
  const nav = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const isAr = i18n.language.toLowerCase().startsWith("ar");
  const dir = isAr ? "rtl" : "ltr";
  const fieldBorder = errorMessage ? "border-red-500" : "border-[#D6D3D1] dark:border-[#44403C]";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data } = await authApi.adminLogin(email, password);
      setAdminSession(data.user as AdminUser, data.accessToken, data.refreshToken);
      nav("/admin", { replace: true });
    } catch (e) {
      const ax = e as AxiosError;
      setErrorMessage(!ax.response ? t("adminLogin.networkError") : t("adminLogin.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevOverscroll = (body.style as CSSStyleDeclaration & { overscrollBehaviorY?: string }).overscrollBehaviorY;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    (body.style as CSSStyleDeclaration & { overscrollBehaviorY?: string }).overscrollBehaviorY = "none";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      (body.style as CSSStyleDeclaration & { overscrollBehaviorY?: string }).overscrollBehaviorY = prevOverscroll || "";
    };
  }, []);

  return (
    <div
      className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#F0F2F7] px-4 font-employee text-slate-900 dark:bg-[#1a1f2e] dark:text-white"
      dir={dir}
    >
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center justify-center gap-4 md:max-w-[400px] md:gap-2">
        <div className="flex w-full items-center justify-between">
          <div
            className="login-lang-switcher inline-flex items-center gap-1 rounded-full bg-white px-1 py-1 shadow-sm dark:bg-white/10"
            dir="ltr"
            role="group"
            aria-label={t("common.language")}
          >
            {(
              [
                { code: "en" as const, label: "EN" },
                { code: "fr" as const, label: "FR" },
                { code: "ar" as const, label: "AR" },
              ] as const
            ).map((l) => {
              const active = i18n.language.toLowerCase().startsWith(l.code);
              const flagSrc = LOGIN_LANG_FLAGS[l.code];
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    void i18n.changeLanguage(l.code);
                    applyDocumentDirection(l.code);
                  }}
                  className={
                    active
                      ? "inline-flex h-9 items-center gap-2 rounded-full bg-[#2C4A8F] px-3 text-[12px] font-extrabold text-white transition-all duration-200 ease-out"
                      : "inline-flex h-9 items-center gap-2 rounded-full px-3 text-[12px] font-semibold text-[#111827]/70 transition-all duration-200 ease-out hover:text-[#111827] dark:text-white/80 dark:hover:text-white"
                  }
                  aria-pressed={active}
                >
                  <img
                    src={flagSrc}
                    alt=""
                    className="login-lang-flag-img h-4 w-4 shrink-0"
                    aria-hidden
                    loading="eager"
                  />
                  <span>{l.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E5E7EB] text-[#111827] transition active:scale-[0.98] dark:bg-white/10 dark:text-white"
            aria-label={theme === "dark" ? t("common.themeLight") : t("common.themeDark")}
            aria-pressed={theme === "dark"}
          >
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full rounded-[20px] bg-white p-5 dark:bg-[#252b3b] md:p-3"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
        >
          <div className="mb-4 md:mb-3">
            <div className="flex items-center gap-3">
              <img src={averdaLogo} alt="Averda" className="h-9 w-auto shrink-0" />
              <h1
                className="text-[22px] font-extrabold tracking-tight text-[#1e3a5f] dark:text-white md:text-[20px]"
                style={{ fontFamily: "'Nunito', 'DM Sans', 'Segoe UI', Arial, sans-serif" }}
              >
                Averda Academy
              </h1>
            </div>
            <div className="mt-2 flex">
              <span className="inline-flex items-center rounded-full bg-[#EEF2F7] px-3 py-1 text-[12px] font-semibold text-[#111827]/70 dark:bg-white/10 dark:text-white/80">
                {t("adminLogin.portal")}
              </span>
            </div>
            <div className="mt-3 h-px w-full bg-[#E5E7EB] dark:bg-white/10 md:mt-2" aria-hidden />
          </div>

          <form onSubmit={(e) => void submit(e)} className="space-y-3 md:space-y-2">
            <div>
              <label className="mb-2 block text-[12px] font-semibold text-[#6B7280] dark:text-white/60">
                {t("adminLogin.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null);
                }}
                className={`h-[52px] w-full rounded-xl border bg-white px-4 text-[16px] font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-[#2C4A8F]/50 focus:ring-2 focus:ring-[#2C4A8F]/15 dark:border-white/10 dark:bg-[#252b3b] dark:text-white dark:placeholder:text-white/40 md:h-11 md:text-[15px] ${fieldBorder}`}
                autoComplete="email"
                dir="ltr"
              />
            </div>
            <div>
              <label className="mb-2 block text-[12px] font-semibold text-[#6B7280] dark:text-white/60">
                {t("adminLogin.password")}
              </label>
              <div className="relative" dir="ltr">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  className={`h-[52px] w-full rounded-xl border bg-white px-4 pe-12 text-[16px] font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-[#2C4A8F]/50 focus:ring-2 focus:ring-[#2C4A8F]/15 dark:border-white/10 dark:bg-[#252b3b] dark:text-white dark:placeholder:text-white/40 md:h-11 md:text-[15px] ${fieldBorder}`}
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 end-0 inline-flex w-11 items-center justify-center text-[#6B7280] transition hover:text-[#111827] dark:text-white/60 dark:hover:text-white"
                  aria-label={showPwd ? t("admin.settings.hide") : t("admin.settings.show")}
                >
                  {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {errorMessage && (
              <p className="text-center text-sm text-red-500 dark:text-red-400" role="alert">
                {errorMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="flex h-14 w-full items-center justify-center rounded-[12px] bg-[#1e3a5f] text-lg font-extrabold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 md:h-11 md:text-[15px]"
            >
              {loading ? t("common.loading") : t("adminLogin.submit")}
            </button>
            <p className="pt-1 text-center text-[13px] font-semibold text-[#111827]/55 dark:text-white/60">
              <Link to="/login" className="underline decoration-[#111827]/20 underline-offset-4 hover:text-[#111827] dark:hover:text-white">
                {t("adminLogin.employeeLogin")}
              </Link>
            </p>
          </form>

          <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-400 dark:text-white/60 md:mt-2">
            <span>{t("login.poweredBy")} •</span>
            <img src={averdaLogo} alt="Averda" className="h-4 w-auto opacity-70" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
