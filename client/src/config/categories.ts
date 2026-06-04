import {
  Briefcase,
  Brush,
  Package,
  Trees,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type CategoryKey =
  | "driver"
  | "sweeper"
  | "loader"
  | "teamLeader"
  | "parkAgent"
  | "maintenance";

export type CategoryDef = {
  key: CategoryKey;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  label: { ar: string; fr: string; en: string };
};

export const CATEGORIES: Record<CategoryKey, CategoryDef> = {
  driver: {
    key: "driver",
    icon: Truck,
    color: "#2563EB",
    bgColor: "#EFF6FF",
    label: { ar: "سائق", fr: "Chauffeur", en: "Driver" },
  },
  sweeper: {
    key: "sweeper",
    icon: Brush,
    color: "#A0785A",
    bgColor: "#FDF6F0",
    label: { ar: "كناس", fr: "Balayeur", en: "Sweeper" },
  },
  loader: {
    key: "loader",
    icon: Package,
    color: "#6B3F1E",
    bgColor: "#FDF0E8",
    label: { ar: "شاحن", fr: "Chargeur", en: "Loader" },
  },
  teamLeader: {
    key: "teamLeader",
    icon: Briefcase,
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    label: { ar: "رئيس فريق", fr: "Chef d'équipe", en: "Team Leader" },
  },
  parkAgent: {
    key: "parkAgent",
    icon: Trees,
    color: "#16A34A",
    bgColor: "#F0FDF4",
    label: { ar: "عون الحظيرة", fr: "Agent de Parc", en: "Park Agent" },
  },
  maintenance: {
    key: "maintenance",
    icon: Wrench,
    color: "#6B7280",
    bgColor: "#F9FAFB",
    label: { ar: "عون الصيانة", fr: "Agent de Maintenance", en: "Maintenance Agent" },
  },
};

export const CATEGORY_ORDER: CategoryKey[] = [
  "driver",
  "sweeper",
  "loader",
  "teamLeader",
  "parkAgent",
  "maintenance",
];

export function categoryKeyFromCode(code?: string | null): CategoryKey | null {
  const c = (code || "").trim();
  if (!c) return null;
  const lower = c.toLowerCase();

  // Canonical keys
  if (lower === "driver" || lower === "drivers") return "driver";
  if (lower === "sweeper" || lower === "sweepers" || lower === "balayeur" || lower === "balayeurs")
    return "sweeper";
  if (lower === "loader" || lower === "chargeur" || lower === "chargeurs") return "loader";
  if (lower === "teamleader" || lower === "team_leader" || lower === "chef" || lower === "chef_equipe")
    return "teamLeader";
  if (lower === "parkagent" || lower === "parc" || lower === "agent_de_parc" || lower === "agent de parc")
    return "parkAgent";
  if (
    lower === "maintenance" ||
    lower === "agent_de_maintenance" ||
    lower === "agent de maintenance" ||
    lower === "agent_de_maintenance"
  )
    return "maintenance";

  // Legacy DB codes currently present in some environments
  if (lower === "collect_crews" || lower === "collect-crews" || lower.includes("collect")) return "loader";
  if (lower === "responsable_equipe" || lower === "responsable-equipe" || lower.includes("responsable"))
    return "teamLeader";

  return null;
}

export function getCategoryDefByCode(code?: string | null): CategoryDef | null {
  const key = categoryKeyFromCode(code);
  return key ? CATEGORIES[key] : null;
}

