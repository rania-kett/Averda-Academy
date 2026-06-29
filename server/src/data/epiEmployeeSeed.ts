/** Demo EPI issuance seed data (server-only; used by epiCanonicalSeed + prisma seed). */

export type EpiSeedStatut = "Reçu" | "En cours" | "À remplacer";

export type EpiSeedEquipment = {
  code: string;
  statut: EpiSeedStatut;
  taille: string | null;
  issuedAt?: string;
  nextReplacementAt?: string | null;
};

export type EpiSeedEmployee = {
  employee_id: string;
  equipements: EpiSeedEquipment[];
};

const now = new Date();
const iso = (d: Date) => d.toISOString();

function subMonths(m: number) {
  const d = new Date(now);
  d.setMonth(d.getMonth() - m);
  return d;
}
function subWeeks(w: number) {
  const d = new Date(now);
  d.setDate(d.getDate() - 7 * w);
  return d;
}
function subDays(n: number) {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
}
function addMonths(base: Date, m: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + m);
  return d;
}

function row(
  code: string,
  statut: EpiSeedStatut,
  extra: Partial<Pick<EpiSeedEquipment, "taille" | "issuedAt" | "nextReplacementAt">> = {}
): EpiSeedEquipment {
  return {
    code,
    statut,
    taille: extra.taille ?? null,
    issuedAt: extra.issuedAt,
    nextReplacementAt: extra.nextReplacementAt,
  };
}

function recv(code: string, monthsAgo: number, addMo: number, taille: string | null = "M") {
  const issued = subMonths(monthsAgo);
  return row(code, "Reçu", {
    taille,
    issuedAt: iso(issued),
    nextReplacementAt: iso(addMonths(issued, addMo)),
  });
}

function pend(code: string, taille: string | null = "M") {
  return row(code, "En cours", {
    taille,
    issuedAt: iso(now),
    nextReplacementAt: null,
  });
}

function renewOverdue(code: string, monthsAgo: number, weeksAgo: number, taille: string | null = "M") {
  const issued = subMonths(monthsAgo);
  const next = subWeeks(weeksAgo);
  return row(code, "Reçu", {
    taille,
    issuedAt: iso(issued),
    nextReplacementAt: iso(next),
  });
}

function renewNextDaysAgo(code: string, issueMonthsAgo: number, daysAgo: number, taille: string | null = "M") {
  const issued = subMonths(issueMonthsAgo);
  const next = subDays(daysAgo);
  return row(code, "Reçu", {
    taille,
    issuedAt: iso(issued),
    nextReplacementAt: iso(next),
  });
}

function renewNextMonthsAgo(code: string, issueMonthsAgo: number, nextWasMonthsAgo: number, taille: string | null = "M") {
  const issued = subMonths(issueMonthsAgo);
  const next = new Date(now);
  next.setMonth(next.getMonth() - nextWasMonthsAgo);
  return row(code, "Reçu", {
    taille,
    issuedAt: iso(issued),
    nextReplacementAt: iso(next),
  });
}

function repl(code: string, monthsAgo: number, taille: string | null = "M") {
  const issued = subMonths(monthsAgo);
  return row(code, "À remplacer", {
    taille,
    issuedAt: iso(issued),
    nextReplacementAt: null,
  });
}

export const EPI_PRESEED_REPLACEMENT_REQUESTS: Array<{
  employeeId: string;
  itemCode: string;
  reason: string;
  requestedSize?: string | null;
}> = [
  { employeeId: "AV000003", itemCode: "gilet_hv", reason: "damaged" },
  { employeeId: "AV000006", itemCode: "protection_auditive", reason: "lost" },
  { employeeId: "AV000008", itemCode: "lunettes", reason: "wrong_size" },
  { employeeId: "AV000009", itemCode: "tee_shirt", reason: "damaged" },
  { employeeId: "AV000010", itemCode: "pantalon", reason: "expired" },
];

export const EPI_SEED_EMPLOYEES: EpiSeedEmployee[] = [
  {
    employee_id: "AV000001",
    equipements: [
      recv("veste_hv", 5, 8, "L"),
      recv("pull_hiver", 5, 7, "L"),
      renewOverdue("chaussures", 11, 2, "42"),
      recv("gants", 3, 9, "M"),
      recv("casquette", 5, 6, "L"),
      pend("masque", null),
      recv("pantalon", 5, 8, "L"),
    ],
  },
  {
    employee_id: "AV000002",
    equipements: [
      recv("veste_hv", 2, 10, "M"),
      pend("pull_hiver", "L"),
      recv("chaussures", 4, 8, "43"),
      recv("casquette", 2, 11, "M"),
      recv("masque", 2, 10, null),
      renewNextDaysAgo("gilet_hv", 10, 3, "L"),
      pend("pantalon", "M"),
    ],
  },
  {
    employee_id: "AV000003",
    equipements: [
      recv("veste_hv", 3, 9, "L"),
      recv("tee_shirt", 3, 9, "L"),
      recv("pull_hiver", 3, 9, "L"),
      renewNextMonthsAgo("pantalon", 12, 1, "L"),
      recv("chaussures", 3, 9, "44"),
      pend("gants_renforces", "L"),
      recv("casquette", 3, 9, "L"),
      recv("lunettes", 3, 9, null),
      repl("gilet_hv", 4, "XL"),
    ],
  },
  {
    employee_id: "AV000004",
    equipements: [
      recv("veste_hv", 1, 11, "M"),
      recv("tee_shirt", 1, 11, "M"),
      recv("pull_hiver", 1, 11, "M"),
      recv("pantalon", 1, 11, "M"),
      pend("chaussures", "42"),
      recv("gants", 1, 11, "M"),
      renewOverdue("casquette_cache_nuque", 10, 2),
      pend("masque", null),
      recv("gilet_hv", 1, 11, "M"),
    ],
  },
  {
    employee_id: "AV000005",
    equipements: [
      recv("combinaison", 6, 6, "L"),
      recv("chaussures", 6, 6, "43"),
      renewOverdue("gants", 11, 1),
      recv("casquette", 6, 6, "M"),
      pend("gilet_hv", "L"),
      recv("masque", 6, 6, null),
    ],
  },
  {
    employee_id: "AV000006",
    equipements: [
      recv("combinaison", 4, 8, "M"),
      renewOverdue("chaussures", 10, 3),
      recv("gants", 4, 8, "M"),
      recv("lunettes", 4, 8, null),
      pend("casquette_cache_nuque", null),
      recv("bonnet", 4, 8, null),
      repl("protection_auditive", 6, null),
    ],
  },
  {
    employee_id: "AV000007",
    equipements: [
      recv("chemise", 2, 10, "L"),
      recv("veste_chef", 2, 10, "L"),
      recv("pantalon", 2, 10, "L"),
      recv("chaussures", 2, 10, "42"),
      pend("gants", "M"),
      renewNextDaysAgo("casquette", 11, 5, "M"),
      recv("gilet_hv", 2, 10, "L"),
    ],
  },
  {
    employee_id: "AV000008",
    equipements: [
      pend("veste_hv", "L"),
      recv("tee_shirt", 7, 5, "XL"),
      recv("pull_hiver", 7, 5, "XL"),
      recv("pantalon", 7, 5, "L"),
      renewOverdue("chaussures", 12, 3),
      recv("gants_renforces", 7, 5, "L"),
      recv("casquette", 7, 5, "L"),
      repl("lunettes", 7, null),
      pend("gilet_hv", "L"),
    ],
  },
  {
    employee_id: "AV000009",
    equipements: [
      recv("veste_hv", 8, 4, "L"),
      repl("tee_shirt", 8, "L"),
      recv("pull_hiver", 8, 4, "L"),
      recv("pantalon", 8, 4, "L"),
      recv("chaussures", 8, 4, "44"),
      recv("casquette_cache_nuque", 8, 4, null),
      renewNextMonthsAgo("masque", 11, 1, null),
      pend("impermeable", "L"),
      recv("gilet_hv", 8, 4, "L"),
    ],
  },
  {
    employee_id: "AV000010",
    equipements: [
      recv("veste_hv", 1, 11, "M"),
      recv("chaussures", 1, 11, "41"),
      renewNextMonthsAgo("gants", 10, 2, "M"),
      recv("casquette", 1, 11, "M"),
      pend("masque", null),
      recv("gilet_hv", 1, 11, "M"),
      repl("pantalon", 9, "L"),
    ],
  },
];
