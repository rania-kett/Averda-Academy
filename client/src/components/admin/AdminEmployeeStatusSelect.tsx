import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { COLORS } from "@/components/admin/adminThemeTokens";

export type EmployeeStatusFilter = "all" | "not_started" | "in_progress" | "completed";

type StatusKey = Exclude<EmployeeStatusFilter, "all">;

const STATUS_ORDER: StatusKey[] = ["not_started", "in_progress", "completed"];

const STATUS_STYLES: Record<StatusKey, { color: string; bg: string }> = {
  not_started: { color: COLORS.gray, bg: COLORS.grayLight },
  in_progress: { color: COLORS.blue, bg: COLORS.blueLight },
  completed: { color: COLORS.green, bg: COLORS.greenLight },
};

type Props = {
  value: EmployeeStatusFilter;
  onChange: (value: EmployeeStatusFilter) => void;
  allLabel: string;
  getLabel: (status: StatusKey) => string;
  className?: string;
};

export function AdminEmployeeStatusSelect({ value, onChange, allLabel, getLabel, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = value === "all" ? null : { style: STATUS_STYLES[value], label: getLabel(value) };

  return (
    <div ref={rootRef} className={`relative inline-grid w-fit max-w-full self-start ${className}`}>
      {/* Fixed width = « all statuses » label — dropdown never grows wider */}
      <div
        aria-hidden
        className="invisible col-start-1 row-start-1 inline-flex items-center justify-between gap-1.5 whitespace-nowrap px-3 py-2 text-[13px] font-semibold"
      >
        <span>{allLabel}</span>
        <ChevronDown size={15} className="shrink-0" />
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="col-start-1 row-start-1 inline-flex w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-start text-[13px] font-semibold text-[#111827] shadow-sm transition hover:border-[#1e3a5f]/40"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? (
            <span style={{ color: selected.style.color }}>{selected.label}</span>
          ) : (
            <span className="text-[#6B7280]">{allLabel}</span>
          )}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-[#6B7280] transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute z-50 mt-1 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white py-0.5 shadow-lg"
          style={{ insetInlineStart: 0, insetInlineEnd: 0, top: "100%", width: "100%" }}
        >
          <button
            type="button"
            role="option"
            aria-selected={value === "all"}
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
            className={`flex w-full min-w-0 items-center px-2.5 py-2 text-start text-[13px] font-semibold transition hover:bg-[#F9FAFB] ${
              value === "all" ? "bg-[#EFF6FF] text-[#1e3a5f]" : "text-[#374151]"
            }`}
          >
            <span className="truncate">{allLabel}</span>
          </button>
          {STATUS_ORDER.map((key) => {
            const style = STATUS_STYLES[key];
            const active = value === key;
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={`flex w-full min-w-0 items-center px-2.5 py-2 text-start text-[13px] font-semibold transition ${
                  active ? "font-bold" : "hover:opacity-90"
                }`}
                style={{
                  background: style.bg,
                  color: style.color,
                }}
              >
                <span className="truncate">{getLabel(key)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
