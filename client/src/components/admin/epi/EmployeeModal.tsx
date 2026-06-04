import { X } from "lucide-react";
import { adminCard, adminMuted, adminStrong } from "@/components/admin/adminClasses";
import type { EpiEmployee, EpiItem, EpiStatusFr } from "./types";
import { EpiBadge } from "./EpiBadge";

export function EmployeeModal(props: {
  open: boolean;
  employee: EpiEmployee | null;
  onClose: () => void;
  onChangeItem: (employeeId: string, itemName: string, patch: Partial<EpiItem>) => void;
}) {
  const { open, employee, onClose, onChangeItem } = props;
  if (!open || !employee) return null;

  const statusOptions: EpiStatusFr[] = ["Attribué", "En cours", "Reçu"];

  return (
    <div className="fixed inset-0 z-[200]">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl">
        <div className={`${adminCard} rounded-t-2xl p-5 shadow-2xl`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={`text-[16px] font-medium ${adminStrong}`}>{employee.nom}</div>
              <div className={`mt-1 text-[13px] ${adminMuted}`} dir="ltr">
                {employee.employee_id} • {employee.poste}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB] active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {employee.equipements.map((it) => (
              <EpiBadge key={it.nom} item={it} />
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {employee.equipements.map((it) => (
              <div key={it.nom} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[#111827] dark:text-white">{it.nom}</div>
                    <div className={`mt-1 text-[12px] ${adminMuted}`}>
                      Statut: <span className="font-medium">{it.statut}</span>
                      {it.taille ? <span className="ms-2" dir="ltr">• Taille {it.taille}</span> : null}
                    </div>
                  </div>
                  <EpiBadge item={it} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] font-medium text-[#111827] dark:border-white/10 dark:bg-white/5 dark:text-white">
                    Réception
                    <input
                      type="checkbox"
                      checked={it.reception}
                      onChange={(e) =>
                        onChangeItem(employee.employee_id, it.nom, { reception: e.target.checked })
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] font-medium text-[#111827] dark:border-white/10 dark:bg-white/5 dark:text-white">
                    Fit OK
                    <input
                      type="checkbox"
                      checked={it.fit}
                      onChange={(e) => onChangeItem(employee.employee_id, it.nom, { fit: e.target.checked })}
                    />
                  </label>
                  <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                    <div className={`text-[12px] ${adminMuted}`}>Taille</div>
                    <input
                      value={it.taille ?? ""}
                      onChange={(e) => onChangeItem(employee.employee_id, it.nom, { taille: e.target.value || null })}
                      className="mt-1 w-full bg-transparent text-[13px] font-medium text-[#111827] outline-none dark:text-white"
                      placeholder="—"
                    />
                  </div>
                  <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                    <div className={`text-[12px] ${adminMuted}`}>Statut</div>
                    <select
                      value={it.statut}
                      onChange={(e) => onChangeItem(employee.employee_id, it.nom, { statut: e.target.value as EpiStatusFr })}
                      className="mt-1 w-full bg-transparent text-[13px] font-medium text-[#111827] outline-none dark:text-white"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                // Quick action: mark all "Attribué" as "En cours" (UI helper)
                employee.equipements
                  .filter((x) => x.statut === "Attribué")
                  .forEach((x) => onChangeItem(employee.employee_id, x.nom, { statut: "En cours" }));
              }}
              className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-medium text-[#111827] hover:bg-[#F9FAFB] active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              Fix issues (attribué → en cours)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg bg-[#3B6BE8] px-3 text-[13px] font-medium text-white hover:opacity-95 active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

