import { AlertTriangle, CheckCircle2, ClipboardList, Hourglass } from "lucide-react";
import { adminCard, adminMuted, adminStrong } from "@/components/admin/adminClasses";

function Card(props: {
  label: string;
  value: string;
  icon: "green" | "blue" | "amber" | "red";
}) {
  const { label, value, icon } = props;
  const iconCls =
    icon === "green"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
      : icon === "blue"
        ? "bg-[#EEF2FF] text-[#3B6BE8] dark:bg-white/5 dark:text-indigo-200"
        : icon === "amber"
          ? "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"
          : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200";

  const Icon =
    icon === "green"
      ? CheckCircle2
      : icon === "blue"
        ? ClipboardList
        : icon === "amber"
          ? Hourglass
          : AlertTriangle;

  return (
    <div className={`${adminCard} p-4`}>
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-[10px] ${iconCls}`} aria-hidden>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className={`text-[12px] font-medium ${adminMuted}`}>{label}</div>
          <div className={`mt-1 text-[22px] font-semibold tabular-nums ${adminStrong}`}>{value}</div>
        </div>
      </div>
    </div>
  );
}

export function KPISection(props: {
  complianceRatePct: number;
  fitCompliancePct: number;
  missingCount: number;
  inProgressCount: number;
}) {
  const { complianceRatePct, fitCompliancePct, missingCount, inProgressCount } = props;
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Card label="Compliance (Reçu)" value={`${Math.round(complianceRatePct)}%`} icon="green" />
      <Card label="Fit compliance" value={`${Math.round(fitCompliancePct)}%`} icon="blue" />
      <Card label="Équipements manquants" value={String(missingCount)} icon="red" />
      <Card label="En cours" value={String(inProgressCount)} icon="amber" />
    </div>
  );
}

