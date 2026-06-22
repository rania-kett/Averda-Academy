import type { EpiSummaryLike } from "@/utils/epiProgress";
import { buildEpiProgress, isEpiNeedsStatus, type EpiRowStatus } from "@/utils/epiProgress";
import { getDisplayStatus, getEmployeeEpiPillFlags, getStatusLabel, type EpiPillFlags } from "@/utils/epiStatus";
import { categoryKeyFromCode, CATEGORIES, type CategoryKey } from "@/config/categories";

export type DashboardEpiItem = {
  type: string;
  label: string;
  /** Arabic catalog label — used for expiry lifespan lookup */
  labelAr: string;
  status: "received" | "pending" | "needs_renewal" | "not_issued";
  lastIssued?: string;
  confirmedAt?: string;
  nextReplacementAt?: string | null;
  photoProofPath?: string;
  emoji: string;
};

export type DashboardEpiEmployee = {
  /** User UUID — for admin API actions (remind, etc.) */
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  categoryKey?: CategoryKey | null;
  measurements: {
    shirt: string;
    pants: string;
    shoes: string;
    gloves: string;
    vest: string;
  };
  items: DashboardEpiItem[];
  pendingRequests: number;
  lastUpdated: string;
  statusSummary: "ok" | "needs_followup" | "pending";
};

function mapRowStatusToDashboard(status: EpiRowStatus): DashboardEpiItem["status"] {
  switch (status) {
    case "received":
      return "received";
    case "pending":
      return "pending";
    case "needs_renewal":
    case "needs_replacement":
      return "needs_renewal";
    default:
      return "not_issued";
  }
}

function roleLabelFromCategoryCode(code: string | null | undefined): string {
  const key = categoryKeyFromCode(code);
  if (key) return CATEGORIES[key].label.ar;
  return code ?? "—";
}

function statusLabelAr(status: DashboardEpiItem["status"], item?: DashboardEpiItem): string {
  if (item) {
    return getStatusLabel(
      getDisplayStatus({
        status: item.status,
        name: item.label,
        receivedDate: item.lastIssued ?? null,
        nextReplacementAt: item.nextReplacementAt ?? null,
      })
    ).arabic;
  }
  return getStatusLabel(status).arabic;
}

export function mapEpiSummaryToDashboardEmployee(
  row: {
    id: string;
    employeeId: string;
    name: string;
    categoryCode?: string | null;
    categoryNameAr?: string | null;
    pendingRequests?: number;
    summary: EpiSummaryLike;
  }
): DashboardEpiEmployee {
  const { items } = buildEpiProgress(row.summary);
  const profile = row.summary.profile;

  const dashboardItems: DashboardEpiItem[] = items.map(({ item, passport, status }) => ({
    type: item.code,
    label: item.labelAr || item.labelFr || item.labelEn || item.code,
    labelAr: item.labelAr || item.labelFr || item.labelEn || item.code,
    status: mapRowStatusToDashboard(status),
    lastIssued: passport?.issuedAt ? String(passport.issuedAt) : undefined,
    confirmedAt: passport?.lastReceptionAt ? String(passport.lastReceptionAt) : undefined,
    nextReplacementAt: (passport as any)?.nextReplacementAt ? String((passport as any).nextReplacementAt) : null,
    photoProofPath: (passport as any)?.photoProofPath ? String((passport as any).photoProofPath) : undefined,
    emoji: item.emoji ?? "🦺",
  }));

  const pendingRequests = row.pendingRequests ?? 0;
  const pillFlags = getEmployeeEpiPillFlags(
    dashboardItems.map((it) => ({
      status: it.status,
      name: it.label,
      receivedDate: it.lastIssued ?? null,
      nextReplacementAt: it.nextReplacementAt ?? null,
    })),
    pendingRequests
  );
  /** Legacy single tab — prefer getEmployeeEpiPillFlags for filters (employees can match multiple pills). */
  let statusSummary: DashboardEpiEmployee["statusSummary"] = "ok";
  if (pillFlags.needsFollowup) statusSummary = "needs_followup";
  else if (pillFlags.pending) statusSummary = "pending";

  const dates: number[] = [];
  if (profile && "updatedAt" in profile && profile.updatedAt) {
    dates.push(new Date(String(profile.updatedAt)).getTime());
  }
  for (const p of row.summary.passport ?? []) {
    if (p.issuedAt) dates.push(new Date(String(p.issuedAt)).getTime());
  }

  const catKey = categoryKeyFromCode(row.categoryCode);

  return {
    id: row.id,
    employeeCode: row.employeeId,
    name: row.name,
    role: row.categoryNameAr ?? roleLabelFromCategoryCode(row.categoryCode),
    categoryKey: catKey,
    measurements: {
      shirt: profile?.shirtSize?.trim() || "—",
      pants: profile?.pantsSize?.trim() || "—",
      shoes: profile?.shoeSize?.trim() || "—",
      gloves: profile?.gloveSize?.trim() || "—",
      vest: profile?.vestSize?.trim() || "—",
    },
    items: dashboardItems,
    pendingRequests,
    lastUpdated: dates.length
      ? new Date(Math.max(...dates)).toISOString()
      : new Date().toISOString(),
    statusSummary,
  };
}

/** Re-export for admin UI status chips (same labels as employee-facing badges). */
export { statusLabelAr, isEpiNeedsStatus, getEmployeeEpiPillFlags, getDisplayStatus, getStatusLabel };
export type { EpiPillFlags };
