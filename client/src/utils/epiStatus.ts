import { computeDisplayStatus as computeExpiryOverride } from "@/utils/epiExpiry";

/** UI-only status keys (never written to DB). */
export type EpiDisplayStatus = "not_issued" | "pending" | "received" | "needs_renewal";

export type EpiStatusItemInput = {
  status: string;
  name: string;
  receivedDate: string | null;
  nextReplacementAt?: string | null;
};

const STATUS_META: Record<
  EpiDisplayStatus,
  { arabic: string; color: string; bgColor: string; tailwindText: string; tailwindBg: string }
> = {
  not_issued: {
    arabic: "لم يُسلم",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    tailwindText: "text-stone-600",
    tailwindBg: "bg-stone-100",
  },
  pending: {
    arabic: "في الانتظار",
    color: "#EA580C",
    bgColor: "#FFF7ED",
    tailwindText: "text-orange-700",
    tailwindBg: "bg-orange-50",
  },
  received: {
    arabic: "مستلم",
    color: "#16A34A",
    bgColor: "#ECFDF5",
    tailwindText: "text-emerald-800",
    tailwindBg: "bg-emerald-50",
  },
  needs_renewal: {
    arabic: "يحتاج تجديد",
    color: "#DC2626",
    bgColor: "#FEF2F2",
    tailwindText: "text-red-800",
    tailwindBg: "bg-red-50",
  },
};

function mapDbStatusToBase(status: string): EpiDisplayStatus {
  const s = String(status ?? "").trim().toLowerCase();
  if (s === "not_issued" || s === "not_received") return "not_issued";
  if (s === "issued" || s === "pending") return "pending";
  if (
    s === "needs_renewal" ||
    s === "needs_replacement" ||
    s === "pending_renewal" ||
    s === "expired" ||
    s === "replaced"
  ) {
    return "needs_renewal";
  }
  if (s === "received" || s === "مستلم") return "received";
  return "not_issued";
}

/**
 * Display-only status: applies expiry override on top of DB/mapped status.
 * Never persist the result.
 */
export function getDisplayStatus(item: EpiStatusItemInput): EpiDisplayStatus {
  const base = mapDbStatusToBase(item.status);
  if (base !== "received") return base;

  if (item.nextReplacementAt) {
    const expiry = new Date(item.nextReplacementAt);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return "needs_renewal";
    }
    return "received";
  }

  const overridden = computeExpiryOverride("received", item.name, item.receivedDate);
  if (overridden === "needs_renewal") return "needs_renewal";
  return "received";
}

export function getStatusLabel(displayStatus: EpiDisplayStatus | string): {
  arabic: string;
  color: string;
  bgColor: string;
  tailwindText: string;
  tailwindBg: string;
} {
  const key = mapDbStatusToBase(displayStatus);
  return STATUS_META[key];
}

export type EpiPillFlags = {
  ready: boolean;
  needsFollowup: boolean;
  pending: boolean;
  hasRenewalRequest: boolean;
};

export function getEmployeeEpiPillFlags(
  items: EpiStatusItemInput[],
  pendingRequests = 0
): EpiPillFlags {
  const displays = items.map((it) => getDisplayStatus(it));
  const ready = items.length > 0 && displays.every((s) => s === "received");
  const needsFollowup = displays.some((s) => s === "needs_renewal");
  const pending = displays.some((s) => s === "pending");
  return {
    ready,
    needsFollowup,
    pending,
    hasRenewalRequest: pendingRequests > 0,
  };
}
