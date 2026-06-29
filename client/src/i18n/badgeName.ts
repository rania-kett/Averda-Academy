import type { TFunction } from "i18next";

export type EmployeeBadgeLang = "ar" | "fr" | "en";

/** Shared i18n key prefix for badge titles (badges page, challenges, profile, home). */
export function employeeBadgeNameKey(badgeKey: string): string {
  return `employee.badgeName.${badgeKey}`;
}

function fallbackTitleFromApi(title: unknown, lang: EmployeeBadgeLang, key: string): string {
  const m = title as Record<string, string> | undefined;
  return (m?.[lang] || m?.ar || m?.en || m?.fr || key).trim();
}

/**
 * Resolved badge label: translated by catalog key when present, otherwise API title fields.
 */
export function translatedEmployeeBadgeName(
  badge: { key: string; title: unknown },
  t: TFunction,
  lang: EmployeeBadgeLang
): string {
  const k = employeeBadgeNameKey(badge.key);
  const translated = t(k);
  if (translated !== k) return translated;
  return fallbackTitleFromApi(badge.title, lang, badge.key);
}

/** Human-readable list of newly earned badge keys for toasts and banners. */
export function formatNewBadgeLabels(
  keys: string[],
  t: TFunction,
  lang: EmployeeBadgeLang
): string {
  const sep = lang === "ar" ? "، " : ", ";
  return keys.map((key) => translatedEmployeeBadgeName({ key, title: {} }, t, lang)).join(sep);
}
