import { motion } from "framer-motion";
import { ArrowLeft, Bell, Moon, Settings, Siren, X } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import AverdaLogo from "@/assets/averda_logo.png";
import { persistAppLanguage as persistLang, resolveCurrentLng } from "@/i18n/persistLanguage";
import { userApi } from "@/api/api";
import { getNotifStyle, inferNotifType } from "@/utils/notificationStyle";
import {
  dispatchFocusAssessmentQuiz,
  isAssessmentNotification,
  type FocusAssessmentLocationState,
} from "@/utils/employeeAssessmentFocus";
import {
  dispatchFocusEpi,
  isEpiNotification,
  type FocusEpiLocationState,
} from "@/utils/employeeEpiFocus";
import AverdaOnboarding from "./AverdaOnboarding";
import { BottomTabBar } from "./ui/BottomTabBar";
import { useTheme } from "@/context/ThemeContext";

export function EmployeeLayout() {
  const { t, i18n } = useTranslation();
  const { state, updateEmployeeUser } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const { pathname, search, hash, key } = location;
  const toast = useToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const bellBtnRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const tabbarWrapRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifMobileOpen, setNotifMobileOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef<{ active: boolean; dx: number; dy: number; pid: number | null }>({
    active: false,
    dx: 0,
    dy: 0,
    pid: null,
  });
  const fabDragMoved = useRef(false);
  const fabDragStart = useRef({ x: 0, y: 0 });
  const [fabDragging, setFabDragging] = useState(false);

  // Disable browser scroll restoration (we manage an internal scroll container).
  useEffect(() => {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Reset the app's scroll container on route change.
  // This app uses an internal `overflow-y-auto` container, so browser scroll restoration doesn't apply.
  useLayoutEffect(() => {
    const navState = location.state as FocusAssessmentLocationState | null;
    if (navState?.focusAssessment) {
      return;
    }
    const el = mainRef.current;

    const scrollToHashTarget = () => {
      if (!hash || !el) return false;
      const id = hash.replace(/^#/, "");
      if (!id) return false;
      const target = document.getElementById(id);
      if (!target) return false;
      const mainRect = el.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      el.scrollTop = Math.max(0, targetRect.top - mainRect.top + el.scrollTop - 16);
      return true;
    };

    if (hash) {
      scrollToHashTarget();
      requestAnimationFrame(() => {
        scrollToHashTarget();
      });
      return;
    }

    // Cover any window-scroll cases too (some screens/modals use body scrolling).
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    } catch {
      window.scrollTo(0, 0);
    }
    if (!el) return;
    // Set immediately (prevents "landing at bottom"), then reinforce with rAF.
    el.scrollTop = 0;
    el.scrollLeft = 0;
    requestAnimationFrame(() => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    });
    requestAnimationFrame(() => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    });
  }, [pathname, search, hash, key, location.state]);

  const clampFab = useCallback((x: number, y: number) => {
    const size = 56;
    const topGuard = Math.max(8, Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--app-navbar-h") || "64", 10) + 8);
    const tabbarH = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--app-tabbar-h") || "72",
      10
    );
    const bottomGuard = tabbarH + 8;
    const maxX = Math.max(0, window.innerWidth - size - 8);
    const maxY = Math.max(0, window.innerHeight - size - bottomGuard);
    return {
      x: Math.min(Math.max(8, x), maxX),
      y: Math.min(Math.max(topGuard, y), maxY),
    };
  }, []);

  const persistFab = useCallback((p: { x: number; y: number }) => {
    try {
      localStorage.setItem("emergency_fab_pos_v1", JSON.stringify(p));
    } catch {
      /* ignore */
    }
  }, []);

  const finishFabDrag = useCallback(
    (snap = true) => {
      if (!dragging.current.active) return;
      dragging.current.active = false;
      setFabDragging(false);
      if (!fabPos) return;
      if (!snap) return;
      const size = 56;
      const snapLeft = fabPos.x < window.innerWidth / 2;
      const snapped = clampFab(snapLeft ? 8 : window.innerWidth - size - 8, fabPos.y);
      setFabPos(snapped);
      persistFab(snapped);
    },
    [clampFab, fabPos, persistFab]
  );

  useEffect(() => {
    if (!fabDragging) return;
    const onPointerUp = () => finishFabDrag(true);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);
    return () => {
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [fabDragging, finishFabDrag]);

  useEffect(() => {
    const key = "emergency_fab_pos_v1";
    const size = 56;
    const load = () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const p = JSON.parse(raw) as { x?: number; y?: number };
          if (typeof p.x === "number" && typeof p.y === "number") {
            setFabPos(clampFab(p.x, p.y));
            return;
          }
        }
      } catch {
        /* ignore */
      }
      const right = 16;
      const bottom = 80;
      const x = window.innerWidth - size - right;
      const y = window.innerHeight - size - (88 + bottom);
      setFabPos(clampFab(x, y));
    };
    load();
    const onResize = () => {
      setFabPos((p) => (p ? clampFab(p.x, p.y) : p));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampFab]);

  const [notifications, setNotifications] = useState<
    {
      id: string;
      type?: string;
      title: Record<string, string>;
      message: Record<string, string>;
      isRead: boolean;
      createdAt: string;
    }[]
  >([]);

  const emp = state.kind === "employee" ? state.user : null;
  const [empCategoryCode, setEmpCategoryCode] = useState<string | null>(emp?.category?.code ?? null);
  // used only to keep navbar role icon in sync with backend
  void empCategoryCode;

  useEffect(() => {
    const userId = emp?.id || "guest";
    const seen = localStorage.getItem(`averda_onboarding_seen_${userId}`);
    if (!seen) setShowOnboarding(true);
  }, [emp]);

  // Pin the employee shell to the visible mobile viewport (avoids gap under bottom nav / clipped header).
  useEffect(() => {
    const root = document.documentElement;
    const syncViewport = () => {
      const vv = window.visualViewport;
      if (vv) {
        root.style.setProperty("--app-vv-top", `${Math.max(0, vv.offsetTop)}px`);
        root.style.setProperty("--app-vv-height", `${vv.height}px`);
      } else {
        root.style.removeProperty("--app-vv-top");
        root.style.removeProperty("--app-vv-height");
      }
    };
    syncViewport();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncViewport);
    vv?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);
    return () => {
      vv?.removeEventListener("resize", syncViewport);
      vv?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
      root.style.removeProperty("--app-vv-top");
      root.style.removeProperty("--app-vv-height");
    };
  }, []);

  // Employee shell is position:fixed — prevent the document from scrolling behind it.
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  // Ensure we always have the latest category code from the backend,
  // so the role icon in the navbar matches the one used on the home page card.
  useEffect(() => {
    if (!emp) return;
    let alive = true;
    void (async () => {
      try {
        const { data } = await userApi.me();
        const u = (data as {
          user: {
            category?: { code?: string } | null;
            assessmentCompleted?: boolean;
            assessmentScore?: number | null;
            hsseqCourseRequired?: boolean;
          };
        }).user;
        if (alive) {
          setEmpCategoryCode(u.category?.code ?? null);
          updateEmployeeUser({
            assessmentCompleted: u.assessmentCompleted,
            assessmentScore: u.assessmentScore,
            hsseqCourseRequired: u.hsseqCourseRequired,
          });
        }
      } catch {
        // non-blocking; fall back to auth state if request fails
        setEmpCategoryCode((prev) => prev ?? emp.category?.code ?? null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [emp?.id, emp?.category?.code, updateEmployeeUser]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      const insidePanel = menuRef.current && menuRef.current.contains(target);
      const insideBell = bellBtnRef.current && bellBtnRef.current.contains(target);
      if (!insidePanel && !insideBell) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // Desktop sidebar removed; active route handled by bottom tab bar.

  const LANG_SWITCH = [
    { code: "en" as const, flagSrc: "/flags/gb.svg", label: "EN" },
    { code: "fr" as const, flagSrc: "/flags/fr.svg", label: "FR" },
    { code: "ar" as const, flagSrc: "/flags/ma.svg", label: "AR" },
  ] as const;

  const currentLng = resolveCurrentLng(i18n.language);
  const isRTL = currentLng === "ar";

  const persistAppLanguage = useCallback(
    async (code: "ar" | "fr" | "en") => {
      persistLang(code);
      if (state.kind === "employee") {
        const L = code === "ar" ? "AR" : code === "fr" ? "FR" : "EN";
        try {
          await userApi.updateMe({ language: L });
          updateEmployeeUser({ language: L });
        } catch {
          /* still keep UI language */
        }
      }
    },
    [state.kind, updateEmployeeUser]
  );

  const openNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const { data } = await userApi.notifications();
      const rows = (data as { notifications: typeof notifications }).notifications;
      setNotifications(rows);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useLayoutEffect(() => {
    const el = headerRef.current;

    // When onboarding is open the header is unmounted; ensure the CSS var never becomes stale.
    if (!el) {
      document.documentElement.style.setProperty("--app-navbar-h", "0px");
      return;
    }

    const setVar = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--app-navbar-h", `${h}px`);
    };

    // Let layout settle (fonts / safe-area padding) before measuring.
    const raf1 = window.requestAnimationFrame(() => {
      setVar();
      window.requestAnimationFrame(setVar);
    });

    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    window.addEventListener("resize", setVar);
    return () => {
      window.cancelAnimationFrame(raf1);
      ro.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, [currentLng, showOnboarding]);

  useLayoutEffect(() => {
    const el = tabbarWrapRef.current;
    if (!el) {
      document.documentElement.style.setProperty("--app-tabbar-h", "0px");
      return;
    }
    const setVar = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--app-tabbar-h", `${h}px`);
    };
    const raf1 = window.requestAnimationFrame(() => {
      setVar();
      window.requestAnimationFrame(setVar);
    });
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    window.addEventListener("resize", setVar);
    return () => {
      window.cancelAnimationFrame(raf1);
      ro.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, [currentLng, showOnboarding]);

  const notifUi = useMemo(
    () => ({
      header: t("common.notifications"),
      empty: t("employee.layout.notificationsEmpty"),
      markAll: t("employee.layout.markAllRead"),
    }),
    [t]
  );

  const unreadCount = useMemo(
    () => notifications.reduce((n, x) => n + (x.isRead ? 0 : 1), 0),
    [notifications]
  );

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await userApi.readAllNotifications();
      setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
    } catch {
      toast(t("common.error"), "error");
    }
  }, [t, toast]);

  useEffect(() => {
    if (!emp) return;
    let alive = true;
    const loadNotifications = async () => {
      try {
        const { data } = await userApi.notifications();
        const rows = (data as { notifications: typeof notifications }).notifications;
        if (alive) setNotifications(rows);
      } catch {
        // non-blocking
      }
    };
    void loadNotifications();
    const intervalId = window.setInterval(() => void loadNotifications(), 30_000);
    const onFocus = () => void loadNotifications();
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [emp]);

  const timeAgo = (iso: string) => {
    const dt = new Date(iso);
    const diffSec = Math.round((dt.getTime() - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(currentLng === "ar" ? "ar" : currentLng, {
      numeric: "auto",
    });
    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(diffSec, "second");
    const mins = Math.round(diffSec / 60);
    if (Math.abs(mins) < 60) return rtf.format(mins, "minute");
    const hrs = Math.round(mins / 60);
    if (Math.abs(hrs) < 24) return rtf.format(hrs, "hour");
    const days = Math.round(hrs / 24);
    return rtf.format(days, "day");
  };

  const renderNotifIcon = (n: {
    type?: string;
    title: Record<string, string>;
    message: Record<string, string>;
  }) => {
    const title =
      n.title?.[currentLng] ?? n.title?.en ?? n.title?.fr ?? n.title?.ar ?? "";
    const { icon, bg } = getNotifStyle(inferNotifType(n), title);
    return (
      <div
        className="notif-icon"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          flexShrink: 0,
        }}
        aria-hidden
      >
        {icon}
      </div>
    );
  };

  const notificationTarget = useCallback(
    (n: { title: Record<string, string>; message: Record<string, string> }) => {
      const title = n.title?.[currentLng] ?? n.title?.en ?? n.title?.fr ?? n.title?.ar ?? "";
      const msg = n.message?.[currentLng] ?? n.message?.en ?? n.message?.fr ?? n.message?.ar ?? "";
      const blob = `${title} ${msg}`.toLowerCase();
      if (blob.includes("badge") || blob.includes("شارة") || title.includes("🏅")) return "/badges";
      if (blob.includes("challenge") || blob.includes("défi") || blob.includes("تحد") || title.includes("🎯")) return "/challenges";
      if (blob.includes("course") || blob.includes("formation") || blob.includes("دورة") || blob.includes("تدريب")) return "/courses";
      if (isAssessmentNotification(n)) return null;
      if (isEpiNotification(n)) return null;
      return "/home";
    },
    [currentLng]
  );

  const goToAssessmentFromNotification = useCallback(() => {
    setNotifOpen(false);
    setNotifMobileOpen(false);
    const passed =
      state.kind === "employee" &&
      state.user.assessmentCompleted === true &&
      (state.user.assessmentScore ?? 0) >= 70;
    if (passed) {
      nav("/courses");
      return;
    }
    if (pathname === "/home") {
      dispatchFocusAssessmentQuiz();
      return;
    }
    nav("/home", { state: { focusAssessment: true } satisfies FocusAssessmentLocationState });
  }, [nav, pathname, state]);

  const goToEpiFromNotification = useCallback(() => {
    setNotifOpen(false);
    setNotifMobileOpen(false);
    if (pathname === "/profile") {
      dispatchFocusEpi();
      return;
    }
    nav("/profile", { state: { focusEpi: true } satisfies FocusEpiLocationState });
  }, [nav, pathname]);

  const handleNotificationClick = useCallback(
    async (n: { id: string; title: Record<string, string>; message: Record<string, string> }) => {
      try {
        await userApi.readNotification(n.id);
        setNotifications((ns) => ns.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      } catch {
        /* ignore */
      }
      if (isAssessmentNotification(n)) {
        goToAssessmentFromNotification();
        return;
      }
      if (isEpiNotification(n)) {
        try {
          const { data } = await userApi.notifications();
          const rows = (data as { notifications: typeof notifications }).notifications;
          setNotifications(rows);
        } catch {
          /* keep current list */
        }
        goToEpiFromNotification();
        return;
      }
      setNotifOpen(false);
      setNotifMobileOpen(false);
      const to = notificationTarget(n);
      nav(to ?? "/home");
    },
    [goToAssessmentFromNotification, goToEpiFromNotification, nav, notificationTarget]
  );

  const hideLayoutBack =
    (pathname.startsWith("/courses/") && pathname !== "/courses") || pathname.startsWith("/quiz/");

  const navigateBack = useCallback(() => {
    if (window.history.length > 1) nav(-1);
    else nav("/home");
  }, [nav]);

  return (
    <div
      className="fixed left-0 right-0 z-0 flex min-h-0 flex-col overflow-hidden bg-[#FAFAF7] font-employee text-[#1C1917] dark:bg-[#1C1917] dark:text-[#F5F5F4]"
      style={{
        top: "var(--app-vv-top, 0px)",
        height: "var(--app-vv-height, 100dvh)",
      }}
    >
      {showOnboarding && (
        <AverdaOnboarding
          userId={emp?.id || "guest"}
          lang={i18n.language as "en" | "fr" | "ar"}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {!showOnboarding && (
        <header
          ref={headerRef}
          className="fixed top-0 left-0 right-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-md shadow-sm dark:border-[#30363D] dark:bg-[#0D1117]/90"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 md:flex md:h-16 md:flex-nowrap md:items-center md:justify-between md:gap-4 md:px-6">
            {/* Mobile: simplified header (logo + avatar + bell + settings) */}
            <div className="md:hidden">
              <div className="flex min-h-[56px] items-center justify-between gap-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <img src={AverdaLogo} alt="Averda" className="h-8 w-auto shrink-0" />
                  <div className="min-w-0">
                    <div
                      className="truncate text-[12px] font-extrabold leading-tight text-[#1e3a5f] dark:text-[#F5F5F4]"
                      style={{ fontFamily: "'Nunito', 'DM Sans', 'Segoe UI', Arial, sans-serif" }}
                    >
                      Averda Academy
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    ref={bellBtnRef}
                    className="relative inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-900 shadow-sm transition hover:bg-averda/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-averda/25 dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100 dark:hover:bg-averda/20"
                    aria-label={t("common.notifications")}
                    aria-expanded={notifMobileOpen}
                    onClick={async () => {
                      setNotifMobileOpen(true);
                      await openNotifications();
                    }}
                  >
                    <Bell className="h-6 w-6" aria-hidden />
                    {unreadCount > 0 && (
                      <span className="absolute -end-1 -top-1 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-600 px-1 text-[12px] font-extrabold text-white shadow">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-900 shadow-sm transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100 dark:hover:bg-averda/20"
                    aria-label={t("employee.layout.settingsTitle")}
                  >
                    <Settings className="h-6 w-6" aria-hidden />
                  </button>
                </div>
              </div>

            </div>

            <div className="hidden min-w-0 items-center gap-2 md:flex">
              <img src={AverdaLogo} alt="Averda" className="h-10 w-auto shrink-0" />
              <div
                className="truncate text-xs font-extrabold leading-tight text-[#1e3a5f] dark:text-[#F5F5F4]"
                style={{ fontFamily: "'Nunito', 'DM Sans', 'Segoe UI', Arial, sans-serif" }}
              >
                Averda Academy
              </div>
            </div>

            {/* Desktop navigation moved to left sidebar */}
            <nav className="hidden md:block" aria-label={t("nav.employeeBar")} />

            <div className="relative hidden flex-nowrap items-center gap-2 whitespace-nowrap md:flex">
            <div
              className="me-1 inline-flex items-center rounded-full border border-black/10 bg-white/70 p-0.5 dark:border-[#30363D] dark:bg-[#0D1117]/60"
              role="group"
              aria-label={t("common.language")}
              dir="ltr"
            >
              {LANG_SWITCH.map((l) => {
                const active = currentLng === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => void persistAppLanguage(l.code)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-extrabold transition sm:px-2.5 ${
                      active
                        ? "bg-[#2E6198] text-white"
                        : "text-slate-600 hover:bg-averda/10 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-averda/20 dark:hover:text-white"
                    }`}
                    aria-pressed={active}
                  >
                    <img src={l.flagSrc} width="20" height="14" alt="" className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover" aria-hidden />
                    <span>{l.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              ref={bellBtnRef}
              className="relative inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-averda/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-averda/25 dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100 dark:hover:bg-averda/20"
              aria-label={t("common.notifications")}
              aria-expanded={notifOpen}
              onClick={async () => {
                const next = !notifOpen;
                setNotifOpen(next);
                if (next) await openNotifications();
              }}
            >
              <Bell className="h-5 w-5" aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute -end-1 -top-1 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-600 px-1 text-[12px] font-extrabold text-white shadow">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-black/10 bg-white/70 px-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-averda/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-averda/25 dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100 dark:hover:bg-averda/20"
              aria-label={t("employee.layout.settingsTitle")}
            >
              <Settings className="h-5 w-5" aria-hidden />
            </button>

            {notifOpen && (
              <div
                ref={menuRef}
                className="absolute end-4 top-[calc(100%+8px)] z-50 w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-employee-border bg-employee-card shadow-2xl shadow-black/10"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className="flex items-center justify-between gap-3 border-b border-employee-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-employee-fg">
                      {notifUi.header}
                    </p>
                  </div>
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => void markAllNotificationsRead()}
                      className="rounded-full bg-averda/10 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 ease-in-out hover:bg-averda/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-averda/25"
                    >
                      {notifUi.markAll}
                    </button>
                  ) : (
                    <span className="w-[1px]" aria-hidden />
                  )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {notifLoading ? (
                    <div className="p-6 text-sm text-employee-muted">
                      {t("common.loading")}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                      <Bell className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                      <p className="text-sm text-employee-muted">
                        {notifUi.empty}
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-employee-border">
                      {notifications.map((n) => {
                        const title =
                          n.title?.[currentLng] ?? n.title?.en ?? n.title?.fr ?? n.title?.ar ?? "—";
                        const message =
                          n.message?.[currentLng] ?? n.message?.en ?? n.message?.fr ?? n.message?.ar ?? "—";
                        return (
                          <li
                            key={n.id}
                            className={`px-4 py-3 transition-all duration-200 ease-in-out hover:bg-employee-hover ${
                              n.isRead ? "" : "border-s-4 border-accent-indigo"
                            }`}
                          >
                            <button
                              type="button"
                              className="flex w-full items-start gap-3 text-start"
                              onClick={() => void handleNotificationClick(n)}
                            >
                              {renderNotifIcon(n)}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-employee-fg">
                                  {title}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-sm text-employee-muted">
                                  {message}
                                </p>
                              </div>
                              <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                                {timeAgo(n.createdAt)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </header>
      )}

      {/* Mobile settings drawer */}
      {!showOnboarding && settingsOpen && (
        <div className="fixed inset-0 z-[200]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("common.close")}
            onClick={() => setSettingsOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-[#E7E5E4] bg-white p-5 shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117] md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:w-[min(92vw,520px)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:border md:p-6"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
            role="dialog"
            aria-label={t("employee.layout.settingsTitle")}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                {t("employee.layout.settingsTitle")}
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-900 transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100 dark:hover:bg-averda/20"
                onClick={() => setSettingsOpen(false)}
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-2 text-sm font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                  {t("common.language")}
                </div>
                <div className="space-y-2">
                  {(
                    [
                      { code: "en" as const, labelKey: "common.langEnglish" },
                      { code: "fr" as const, labelKey: "common.langFrench" },
                      { code: "ar" as const, labelKey: "common.langArabic" },
                    ] as const
                  ).map((l) => {
                    const active = currentLng === l.code;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          void persistAppLanguage(l.code);
                          setSettingsOpen(false);
                        }}
                        className={`flex min-h-[56px] w-full items-center justify-between rounded-2xl border px-4 text-start text-sm font-extrabold transition active:scale-[0.97] ${
                          active
                            ? "border-averda bg-averda/10 text-averda dark:border-white/15 dark:bg-white/10 dark:text-white"
                            : "border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-averda/10 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F5F5F4] dark:hover:bg-averda/20"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <img
                            src={LANG_SWITCH.find((x) => x.code === l.code)?.flagSrc}
                            width="20"
                            height="14"
                            alt=""
                            className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
                            aria-hidden
                          />
                          {t(l.labelKey)}
                        </span>
                        {active && <span aria-hidden>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                  {t("employee.layout.appearance")}
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex min-h-[56px] w-full items-center justify-between rounded-2xl border border-[#E7E5E4] bg-white px-4 text-sm font-extrabold text-[#1C1917] transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F5F5F4] dark:hover:bg-averda/20"
                >
                  <span className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-averda dark:text-white" aria-hidden />
                    {t("employee.layout.darkMode")}
                  </span>
                  <span
                    className={`relative h-[28px] w-[52px] shrink-0 rounded-full transition-colors ${
                      theme === "dark" ? "bg-averda" : "bg-[#D6D3D1]"
                    }`}
                    dir="ltr"
                    aria-hidden
                  >
                    <span
                      className="absolute top-[3px] left-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform duration-200 ease"
                      style={{ transform: theme === "dark" ? "translateX(24px)" : "translateX(0px)" }}
                    />
                  </span>
                </button>
              </div>

              <div className="pt-2">
                <div className="mb-2 text-sm font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                  {t("employee.layout.aboutAverda")}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    setShowOnboarding(true);
                  }}
                  className="flex min-h-[56px] w-full items-center justify-between rounded-2xl border border-[#E7E5E4] bg-white px-4 text-start text-sm font-extrabold text-[#1C1917] transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F5F5F4] dark:hover:bg-averda/20"
                >
                  <span>{t("employee.layout.aboutAverdaCta")}</span>
                  <span aria-hidden style={{ direction: "ltr" }}>
                    →
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile notifications drawer */}
      {!showOnboarding && notifMobileOpen && (
        <div className="fixed inset-0 z-[210] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("common.close")}
            onClick={() => setNotifMobileOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-employee-border bg-employee-card shadow-2xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
            role="dialog"
            aria-label={t("common.notifications")}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between gap-3 px-5 pt-5">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-900 transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100 dark:hover:bg-averda/20"
                onClick={() => setNotifMobileOpen(false)}
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
              <div className="text-lg font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                {notifUi.header}
              </div>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAllNotificationsRead()}
                  className="rounded-full bg-averda/10 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-averda/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-averda/25"
                >
                  {notifUi.markAll}
                </button>
              ) : (
                <span className="w-10" aria-hidden />
              )}
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto px-5 pb-2">
              {notifLoading ? (
                <div className="py-10 text-center text-sm text-[#57534E] dark:text-stone-400">
                  {t("common.loading")}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Bell className="h-7 w-7 text-slate-400 dark:text-slate-500" aria-hidden />
                  <p className="text-sm text-[#57534E] dark:text-stone-400">{notifUi.empty}</p>
                </div>
              ) : (
                <ul className="divide-y divide-employee-border overflow-hidden rounded-2xl border border-employee-border bg-employee-card">
                  {notifications.map((n) => {
                    const title = n.title?.[currentLng] ?? n.title?.en ?? n.title?.fr ?? n.title?.ar ?? "—";
                    const message =
                      n.message?.[currentLng] ?? n.message?.en ?? n.message?.fr ?? n.message?.ar ?? "—";
                    return (
                      <li
                        key={n.id}
                        className={`px-4 py-3 transition hover:bg-employee-hover ${
                          n.isRead ? "" : "border-s-4 border-averda"
                        }`}
                      >
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 text-start"
                          onClick={() => void handleNotificationClick(n)}
                        >
                          {renderNotifIcon(n)}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
                              {title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-sm text-[#57534E] dark:text-stone-400">
                              {message}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                            {timeAgo(n.createdAt)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scroll region: flex-1 + min-h-0 so overflow-y-auto on <main> always gets a bounded height (mobile + desktop). */}
      <div className="flex min-h-0 flex-1 flex-col">
        <motion.main
          ref={mainRef}
          data-employee-main-scroll
          className="mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-5 touch-pan-y"
          style={{
            paddingTop: "calc(var(--app-navbar-h, 64px) + var(--app-content-gap, 20px))",
            scrollPaddingTop: "calc(var(--app-navbar-h, 64px) + var(--app-content-gap, 20px))",
            paddingBottom: "var(--app-tabbar-h, 72px)",
            scrollPaddingBottom: "var(--app-tabbar-h, 72px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {!showOnboarding && pathname !== "/home" && (
            <>
              {!hideLayoutBack && (
                <div className="mb-4 flex">
                  <button
                    type="button"
                    onClick={navigateBack}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#E7E5E4] bg-white text-[#1C1917] shadow-sm transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#44403C] dark:bg-[#292524] dark:text-[#F5F5F4] dark:hover:bg-averda/20"
                    aria-label={t("common.back")}
                    style={{ direction: "ltr" }}
                  >
                    <ArrowLeft className="h-5 w-5" aria-hidden style={{ transform: "none" }} />
                  </button>
                </div>
              )}
            </>
          )}
          <Outlet />
        </motion.main>
      </div>
      {!showOnboarding && (
        <div ref={tabbarWrapRef} className="fixed bottom-0 left-0 right-0 z-50">
          <BottomTabBar />
        </div>
      )}

      {/* Emergency draggable FAB (visible on every screen) */}
      {!showOnboarding && fabPos && (
        <button
          ref={fabRef}
          type="button"
          onClick={() => {
            if (fabDragMoved.current) {
              fabDragMoved.current = false;
              return;
            }
            setEmergencyOpen(true);
          }}
          // Touch (mobile)
          onTouchStart={(e) => {
            const btn = fabRef.current;
            if (!btn) return;
            const t = e.touches[0];
            if (!t) return;
            fabDragMoved.current = false;
            fabDragStart.current = { x: t.clientX, y: t.clientY };
            dragging.current.active = true;
            setFabDragging(true);
            const rect = btn.getBoundingClientRect();
            dragging.current.dx = t.clientX - rect.left;
            dragging.current.dy = t.clientY - rect.top;
          }}
          onTouchMove={(e) => {
            if (!dragging.current.active) return;
            const t = e.touches[0];
            if (!t) return;
            const dx = t.clientX - fabDragStart.current.x;
            const dy = t.clientY - fabDragStart.current.y;
            if (Math.hypot(dx, dy) > 8) fabDragMoved.current = true;
            e.preventDefault();
            setFabPos(clampFab(t.clientX - dragging.current.dx, t.clientY - dragging.current.dy));
          }}
          onTouchEnd={() => finishFabDrag(true)}
          // Mouse (desktop)
          onMouseDown={(e) => {
            const btn = fabRef.current;
            if (!btn) return;
            fabDragMoved.current = false;
            fabDragStart.current = { x: e.clientX, y: e.clientY };
            dragging.current.active = true;
            setFabDragging(true);
            const rect = btn.getBoundingClientRect();
            dragging.current.dx = e.clientX - rect.left;
            dragging.current.dy = e.clientY - rect.top;
          }}
          onMouseMove={(e) => {
            if (!dragging.current.active) return;
            const dx = e.clientX - fabDragStart.current.x;
            const dy = e.clientY - fabDragStart.current.y;
            if (Math.hypot(dx, dy) > 8) fabDragMoved.current = true;
            setFabPos(clampFab(e.clientX - dragging.current.dx, e.clientY - dragging.current.dy));
          }}
          onMouseUp={() => finishFabDrag(true)}
          className="fixed z-[290] grid h-14 w-14 place-items-center rounded-full bg-red-600 text-white shadow-xl active:scale-[0.97]"
          style={{
            left: fabPos.x,
            top: fabPos.y,
            boxShadow: "0 12px 30px rgba(220,38,38,0.35)",
            transition: fabDragging ? "none" : "all 0.3s ease",
            touchAction: "none",
          }}
          aria-label={t("employee.layout.emergencyFab")}
          title={t("employee.layout.emergencyFab")}
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-red-500/40 animate-ping" aria-hidden />
          <Siren className="relative h-7 w-7 animate-pulse" aria-hidden />
        </button>
      )}

      {emergencyOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/40"
          role="dialog"
          aria-modal="true"
          dir={isRTL ? "rtl" : "ltr"}
          onClick={() => setEmergencyOpen(false)}
        >
          <div className="mx-auto flex min-h-full max-w-lg items-center justify-center p-4">
            <div
              className="w-full rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[18px] font-extrabold text-[#1C1917] dark:text-white">
                    {t("employee.layout.emergencyTitle")}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#57534E] dark:text-stone-300">
                    {t("employee.layout.emergencySubtitle")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmergencyOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-[#1C1917] transition hover:bg-[#FAFAF9] active:scale-[0.97] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  aria-label={t("common.close")}
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEmergencyOpen(false)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#E7E5E4] bg-white px-4 text-sm font-extrabold text-[#1C1917] transition hover:bg-[#FAFAF9] active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white dark:hover:bg-white/5"
                >
                  {t("employee.layout.emergencyCancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmergencyOpen(false);
                    window.open("tel:+212600000000");
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.97] dark:bg-red-600 dark:hover:bg-red-500"
                >
                  {t("employee.layout.emergencyCall")} 📞
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
