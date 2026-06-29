/**
 * AVERDA ACADEMY — ADMIN DASHBOARD (Complete Overhaul)
 *
 * CURSOR INSTRUCTIONS:
 * 1. Replace the content of your AdminDashboard.tsx (or AdminPage.tsx) with this file
 * 2. Make sure these API routes exist on your Express server (see REQUIRED ROUTES section below)
 * 3. All data hooks call your existing /api/admin/* and /api/epi/* endpoints
 *
 * REQUIRED BACKEND ROUTES (add to server/src/routes/admin.ts):
 * GET /api/admin/stats          → { activeEmployees, completedCoursesThisWeek, avgQuizScore, needsFollowUp }
 * GET /api/admin/employees      → Employee[] with progress fields
 * GET /api/admin/epi            → EpiEmployee[] with measurements + status
 * GET /api/admin/courses        → Course[] with completion stats
 * GET /api/admin/analytics      → { weeklyCompletions[], completionHeatmap[], problematicQuestions[] }
 * GET /api/admin/activity       → ActivityLog[] (recent actions)
 *
 * These likely already exist — just ensure they return the shape described in the types below.
 */

import { useState, useEffect, useCallback, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, BarChart2, BookOpen, Briefcase, HardHat, Home, Pencil, RefreshCw, Settings, Trash2, Users, X, type LucideIcon } from "lucide-react";
import { COLORS, SIDEBAR } from "@/components/admin/adminThemeTokens";
import { ConfirmDeleteModal } from "@/components/admin/ConfirmDeleteModal";
import { EditEmployeeModal, type EditEmployeeTarget } from "@/components/admin/EditEmployeeModal";
import { LanguageSwitcherCompact } from "@/components/LanguageSwitcherCompact";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDashboardI18n, epiDisplayStatusLabel, epiStatusLabel, employeeStatusLabel, courseTitleForLang, categoryLabel, type CategoryLang } from "@/pages/admin/dashboardI18n";
import { CATEGORY_ORDER, CATEGORIES, categoryKeyFromCode, type CategoryKey } from "@/config/categories";
import { adminApi } from "@/api/api";
import client from "@/api/client";
import { isAxiosError } from "axios";
import { CourseCardGrid, courseCardCellClassName } from "@/components/employee/CourseCardGrid";
import {
  courseCardContentStyle,
  courseCardStatusStyle,
  courseCardThumbnailStyle,
  courseCardTitleStyle,
  courseCardWrapperStyle,
} from "@/components/employee/courseCardLayout";
import { getColorFromEmoji } from "@/utils/getColorFromEmoji";
import { resolveCourseCardVisual } from "@/data/courseSlugCardVisuals";
import { AdminCourseFormModal, type AdminCourseFormEdit } from "@/components/admin/AdminCourseFormModal";
import { IssueEpiModal, type IssueEpiEmployee } from "@/components/admin/IssueEpiModal";
import { AdminExportDropdown } from "@/components/admin/AdminExportDropdown";
import { AdminCategoryRoleSelect } from "@/components/admin/AdminCategoryRoleSelect";
import { AdminEmployeeStatusSelect, type EmployeeStatusFilter } from "@/components/admin/AdminEmployeeStatusSelect";
import { EpiExpiryCalendar } from "@/components/admin/EpiExpiryCalendar";
import { EpiItemDetailModal } from "@/components/admin/EpiItemDetailModal";
import { loadDashboardEpiEmployees } from "@/utils/loadDashboardEpiEmployees";
import { getExpiryLabel } from "@/utils/epiExpiry";
import { getDisplayStatus, getEmployeeEpiPillFlags, getStatusLabel } from "@/utils/epiStatus";
import type { DashboardEpiEmployee, DashboardEpiItem } from "@/utils/mapEpiSummaryToDashboard";
import { SettingsView } from "@/pages/admin/SettingsPage";
import { Certificate } from "@/components/employee/Certificate";
import { resolveCertificateLocale } from "@/utils/certificateTemplate";
import "@/pages/employee/courseCardsMobile.css";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  activeEmployees: number;
  completedCoursesThisWeek: number;
  avgQuizScore: number;
  needsFollowUp: number;
  totalEmployees: number;
  totalCourses: number;
}

interface Employee {
  id: string;
  employeeCode?: string;
  name: string;
  role: string;
  roleLabel: string;
  categoryKey?: CategoryKey;
  categoryId?: string | null;
  truckNumber?: string | null;
  avgScore: number;
  completedCourses: number;
  totalCourses: number;
  status: "not_started" | "in_progress" | "completed";
  lastActivity: string;
  group?: string;
  assessmentCompleted?: boolean;
  assessmentScore?: number | null;
  assessmentTakenAt?: string | null;
  isActive?: boolean;
  language?: "AR" | "FR" | "EN";
}

function employeeHasCertificate(emp: Employee): boolean {
  return (
    emp.totalCourses > 0 &&
    emp.completedCourses >= emp.totalCourses &&
    emp.avgScore >= 70
  );
}

type EpiEmployee = DashboardEpiEmployee;

interface Course {
  id: string;
  slug?: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  icon: string;
  coverColor: string;
  categoryCodes: CategoryKey[];
  completionRate: number;
  avgScore: number;
  hasQuiz: boolean;
  enrolledCount: number;
  isHsseqFoundation?: boolean;
  isActive?: boolean;
}

function toI18nRecord(
  value: { ar?: string; fr?: string; en?: string } | string | undefined,
  fallback = "—"
): Record<string, string> {
  if (!value) return { ar: fallback, fr: fallback, en: fallback };
  if (typeof value === "string") return { ar: value, fr: value, en: value };
  return {
    ar: value.ar ?? fallback,
    fr: value.fr ?? value.en ?? fallback,
    en: value.en ?? value.fr ?? fallback,
  };
}

interface WeeklyCompletion {
  date: string;
  count: number;
}

interface ActivityLog {
  id: string;
  employeeId: string;
  employeeName: string;
  action: string;
  detail: string;
  timestamp: string;
  type: "epi" | "quiz" | "course" | "login";
}

interface HeatmapCell {
  employeeId: string;
  employeeName: string;
  courseId: string;
  courseTitle: string;
  completed: boolean;
  score?: number;
}

// ─── API (shared axios client — same proxy + auth refresh as rest of admin app) ─

async function fetchApi<T>(path: string): Promise<T> {
  try {
    const { data } = await client.get<T>(path);
    return data;
  } catch (e) {
    if (isAxiosError(e)) {
      if (e.response) {
        throw new Error(`API error ${e.response.status}: ${path}`);
      }
      throw new Error("ADMIN_SERVER_UNREACHABLE");
    }
    throw e;
  }
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────

type RefetchOptions = { silent?: boolean };

function useApiData<T>(url: string, deps: unknown[] = []) {
  const { t } = useTranslation();
  const [data, setData] = useState<T | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (options?: RefetchOptions): Promise<boolean> => {
    const silent = Boolean(options?.silent && hasLoadedRef.current);
    if (!silent) {
      setError(null);
      if (!hasLoadedRef.current) setInitialLoading(true);
    }
    try {
      const result = await fetchApi<T>(url);
      setData(result);
      hasLoadedRef.current = true;
      return true;
    } catch (e) {
      if (!silent) {
        const msg =
          e instanceof Error && e.message === "ADMIN_SERVER_UNREACHABLE"
            ? t("admin.page.errors.serverHint")
            : e instanceof Error
              ? e.message
              : t("admin.page.errors.connection");
        setError(msg);
      }
      return false;
    } finally {
      if (!silent) setInitialLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => {
    void load();
  }, [load]);
  return { data, initialLoading, error, refetch: load };
}

function formatUpdateTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}

type ApiAdminCourse = {
  id: string;
  slug?: string;
  icon?: string;
  coverColor?: string;
  title?: { ar?: string; fr?: string; en?: string } | string;
  description?: { ar?: string; fr?: string; en?: string } | string;
  isHsseqFoundation?: boolean;
  isActive?: boolean;
  categories?: { code?: string; name?: { ar?: string } }[];
  completionRate?: number;
  quiz?: { id: string } | null;
  hasLessonQuiz?: boolean;
  hasQuiz?: boolean;
};

/** Map GET /api/admin/courses → one row per course (same shape as employee CourseCard). */
function mapAdminCoursesToDashboard(raw: unknown): Course[] {
  const list: ApiAdminCourse[] | undefined = Array.isArray(raw)
    ? (raw as ApiAdminCourse[])
    : (raw as { courses?: ApiAdminCourse[] })?.courses;
  if (!list?.length) return [];

  return list.map((c) => {
    const rawIcon = String(c.icon ?? "📘").trim();
    const rawCover = String(c.coverColor ?? "").trim();
    const { icon, coverColor } = resolveCourseCardVisual(c.slug, rawIcon, rawCover || getColorFromEmoji(rawIcon));
    const categoryCodes = Array.from(
      new Set(
        (c.categories ?? [])
          .map((cat) => categoryKeyFromCode(cat.code))
          .filter((k): k is CategoryKey => k != null)
      )
    );

    return {
      id: c.id,
      slug: c.slug,
      title: toI18nRecord(c.title),
      description: c.description ? toI18nRecord(c.description, "") : undefined,
      icon,
      coverColor,
      categoryCodes,
      completionRate: c.completionRate ?? 0,
      avgScore: 0,
      hasQuiz: Boolean(c.hasQuiz ?? c.hasLessonQuiz ?? c.quiz),
      enrolledCount: 0,
      isHsseqFoundation: c.isHsseqFoundation,
      isActive: c.isActive !== false,
    };
  });
}

/** Roles with no training catalog yet — hide seeded placeholders; show empty state in admin. */
const CATEGORIES_WITHOUT_COURSES_YET: CategoryKey[] = ["parkAgent", "maintenance"];

function filterCoursesForAdminDashboard(courses: Course[]): Course[] {
  const pending = new Set(CATEGORIES_WITHOUT_COURSES_YET);
  return courses
    .map((c) => ({
      ...c,
      categoryCodes: c.categoryCodes.filter((code) => !pending.has(code)),
    }))
    .filter((c) => c.categoryCodes.length > 0);
}

function defaultCategoriesForCourseFilter(filter: "all" | CategoryKey): CategoryKey[] {
  return filter === "all" ? [...CATEGORY_ORDER] : [filter];
}

function courseToFormEdit(course: Course): AdminCourseFormEdit {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    icon: course.icon,
    coverColor: course.coverColor,
    categoryCodes: course.categoryCodes,
    isActive: course.isActive,
    hasQuiz: course.hasQuiz,
  };
}

type ApiAdminEmployeeRow = {
  id: string;
  employeeId: string;
  name: string;
  category?: { id?: string; code?: string; name?: { ar?: string } } | null;
  categoryId?: string | null;
  truckNumber?: string | null;
  coursesDone?: number;
  coursesTotal?: number;
  avgScore?: number;
  lastActiveAt?: string;
  status?: string;
  assessmentCompleted?: boolean;
  assessmentScore?: number | null;
  assessmentTakenAt?: string | null;
  isActive?: boolean;
  language?: "AR" | "FR" | "EN";
};

/** Map GET /api/admin/employees → dashboard Employee rows. */
function mapApiEmployeesToDashboard(raw: unknown): Employee[] {
  const rows: ApiAdminEmployeeRow[] = Array.isArray(raw)
    ? (raw as ApiAdminEmployeeRow[])
    : ((raw as { employees?: ApiAdminEmployeeRow[] })?.employees ?? []);
  if (!rows.length) return [];

  return rows.map((u) => {
    const catKey = categoryKeyFromCode(u.category?.code);
    const roleLabel = catKey ? CATEGORIES[catKey].label.ar : (u.category?.name?.ar ?? "—");
    return {
      id: u.id,
      employeeCode: u.employeeId,
      name: u.name,
      role: roleLabel,
      roleLabel,
      categoryKey: catKey ?? undefined,
      categoryId: u.categoryId ?? u.category?.id ?? null,
      truckNumber: u.truckNumber ?? null,
      avgScore: u.avgScore ?? 0,
      completedCourses: u.coursesDone ?? 0,
      totalCourses: u.coursesTotal ?? 0,
      status: (u.status as Employee["status"]) ?? "not_started",
      lastActivity: u.lastActiveAt ?? new Date().toISOString(),
      assessmentCompleted: u.assessmentCompleted ?? false,
      assessmentScore: u.assessmentScore ?? null,
      assessmentTakenAt: u.assessmentTakenAt ?? null,
      isActive: u.isActive ?? true,
      language: u.language,
    };
  });
}

/** Map GET /api/admin/stats (nested `stats` object) → dashboard KPI shape. */
function mapAdminStatsToDashboard(raw: unknown): DashboardStats | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const s = (root.stats as Record<string, unknown> | undefined) ?? root;
  if (s.activeEmployees === undefined && root.stats === undefined && root.activeEmployees === undefined) {
    return null;
  }
  const activeEmployees = Number(s.activeEmployees ?? 0);
  return {
    activeEmployees,
    completedCoursesThisWeek: Number(s.completionsWeek ?? s.completedCoursesThisWeek ?? 0),
    avgQuizScore: Number(s.avgQuizScore ?? 0),
    needsFollowUp: Number(s.atRiskCount ?? s.needsFollowUp ?? 0),
    totalEmployees: Number(s.totalEmployees ?? activeEmployees),
    totalCourses: Number(s.totalCourses ?? 0),
  };
}

/** Human-readable activity labels (localized). */
function formatActivityDetail(
  typeRaw: string,
  type: ActivityLog["type"],
  meta: Record<string, unknown>,
  t: (key: string, opts?: Record<string, unknown>) => string,
  lang: "ar" | "fr" | "en"
): string {
  const titleObj = meta.courseTitle;
  const courseTitle =
    typeof titleObj === "object" && titleObj !== null
      ? String((titleObj as Record<string, string>)[lang] ?? (titleObj as { ar?: string }).ar ?? "")
      : String(meta.courseTitle ?? "");
  const itemObj = meta.itemTitle;
  const itemTitle =
    typeof itemObj === "object" && itemObj !== null
      ? String((itemObj as Record<string, string>)[lang] ?? (itemObj as { ar?: string }).ar ?? "")
      : String(meta.itemTitle ?? "");

  if (type === "quiz" || typeRaw.includes("quiz")) {
    const label = courseTitle || t("admin.page.activity.course");
    return meta.score != null ? `${t("admin.quizResults.sectionTitle")}: ${label} — ${meta.score}%` : `${t("admin.quizResults.sectionTitle")}: ${label}`;
  }
  if (type === "epi" || typeRaw.includes("epi")) {
    const label = itemTitle || courseTitle || t("admin.page.activity.epiFallback");
    return t("admin.page.activity.epi", { label });
  }
  if (typeRaw.includes("course")) {
    return courseTitle
      ? `${t("admin.page.activity.course")}: ${courseTitle}`
      : t("admin.page.activity.courseProgress");
  }
  return t("admin.page.activity.platform");
}

/** Map GET /api/admin/activity → activity feed rows. */
function mapAdminActivityToDashboard(
  raw: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string,
  lang: "ar" | "fr" | "en"
): ActivityLog[] {
  const events = Array.isArray(raw)
    ? raw
    : (raw as { events?: unknown[] })?.events;
  if (!Array.isArray(events) || !events.length) return [];

  return events
    .filter((row) => String((row as { type?: string }).type ?? "") !== "employee_created")
    .map((row, index) => {
    const ev = row as {
      type?: string;
      at?: string;
      user?: { id?: string; employeeId?: string; name?: string };
      meta?: Record<string, unknown>;
    };
    const typeRaw = String(ev.type ?? "");
    let type: ActivityLog["type"] = "login";
    if (typeRaw.includes("epi")) type = "epi";
    else if (typeRaw.includes("quiz")) type = "quiz";
    else if (typeRaw.includes("course")) type = "course";

    const meta = ev.meta ?? {};
    const detail = formatActivityDetail(typeRaw, type, meta, t, lang);

    return {
      id: `${typeRaw}-${ev.user?.id ?? index}-${ev.at ?? index}`,
      employeeId: ev.user?.employeeId ?? ev.user?.id ?? "",
      employeeName: ev.user?.name ?? "—",
      action: typeRaw,
      detail,
      timestamp: ev.at ? String(ev.at) : new Date().toISOString(),
      type,
    };
  });
}

/** Map GET /api/admin/analytics/weekly → weekly chart rows. */
function mapWeeklyAnalyticsToDashboard(raw: unknown): WeeklyCompletion[] {
  const weeks = (raw as { weekly?: { week: string; rate: number }[] })?.weekly;
  if (!weeks?.length) return [];
  return weeks.map((w) => ({ date: w.week, count: w.rate }));
}

const ADD_EMPLOYEE_ROLE_OPTIONS: { key: CategoryKey; emoji: string }[] = [
  { key: "driver", emoji: "🚛" },
  { key: "loader", emoji: "📦" },
  { key: "sweeper", emoji: "🧹" },
  { key: "teamLeader", emoji: "👷" },
  { key: "parkAgent", emoji: "🏭" },
  { key: "maintenance", emoji: "🔧" },
];

// ─── DESIGN TOKENS (see adminThemeTokens.ts — CSS variables in index.css) ───

type RoleConfig = { label: string; color: string; bg: string; Icon: LucideIcon };

function roleFromCategory(key: keyof typeof CATEGORIES, extraLabels: string[] = []): Record<string, RoleConfig> {
  const c = CATEGORIES[key];
  const entry: RoleConfig = { label: c.label.ar, color: c.color, bg: c.bgColor, Icon: c.icon };
  const map: Record<string, RoleConfig> = { [c.label.ar]: entry };
  for (const label of extraLabels) map[label] = entry;
  return map;
}

const ROLE_CONFIG: Record<string, RoleConfig> = {
  ...roleFromCategory("driver"),
  ...roleFromCategory("sweeper", ["عامل كنس"]),
  ...roleFromCategory("loader"),
  ...roleFromCategory("teamLeader"),
  ...roleFromCategory("parkAgent"),
  ...roleFromCategory("maintenance"),
};

function getRoleConfig(role: string): RoleConfig {
  return ROLE_CONFIG[role] ?? { label: role, color: "#6B7280", bg: "var(--admin-surface-subtle)", Icon: Briefcase };
}

const RoleIcon = ({ role, size = 16, color }: { role: string; size?: number; color?: string }) => {
  const { Icon, color: roleColor } = getRoleConfig(role);
  return <Icon size={size} color={color ?? roleColor} strokeWidth={2.75} aria-hidden />;
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const map: Record<string, { color: string; bg: string }> = {
    not_started: { color: COLORS.gray, bg: COLORS.grayLight },
    in_progress: { color: COLORS.blue, bg: COLORS.blueLight },
    completed: { color: COLORS.green, bg: COLORS.greenLight },
    needs_followup: { color: COLORS.red, bg: COLORS.redLight },
    pending: { color: COLORS.orange, bg: COLORS.orangeLight },
    ok: { color: COLORS.green, bg: COLORS.greenLight },
    received: { color: COLORS.green, bg: COLORS.greenLight },
    not_issued: { color: COLORS.gray, bg: COLORS.grayLight },
  };
  const cfg = map[status] ?? { color: COLORS.gray, bg: COLORS.grayLight };
  const label = epiStatusLabel(t, status);
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
    }}>
      {label}
    </span>
  );
};

const ProgressBar = ({ value, max, color }: { value: number; max: number; color?: string }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  /** Default: neutral-positive (green) for any progress — partial course completion is not an error. */
  const barColor = color ?? (pct > 0 ? COLORS.green : COLORS.border);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 12, color: barColor, fontWeight: 600, minWidth: 32 }}>{pct}%</span>
    </div>
  );
};

const Avatar = ({ role, categoryKey, size = 36 }: { role: string; categoryKey?: CategoryKey | null; size?: number }) => {
  const { Icon, color } = categoryKey
    ? { Icon: CATEGORIES[categoryKey].icon, color: CATEGORIES[categoryKey].color }
    : getRoleConfig(role);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Icon size={Math.round(size * 0.5)} color={COLORS.white} strokeWidth={2.75} aria-hidden />
    </div>
  );
};

function DataLoadError({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 dark:border-red-900/50 dark:bg-red-950/30">
      <AlertCircle className="mb-3 text-red-400" size={32} />
      <p className="text-sm font-semibold text-red-700 dark:text-red-300">{t("admin.page.errors.loadData")}</p>
      <p className="mt-1 text-xs text-red-500 dark:text-red-400">{t("admin.page.errors.loadDataHint")}</p>
      <button
        type="button"
        onClick={() => (onRetry ? onRetry() : window.location.reload())}
        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs text-white transition-colors hover:bg-red-700"
      >
        {t("admin.page.errors.retry")}
      </button>
    </div>
  );
}

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
    <div style={{
      width: 32, height: 32, border: `3px solid ${COLORS.border}`,
      borderTopColor: COLORS.navy, borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
);

const EmptyState = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
  <div style={{ textAlign: "center", padding: "40px 20px", color: COLORS.textMuted }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: COLORS.text }}>{title}</div>
    {subtitle && <div style={{ fontSize: 13 }}>{subtitle}</div>}
  </div>
);

// ─── KPI CARD ─────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, unit = "", icon, color, trend }: {
  label: string; value: number | string; unit?: string;
  icon: string; color: string; trend?: { direction: "up" | "down" | "neutral"; label: string };
}) => (
  <div style={{
    background: COLORS.white,
    borderRadius: 16,
    padding: "20px 24px",
    borderInlineStart: `4px solid ${color}`,
    boxShadow: COLORS.shadow,
    display: "flex", flexDirection: "column", gap: 8,
    transition: "transform 0.2s, box-shadow 0.2s",
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <span style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 22 }}>{icon}</span>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 32, fontWeight: 800, color: COLORS.text, lineHeight: 1 }}>{value}</span>
      {unit && <span style={{ fontSize: 14, color: COLORS.textMuted }}>{unit}</span>}
    </div>
    {trend && (
      <div style={{ fontSize: 12, color: trend.direction === "up" ? COLORS.green : trend.direction === "down" ? COLORS.red : COLORS.gray }}>
        {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.label}
      </div>
    )}
  </div>
);

// ─── SECTION HEADER ───────────────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle, action }: {
  title: string; subtitle?: string;
  action?: { label: string; onClick: () => void };
}) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <div>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.text }}>{title}</h2>
      {subtitle && <p style={{ margin: "2px 0 0", fontSize: 13, color: COLORS.textMuted }}>{subtitle}</p>}
    </div>
    {action && (
      <button onClick={action.onClick} style={{
        padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${COLORS.navy}`,
        background: COLORS.btnBg, color: COLORS.brand, fontSize: 13, fontWeight: 600,
        cursor: "pointer",
      }}>
        {action.label}
      </button>
    )}
  </div>
);

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────

const activityIcon: Record<string, string> = {
  epi: "🦺", quiz: "📝", course: "📖", login: "🔐",
};

const ActivityFeed = ({ items, employees }: { items: ActivityLog[]; employees: Employee[] }) => {
  const { locale, nameOf } = useDashboardI18n();
  return (
  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
    {items.map((item, idx) => {
      const emp = employees.find(e => e.id === item.employeeId);
      return (
      <div key={item.id} style={{
        display: "flex", gap: 12, padding: "12px 0",
        borderBottom: idx < items.length - 1 ? `1px solid ${COLORS.border}` : "none",
      }}>
        {emp ? (
          <Avatar role={emp.role} size={36} />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: COLORS.grayLight, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 16, flexShrink: 0,
          }}>
            {activityIcon[item.type] ?? "📌"}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
            {nameOf(item.employeeName)}
            <span style={{ fontWeight: 400, color: COLORS.textMuted }}> — {item.detail}</span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
            {new Date(item.timestamp).toLocaleString(locale, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
          </div>
        </div>
      </div>
      );
    })}
  </div>
  );
};

// ─── EPI STATUS OVERVIEW ──────────────────────────────────────────────────────

type EpiStatusFilter = "all" | "ok" | "needs_followup" | "pending" | "renewal_requests";

const EpiStatusBar = ({
  employees,
  activeFilter,
  onFilterChange,
  renewalRequestCount,
  extraRight,
}: {
  employees: EpiEmployee[];
  activeFilter: EpiStatusFilter;
  onFilterChange: (filter: EpiStatusFilter) => void;
  renewalRequestCount: number;
  extraRight?: ReactNode;
}) => {
  const { t } = useTranslation();
  const ok = employees.filter((e) =>
    getEmployeeEpiPillFlags(
      e.items.map((it) => ({
        status: it.status,
        name: it.label,
        receivedDate: it.lastIssued ?? null,
        nextReplacementAt: it.nextReplacementAt ?? null,
      })),
      e.pendingRequests
    ).ready
  ).length;
  const followup = employees.filter((e) =>
    getEmployeeEpiPillFlags(
      e.items.map((it) => ({
        status: it.status,
        name: it.label,
        receivedDate: it.lastIssued ?? null,
        nextReplacementAt: it.nextReplacementAt ?? null,
      })),
      e.pendingRequests
    ).needsFollowup
  ).length;
  const pending = employees.filter((e) =>
    getEmployeeEpiPillFlags(
      e.items.map((it) => ({
        status: it.status,
        name: it.label,
        receivedDate: it.lastIssued ?? null,
        nextReplacementAt: it.nextReplacementAt ?? null,
      })),
      e.pendingRequests
    ).pending
  ).length;

  const chips: { id: EpiStatusFilter; labelKey: string; count: number; color: string; bg: string }[] = [
    { id: "ok", labelKey: "admin.page.epi.ready", count: ok, color: COLORS.green, bg: COLORS.greenLight },
    { id: "needs_followup", labelKey: "admin.page.epi.needsFollowup", count: followup, color: COLORS.red, bg: COLORS.redLight },
    { id: "pending", labelKey: "admin.page.epi.pending", count: pending, color: COLORS.orange, bg: COLORS.orangeLight },
    {
      id: "renewal_requests",
      labelKey: "admin.page.epi.renewalRequests",
      count: renewalRequestCount,
      color: COLORS.purple,
      bg: COLORS.purpleLight,
    },
  ];

  const chipButtonStyle = (active: boolean, color: string, bg: string): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px",
    borderRadius: 20,
    background: active ? color : bg,
    color: active ? COLORS.white : color,
    fontSize: 13,
    fontWeight: 600,
    border: active ? `2px solid ${color}` : `2px solid transparent`,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: active ? `0 2px 8px ${color}40` : "none",
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
      <button
        type="button"
        onClick={() => onFilterChange("all")}
        style={chipButtonStyle(activeFilter === "all", COLORS.navy, COLORS.grayLight)}
      >
        <span style={{ fontSize: 18, fontWeight: 800 }}>{employees.length}</span>
        <span>{t("admin.page.common.all")}</span>
      </button>
      {chips.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onFilterChange(activeFilter === s.id ? "all" : s.id)}
          style={chipButtonStyle(activeFilter === s.id, s.color, s.bg)}
        >
          <span style={{ fontSize: 18, fontWeight: 800 }}>{s.count}</span>
          <span>{t(s.labelKey)}</span>
        </button>
      ))}
      {extraRight ? <div style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 10 }}>{extraRight}</div> : null}
    </div>
  );
};

// ─── COMPLETION HEATMAP ───────────────────────────────────────────────────────

const CompletionHeatmap = ({ data, employees, courses }: {
  data: HeatmapCell[];
  employees: string[];
  courses: string[];
}) => {
  const { t } = useDashboardI18n();
  const cellSize = 28;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ minWidth: 100, textAlign: "start", padding: "4px 8px", color: COLORS.textMuted, fontWeight: 600 }}>{t("admin.page.table.employee")}</th>
            {courses.map(c => (
              <th key={c} style={{
                width: cellSize, padding: "4px 2px", color: COLORS.textMuted,
                fontWeight: 600, writingMode: "vertical-rl", maxWidth: cellSize,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                maxHeight: 80, fontSize: 10,
              }}>
                {c.length > 12 ? c.slice(0, 12) + "…" : c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp}>
              <td style={{ padding: "2px 8px", color: COLORS.text, fontWeight: 500, fontSize: 12, whiteSpace: "nowrap" }}>{emp}</td>
              {courses.map(course => {
                const cell = data.find(d => d.employeeName === emp && d.courseTitle === course);
                const title = cell?.completed ? `${cell.score ?? "—"}%` : "—";
                return (
                  <td key={course} style={{ padding: 2 }}>
                    <div title={title} style={{
                      width: cellSize - 4, height: cellSize - 4,
                      borderRadius: 4, background: cell?.completed ? COLORS.navy : COLORS.grayLight,
                      opacity: cell?.completed ? 1 : 0.4,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, color: COLORS.white, fontWeight: 700,
                    }}>
                      {cell?.completed ? (cell.score ? `${cell.score}` : "✓") : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: COLORS.textMuted }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: COLORS.navy, display: "inline-block" }} />
          {t("admin.page.status.completed")}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: COLORS.grayLight, display: "inline-block" }} />
          {t("admin.page.status.notStarted")}
        </span>
      </div>
    </div>
  );
};

// ─── WEEKLY CHART (vanilla SVG — no dependencies) ────────────────────────────

const WeeklyChart = ({ data }: { data: WeeklyCompletion[] }) => {
  const { t, locale } = useDashboardI18n();
  if (!data.length) return <EmptyState icon="📊" title={t("admin.page.analytics.noChartData")} subtitle={t("admin.page.analytics.noChartDataSub")} />;

  const rawMax = Math.max(...data.map(d => d.count), 0);
  const maxVal = rawMax === 0 ? 0 : rawMax;
  const yTicks = maxVal === 0 ? [0] : [0, 0.25, 0.5, 0.75, 1];
  const w = 560, h = 160, padL = 32, padB = 28, padT = 10, padR = 10;
  const chartW = w - padL - padR;
  const chartH = h - padB - padT;
  const stepX = chartW / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: padL + i * stepX,
    y: padT + chartH - (maxVal === 0 ? 0 : (d.count / maxVal) * chartH),
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${points[points.length - 1].x},${padT + chartH} L${points[0].x},${padT + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.navy} stopOpacity="0.15" />
          <stop offset="100%" stopColor={COLORS.navy} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {yTicks.map(t => {
        const y = maxVal === 0 ? padT + chartH : padT + chartH * (1 - t);
        const label = maxVal === 0 ? 0 : Math.round(maxVal * t);
        return (
          <g key={t}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke={COLORS.border} strokeWidth={0.5} />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={9} fill={COLORS.textMuted}>{label}</text>
          </g>
        );
      })}
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke={COLORS.navy} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={COLORS.white} stroke={COLORS.navy} strokeWidth={2} />
          {i % Math.max(1, Math.floor(data.length / 6)) === 0 && (
            <text x={p.x} y={h - 8} textAnchor="middle" fontSize={9} fill={COLORS.textMuted}>
              {new Date(p.date).toLocaleDateString(locale, { month: "short", day: "numeric" })}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────

type Tab = "dashboard" | "employees" | "epi" | "courses" | "analytics" | "settings";

const NAV_ITEMS: { id: Tab; labelKey: string; icon: LucideIcon }[] = [
  { id: "dashboard", labelKey: "admin.nav.dashboard", icon: Home },
  { id: "employees", labelKey: "admin.nav.employees", icon: Users },
  { id: "epi", labelKey: "admin.nav.epi", icon: HardHat },
  { id: "courses", labelKey: "admin.nav.courses", icon: BookOpen },
  { id: "analytics", labelKey: "admin.nav.analytics", icon: BarChart2 },
  { id: "settings", labelKey: "admin.nav.settings", icon: Settings },
];

function tabFromPath(pathname: string): Tab {
  if (pathname.startsWith("/admin/settings")) return "settings";
  return "dashboard";
}

// ─── VIEW COMPONENTS ──────────────────────────────────────────────────────────

function reminderSentStorageKey(employeeId: string) {
  return `reminder_sent_${employeeId}`;
}

function readReminderSentAt(employeeId: string): string | null {
  try {
    const sentAt = localStorage.getItem(reminderSentStorageKey(employeeId));
    if (!sentAt) return null;
    const diffMinutes = (Date.now() - new Date(sentAt).getTime()) / 60000;
    if (diffMinutes >= 1440) {
      localStorage.removeItem(reminderSentStorageKey(employeeId));
      return null;
    }
    return sentAt;
  } catch {
    return null;
  }
}

function saveReminderSentAt(employeeId: string): string {
  const iso = new Date().toISOString();
  try {
    localStorage.setItem(reminderSentStorageKey(employeeId), iso);
  } catch {
    /* ignore quota / private mode */
  }
  return iso;
}

function formatReminderSentAgo(sentAt: string, t: (k: string, o?: Record<string, unknown>) => string): string {
  const diffMinutes = (Date.now() - new Date(sentAt).getTime()) / 60000;
  if (diffMinutes < 1) return t("admin.page.assessment.justNow");
  if (diffMinutes < 60) return t("admin.page.assessment.minutesAgo", { n: Math.max(1, Math.floor(diffMinutes)) });
  if (diffMinutes < 1440) return t("admin.page.assessment.hoursAgo", { n: Math.max(1, Math.floor(diffMinutes / 60)) });
  return t("admin.page.assessment.justNow");
}

function assessmentRowFromEmployee(emp: Employee) {
  const completed = emp.assessmentCompleted === true;
  return {
    completed,
    attemptCount: completed ? 1 : 0,
    bestScore: completed && emp.assessmentScore != null ? emp.assessmentScore : null,
    completedAt: completed && emp.assessmentTakenAt ? emp.assessmentTakenAt : null,
  };
}

const AssessmentQuizSection = ({
  employees,
  stats,
  onToast,
}: {
  employees: Employee[];
  stats: DashboardStats;
  onToast: (msg: string) => void;
}) => {
  const { t, locale, nameOf, roleOf } = useDashboardI18n();
  const [reminderSentAt, setReminderSentAt] = useState<Record<string, string>>({});
  const [, setReminderTimeTick] = useState(0);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const emp of employees) {
      const sent = readReminderSentAt(emp.id);
      if (sent) map[emp.id] = sent;
    }
    setReminderSentAt(map);
  }, [employees]);

  useEffect(() => {
    const id = window.setInterval(() => setReminderTimeTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const rows = useMemo(
    () =>
      employees.map((emp) => ({
        emp,
        ...assessmentRowFromEmployee(emp),
      })),
    [employees]
  );

  const completedCount = rows.filter((r) => r.completed).length;
  const notStartedCount = Math.max(0, employees.length - completedCount);

  const sendReminder = async (emp: Employee) => {
    if (!window.confirm(t("admin.page.assessment.reminderConfirm", { name: nameOf(emp.name) }))) return;
    try {
      await adminApi.notifyEmployee(emp.id, { type: "assessment" });
      onToast(t("admin.page.assessment.reminderSent"));
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 429) {
        onToast(t("admin.page.assessment.reminderRecent"));
        const iso = saveReminderSentAt(emp.id);
        setReminderSentAt((prev) => ({ ...prev, [emp.id]: iso }));
        return;
      }
      onToast(t("admin.page.assessment.reminderFailed"));
      return;
    }
    const iso = saveReminderSentAt(emp.id);
    setReminderSentAt((prev) => ({ ...prev, [emp.id]: iso }));
  };

  const thStyle: CSSProperties = {
    textAlign: "start",
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.textMuted,
    borderBottom: `1px solid ${COLORS.border}`,
    whiteSpace: "nowrap",
  };

  const tdStyle: CSSProperties = {
    padding: "12px",
    fontSize: 13,
    color: COLORS.text,
    borderBottom: `1px solid ${COLORS.border}`,
    verticalAlign: "middle",
  };

  return (
    <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: COLORS.shadow }}>
      <SectionHeader
        title={t("admin.page.sections.assessmentQuiz")}
        subtitle={t("admin.page.sections.assessmentQuizSub", { n: stats.activeEmployees })}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.green,
            background: COLORS.greenLight,
          }}
        >
          {t("admin.page.sections.completedAssessment", { n: completedCount })}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.orange,
            background: COLORS.orangeLight,
          }}
        >
          {t("admin.page.sections.notStartedAssessment", { n: notStartedCount })}
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr>
              <th style={thStyle}>{t("admin.page.table.employee")}</th>
              <th style={thStyle}>{t("admin.page.table.status")}</th>
              <th style={thStyle}>{t("admin.page.table.attempts")}</th>
              <th style={thStyle}>{t("admin.page.table.bestScore")}</th>
              <th style={thStyle}>{t("admin.page.table.completionDate")}</th>
              <th style={thStyle}>{t("admin.page.table.action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: COLORS.textMuted }}>
                  {t("admin.page.table.noEmployees")}
                </td>
              </tr>
            ) : (
              rows.map(({ emp, completed, attemptCount, bestScore, completedAt }) => {
                const sentAt = reminderSentAt[emp.id];
                return (
                  <tr key={emp.id}>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar role={emp.role} size={36} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{nameOf(emp.name)}</div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              color: COLORS.textMuted,
                              marginTop: 2,
                            }}
                          >
                            <RoleIcon role={emp.role} size={13} />
                            {roleOf(emp.role, emp.categoryKey)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {completed ? (
                        <span style={{ color: COLORS.green, fontWeight: 700 }}>{t("admin.page.assessment.completed")} ✅</span>
                      ) : (
                        <span style={{ color: COLORS.orange, fontWeight: 700 }}>{t("admin.page.assessment.notStarted")} ⏳</span>
                      )}
                    </td>
                    <td style={tdStyle}>{attemptCount}</td>
                    <td style={tdStyle}>{bestScore != null ? `${bestScore}%` : "—"}</td>
                    <td style={tdStyle}>
                      {completedAt
                        ? new Date(completedAt).toLocaleDateString(locale, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td style={tdStyle}>
                      {completed ? (
                        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>—</span>
                      ) : sentAt ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                          <button
                            type="button"
                            disabled
                            title={t("admin.page.assessment.reminderCooldown")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "none",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "default",
                              background: COLORS.green,
                              color: COLORS.white,
                            }}
                          >
                            ✅ {t("admin.page.assessment.sent")}
                          </button>
                          <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>
                            {formatReminderSentAgo(sentAt, t)}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void sendReminder(emp)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "none",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            background: COLORS.navy,
                            color: COLORS.white,
                          }}
                        >
                          {t("admin.page.assessment.sendReminder")} 🔔
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DashboardView = ({
  stats, employees, epiEmployees, activity, weekly, onToast,
}: {
  stats: DashboardStats;
  employees: Employee[];
  epiEmployees: EpiEmployee[];
  activity: ActivityLog[];
  weekly: WeeklyCompletion[];
  onToast: (msg: string) => void;
}) => {
  const { t, nameOf, roleOf } = useDashboardI18n();
  const topEmployee = [...employees].sort((a, b) => b.avgScore - a.avgScore)[0];
  const atRisk = employees.filter(e => e.avgScore < 70 && e.completedCourses > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <KpiCard label={t("admin.page.kpi.activeEmployees")} value={stats.activeEmployees} icon="👥" color={COLORS.navy} trend={{ direction: "up", label: t("admin.page.kpi.fromTotal", { n: stats.totalEmployees }) }} />
        <KpiCard label={t("admin.page.kpi.completedWeek")} value={stats.completedCoursesThisWeek} icon="📚" color={COLORS.blue} trend={{ direction: stats.completedCoursesThisWeek > 0 ? "up" : "neutral", label: t("admin.page.kpi.thisWeek") }} />
        <KpiCard label={t("admin.page.kpi.avgQuiz")} value={stats.avgQuizScore} unit="%" icon="🎯" color={stats.avgQuizScore >= 70 ? COLORS.green : stats.avgQuizScore > 0 ? COLORS.orange : COLORS.gray} trend={{ direction: stats.avgQuizScore >= 70 ? "up" : "neutral", label: t("admin.page.kpi.avgAllAttempts") }} />
        <KpiCard label={t("admin.page.kpi.needsFollowup")} value={stats.needsFollowUp === 0 ? `✓ ${t("admin.page.kpi.none")}` : stats.needsFollowUp} icon={stats.needsFollowUp === 0 ? "✅" : "⚠️"} color={stats.needsFollowUp === 0 ? COLORS.green : COLORS.red} trend={stats.needsFollowUp === 0 ? { direction: "up", label: t("admin.page.kpi.allWell") } : { direction: "down", label: t("admin.page.kpi.needIntervention") }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: COLORS.shadow }}>
          <SectionHeader title={t("admin.page.sections.activityLog")} subtitle={t("admin.page.sections.activityLogSub")} />
          {activity.length ? <ActivityFeed items={activity.slice(0, 8)} employees={employees} /> : <EmptyState icon="📋" title={t("admin.page.sections.noActivity")} />}
        </div>
        <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: COLORS.shadow }}>
          <SectionHeader title={t("admin.page.sections.epiAlerts")} subtitle={t("admin.page.sections.epiAlertsSub")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {epiEmployees.filter(e => e.statusSummary !== "ok").slice(0, 5).map(emp => (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: COLORS.redLight, border: `1px solid ${COLORS.red}20` }}>
                <Avatar role={emp.role} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{nameOf(emp.name)}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{roleOf(emp.role, emp.categoryKey)} • {t("admin.page.sections.pendingRequest", { n: emp.pendingRequests })}</div>
                </div>
                <StatusBadge status="needs_followup" />
              </div>
            ))}
            {epiEmployees.filter(e => e.statusSummary !== "ok").length === 0 && (
              <EmptyState icon="✅" title={t("admin.page.sections.allEpiReady")} subtitle={t("admin.page.sections.noMissingEpi")} />
            )}
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: COLORS.shadow }}>
        <SectionHeader title={t("admin.page.sections.weeklyCompletion")} subtitle={t("admin.page.sections.weeklyCompletionSub")} />
        <WeeklyChart data={weekly} />
      </div>

      <AssessmentQuizSection employees={employees} stats={stats} onToast={onToast} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: COLORS.shadow }}>
          <SectionHeader title={t("admin.page.sections.topPerformers")} />
          {topEmployee && topEmployee.avgScore > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative" }}>
                <Avatar role={topEmployee.role} size={56} />
                <span style={{ position: "absolute", top: -4, right: -4, fontSize: 20 }}>🏆</span>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>{nameOf(topEmployee.name)}</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <RoleIcon role={topEmployee.role} size={16} />
                  {roleOf(topEmployee.role, topEmployee.categoryKey)}
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                  <span style={{ color: COLORS.green, fontWeight: 700 }}>{topEmployee.avgScore}% ⭐</span>
                  <span style={{ color: COLORS.textMuted }}>{t("admin.page.sections.coursesCompleted", { n: topEmployee.completedCourses })}</span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon="🏆" title={t("admin.page.sections.noDataYet")} subtitle={t("admin.page.sections.afterQuizzes")} />
          )}
        </div>
        <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: COLORS.shadow }}>
          <SectionHeader title={t("admin.page.sections.atRisk")} />
          {atRisk.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {atRisk.map(e => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar role={e.role} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{nameOf(e.name)}</div>
                    <ProgressBar
                      value={e.avgScore}
                      max={100}
                      color={e.avgScore >= 70 ? COLORS.green : e.avgScore >= 40 ? COLORS.orange : COLORS.red}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="✅" title={t("admin.page.sections.noAtRisk")} />
          )}
        </div>
      </div>
    </div>
  );
};

const EmployeesView = ({
  employees,
  onSelect,
  onEdit,
  onDelete,
}: {
  employees: Employee[];
  onSelect: (e: Employee) => void;
  onEdit: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}) => {
  const { t, locale, nameOf, roleOf, categoryLang } = useDashboardI18n();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | CategoryKey>("all");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>("all");
  const filtered = employees.filter(e => {
    const matchSearch = e.name.includes(search) || e.id.includes(search);
    const matchRole = roleFilter === "all" || e.categoryKey === roleFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        {[
          { label: t("admin.page.employees.total"), val: employees.length, color: COLORS.navy },
          { label: t("admin.page.employees.inProgress"), val: employees.filter(e => e.status === "in_progress").length, color: COLORS.blue },
          { label: t("admin.page.employees.completed"), val: employees.filter(e => e.status === "completed").length, color: COLORS.green },
          { label: t("admin.page.employees.notStarted"), val: employees.filter(e => e.status === "not_started").length, color: COLORS.gray },
        ].map(s => (
          <div key={s.label} style={{ background: COLORS.white, borderRadius: 12, padding: "14px 16px", borderTop: `3px solid ${s.color}`, boxShadow: COLORS.shadow }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input placeholder={t("admin.page.employees.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 180, padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, outline: "none", fontFamily: "inherit", background: COLORS.btnBg, color: COLORS.text }} />
        <AdminCategoryRoleSelect
          value={roleFilter}
          onChange={setRoleFilter}
          allLabel={t("admin.page.employees.allRoles")}
          categoryLang={categoryLang}
        />
        <AdminEmployeeStatusSelect
          value={statusFilter}
          onChange={setStatusFilter}
          allLabel={t("admin.page.employees.allStatuses")}
          getLabel={(status) => employeeStatusLabel(t, status)}
        />
      </div>
      <div style={{ background: COLORS.white, borderRadius: 16, overflow: "hidden", boxShadow: COLORS.shadow }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.navy }}>
              {[t("admin.page.table.employee"), t("admin.page.table.role"), t("admin.page.table.progress"), t("admin.page.table.avgScore"), t("admin.page.table.status"), t("admin.page.table.lastActive"), t("admin.page.table.actions")].map(h => (
                <th key={h} style={{ padding: "12px 16px", color: COLORS.white, fontSize: 13, fontWeight: 600, textAlign: "start" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, idx) => {
              const role = getRoleConfig(emp.role);
              return (
                <tr key={emp.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: idx % 2 === 0 ? COLORS.white : COLORS.cream }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = COLORS.blueLight}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? COLORS.white : COLORS.cream}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar role={emp.role} size={34} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{nameOf(emp.name)}</div>
                          {emp.categoryKey === "driver" && emp.truckNumber && (
                            <span title={emp.truckNumber} style={{ fontSize: 14, cursor: "help" }} aria-label={emp.truckNumber}>
                              🚛
                            </span>
                          )}
                          {employeeHasCertificate(emp) && (
                            <span
                              title={t("admin.page.employees.hasCertificate")}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 22,
                                height: 22,
                                borderRadius: 8,
                                background: "#FFF8E1",
                                border: "1px solid #C9A84C",
                                fontSize: 14,
                              }}
                            >
                              🏆
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{emp.employeeCode ?? emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: role.color, background: role.bg }}>
                      <RoleIcon role={emp.role} size={14} />
                      {roleOf(emp.role, emp.categoryKey)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", minWidth: 120 }}>
                    <ProgressBar value={emp.completedCourses} max={emp.totalCourses || 1} />
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{t("admin.page.employees.courseCount", { completed: emp.completedCourses, total: emp.totalCourses })}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: emp.avgScore >= 70 ? COLORS.green : emp.avgScore > 0 ? COLORS.orange : COLORS.gray }}>{emp.avgScore > 0 ? `${emp.avgScore}%` : "—"}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}><StatusBadge status={emp.status} /></td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textMuted }}>{new Date(emp.lastActivity).toLocaleDateString(locale)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button onClick={() => onSelect(emp)} style={{ padding: "5px 12px", borderRadius: 6, border: `1.5px solid ${COLORS.navy}`, background: COLORS.btnBg, color: COLORS.brand, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t("admin.page.employees.view")}</button>
                      <button
                        type="button"
                        onClick={() => onEdit(emp)}
                        title={t("admin.employees.edit")}
                        aria-label={t("admin.employees.edit")}
                        style={{ padding: "5px 8px", borderRadius: 6, border: `1.5px solid ${COLORS.border}`, background: COLORS.btnBg, color: COLORS.brand, cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(emp)}
                        title={t("admin.employees.delete")}
                        aria-label={t("admin.employees.delete")}
                        style={{ padding: "5px 8px", borderRadius: 6, border: `1.5px solid ${COLORS.red}`, background: COLORS.redLight, color: COLORS.red, cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState icon="🔍" title={t("admin.page.employees.noResults")} subtitle={t("admin.page.employees.tryFilters")} />}
      </div>
    </div>
  );
};

type EpiRenewalRequestRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  itemType: string;
  itemLabel: string;
  reason: string;
  note: string | null;
  createdAt: string;
};

const EpiView = ({
  employees,
  statusFilter,
  onStatusFilterChange,
  onIssueEpi,
  onRefreshEmployees,
  onPendingCountChange,
  onToast,
  syncToken,
}: {
  employees: EpiEmployee[];
  statusFilter: EpiStatusFilter;
  onStatusFilterChange: (filter: EpiStatusFilter) => void;
  onIssueEpi: (employee: EpiEmployee, itemCode?: string) => void;
  onRefreshEmployees: () => void;
  onPendingCountChange: (count: number) => void;
  onToast: (message: string) => void;
  /** Changes when parent refetches /api/admin/epi — reload renewal queue too. */
  syncToken: unknown;
}) => {
  const { t, locale, nameOf, roleOf, epiOf } = useDashboardI18n();
  const [search, setSearch] = useState("");
  const [pendingRequests, setPendingRequests] = useState<EpiRenewalRequestRow[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [selectedEpiItem, setSelectedEpiItem] = useState<{
    item: DashboardEpiItem;
    employee: DashboardEpiEmployee;
  } | null>(null);
  const [calendarMode, setCalendarMode] = useState(false);

  const loadPendingRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const { data } = await adminApi.epiRenewalRequests();
      const list = Array.isArray(data) ? (data as EpiRenewalRequestRow[]) : [];
      setPendingRequests(list);
      onPendingCountChange(list.length);
    } catch {
      setPendingRequests([]);
      onPendingCountChange(0);
    } finally {
      setRequestsLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    void loadPendingRequests();
  }, [loadPendingRequests, syncToken]);

  const formatRequestDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

  const handleApprove = async (req: EpiRenewalRequestRow) => {
    if (!window.confirm(t("admin.page.epi.approveConfirm", { item: req.itemLabel, name: nameOf(req.employeeName) }))) return;
    try {
      await adminApi.approveEpiRenewalRequest(req.id);
      setPendingRequests((prev) => {
        const next = prev.filter((r) => r.id !== req.id);
        onPendingCountChange(next.length);
        return next;
      });
      onToast(t("admin.page.epi.approveOk"));
      onRefreshEmployees();
    } catch {
      onToast(t("admin.page.epi.actionFailed"));
    }
  };

  const handleReject = async (req: EpiRenewalRequestRow) => {
    if (!window.confirm(t("admin.page.epi.rejectConfirm", { item: req.itemLabel, name: nameOf(req.employeeName) }))) return;
    try {
      await adminApi.rejectEpiRenewalRequest(req.id);
      setPendingRequests((prev) => {
        const next = prev.filter((r) => r.id !== req.id);
        onPendingCountChange(next.length);
        return next;
      });
      onToast(t("admin.page.epi.rejectOk"));
      onRefreshEmployees();
    } catch {
      onToast(t("admin.page.epi.actionFailed"));
    }
  };

  const isRenewalFilter = statusFilter === "renewal_requests";
  useEffect(() => {
    if (isRenewalFilter) setCalendarMode(false);
  }, [isRenewalFilter]);
  const renewalPreviewLimit = 3;
  const displayedRenewals = isRenewalFilter
    ? pendingRequests
    : pendingRequests.slice(0, renewalPreviewLimit);
  const hiddenRenewalCount = Math.max(0, pendingRequests.length - renewalPreviewLimit);

  const filtered = employees.filter((e) => {
    const flags = getEmployeeEpiPillFlags(
      e.items.map((it) => ({
        status: it.status,
        name: it.label,
        receivedDate: it.lastIssued ?? null,
        nextReplacementAt: it.nextReplacementAt ?? null,
      })),
      e.pendingRequests
    );
    if (statusFilter === "ok" && !flags.ready) return false;
    if (statusFilter === "needs_followup" && !flags.needsFollowup) return false;
    if (statusFilter === "pending" && !flags.pending) return false;
    if (statusFilter === "renewal_requests" && !flags.hasRenewalRequest) return false;
    if (!search.trim()) return true;
    const q = search.trim();
    return e.name.includes(q) || e.employeeCode.includes(q) || e.id.includes(q);
  });

  const emptyFilterMessage =
    statusFilter === "ok"
      ? t("admin.page.epi.noReady")
      : statusFilter === "needs_followup"
        ? t("admin.page.epi.noFollowup")
        : statusFilter === "pending"
          ? t("admin.page.epi.noPending")
          : t("admin.page.epi.noResults");

  const renderRenewalCard = (req: EpiRenewalRequestRow) => (
    <div
      key={req.id}
      style={{
        background: COLORS.orangeLight,
        border: `1px solid ${COLORS.orange}`,
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.text }}>
          🦺 {req.itemLabel}{" "}
          <span style={{ fontWeight: 600, color: COLORS.textMuted }}>{nameOf(req.employeeName)}</span>{" "}
          <span style={{ fontSize: 13 }}>👷</span>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>{req.employeeRole}</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: COLORS.text }}>
        <strong>{t("admin.page.epi.reason")}</strong> {req.reason}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: COLORS.textMuted }}>
        <strong>{t("admin.page.epi.since")}</strong> {formatRequestDate(req.createdAt)}
      </div>
      {req.note ? (
        <div style={{ marginTop: 6, fontSize: 13, color: COLORS.text, fontStyle: "italic" }}>
          {t("admin.page.epi.note")} &quot;{req.note}&quot;
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => void handleApprove(req)}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: "#16a34a",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ✓ {t("admin.page.epi.approve")}
        </button>
        <button
          type="button"
          onClick={() => void handleReject(req)}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: "#dc2626",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ✗ {t("admin.page.epi.reject")}
        </button>
      </div>
    </div>
  );

  const renderRenewalSection = (showViewAllLink: boolean) => (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>{t("admin.page.epi.pendingRenewals")}</h2>
          {pendingRequests.length > 0 && (
            <span style={{ background: COLORS.red, color: COLORS.white, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
              {t("admin.page.epi.newRequests", { n: pendingRequests.length })}
            </span>
          )}
        </div>
        {showViewAllLink && hiddenRenewalCount > 0 && (
          <button
            type="button"
            onClick={() => onStatusFilterChange("renewal_requests")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${COLORS.purple}`,
              background: COLORS.purpleLight,
              color: COLORS.purple,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("admin.page.epi.viewAll", { n: pendingRequests.length })}
          </button>
        )}
        {isRenewalFilter && (
          <button
            type="button"
            onClick={() => onStatusFilterChange("all")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.btnBg,
              color: COLORS.brand,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ← {t("admin.page.epi.backToEmployees")}
          </button>
        )}
      </div>
      {requestsLoading ? (
        <div style={{ padding: 16, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>{t("admin.page.epi.loading")}</div>
      ) : displayedRenewals.length === 0 ? (
        <div
          style={{
            padding: "20px 16px",
            borderRadius: 12,
            background: COLORS.greenLight,
            border: `1px solid ${COLORS.green}`,
            textAlign: "center",
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.green,
          }}
        >
          ✅ {t("admin.page.epi.noPendingRenewals")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayedRenewals.map(renderRenewalCard)}
          {showViewAllLink && hiddenRenewalCount > 0 && (
            <div style={{ textAlign: "center", fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>
              {t("admin.page.epi.moreRequests", { n: hiddenRenewalCount })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <EpiStatusBar
        employees={employees}
        activeFilter={statusFilter}
        onFilterChange={onStatusFilterChange}
        renewalRequestCount={pendingRequests.length}
        extraRight={
          <button
            type="button"
            onClick={() => setCalendarMode((v) => !v)}
            disabled={isRenewalFilter}
            title={isRenewalFilter ? t("admin.page.epi.calendarDisabled") : t("admin.page.epi.showCalendar")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 20,
              background: calendarMode ? COLORS.navy : COLORS.grayLight,
              color: calendarMode ? COLORS.white : COLORS.navy,
              fontSize: 13,
              fontWeight: 700,
              border: calendarMode ? `2px solid ${COLORS.navy}` : "2px solid transparent",
              cursor: isRenewalFilter ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              boxShadow: calendarMode ? "0 2px 8px rgba(26,60,94,0.25)" : "none",
              opacity: isRenewalFilter ? 0.6 : 1,
              transition: "all 0.15s",
              userSelect: "none",
            }}
          >
            📅 {t("admin.page.epi.calendar")}
          </button>
        }
      />

      {isRenewalFilter ? (
        renderRenewalSection(false)
      ) : (
        <>
          {pendingRequests.length > 0 && renderRenewalSection(true)}
          {calendarMode ? (
            <EpiExpiryCalendar epiData={employees} onIssueEpi={onIssueEpi} />
          ) : (
            <>
              <input
                placeholder={t("admin.page.employees.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${COLORS.border}`,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  background: COLORS.white,
                  borderRadius: 16,
                  border: `1.5px dashed ${COLORS.border}`,
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{emptyFilterMessage}</div>
                {statusFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => onStatusFilterChange("all")}
                    style={{
                      marginTop: 12,
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: COLORS.navy,
                      color: COLORS.white,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {t("admin.page.epi.showAll")}
                  </button>
                )}
              </div>
            ) : null}
            {filtered.map(emp => {
              const itemDisplays = emp.items.map((it) =>
                getDisplayStatus({
                  status: it.status,
                  name: it.label,
                  receivedDate: it.lastIssued ?? null,
                  nextReplacementAt: it.nextReplacementAt ?? null,
                })
              );
              const receivedCount = itemDisplays.filter((s) => s === "received").length;
              const totalCount = emp.items.length;
              const hasPending = itemDisplays.some((s) => s === "pending");
              const needsRenewal = itemDisplays.some((s) => s === "needs_renewal");
              const alertLevel = needsRenewal ? "danger" : hasPending ? "warning" : "ok";
              return (
                <div key={emp.id} style={{ background: COLORS.white, borderRadius: 16, overflow: "hidden", boxShadow: COLORS.shadow, borderInlineStart: `4px solid ${alertLevel === "danger" ? COLORS.red : alertLevel === "warning" ? COLORS.orange : COLORS.green}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: alertLevel === "danger" ? COLORS.redLight : alertLevel === "warning" ? COLORS.orangeLight : COLORS.greenLight }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar role={emp.role} categoryKey={emp.categoryKey} size={40} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{nameOf(emp.name)}</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>{emp.employeeCode} • {roleOf(emp.role, emp.categoryKey)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.brand }}>{receivedCount}/{totalCount}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{t("admin.page.epi.receivedLabel")}</div>
                      </div>
                      {emp.pendingRequests > 0 && <span style={{ background: COLORS.red, color: COLORS.white, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{t("admin.page.epi.pendingRequestBadge", { n: emp.pendingRequests })}</span>}
                      <button
                        type="button"
                        onClick={() => onIssueEpi(emp)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: COLORS.navy, color: COLORS.white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        📦 {t("admin.page.epi.sendEquipment")}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: "10px 20px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: `1px solid ${COLORS.border}` }}>
                    {Object.entries({
                      [t("admin.page.epi.measureShirt")]: emp.measurements.shirt,
                      [t("admin.page.epi.measurePants")]: emp.measurements.pants,
                      [t("admin.page.epi.measureShoes")]: emp.measurements.shoes,
                      [t("admin.page.epi.measureGloves")]: emp.measurements.gloves,
                      [t("admin.page.epi.measureVest")]: emp.measurements.vest,
                    }).map(([k, v]) => (
                      <span key={k} style={{ padding: "3px 10px", background: COLORS.grayLight, borderRadius: 20, fontSize: 12, color: COLORS.text }}>{k}: <strong>{v}</strong></span>
                    ))}
                  </div>
                  <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                    {emp.items.map(item => {
                      const visualStatus = getDisplayStatus({
                        status: item.status,
                        name: item.label,
                        receivedDate: item.lastIssued ?? null,
                        nextReplacementAt: item.nextReplacementAt ?? null,
                      });
                      const expiryHint = getExpiryLabel(item.labelAr, item.lastIssued ?? null, t);
                      const statusStyle = getStatusLabel(visualStatus);
                      const statusColor = statusStyle.color;
                      const statusBg = statusStyle.bgColor;
                      const statusLabel = epiDisplayStatusLabel(t, visualStatus);
                      const expiryTextColor =
                        expiryHint.color === "red" ? COLORS.red : expiryHint.color === "orange" ? COLORS.orange : expiryHint.color === "green" ? COLORS.green : COLORS.textMuted;
                      return (
                        <div
                          key={item.type}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedEpiItem({ item, employee: emp })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedEpiItem({ item, employee: emp });
                            }
                          }}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: statusBg,
                            border: `1px solid ${statusColor}20`,
                            cursor: "pointer",
                            transition: "box-shadow 0.15s ease",
                          }}
                          className="hover:shadow-md"
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                            <div style={{ fontSize: 20 }}>{item.emoji}</div>
                            {item.photoProofPath ? (
                              <span title={t("admin.page.epi.photoProof")} style={{ fontSize: 14 }} aria-hidden>
                                📷
                              </span>
                            ) : null}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{epiOf(item.type, item.label)}</div>
                          <div style={{ fontSize: 11, color: statusColor, fontWeight: 600, marginTop: 3 }}>{statusLabel}</div>
                          {expiryHint.text ? (
                            <div style={{ fontSize: 10, color: expiryTextColor, fontWeight: 700, marginTop: 3 }}>{expiryHint.text}</div>
                          ) : null}
                          {item.lastIssued && <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{new Date(item.lastIssued).toLocaleDateString(locale)}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
              </div>
            </>
          )}
        </>
      )}
      {selectedEpiItem ? (
        <EpiItemDetailModal
          selection={selectedEpiItem}
          onClose={() => setSelectedEpiItem(null)}
          onIssueRenewal={(employee, itemCode) => onIssueEpi(employee, itemCode)}
          onMutated={onRefreshEmployees}
        />
      ) : null}
    </div>
  );
};

function employeeRoleToCategoryKey(roleLabel: string): CategoryKey | null {
  const trimmed = roleLabel.trim();
  if (!trimmed) return null;
  const fromCode = categoryKeyFromCode(trimmed);
  if (fromCode) return fromCode;
  for (const key of CATEGORY_ORDER) {
    const def = CATEGORIES[key];
    if (def.label.ar === trimmed || def.label.fr === trimmed || def.label.en === trimmed) {
      return key;
    }
  }
  if (trimmed.includes("كناس") || trimmed.includes("عامل كنس") || trimmed.includes("عامل نظافة")) return "sweeper";
  if (trimmed.includes("سائق")) return "driver";
  if (trimmed.includes("شاحن") || trimmed.includes("عامل شحن")) return "loader";
  if (trimmed.includes("رئيس فريق")) return "teamLeader";
  if (trimmed.includes("عون الحظيرة") || trimmed.includes("الحظيرة")) return "parkAgent";
  if (trimmed.includes("عون الصيانة") || trimmed.includes("الصيانة")) return "maintenance";
  return null;
}

/** Active employees whose job category matches one of the course's assigned roles. */
function eligibleEmployeesForCourse(course: Course, employees: Employee[]): Employee[] {
  if (!employees.length || !course.categoryCodes.length) return [];
  return employees.filter((emp) => {
    if (emp.isActive === false) return false;
    const key = emp.categoryKey ?? employeeRoleToCategoryKey(emp.role);
    return key != null && course.categoryCodes.includes(key);
  });
}

function formatCourseRolesLabel(categoryCodes: CategoryKey[], lang: import("@/pages/admin/dashboardI18n").CategoryLang): string {
  const labels = categoryCodes
    .filter((code) => CATEGORIES[code])
    .map((code) => CATEGORIES[code].label[lang]);
  if (!labels.length) return "—";
  return labels.join(" · ");
}

function adminCourseCoverStyle(coverColor: string): CSSProperties | undefined {
  const trimmed = coverColor.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(trimmed)) return undefined;
  const raw = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const hex = raw.toUpperCase();
  const h = hex.replace("#", "");
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - 28);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - 28);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - 28);
  const to = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return { background: `linear-gradient(135deg, ${hex}, #${to(r)}${to(g)}${to(b)})` };
}

function AdminCourseCard({
  course,
  eligibleEmployees,
  onEdit,
  onDelete,
}: {
  course: Course;
  eligibleEmployees: Employee[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
}) {
  const { t, categoryLang, nameOf } = useDashboardI18n();
  const [showEligibleNames, setShowEligibleNames] = useState(false);
  const eligibleCount = eligibleEmployees.length;
  const { icon, coverColor } = resolveCourseCardVisual(course.slug, course.icon, course.coverColor);
  const title = course.title[categoryLang] ?? course.title.en ?? course.title.fr ?? course.title.ar ?? "—";
  const rolesLabel = formatCourseRolesLabel(course.categoryCodes, categoryLang);
  const coverStyle = adminCourseCoverStyle(coverColor);
  const completionPct = Math.round(course.completionRate);
  const completionColor = completionPct > 0 ? COLORS.green : COLORS.gray;

  const adminBadgeBase: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  };

  return (
    <div className={`${courseCardCellClassName} course-card-courses relative h-full`} style={{ overflow: "visible" }}>
      <div className="group relative h-full" style={{ overflow: "visible" }}>
        <div className="absolute end-3 top-3 z-30 flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            type="button"
            aria-label={t("admin.page.actions.edit")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/40 bg-white/70 text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white/85 active:scale-[0.97]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(course);
            }}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={t("admin.page.actions.delete")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/40 bg-white/70 text-red-700 shadow-sm backdrop-blur-md transition hover:bg-white/85 active:scale-[0.97]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(course);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="relative block h-full w-full" style={courseCardWrapperStyle}>
          <div
            className={`card-thumbnail group relative text-5xl ${coverStyle ? "" : `bg-gradient-to-br ${coverColor}`}`}
            style={{ ...courseCardThumbnailStyle, ...coverStyle }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.30))" }}
            />
            <span
              className="relative z-[1] transition-transform duration-300 ease-out group-hover:scale-[1.12]"
              style={{ filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.25))" }}
            >
              {icon}
            </span>
          </div>
          <div className="card-content" style={courseCardContentStyle}>
            <div className="min-h-0">
              <h3 className="card-title" style={courseCardTitleStyle}>
                {title}
              </h3>
            </div>
            <div style={courseCardStatusStyle}>
              <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                <span
                  className="card-badge"
                  style={{
                    ...adminBadgeBase,
                    border: `1px solid ${course.hasQuiz ? "#a7f3d0" : "#fed7aa"}`,
                    background: course.hasQuiz ? COLORS.greenLight : COLORS.orangeLight,
                    color: course.hasQuiz ? COLORS.green : COLORS.orange,
                  }}
                >
                  {course.hasQuiz ? (
                    t("admin.page.courses.quizYes")
                  ) : (
                    <>
                      <X size={12} strokeWidth={3} aria-hidden />
                      {t("admin.page.courses.quizNo")}
                    </>
                  )}
                </span>
                <span
                  className="card-badge"
                  style={{ ...adminBadgeBase, position: "relative", border: `1px solid ${COLORS.border}`, background: COLORS.grayLight, color: COLORS.text }}
                  onMouseEnter={() => setShowEligibleNames(true)}
                  onMouseLeave={() => setShowEligibleNames(false)}
                  onFocus={() => setShowEligibleNames(true)}
                  onBlur={() => setShowEligibleNames(false)}
                  tabIndex={0}
                  role="button"
                  aria-label={
                    eligibleCount > 0
                      ? t("admin.page.courses.roleTooltip", { roles: rolesLabel, names: eligibleEmployees.map((e) => e.name).join(", ") })
                      : t("admin.page.courses.roleOnly", { roles: rolesLabel })
                  }
                >
                  {rolesLabel}
                  {showEligibleNames && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 6px)",
                        insetInlineEnd: 0,
                        zIndex: 60,
                        minWidth: 140,
                        maxWidth: 260,
                        padding: "8px 10px",
                        borderRadius: 10,
                        background: COLORS.navy,
                        color: COLORS.white,
                        fontSize: 11,
                        fontWeight: 600,
                        lineHeight: 1.5,
                        textAlign: "start",
                        boxShadow: COLORS.shadowLg,
                        pointerEvents: "none",
                      }}
                    >
                      {eligibleCount > 0 ? (
                        eligibleEmployees.map((emp) => (
                          <span key={emp.id} style={{ display: "block" }}>
                            {nameOf(emp.name)}
                            {emp.employeeCode ? (
                              <span style={{ opacity: 0.75, marginInlineStart: 4 }} dir="ltr">
                                {emp.employeeCode}
                              </span>
                            ) : null}
                          </span>
                        ))
                      ) : (
                        <span style={{ display: "block" }}>{t("admin.page.courses.noEligibleEmployees")}</span>
                      )}
                    </span>
                  )}
                </span>
                <span
                  className="card-badge"
                  style={{
                    ...adminBadgeBase,
                    border: `1px solid ${completionColor}33`,
                    background: `${completionColor}14`,
                    color: completionColor,
                  }}
                >
                  📊 {t("admin.page.courses.completionPct", { pct: completionPct })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CoursesView = ({
  courses,
  employees,
  categoryFilter,
  onCategoryFilterChange,
  onEdit,
  onDelete,
  onAddCourse,
}: {
  courses: Course[];
  employees: Employee[];
  categoryFilter: "all" | CategoryKey;
  onCategoryFilterChange: (filter: "all" | CategoryKey) => void;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onAddCourse: () => void;
}) => {
  const { t, categoryLang } = useDashboardI18n();
  const isRTL = categoryLang === "ar";
  const courseList = Array.isArray(courses) ? courses : [];

  const filtered = useMemo(() => {
    if (categoryFilter === "all") return courseList;
    return courseList.filter((c) => c.categoryCodes.includes(categoryFilter));
  }, [courseList, categoryFilter]);

  const isPendingCategory =
    categoryFilter !== "all" && CATEGORIES_WITHOUT_COURSES_YET.includes(categoryFilter);
  const categoryHasNoCourses =
    categoryFilter !== "all" && !courseList.some((c) => c.categoryCodes.includes(categoryFilter));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {[
          { label: t("admin.page.courses.total"), val: filtered.length, color: COLORS.navy },
          { label: t("admin.page.courses.hasQuiz"), val: filtered.filter((c) => c.hasQuiz).length, color: COLORS.blue },
          { label: t("admin.page.courses.completionOver70"), val: filtered.filter((c) => c.completionRate >= 70).length, color: COLORS.green },
          { label: t("admin.page.courses.needsQuiz"), val: filtered.filter((c) => !c.hasQuiz).length, color: COLORS.orange },
        ].map(s => (
          <div key={s.label} style={{ background: COLORS.white, borderRadius: 12, padding: "14px 16px", borderTop: `3px solid ${s.color}`, boxShadow: COLORS.shadow }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <AdminCategoryRoleSelect
        value={categoryFilter}
        onChange={onCategoryFilterChange}
        allLabel={t("admin.page.employees.allRoles")}
        categoryLang={categoryLang}
      />
      {filtered.length > 0 ? (
        <CourseCardGrid className="courses-grid">
          {filtered.map((course) => (
            <AdminCourseCard
              key={course.id}
              course={course}
              eligibleEmployees={eligibleEmployeesForCourse(course, employees)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </CourseCardGrid>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: COLORS.white,
            borderRadius: 16,
            border: `1.5px dashed ${COLORS.border}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          {isPendingCategory || categoryHasNoCourses ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
                {t("admin.page.courses.noCoursesCategory", { category: CATEGORIES[categoryFilter].label[categoryLang] })}
              </div>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6, maxWidth: 420, marginInline: "auto" }}>
                {t("admin.page.courses.emptyCategoryHint")}
              </p>
              <button
                type="button"
                onClick={onAddCourse}
                style={{
                  padding: "10px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: COLORS.navy,
                  color: COLORS.white,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isRTL ? (
                  <>{t("admin.page.courses.addCourseForRole")} +</>
                ) : (
                  <>+ {t("admin.page.courses.addCourseForRole")}</>
                )}
              </button>
            </>
          ) : (
            <div style={{ fontSize: 14, color: COLORS.textMuted }}>{t("admin.page.courses.noFilterMatch")}</div>
          )}
        </div>
      )}
    </div>
  );
};

const AnalyticsView = ({ employees, courses, weekly }: { employees: Employee[]; courses: Course[]; weekly: WeeklyCompletion[] }) => {
  const { t, nameOf, categoryLang } = useDashboardI18n();
  const heatmapCells: HeatmapCell[] = [];
  employees.forEach(emp => {
    courses.forEach(course => {
      heatmapCells.push({
        employeeId: emp.id,
        employeeName: nameOf(emp.name),
        courseId: course.id,
        courseTitle: courseTitleForLang(course.title, categoryLang),
        completed: emp.completedCourses > 0 && course.completionRate > 0,
        score: emp.avgScore > 0 ? emp.avgScore : undefined,
      });
    });
  });
  const uniqueEmployees = Array.from(new Set(heatmapCells.map(c => c.employeeName)));
  const uniqueCourses = Array.from(new Set(heatmapCells.map(c => c.courseTitle))).slice(0, 10);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: COLORS.shadow }}>
        <SectionHeader title={t("admin.page.analytics.weekly")} subtitle={t("admin.page.analytics.weeklySub")} />
        <WeeklyChart data={weekly} />
      </div>
      <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: COLORS.shadow }}>
        <SectionHeader title={t("admin.page.analytics.heatmap")} subtitle={t("admin.page.analytics.heatmapSub")} />
        <CompletionHeatmap data={heatmapCells} employees={uniqueEmployees} courses={uniqueCourses} />
      </div>
      <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: COLORS.shadow }}>
        <SectionHeader title={t("admin.page.analytics.employeeDetail")} subtitle={t("admin.page.analytics.employeeDetailSub")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {employees.map(emp => (
            <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar role={emp.role} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{nameOf(emp.name)}</span>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{t("admin.page.employees.courseCount", { completed: emp.completedCourses, total: emp.totalCourses })}{emp.avgScore > 0 && <span style={{ color: COLORS.green, fontWeight: 700 }}> • {emp.avgScore}%</span>}</span>
                </div>
                <ProgressBar value={emp.completedCourses} max={emp.totalCourses || 1} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AddEmployeeModal = ({
  open,
  onClose,
  onSuccess,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: () => void;
}) => {
  const { t, categoryLang } = useDashboardI18n();
  const [name, setName] = useState("");
  const [role, setRole] = useState<CategoryKey | "">("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setRole("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0 && role !== "";

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await adminApi.addEmployee({ name: name.trim(), role, pin: "1234" });
      onSuccess();
    } catch {
      onError();
    } finally {
      setSubmitting(false);
    }
  };

  const fieldLabel: CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 6 };
  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1.5px solid ${COLORS.border}`,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    background: COLORS.btnBg,
    color: COLORS.text,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.white,
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          overflow: "hidden",
          boxShadow: COLORS.shadowLg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: COLORS.navy,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.white }}>{t("admin.empForm.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("admin.page.actions.close")}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: COLORS.white,
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>{t("admin.empForm.name")}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("admin.page.addEmployee.namePlaceholder")}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>{t("admin.page.addEmployee.roleLabel")}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CategoryKey | "")}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">{t("admin.page.addEmployee.selectRole")}</option>
              {ADD_EMPLOYEE_ROLE_OPTIONS.map(({ key, emoji }) => (
                <option key={key} value={key}>
                  {emoji} {CATEGORIES[key].label[categoryLang]}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: COLORS.text }}>{t("admin.page.addEmployee.idLabel")}: </span>
              <span style={{ color: COLORS.textMuted }}>{t("admin.page.addEmployee.idAuto")}</span>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: COLORS.text }}>{t("admin.empForm.pin")}: </span>
              <span style={{ color: COLORS.textMuted }}>{t("admin.page.addEmployee.pinDefault")}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: `1.5px solid ${COLORS.border}`,
                background: COLORS.btnBg,
                color: COLORS.text,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={() => void handleSubmit()}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: !canSubmit || submitting ? COLORS.gray : COLORS.navy,
                color: COLORS.white,
                fontSize: 14,
                fontWeight: 700,
                cursor: !canSubmit || submitting ? "not-allowed" : "pointer",
                opacity: !canSubmit || submitting ? 0.7 : 1,
              }}
            >
              {submitting ? t("admin.page.actions.adding") : t("admin.page.actions.add")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeDetailModal = ({ employee, onClose }: { employee: Employee; onClose: () => void }) => {
  const { t, locale, nameOf, roleOf } = useDashboardI18n();
  const role = getRoleConfig(employee.role);
  const hasCertificate = employeeHasCertificate(employee);
  const certLocale = resolveCertificateLocale(employee.language);
  const certRole = employee.categoryKey
    ? categoryLabel(employee.categoryKey, certLocale as CategoryLang)
    : employee.role;
  const isDriver = employee.categoryKey === "driver";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: COLORS.white, borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: COLORS.shadowLg }} onClick={e => e.stopPropagation()}>
        <div style={{ background: COLORS.navy, padding: "24px 24px 20px", borderRadius: "20px 20px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Avatar role={employee.role} size={52} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.white }}>{nameOf(employee.name)}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{employee.employeeCode ?? employee.id}</div>
                <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: role.bg, color: role.color }}>
                  <RoleIcon role={employee.role} size={14} />
                  {roleOf(employee.role, employee.categoryKey)}
                </span>
                {isDriver && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: "rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    <span aria-hidden>🚛</span>
                    <span style={{ opacity: 0.85 }}>{t("admin.employees.truckNumber")}:</span>
                    <span dir="ltr" style={{ fontWeight: 800 }}>
                      {employee.truckNumber?.trim() || t("admin.employees.truckNotAssigned")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: COLORS.white, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: t("admin.page.employees.avgScore"), val: employee.avgScore > 0 ? `${employee.avgScore}%` : "—", icon: "🎯" },
              { label: t("admin.page.employees.coursesCompleted"), val: `${employee.completedCourses}/${employee.totalCourses}`, icon: "📚" },
              { label: t("admin.page.table.status"), val: employeeStatusLabel(t, employee.status), icon: "📋" },
            ].map(s => (
              <div key={s.label} style={{ padding: "12px", background: COLORS.cream, borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.brand, margin: "4px 0" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>{t("admin.page.employees.overallProgress")}</div>
            <ProgressBar value={employee.completedCourses} max={employee.totalCourses || 1} />
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>{t("admin.page.employees.lastActivity", { date: new Date(employee.lastActivity).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" }) })}</div>

          {hasCertificate && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 22, lineHeight: 1.2 }}>🏆</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: COLORS.text, lineHeight: 1.55 }}>
                  {t("admin.page.employees.certificateBlurb")}
                </p>
              </div>
              <Certificate
                employeeName={employee.name}
                role={certRole}
                score={employee.avgScore}
                date={employee.lastActivity}
                locale={certLocale}
                showPreview={false}
                showExport
                showExportIcon={false}
                downloadApi="admin"
                userId={employee.id}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale, categoryLang } = useDashboardI18n();
  const isRTL = categoryLang === "ar";
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromPath(location.pathname));

  useEffect(() => {
    if (location.pathname.startsWith("/admin/settings")) {
      setActiveTab("settings");
    }
  }, [location.pathname]);

  const goToTab = useCallback(
    (id: Tab) => {
      setActiveTab(id);
      if (id === "settings") {
        navigate("/admin/settings");
        return;
      }
      if (location.pathname.startsWith("/admin/settings")) {
        navigate("/admin");
      }
    },
    [location.pathname, navigate]
  );
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [coursesCategoryFilter, setCoursesCategoryFilter] = useState<"all" | CategoryKey>("all");
  const [newCourseDefaultCategories, setNewCourseDefaultCategories] = useState<CategoryKey[] | undefined>();
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EditEmployeeTarget | null>(null);
  const [deleteEmployeeTarget, setDeleteEmployeeTarget] = useState<Employee | null>(null);
  const [deleteEmployeeLoading, setDeleteEmployeeLoading] = useState(false);
  const [epiStatusFilter, setEpiStatusFilter] = useState<EpiStatusFilter>("all");
  const [pendingRenewalCount, setPendingRenewalCount] = useState(0);
  const [issueEpiEmployee, setIssueEpiEmployee] = useState<IssueEpiEmployee | null>(null);
  const [issueEpiInitialCodes, setIssueEpiInitialCodes] = useState<string[] | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [staleBanner, setStaleBanner] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [justRefreshedManual, setJustRefreshedManual] = useState(false);
  const epiHasLoadedRef = useRef(false);
  const initialLoadCompleteRef = useRef(false);

  const {
    data: statsData,
    initialLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useApiData<DashboardStats>("/api/admin/stats");
  const {
    data: employeesRaw,
    initialLoading: empLoading,
    error: empError,
    refetch: refetchEmployees,
  } = useApiData<unknown>("/api/admin/employees?status=all&page=1&pageSize=500");
  const [epiRaw, setEpiRaw] = useState<unknown>(null);
  const [epiLoading, setEpiLoading] = useState(true);
  const [epiLoadError, setEpiLoadError] = useState<string | null>(null);
  const [epiEmployees, setEpiEmployees] = useState<EpiEmployee[]>([]);

  const refetchEpi = useCallback(async (options?: RefetchOptions): Promise<boolean> => {
    const silent = Boolean(options?.silent && epiHasLoadedRef.current);
    if (!silent) {
      setEpiLoading(true);
      setEpiLoadError(null);
    }
    try {
      const { data } = await adminApi.epiDashboard();
      setEpiRaw(data);
      epiHasLoadedRef.current = true;
      return true;
    } catch (e) {
      if (!silent) {
        setEpiLoadError(e instanceof Error ? e.message : t("admin.page.errors.loadEpi"));
        setEpiRaw(null);
      }
      return false;
    } finally {
      if (!silent) setEpiLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetchEpi();
  }, [refetchEpi]);

  const {
    data: coursesRaw,
    initialLoading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useApiData<unknown>("/api/admin/courses");
  const { data: activityData, refetch: refetchActivity } = useApiData<ActivityLog[]>("/api/admin/activity");
  const {
    data: weeklyData,
    initialLoading: weeklyLoading,
    error: weeklyError,
    refetch: refetchAnalytics,
  } = useApiData<{ weekly?: { week: string; rate: number }[] }>("/api/admin/analytics/weekly");

  const refreshPendingRenewalCount = useCallback(async () => {
    try {
      const { data } = await adminApi.epiRenewalRequests();
      setPendingRenewalCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setPendingRenewalCount(0);
    }
  }, []);

  const markRefreshSuccess = useCallback(() => {
    setLastUpdated(new Date());
    setStaleBanner(false);
  }, []);

  const runAutoRefresh = useCallback(async () => {
    if (!initialLoadCompleteRef.current) return;
    const results = await Promise.all([
      refetchStats({ silent: true }),
      refetchEmployees({ silent: true }),
      refetchActivity({ silent: true }),
      refetchEpi({ silent: true }),
    ]);
    if (results.every(Boolean)) {
      markRefreshSuccess();
      await refreshPendingRenewalCount();
    } else if (results.some(Boolean)) {
      setStaleBanner(false);
    } else {
      setStaleBanner(true);
    }
  }, [refetchStats, refetchEmployees, refetchActivity, refetchEpi, markRefreshSuccess, refreshPendingRenewalCount]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void runAutoRefresh();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [runAutoRefresh]);

  const stats = useMemo(() => mapAdminStatsToDashboard(statsData), [statsData]);
  const employees = useMemo(
    () => mapApiEmployeesToDashboard(employeesRaw),
    [employeesRaw]
  );
  useEffect(() => {
    if (epiLoading) return;
    let cancelled = false;
    void (async () => {
      try {
        const mapped = await loadDashboardEpiEmployees(epiRaw);
        if (!cancelled) setEpiEmployees(mapped);
      } catch {
        if (!cancelled) setEpiEmployees([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [epiRaw, epiLoading]);

  useEffect(() => {
    void refreshPendingRenewalCount();
  }, [epiRaw, refreshPendingRenewalCount]);

  /** Refresh EPI when tab is active and user returns to the tab (silent). */
  useEffect(() => {
    if (activeTab !== "epi") return;
    void refetchEpi({ silent: true });
    const onVisible = () => {
      if (document.visibilityState === "visible") void refetchEpi({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [activeTab, refetchEpi]);

  const courses = useMemo(
    () => filterCoursesForAdminDashboard(mapAdminCoursesToDashboard(coursesRaw)),
    [coursesRaw]
  );
  const activity = useMemo(
    () => mapAdminActivityToDashboard(activityData, t, categoryLang),
    [activityData, t, categoryLang]
  );
  const weekly = useMemo(() => mapWeeklyAnalyticsToDashboard(weeklyData), [weeklyData]);

  const showStatsLoadError = Boolean(statsError && !statsLoading && stats == null);
  const showCoursesLoadError = Boolean(coursesError && !coursesLoading && coursesRaw == null);
  const showWeeklyLoadError = Boolean(weeklyError && !weeklyLoading && weeklyData == null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const refreshAll = useCallback(async () => {
    setManualRefreshing(true);
    try {
      const results = await Promise.all([
        refetchStats({ silent: true }),
        refetchEmployees({ silent: true }),
        refetchEpi({ silent: true }),
        refetchCourses({ silent: true }),
        refetchActivity({ silent: true }),
        refetchAnalytics({ silent: true }),
        refreshPendingRenewalCount(),
      ]);
      const core = results.slice(0, 6);
      const dataOk = core.every(Boolean);
      const anyOk = core.some(Boolean);
      if (dataOk) {
        markRefreshSuccess();
        setJustRefreshedManual(true);
        window.setTimeout(() => setJustRefreshedManual(false), 4000);
      } else if (anyOk) {
        markRefreshSuccess();
        showToast(`⚠️ ${t("admin.page.toasts.partialRefresh")}`);
      } else {
        showToast(`❌ ${t("admin.page.toasts.refreshFailed")}`);
      }
    } finally {
      setManualRefreshing(false);
    }
  }, [
    refetchStats,
    refetchEmployees,
    refetchEpi,
    refetchCourses,
    refetchActivity,
    refetchAnalytics,
    refreshPendingRenewalCount,
    markRefreshSuccess,
  ]);

  useEffect(() => {
    if (statsLoading || empLoading || epiLoading || coursesLoading || lastUpdated) return;
    setLastUpdated(new Date());
  }, [statsLoading, empLoading, epiLoading, coursesLoading, lastUpdated]);

  const openNewCourseForm = (categories?: CategoryKey[]) => {
    setEditingCourse(null);
    setNewCourseDefaultCategories(categories?.length ? categories : undefined);
    setCourseFormOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setNewCourseDefaultCategories(undefined);
    setCourseFormOpen(true);
  };

  const handleDeleteCourse = async (course: Course) => {
    const title = courseTitleForLang(course.title, categoryLang);
    if (!window.confirm(t("admin.page.toasts.deleteConfirm", { title }))) return;
    try {
      await adminApi.deleteCourse(course.id);
      void refetchCourses();
      showToast(`✅ ${t("admin.page.toasts.deleteOk")}`);
    } catch {
      showToast(`❌ ${t("admin.page.toasts.deleteFailed")}`);
    }
  };

  const handleIssueEpi = useCallback((employee: EpiEmployee, itemCode?: string) => {
    setIssueEpiInitialCodes(itemCode ? [itemCode] : undefined);
    setIssueEpiEmployee({
      id: employee.id,
      employeeCode: employee.employeeCode,
      name: employee.name,
      role: employee.role,
      items: employee.items.map((it) => ({
        type: it.type,
        label: it.label,
        status: it.status,
        emoji: it.emoji,
      })),
    });
  }, []);

  const isInitialLoading = statsLoading || empLoading || epiLoading || coursesLoading;

  useEffect(() => {
    initialLoadCompleteRef.current = !isInitialLoading;
    if (!isInitialLoading) {
      setStaleBanner(false);
    }
  }, [isInitialLoading]);

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Segoe UI', 'Arial', sans-serif",
        background: COLORS.cream,
        color: COLORS.text,
      }}
    >
      <aside style={{
        width: 220,
        background: SIDEBAR.navy,
        color: SIDEBAR.white,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100vh",
        overflowY: "auto",
        overflowX: "visible",
      }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: SIDEBAR.white }}>Averda Academy</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{t("admin.nav.panelSubtitle")}</div>
        </div>
        <nav style={{ padding: "12px 12px", flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
            <button key={item.id} onClick={() => goToTab(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 10,
              border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 4, textAlign: "start",
              background: activeTab === item.id ? SIDEBAR.white : "transparent",
              color: activeTab === item.id ? SIDEBAR.navy : "rgba(255,255,255,0.75)", transition: "all 0.15s",
            }}>
              <Icon size={16} aria-hidden />
              {t(item.labelKey)}
              {item.id === "epi" &&
                (pendingRenewalCount > 0 || epiEmployees.filter((e) => e.statusSummary !== "ok").length > 0) && (
                <span style={{ marginInlineStart: "auto", background: SIDEBAR.red, color: SIDEBAR.white, borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                  {pendingRenewalCount > 0
                    ? pendingRenewalCount
                    : epiEmployees.filter((e) => e.statusSummary !== "ok").length}
                </span>
              )}
            </button>
          );
          })}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: SIDEBAR.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: SIDEBAR.navyDark }}>A</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: SIDEBAR.white }}>Averda Admin</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{t("admin.sidebar.adminLabel")}</div>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, minHeight: 0, minWidth: 0, padding: "28px 32px", overflowY: "auto" }}>
        {staleBanner && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 16px",
              borderRadius: 10,
              background: COLORS.orangeLight,
              border: `1px solid ${COLORS.orange}40`,
              color: COLORS.orange,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ⚠️ {t("admin.page.errors.staleBanner")}
          </div>
        )}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.text, display: "flex", alignItems: "center", gap: 8 }}>
              {(() => {
                const activeNav = NAV_ITEMS.find((n) => n.id === activeTab);
                if (!activeNav) return null;
                const ActiveIcon = activeNav.icon;
                return (
                  <>
                    <ActiveIcon size={22} aria-hidden />
                    {t(activeNav.labelKey)}
                  </>
                );
              })()}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: COLORS.textMuted }}>
              {activeTab === "analytics"
                ? t("admin.analytics.title")
                : activeTab === "settings"
                  ? t("admin.settings.subtitle")
                  : new Date().toLocaleDateString(locale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
            </p>
            {lastUpdated && (
              <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.textMuted }}>
                {t("admin.page.actions.lastUpdated", { time: formatUpdateTime(lastUpdated, locale) })}
              </p>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              direction: "ltr",
              flexShrink: 0,
            }}
          >
            <LanguageSwitcherCompact />
            <ThemeToggle variant="admin" />
            <AdminExportDropdown
              employees={employees}
              epiEmployees={epiEmployees}
              courses={courses}
              weekly={weekly}
              onExported={() => showToast(t("admin.page.export.done"))}
            />
            <button
              type="button"
              onClick={() => void refreshAll()}
              disabled={manualRefreshing}
              aria-label={t("admin.page.actions.refresh")}
              title={t("admin.page.actions.refreshAll")}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `2px solid ${COLORS.navy}`,
                background: COLORS.btnBg,
                color: COLORS.btnFg,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: manualRefreshing ? "wait" : "pointer",
                opacity: manualRefreshing ? 0.85 : 1,
                flexShrink: 0,
              }}
            >
              <RefreshCw
                size={18}
                strokeWidth={2.5}
                aria-hidden
                style={{
                  animation: manualRefreshing ? "adminDashSpin 0.8s linear infinite" : undefined,
                }}
              />
            </button>
            {justRefreshedManual && (
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.green, direction: "rtl" }}>
                {t("admin.page.actions.lastUpdatedNow")}
              </span>
            )}
            {activeTab === "courses" && (
              <button
                type="button"
                onClick={() => openNewCourseForm(defaultCategoriesForCourseFilter(coursesCategoryFilter))}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: COLORS.navy, color: COLORS.white, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                {isRTL ? (
                  <>{t("admin.page.courses.addCourse")} +</>
                ) : (
                  <>+ {t("admin.page.courses.addCourse")}</>
                )}
              </button>
            )}
            {activeTab === "employees" && (
              <button
                type="button"
                onClick={() => setShowAddEmployee(true)}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: COLORS.navy, color: COLORS.white, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                {isRTL ? (
                  <>{t("admin.page.employees.addEmployee")} +</>
                ) : (
                  <>+ {t("admin.page.employees.addEmployee")}</>
                )}
              </button>
            )}
          </div>
        </div>

        {isInitialLoading && activeTab !== "settings" ? (
          <Spinner />
        ) : (
          <>
            {empError && (activeTab === "dashboard" || activeTab === "employees") && (
              <div
                style={{
                  marginBottom: 20,
                  padding: "24px 20px",
                  borderRadius: 12,
                  background: COLORS.redLight,
                  border: `1px solid ${COLORS.red}`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.red, marginBottom: 8 }}>
                  {t("admin.page.errors.loadEmployees")}
                </div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>{empError}</div>
                <button
                  type="button"
                  onClick={() => void refetchEmployees()}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: COLORS.navy,
                    color: COLORS.white,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {t("admin.page.errors.retry")}
                </button>
              </div>
            )}
            {activeTab === "dashboard" && !empError && showStatsLoadError && (
              <DataLoadError onRetry={() => void refetchStats()} />
            )}
            {activeTab === "dashboard" && !empError && !showStatsLoadError && stats && (
              <DashboardView
                stats={stats}
                employees={employees}
                epiEmployees={epiEmployees}
                activity={activity}
                weekly={weekly}
                onToast={showToast}
              />
            )}
            {activeTab === "employees" && !empError && (
              <EmployeesView
                employees={employees}
                onSelect={setSelectedEmployee}
                onEdit={(emp) =>
                  setEditingEmployee({
                    id: emp.id,
                    name: emp.name,
                    categoryId: emp.categoryId,
                    categoryCode: emp.categoryKey ?? null,
                    isActive: emp.isActive,
                    truckNumber: emp.truckNumber,
                  })
                }
                onDelete={setDeleteEmployeeTarget}
              />
            )}
            {activeTab === "epi" && epiLoadError && (
              <div
                style={{
                  padding: "24px 20px",
                  borderRadius: 12,
                  background: COLORS.redLight,
                  border: `1px solid ${COLORS.red}`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.red, marginBottom: 8 }}>
                  {t("admin.page.errors.loadEpi")}
                </div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>{epiLoadError}</div>
                <button
                  type="button"
                  onClick={() => void refetchEpi()}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: COLORS.navy,
                    color: COLORS.white,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {t("admin.page.errors.retry")}
                </button>
              </div>
            )}
            {activeTab === "epi" && !epiLoadError && (
              <EpiView
                employees={epiEmployees}
                statusFilter={epiStatusFilter}
                onStatusFilterChange={setEpiStatusFilter}
                onIssueEpi={handleIssueEpi}
                onRefreshEmployees={() => void refetchEpi()}
                onPendingCountChange={setPendingRenewalCount}
                onToast={showToast}
                syncToken={epiRaw}
              />
            )}
            {activeTab === "courses" && showCoursesLoadError && (
              <DataLoadError onRetry={() => void refetchCourses()} />
            )}
            {activeTab === "courses" && !showCoursesLoadError && (
              <CoursesView
                courses={courses}
                employees={employees}
                categoryFilter={coursesCategoryFilter}
                onCategoryFilterChange={setCoursesCategoryFilter}
                onEdit={handleEditCourse}
                onDelete={handleDeleteCourse}
                onAddCourse={() =>
                  openNewCourseForm(defaultCategoriesForCourseFilter(coursesCategoryFilter))
                }
              />
            )}
            {activeTab === "analytics" && showWeeklyLoadError && (
              <DataLoadError onRetry={() => void refetchAnalytics()} />
            )}
            {activeTab === "analytics" && !showWeeklyLoadError && (
              <AnalyticsView employees={employees} courses={courses} weekly={weekly} />
            )}
            {activeTab === "settings" && <SettingsView embedded />}
          </>
        )}
      </main>

      {selectedEmployee && <EmployeeDetailModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}

      <IssueEpiModal
        open={issueEpiEmployee != null}
        employee={issueEpiEmployee}
        initialSelectedCodes={issueEpiInitialCodes}
        onClose={() => {
          setIssueEpiEmployee(null);
          setIssueEpiInitialCodes(undefined);
        }}
        onIssued={async () => {
          await refetchEpi();
          showToast(`✅ ${t("admin.page.toasts.epiIssued")}`);
        }}
        onError={showToast}
      />

      <AddEmployeeModal
        open={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onSuccess={() => {
          setShowAddEmployee(false);
          void refetchEmployees();
          showToast(`✅ ${t("admin.page.toasts.employeeAdded")}`);
        }}
        onError={() => {
          showToast(`❌ ${t("admin.page.toasts.employeeAddFailed")}`);
        }}
      />

      <EditEmployeeModal
        open={editingEmployee != null}
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSuccess={() => {
          void refetchEmployees();
          showToast(`✅ ${t("admin.employees.updated")}`);
        }}
        onError={(msg) => showToast(`❌ ${msg}`)}
      />

      <ConfirmDeleteModal
        open={deleteEmployeeTarget != null}
        title={t("admin.employees.deleteModalTitle")}
        message={
          deleteEmployeeTarget
            ? t("admin.employees.deleteModalMessage", { name: deleteEmployeeTarget.name })
            : ""
        }
        cancelLabel={t("common.cancel")}
        confirmLabel={t("admin.employees.deleteConfirmBtn")}
        loading={deleteEmployeeLoading}
        onCancel={() => {
          if (!deleteEmployeeLoading) setDeleteEmployeeTarget(null);
        }}
        onConfirm={() => {
          if (!deleteEmployeeTarget || deleteEmployeeLoading) return;
          void (async () => {
            setDeleteEmployeeLoading(true);
            try {
              await adminApi.deleteEmployee(deleteEmployeeTarget.id);
              setDeleteEmployeeTarget(null);
              if (selectedEmployee?.id === deleteEmployeeTarget.id) {
                setSelectedEmployee(null);
              }
              await refetchEmployees();
              showToast(`✅ ${t("admin.epiManage.employeeDeleted")}`);
            } catch (e: unknown) {
              const msg =
                isAxiosError(e) && e.response?.data?.error
                  ? String(e.response.data.error)
                  : t("admin.epiManage.employeeDeleteFailed");
              showToast(`❌ ${msg}`);
            } finally {
              setDeleteEmployeeLoading(false);
            }
          })();
        }}
      />

      <AdminCourseFormModal
        open={courseFormOpen}
        editingCourse={editingCourse ? courseToFormEdit(editingCourse) : null}
        defaultCategoryCodes={editingCourse ? undefined : newCourseDefaultCategories}
        onClose={() => {
          setCourseFormOpen(false);
          setEditingCourse(null);
          setNewCourseDefaultCategories(undefined);
        }}
        onSaved={() => {
          const wasEdit = Boolean(editingCourse);
          void refetchCourses();
          setCourseFormOpen(false);
          setEditingCourse(null);
          showToast(`✅ ${wasEdit ? t("admin.page.toasts.courseUpdated") : t("admin.page.toasts.courseSaved")}`);
        }}
      />

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.startsWith("❌") ? COLORS.red : toast.startsWith("✅") ? COLORS.green : COLORS.navy,
          color: COLORS.white, padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}>
          {toast}
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }`}</style>
        </div>
      )}
      <style>{`@keyframes adminDashSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
