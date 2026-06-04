import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { adminCard, adminMuted, adminStrong } from "@/components/admin/adminClasses";
import type { AlertSeverity, EpiAlert } from "./types";

const sevRank: Record<AlertSeverity, number> = { critical: 0, high: 1, medium: 2 };

function sevUi(sev: AlertSeverity) {
  if (sev === "critical")
    return {
      pill: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-900/40",
      Icon: AlertCircle,
      label: "CRITICAL",
    };
  if (sev === "high")
    return {
      pill: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-200 dark:ring-orange-900/40",
      Icon: AlertTriangle,
      label: "HIGH",
    };
  return {
    pill: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-900/40",
    Icon: Info,
    label: "MEDIUM",
  };
}

export function AlertsPanel(props: { alerts: EpiAlert[] }) {
  const alerts = [...props.alerts].sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
  return (
    <div className={`${adminCard} p-4`}>
      <div className="flex items-center justify-between gap-3">
        <div className={`text-[14px] font-medium ${adminStrong}`}>Alertes</div>
        <span className={`text-[12px] font-medium ${adminMuted}`}>{alerts.length}</span>
      </div>

      {!alerts.length ? (
        <div className={`mt-4 rounded-xl border border-dashed border-[#E5E7EB] p-4 text-[13px] ${adminMuted} dark:border-white/10`}>
          Aucune alerte.
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {alerts.slice(0, 12).map((a) => {
            const ui = sevUi(a.severity);
            return (
              <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#F3F4F6] bg-white p-3 dark:border-white/10 dark:bg-white/5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${ui.pill}`}>
                      <ui.Icon className="h-3.5 w-3.5" aria-hidden />
                      {ui.label}
                    </span>
                    <span className="truncate text-[12px] font-semibold text-[#111827] dark:text-white">
                      {a.employeeName} ({a.employee_id}) — {a.role}
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] text-[#374151] dark:text-slate-200">
                    <span className="font-medium">{a.equipmentName}:</span> {a.message}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

