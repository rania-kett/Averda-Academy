import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { DashboardEpiEmployee } from "@/utils/mapEpiSummaryToDashboard";
import {
  exportEmployeesExcel,
  exportEpiExcel,
  exportPerformanceExcel,
  type ExportCourseRow,
  type ExportEmployeeRow,
  type ExportWeeklyRow,
} from "@/utils/adminDashboardExport";

const NAVY = "#1e3a5f";
const WHITE = "#ffffff";
const BORDER = "#e2e8f0";
const TEXT_MUTED = "#64748b";

type Props = {
  employees: ExportEmployeeRow[];
  epiEmployees: DashboardEpiEmployee[];
  courses: ExportCourseRow[];
  weekly: ExportWeeklyRow[];
  onExported: () => void;
};

const MENU_ITEMS = [
  { id: "employees" as const, label: "تصدير بيانات الموظفين" },
  { id: "epi" as const, label: "تصدير بيانات EPI" },
  { id: "performance" as const, label: "تصدير ملخص الأداء" },
];

export function AdminExportDropdown({ employees, epiEmployees, courses, weekly, onExported }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const runExport = async (id: (typeof MENU_ITEMS)[number]["id"]) => {
    setOpen(false);
    if (id === "employees") await exportEmployeesExcel(employees);
    else if (id === "epi") await exportEpiExcel(epiEmployees);
    else await exportPerformanceExcel(employees, courses, weekly);
    onExported();
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 20px",
          borderRadius: 10,
          border: `2px solid ${NAVY}`,
          background: WHITE,
          color: NAVY,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        تصدير
        <ChevronDown size={16} strokeWidth={2.5} aria-hidden style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: 240,
            background: WHITE,
            borderRadius: 10,
            border: `1px solid ${BORDER}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => void runExport(item.id)}
              style={{
                display: "block",
                width: "100%",
                padding: "12px 16px",
                border: "none",
                background: WHITE,
                color: NAVY,
                fontSize: 13,
                fontWeight: 600,
                textAlign: "right",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = WHITE;
              }}
            >
              {item.label}
            </button>
          ))}
          <div style={{ padding: "8px 16px", fontSize: 11, color: TEXT_MUTED, borderTop: `1px solid ${BORDER}` }}>
            يستخدم البيانات المعروضة حالياً
          </div>
        </div>
      )}
    </div>
  );
}
