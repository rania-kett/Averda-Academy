import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { COLORS } from "@/components/admin/adminThemeTokens";
import { resolveCurrentLng } from "@/i18n/persistLanguage";
import { buildExportLocale } from "@/utils/adminExportI18n";
import {
  exportEmployeesExcel,
  exportEpiExcel,
  exportPerformanceExcel,
  type ExportCourseRow,
  type ExportEmployeeRow,
  type ExportWeeklyRow,
} from "@/utils/adminDashboardExport";
import type { DashboardEpiEmployee } from "@/utils/mapEpiSummaryToDashboard";

type Props = {
  employees: ExportEmployeeRow[];
  epiEmployees: DashboardEpiEmployee[];
  courses: ExportCourseRow[];
  weekly: ExportWeeklyRow[];
  onExported: () => void;
};

const MENU_W = 260;

export function AdminExportDropdown({ employees, epiEmployees, courses, weekly, onExported }: Props) {
  const { t, i18n } = useTranslation();
  const lng = resolveCurrentLng(i18n.language);
  const exportLocale = useMemo(() => buildExportLocale(t, lng), [t, lng]);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const MENU_ITEMS = [
    { id: "employees" as const, label: t("admin.page.export.employees") },
    { id: "epi" as const, label: t("admin.page.export.epi") },
    { id: "performance" as const, label: t("admin.page.export.performance") },
  ];

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    let left = rect.left;
    if (left + MENU_W > window.innerWidth - 8) left = window.innerWidth - MENU_W - 8;
    if (left < 8) left = 8;
    setMenuPos({ top: rect.bottom + 6, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const n = e.target as Node;
      if (btnRef.current?.contains(n) || menuRef.current?.contains(n)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const runExport = async (id: (typeof MENU_ITEMS)[number]["id"]) => {
    setOpen(false);
    if (id === "employees") await exportEmployeesExcel(employees, exportLocale);
    else if (id === "epi") await exportEpiExcel(epiEmployees, exportLocale);
    else await exportPerformanceExcel(employees, courses, weekly, exportLocale);
    onExported();
  };

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="overflow-hidden rounded-xl border py-1"
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
            minWidth: MENU_W,
            background: COLORS.white,
            borderColor: COLORS.border,
            boxShadow: COLORS.shadowLg,
          }}
        >
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => void runExport(item.id)}
              className="block w-full cursor-pointer border-none px-4 py-3 text-start text-[13px] font-semibold transition"
              style={{
                background: COLORS.white,
                color: COLORS.brand,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.white;
              }}
            >
              {item.label}
            </button>
          ))}
          <div
            className="border-t px-4 py-2 text-[11px]"
            style={{ color: COLORS.textMuted, borderColor: COLORS.border }}
          >
            {t("admin.page.export.hint")}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-2 px-5 py-2.5 text-sm font-bold transition hover:opacity-90"
        style={{
          borderColor: COLORS.navy,
          background: COLORS.btnBg,
          color: COLORS.brand,
        }}
      >
        {t("admin.page.export.label")}
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          aria-hidden
          style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }}
        />
      </button>
      {menu}
    </>
  );
}
