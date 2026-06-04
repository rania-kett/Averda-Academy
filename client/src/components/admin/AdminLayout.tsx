import { motion } from "framer-motion";
import { Menu, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { ThemeToggle } from "../ThemeToggle";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { state } = useAuth();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const adminName = state.kind === "admin" ? state.user.name : "";
  const initials = (adminName || "AD").slice(0, 2).toUpperCase();

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Disable browser scroll restoration (admin uses an internal scroll container).
  useEffect(() => {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Always reset scroll to top on navigation.
  useLayoutEffect(() => {
    const el = mainRef.current;
    // cover window-scroll pages too (e.g. login)
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    } catch {
      window.scrollTo(0, 0);
    }
    if (!el) return;
    el.scrollTop = 0;
    el.scrollLeft = 0;
    requestAnimationFrame(() => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    });
  }, [location.pathname, location.search, location.hash, location.key]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileOpen((o) => !o);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117]">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          aria-label={t("common.close")}
          onClick={closeMobile}
        />
      )}

      <AdminSidebar mobileOpen={mobileOpen} onNavigate={closeMobile} />

      {/* Main: always offset by 240px on desktop — sidebar never collapses */}
      <div className="flex min-h-screen flex-col md:ms-[240px]">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-[#0D1117]">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden dark:text-slate-200 dark:hover:bg-white/10"
              onClick={toggleMobileSidebar}
              aria-label={t("common.openMenu")}
              aria-expanded={mobileOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
            <span
              className="truncate font-semibold text-[#1e3a5f] dark:text-slate-100"
              style={{ fontFamily: "'Nunito', 'DM Sans', 'Segoe UI', Arial, sans-serif" }}
            >
              {t("app.name")}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `rounded-lg p-2 transition ${
                  isActive
                    ? "bg-[#1e3a5f]/10 text-[#1e3a5f] dark:bg-white/15 dark:text-white"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                }`
              }
              title={t("common.settings")}
              aria-label={t("common.settings")}
            >
              <Settings className="h-5 w-5" aria-hidden />
            </NavLink>
            <LanguageSwitcher variant="dark" />
            <ThemeToggle variant="admin" />
            <div className="flex items-center gap-2 border-s border-slate-200 ps-2 sm:ps-3 dark:border-slate-600">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-bold text-white">
                {initials}
              </div>
              <span className="hidden max-w-[140px] truncate text-sm font-medium text-[#0F172A] dark:text-slate-100 sm:inline">
                {adminName || "Admin"}
              </span>
            </div>
          </div>
        </header>

        <motion.main
          ref={mainRef}
          className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-[calc(1rem+var(--app-content-gap,36px)*0.35)] text-start text-[#0F172A] md:px-6 md:pb-6 md:pt-[calc(1.5rem+var(--app-content-gap,36px)*0.35)] dark:text-slate-100"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          key={i18n.language}
          dir={i18n.language.startsWith("ar") ? "rtl" : "ltr"}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
