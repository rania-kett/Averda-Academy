import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/api";
import type { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import type { EmpUser } from "@/context/AuthContext";
import averdaLogo from "@/assets/averda_logo.png";
import { applyDocumentDirection } from "@/i18n/i18n";
import { useTheme } from "@/context/ThemeContext";
import { Delete, Moon, Sun } from "lucide-react";
import "./LoginPage.css";

const LOGIN_LANG_FLAGS: Record<"en" | "fr" | "ar", string> = {
  en: "/flags/gb.svg",
  fr: "/flags/fr.svg",
  ar: "/flags/ma.svg",
};

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const { setEmployeeSession } = useAuth();
  const nav = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [employeeDigits, setEmployeeDigits] = useState(""); // numeric suffix only (max 6)
  const [employeeRaw, setEmployeeRaw] = useState(""); // displayed value: "", "A", or "AV" + digits
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAr = i18n.language.toLowerCase().startsWith("ar");
  const isFr = i18n.language.toLowerCase().startsWith("fr");
  const dir = isAr ? "rtl" : "ltr";

  const labels = useMemo(() => {
    if (isAr) {
      return {
        portalBadge: "بوابة الموظف",
        employeeNumber: "رقم الموظف",
        pin: "الرمز السري",
        login: "دخول",
      };
    }
    if (isFr) {
      return {
        portalBadge: "Portail Employé",
        employeeNumber: "N° Employé",
        pin: "Code PIN",
        login: "Se connecter",
      };
    }
    return {
      portalBadge: "Employee Portal",
      employeeNumber: "Employee Number",
      pin: "PIN Code",
      login: "Login",
    };
  }, [isAr, isFr]);

  const append = (d: string) => {
    if (pin.length >= 4) return;
    setPin((p) => p + d);
    setErrorMessage(null);
  };
  const backspace = () => setPin((p) => p.slice(0, -1));

  const submit = async () => {
    if (employeeDigits.length !== 6 || pin.length !== 4) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const employeeId = `AV${employeeDigits}`;
      const { data } = await authApi.login(employeeId, pin);
      setEmployeeSession(data.user as EmpUser, data.accessToken, data.refreshToken);
      nav("/home", { replace: true });
    } catch (e) {
      const ax = e as AxiosError;
      setErrorMessage(!ax.response ? t("login.networkError") : t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  const fieldBorder = errorMessage ? "border-red-500" : "border-[#D6D3D1] dark:border-[#44403C]";

  useEffect(() => {
    // Prevent scrolling to empty void on mobile.
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevOverscroll = (body.style as any).overscrollBehaviorY as string | undefined;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    (body.style as any).overscrollBehaviorY = "none";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      (body.style as any).overscrollBehaviorY = prevOverscroll || "";
    };
  }, []);

  return (
    <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#F0F2F7] px-4 font-employee text-slate-900 dark:bg-[#1a1f2e] dark:text-white" dir={dir}>
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center justify-center gap-4 md:gap-2 md:max-w-[400px]">
        {/* Top bar (matches reference) */}
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
                {labels.portalBadge}
              </span>
            </div>
            <div className="mt-3 h-px w-full bg-[#E5E7EB] dark:bg-white/10 md:mt-2" aria-hidden />
          </div>

          <div className="space-y-3 md:space-y-2">
          <div>
            <label className="mb-2 block text-[12px] font-semibold text-[#6B7280] dark:text-white/60">Employee ID</label>
            <input
              value={employeeRaw}
              onChange={(e) => {
                const raw = (e.target.value || "").toUpperCase();
                if (raw === "") {
                  // Once "AV" is set, the prefix cannot be deleted (only digits can be removed).
                  if (employeeRaw.startsWith("AV")) {
                    setEmployeeRaw("AV");
                    setEmployeeDigits("");
                  } else {
                    setEmployeeRaw("");
                    setEmployeeDigits("");
                  }
                  setErrorMessage(null);
                  return;
                }

                if (raw === "A") {
                  if (employeeRaw.startsWith("AV")) return;
                  setEmployeeRaw("A");
                  setEmployeeDigits("");
                  setErrorMessage(null);
                  return;
                }

                if (raw.startsWith("AV")) {
                  const digits = raw.slice(2).replace(/\D/g, "").slice(0, 6);
                  setEmployeeRaw(`AV${digits}`);
                  setEmployeeDigits(digits);
                  setErrorMessage(null);
                  return;
                }

                if (/^\d+$/.test(raw)) {
                  const digits = raw.slice(0, 6);
                  setEmployeeRaw(`AV${digits}`);
                  setEmployeeDigits(digits);
                  setErrorMessage(null);
                  return;
                }

                // Reject any other letters/special chars.
              }}
              onKeyDown={(e) => {
                if (!employeeRaw.startsWith("AV")) return;
                const el = e.currentTarget;
                const start = el.selectionStart ?? 0;
                const end = el.selectionEnd ?? 0;
                const touchesPrefix = start < 2 || end < 2;
                if ((e.key === "Backspace" || e.key === "Delete") && touchesPrefix) {
                  e.preventDefault();
                  requestAnimationFrame(() => el.setSelectionRange(2, 2));
                }
              }}
              onClick={(e) => {
                if (!employeeRaw.startsWith("AV")) return;
                const el = e.currentTarget;
                requestAnimationFrame(() => {
                  const start = el.selectionStart ?? 0;
                  const end = el.selectionEnd ?? 0;
                  if (start < 2 || end < 2) el.setSelectionRange(2, 2);
                });
              }}
              onFocus={(e) => {
                if (!employeeRaw.startsWith("AV")) return;
                const el = e.currentTarget;
                requestAnimationFrame(() => {
                  const start = el.selectionStart ?? 0;
                  const end = el.selectionEnd ?? 0;
                  if (start < 2 || end < 2) el.setSelectionRange(2, 2);
                });
              }}
              onPaste={(e) => {
                const text = (e.clipboardData.getData("text") || "").toUpperCase().trim();
                if (!text) return;

                if (text === "A") {
                  e.preventDefault();
                  setEmployeeRaw("A");
                  setEmployeeDigits("");
                  setErrorMessage(null);
                  return;
                }

                if (text.startsWith("AV")) {
                  const digits = text.slice(2).replace(/\D/g, "").slice(0, 6);
                  e.preventDefault();
                  setEmployeeRaw(`AV${digits}`);
                  setEmployeeDigits(digits);
                  setErrorMessage(null);
                  return;
                }

                if (/^\d+$/.test(text)) {
                  const digits = text.slice(0, 6);
                  e.preventDefault();
                  setEmployeeRaw(`AV${digits}`);
                  setEmployeeDigits(digits);
                  setErrorMessage(null);
                }
              }}
              placeholder="AV000000"
              autoComplete="username"
              inputMode="text"
              dir="ltr"
              aria-label={labels.employeeNumber}
              className="h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-white px-4 text-[16px] font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-[#2C4A8F]/50 focus:ring-2 focus:ring-[#2C4A8F]/15 dark:border-white/10 dark:bg-[#252b3b] dark:text-white dark:placeholder:text-white/40 md:h-11 md:text-[15px]"
            />
          </div>

          <div>
            <div className="mb-2 text-[12px] font-semibold text-[#6B7280] dark:text-white/60">PIN Code</div>
            <motion.div
              animate={errorMessage ? { x: [0, -8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`flex h-[52px] items-center justify-center gap-4 rounded-xl border bg-white px-4 text-2xl text-slate-900 dark:bg-[#252b3b] dark:text-white ${fieldBorder} md:h-11`}
              dir="ltr"
            >
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="text-[26px] leading-none text-[#111827] dark:text-white md:text-[24px]">
                  {pin[i] ? "●" : " "}
                </span>
              ))}
            </motion.div>
            {errorMessage && (
              <p className="mt-2 text-center text-sm text-red-500 dark:text-red-400" role="alert">
                {errorMessage}
              </p>
            )}
          </div>

            <div className="grid grid-cols-3 gap-3 md:gap-2" dir="ltr">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k) =>
              k === "" ? (
                <span key="spacer" />
              ) : (
                <button
                  key={k}
                  type="button"
                  onClick={() => (k === "⌫" ? backspace() : append(k))}
                    className="flex h-14 min-w-[56px] items-center justify-center rounded-2xl bg-[#F0F2F5] text-[20px] font-extrabold text-slate-900 transition-all duration-150 hover:scale-105 hover:bg-[#E7EBF0] active:scale-[0.98] dark:bg-[#3a4157] dark:text-white dark:hover:bg-[#444c64] md:h-14 md:min-w-[72px] md:text-[20px]"
                    style={{ transition: "all 0.15s" }}
                  aria-label={k === "⌫" ? "Backspace" : k}
                >
                  {k === "⌫" ? <Delete className="h-5 w-5" aria-hidden /> : k}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            disabled={loading || employeeDigits.length !== 6 || pin.length !== 4}
            onClick={() => void submit()}
            className="flex h-14 w-full items-center justify-center rounded-[12px] bg-[#1e3a5f] text-lg font-extrabold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 md:h-11 md:text-[15px]"
          >
            {loading ? t("common.loading") : labels.login}
          </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-400 dark:text-white/60 md:mt-2">
            <span>Powered by Averda •</span>
            <img src={averdaLogo} alt="Averda" className="h-4 w-auto opacity-70" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
