import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { ThemeToggle } from "../ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export function EmployeeLayout() {
  const { t } = useTranslation();
  const { state, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const emp = state.kind === "employee" ? state.user : null;

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const langLabel = (code: string) =>
    t(`langNames.${code}`, { defaultValue: code });

  const navCls =
    "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-lg text-sm font-semibold transition hover:bg-[#F5F5F4] dark:hover:bg-white/10";
  const active = "bg-[#F5F5F4] text-employee-amber dark:bg-white/10";
  const idle = "text-[#57534E] dark:text-stone-400";
  const homeActive = pathname === "/home";
  const coursesActive =
    pathname.startsWith("/courses") || pathname.startsWith("/quiz");

  return (
    <div className="min-h-screen bg-[#FAFAF7] pb-24 font-employee text-[#1C1917] dark:bg-[#1C1917] dark:text-[#F5F5F4]">
      <header className="sticky top-0 z-40 border-b border-[#E7E5E4] bg-white backdrop-blur dark:border-zinc-700 dark:bg-[#1C1917]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🚛
            </span>
            <span className="font-bold text-employee-amber">{t("app.name")}</span>
          </div>
          <div className="flex items-center gap-2 rtl:flex-row-reverse">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E7E5E4] bg-white text-[#1C1917] dark:border-[#44403C] dark:bg-[#292524] dark:text-white"
              aria-label={t("common.notifications")}
              onClick={() => toast(t("common.featureComingSoon"), "info")}
            >
              <Bell className="h-6 w-6" />
            </button>
            <ThemeToggle />
            <LanguageSwitcher variant="employee" />
            {emp && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-black/10 dark:ring-white/20"
                  style={{ backgroundColor: emp.avatarColor }}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  aria-label={t("employee.profile.menu")}
                >
                  {emp.name.slice(0, 2).toUpperCase()}
                </button>
                {menuOpen && (
                  <div
                    className="absolute end-0 top-full z-50 mt-2 min-w-[240px] rounded-xl border border-[#E7E5E4] bg-white py-2 shadow-xl dark:border-[#44403C] dark:bg-[#292524]"
                    role="menu"
                  >
                    <div className="border-b border-[#E7E5E4] px-4 py-3 dark:border-[#44403C]">
                      <p className="font-semibold text-[#1C1917] dark:text-[#F5F5F4]">{emp.name}</p>
                      <p className="text-sm text-[#57534E] dark:text-stone-400" dir="ltr">
                        {emp.employeeId}
                      </p>
                    </div>
                    <div className="px-4 py-2 text-sm text-[#57534E] dark:text-stone-400">
                      {t("employee.profile.langLabel")}:{" "}
                      <span className="text-[#1C1917] dark:text-[#F5F5F4]">{langLabel(emp.language)}</span>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-3 text-start text-sm font-medium text-red-600 hover:bg-[#F5F5F4] dark:text-red-400 dark:hover:bg-[#44403C]"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        nav("/login", { replace: true });
                      }}
                    >
                      {t("common.logout")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <motion.main
        className="mx-auto max-w-6xl px-4 py-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Outlet />
      </motion.main>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E7E5E4] bg-white px-4 py-2 backdrop-blur dark:border-zinc-700 dark:bg-[#1C1917]"
        aria-label={t("nav.employeeBar")}
      >
        <div className="mx-auto flex max-w-lg justify-around gap-2">
          <Link
            to="/home"
            className={`${navCls} ${homeActive ? active : idle}`}
          >
            <span className="text-2xl leading-none" aria-hidden>
              🏠
            </span>
            <span>{t("nav.home")}</span>
          </Link>
          <Link
            to="/courses"
            className={`${navCls} ${coursesActive ? active : idle}`}
          >
            <span className="text-2xl leading-none" aria-hidden>
              📚
            </span>
            <span>{t("nav.courses")}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
