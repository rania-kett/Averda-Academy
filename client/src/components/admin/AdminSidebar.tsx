import {
  BarChart2,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Truck,
  Users,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

const items = [
  { to: "/admin", icon: LayoutDashboard, labelKey: "nav.dashboard" as const, end: true },
  { to: "/admin/employees", icon: Users, labelKey: "nav.employees" as const, end: false },
  { to: "/admin/courses", icon: BookOpen, labelKey: "nav.courseMgmt" as const, end: false },
  { to: "/admin/analytics", icon: BarChart2, labelKey: "nav.analytics" as const, end: false },
  { to: "/admin/settings", icon: Settings, labelKey: "common.settings" as const, end: false },
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
  const initials = (adminName || "AD").slice(0, 2).toUpperCase();

  const panelVisibility = mobileOpen
    ? "translate-x-0"
    : "-translate-x-full rtl:translate-x-full md:translate-x-0 md:rtl:translate-x-0";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-[#6366F1] text-white shadow-sm"
        : "text-slate-400 hover:bg-indigo-500/10 hover:text-white"
    }`;

  return (
    <aside
      className={`fixed inset-y-0 start-0 z-50 flex h-screen w-[240px] flex-col border-e border-[#30363D] bg-[#1E293B] text-white transition-transform duration-200 ease-out dark:bg-[#161B22] ${panelVisibility}`}
      aria-label={t("admin.sidebar.aria")}
    >
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <Truck className="h-8 w-8 shrink-0 text-[#6366F1]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold tracking-tight">FleetLearn</p>
          <p className="truncate text-xs font-medium text-slate-400">{t("admin.sidebar.adminLabel")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={navLinkClass}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-xs font-bold text-white">
            {initials}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">{adminName || "Admin"}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            onNavigate();
            nav("/admin/login");
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {t("common.logout")}
        </button>
      </div>
    </aside>
  );
}
