import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import type { EmpUser } from "@/context/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

export function LoginPage() {
  const { t } = useTranslation();
  const { setEmployeeSession } = useAuth();
  const nav = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const append = (d: string) => {
    if (pin.length >= 4) return;
    setPin((p) => p + d);
    setError(false);
  };
  const backspace = () => setPin((p) => p.slice(0, -1));

  const submit = async () => {
    if (employeeId.trim().length < 2 || pin.length !== 4) return;
    setLoading(true);
    setError(false);
    try {
      const { data } = await authApi.login(employeeId.trim(), pin);
      setEmployeeSession(data.user as EmpUser, data.accessToken, data.refreshToken);
      nav("/home", { replace: true });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fieldBorder = error ? "border-red-500" : "border-[#D6D3D1] dark:border-[#44403C]";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#FAFAF7] px-4 font-employee text-[#1C1917] dark:bg-[#1C1917] dark:text-[#F5F5F4]">
      <div className="absolute end-4 top-4 z-10 flex items-center gap-2 rtl:flex-row-reverse">
        <ThemeToggle />
      </div>
      <div className="mb-8 flex flex-col items-center gap-2">
        <span className="text-5xl">🚛</span>
        <h1 className="text-2xl font-extrabold text-employee-amber">{t("app.name")}</h1>
        <p className="text-[#57534E] dark:text-stone-400">{t("app.tagline")}</p>
      </div>
      <div className="mb-6">
        <LanguageSwitcher variant="employee" />
      </div>
      <div className="w-full max-w-md space-y-4">
        <label className="block text-sm font-medium text-[#57534E] dark:text-stone-400">
          {t("login.employeeId")}
        </label>
        <input
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
          placeholder={t("login.employeeIdPh")}
          className="h-14 w-full rounded-xl border border-[#D6D3D1] bg-white px-4 text-lg text-[#1C1917] outline-none ring-offset-2 focus:ring-2 focus:ring-employee-amber dark:border-[#44403C] dark:bg-[#292524] dark:text-white"
          autoComplete="username"
          dir="ltr"
        />
        <div className="text-sm text-[#57534E] dark:text-stone-400">{t("login.pin")}</div>
        <motion.div
          animate={error ? { x: [0, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`flex h-14 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-2xl tracking-[0.5em] text-[#1C1917] dark:bg-[#292524] dark:text-white ${fieldBorder}`}
          dir="ltr"
        >
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="w-6 text-center">
              {pin[i] ? "●" : "·"}
            </span>
          ))}
        </motion.div>
        {error && (
          <p className="text-center text-sm text-red-500 dark:text-red-400" role="alert">
            {t("login.error")}
          </p>
        )}
        <div className="grid grid-cols-3 gap-3" dir="ltr">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k) =>
            k === "" ? (
              <span key="spacer" />
            ) : (
              <button
                key={k}
                type="button"
                onClick={() => (k === "⌫" ? backspace() : append(k))}
                className="flex h-14 items-center justify-center rounded-xl border border-[#E7E5E4] bg-white text-xl font-bold text-[#1C1917] transition hover:bg-[#F5F5F4] active:scale-[0.97] dark:border-[#44403C] dark:bg-[#292524] dark:text-white dark:hover:bg-[#44403C]"
              >
                {k}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          disabled={loading || pin.length !== 4}
          onClick={() => void submit()}
          className="flex h-14 w-full items-center justify-center rounded-xl bg-[#F59E0B] text-lg font-bold text-[#1C1917] transition hover:opacity-95 disabled:opacity-40"
        >
          {loading ? t("common.loading") : t("login.submit")}
        </button>
      </div>
    </div>
  );
}
