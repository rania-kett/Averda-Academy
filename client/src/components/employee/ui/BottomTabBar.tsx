import { BookOpen, Home, Target, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type Tab = {
  to: string;
  key: "home" | "training" | "challenges" | "profile";
  Icon: typeof Home;
  labelKey: "nav.home" | "nav.myTraining" | "nav.challenges" | "nav.profile";
  match: (pathname: string) => boolean;
};

export function BottomTabBar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const tabs: Tab[] = useMemo(
    () => [
      { to: "/home", key: "home", Icon: Home, labelKey: "nav.home", match: (p) => p === "/home" },
      {
        to: "/courses",
        key: "training",
        Icon: BookOpen,
        labelKey: "nav.myTraining",
        match: (p) => p.startsWith("/courses") || p.startsWith("/quiz"),
      },
      {
        to: "/challenges",
        key: "challenges",
        Icon: Target,
        labelKey: "nav.challenges",
        match: (p) => p.startsWith("/challenges"),
      },
      { to: "/profile", key: "profile", Icon: User, labelKey: "nav.profile", match: (p) => p.startsWith("/profile") },
    ],
    []
  );

  return (
    <nav
      className="border-t border-white/10 bg-[#2E6198] px-3 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.20)]"
      aria-label={t("nav.employeeBar")}
    >
      <div className="mx-auto flex max-w-lg items-stretch gap-2">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const cls = active
            ? "bg-white/18 text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white";
          return (
            <Link
              key={tab.key}
              to={tab.to}
              className={`relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 transition-all duration-200 ease-out active:scale-[0.97] ${cls}`}
            >
              <tab.Icon className={`h-6 w-6 ${active ? "fill-white/20" : ""}`} aria-hidden />
              <span className="text-[12px] font-semibold leading-none opacity-95">{t(tab.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

