import ExcelJS from "exceljs";
import type { CategoryKey } from "@/config/categories";
import type { ExportLocale } from "@/utils/adminExportI18n";
import type { DashboardEpiEmployee } from "@/utils/mapEpiSummaryToDashboard";
import { getDisplayStatus, type EpiDisplayStatus } from "@/utils/epiStatus";

export type ExportEmployeeRow = {
  id: string;
  employeeCode?: string;
  name: string;
  role: string;
  roleLabel: string;
  categoryKey?: CategoryKey;
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

const COLORS = {
  navyHeader: "1A3C5E",
  navyTitle: "0D2A45",
  border: "D0D0D0",
  altRow: "F5F5F5",
  white: "FFFFFF",
  footerBg: "EEEEEE",
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

function normalizeHex(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

function argb(hex: string): string {
  const h = normalizeHex(hex);
  return `FF${h}`;
}

function borderThin(): ExcelJS.Borders {
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
    (col as ExcelJS.Column).eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell) => {
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
                : typeof v === "object" && v && "text" in (v as object)
                  ? String((v as { text?: string }).text ?? "")
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

function addFooter(ws: ExcelJS.Worksheet, colCount: number, text: string) {
  const row = ws.addRow([text]);
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

function nameAlign(loc: ExportLocale): Partial<ExcelJS.Alignment> {
  return { horizontal: loc.rtl ? "right" : "left" };
}

function applyEmployeeStatusStyle(cell: ExcelJS.Cell, status: ExportEmployeeRow["status"]) {
  if (status === "in_progress") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.amberBg) } };
    cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.amberText) } };
  } else if (status === "not_started") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.redBg) } };
    cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.redText) } };
  } else if (status === "completed") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.greenBg) } };
    cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.greenText) } };
  }
}

function applyEpiSummaryStyle(cell: ExcelJS.Cell, status: DashboardEpiEmployee["statusSummary"]) {
  if (status === "ok") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.greenBg) } };
    cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.greenText) } };
  } else if (status === "pending") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.amberBg) } };
    cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.amberText) } };
  } else if (status === "needs_followup") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.redBg) } };
    cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.redText) } };
  }
}

function applyEpiDisplayStyle(cell: ExcelJS.Cell, displayStatus: EpiDisplayStatus) {
  if (displayStatus === "received") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.greenBg) } };
    cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.greenText) } };
  } else if (displayStatus === "pending") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.amberBg) } };
    cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.amberText) } };
  } else if (displayStatus === "needs_renewal") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.orangeBg) } };
    cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.orangeText) } };
  } else if (displayStatus === "not_issued") {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLORS.redBg) } };
    cell.font = { ...cell.font, bold: true, color: { argb: argb(COLORS.redText) } };
  }
}

type EpiExportItem = { type: string; labelAr: string };

function collectEpiItems(epiEmployees: DashboardEpiEmployee[]): EpiExportItem[] {
  const map = new Map<string, string>();
  for (const emp of epiEmployees) {
    for (const item of emp.items) {
      if (!map.has(item.type)) map.set(item.type, item.labelAr || item.label);
    }
  }
  return Array.from(map.entries()).map(([type, labelAr]) => ({ type, labelAr }));
}

export async function exportEmployeesExcel(employees: ExportEmployeeRow[], loc: ExportLocale) {
  const now = new Date();
  const headers = [
    loc.col.name,
    loc.col.id,
    loc.col.role,
    loc.col.completedCourses,
    loc.col.avgScore,
    loc.col.status,
    loc.col.lastActivity,
  ];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(loc.sheet.employees);
  ws.views = [{ rightToLeft: loc.rtl, state: "frozen", ySplit: 2 }];

  const { firstDataRowNumber } = addTitleAndHeader(ws, headers, loc.title(now));

  for (const emp of employees) {
    ws.addRow([
      loc.nameOf(emp.name),
      emp.employeeCode ?? emp.id,
      loc.roleOf(emp.roleLabel || emp.role, emp.categoryKey),
      `${emp.completedCourses}/${emp.totalCourses}`,
      emp.avgScore > 0 ? `${emp.avgScore}%` : "—",
      loc.employeeStatus(emp.status),
      loc.formatDate(emp.lastActivity),
    ]);
  }

  const lastRow = ws.rowCount;
  for (let rn = firstDataRowNumber; rn <= lastRow; rn++) {
    const row = ws.getRow(rn);
    const emp = employees[rn - firstDataRowNumber];
    const isAlt = (rn - firstDataRowNumber) % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, cn) => {
      setCellBaseStyle(cell, {
        align: cn === 1 ? nameAlign(loc) : { horizontal: "center" },
        fill: isAlt ? COLORS.altRow : COLORS.white,
      });
    });

    const avgCell = row.getCell(5);
    const avgVal = String(avgCell.value ?? "");
    if (avgVal === "—") {
      avgCell.font = { ...avgCell.font, color: { argb: argb(COLORS.grayText) } };
    } else {
      const n = Number(avgVal.replace("%", "").trim());
      if (!Number.isNaN(n)) {
        avgCell.font = { ...avgCell.font, bold: true, color: { argb: argb(n >= 80 ? COLORS.greenText : "E67E22") } };
      }
    }
    applyEmployeeStatusStyle(row.getCell(6), emp.status);
  }

  autoFitColumns(ws, 10, 45);
  addFooter(ws, headers.length, loc.footer(now));
  await downloadWorkbook(wb, loc.filename("employees", exportDateStamp()));
}

export async function exportEpiExcel(epiEmployees: DashboardEpiEmployee[], loc: ExportLocale) {
  const now = new Date();
  const catalogItems = collectEpiItems(epiEmployees).sort((a, b) =>
    loc.epiItemLabel(a.type, a.labelAr).localeCompare(loc.epiItemLabel(b.type, b.labelAr), loc.locale)
  );

  const keyHeaders = [
    loc.col.name,
    loc.col.id,
    loc.col.role,
    loc.col.shirt,
    loc.col.pants,
    loc.col.shoes,
    loc.col.gloves,
    loc.col.vest,
    loc.col.status,
    loc.col.itemsReceived,
    loc.col.pendingRequests,
    loc.col.lastUpdated,
  ];

  const dynamicHeaders: string[] = [];
  const dateColumnIndices = new Set<number>();
  let colIndex = keyHeaders.length + 1;
  for (const item of catalogItems) {
    const label = loc.epiItemLabel(item.type, item.labelAr);
    dynamicHeaders.push(label);
    dynamicHeaders.push(loc.dateColumn(label));
    dateColumnIndices.add(colIndex + 1);
    colIndex += 2;
  }
  const headers = [...keyHeaders, ...dynamicHeaders];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(loc.sheet.epi);
  ws.views = [{ rightToLeft: loc.rtl, state: "frozen", xSplit: 1, ySplit: 2, topLeftCell: "B3" }];

  const { firstDataRowNumber } = addTitleAndHeader(ws, headers, loc.title(now));
  const lastKeyCol = keyHeaders.length;

  for (const emp of epiEmployees) {
    const received = emp.items.filter((i) => i.status === "received").length;
    const total = emp.items.length;
    const base: (string | number)[] = [
      loc.nameOf(emp.name),
      emp.employeeCode,
      loc.roleOf(emp.role, emp.categoryKey),
      emp.measurements.shirt,
      emp.measurements.pants,
      emp.measurements.shoes,
      emp.measurements.gloves,
      emp.measurements.vest,
      loc.epiSummaryStatus(emp.statusSummary),
      `${received}/${total}`,
      emp.pendingRequests,
      loc.formatDate(emp.lastUpdated),
    ];
    const tail: (string | number)[] = [];
    for (const catalog of catalogItems) {
      const item = emp.items.find((i) => i.type === catalog.type);
      const displayStatus = item
        ? getDisplayStatus({
            status: item.status,
            name: item.label,
            receivedDate: item.lastIssued ?? null,
            nextReplacementAt: item.nextReplacementAt ?? null,
          })
        : null;
      tail.push(item && displayStatus ? loc.epiDisplayStatus(displayStatus) : "—");
      tail.push(item?.lastIssued ? loc.formatDate(item.lastIssued) : "—");
    }
    ws.addRow([...base, ...tail]);
  }

  const lastRow = ws.rowCount;
  const lastCol = headers.length;

  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 18;
  ws.getColumn(9).width = 14;
  ws.getColumn(10).width = 14;
  ws.getColumn(11).width = 12;
  ws.getColumn(12).width = 14;

  for (let rn = firstDataRowNumber; rn <= lastRow; rn++) {
    const row = ws.getRow(rn);
    const emp = epiEmployees[rn - firstDataRowNumber];
    const isAlt = (rn - firstDataRowNumber) % 2 === 1;
    for (let cn = 1; cn <= lastCol; cn++) {
      const cell = row.getCell(cn);
      setCellBaseStyle(cell, {
        align: cn === 1 ? nameAlign(loc) : { horizontal: "center" },
        fill: isAlt ? COLORS.altRow : COLORS.white,
      });
      if (cn === lastKeyCol) {
        cell.border = {
          ...cell.border,
          right: { style: "medium", color: { argb: argb(COLORS.sepNavy) } },
        };
      }
    }
    applyEpiSummaryStyle(row.getCell(9), emp.statusSummary);
  }

  const sixMonthsMs = 1000 * 60 * 60 * 24 * 30 * 6;
  const nowMs = now.getTime();

  for (let rn = firstDataRowNumber; rn <= lastRow; rn++) {
    const row = ws.getRow(rn);
    const emp = epiEmployees[rn - firstDataRowNumber];
    for (let cn = lastKeyCol + 1; cn <= lastCol; cn++) {
      const cell = row.getCell(cn);
      const v = String(cell.value ?? "").trim();

      if (dateColumnIndices.has(cn)) {
        cell.font = { ...cell.font, italic: true, color: { argb: argb(COLORS.dateText) } };
        const parsed = Date.parse(v);
        if (!Number.isNaN(parsed) && nowMs - parsed > sixMonthsMs) {
          cell.font = { ...cell.font, italic: true, bold: true, color: { argb: argb(COLORS.expiredText) } };
        }
        continue;
      }

      if (v === "—" || v === "") {
        cell.font = { ...cell.font, color: { argb: argb("CCCCCC") } };
        (cell as { fill?: unknown }).fill = undefined;
        continue;
      }

      const itemIndex = Math.floor((cn - lastKeyCol - 1) / 2);
      const catalog = catalogItems[itemIndex];
      const item = emp.items.find((i) => i.type === catalog?.type);
      if (!item) continue;
      const displayStatus = getDisplayStatus({
        status: item.status,
        name: item.label,
        receivedDate: item.lastIssued ?? null,
        nextReplacementAt: item.nextReplacementAt ?? null,
      });
      applyEpiDisplayStyle(cell, displayStatus);
    }
  }

  autoFitColumns(ws, 10, 55);
  addFooter(ws, headers.length, loc.footer(now));
  await downloadWorkbook(wb, loc.filename("epi", exportDateStamp()));
}

export async function exportPerformanceExcel(
  employees: ExportEmployeeRow[],
  courses: ExportCourseRow[],
  weekly: ExportWeeklyRow[],
  loc: ExportLocale
) {
  const now = new Date();
  const ranked = [...employees].sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    return b.completedCourses - a.completedCourses;
  });

  const wb = new ExcelJS.Workbook();
  const title = loc.title(now);

  const ws1 = wb.addWorksheet(loc.sheet.employeeResults);
  ws1.views = [{ rightToLeft: loc.rtl, state: "frozen", ySplit: 2 }];
  const headers1 = [
    loc.col.rank,
    loc.col.name,
    loc.col.id,
    loc.col.role,
    loc.col.avgScore,
    loc.col.completedCourses,
    loc.col.status,
  ];
  const { firstDataRowNumber: s1Start } = addTitleAndHeader(ws1, headers1, title);

  for (let i = 0; i < ranked.length; i++) {
    const emp = ranked[i];
    ws1.addRow([
      i + 1,
      loc.nameOf(emp.name),
      emp.employeeCode ?? emp.id,
      loc.roleOf(emp.roleLabel || emp.role, emp.categoryKey),
      emp.avgScore > 0 ? `${emp.avgScore}%` : "—",
      `${emp.completedCourses}/${emp.totalCourses}`,
      loc.employeeStatus(emp.status),
    ]);
  }

  const s1Last = ws1.rowCount;
  for (let rn = s1Start; rn <= s1Last; rn++) {
    const row = ws1.getRow(rn);
    const emp = ranked[rn - s1Start];
    const isAlt = (rn - s1Start) % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, cn) => {
      setCellBaseStyle(cell, {
        align: cn === 2 ? nameAlign(loc) : { horizontal: "center" },
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
    const avgVal = String(avgCell.value ?? "");
    if (avgVal === "—") {
      avgCell.font = { ...avgCell.font, color: { argb: argb(COLORS.grayText) } };
    } else {
      const n = Number(avgVal.replace("%", "").trim());
      if (!Number.isNaN(n)) {
        avgCell.font = { ...avgCell.font, bold: true, color: { argb: argb(n >= 80 ? COLORS.greenText : "E67E22") } };
      }
    }
    applyEmployeeStatusStyle(row.getCell(7), emp.status);
  }
  autoFitColumns(ws1, 10, 45);
  addFooter(ws1, headers1.length, loc.footer(now));

  const ws2 = wb.addWorksheet(loc.sheet.courseRates);
  ws2.views = [{ rightToLeft: loc.rtl, state: "frozen", ySplit: 2 }];
  const headers2 = [
    loc.col.courseTitle,
    loc.col.completionPct,
    loc.col.avgScorePct,
    loc.col.enrolledCount,
    loc.col.hasQuiz,
  ];
  const { firstDataRowNumber: s2Start } = addTitleAndHeader(ws2, headers2, title);
  const sortedCourses = [...courses].sort((a, b) => b.completionRate - a.completionRate);
  for (const c of sortedCourses) {
    ws2.addRow([
      loc.courseTitle(c.title),
      Math.round(c.completionRate),
      Math.round(c.avgScore),
      c.enrolledCount,
      c.hasQuiz ? loc.yes : loc.no,
    ]);
  }
  const s2Last = ws2.rowCount;
  for (let rn = s2Start; rn <= s2Last; rn++) {
    const row = ws2.getRow(rn);
    const isAlt = (rn - s2Start) % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, cn) => {
      setCellBaseStyle(cell, {
        align: cn === 1 ? nameAlign(loc) : { horizontal: "center" },
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
    if (q === loc.yes) quizCell.font = { ...quizCell.font, bold: true, color: { argb: argb(COLORS.greenText) } };
    else quizCell.font = { ...quizCell.font, bold: true, color: { argb: argb(COLORS.grayText) } };
  }
  autoFitColumns(ws2, 10, 55);
  addFooter(ws2, headers2.length, loc.footer(now));

  const ws3 = wb.addWorksheet(loc.sheet.weeklyCompletion);
  ws3.views = [{ rightToLeft: loc.rtl, state: "frozen", ySplit: 2 }];
  const headers3 = [loc.col.date, loc.col.completedCount];
  const { firstDataRowNumber: s3Start } = addTitleAndHeader(ws3, headers3, title);
  const sortedWeekly = [...weekly].sort((a, b) => a.date.localeCompare(b.date));
  for (const w of sortedWeekly) ws3.addRow([loc.formatDate(w.date), w.count]);
  const s3Last = ws3.rowCount;
  for (let rn = s3Start; rn <= s3Last; rn++) {
    const row = ws3.getRow(rn);
    const isAlt = (rn - s3Start) % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, cn) => {
      setCellBaseStyle(cell, {
        align: cn === 1 ? nameAlign(loc) : { horizontal: "center" },
        fill: isAlt ? COLORS.altRow : COLORS.white,
      });
    });
  }
  autoFitColumns(ws3, 10, 45);
  addFooter(ws3, headers3.length, loc.footer(now));

  await downloadWorkbook(wb, loc.filename("performance", exportDateStamp()));
}
