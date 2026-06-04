import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "@/api/api";
import { getStatusLabel } from "@/utils/epiStatus";

const NAVY = "#1e3a5f";

type CatalogItem = {
  code: string;
  labelAr: string;
  labelFr?: string;
  labelEn?: string;
  emoji: string | null;
  active: boolean;
};

export type IssueEpiEmployee = {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  items: { type: string; label: string; status: string; emoji: string }[];
};

type Props = {
  open: boolean;
  employee: IssueEpiEmployee | null;
  /** When set, pre-select these catalog codes instead of auto-suggest. */
  initialSelectedCodes?: string[];
  onClose: () => void;
  onIssued: () => void | Promise<void>;
  onError: (message: string) => void;
};

export function IssueEpiModal({ open, employee, initialSelectedCodes, onClose, onIssued, onError }: Props) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const itemByCode = useMemo(() => {
    const m = new Map<string, IssueEpiEmployee["items"][number]>();
    for (const it of employee?.items ?? []) m.set(it.type, it);
    return m;
  }, [employee]);

  const reset = useCallback(() => {
    setSelected([]);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open || !employee) {
      reset();
      return;
    }
    let ok = true;
    void (async () => {
      setLoadingCatalog(true);
      try {
        const { data } = await adminApi.epiCatalog();
        const items = ((data as { items?: CatalogItem[] }).items ?? []).filter((x) => x.active);
        if (!ok) return;
        setCatalog(items);
        const suggest = initialSelectedCodes?.length
          ? initialSelectedCodes
          : (employee.items ?? [])
              .filter((it) => it.status === "not_issued" || it.status === "needs_renewal" || it.status === "pending")
              .map((it) => it.type);
        const valid = suggest.filter((code) => items.some((c) => c.code === code));
        setSelected(valid.length ? valid : []);
      } catch {
        if (ok) onError("❌ تعذر تحميل قائمة المعدات");
      } finally {
        if (ok) setLoadingCatalog(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, [open, employee, initialSelectedCodes, onError, reset]);

  if (!open || !employee) return null;

  const toggle = (code: string) => {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const selectNotReceived = () => {
    setSelected(
      catalog
        .filter((c) => {
          const st = itemByCode.get(c.code)?.status;
          return !st || st === "not_issued";
        })
        .map((c) => c.code)
    );
  };

  const handleSubmit = async () => {
    if (!selected.length || submitting) return;
    setSubmitting(true);
    try {
      await adminApi.issueEpi({ userId: employee.id, itemCodes: selected });
      await onIssued();
      onClose();
      reset();
    } catch {
      onError("❌ تعذر إرسال المعدات — حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4" dir="rtl">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="إغلاق" onClick={onClose} />
      <div
        className="relative z-[1] flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 px-5 py-4 text-white" style={{ background: NAVY }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">إرسال معدات EPI</h2>
              <p className="mt-1 text-xs text-white/75">
                {employee.name} • {employee.employeeCode}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg text-white hover:bg-white/25"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-sm text-[#6b7280]">
            اختر المعدات التي تريد إرسالها للموظف. ستظهر لديه بحالة «في الانتظار» حتى يؤكد الاستلام.
          </p>

          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectNotReceived}
              className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5 text-xs font-bold text-[#374151] hover:bg-white"
            >
              تحديد غير المسلّمة
            </button>
            <button
              type="button"
              onClick={() => setSelected(catalog.map((c) => c.code))}
              className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5 text-xs font-bold text-[#374151] hover:bg-white"
            >
              تحديد الكل
            </button>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5 text-xs font-bold text-[#374151] hover:bg-white"
            >
              إلغاء التحديد
            </button>
          </div>

          {loadingCatalog ? (
            <p className="py-8 text-center text-sm font-semibold text-[#6b7280]">جاري التحميل...</p>
          ) : (
            <div className="grid max-h-[340px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {catalog.map((it) => {
                const checked = selected.includes(it.code);
                const existing = itemByCode.get(it.code);
                const existingLabel = existing ? getStatusLabel(existing.status).arabic : null;
                return (
                  <button
                    key={it.code}
                    type="button"
                    onClick={() => toggle(it.code)}
                    className={`flex items-start justify-between gap-2 rounded-xl border-2 px-3 py-2.5 text-right text-sm font-semibold transition ${
                      checked
                        ? "border-[#1e3a5f] bg-[#eff6ff] text-[#1e3a5f]"
                        : "border-[#e5e7eb] bg-white text-[#111827] hover:border-[#1e3a5f]/40"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="me-2 text-lg" aria-hidden>
                        {it.emoji ?? "🦺"}
                      </span>
                      {it.labelAr || it.labelFr || it.code}
                      {existingLabel ? (
                        <span className="mt-1 block text-[11px] font-medium text-[#6b7280]">
                          الحالة الحالية: {existingLabel}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs font-extrabold">{checked ? "✓" : ""}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e5e7eb] px-5 py-2.5 text-sm font-bold text-[#374151]"
          >
            إلغاء
          </button>
          {!selected.length && !submitting && (
            <span className="text-xs font-semibold text-[#ea580c]">⚠️ اختر معدة واحدة على الأقل</span>
          )}
          <button
            type="button"
            disabled={!selected.length || submitting}
            onClick={() => void handleSubmit()}
            className="rounded-xl px-6 py-2.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45"
            style={{ background: NAVY }}
          >
            {submitting ? "جاري الإرسال..." : `📦 إرسال (${selected.length})`}
          </button>
        </footer>
      </div>
    </div>
  );
}
