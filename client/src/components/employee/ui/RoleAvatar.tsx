import { Briefcase } from "lucide-react";
import { getCategoryDefByCode } from "@/config/categories";

export type RoleAvatarKind =
  | "chauffeur"
  | "balayeur"
  | "chargeur"
  | "maintenance"
  | "parc"
  | "manager"
  | "unknown";

function normalizeCode(code?: string | null, employeeId?: string | null): RoleAvatarKind {
  const c = (code || "").toLowerCase();
  const e = (employeeId || "").toLowerCase();
  if (c === "driver" || c.includes("chauffeur") || c.includes("driver")) return "chauffeur";
  if (c.includes("drv") || e.includes("avr-drv") || e.includes("-drv-")) return "chauffeur";
  if (c === "sweeper" || c.includes("balayeur") || c.includes("sweeper")) return "balayeur";
  if (c === "loader" || c.includes("chargeur") || c.includes("loader")) return "chargeur";
  if (c.includes("wrk") || e.includes("avr-wrk") || e.includes("-wrk-")) {
    // Worker categories are not uniquely inferable from WRK alone.
    // Keep unknown unless category code provides a specific role.
  }
  if (c === "maintenance" || c.includes("maintenance")) return "maintenance";
  if (c === "parkagent" || c.includes("parc") || c.includes("park")) return "parc";
  if (c === "teamleader" || c.includes("management") || c.includes("manager") || c.includes("admin")) return "manager";
  return "unknown";
}

export function roleAvatarKindFromCategoryCode(
  code?: string | null,
  employeeId?: string | null
): RoleAvatarKind {
  return normalizeCode(code, employeeId);
}

function categoryCodeFromKind(kind: RoleAvatarKind): string | null {
  if (kind === "chauffeur") return "driver";
  if (kind === "balayeur") return "sweeper";
  if (kind === "chargeur") return "loader";
  if (kind === "maintenance") return "maintenance";
  if (kind === "parc") return "parkAgent";
  if (kind === "manager") return "teamLeader";
  return null;
}

export function RoleAvatar({
  categoryCode,
  kind,
  className = "",
  title,
  showBadge = false,
  employeeId,
}: {
  categoryCode?: string | null;
  kind?: RoleAvatarKind;
  className?: string;
  title?: string;
  showBadge?: boolean;
  employeeId?: string | null;
}) {
  const resolvedKind = kind ?? normalizeCode(categoryCode, employeeId);
  const meta = getCategoryDefByCode(categoryCode) ?? getCategoryDefByCode(categoryCodeFromKind(resolvedKind));
  const roleColor = meta?.color ?? "#6B7280";
  const Icon = meta?.icon ?? Briefcase;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full ${className}`.trim()}
      style={{ backgroundColor: roleColor }}
      aria-label={title}
      title={title}
    >
      <Icon className="block h-5 w-5 text-white" aria-hidden strokeWidth={2.75} />
      {showBadge && (
        <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-white">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: roleColor }} aria-hidden />
        </span>
      )}
    </div>
  );
}

