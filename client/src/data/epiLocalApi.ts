import type { EpiProfile } from "@/api/api";
import {
  epiStoreAddReception,
  epiStoreAddReplacementRequest,
  epiStoreGetSummary,
  epiStoreUpdateItem,
  epiStoreUpdateProfile,
} from "@/data/epiStore";

export const epiLocalApi = {
  summary: async (employeeId: string) => {
    return { data: epiStoreGetSummary(employeeId) };
  },
  updateProfile: async (employeeId: string, body: Partial<EpiProfile>) => {
    epiStoreUpdateProfile(employeeId, body);
    return { data: { ok: true } };
  },
  confirmReception: async (employeeId: string, body: { issuanceId: string; signatureName?: string; notes?: string }) => {
    // issuanceId: `${employeeId}:${code}`
    const summary = epiStoreGetSummary(employeeId);
    const p = summary.passport.find((x) => x.id === body.issuanceId) ?? null;
    const itemNameFr = p?.item?.labelFr ?? null;
    if (itemNameFr) {
      const fitOk = (body.notes ?? "").includes("FIT_OK");
      epiStoreUpdateItem(employeeId, itemNameFr, {
        statut: "Reçu",
        reception: true,
        fit: fitOk,
      });
    }
    epiStoreAddReception({
      employeeId,
      issuanceId: body.issuanceId,
      signatureName: body.signatureName ?? null,
      notes: body.notes ?? null,
    });
    return { data: { ok: true } };
  },
  requestReplacement: async (employeeId: string, body: { issuanceId?: string; itemCode: string; requestedSize?: string; reason: string }) => {
    const summary = epiStoreGetSummary(employeeId);
    const p = summary.passport.find((x) => x.itemCode === body.itemCode) ?? null;
    const itemNameFr = p?.item?.labelFr ?? null;
    if (itemNameFr) {
      epiStoreUpdateItem(employeeId, itemNameFr, { statut: "En cours", reception: false, fit: false });
    }
    epiStoreAddReplacementRequest({
      employeeId,
      itemCode: body.itemCode,
      requestedSize: body.requestedSize ?? null,
      reason: body.reason,
    });
    return { data: { ok: true } };
  },
};

