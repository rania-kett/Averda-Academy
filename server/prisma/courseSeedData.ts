/**
 * Averda training courses — Arabic titles aligned with original PDF modules.
 * Imported by `prisma/seed.ts` only.
 */

export const DRIVER_SLUGS = [
  "traffic-law-respect",
  "reverse-driving",
  "driving-precautions",
  "driver-prework-instructions",
  "long-sitting-driving",
  "dangerous-driving-habits",
] as const;

/** Loader-only modules (shared slugs are separate rows). */
export const LOADER_ONLY_SLUGS = [
  "footrest-fault-report",
  "safe-ride-behind-compactor",
  "collection-safety-process",
  "loading-lifting-safety",
  "collection-behavior",
  "collection-traffic-accidents-2",
  "footrest-safety-instructions",
  "collection-instructions-2",
  "compaction-containers",
] as const;

/** Sweeper-only modules (shared slugs are separate rows). */
export const SWEEPER_ONLY_SLUGS = [
  "street-sweeping-safety",
  "sweeping-equipment-order",
  "body-preservation-plus",
  "roundabout-sweeping-safety",
  "sweeping-cones-main-streets",
  "sweeping-process-plus",
  "empty-cart-procedure",
  "sweeping-against-traffic",
  "traffic-collision-while-sweeping",
  "bad-weather-sweeping-plus",
  "stay-safe-on-roads",
  "serious-sweeping-accidents-awareness",
] as const;

export const SHARED_HAND_INJURY_SLUG = "hand-injury-avoidance";
export const SHARED_DISTRACTION_SLUG = "distraction-devices-risks";

/** Collecte — order matches original PDF list (11). */
export const LOADER_PROGRESS_SLUGS = [
  "footrest-fault-report",
  "safe-ride-behind-compactor",
  "collection-safety-process",
  "loading-lifting-safety",
  "collection-behavior",
  SHARED_HAND_INJURY_SLUG,
  "collection-traffic-accidents-2",
  "footrest-safety-instructions",
  "collection-instructions-2",
  "compaction-containers",
  SHARED_DISTRACTION_SLUG,
] as const;

/** Balayage — order matches original PDF list (14). */
export const SWEEPER_PROGRESS_SLUGS = [
  "street-sweeping-safety",
  "sweeping-equipment-order",
  "body-preservation-plus",
  "roundabout-sweeping-safety",
  "sweeping-cones-main-streets",
  "sweeping-process-plus",
  "empty-cart-procedure",
  "sweeping-against-traffic",
  SHARED_HAND_INJURY_SLUG,
  "traffic-collision-while-sweeping",
  "bad-weather-sweeping-plus",
  SHARED_DISTRACTION_SLUG,
  "stay-safe-on-roads",
  "serious-sweeping-accidents-awareness",
] as const;

export const DRIVER_PROGRESS_SLUGS = [...DRIVER_SLUGS] as const;

export const PARK_MAINT_SLUGS = [
  "general-first-aid",
  "general-fire-safety",
  "general-ppe",
  "general-site-safety",
  "general-emergency",
  "general-team-safety",
] as const;

export const PARK_MAINT_PROGRESS_SLUGS = [...PARK_MAINT_SLUGS] as const;

const ALL_CODES = ["driver", "sweeper", "loader", "teamLeader", "parkAgent", "maintenance"] as const;

function desc(ar: string, fr: string, en: string) {
  return { ar, fr, en };
}

export type SeedCourseRow = {
  slug: string;
  order: number;
  icon: string;
  cover: string;
  categoryCodes: readonly string[];
  title: { ar: string; fr: string; en: string };
  desc: { ar: string; fr: string; en: string };
  isHsseqFoundation?: boolean;
};

const driverRows: SeedCourseRow[] = DRIVER_SLUGS.map((slug, i) => {
  const titles: Record<string, { ar: string; fr: string; en: string }> = {
    "traffic-law-respect": {
      ar: "احترام قانون السير",
      fr: "Respect du code de la route",
      en: "Respecting traffic laws",
    },
    "reverse-driving": {
      ar: "القيادة إلى الخلف",
      fr: "Conduite en marche arrière",
      en: "Driving in reverse",
    },
    "driving-precautions": {
      ar: "بعض الاحتياطات أثناء السياقة",
      fr: "Précautions pendant la conduite",
      en: "Precautions while driving",
    },
    "driver-prework-instructions": {
      ar: "تعليمات للسائق قبل بداية العمل",
      fr: "Consignes chauffeur avant la prise de service",
      en: "Driver instructions before starting work",
    },
    "long-sitting-driving": {
      ar: "توصيات للحد من مخاطر الجلوس لفترة طويلة أثناء القيادة",
      fr: "Réduire les risques liés à la position assise prolongée",
      en: "Reducing long-sitting risks while driving",
    },
    "dangerous-driving-habits": {
      ar: "عادات القيادة الخطرة",
      fr: "Habitudes de conduite dangereuses",
      en: "Dangerous driving habits",
    },
  };
  const t = titles[slug]!;
  return {
    slug,
    order: 10 + i,
    icon: "🚛",
    cover: "from-indigo-500 to-violet-600",
    categoryCodes: ["driver", "teamLeader"],
    title: t,
    desc: desc(`مادة السائق: ${t.ar}`, `Module chauffeur — ${t.fr}`, `Driver module — ${t.en}`),
  };
});

const loaderOnlyRows: SeedCourseRow[] = LOADER_ONLY_SLUGS.map((slug, i) => {
  const titles: Record<string, { ar: string; fr: string; en: string }> = {
    "footrest-fault-report": {
      ar: "الإبلاغ عن الاعطال في مسند القدم",
      fr: "Signaler les défauts du marchepied",
      en: "Reporting footrest defects",
    },
    "safe-ride-behind-compactor": {
      ar: "الركوب بأمان خلف آلية الضغط",
      fr: "Monter/descendre en sécurité derrière le compacteur",
      en: "Safe riding behind the compactor",
    },
    "collection-safety-process": {
      ar: "السلامة أثناء عملية الجمع",
      fr: "Sécurité pendant la collecte",
      en: "Safety during collection",
    },
    "loading-lifting-safety": {
      ar: "السلامة خلال التحميل والرفع",
      fr: "Sécurité chargement et levage",
      en: "Safety during loading and lifting",
    },
    "collection-behavior": {
      ar: "السلوك الواجب تبنيه أثناء عملية الجمع",
      fr: "Comportement attendu pendant la collecte",
      en: "Expected behavior during collection",
    },
    "collection-traffic-accidents-2": {
      ar: "تجنب حوادث السير أثناء الجمع 2",
      fr: "Éviter les accidents de circulation en collecte (2)",
      en: "Avoiding traffic accidents during collection (2)",
    },
    "footrest-safety-instructions": {
      ar: "تعليمات السلامة عند استعمال مسند القدم",
      fr: "Consignes marchepied",
      en: "Footrest safety instructions",
    },
    "collection-instructions-2": {
      ar: "تعليمات خلال عملية الجمع 2",
      fr: "Instructions pendant la collecte (2)",
      en: "Instructions during collection (2)",
    },
    "compaction-containers": {
      ar: "عملية الكبس وكبس الحاويات",
      fr: "Compactage et bacs",
      en: "Compaction and containers",
    },
  };
  const t = titles[slug]!;
  return {
    slug,
    order: 30 + i,
    icon: "♻️",
    cover: "from-emerald-500 to-teal-600",
    categoryCodes: ["loader"],
    title: t,
    desc: desc(`مادة الجمع: ${t.ar}`, `Module collecte — ${t.fr}`, `Collection module — ${t.en}`),
  };
});

const sweeperOnlyRows: SeedCourseRow[] = SWEEPER_ONLY_SLUGS.map((slug, i) => {
  const titles: Record<string, { ar: string; fr: string; en: string }> = {
    "street-sweeping-safety": {
      ar: "أساسيات السلامة في الكنس",
      fr: "Bases de sécurité du balayage",
      en: "Sweeping safety basics",
    },
    "sweeping-equipment-order": {
      ar: "الحرص على ترتيب معدات الكنس",
      fr: "Rangement du matériel de balayage",
      en: "Organizing sweeping equipment",
    },
    "body-preservation-plus": {
      ar: "الحفاظ على الجسم +",
      fr: "Préserver son corps +",
      en: "Body care +",
    },
    "roundabout-sweeping-safety": {
      ar: "السلامة أثناء عملية الكنس - الكنس في المدار",
      fr: "Sécurité — balayage en giratoire",
      en: "Safety — sweeping in roundabouts",
    },
    "sweeping-cones-main-streets": {
      ar: "السلامة أثناء عملية الكنس - استعمال المخاريط في الشوارع الرئيسية",
      fr: "Sécurité — cônes sur grandes voiries",
      en: "Safety — cones on main roads",
    },
    "sweeping-process-plus": {
      ar: "السلامة أثناء عملية الكنس +",
      fr: "Sécurité pendant le balayage +",
      en: "Safety during sweeping +",
    },
    "empty-cart-procedure": {
      ar: "الطريقة الصحيحة لإفراغ العربة",
      fr: "Vidange correcte du chariot",
      en: "Correct cart emptying procedure",
    },
    "sweeping-against-traffic": {
      ar: "الكنس مقابل حركة المرور",
      fr: "Balayage face à la circulation",
      en: "Sweeping against traffic flow",
    },
    "traffic-collision-while-sweeping": {
      ar: "تجنب الاصطدام مع حركة المرور أثناء الكنس",
      fr: "Éviter les collisions avec la circulation",
      en: "Avoiding collisions while sweeping",
    },
    "bad-weather-sweeping-plus": {
      ar: "حالة الكنس في طقس سيء +",
      fr: "Balayage par mauvais temps +",
      en: "Sweeping in bad weather +",
    },
    "stay-safe-on-roads": {
      ar: "من أجل البقاء آمنا على الطرق",
      fr: "Rester en sécurité sur la route",
      en: "Staying safe on the roads",
    },
    "serious-sweeping-accidents-awareness": {
      ar: "موجز تحسيسي لتجنب الحوادث البليغة في عمليات الكنس",
      fr: "Sensibilisation — accidents graves en balayage",
      en: "Awareness — serious sweeping accidents",
    },
  };
  const t = titles[slug]!;
  return {
    slug,
    order: 50 + i,
    icon: "🧹",
    cover: "from-amber-500 to-orange-600",
    categoryCodes: ["sweeper"],
    title: t,
    desc: desc(`مادة الكنس: ${t.ar}`, `Module balayage — ${t.fr}`, `Sweeping module — ${t.en}`),
  };
});

const sharedRows: SeedCourseRow[] = [
  {
    slug: SHARED_HAND_INJURY_SLUG,
    order: 44,
    icon: "✋",
    cover: "from-rose-500 to-orange-500",
    categoryCodes: ["loader", "sweeper"],
    title: {
      ar: "تجنب الإصابة في اليد أو الساعد عند",
      fr: "Éviter les blessures main/avant-bras",
      en: "Avoiding hand and forearm injury",
    },
    desc: desc(
      "تجنب الإصابة في اليد أو الساعد.",
      "Prévention des blessures à la main et à l'avant-bras.",
      "Preventing hand and forearm injuries."
    ),
  },
  {
    slug: SHARED_DISTRACTION_SLUG,
    order: 74,
    icon: "📵",
    cover: "from-slate-500 to-zinc-700",
    categoryCodes: ["loader", "sweeper"],
    title: {
      ar: "مخاطر استعمال أجهزة الإلهاء أو المفقدة للتركيز (كالهاتف أو سماعات الأذن).",
      fr: "Risques de distraction (téléphone, écouteurs…)",
      en: "Distraction device risks (phones, earphones…)",
    },
    desc: desc(
      "مخاطر الهاتف وسماعات الأذن أثناء العمل.",
      "Risques liés au téléphone et aux écouteurs.",
      "Phone and earphone risks at work."
    ),
  },
];

const parkRows: SeedCourseRow[] = PARK_MAINT_SLUGS.map((slug, i) => {
  const titles: Record<string, { ar: string; fr: string; en: string }> = {
    "general-first-aid": {
      ar: "الإسعافات الأولية في مواقع العمل",
      fr: "Premiers secours sur site",
      en: "First aid in the field",
    },
    "general-fire-safety": {
      ar: "السلامة من الحريق",
      fr: "Prévention incendie",
      en: "Fire safety",
    },
    "general-ppe": {
      ar: "معدات الحماية الشخصية",
      fr: "Équipements de protection",
      en: "Personal protective equipment",
    },
    "general-site-safety": {
      ar: "المبادئ العامة للسلامة في الموقع",
      fr: "Principes généraux de sécurité",
      en: "General on-site safety principles",
    },
    "general-emergency": {
      ar: "الإجراءات الطارئة",
      fr: "Procédures d'urgence",
      en: "Emergency procedures",
    },
    "general-team-safety": {
      ar: "السلامة في العمل الجماعي",
      fr: "Sécurité en équipe",
      en: "Team safety",
    },
  };
  const t = titles[slug]!;
  return {
    slug,
    order: 80 + i,
    icon: "🛡️",
    cover: "from-teal-600 to-cyan-700",
    categoryCodes: ["parkAgent", "maintenance"],
    title: t,
    desc: desc(`مادة عامة: ${t.ar}`, `Module général — ${t.fr}`, `General module — ${t.en}`),
  };
});

export const SEED_COURSE_ROWS: SeedCourseRow[] = [
  ...driverRows,
  ...loaderOnlyRows,
  ...sharedRows,
  ...sweeperOnlyRows,
  ...parkRows,
];
