export type EpiItemDef = {
  code: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  emoji: string;
  lifespanDays: number;
};

export const EPI_ITEMS: Record<string, EpiItemDef> = {
  combinaison: {
    code: "combinaison",
    labelAr: "بدلة عمل كاملة",
    labelFr: "Combinaison",
    labelEn: "Coverall",
    emoji: "🧑‍🏭",
    lifespanDays: 365,
  },
  chaussures: {
    code: "chaussures",
    labelAr: "حذاء السلامة",
    labelFr: "Chaussures de sécurité",
    labelEn: "Safety Shoes",
    emoji: "🥾",
    lifespanDays: 365,
  },
  gants: {
    code: "gants",
    labelAr: "قفازات العمل",
    labelFr: "Gants de travail",
    labelEn: "Work Gloves",
    emoji: "🧤",
    lifespanDays: 90,
  },
  gants_renforces: {
    code: "gants_renforces",
    labelAr: "قفازات مقواة",
    labelFr: "Gants renforcés",
    labelEn: "Reinforced Gloves",
    emoji: "🧤",
    lifespanDays: 90,
  },
  casquette: {
    code: "casquette",
    labelAr: "قبعة",
    labelFr: "Casquette",
    labelEn: "Cap",
    emoji: "🧢",
    lifespanDays: 365,
  },
  veste_hv: {
    code: "veste_hv",
    labelAr: "سترة عاكسة عالية الرؤية",
    labelFr: "Veste haute visibilité",
    labelEn: "Hi-Vis Vest",
    emoji: "🦺",
    lifespanDays: 180,
  },
  masque: {
    code: "masque",
    labelAr: "قناع ضد الغبار",
    labelFr: "Masque anti-poussière",
    labelEn: "Dust Mask",
    emoji: "😷",
    lifespanDays: 30,
  },
  helmet_safety: {
    code: "helmet_safety",
    labelAr: "خوذة السلامة",
    labelFr: "Casque de sécurité",
    labelEn: "Safety Helmet",
    emoji: "🪖",
    lifespanDays: 365,
  },
  lunettes: {
    code: "lunettes",
    labelAr: "نظارات الحماية",
    labelFr: "Lunettes de protection",
    labelEn: "Safety Glasses",
    emoji: "🥽",
    lifespanDays: 180,
  },
  protection_auditive: {
    code: "protection_auditive",
    labelAr: "واقي الأذن",
    labelFr: "Protection auditive",
    labelEn: "Ear Protection",
    emoji: "🎧",
    lifespanDays: 180,
  },
  safety_belt: {
    code: "safety_belt",
    labelAr: "حزام السلامة",
    labelFr: "Ceinture de sécurité",
    labelEn: "Safety Belt",
    emoji: "🔗",
    lifespanDays: 365,
  },
};

/** Required EPI item codes per employee category. */
export const ROLE_EPI_CODES: Record<string, string[]> = {
  driver: ["combinaison", "chaussures", "gants", "casquette", "veste_hv", "masque"],
  loader: [
    "combinaison",
    "chaussures",
    "gants_renforces",
    "helmet_safety",
    "veste_hv",
    "masque",
    "protection_auditive",
    "lunettes",
  ],
  maintenance: [
    "combinaison",
    "chaussures",
    "gants_renforces",
    "helmet_safety",
    "lunettes",
    "protection_auditive",
    "masque",
    "safety_belt",
  ],
  sweeper: ["combinaison", "chaussures", "gants", "masque", "veste_hv", "casquette"],
  teamLeader: ["combinaison", "chaussures", "gants", "veste_hv", "casquette"],
};
