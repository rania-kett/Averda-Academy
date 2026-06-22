import type { TFunction } from "i18next";
import type { SupportedLng } from "@/i18n/languageStorage";
import type { CategoryKey } from "@/config/categories";
import {
  courseTitleForLang,
  epiDisplayStatusLabel,
  epiItemLabel,
  employeeStatusLabel,
  roleDisplayLabel,
  type CategoryLang,
} from "@/pages/admin/dashboardI18n";
import { displayEmployeeName } from "@/utils/displayEmployeeName";
import type { ExportEmployeeRow } from "@/utils/adminDashboardExport";
import type { DashboardEpiEmployee } from "@/utils/mapEpiSummaryToDashboard";
import type { EpiDisplayStatus } from "@/utils/epiStatus";

export type ExportLocale = {
  lng: CategoryLang;
  locale: string;
  rtl: boolean;
  employeeStatus: (status: ExportEmployeeRow["status"]) => string;
  epiSummaryStatus: (status: DashboardEpiEmployee["statusSummary"]) => string;
  epiDisplayStatus: (status: EpiDisplayStatus) => string;
  epiItemLabel: (code: string, fallback: string) => string;
  nameOf: (name: string) => string;
  roleOf: (role: string, categoryKey?: CategoryKey | null) => string;
  courseTitle: (title: Record<string, string>) => string;
  formatDate: (iso: string) => string;
  formatLongDate: (date: Date) => string;
  title: (date: Date) => string;
  footer: (date: Date) => string;
  dateColumn: (label: string) => string;
  filename: (kind: "employees" | "epi" | "performance", stamp: string) => string;
  yes: string;
  no: string;
  col: {
    name: string;
    id: string;
    role: string;
    completedCourses: string;
    avgScore: string;
    status: string;
    lastActivity: string;
    shirt: string;
    pants: string;
    shoes: string;
    gloves: string;
    vest: string;
    itemsReceived: string;
    pendingRequests: string;
    lastUpdated: string;
    rank: string;
    courseTitle: string;
    completionPct: string;
    avgScorePct: string;
    enrolledCount: string;
    hasQuiz: string;
    date: string;
    completedCount: string;
  };
  sheet: {
    employees: string;
    epi: string;
    employeeResults: string;
    courseRates: string;
    weeklyCompletion: string;
  };
};

export function buildExportLocale(t: TFunction, lng: SupportedLng): ExportLocale {
  const categoryLang: CategoryLang = lng === "ar" ? "ar" : lng === "fr" ? "fr" : "en";
  const locale = lng === "ar" ? "ar-MA" : lng === "fr" ? "fr-FR" : "en-US";
  const rtl = lng === "ar";

  const formatDate = (iso: string) => {
    const ms = Date.parse(iso);
    if (Number.isNaN(ms)) return iso;
    return new Date(ms).toLocaleDateString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatLongDate = (date: Date) =>
    date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });

  return {
    lng: categoryLang,
    locale,
    rtl,
    employeeStatus: (status) => employeeStatusLabel(t, status),
    epiSummaryStatus: (status) => {
      const map: Record<DashboardEpiEmployee["statusSummary"], string> = {
        ok: t("admin.page.export.epiSummary.ok"),
        needs_followup: t("admin.page.export.epiSummary.needsFollowup"),
        pending: t("admin.page.export.epiSummary.pending"),
      };
      return map[status] ?? status;
    },
    epiDisplayStatus: (status) => epiDisplayStatusLabel(t, status),
    epiItemLabel: (code, fallback) => epiItemLabel(t, code, fallback),
    nameOf: (name) => displayEmployeeName(name, categoryLang),
    roleOf: (role, categoryKey) => roleDisplayLabel(role, categoryLang, categoryKey),
    courseTitle: (title) => courseTitleForLang(title, categoryLang),
    formatDate,
    formatLongDate,
    title: (date) => t("admin.page.export.title", { date: formatLongDate(date) }),
    footer: (date) => t("admin.page.export.footer", { date: formatLongDate(date) }),
    dateColumn: (label) => t("admin.page.export.dateColumn", { label }),
    filename: (kind, stamp) => `${t(`admin.page.export.files.${kind}`)}-${stamp}.xlsx`,
    yes: t("admin.page.export.yes"),
    no: t("admin.page.export.no"),
    col: {
      name: t("admin.page.export.columns.name"),
      id: t("admin.page.export.columns.id"),
      role: t("admin.page.export.columns.role"),
      completedCourses: t("admin.page.export.columns.completedCourses"),
      avgScore: t("admin.page.export.columns.avgScore"),
      status: t("admin.page.export.columns.status"),
      lastActivity: t("admin.page.export.columns.lastActivity"),
      shirt: t("employee.epi.sizes.labels.shirt"),
      pants: t("employee.epi.sizes.labels.pantsOptional"),
      shoes: t("employee.epi.sizes.labels.shoe"),
      gloves: t("employee.epi.sizes.labels.gloves"),
      vest: t("employee.epi.sizes.labels.vest"),
      itemsReceived: t("admin.page.export.columns.itemsReceived"),
      pendingRequests: t("admin.page.export.columns.pendingRequests"),
      lastUpdated: t("admin.page.export.columns.lastUpdated"),
      rank: t("admin.page.export.columns.rank"),
      courseTitle: t("admin.page.export.columns.courseTitle"),
      completionPct: t("admin.page.export.columns.completionPct"),
      avgScorePct: t("admin.page.export.columns.avgScorePct"),
      enrolledCount: t("admin.page.export.columns.enrolledCount"),
      hasQuiz: t("admin.page.export.columns.hasQuiz"),
      date: t("admin.page.export.columns.date"),
      completedCount: t("admin.page.export.columns.completedCount"),
    },
    sheet: {
      employees: t("admin.page.export.sheets.employees"),
      epi: t("admin.page.export.sheets.epi"),
      employeeResults: t("admin.page.export.sheets.employeeResults"),
      courseRates: t("admin.page.export.sheets.courseRates"),
      weeklyCompletion: t("admin.page.export.sheets.weeklyCompletion"),
    },
  };
}
