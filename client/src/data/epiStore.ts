import type { EpiCatalogItem, EpiPassportItem, EpiProfile } from "@/api/api";
import type { EpiEmployee, EpiItem } from "@/components/admin/epi/types";
import { epiCatalogToClientItems, EPI_CATEGORY_DEFAULT_ITEM_CODES } from "@/data/epiCatalog";
import { EPI_PRESEED_REPLACEMENT_REQUESTS, EPI_SEED_EMPLOYEES } from "@/data/epiSeed";

const LS_KEY = "epi_store_v2";

type Store = {
  employees: EpiEmployee[];
  profilesByEmployeeId: Record<string, EpiProfile>;
  categoryDefaultsByCategoryCode?: Record<string, string[]>;
  replacementRequests?: Array<{
    id: string;
    employeeId: string;
    itemCode: string;
    requestedSize?: string | null;
    reason: string;
    createdAt: string;
    status: "pending" | "approved" | "rejected";
  }>;
  receptions?: Array<{
    id: string;
    employeeId: string;
    issuanceId: string;
    signatureName?: string | null;
    notes?: string | null;
    createdAt: string;
  }>;
};

function safeParse(json: string | null): Store | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as Store;
  } catch {
    return null;
  }
}

function seedCategoryDefaults(): Record<string, string[]> {
  const cat: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(EPI_CATEGORY_DEFAULT_ITEM_CODES)) {
    cat[k] = [...v];
  }
  return cat;
}

function seedReplacementRequests(): NonNullable<Store["replacementRequests"]> {
  const ts = new Date().toISOString();
  return EPI_PRESEED_REPLACEMENT_REQUESTS.map((r, i) => ({
    id: `seed-req-${i}-${r.employeeId}-${r.itemCode}`,
    employeeId: r.employeeId,
    itemCode: r.itemCode,
    requestedSize: r.requestedSize ?? null,
    reason: r.reason,
    createdAt: ts,
    status: "pending" as const,
  }));
}

function initialStore(): Store {
  return {
    employees: EPI_SEED_EMPLOYEES,
    profilesByEmployeeId: {},
    categoryDefaultsByCategoryCode: seedCategoryDefaults(),
    replacementRequests: seedReplacementRequests(),
    receptions: [],
  };
}

function readStore(): Store {
  const s = safeParse(localStorage.getItem(LS_KEY));
  if (s?.employees?.length) {
    return {
      ...s,
      profilesByEmployeeId: s.profilesByEmployeeId ?? {},
      categoryDefaultsByCategoryCode: s.categoryDefaultsByCategoryCode ?? seedCategoryDefaults(),
      replacementRequests: s.replacementRequests ?? [],
      receptions: s.receptions ?? [],
    };
  }
  const init = initialStore();
  localStorage.setItem(LS_KEY, JSON.stringify(init));
  return init;
}

function writeStore(next: Store) {
  localStorage.setItem(LS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("epi_store_updated"));
}

function slugCode(nameFr: string): string {
  return nameFr
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function passportForEmployee(e: EpiEmployee, catalog: EpiCatalogItem[]): EpiPassportItem[] {
  const catByCode = new Map(catalog.map((c) => [c.code, c]));
  return e.equipements.map((it) => {
    const code = it.code ?? slugCode(it.nom);
    let status: string;
    if (it.statut === "Reçu") status = "received";
    else if (it.statut === "À remplacer") status = "needs_replacement";
    else if (it.statut === "En cours") status = "issued";
    else status = "issued";
    const id = `${e.employee_id}:${code}`;
    return {
      id,
      itemCode: code,
      item: catByCode.get(code) ?? null,
      size: it.taille ?? null,
      status,
      issuedAt: it.issuedAt ?? new Date().toISOString(),
      nextReplacementAt: it.nextReplacementAt ?? null,
      lastReceptionAt: it.reception ? (it.issuedAt ?? new Date().toISOString()) : null,
    };
  });
}

export function epiStoreGetCatalog(): EpiCatalogItem[] {
  return epiCatalogToClientItems();
}

export function epiStoreGetCategoryDefaults(categoryCode: string): string[] {
  const s = readStore();
  return (s.categoryDefaultsByCategoryCode ?? {})[categoryCode] ?? EPI_CATEGORY_DEFAULT_ITEM_CODES[categoryCode] ?? [];
}

export function epiStoreSetCategoryDefaults(categoryCode: string, itemCodes: string[]) {
  const s = readStore();
  writeStore({
    ...s,
    categoryDefaultsByCategoryCode: { ...(s.categoryDefaultsByCategoryCode ?? {}), [categoryCode]: itemCodes },
  });
}

export function epiStoreAddReplacementRequest(req: {
  employeeId: string;
  itemCode: string;
  requestedSize?: string | null;
  reason: string;
}) {
  const s = readStore();
  const next = [
    ...(s.replacementRequests ?? []),
    {
      id: `${req.employeeId}:${req.itemCode}:${Date.now()}`,
      employeeId: req.employeeId,
      itemCode: req.itemCode,
      requestedSize: req.requestedSize ?? null,
      reason: req.reason,
      createdAt: new Date().toISOString(),
      status: "pending" as const,
    },
  ];
  writeStore({ ...s, replacementRequests: next });
}

export function epiStoreGetReplacementRequests(): NonNullable<Store["replacementRequests"]> {
  const s = readStore();
  return s.replacementRequests ?? [];
}

export function epiStoreAddReception(rec: {
  employeeId: string;
  issuanceId: string;
  signatureName?: string | null;
  notes?: string | null;
}) {
  const s = readStore();
  const next = [
    ...(s.receptions ?? []),
    {
      id: `${rec.employeeId}:${rec.issuanceId}:${Date.now()}`,
      employeeId: rec.employeeId,
      issuanceId: rec.issuanceId,
      signatureName: rec.signatureName ?? null,
      notes: rec.notes ?? null,
      createdAt: new Date().toISOString(),
    },
  ];
  writeStore({ ...s, receptions: next });
}

export function epiStoreGetReceptions(): NonNullable<Store["receptions"]> {
  const s = readStore();
  return s.receptions ?? [];
}

export function epiStoreGetAllEmployees(): EpiEmployee[] {
  return readStore().employees;
}

export function epiStoreSetAllEmployees(employees: EpiEmployee[]) {
  const s = readStore();
  writeStore({ ...s, employees });
}

export function epiStoreUpdateItem(employeeId: string, itemNameFr: string, patch: Partial<EpiItem>) {
  const s = readStore();
  const nextEmployees = s.employees.map((e) => {
    if (e.employee_id !== employeeId) return e;
    return {
      ...e,
      equipements: e.equipements.map((it) =>
        it.nom === itemNameFr || it.code === itemNameFr ? { ...it, ...patch } : it
      ),
    };
  });
  writeStore({ ...s, employees: nextEmployees });
}

export function epiStoreGetSummary(employeeId: string) {
  const s = readStore();
  const employees = s.employees;
  const emp = employees.find((e) => e.employee_id === employeeId) ?? null;
  const catalog = epiStoreGetCatalog();
  const passport = emp ? passportForEmployee(emp, catalog) : [];
  const profile = s.profilesByEmployeeId[employeeId] ?? null;
  const profileComplete = Boolean(profile && (profile.shirtSize || profile.shoeSize || profile.vestSize || profile.pantsSize));

  const cat = emp?.categoryCode ?? "";
  const defaultCodes =
    (s.categoryDefaultsByCategoryCode && cat ? s.categoryDefaultsByCategoryCode[cat] : null) ??
    EPI_CATEGORY_DEFAULT_ITEM_CODES[cat] ??
    [];
  const categoryDefaults = defaultCodes.map((itemCode, idx) => ({
    categoryId: cat,
    itemCode,
    required: true,
    lifetimeDaysOverride: null,
    sortOrder: idx,
  }));

  return {
    profileComplete,
    profile,
    catalog,
    categoryDefaults,
    passport,
  };
}

export function epiStoreUpdateProfile(employeeId: string, patch: Partial<EpiProfile>) {
  const s = readStore();
  const prev = s.profilesByEmployeeId[employeeId] ?? ({} as EpiProfile);
  writeStore({
    ...s,
    profilesByEmployeeId: { ...s.profilesByEmployeeId, [employeeId]: { ...prev, ...patch } as EpiProfile },
  });
}
