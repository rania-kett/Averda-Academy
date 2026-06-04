import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/api";
import type { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import type { AdminUser } from "@/context/AuthContext";
import averdaLogo from "@/assets/averda_logo.png";
import { applyDocumentDirection } from "@/i18n/i18n";
import { Eye, EyeOff, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function AdminLoginPage() {
  const { t, i18n } = useTranslation();
  const { setAdminSession } = useAuth();
  const nav = useNavigate();
  const { toggleTheme } = useTheme();
  const [email, setEmail] = useState("admin@averda.ma");
  const [password, setPassword] = useState("Admin@2026");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const isAr = i18n.language.toLowerCase().startsWith("ar");
  const dir = isAr ? "rtl" : "ltr";
  const submitLabel = isAr ? "دخول" : i18n.language.toLowerCase().startsWith("fr") ? "Connexion" : "Login";

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
      setErrorMessage(
        !ax.response ? t("adminLogin.networkError") : t("adminLogin.error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#F0F2F7] px-4 font-employee text-slate-900 dark:bg-[#1a1f2e] dark:text-white"
      dir={dir}
    >
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center justify-center gap-4 md:gap-2">
        {/* Top bar (EXACT match) */}
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E5E7EB] text-[#111827] transition active:scale-[0.98] dark:bg-white/10 dark:text-white"
            aria-label={t("common.themeDark")}
          >
            <Sun className="h-5 w-5" />
          </button>

          <div
            className="inline-flex items-center gap-1 rounded-full bg-white px-1 py-1 shadow-sm dark:bg-white/10"
            dir="ltr"
            role="group"
            aria-label={t("common.language")}
          >
            {([
              { code: "ar", flagSrc: "/flags/ma.svg", label: "AR" },
              { code: "fr", flagSrc: "/flags/fr.svg", label: "FR" },
              { code: "en", flagSrc: "/flags/gb.svg", label: "EN" },
            ] as const).map((l) => {
              const active = i18n.language.toLowerCase().startsWith(l.code);
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
                  <img src={l.flagSrc} width="20" height="14" alt="" className="h-4 w-5 shrink-0 rounded-[2px] object-cover" />
                  <span>{l.label}</span>
                </button>
              );
            })}
          </div>

          <div className="w-10" aria-hidden />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full rounded-[20px] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.12)] dark:bg-[#252b3b] md:p-4"
        >
          <div className="mb-4 md:mb-3">
            <div className="flex items-center justify-center gap-3">
              <div
                className="text-[22px] font-extrabold tracking-tight text-[#1e3a5f] dark:text-white md:text-[20px]"
                style={{ fontFamily: "'Nunito', 'DM Sans', 'Segoe UI', Arial, sans-serif" }}
              >
                Averda Academy
              </div>
              <img src={averdaLogo} alt="Averda" className="h-9 w-auto shrink-0" />
            </div>
            <div className="mt-2 flex justify-end">
              <span className="inline-flex items-center rounded-full bg-[#EEF2F7] px-3 py-1 text-[12px] font-semibold text-[#111827]/70 dark:bg-white/10 dark:text-white/80">
                {isAr ? "بوابة المسؤول" : i18n.language.toLowerCase().startsWith("fr") ? "Portail Admin" : "Admin Portal"}
              </span>
            </div>
            <div className="mt-3 h-px w-full bg-[#E5E7EB] dark:bg-white/10 md:mt-2" aria-hidden />
          </div>

          <form onSubmit={(e) => void submit(e)} className="space-y-3 md:space-y-2">
          <div>
            <label className="mb-2 block text-[12px] font-semibold text-[#6B7280] dark:text-white/60">
              {isAr ? "البريد الإلكتروني / Email" : "Email / البريد الإلكتروني"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage(null);
              }}
              className="h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-white px-4 text-[16px] font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-[#2C4A8F]/50 focus:ring-2 focus:ring-[#2C4A8F]/15 dark:border-white/10 dark:bg-[#252b3b] dark:text-white dark:placeholder:text-white/40 md:h-11 md:text-[15px]"
              autoComplete="email"
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-2 block text-[12px] font-semibold text-[#6B7280] dark:text-white/60">
              {isAr ? "كلمة المرور / Password" : "Password / كلمة المرور"}
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                className="h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-white px-4 pe-12 text-[16px] font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-[#2C4A8F]/50 focus:ring-2 focus:ring-[#2C4A8F]/15 dark:border-white/10 dark:bg-[#252b3b] dark:text-white dark:placeholder:text-white/40 md:h-11 md:text-[15px]"
                autoComplete="current-password"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute inset-y-0 start-0 inline-flex w-11 items-center justify-center text-[#6B7280] transition hover:text-[#111827] dark:text-white/60 dark:hover:text-white"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {errorMessage && (
            <p className="text-sm text-red-400" role="alert">
              {errorMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex h-14 w-full items-center justify-center rounded-[12px] bg-[#2C4A8F] text-lg font-extrabold text-white transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:h-11 md:text-[15px]"
          >
            {loading ? t("common.loading") : submitLabel}
          </button>
          <div className="pt-2 text-center text-[13px] font-semibold text-[#111827]/55 dark:text-white/60">
            <span className="underline decoration-[#111827]/20 underline-offset-4">
              login
            </span>{" "}
            /{" "}
            <Link to="/login" className="underline decoration-[#111827]/20 underline-offset-4 hover:text-[#111827] dark:hover:text-white">
              ?Employee login
            </Link>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-400 dark:text-white/60">
            <img src={averdaLogo} alt="Averda" className="h-4 w-auto opacity-70" />
            <span>• Powered by Averda</span>
          </div>
        </form>
        </motion.div>
      </div>
    </div>
  );
}
