import { BarChart2, BookOpen, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import AverdaLogo from "@/assets/averda_logo.png";
import { RoleAvatar } from "@/components/employee/ui/RoleAvatar";

const items = [
  { to: "/admin", icon: LayoutDashboard, labelKey: "nav.dashboard" as const, end: true },
  { to: "/admin/employees", icon: Users, labelKey: "nav.employees" as const, end: false },
  { to: "/admin/courses", icon: BookOpen, labelKey: "nav.courseMgmt" as const, end: false },
  { to: "/admin/analytics", icon: BarChart2, labelKey: "nav.analytics" as const, end: false },
  { to: "/admin/settings", icon: Settings, labelKey: "common.settings" as const, end: true },
];

type Props = {
  /** When false on small screens, sidebar is off-canvas; desktop always visible */
  mobileOpen: boolean;
  onNavigate: () => void;
};

export function AdminSidebar({ mobileOpen, onNavigate }: Props) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { state, logout } = useAuth();
  const adminName = state.kind === "admin" ? state.user.name : "";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-full px-3 py-2 text-[13.5px] transition ${
      isActive
        ? "bg-white text-[#1e3a5f] font-extrabold shadow-sm"
        : "text-white/70 hover:bg-white/20 hover:text-white"
    }`;

  return (
    <aside
      className={`fixed inset-y-0 start-0 z-50 grid h-[100dvh] max-h-[100dvh] w-[88vw] max-w-[320px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-e border-white/10 bg-[#1e3a5f] text-white shadow-2xl transition-transform duration-200 ease-out md:w-[240px] md:max-w-none md:shadow-none ${
        mobileOpen
          ? "translate-x-0"
          : "max-md:-translate-x-full max-md:rtl:translate-x-full md:translate-x-0"
      }`}
      aria-label={t("admin.sidebar.aria")}
    >
      <div className="border-b border-white/15 px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={AverdaLogo} alt="Averda" className="h-7 w-auto rounded bg-white/95 p-1" />
          <div className="min-w-0 flex-1 text-white">
            <p className="truncate text-[14px] font-extrabold leading-tight">Averda Academy</p>
            <p className="truncate text-[12px] font-medium text-white/70">{t("admin.sidebar.adminLabel")}</p>
          </div>
        </div>
      </div>

      <nav className="min-h-0 space-y-1 overflow-y-auto overscroll-contain p-3">
        {items.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={navLinkClass}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/15 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <NavLink
          to="/admin/settings"
          end
          onClick={onNavigate}
          className="mb-3 flex cursor-pointer items-center gap-3 rounded-full px-2 py-1.5 transition hover:bg-white/20 hover:text-white"
        >
          <RoleAvatar kind="manager" className="h-10 w-10 shrink-0" title={adminName || "Admin"} />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{adminName || "Admin"}</p>
        </NavLink>
        <div className="mb-3 h-px bg-white/15" aria-hidden />
        <button
          type="button"
          onClick={() => {
            logout();
            onNavigate();
            nav("/admin/login");
          }}
          className="flex w-full items-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/20 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {t("common.logout")}
        </button>
      </div>
    </aside>
  );
}
