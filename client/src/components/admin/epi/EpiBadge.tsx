import type { EpiItem } from "./types";

function tone(item: EpiItem): "green" | "yellow" | "red" | "orange" {
  if (item.statut === "Reçu") {
    return item.fit ? "green" : "orange";
  }
  if (item.statut === "En cours") return "yellow";
  return "red";
}

const clsByTone: Record<ReturnType<typeof tone>, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-900/40",
  yellow: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-900/40",
  red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-900/40",
  orange: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-200 dark:ring-orange-900/40",
};

export function EpiBadge({ item }: { item: EpiItem }) {
  const t = tone(item);
  const dot =
    t === "green" ? "🟢" : t === "yellow" ? "🟡" : t === "orange" ? "🟠" : "🔴";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ${clsByTone[t]}`}
      title={`${item.nom} — ${item.statut}${item.statut === "Reçu" ? item.fit ? " (fit OK)" : " (fit NOK)" : ""}`}
    >
      <span aria-hidden className="text-[11px] leading-none">{dot}</span>
      <span className="truncate">{item.nom}</span>
    </span>
  );
}

