import ExcelJS from "exceljs";
import type { DashboardEpiEmployee } from "@/utils/mapEpiSummaryToDashboard";
import { getDisplayStatus, getStatusLabel } from "@/utils/epiStatus";

export type ExportEmployeeRow = {
  id: string;
  employeeCode?: string;
  name: string;
  role: string;
  roleLabel: string;
  avgScore: number;
  completedCourses: number;
  totalCourses: number;
  status: "not_started" | "in_progress" | "completed";
  lastActivity: string;
};

export type ExportCourseRow = {
  id: string;
  title: Record<string, string>;
  completionRate: number;
  avgScore: number;
  enrolledCount: number;
  hasQuiz: boolean;
};

export type ExportWeeklyRow = {
  date: string;
  count: number;
};

const EMPLOYEE_STATUS_AR: Record<ExportEmployeeRow["status"], string> = {
  not_started: "لم يبدأ",
  in_progress: "قيد التقدم",
  completed: "مكتمل",
};

const EPI_STATUS_SUMMARY_AR: Record<DashboardEpiEmployee["statusSummary"], string> = {
  ok: "جاهز",
  needs_followup: "يحتاج متابعة",
  pending: "في الانتظار",
};

const COLORS = {
  navyHeader: "1A3C5E",
  navyTitle: "0D2A45",
  border: "D0D0D0",
  altRow: "F5F5F5",
  white: "FFFFFF",
  footerBg: "EEEEEE",
  // status fills
  greenBg: "D4EDDA",
  greenText: "155724",
  amberBg: "FFF3CD",
  amberText: "856404",
  redBg: "F8D7DA",
  redText: "721C24",
  orangeBg: "FFE0B2",
  orangeText: "E65100",
  grayText: "999999",
  dateText: "555555",
  expiredText: "C0392B",
  sepNavy: "1A3C5E",
};

function exportDateStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatActivityDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleDateString("ar-MA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatLongDateAr(date: Date): string {
  return date.toLocaleDateString("ar-MA", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

function courseTitleAr(title: Record<string, string>): string {
  return title.ar ?? title.en ?? title.fr ?? "—";
}

function normalizeHex(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

function argb(hex: string): string {
  const h = normalizeHex(hex);
  return `FF${h}`;
}

function borderThin(): ExcelJS.Borders {
  // ExcelJS typings require all border fields; we keep non-used ones as undefined.
  return {
    top: { style: "thin", color: { argb: argb(COLORS.border) } },
    left: { style: "thin", color: { argb: argb(COLORS.border) } },
    bottom: { style: "thin", color: { argb: argb(COLORS.border) } },
    right: { style: "thin", color: { argb: argb(COLORS.border) } },
    diagonal: undefined,
    diagonalDown: false,
    diagonalUp: false,
  } as unknown as ExcelJS.Borders;
}

function setCellBaseStyle(
  cell: ExcelJS.Cell,
  opts?: { align?: Partial<ExcelJS.Alignment>; fill?: string; font?: Partial<ExcelJS.Font> }
) {
  cell.font = {
    name: "Arial",
    size: 11,
    ...(opts?.font ?? {}),
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
    ...(opts?.align ?? {}),
  };
  cell.border = borderThin();
  if (opts?.fill) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(opts.fill) } };
  }
}

function autoFitColumns(ws: ExcelJS.Worksheet, min = 10, max = 55) {
  ws.columns?.forEach((col) => {
    if (!col) return;
    let maxLen = 0;
    (col as any).eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell) => {
      const v = cell.value;
      const s =
        v == null
          ? ""
          : typeof v === "string"
            ? v
            : typeof v === "number"
              ? String(v)
              : v instanceof Date
                ? v.toISOString()
                : typeof v === "object" && v && "text" in (v as any)
                  ? String((v as any).text ?? "")
                  : String(v);
      maxLen = Math.max(maxLen, s.length);
    });
    col.width = Math.min(max, Math.max(min, maxLen + 2));
  });
}

async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function addTitleAndHeader(ws: ExcelJS.Worksheet, headers: string[], title: string) {
  const titleRow = ws.addRow([title]);
  ws.mergeCells(titleRow.number, 1, titleRow.number, headers.length);
  titleRow.height = 24;
  titleRow.eachCell({ includeEmpty: true }, (cell) => {
    setCellBaseStyle(cell, {
      fill: COLORS.navyTitle,
      font: { color: { argb: argb(COLORS.white) }, bold: true, size: 14 },
      align: { horizontal: "center" },
    });
  });

  const headerRow = ws.addRow(headers);
  headerRow.height = 20;
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    setCellBaseStyle(cell, {
      fill: COLORS.navyHeader,
      font: { color: { argb: argb(COLORS.white) }, bold: true, size: 12 },
      align: { horizontal: "center" },
    });
  });

  return { headerRowNumber: headerRow.number, firstDataRowNumber: headerRow.number + 1 };
}

function addFooter(ws: ExcelJS.Worksheet, colCount: number) {
  const row = ws.addRow([`تم التصدير بتاريخ: ${formatLongDateAr(new Date())}`]);
  ws.mergeCells(row.number, 1, row.number, colCount);
  row.height = 18;
  row.eachCell({ includeEmpty: true }, (cell) => {
    setCellBaseStyle(cell, {
      fill: COLORS.footerBg,
      font: { color: { argb: argb("666666") }, italic: true },
      align: { horizontal: "center" },
    });
  });
}

function collectEpiItemLabels(employees: DashboardEpiEmployee[]): string[] {
  const labels = new Set<string>();
  for (const emp of employees) {
    for (const item of emp.items) {
      labels.add(item.label);
    }
  }
  return Array.from(labels).sort((a, b) => a.localeCompare(b, "ar"));
}

export async function exportEmployeesExcel(employees: ExportEmployeeRow[]) {
  const now = new Date();
  const headers = ["الاسم", "المعرّف", "الدور", "الدورات المكتملة", "متوسط النتيجة", "الحالة", "آخر نشاط"];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("الموظفون");
  ws.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];

  const title = `أفيردا — ${formatLongDateAr(now)}`;
  const { firstDataRowNumber } = addTitleAndHeader(ws, headers, title);

  for (const emp of employees) {
    ws.addRow([
      emp.name,
      emp.employeeCode ?? emp.id,
      emp.roleLabel || emp.role,
      `${emp.completedCourses}/${emp.totalCourses}`,
      emp.avgScore > 0 ? `${emp.avgScore}%` : "—",
      EMPLOYEE_STATUS_AR[emp.status] ?? emp.status,
      formatActivityDate(emp.lastActivity),
    ]);
  }

  const lastRow = ws.rowCount;
  for (let rn = firstDataRowNumber; rn <= lastRow; rn++) {
    const row = ws.getRow(rn);
    const isAlt = (rn - firstDataRowNumber) % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, cn) => {
      setCellBaseStyle(cell, {
        align: { horizontal: cn === 1 ? "right" : "center" },
        fill: isAlt ? COLORS.altRow : COLORS.white,
      });
    });
  }

  // Conditional styling: متوسط النتيجة + الحالة
  for (let rn = firstDataRowNumber; rn <= lastRow; rn++) {
    const avgCell = ws.getRow(rn).getCell(5);
    const statusCell = ws.getRow(rn).getCell(6);

    const avgVal = String(avgCell.value ?? "");
    if (avgVal === "—") {
      avgCell.font = { ...avgCell.font, color: { argb: argb(COLORS.grayText) } };
    } else {
      const n = Number(avgVal.replace("%", "").trim());
      if (!Number.isNaN(n)) {
        avgCell.font = { ...avgCell.font, bold: true, color: { argb: argb(n >= 80 ? COLORS.greenText : "E67E22") } };
      }
    }

    const s = String(statusCell.value ?? "");
    if (s === "قيد التقدم") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.amberBg) } };
      statusCell.font = { ...statusCell.font, bold: true, color: { argb: argb(COLORS.amberText) } };
    } else if (s === "لم يبدأ") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.redBg) } };
      statusCell.font = { ...statusCell.font, bold: true, color: { argb: argb(COLORS.redText) } };
    } else if (s === "مكتمل") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.greenBg) } };
      statusCell.font = { ...statusCell.font, bold: true, color: { argb: argb(COLORS.greenText) } };
    }
  }

  autoFitColumns(ws, 10, 45);
  addFooter(ws, headers.length);
  await downloadWorkbook(wb, `موظفو-أفيردا-${exportDateStamp()}.xlsx`);
}

export async function exportEpiExcel(epiEmployees: DashboardEpiEmployee[]) {
  const now = new Date();
  const itemLabels = collectEpiItemLabels(epiEmployees);

  const keyHeaders = [
    "الاسم",
    "المعرّف",
    "الدور",
    "قميص",
    "بنطلون",
    "حذاء",
    "قفازات",
    "سترة",
    "الحالة",
    "عناصر مستلمة",
    "طلبات معلقة",
    "آخر تحديث",
  ];
  const dynamicHeaders: string[] = [];
  for (const label of itemLabels) {
    dynamicHeaders.push(label);
    dynamicHeaders.push(`${label} — تاريخ`);
  }
  const headers = [...keyHeaders, ...dynamicHeaders];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("EPI");
  ws.views = [{ rightToLeft: true, state: "frozen", xSplit: 1, ySplit: 2, topLeftCell: "B3" }];

  const title = `أفيردا — ${formatLongDateAr(now)}`;
  const { firstDataRowNumber } = addTitleAndHeader(ws, headers, title);

  for (const emp of epiEmployees) {
    const received = emp.items.filter((i) => i.status === "received").length;
    const total = emp.items.length;
    const base: (string | number)[] = [
      emp.name,
      emp.employeeCode,
      emp.role,
      emp.measurements.shirt,
      emp.measurements.pants,
      emp.measurements.shoes,
      emp.measurements.gloves,
      emp.measurements.vest,
      EPI_STATUS_SUMMARY_AR[emp.statusSummary],
      `${received}/${total}`,
      emp.pendingRequests,
      formatActivityDate(emp.lastUpdated),
    ];
    const tail: (string | number)[] = [];
    for (const label of itemLabels) {
      const item = emp.items.find((i) => i.label === label);
      tail.push(
        item
          ? getStatusLabel(
              getDisplayStatus({
                status: item.status,
                name: item.label,
                receivedDate: item.lastIssued ?? null,
                nextReplacementAt: item.nextReplacementAt ?? null,
              })
            ).arabic
          : "—"
      );
      tail.push(item?.lastIssued ? formatActivityDate(item.lastIssued) : "—");
    }
    ws.addRow([...base, ...tail]);
  }

  const lastRow = ws.rowCount;
  const lastCol = headers.length;
  const lastKeyCol = keyHeaders.length; // آخر تحديث

  // widen key columns
  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 18;
  ws.getColumn(9).width = 14;
  ws.getColumn(10).width = 14;
  ws.getColumn(11).width = 12;
  ws.getColumn(12).width = 14;

  for (let rn = firstDataRowNumber; rn <= lastRow; rn++) {
    const row = ws.getRow(rn);
    const isAlt = (rn - firstDataRowNumber) % 2 === 1;
    for (let cn = 1; cn <= lastCol; cn++) {
      const cell = row.getCell(cn);
      setCellBaseStyle(cell, {
        align: { horizontal: cn === 1 ? "right" : "center" },
        fill: isAlt ? COLORS.altRow : COLORS.white,
      });
      if (cn === lastKeyCol) {
        cell.border = {
          ...cell.border,
          right: { style: "medium", color: { argb: argb(COLORS.sepNavy) } },
        };
      }
    }
  }

  // EPI status summary column
  for (let rn = firstDataRowNumber; rn <= lastRow; rn++) {
    const cell = ws.getRow(rn).getCell(9);
    const v = String(cell.value ?? "");
    if (v === "جاهز") {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.greenBg) } };
      cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.greenText) } };
    } else if (v === "في الانتظار") {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.amberBg) } };
      cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.amberText) } };
    } else if (v === "يحتاج متابعة") {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.redBg) } };
      cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.redText) } };
    }
  }

  const sixMonthsMs = 1000 * 60 * 60 * 24 * 30 * 6;
  const nowMs = now.getTime();

  for (let rn = firstDataRowNumber; rn <= lastRow; rn++) {
    const row = ws.getRow(rn);
    for (let cn = lastKeyCol + 1; cn <= lastCol; cn++) {
      const header = String(ws.getRow(2).getCell(cn).value ?? "");
      const cell = row.getCell(cn);
      const v = String(cell.value ?? "").trim();

      if (header.endsWith("— تاريخ")) {
        cell.font = { ...cell.font, italic: true, color: { argb: argb(COLORS.dateText) } };
        const parsed = Date.parse(v);
        if (!Number.isNaN(parsed) && nowMs - parsed > sixMonthsMs) {
          cell.font = { ...cell.font, italic: true, bold: true, color: { argb: argb(COLORS.expiredText) } };
        }
        continue;
      }

      if (v === "مستلم") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.greenBg) } };
        cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.greenText) } };
      } else if (v === "في الانتظار") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.amberBg) } };
        cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.amberText) } };
      } else if (v === "يحتاج تجديد") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.orangeBg) } };
        cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.orangeText) } };
      } else if (v === "لم يُسلم") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.redBg) } };
        cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.redText) } };
      } else if (v === "—" || v === "") {
        cell.font = { ...cell.font, color: { argb: argb("CCCCCC") } };
        (cell as any).fill = undefined;
      }
    }
  }

  autoFitColumns(ws, 10, 55);
  addFooter(ws, headers.length);
  await downloadWorkbook(wb, `EPI-أفيردا-${exportDateStamp()}.xlsx`);
}

export async function exportPerformanceExcel(
  employees: ExportEmployeeRow[],
  courses: ExportCourseRow[],
  weekly: ExportWeeklyRow[]
) {
  const now = new Date();
  const ranked = [...employees].sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    return b.completedCourses - a.completedCourses;
  });

  const wb = new ExcelJS.Workbook();
  const title = `أفيردا — ${formatLongDateAr(now)}`;

  // Sheet 1
  const ws1 = wb.addWorksheet("نتائج الموظفين");
  ws1.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];
  const headers1 = ["الترتيب", "الاسم", "المعرّف", "الدور", "متوسط النتيجة", "الدورات المكتملة", "الحالة"];
  const { firstDataRowNumber: s1Start } = addTitleAndHeader(ws1, headers1, title);

  for (let i = 0; i < ranked.length; i++) {
    const emp = ranked[i];
    ws1.addRow([
      i + 1,
      emp.name,
      emp.employeeCode ?? emp.id,
      emp.roleLabel || emp.role,
      emp.avgScore > 0 ? `${emp.avgScore}%` : "—",
      `${emp.completedCourses}/${emp.totalCourses}`,
      EMPLOYEE_STATUS_AR[emp.status] ?? emp.status,
    ]);
  }

  const s1Last = ws1.rowCount;
  for (let rn = s1Start; rn <= s1Last; rn++) {
    const row = ws1.getRow(rn);
    const isAlt = (rn - s1Start) % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, cn) => {
      setCellBaseStyle(cell, {
        align: { horizontal: cn === 2 ? "right" : "center" },
        fill: isAlt ? COLORS.altRow : COLORS.white,
      });
    });

    const rankCell = row.getCell(1);
    const rank = Number(rankCell.value ?? 0);
    if (rank === 1) {
      rankCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb("FFD700") } };
      rankCell.font = { ...rankCell.font, bold: true, color: { argb: argb("000000") } };
    } else if (rank === 2) {
      rankCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb("C0C0C0") } };
      rankCell.font = { ...rankCell.font, bold: true, color: { argb: argb("000000") } };
    } else if (rank === 3) {
      rankCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb("CD7F32") } };
      rankCell.font = { ...rankCell.font, bold: true, color: { argb: argb(COLORS.white) } };
    }

    const avgCell = row.getCell(5);
    const statusCell = row.getCell(7);
    const avgVal = String(avgCell.value ?? "");
    if (avgVal === "—") {
      avgCell.font = { ...avgCell.font, color: { argb: argb(COLORS.grayText) } };
    } else {
      const n = Number(avgVal.replace("%", "").trim());
      if (!Number.isNaN(n)) {
        avgCell.font = { ...avgCell.font, bold: true, color: { argb: argb(n >= 80 ? COLORS.greenText : "E67E22") } };
      }
    }
    const s = String(statusCell.value ?? "");
    if (s === "قيد التقدم") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.amberBg) } };
      statusCell.font = { ...statusCell.font, bold: true, color: { argb: argb(COLORS.amberText) } };
    } else if (s === "لم يبدأ") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.redBg) } };
      statusCell.font = { ...statusCell.font, bold: true, color: { argb: argb(COLORS.redText) } };
    } else if (s === "مكتمل") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.greenBg) } };
      statusCell.font = { ...statusCell.font, bold: true, color: { argb: argb(COLORS.greenText) } };
    }
  }
  autoFitColumns(ws1, 10, 45);
  addFooter(ws1, headers1.length);

  // Sheet 2
  const ws2 = wb.addWorksheet("معدلات الدورات");
  ws2.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];
  const headers2 = ["عنوان الدورة", "نسبة الإكمال %", "متوسط النتيجة %", "عدد المسجلين", "يوجد اختبار"];
  const { firstDataRowNumber: s2Start } = addTitleAndHeader(ws2, headers2, title);
  const sortedCourses = [...courses].sort((a, b) => b.completionRate - a.completionRate);
  for (const c of sortedCourses) {
    ws2.addRow([
      courseTitleAr(c.title),
      Math.round(c.completionRate),
      Math.round(c.avgScore),
      c.enrolledCount,
      c.hasQuiz ? "نعم" : "لا",
    ]);
  }
  const s2Last = ws2.rowCount;
  for (let rn = s2Start; rn <= s2Last; rn++) {
    const row = ws2.getRow(rn);
    const isAlt = (rn - s2Start) % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, cn) => {
      setCellBaseStyle(cell, {
        align: { horizontal: cn === 1 ? "right" : "center" },
        fill: isAlt ? COLORS.altRow : COLORS.white,
      });
    });

    const pctCell = row.getCell(2);
    const pct = Number(pctCell.value ?? 0);
    if (!Number.isNaN(pct)) {
      const fill = pct >= 100 ? COLORS.greenBg : pct <= 0 ? COLORS.redBg : COLORS.amberBg;
      pctCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(fill) } };
      pctCell.font = { ...pctCell.font, bold: true };
    }

    const quizCell = row.getCell(5);
    const q = String(quizCell.value ?? "");
    if (q === "نعم") quizCell.font = { ...quizCell.font, bold: true, color: { argb: argb(COLORS.greenText) } };
    else quizCell.font = { ...quizCell.font, bold: true, color: { argb: argb(COLORS.grayText) } };
  }
  autoFitColumns(ws2, 10, 55);
  addFooter(ws2, headers2.length);

  // Sheet 3
  const ws3 = wb.addWorksheet("الإكمال الأسبوعي");
  ws3.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];
  const headers3 = ["التاريخ", "عدد الدورات المكتملة"];
  const { firstDataRowNumber: s3Start } = addTitleAndHeader(ws3, headers3, title);
  const sortedWeekly = [...weekly].sort((a, b) => a.date.localeCompare(b.date));
  for (const w of sortedWeekly) ws3.addRow([formatActivityDate(w.date), w.count]);
  const s3Last = ws3.rowCount;
  for (let rn = s3Start; rn <= s3Last; rn++) {
    const row = ws3.getRow(rn);
    const isAlt = (rn - s3Start) % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, cn) => {
      setCellBaseStyle(cell, {
        align: { horizontal: cn === 1 ? "right" : "center" },
        fill: isAlt ? COLORS.altRow : COLORS.white,
      });
    });
  }
  autoFitColumns(ws3, 10, 45);
  addFooter(ws3, headers3.length);

  await downloadWorkbook(wb, `أداء-أفيردا-${exportDateStamp()}.xlsx`);
}
