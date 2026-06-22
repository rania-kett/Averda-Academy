import type { TFunction } from "i18next";

const EPI_LIFESPANS_DAYS: Record<string, number> = {
  "حذاء السلامة": 365,
  "قفازات العمل": 90,
  "قفازات مقواة": 90,
  "قناع ضد الغبار": 30,
  "صديرية عاكسة": 180,
  "بدلة عمل كاملة": 365,
  "قبعة": 365,
  "قبعة شتوية": 365,
  "بلوفر شتوي": 365,
  "نظارات الحماية": 180,
  "واقي الأذن": 180,
  "معطف المطر": 365,
  "سترة عاكسة عالية الرؤية": 180,
  "تيشيرت": 180,
  "بنطلون العمل": 365,
};

export function getExpiryDate(itemName: string, receivedDate: Date): Date | null {
  const days = EPI_LIFESPANS_DAYS[itemName];
  if (!days || !receivedDate) return null;
  const expiry = new Date(receivedDate);
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

export function getDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Read-time display override only — never persist or send to API. */
export function computeDisplayStatus(
  dbStatus: string,
  itemName: string,
  receivedDate: string | Date | null
): string {
  if (dbStatus !== "received" && dbStatus !== "مستلم") return dbStatus;
  if (!receivedDate) return dbStatus;

  const expiryDate = getExpiryDate(itemName, new Date(receivedDate));
  if (!expiryDate) return dbStatus;

  const daysLeft = getDaysUntilExpiry(expiryDate);
  if (daysLeft < 0) return "needs_renewal";

  return dbStatus;
}

export function getExpiryLabel(
  itemName: string,
  receivedDate: string | Date | null,
  t?: TFunction
): {
  text: string;
  color: "green" | "orange" | "red" | null;
} {
  if (!receivedDate) return { text: "", color: null };
  const expiryDate = getExpiryDate(itemName, new Date(receivedDate));
  if (!expiryDate) return { text: "", color: null };

  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) {
    const n = Math.abs(days);
    return {
      text: t
        ? t("admin.page.epi.expiry.expiredDays", { n })
        : `انتهت منذ ${n} يوم`,
      color: "red",
    };
  }
  if (days <= 7) {
    return {
      text: t
        ? t("admin.page.epi.expiry.withinDaysWarn", { n: days })
        : `ينتهي خلال ${days} أيام ⚠️`,
      color: "orange",
    };
  }
  if (days <= 30) {
    return {
      text: t
        ? t(days === 1 ? "admin.page.epi.expiry.withinDay" : "admin.page.epi.expiry.withinDays", { n: days })
        : `ينتهي خلال ${days} يوم`,
      color: "orange",
    };
  }
  return {
    text: t
      ? t("admin.page.epi.expiry.withinDays", { n: days })
      : `ينتهي في ${days} يوم`,
    color: "green",
  };
}
