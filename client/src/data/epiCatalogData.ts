/**
 * Canonical EPI catalog + category defaults (no path aliases).
 * Imported by client `epiCatalog.ts`, server `epiCatalog.ts`, and Prisma seed.
 */

export type EpiCatalogRow = {
  code: string;
  labelFr: string;
  labelAr: string;
  labelEn: string;
  emoji: string | null;
  sortOrder: number;
};

export const EPI_CATALOG_ROWS: EpiCatalogRow[] = [
  { code: "veste_hv", labelFr: "Veste haute visibilité", labelAr: "سترة عاكسة عالية الرؤية", labelEn: "Hi-Vis Vest", emoji: "🦺", sortOrder: 10 },
  { code: "gilet_hv", labelFr: "Gilet haute visibilité", labelAr: "صديرية عاكسة", labelEn: "Hi-Vis Gilet", emoji: "🦺", sortOrder: 20 },
  { code: "veste_chef", labelFr: "Veste (tenue chef d'équipe)", labelAr: "سترة (زي رئيس الفريق)", labelEn: "Team leader jacket", emoji: "🦺", sortOrder: 25 },
  { code: "pull_hiver", labelFr: "Pull hiver", labelAr: "بلوفر شتوي", labelEn: "Winter Pullover", emoji: "🧥", sortOrder: 30 },
  { code: "tee_shirt", labelFr: "Tee-shirt", labelAr: "تيشيرت", labelEn: "T-Shirt", emoji: "👕", sortOrder: 40 },
  { code: "pantalon", labelFr: "Pantalon de travail", labelAr: "بنطلون العمل", labelEn: "Work Trousers", emoji: "👖", sortOrder: 50 },
  { code: "combinaison", labelFr: "Combinaison", labelAr: "بدلة عمل كاملة", labelEn: "Coverall", emoji: "🧑‍🏭", sortOrder: 60 },
  { code: "chaussures", labelFr: "Chaussures de sécurité", labelAr: "حذاء السلامة", labelEn: "Safety Shoes", emoji: "🥾", sortOrder: 70 },
  { code: "gants", labelFr: "Gants de travail", labelAr: "قفازات العمل", labelEn: "Work Gloves", emoji: "🧤", sortOrder: 80 },
  { code: "gants_renforces", labelFr: "Gants renforcés", labelAr: "قفازات مقواة", labelEn: "Reinforced Gloves", emoji: "🧤", sortOrder: 90 },
  { code: "casquette", labelFr: "Casquette", labelAr: "قبعة", labelEn: "Cap", emoji: "🧢", sortOrder: 100 },
  { code: "casquette_cache_nuque", labelFr: "Casquette cache-nuque", labelAr: "قبعة واقية للرقبة", labelEn: "Neck Flap Cap", emoji: "🪖", sortOrder: 110 },
  { code: "bonnet", labelFr: "Bonnet", labelAr: "قبعة شتوية", labelEn: "Winter Beanie", emoji: "🧣", sortOrder: 120 },
  { code: "masque", labelFr: "Masque anti-poussière", labelAr: "قناع ضد الغبار", labelEn: "Dust Mask", emoji: "😷", sortOrder: 130 },
  { code: "lunettes", labelFr: "Lunettes de protection", labelAr: "نظارات الحماية", labelEn: "Safety Glasses", emoji: "🥽", sortOrder: 140 },
  { code: "protection_auditive", labelFr: "Protection auditive", labelAr: "واقي الأذن", labelEn: "Ear Protection", emoji: "🎧", sortOrder: 150 },
  { code: "impermeable", labelFr: "Imperméable / Manteau de pluie", labelAr: "معطف المطر", labelEn: "Rain Coat", emoji: "🧥", sortOrder: 160 },
  { code: "chemise", labelFr: "Chemise", labelAr: "قميص", labelEn: "Shirt", emoji: "👔", sortOrder: 170 },
];

export const EPI_CATEGORY_DEFAULT_ITEM_CODES: Record<string, string[]> = {
  driver: ["veste_hv", "pull_hiver", "pantalon", "chaussures", "gants", "casquette", "masque", "gilet_hv"],
  sweeper: ["veste_hv", "tee_shirt", "pull_hiver", "pantalon", "chaussures", "gants", "casquette_cache_nuque", "masque", "impermeable", "gilet_hv"],
  loader: ["veste_hv", "tee_shirt", "pull_hiver", "pantalon", "chaussures", "gants_renforces", "casquette", "masque", "lunettes", "gilet_hv"],
  parkAgent: ["combinaison", "chaussures", "gants", "casquette", "lunettes", "gilet_hv", "masque"],
  maintenance: ["combinaison", "chaussures", "gants", "lunettes", "casquette_cache_nuque", "bonnet", "protection_auditive", "masque"],
  teamLeader: ["chemise", "veste_chef", "pantalon", "chaussures", "gants", "casquette", "gilet_hv", "lunettes"],
};

export const EPI_CATEGORY_CODES_ORDER = [
  "driver",
  "sweeper",
  "loader",
  "parkAgent",
  "maintenance",
  "teamLeader",
] as const;

export const EPI_LABEL_FR_BY_CODE: Record<string, string> = Object.fromEntries(
  EPI_CATALOG_ROWS.map((r) => [r.code, r.labelFr])
);
