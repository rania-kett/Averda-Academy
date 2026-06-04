import type { EpiCatalogItem, EpiPassportItem, EpiProfile } from "@/api/api";

export type EpiRowStatus = "received" | "pending" | "needs_renewal" | "needs_replacement" | "not_received";

export type EpiSummaryLike = {
  profileComplete?: boolean;
  profile?: EpiProfile | null;
  catalog?: EpiCatalogItem[];
  categoryDefaults?: {
    categoryId: string;
    itemCode: string;
    required: boolean;
    lifetimeDaysOverride: number | null;
    sortOrder: number;
  }[];
  passport?: (EpiPassportItem & { item?: EpiCatalogItem | null })[];
};

export type EpiProgressItem = {
  item: EpiCatalogItem;
  passport: EpiPassportItem | null;
  status: EpiRowStatus;
};

export function isEpiNeedsStatus(s: EpiRowStatus): boolean {
  return s === "needs_renewal" || s === "needs_replacement";
}

/** Latest issuance per item code (passport may contain history rows). */
export function passportByItemCode(passport: EpiPassportItem[]): Map<string, EpiPassportItem> {
  const byCode = new Map<string, EpiPassportItem>();
  const sorted = [...passport].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
  );
  for (const row of sorted) {
    if (!row.itemCode) continue;
    if (!byCode.has(row.itemCode)) byCode.set(row.itemCode, row);
  }
  return byCode;
}

export function getEpiRowStatus(p: EpiPassportItem | null, nowMs = Date.now()): EpiRowStatus {
  if (!p) return "not_received";
  if (p.status === "needs_replacement" || p.status === "expired") return "needs_replacement";
  if (p.status === "pending_renewal") return "needs_renewal";
  const overdue = p.nextReplacementAt ? new Date(p.nextReplacementAt).getTime() < nowMs : false;
  if (overdue && p.status === "received") return "needs_renewal";
  if (p.status === "received") return "received";
  if (p.status === "issued") return "pending";
  return "pending";
}

export function buildEpiProgress(summary: EpiSummaryLike | null | undefined, nowMs = Date.now()) {
  const passport = summary?.passport ?? [];
  const catalog = (summary?.catalog ?? []).filter((x) => x.active);
  const defaults = (summary?.categoryDefaults ?? []).filter((x) => x.required !== false);
  const byCode = passportByItemCode(passport);
  const catByCode = new Map(catalog.map((x) => [x.code, x]));

  const baseOrdered =
    defaults.length > 0
      ? defaults
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((x) => x.itemCode)
      : catalog
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((x) => x.code);

  /** Include admin-issued items even if not yet in category defaults. */
  const orderedCodes = [
    ...baseOrdered,
    ...[...byCode.keys()].filter((code) => !baseOrdered.includes(code)),
  ];

  const resolveItem = (code: string): EpiCatalogItem | null => {
    const fromCatalog = catByCode.get(code);
    if (fromCatalog) return fromCatalog;
    const row = byCode.get(code);
    if (row?.item?.code) return row.item;
    return null;
  };

  const items = orderedCodes
    .map((code) => {
      const item = resolveItem(code);
      if (!item) return null;
      const row = byCode.get(code) ?? null;
      return { item, passport: row, status: getEpiRowStatus(row, nowMs) };
    })
    .filter(Boolean) as EpiProgressItem[];

  const total = items.length || 1;
  const received = items.filter((x) => x.status === "received").length;
  const pending = items.filter((x) => x.status === "pending").length;
  const needs = items.filter((x) => isEpiNeedsStatus(x.status)).length;
  const notReceived = items.filter((x) => x.status === "not_received").length;
  const pct = Math.round((received / total) * 100);

  return { items, counts: { received, pending, needs, notReceived, total, pct } };
}
