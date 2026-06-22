import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { CATEGORIES, CATEGORY_ORDER, type CategoryKey } from "@/config/categories";
import { resolveCurrentLng } from "@/i18n/persistLanguage";
import { displayEmployeeName } from "@/utils/displayEmployeeName";

export type CategoryLang = "ar" | "fr" | "en";

export function useDashboardI18n() {
  const { t, i18n } = useTranslation();
  const lng = resolveCurrentLng(i18n.language);
  const locale = lng === "ar" ? "ar-MA" : lng === "fr" ? "fr-FR" : "en-US";
  const categoryLang: CategoryLang = lng === "ar" ? "ar" : lng === "fr" ? "fr" : "en";
  const nameOf = (name: string) => displayEmployeeName(name, categoryLang);
  const roleOf = (role: string, categoryKey?: CategoryKey | null) =>
    roleDisplayLabel(role, categoryLang, categoryKey);
  const epiOf = (code: string, fallback: string) => epiItemLabel(t, code, fallback);
  return { t, i18n, lng, locale, categoryLang, nameOf, roleOf, epiOf };
}

export function categoryLabel(key: CategoryKey, lang: CategoryLang): string {
  return CATEGORIES[key]?.label[lang] ?? key;
}

export function categoryKeyFromRoleLabel(role: string): CategoryKey | null {
  const trimmed = (role ?? "").trim();
  if (!trimmed) return null;
  for (const key of CATEGORY_ORDER) {
    const labels = CATEGORIES[key].label;
    if (labels.ar === trimmed || labels.fr === trimmed || labels.en === trimmed) return key;
  }
  if (trimmed.includes("كناس") || trimmed.includes("عامل كنس")) return "sweeper";
  return null;
}

export function roleDisplayLabel(
  role: string,
  lang: CategoryLang,
  categoryKey?: CategoryKey | null
): string {
  const key = categoryKey ?? categoryKeyFromRoleLabel(role);
  if (key) return CATEGORIES[key].label[lang];
  return role;
}

export function epiItemLabel(t: TFunction, code: string, fallback: string): string {
  return t(`employee.epi.items.codes.${code}`, { defaultValue: fallback });
}

export function courseTitleForLang(
  title: Record<string, string>,
  lang: CategoryLang
): string {
  return title[lang] ?? title.en ?? title.fr ?? title.ar ?? "—";
}

export function employeeStatusLabel(t: TFunction, status: string): string {
  const map: Record<string, string> = {
    not_started: t("admin.page.status.notStarted"),
    in_progress: t("admin.page.status.inProgress"),
    completed: t("admin.page.status.completed"),
  };
  return map[status] ?? status;
}

export function epiStatusLabel(t: TFunction, status: string): string {
  const map: Record<string, string> = {
    not_started: t("admin.page.status.notStarted"),
    in_progress: t("admin.page.status.inProgress"),
    completed: t("admin.page.status.completed"),
    needs_followup: t("admin.page.status.needsFollowup"),
    pending: t("admin.page.status.pending"),
    ok: t("admin.page.status.ok"),
    received: t("admin.page.status.received"),
    not_issued: t("admin.page.status.notIssued"),
  };
  return map[status] ?? status;
}

export function epiDisplayStatusLabel(t: TFunction, displayStatus: string): string {
  const map: Record<string, string> = {
    not_issued: t("admin.page.epi.display.notIssued"),
    pending: t("admin.page.epi.display.pending"),
    received: t("admin.page.epi.display.received"),
    needs_renewal: t("admin.page.epi.display.needsRenewal"),
  };
  return map[displayStatus] ?? displayStatus;
}
