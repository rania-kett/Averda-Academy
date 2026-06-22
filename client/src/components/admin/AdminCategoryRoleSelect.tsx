import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CATEGORY_ORDER, CATEGORIES, type CategoryKey } from "@/config/categories";
import type { CategoryLang } from "@/pages/admin/dashboardI18n";

type Props = {
  value: "all" | CategoryKey;
  onChange: (value: "all" | CategoryKey) => void;
  allLabel: string;
  categoryLang: CategoryLang;
  className?: string;
};

/** Longest role label in the active locale — fixes trigger + dropdown width for every option. */
function widestRoleLabel(allLabel: string, categoryLang: CategoryLang): string {
  return CATEGORY_ORDER.reduce((widest, key) => {
    const label = CATEGORIES[key].label[categoryLang];
    return label.length > widest.length ? label : widest;
  }, allLabel);
}

export function AdminCategoryRoleSelect({ value, onChange, allLabel, categoryLang, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const widthLabel = useMemo(() => widestRoleLabel(allLabel, categoryLang), [allLabel, categoryLang]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected =
    value === "all"
      ? null
      : {
          key: value,
          def: CATEGORIES[value],
          label: CATEGORIES[value].label[categoryLang],
        };

  return (
    <div ref={rootRef} className={`relative inline-grid w-fit max-w-full justify-items-stretch self-start ${className}`}>
      {/* Fixed width = longest role label (+ icon slot) — same width for every selection */}
      <div
        aria-hidden
        className="invisible col-start-1 row-start-1 inline-flex items-center justify-between gap-1.5 whitespace-nowrap px-3 py-2 text-[13px] font-semibold"
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="inline-block h-6 w-6 shrink-0" />
          <span>{widthLabel}</span>
        </span>
        <ChevronDown size={15} className="shrink-0" />
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="col-start-1 row-start-1 inline-flex w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-start text-[13px] font-semibold text-[#111827] shadow-sm transition hover:border-[#1e3a5f]/40"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          {selected ? (
            <>
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                style={{ background: selected.def.bgColor, color: selected.def.color }}
              >
                <selected.def.icon size={14} strokeWidth={2.5} aria-hidden />
              </span>
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span className="truncate text-[#6B7280]">{allLabel}</span>
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
            className={`flex w-full min-w-0 items-center gap-1.5 px-2.5 py-2 text-start text-[13px] font-semibold transition hover:bg-[#F9FAFB] ${
              value === "all" ? "bg-[#EFF6FF] text-[#1e3a5f]" : "text-[#374151]"
            }`}
          >
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F3F4F6] text-[#6B7280]">
              ☰
            </span>
            <span className="min-w-0 flex-1 truncate">{allLabel}</span>
          </button>
          {CATEGORY_ORDER.map((key) => {
            const def = CATEGORIES[key];
            const Icon = def.icon;
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
                className={`flex w-full min-w-0 items-center gap-1.5 px-2.5 py-2 text-start text-[13px] font-semibold transition hover:bg-[#F9FAFB] ${
                  active ? "font-bold" : ""
                }`}
                style={active ? { background: def.bgColor, color: def.color } : { color: def.color }}
              >
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{ background: def.bgColor, color: def.color }}
                >
                  <Icon size={14} strokeWidth={2.5} aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate">{def.label[categoryLang]}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
