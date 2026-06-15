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

import { useState, useEffect, useCallback, useMemo, useRef, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SettingsView } from "@/pages/admin/SettingsPage";
import { AlertCircle, Briefcase, Pencil, RefreshCw, Trash2, type LucideIcon } from "lucide-react";
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
import { EpiExpiryCalendar } from "@/components/admin/EpiExpiryCalendar";
import { EpiItemDetailModal } from "@/components/admin/EpiItemDetailModal";
import { loadDashboardEpiEmployees } from "@/utils/loadDashboardEpiEmployees";
import { getExpiryLabel } from "@/utils/epiExpiry";
import { getDisplayStatus, getEmployeeEpiPillFlags, getStatusLabel } from "@/utils/epiStatus";
import type { DashboardEpiEmployee, DashboardEpiItem } from "@/utils/mapEpiSummaryToDashboard";
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
  avgScore: number;
  completedCourses: number;
  totalCourses: number;
  status: "not_started" | "in_progress" | "completed";
  lastActivity: string;
  group?: string;
  assessmentCompleted?: boolean;
  assessmentScore?: number | null;
  assessmentTakenAt?: string | null;
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

function courseTitleAr(c: Course): string {
  return c.title.ar ?? c.title.en ?? c.title.fr ?? "—";
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
      throw new Error(
        "تعذر الاتصال بالخادم — شغّل npm run dev من جذر المشروع (الخادم على المنفذ 3001)"
      );
    }
    throw e;
  }
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────

type RefetchOptions = { silent?: boolean };

function useApiData<T>(url: string, deps: unknown[] = []) {
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
        setError(e instanceof Error ? e.message : "خطأ في الاتصال");
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

function formatArUpdateTime(date: Date): string {
  return date.toLocaleTimeString("ar-MA", { hour: "numeric", minute: "2-digit" });
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
      hasQuiz: !!c.quiz,
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
  };
}

type ApiAdminEmployeeRow = {
  id: string;
  employeeId: string;
  name: string;
  category?: { code?: string; name?: { ar?: string } } | null;
  coursesDone?: number;
  coursesTotal?: number;
  avgScore?: number;
  lastActiveAt?: string;
  status?: string;
  assessmentCompleted?: boolean;
  assessmentScore?: number | null;
  assessmentTakenAt?: string | null;
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
      avgScore: u.avgScore ?? 0,
      completedCourses: u.coursesDone ?? 0,
      totalCourses: u.coursesTotal ?? 0,
      status: (u.status as Employee["status"]) ?? "not_started",
      lastActivity: u.lastActiveAt ?? new Date().toISOString(),
      assessmentCompleted: u.assessmentCompleted ?? false,
      assessmentScore: u.assessmentScore ?? null,
      assessmentTakenAt: u.assessmentTakenAt ?? null,
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

/** Human-readable Arabic labels for activity event types (never show raw snake_case). */
function formatActivityDetail(
  typeRaw: string,
  type: ActivityLog["type"],
  meta: Record<string, unknown>
): string {
  const courseTitle =
    typeof meta.courseTitle === "object" && meta.courseTitle !== null
      ? String((meta.courseTitle as { ar?: string }).ar ?? "")
      : String(meta.courseTitle ?? "");
  const itemTitle =
    typeof meta.itemTitle === "object" && meta.itemTitle !== null
      ? String((meta.itemTitle as { ar?: string }).ar ?? "")
      : String(meta.itemTitle ?? "");

  if (type === "quiz" || typeRaw.includes("quiz")) {
    const label = courseTitle || "دورة";
    return meta.score != null ? `اختبار: ${label} — ${meta.score}%` : `اختبار: ${label}`;
  }
  if (type === "epi" || typeRaw.includes("epi")) {
    if (typeRaw.includes("replacement")) return `طلب استبدال معدات: ${itemTitle || "—"}`;
    if (typeRaw.includes("reception")) return `تأكيد استلام معدات: ${itemTitle || "—"}`;
    return `معدات: ${itemTitle || courseTitle || "نشاط EPI"}`;
  }
  if (typeRaw.includes("course")) return courseTitle ? `دورة: ${courseTitle}` : "تقدم في دورة";
  return "نشاط على المنصة";
}

/** Map GET /api/admin/activity → activity feed rows. */
function mapAdminActivityToDashboard(raw: unknown): ActivityLog[] {
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
    const detail = formatActivityDetail(typeRaw, type, meta);

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

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

const COLORS = {
  navy: "#1e3a5f",
  navyDark: "#152d4a",
  navyLight: "#2a4f7e",
  cream: "#f8f5ef",
  accent: "#e8a020",
  accentLight: "#fef3dc",
  green: "#16a34a",
  greenLight: "#dcfce7",
  red: "#dc2626",
  redLight: "#fee2e2",
  orange: "#ea580c",
  orangeLight: "#ffedd5",
  blue: "#2563eb",
  blueLight: "#dbeafe",
  purple: "#4c1d95",
  purpleLight: "#ede9fe",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  border: "#e5e7eb",
  white: "#ffffff",
  text: "#111827",
  textMuted: "#6b7280",
};

// ─── ROLE CONFIG (matches @/config/categories — same icons & colors as RoleAvatar) ─

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
  return ROLE_CONFIG[role] ?? { label: role, color: "#6B7280", bg: "#F9FAFB", Icon: Briefcase };
}

const RoleIcon = ({ role, size = 16, color }: { role: string; size?: number; color?: string }) => {
  const { Icon, color: roleColor } = getRoleConfig(role);
  return <Icon size={size} color={color ?? roleColor} strokeWidth={2.75} aria-hidden />;
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    not_started: { label: "لم يبدأ", color: COLORS.gray, bg: COLORS.grayLight },
    in_progress: { label: "قيد التقدم", color: COLORS.blue, bg: COLORS.blueLight },
    completed: { label: "مكتمل", color: COLORS.green, bg: COLORS.greenLight },
    needs_followup: { label: "يحتاج متابعة", color: COLORS.red, bg: COLORS.redLight },
    pending: { label: "في الانتظار", color: COLORS.orange, bg: COLORS.orangeLight },
    ok: { label: "جيد", color: COLORS.green, bg: COLORS.greenLight },
    received: { label: "مستلم", color: COLORS.green, bg: COLORS.greenLight },
    not_issued: { label: "لم يُسلم", color: COLORS.gray, bg: COLORS.grayLight },
  };
  const cfg = map[status] ?? { label: status, color: COLORS.gray, bg: COLORS.grayLight };
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
      {cfg.label}
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

const Avatar = ({ role, size = 36 }: { role: string; size?: number }) => {
  const { Icon, color } = getRoleConfig(role);
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
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8">
      <AlertCircle className="mb-3 text-red-400" size={32} />
      <p className="text-sm font-semibold text-red-700">تعذر تحميل البيانات</p>
      <p className="mt-1 text-xs text-red-500">تأكد من تشغيل الخادم واتصال قاعدة البيانات</p>
      <button
        type="button"
        onClick={() => (onRetry ? onRetry() : window.location.reload())}
        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs text-white transition-colors hover:bg-red-700"
      >
        إعادة المحاولة
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
    borderLeft: `4px solid ${color}`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
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
        background: "transparent", color: COLORS.navy, fontSize: 13, fontWeight: 600,
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

const ActivityFeed = ({ items, employees }: { items: ActivityLog[]; employees: Employee[] }) => (
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
            {item.employeeName}
            <span style={{ fontWeight: 400, color: COLORS.textMuted }}> — {item.detail}</span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
            {new Date(item.timestamp).toLocaleString("ar-MA", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
          </div>
        </div>
      </div>
      );
    })}
  </div>
);

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

  const chips: { id: EpiStatusFilter; label: string; count: number; color: string; bg: string }[] = [
    { id: "ok", label: "جاهزون ✅", count: ok, color: COLORS.green, bg: COLORS.greenLight },
    { id: "needs_followup", label: "يحتاج متابعة ⚠️", count: followup, color: COLORS.red, bg: COLORS.redLight },
    { id: "pending", label: "في الانتظار 🕐", count: pending, color: COLORS.orange, bg: COLORS.orangeLight },
    {
      id: "renewal_requests",
      label: "طلبات التجديد 📋",
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
        <span>الكل</span>
      </button>
      {chips.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onFilterChange(activeFilter === s.id ? "all" : s.id)}
          style={chipButtonStyle(activeFilter === s.id, s.color, s.bg)}
        >
          <span style={{ fontSize: 18, fontWeight: 800 }}>{s.count}</span>
          <span>{s.label}</span>
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
  const cellSize = 28;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ minWidth: 100, textAlign: "right", padding: "4px 8px", color: COLORS.textMuted, fontWeight: 600 }}>الموظف</th>
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
          مكتمل
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: COLORS.grayLight, display: "inline-block" }} />
          لم يبدأ
        </span>
      </div>
    </div>
  );
};

// ─── WEEKLY CHART (vanilla SVG — no dependencies) ────────────────────────────

const WeeklyChart = ({ data }: { data: WeeklyCompletion[] }) => {
  if (!data.length) return <EmptyState icon="📊" title="لا توجد بيانات بعد" subtitle="ستظهر البيانات بعد إكمال الموظفين للدورات" />;

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
              {new Date(p.date).toLocaleDateString("ar-MA", { month: "short", day: "numeric" })}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────

type Tab = "dashboard" | "employees" | "epi" | "courses" | "analytics" | "settings";

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "لوحة التحكم", icon: "🏠" },
  { id: "employees", label: "الموظفون", icon: "👥" },
  { id: "epi", label: "معدات", icon: "🦺" },
  { id: "courses", label: "الدورات", icon: "📚" },
  { id: "analytics", label: "التحليلات", icon: "📊" },
  { id: "settings", label: "الإعدادات", icon: "⚙️" },
];

function tabFromPath(pathname: string): Tab {
  return pathname === "/admin/settings" ? "settings" : "dashboard";
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

function formatReminderSentAgo(sentAt: string): string {
  const diffMinutes = (Date.now() - new Date(sentAt).getTime()) / 60000;
  if (diffMinutes < 1) return "منذ قليل";
  if (diffMinutes < 60) return `منذ ${Math.max(1, Math.floor(diffMinutes))} دقيقة`;
  if (diffMinutes < 1440) return `منذ ${Math.max(1, Math.floor(diffMinutes / 60))} ساعة`;
  return "منذ قليل";
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
    if (!window.confirm(`هل تريد إرسال تذكير لـ ${emp.name}؟`)) return;
    try {
      await adminApi.notifyEmployee(emp.id, { type: "assessment" });
      onToast("✅ تم الإرسال — سيظهر التنبيه عند الموظف");
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 429) {
        onToast("⏳ تم إرسال تذكير مؤخرًا — حاول بعد 24 ساعة");
        const iso = saveReminderSentAt(emp.id);
        setReminderSentAt((prev) => ({ ...prev, [emp.id]: iso }));
        return;
      }
      onToast("❌ تعذر إرسال التذكير");
      return;
    }
    const iso = saveReminderSentAt(emp.id);
    setReminderSentAt((prev) => ({ ...prev, [emp.id]: iso }));
  };

  const thStyle: CSSProperties = {
    textAlign: "right",
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
    <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <SectionHeader
        title="اختبار التقييم الأولي"
        subtitle={`${stats.activeEmployees} موظفًا مسجلًا — متابعة إكمال الاختبار التمهيدي`}
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
          {completedCount} أكملوا الاختبار
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
          {notStartedCount} لم يبدأوا بعد
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr>
              <th style={thStyle}>الموظف</th>
              <th style={thStyle}>الحالة</th>
              <th style={thStyle}>عدد المحاولات</th>
              <th style={thStyle}>أفضل نتيجة</th>
              <th style={thStyle}>تاريخ الإكمال</th>
              <th style={thStyle}>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: COLORS.textMuted }}>
                  لا يوجد موظفون لعرضهم
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
                          <div style={{ fontWeight: 700 }}>{emp.name}</div>
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
                            {emp.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {completed ? (
                        <span style={{ color: COLORS.green, fontWeight: 700 }}>أكمل ✅</span>
                      ) : (
                        <span style={{ color: COLORS.orange, fontWeight: 700 }}>لم يبدأ بعد ⏳</span>
                      )}
                    </td>
                    <td style={tdStyle}>{attemptCount}</td>
                    <td style={tdStyle}>{bestScore != null ? `${bestScore}%` : "—"}</td>
                    <td style={tdStyle}>
                      {completedAt
                        ? new Date(completedAt).toLocaleDateString("ar-MA", {
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
                            title="سيتم إعادة تفعيل الإرسال بعد 24 ساعة"
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
                            ✅ تم الإرسال
                          </button>
                          <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>
                            {formatReminderSentAgo(sentAt)}
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
                          إرسال تذكير 🔔
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
  const topEmployee = [...employees].sort((a, b) => b.avgScore - a.avgScore)[0];
  const atRisk = employees.filter(e => e.avgScore < 70 && e.completedCourses > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <KpiCard label="الموظفون النشطون" value={stats.activeEmployees} icon="👥" color={COLORS.navy} trend={{ direction: "up", label: `من ${stats.totalEmployees} موظف إجمالاً` }} />
        <KpiCard label="دورات مكتملة (الأسبوع)" value={stats.completedCoursesThisWeek} icon="📚" color={COLORS.blue} trend={{ direction: stats.completedCoursesThisWeek > 0 ? "up" : "neutral", label: "هذا الأسبوع" }} />
        <KpiCard label="متوسط نتائج الاختبارات" value={stats.avgQuizScore} unit="%" icon="🎯" color={stats.avgQuizScore >= 70 ? COLORS.green : stats.avgQuizScore > 0 ? COLORS.orange : COLORS.gray} trend={{ direction: stats.avgQuizScore >= 70 ? "up" : "neutral", label: "متوسط كل المحاولات" }} />
        <KpiCard label="يحتاجون متابعة" value={stats.needsFollowUp === 0 ? "✓ لا يوجد" : stats.needsFollowUp} icon={stats.needsFollowUp === 0 ? "✅" : "⚠️"} color={stats.needsFollowUp === 0 ? COLORS.green : COLORS.red} trend={stats.needsFollowUp === 0 ? { direction: "up", label: "جميع الموظفين بخير" } : { direction: "down", label: "يحتاجون تدخلاً" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <SectionHeader title="سجل النشاط" subtitle="آخر الأحداث في الوقت الفعلي" />
          {activity.length ? <ActivityFeed items={activity.slice(0, 8)} employees={employees} /> : <EmptyState icon="📋" title="لا يوجد نشاط بعد" />}
        </div>
        <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <SectionHeader title="تنبيهات معدات EPI" subtitle="الموظفون الذين يحتاجون معدات" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {epiEmployees.filter(e => e.statusSummary !== "ok").slice(0, 5).map(emp => (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: COLORS.redLight, border: `1px solid ${COLORS.red}20` }}>
                <Avatar role={emp.role} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{emp.role} • {emp.pendingRequests} طلب معلق</div>
                </div>
                <StatusBadge status="needs_followup" />
              </div>
            ))}
            {epiEmployees.filter(e => e.statusSummary !== "ok").length === 0 && (
              <EmptyState icon="✅" title="جميع الموظفين جاهزون" subtitle="لا توجد معدات ناقصة" />
            )}
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <SectionHeader title="الإكمال الأسبوعي (8 أسابيع)" subtitle="عدد الدورات المكتملة أسبوعياً" />
        <WeeklyChart data={weekly} />
      </div>

      <AssessmentQuizSection employees={employees} stats={stats} onToast={onToast} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <SectionHeader title="الأفضل هذا الشهر" />
          {topEmployee && topEmployee.avgScore > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative" }}>
                <Avatar role={topEmployee.role} size={56} />
                <span style={{ position: "absolute", top: -4, right: -4, fontSize: 20 }}>🏆</span>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>{topEmployee.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <RoleIcon role={topEmployee.role} size={16} />
                  {topEmployee.role}
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                  <span style={{ color: COLORS.green, fontWeight: 700 }}>{topEmployee.avgScore}% ⭐</span>
                  <span style={{ color: COLORS.textMuted }}>{topEmployee.completedCourses} دورات مكتملة</span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon="🏆" title="لا توجد بيانات بعد" subtitle="ستظهر بعد إكمال الاختبارات" />
          )}
        </div>
        <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <SectionHeader title="موظفون معرضون للخطر" />
          {atRisk.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {atRisk.map(e => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar role={e.role} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</div>
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
            <EmptyState icon="✅" title="لا يوجد موظفون بحاجة لمتابعة" />
          )}
        </div>
      </div>
    </div>
  );
};

const EmployeesView = ({ employees, onSelect }: { employees: Employee[]; onSelect: (e: Employee) => void }) => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const roles = Array.from(new Set(employees.map(e => e.role)));
  const filtered = employees.filter(e => {
    const matchSearch = e.name.includes(search) || e.id.includes(search);
    const matchRole = roleFilter === "all" || e.role === roleFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        {[
          { label: "إجمالي الموظفين", val: employees.length, color: COLORS.navy },
          { label: "قيد التقدم", val: employees.filter(e => e.status === "in_progress").length, color: COLORS.blue },
          { label: "مكتملون", val: employees.filter(e => e.status === "completed").length, color: COLORS.green },
          { label: "لم يبدأوا", val: employees.filter(e => e.status === "not_started").length, color: COLORS.gray },
        ].map(s => (
          <div key={s.label} style={{ background: COLORS.white, borderRadius: 12, padding: "14px 16px", borderTop: `3px solid ${s.color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input placeholder="ابحث بالاسم أو المعرّف..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 180, padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, fontFamily: "inherit", background: COLORS.white }}>
          <option value="all">كل الأدوار</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, fontFamily: "inherit", background: COLORS.white }}>
          <option value="all">كل الحالات</option>
          <option value="not_started">لم يبدأ</option>
          <option value="in_progress">قيد التقدم</option>
          <option value="completed">مكتمل</option>
        </select>
      </div>
      <div style={{ background: COLORS.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.navy }}>
              {["الموظف", "الدور", "التقدم", "متوسط النتيجة", "الحالة", "آخر نشاط", "إجراءات"].map(h => (
                <th key={h} style={{ padding: "12px 16px", color: COLORS.white, fontSize: 13, fontWeight: 600, textAlign: "right" }}>{h}</th>
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
                          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{emp.name}</div>
                          {emp.totalCourses > 0 && emp.completedCourses >= emp.totalCourses && emp.avgScore >= 70 && (
                            <span
                              title="لديه شهادة"
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
                      {emp.role}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", minWidth: 120 }}>
                    <ProgressBar value={emp.completedCourses} max={emp.totalCourses || 1} />
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{emp.completedCourses}/{emp.totalCourses} دورة</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: emp.avgScore >= 70 ? COLORS.green : emp.avgScore > 0 ? COLORS.orange : COLORS.gray }}>{emp.avgScore > 0 ? `${emp.avgScore}%` : "—"}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}><StatusBadge status={emp.status} /></td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textMuted }}>{new Date(emp.lastActivity).toLocaleDateString("ar-MA")}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => onSelect(emp)} style={{ padding: "5px 12px", borderRadius: 6, border: `1.5px solid ${COLORS.navy}`, background: "transparent", color: COLORS.navy, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>عرض</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState icon="🔍" title="لا توجد نتائج" subtitle="جرّب تغيير معايير البحث" />}
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
    new Date(iso).toLocaleDateString("ar-MA", { day: "numeric", month: "long", year: "numeric" });

  const handleApprove = async (req: EpiRenewalRequestRow) => {
    if (!window.confirm(`هل تريد الموافقة على طلب تجديد ${req.itemLabel} لـ ${req.employeeName}؟`)) return;
    try {
      await adminApi.approveEpiRenewalRequest(req.id);
      setPendingRequests((prev) => {
        const next = prev.filter((r) => r.id !== req.id);
        onPendingCountChange(next.length);
        return next;
      });
      onToast("✅ تمت الموافقة — سيتم إشعار الموظف");
      onRefreshEmployees();
    } catch {
      onToast("❌ فشل — حاول مرة أخرى");
    }
  };

  const handleReject = async (req: EpiRenewalRequestRow) => {
    if (!window.confirm(`هل تريد رفض طلب ${req.itemLabel} لـ ${req.employeeName}؟`)) return;
    try {
      await adminApi.rejectEpiRenewalRequest(req.id);
      setPendingRequests((prev) => {
        const next = prev.filter((r) => r.id !== req.id);
        onPendingCountChange(next.length);
        return next;
      });
      onToast("تم رفض الطلب");
      onRefreshEmployees();
    } catch {
      onToast("❌ فشل — حاول مرة أخرى");
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
      ? "لا يوجد موظفون جاهزون حالياً"
      : statusFilter === "needs_followup"
        ? "لا يوجد موظفون يحتاجون متابعة"
        : statusFilter === "pending"
          ? "لا يوجد موظفون في الانتظار"
          : "لا توجد نتائج";

  const renderRenewalCard = (req: EpiRenewalRequestRow) => (
    <div
      key={req.id}
      style={{
        background: "#fff7ed",
        border: "1px solid #f97316",
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.text }}>
          🦺 {req.itemLabel}{" "}
          <span style={{ fontWeight: 600, color: COLORS.textMuted }}>{req.employeeName}</span>{" "}
          <span style={{ fontSize: 13 }}>👷</span>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>{req.employeeRole}</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: COLORS.text }}>
        <strong>السبب:</strong> {req.reason}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: COLORS.textMuted }}>
        <strong>منذ:</strong> {formatRequestDate(req.createdAt)}
      </div>
      {req.note ? (
        <div style={{ marginTop: 6, fontSize: 13, color: COLORS.text, fontStyle: "italic" }}>
          ملاحظة: &quot;{req.note}&quot;
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
          ✓ موافقة
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
          ✗ رفض
        </button>
      </div>
    </div>
  );

  const renderRenewalSection = (showViewAllLink: boolean) => (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>طلبات التجديد المعلقة</h2>
          {pendingRequests.length > 0 && (
            <span style={{ background: COLORS.red, color: COLORS.white, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
              {pendingRequests.length} طلب جديد
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
            عرض الكل ({pendingRequests.length})
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
              background: COLORS.white,
              color: COLORS.navy,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ← العودة للموظفين
          </button>
        )}
      </div>
      {requestsLoading ? (
        <div style={{ padding: 16, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>جاري التحميل…</div>
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
          ✅ لا توجد طلبات تجديد معلقة
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayedRenewals.map(renderRenewalCard)}
          {showViewAllLink && hiddenRenewalCount > 0 && (
            <div style={{ textAlign: "center", fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>
              +{hiddenRenewalCount} طلب إضافي — استخدم فلتر «طلبات التجديد» لعرض الكل
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
            title={isRenewalFilter ? "التقويم غير متاح في تبويب طلبات التجديد" : "عرض التقويم"}
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
            📅 تقويم
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
                placeholder="ابحث بالاسم أو المعرّف..."
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
                    عرض الجميع
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
                <div key={emp.id} style={{ background: COLORS.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${alertLevel === "danger" ? COLORS.red : alertLevel === "warning" ? COLORS.orange : COLORS.green}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: alertLevel === "danger" ? COLORS.redLight : alertLevel === "warning" ? COLORS.orangeLight : COLORS.greenLight }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar role={emp.role} size={40} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{emp.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>{emp.employeeCode} • {emp.role}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.navy }}>{receivedCount}/{totalCount}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>معدات مستلمة</div>
                      </div>
                      {emp.pendingRequests > 0 && <span style={{ background: COLORS.red, color: COLORS.white, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{emp.pendingRequests} طلب معلق</span>}
                      <button
                        type="button"
                        onClick={() => onIssueEpi(emp)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: COLORS.navy, color: COLORS.white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        📦 إرسال معدات
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: "10px 20px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: `1px solid ${COLORS.border}` }}>
                    {Object.entries({ "قميص": emp.measurements.shirt, "بنطلون": emp.measurements.pants, "حذاء": emp.measurements.shoes, "قفازات": emp.measurements.gloves, "سترة": emp.measurements.vest }).map(([k, v]) => (
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
                      const expiryHint = getExpiryLabel(item.label, item.lastIssued ?? null);
                      const statusStyle = getStatusLabel(visualStatus);
                      const statusColor = statusStyle.color;
                      const statusBg = statusStyle.bgColor;
                      const statusLabel = statusStyle.arabic;
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
                              <span title="يوجد إثبات صورة" style={{ fontSize: 14 }} aria-hidden>
                                📷
                              </span>
                            ) : null}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: statusColor, fontWeight: 600, marginTop: 3 }}>{statusLabel}</div>
                          {expiryHint.text ? (
                            <div style={{ fontSize: 10, color: expiryTextColor, fontWeight: 700, marginTop: 3 }}>{expiryHint.text}</div>
                          ) : null}
                          {item.lastIssued && <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{new Date(item.lastIssued).toLocaleDateString("ar-MA")}</div>}
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
        />
      ) : null}
    </div>
  );
};

function employeeCategoryKeyForCourse(roleLabel: string): CategoryKey | null {
  for (const key of CATEGORY_ORDER) {
    if (CATEGORIES[key].label.ar === roleLabel) return key;
  }
  if (roleLabel.includes("كناس") || roleLabel.includes("عامل كنس")) return "sweeper";
  return null;
}

/** Employees whose job category can take this course (by role assignment, not LMS enrollment). */
function eligibleEmployeesForCourse(course: Course, employees: Employee[]): Employee[] {
  if (!employees.length) return [];
  return employees.filter((emp) => {
    const key = employeeCategoryKeyForCourse(emp.role);
    return key != null && course.categoryCodes.includes(key);
  });
}

function formatCourseRolesLabel(categoryCodes: CategoryKey[]): string {
  const labels = categoryCodes
    .filter((code) => CATEGORIES[code])
    .map((code) => CATEGORIES[code].label.ar);
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
  const [showEligibleNames, setShowEligibleNames] = useState(false);
  const eligibleCount = eligibleEmployees.length;
  const { icon, coverColor } = resolveCourseCardVisual(course.slug, course.icon, course.coverColor);
  const title = course.title.ar ?? course.title.en ?? course.title.fr ?? "—";
  const rolesLabel = formatCourseRolesLabel(course.categoryCodes);
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
            aria-label="تعديل"
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
            aria-label="حذف"
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
                  {course.hasQuiz ? "✓ لديه اختبار" : "! لا اختبار"}
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
                      ? `الدور: ${rolesLabel} — ${eligibleEmployees.map((e) => e.name).join("، ")}`
                      : `الدور: ${rolesLabel}`
                  }
                >
                  {rolesLabel}
                  {showEligibleNames && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 6px)",
                        right: 0,
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
                        textAlign: "right",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                        pointerEvents: "none",
                      }}
                    >
                      {eligibleCount > 0 ? (
                        eligibleEmployees.map((emp) => (
                          <span key={emp.id} style={{ display: "block" }}>
                            {emp.name}
                            {emp.employeeCode ? (
                              <span style={{ opacity: 0.75, marginInlineStart: 4 }} dir="ltr">
                                {emp.employeeCode}
                              </span>
                            ) : null}
                          </span>
                        ))
                      ) : (
                        <span style={{ display: "block" }}>لا يوجد موظف مرتبط بهذه الدورة</span>
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
                  📊 {completionPct}% إكمال
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
  categoryFilter,
  onCategoryFilterChange,
  onEdit,
  onDelete,
  onAddCourse,
}: {
  courses: Course[];
  categoryFilter: "all" | CategoryKey;
  onCategoryFilterChange: (filter: "all" | CategoryKey) => void;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onAddCourse: () => void;
}) => {
  const courseList = Array.isArray(courses) ? courses : [];
  const { data: employeesRaw } = useApiData<unknown>(
    "/api/admin/employees?status=all&page=1&pageSize=500"
  );
  const employeesForEnrollment = useMemo(
    () => mapApiEmployeesToDashboard(employeesRaw),
    [employeesRaw]
  );

  const filtered = useMemo(() => {
    if (categoryFilter === "all") return courseList;
    return courseList.filter((c) => c.categoryCodes.includes(categoryFilter));
  }, [courseList, categoryFilter]);

  const isPendingCategory =
    categoryFilter !== "all" && CATEGORIES_WITHOUT_COURSES_YET.includes(categoryFilter);
  const categoryHasNoCourses =
    categoryFilter !== "all" && !courseList.some((c) => c.categoryCodes.includes(categoryFilter));

  const handleCategoryFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.currentTarget.value;
    onCategoryFilterChange(v === "all" ? "all" : (v as CategoryKey));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {[
          { label: "إجمالي الدورات", val: filtered.length, color: COLORS.navy },
          { label: "لديها اختبار", val: filtered.filter((c) => c.hasQuiz).length, color: COLORS.blue },
          { label: "نسبة إكمال > 70%", val: filtered.filter((c) => c.completionRate >= 70).length, color: COLORS.green },
          { label: "تحتاج اختبار", val: filtered.filter((c) => !c.hasQuiz).length, color: COLORS.orange },
        ].map(s => (
          <div key={s.label} style={{ background: COLORS.white, borderRadius: 12, padding: "14px 16px", borderTop: `3px solid ${s.color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <select
        value={categoryFilter}
        onChange={handleCategoryFilterChange}
        style={{ padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, fontFamily: "inherit", background: COLORS.white, maxWidth: 220 }}
      >
        <option value="all">كل الأدوار</option>
        {CATEGORY_ORDER.map((key) => (
          <option key={key} value={key}>
            {CATEGORIES[key].label.ar}
          </option>
        ))}
      </select>
      {filtered.length > 0 ? (
        <CourseCardGrid className="courses-grid">
          {filtered.map((course) => (
            <AdminCourseCard
              key={course.id}
              course={course}
              eligibleEmployees={eligibleEmployeesForCourse(course, employeesForEnrollment)}
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
                لا توجد دورات لـ «{CATEGORIES[categoryFilter].label.ar}» بعد
              </div>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6, maxWidth: 420, marginInline: "auto" }}>
                هذا الدور متاح في النظام، لكن لم تُضف له دورات تدريبية. أنشئ دورة جديدة واختر هذا الدور ضمن «الأدوار المستهدفة».
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
                + إضافة دورة لهذا الدور
              </button>
            </>
          ) : (
            <div style={{ fontSize: 14, color: COLORS.textMuted }}>لا توجد دورات مطابقة للتصفية الحالية</div>
          )}
        </div>
      )}
    </div>
  );
};

const AnalyticsView = ({ employees, courses, weekly }: { employees: Employee[]; courses: Course[]; weekly: WeeklyCompletion[] }) => {
  const heatmapCells: HeatmapCell[] = [];
  employees.forEach(emp => {
    courses.forEach(course => {
      heatmapCells.push({
        employeeId: emp.id,
        employeeName: emp.name,
        courseId: course.id,
        courseTitle: courseTitleAr(course),
        completed: emp.completedCourses > 0 && course.completionRate > 0,
        score: emp.avgScore > 0 ? emp.avgScore : undefined,
      });
    });
  });
  const uniqueEmployees = Array.from(new Set(heatmapCells.map(c => c.employeeName)));
  const uniqueCourses = Array.from(new Set(heatmapCells.map(c => c.courseTitle))).slice(0, 10);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <SectionHeader title="الإكمال الأسبوعي (8 أسابيع)" subtitle="عدد الدورات المكتملة أسبوعياً" />
        <WeeklyChart data={weekly} />
      </div>
      <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <SectionHeader title="خريطة الإكمال" subtitle="نظرة عامة على كل موظف × كل دورة" />
        <CompletionHeatmap data={heatmapCells} employees={uniqueEmployees} courses={uniqueCourses} />
      </div>
      <div style={{ background: COLORS.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <SectionHeader title="تفصيل الموظفين" subtitle="نسبة التقدم لكل موظف" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {employees.map(emp => (
            <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar role={emp.role} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</span>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{emp.completedCourses}/{emp.totalCourses} دورة{emp.avgScore > 0 && <span style={{ color: COLORS.green, fontWeight: 700 }}> • {emp.avgScore}%</span>}</span>
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
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
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
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.white }}>إضافة موظف جديد</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
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
            <label style={fieldLabel}>الاسم الكامل</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب الاسم الكامل..."
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>الدور/الفئة</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CategoryKey | "")}
              style={{ ...inputStyle, background: COLORS.white, cursor: "pointer" }}
            >
              <option value="">اختر الدور...</option>
              {ADD_EMPLOYEE_ROLE_OPTIONS.map(({ key, emoji }) => (
                <option key={key} value={key}>
                  {emoji} {CATEGORIES[key].label.ar}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: COLORS.text }}>المعرّف: </span>
              <span style={{ color: COLORS.textMuted }}>سيتم توليده تلقائياً</span>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: COLORS.text }}>الرمز السري: </span>
              <span style={{ color: COLORS.textMuted }}>1234 (افتراضي)</span>
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
                background: COLORS.white,
                color: COLORS.text,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              إلغاء
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
              {submitting ? "جاري الإضافة..." : "إضافة"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeDetailModal = ({ employee, onClose }: { employee: Employee; onClose: () => void }) => {
  const role = getRoleConfig(employee.role);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: COLORS.white, borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: COLORS.navy, padding: "24px 24px 20px", borderRadius: "20px 20px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Avatar role={employee.role} size={52} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.white }}>{employee.name}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{employee.employeeCode ?? employee.id}</div>
                <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: role.bg, color: role.color }}>
                  <RoleIcon role={employee.role} size={14} />
                  {employee.role}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: COLORS.white, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "متوسط النتيجة", val: employee.avgScore > 0 ? `${employee.avgScore}%` : "—", icon: "🎯" },
              { label: "الدورات المكتملة", val: `${employee.completedCourses}/${employee.totalCourses}`, icon: "📚" },
              { label: "الحالة", val: employee.status === "in_progress" ? "قيد التقدم" : employee.status === "completed" ? "مكتمل" : "لم يبدأ", icon: "📋" },
            ].map(s => (
              <div key={s.label} style={{ padding: "12px", background: COLORS.cream, borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.navy, margin: "4px 0" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>التقدم الإجمالي</div>
            <ProgressBar value={employee.completedCourses} max={employee.totalCourses || 1} />
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>آخر نشاط: {new Date(employee.lastActivity).toLocaleDateString("ar-MA", { year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
      </div>
    </div>
  );
};

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(tabFromPath(location.pathname));
  }, [location.pathname]);

  const goToTab = useCallback(
    (id: Tab) => {
      setActiveTab(id);
      if (id === "settings") {
        if (location.pathname !== "/admin/settings") navigate("/admin/settings");
      } else if (location.pathname === "/admin/settings") {
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
        setEpiLoadError(e instanceof Error ? e.message : "تعذر تحميل بيانات المعدات");
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
  const activity = useMemo(() => mapAdminActivityToDashboard(activityData), [activityData]);
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
        showToast("⚠️ تم تحديث بعض البيانات فقط");
      } else {
        showToast("❌ تعذّر تحديث البيانات");
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
    const title = courseTitleAr(course);
    if (!window.confirm(`هل تريد حذف الدورة «${title}»؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    try {
      await adminApi.deleteCourse(course.id);
      void refetchCourses();
      showToast("✅ تم حذف الدورة بنجاح");
    } catch {
      showToast("❌ تعذر حذف الدورة");
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
      dir="rtl"
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Segoe UI', 'Arial', sans-serif",
        background: COLORS.cream,
      }}
    >
      <aside style={{
        width: 220,
        background: COLORS.navy,
        color: COLORS.white,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100vh",
        overflowY: "auto",
      }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.white }}>Averda Academy</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>لوحة الإدارة</div>
        </div>
        <nav style={{ padding: "12px 12px", flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => goToTab(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 10,
              border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 4, textAlign: "right",
              background: activeTab === item.id ? COLORS.white : "transparent",
              color: activeTab === item.id ? COLORS.navy : "rgba(255,255,255,0.75)", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.id === "epi" &&
                (pendingRenewalCount > 0 || epiEmployees.filter((e) => e.statusSummary !== "ok").length > 0) && (
                <span style={{ marginRight: "auto", background: COLORS.red, color: COLORS.white, borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                  {pendingRenewalCount > 0
                    ? pendingRenewalCount
                    : epiEmployees.filter((e) => e.statusSummary !== "ok").length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: COLORS.navyDark }}>A</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white }}>Averda Admin</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>مدير النظام</div>
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
            ⚠️ تعذّر التحديث — العرض قد لا يكون حديثاً
          </div>
        )}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.text }}>
              {NAV_ITEMS.find(n => n.id === activeTab)?.icon} {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: COLORS.textMuted }}>
              {activeTab === "analytics"
                ? "أداء الموظفين عبر الزمن"
                : activeTab === "settings"
                  ? "إدارة مفاتيح التكامل دون تعديل الكود"
                  : new Date().toLocaleDateString("ar-MA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            {lastUpdated && (
              <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.textMuted }}>
                آخر تحديث: {formatArUpdateTime(lastUpdated)}
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
            <AdminExportDropdown
              employees={employees}
              epiEmployees={epiEmployees}
              courses={courses}
              weekly={weekly}
              onExported={() => showToast("✅ تم التصدير")}
            />
            <button
              type="button"
              onClick={() => void refreshAll()}
              disabled={manualRefreshing}
              aria-label="تحديث البيانات"
              title="تحديث جميع البيانات"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `2px solid ${COLORS.navy}`,
                background: COLORS.white,
                color: COLORS.navy,
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
                آخر تحديث: الآن
              </span>
            )}
            {activeTab === "courses" && (
              <button
                type="button"
                onClick={() =>
                  openNewCourseForm(coursesCategoryFilter !== "all" ? [coursesCategoryFilter] : undefined)
                }
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: COLORS.navy, color: COLORS.white, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                + إضافة دورة
              </button>
            )}
            {activeTab === "employees" && (
              <button
                type="button"
                onClick={() => setShowAddEmployee(true)}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: COLORS.navy, color: COLORS.white, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                + إضافة موظف
              </button>
            )}
          </div>
        </div>

        {isInitialLoading ? (
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
                  تعذر تحميل بيانات الموظفين
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
                  إعادة المحاولة
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
              <EmployeesView employees={employees} onSelect={setSelectedEmployee} />
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
                  تعذر تحميل بيانات المعدات
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
                  إعادة المحاولة
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
                categoryFilter={coursesCategoryFilter}
                onCategoryFilterChange={setCoursesCategoryFilter}
                onEdit={handleEditCourse}
                onDelete={handleDeleteCourse}
                onAddCourse={() =>
                  openNewCourseForm(coursesCategoryFilter !== "all" ? [coursesCategoryFilter] : undefined)
                }
              />
            )}
            {activeTab === "analytics" && showWeeklyLoadError && (
              <DataLoadError onRetry={() => void refetchAnalytics()} />
            )}
            {activeTab === "analytics" && !showWeeklyLoadError && (
              <AnalyticsView employees={employees} courses={courses} weekly={weekly} />
            )}
            {activeTab === "settings" && <SettingsView embedded onBack={() => goToTab("dashboard")} />}
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
          showToast("✅ تم إرسال المعدات — ستظهر للموظف في الانتظار");
        }}
        onError={showToast}
      />

      <AddEmployeeModal
        open={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onSuccess={() => {
          setShowAddEmployee(false);
          void refetchEmployees();
          showToast("✅ تم إضافة الموظف بنجاح");
        }}
        onError={() => {
          showToast("❌ فشل الإضافة — حاول مرة أخرى");
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
          showToast(wasEdit ? "✅ تم تحديث الدورة بنجاح" : "✅ تم حفظ الدورة بنجاح");
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
