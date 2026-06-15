import { useMemo, useState, useEffect, type ReactNode } from "react";
import { Briefcase, X } from "lucide-react";
import { CATEGORIES, type CategoryKey } from "@/config/categories";
import type { DashboardEpiEmployee, DashboardEpiItem } from "@/utils/mapEpiSummaryToDashboard";
import { getDaysUntilExpiry, getExpiryDate } from "@/utils/epiExpiry";
import { getDisplayStatus, getStatusLabel } from "@/utils/epiStatus";

const NAVY = "#1e3a5f";

type Selection = {
  item: DashboardEpiItem;
  employee: DashboardEpiEmployee;
};

type Props = {
  selection: Selection | null;
  onClose: () => void;
  onIssueRenewal: (employee: DashboardEpiEmployee, itemCode: string) => void;
};

function roleAvatarFromLabel(roleLabel: string) {
  for (const key of Object.keys(CATEGORIES) as CategoryKey[]) {
    if (CATEGORIES[key].label.ar === roleLabel) {
      const c = CATEGORIES[key];
      return { Icon: c.icon, color: c.color };
    }
  }
  return { Icon: Briefcase, color: "#6B7280" };
}

function formatArDate(iso: string | undefined | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-MA", { day: "numeric", month: "long", year: "numeric" });
}

function resolveExpiry(item: DashboardEpiItem): Date | null {
  if (item.nextReplacementAt) {
    const d = new Date(item.nextReplacementAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (item.lastIssued) {
    return getExpiryDate(item.label, new Date(item.lastIssued));
  }
  return null;
}

function expiryColor(days: number | null) {
  if (days == null) return "#6B7280";
  if (days < 0) return "#DC2626";
  if (days <= 30) return "#EA580C";
  return "#16A34A";
}

function sectionCard(title: string, children: ReactNode) {
  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-[#FAFAF9] p-4 dark:border-[#30363D] dark:bg-[#161B22]">
      <div className="mb-3 text-[13px] font-extrabold text-[#1e3a5f] dark:text-white">{title}</div>
      {children}
    </div>
  );
}

export function EpiItemDetailModal({ selection, onClose, onIssueRenewal }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const detail = useMemo(() => {
    if (!selection) return null;
    const { item, employee } = selection;
    const visualStatus = getDisplayStatus({
      status: item.status,
      name: item.label,
      receivedDate: item.lastIssued ?? null,
      nextReplacementAt: item.nextReplacementAt ?? null,
    });
    const statusMeta = getStatusLabel(visualStatus);
    const expiry = resolveExpiry(item);
    const daysLeft = expiry ? getDaysUntilExpiry(expiry) : null;
    const expiryTint = expiryColor(daysLeft);
    const photoUrl = item.photoProofPath?.trim() || null;
    return { item, employee, visualStatus, statusMeta, expiry, daysLeft, expiryTint, photoUrl };
  }, [selection]);

  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox]);

  if (!selection || !detail) return null;

  const { item, employee, visualStatus, statusMeta, expiry, daysLeft, expiryTint, photoUrl } = detail;

  const showRenewalAction = visualStatus === "needs_renewal";
  const showPendingInfo = visualStatus === "pending";
  const showOkInfo = visualStatus === "received";

  return (
    <>
      <div
        className="fixed inset-0 z-[3200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#0D1117]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-[#E7E5E4] px-5 py-4 dark:border-[#30363D]">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E7E5E4] bg-white text-[#374151] transition hover:bg-[#F3F4F6] dark:border-[#30363D] dark:bg-[#161B22] dark:text-white"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1 text-end">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-2xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <h2 className="text-[17px] font-extrabold text-[#1e3a5f] dark:text-white">{item.label}</h2>
                </div>
                <div className="mt-2 flex justify-end">
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-[12px] font-bold"
                    style={{ background: statusMeta.bgColor, color: statusMeta.color }}
                  >
                    {statusMeta.arabic}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[min(70vh,640px)] space-y-3 overflow-y-auto px-5 py-4">
            {sectionCard(
              "معلومات الموظف",
              <div className="flex items-center gap-3">
                {(() => {
                  const { Icon, color } = roleAvatarFromLabel(employee.role);
                  return (
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white"
                      style={{ background: color }}
                    >
                      <Icon size={20} color="#fff" strokeWidth={2.75} aria-hidden />
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <div className="text-[14px] font-extrabold text-[#111827] dark:text-white">{employee.name}</div>
                  <div className="text-[12px] font-semibold text-[#6B7280]">{employee.employeeCode}</div>
                  <div className="text-[12px] font-semibold text-[#374151] dark:text-stone-300">{employee.role}</div>
                </div>
              </div>
            )}

            {sectionCard(
              "تفاصيل المعدة",
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-[#374151] dark:text-stone-300">المعدة</span>
                  <span className="font-bold text-[#111827] dark:text-white">{item.label}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-[#374151] dark:text-stone-300">تاريخ الإصدار</span>
                  <span className="font-bold text-[#111827] dark:text-white">{formatArDate(item.lastIssued)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-[#374151] dark:text-stone-300">تاريخ الاستلام</span>
                  <span
                    className={`font-bold ${item.confirmedAt ? "text-[#111827] dark:text-white" : "text-amber-600"}`}
                  >
                    {item.confirmedAt ? formatArDate(item.confirmedAt) : "لم يُؤكد بعد"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-[#374151] dark:text-stone-300">تاريخ الانتهاء</span>
                  <span className="font-bold" style={{ color: expiryTint }}>
                    {expiry ? formatArDate(expiry.toISOString()) : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-[#374151] dark:text-stone-300">أيام متبقية</span>
                  <span className="font-bold" style={{ color: expiryTint }}>
                    {daysLeft != null ? (daysLeft < 0 ? `منتهي (${Math.abs(daysLeft)} يوم)` : `${daysLeft} يوم`) : "—"}
                  </span>
                </div>
              </div>
            )}

            {sectionCard(
              "صورة تأكيد الاستلام",
              photoUrl ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setLightbox(photoUrl)}
                    className="block w-full overflow-hidden rounded-xl border border-[#E7E5E4] bg-white dark:border-[#30363D]"
                  >
                    <img
                      src={photoUrl}
                      alt="إثبات الاستلام"
                      className="mx-auto max-h-[300px] w-full object-contain"
                    />
                  </button>
                  {item.confirmedAt ? (
                    <p className="text-center text-[11px] font-semibold text-[#6B7280]">
                      تم التأكيد بتاريخ: {formatArDate(item.confirmedAt)}
                    </p>
                  ) : null}
                  <a
                    href={photoUrl}
                    download
                    className="inline-flex w-full items-center justify-center rounded-xl border border-[#1e3a5f] px-4 py-2.5 text-[13px] font-bold text-[#1e3a5f] transition hover:bg-[#1e3a5f]/5"
                  >
                    ⬇ تحميل الصورة
                  </a>
                </div>
              ) : visualStatus === "received" || visualStatus === "needs_renewal" ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D6D3D1] bg-white px-4 py-8 text-center dark:border-[#44403C] dark:bg-[#0D1117]">
                  <span className="text-3xl opacity-40" aria-hidden>
                    📷
                  </span>
                  <p className="mt-2 text-[13px] font-semibold text-[#6B7280]">تم التأكيد بدون صورة</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-8 text-center dark:border-amber-900/40 dark:bg-amber-500/10">
                  <span className="text-2xl" aria-hidden>
                    ⏳
                  </span>
                  <p className="mt-2 text-[13px] font-semibold text-amber-800 dark:text-amber-200">
                    لم يتم تأكيد الاستلام بعد
                  </p>
                </div>
              )
            )}
          </div>

          <div className="border-t border-[#E7E5E4] px-5 py-4 dark:border-[#30363D]">
            {showRenewalAction ? (
              <button
                type="button"
                onClick={() => {
                  onIssueRenewal(employee, item.type);
                  onClose();
                }}
                className="w-full rounded-xl px-4 py-3 text-[14px] font-extrabold text-white transition hover:opacity-95"
                style={{ background: NAVY }}
              >
                إرسال معدة جديدة
              </button>
            ) : showPendingInfo ? (
              <p className="text-center text-[13px] font-bold text-amber-700 dark:text-amber-300">في انتظار تأكيد الموظف</p>
            ) : showOkInfo ? (
              <p className="text-center text-[13px] font-bold text-emerald-700 dark:text-emerald-300">✅ المعدة في حالة جيدة</p>
            ) : null}
          </div>
        </div>
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[3300] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute end-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox}
            alt="إثبات الاستلام"
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
