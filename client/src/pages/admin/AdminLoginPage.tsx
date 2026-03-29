import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import type { AdminUser } from "@/context/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AdminLoginPage() {
  const { t } = useTranslation();
  const { setAdminSession } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@averda.ma");
  const [password, setPassword] = useState("Admin@2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const { data } = await authApi.adminLogin(email, password);
      setAdminSession(data.user as AdminUser, data.accessToken, data.refreshToken);
      nav("/admin", { replace: true });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 font-sans text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
      <div className="absolute end-4 top-4 z-10 flex items-center gap-2 rtl:flex-row-reverse">
        <ThemeToggle variant="admin" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-600 dark:bg-slate-800"
      >
        <div className="mb-6 flex justify-center">
          <LanguageSwitcher />
        </div>
        <div className="mb-6 flex items-center gap-2">
          <span className="text-3xl">🚛</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">FleetLearn</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("adminLogin.title")}</p>
          </div>
        </div>
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400">{t("adminLogin.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 outline-none ring-offset-2 focus:ring-2 focus:ring-accent-indigo dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400">{t("adminLogin.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 outline-none ring-offset-2 focus:ring-2 focus:ring-accent-indigo dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {t("adminLogin.error")}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent-indigo py-3 font-semibold text-white transition hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("adminLogin.submit")}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
