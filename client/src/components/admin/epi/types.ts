export type EpiStatusFr = "Attribué" | "En cours" | "Reçu" | "À remplacer";

export type EpiItem = {
  /** French display name; must match `EPI_LABEL_FR_BY_CODE[code]` when `code` is set. */
  nom: string;
  /** Stable catalog code (preferred for passport rows). */
  code?: string;
  statut: EpiStatusFr;
  reception: boolean;
  fit: boolean;
  taille: string | null;
  /** ISO timestamps for local passport (optional). */
  issuedAt?: string;
  nextReplacementAt?: string | null;
};

export type EpiEmployee = {
  employee_id: string;
  nom: string;
  poste: string;
  /** Prisma `Category.code`: driver | sweeper | loader | parkAgent | maintenance | teamLeader */
  categoryCode: string;
  equipements: EpiItem[];
};

export type AlertSeverity = "critical" | "high" | "medium";

export type EpiAlert = {
  id: string;
  severity: AlertSeverity;
  employee_id: string;
  employeeName: string;
  role: string;
  equipmentName: string;
  message: string;
};

