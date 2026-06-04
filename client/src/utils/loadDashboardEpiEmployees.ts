import { mapEpiSummaryToDashboardEmployee, type DashboardEpiEmployee } from "@/utils/mapEpiSummaryToDashboard";
import type { EpiSummaryLike } from "@/utils/epiProgress";

export type ApiAdminEpiRow = {
  id: string;
  employeeId: string;
  name: string;
  categoryCode?: string | null;
  categoryNameAr?: string | null;
  pendingRequests?: number;
  summary: EpiSummaryLike;
};

/**
 * Admin dashboard EPI list — uses the same `summary` payload as GET /api/epi/summary
 * (database only; never fabricate empty rows when the API fails).
 */
export async function loadDashboardEpiEmployees(raw: unknown): Promise<DashboardEpiEmployee[]> {
  const apiRows: ApiAdminEpiRow[] = (raw as { employees?: ApiAdminEpiRow[] })?.employees ?? [];
  if (!apiRows.length) return [];

  return apiRows.map((row) =>
    mapEpiSummaryToDashboardEmployee({
      id: row.id,
      employeeId: row.employeeId,
      name: row.name,
      categoryCode: row.categoryCode,
      categoryNameAr: row.categoryNameAr,
      pendingRequests: row.pendingRequests ?? 0,
      summary: row.summary,
    })
  );
}
