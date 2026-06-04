import { ROAD_TRAFFIC_SAFETY_SLUG, SWEEPING_SAFETY_SLUG } from "@/constants/courseSlugs";

function pdfNorm(pdfUrl: string | undefined): string {
  try {
    return decodeURIComponent(pdfUrl ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
  } catch {
    return (pdfUrl ?? "").toLowerCase();
  }
}

function arNorm(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Basics guidance course: "توجيهات أساسية" (assessment + remedial). */
export function isBasicsGuidanceFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const slug = (course.slug ?? "").trim().toLowerCase();
  if (slug === "basic-guidelines" || slug === "basics-guidelines" || slug === "basic-guidance") return true;
  const ar = arNorm(course.title?.ar ?? "");
  if (ar.includes("توجيهات") && (ar.includes("اساسي") || ar.includes("اساسية") || ar.includes("اساسيه"))) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("direct") && fr.includes("base")) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("basic") && (en.includes("guidance") || en.includes("guidelines"))) return true;
  const pRaw = pdfNorm(course.pdfUrl);
  const pAr = arNorm(pRaw);
  if (pAr.includes("توجيهات") && (pAr.includes("اساسي") || pAr.includes("اساسية"))) return true;
  if (pRaw.includes("basic") && pRaw.includes("guid")) return true;
  return false;
}

export function isHsseqIntroFromCourse(course: {
  isHsseqFoundation?: boolean;
  slug?: string;
  title?: Record<string, string>;
}): boolean {
  if (course.isHsseqFoundation) return true;
  if (course.slug === "company-policy" || course.slug === "hsseq-intro") return true;
  const ar = course.title?.ar ?? "";
  const en = course.title?.en ?? "";
  if (ar.includes("المخطط الشامل")) return true;
  if (en.includes("Comprehensive Occupational Health")) return true;
  return false;
}

/** Road-safety lesson quiz — slug / title / PDF (no `hasLessonQuiz` shortcut). */
export function isRoadTrafficSafetyFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  if (course.slug === ROAD_TRAFFIC_SAFETY_SLUG || course.slug === "responsible-driving-safety") return true;
  const ar = course.title?.ar ?? "";
  if (ar.includes("السلامة أولاً")) return true;
  if (ar.includes("القيادة المسؤولة") && ar.includes("السلامة الطرقية")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("conduite") && fr.includes("responsable") && fr.includes("rout")) return true;
  const p = pdfNorm(course.pdfUrl);
  if (
    p.includes("conduite_responsable") ||
    p.includes("conduite-responsable") ||
    p.includes("conduite_responsable_et") ||
    (p.includes("securite") && p.includes("routiere"))
  ) {
    return true;
  }
  return false;
}

/** Sweeping safety lesson quiz — matches server `isSweepingSafetyCourse`. */
export function isSweepingSafetyFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  if (course.slug === SWEEPING_SAFETY_SLUG) return true;
  const ar = course.title?.ar ?? "";
  if (ar.includes("سلامة عمليات الكنس")) return true;
  if (ar.includes("أساسيات") && ar.includes("السلامة") && ar.includes("الكنس")) return true;
  const p = pdfNorm(course.pdfUrl);
  if (p.includes("balayage") && p.includes("securite")) return true;
  if (p.includes("securite_du_balayage")) return true;
  return false;
}

/** Sweeping against traffic — "الكنس مقابل حركة المرور" */
export function isSweepingAgainstTrafficFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  const ar = arNorm(arRaw);
  if (ar.includes("الكنس") && ar.includes("مقابل") && ar.includes("حركه") && ar.includes("المرور")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("balay") && fr.includes("traffic")) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("sweep") && en.includes("traffic")) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (pAr.includes("الكنس") && pAr.includes("مقابل") && pAr.includes("المرور")) return true;
  if (p.includes("balay") && p.includes("traffic")) return true;
  if (p.includes("sweep") && p.includes("traffic")) return true;
  return false;
}

/** Road safety or sweeping — lesson quiz UI + API. Uses `hasLessonQuiz` from API when present. */
export function isLessonQuizFromCourse(course: {
  hasLessonQuiz?: boolean;
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  if (course.hasLessonQuiz) return true;
  return (
    isRoadTrafficSafetyFromCourse(course) ||
    isSweepingSafetyFromCourse(course) ||
    isSweepingAgainstTrafficFromCourse(course) ||
    isTrafficLawCourse(course) ||
    isFootrestReportingCourse(course) ||
    isReverseDrivingFromCourse(course) ||
    isSweepingEquipmentOrderFromCourse(course) ||
    isSafeRideBehindCompactorFromCourse(course) ||
    isCollectionSafetyFromCourse(course) ||
    isLoadingLiftingFromCourse(course) ||
    isDrivingPrecautionsFromCourse(course) ||
    isCollectionBehaviorFromCourse(course) ||
    isCollectionTrafficAccidentsFromCourse(course) ||
    isCollectionInstructions2FromCourse(course) ||
    isCompactionContainersFromCourse(course) ||
    isDistractionDevicesFromCourse(course) ||
    isDriverPreWorkInstructionsFromCourse(course) ||
    isLongSittingDrivingRecoFromCourse(course) ||
    isDangerousDrivingHabitsFromCourse(course) ||
    isBodyPreservationFromCourse(course) ||
    isRoundaboutSweepingFromCourse(course) ||
    isHandInjuryAvoidanceFromCourse(course) ||
    isTrafficCollisionWhileSweepingFromCourse(course) ||
    isBadWeatherSweepingFromCourse(course) ||
    isStaySafeOnRoadsFromCourse(course) ||
    isSeriousSweepingAccidentsAwarenessFromCourse(course)
  );
}

/** Hand/forearm injury prevention when picking bags — "تجنب الإصابة في اليد او الساعد عند" */
export function isHandInjuryAvoidanceFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const ar = (course.title?.ar ?? "").trim();
  if (
    ar.includes("تجنب") &&
    ar.includes("الإصابة") &&
    (ar.includes("اليد") || ar.includes("يد")) &&
    (ar.includes("الساعد") || ar.includes("ساعد"))
  ) {
    return true;
  }
  const p = pdfNorm(course.pdfUrl);
  if (
    p.includes("تجنب") &&
    p.includes("الإصابة") &&
    (p.includes("اليد") || p.includes("يد")) &&
    (p.includes("الساعد") || p.includes("ساعد"))
  ) {
    return true;
  }
  if (p.includes("glove") && (p.includes("bag") || p.includes("bags"))) return true;
  return false;
}

/** Avoid collision with traffic while sweeping — "تجنب الاصطدام مع حركة المرور أثناء الكنس" */
export function isTrafficCollisionWhileSweepingFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const ar = (course.title?.ar ?? "").trim();
  const hasAvoid = ar.includes("تجنب");
  const hasCollision =
    ar.includes("اصطدام") || ar.includes("إصطدام") || ar.includes("الاصطدام") || ar.includes("الإصطدام");
  const hasTraffic = ar.includes("مرور") || (ar.includes("حركة") && ar.includes("المرور"));
  const hasSweeping = ar.includes("كنس");
  if (hasAvoid && hasCollision && hasTraffic && hasSweeping) return true;
  const p = pdfNorm(course.pdfUrl);
  const pHasCollision =
    p.includes("اصطدام") || p.includes("إصطدام") || p.includes("collision") || p.includes("heurt");
  if (p.includes("تجنب") && pHasCollision && (p.includes("مرور") || p.includes("traffic")) && p.includes("كنس")) {
    return true;
  }
  if (p.includes("avoid") && p.includes("traffic") && (p.includes("sweep") || p.includes("balay"))) return true;
  return false;
}

/** Sweeping in bad weather — "حالة الكنس في طقس سيء" */
export function isBadWeatherSweepingFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const ar = (course.title?.ar ?? "").trim();
  const badWeather =
    ar.includes("سيء") ||
    ar.includes("سيئ") ||
    ar.includes("سوء") ||
    ar.includes("ممطر") ||
    ar.includes("عاصفة");
  if (ar.includes("كنس") && ar.includes("طقس") && badWeather) return true;
  if (ar.includes("حالة") && ar.includes("كنس") && ar.includes("طقس") && badWeather) return true;
  const p = pdfNorm(course.pdfUrl);
  if (p.includes("كنس") && p.includes("طقس") && (p.includes("سيء") || p.includes("weather") || p.includes("meteo"))) {
    return true;
  }
  if ((p.includes("bad") || p.includes("severe")) && p.includes("weather") && (p.includes("sweep") || p.includes("balay"))) {
    return true;
  }
  return false;
}

/** Stay safe on the roads — "من أجل البقاء آمنا على الطرق" */
export function isStaySafeOnRoadsFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const ar = (course.title?.ar ?? "").trim();
  const staySafe =
    ar.includes("آمنا") ||
    ar.includes("آمناً") ||
    ar.includes("آمِن") ||
    (ar.includes("آمن") && ar.includes("على") && ar.includes("الطرق"));
  if (ar.includes("البقاء") && ar.includes("الطرق") && staySafe) return true;
  if (ar.includes("من أجل") && ar.includes("البقاء") && ar.includes("الطرق")) return true;
  const p = pdfNorm(course.pdfUrl);
  if (p.includes("البقاء") && p.includes("طريق") && (p.includes("امن") || p.includes("safe"))) return true;
  if (p.includes("stay") && p.includes("safe") && (p.includes("road") || p.includes("route"))) return true;
  return false;
}

/** Serious/fatal accident prevention in sweeping — "موجز تحسيسي لتجنب الحوادث البليغة في عمليات الكنس" */
export function isSeriousSweepingAccidentsAwarenessFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const ar = (course.title?.ar ?? "").trim();
  if (
    ar.includes("موجز") &&
    ar.includes("تحسيس") &&
    ar.includes("حوادث") &&
    ar.includes("كنس") &&
    (ar.includes("تجنب") || ar.includes("بليغ") || ar.includes("مميت"))
  ) {
    return true;
  }
  if (ar.includes("تجنب") && ar.includes("حوادث") && ar.includes("كنس") && (ar.includes("بليغ") || ar.includes("مميت"))) {
    return true;
  }
  const p = pdfNorm(course.pdfUrl);
  if (
    p.includes("كنس") &&
    (p.includes("accident") || p.includes("grave") || p.includes("fatal") || p.includes("mortel")) &&
    (p.includes("balay") || p.includes("sweep") || p.includes("mo3az") || p.includes("tahsis"))
  ) {
    return true;
  }
  return false;
}

/** Reverse driving (backing up) — "القيادة إلى الخلف" */
export function isReverseDrivingFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const ar = (course.title?.ar ?? "").trim();
  if (ar.includes("القيادة") && (ar.includes("إلى الخلف") || ar.includes("الى الخلف"))) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("marche") && fr.includes("arriere")) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("reverse") || (en.includes("back") && en.includes("driv"))) return true;
  const p = pdfNorm(course.pdfUrl);
  if (p.includes("marche") && p.includes("arriere")) return true;
  if (p.includes("reverse") || p.includes("back")) return true;
  return false;
}

/** Sweeping equipment order — "الحرص على ترتيب معدات الكنس" */
export function isSweepingEquipmentOrderFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const ar = (course.title?.ar ?? "").trim();
  if (ar.includes("الحرص") && ar.includes("ترتيب") && ar.includes("معدات") && ar.includes("الكنس")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("rangement") && (fr.includes("balayage") || fr.includes("materiel"))) return true;
  const p = pdfNorm(course.pdfUrl);
  if (p.includes("rangement") && (p.includes("balayage") || p.includes("materiel"))) return true;
  if (p.includes("rangement") && p.includes("equip")) return true;
  return false;
}

/** Safe riding behind compactor — "الركوب بأمان خلف آلية الضغط" */
export function isSafeRideBehindCompactorFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const ar = (course.title?.ar ?? "").trim();
  if (ar.includes("الركوب") && ar.includes("بأمان") && ar.includes("آلية") && ar.includes("الضغط")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("marchepied") && (fr.includes("compact") || fr.includes("benne") || fr.includes("presse"))) return true;
  const p = pdfNorm(course.pdfUrl);
  if (p.includes("marchepied") && (p.includes("compact") || p.includes("benne") || p.includes("presse"))) return true;
  if (p.includes("ride") && p.includes("safe") && p.includes("comp")) return true;
  return false;
}

/** Traffic law (custom in-app quiz) — "احترام قانون السير" */
export function isTrafficLawCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const ar = (course.title?.ar ?? "").trim();
  if (ar.includes("احترام") && ar.includes("قانون") && ar.includes("السير")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("code") && fr.includes("route")) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("traffic") && en.includes("law")) return true;
  const p = pdfNorm(course.pdfUrl);
  if (p.includes("code") && p.includes("route")) return true;
  if (p.includes("traffic") && p.includes("law")) return true;
  return false;
}

/** Footrest reporting safety (marchepied / مسند القدم). */
export function isFootrestReportingCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const ar = (course.title?.ar ?? "").trim();
  if (ar.includes("مسند") && ar.includes("القدم")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("marchepied")) return true;
  const p = pdfNorm(course.pdfUrl);
  if (p.includes("marchepied")) return true;
  if (p.includes("signalez") && p.includes("prevenir")) return true;
  return false;
}

/** Safety during waste collection — "السلامة أثناء عملية الجمع" / "Sécurité en collecte" */
export function isCollectionSafetyFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("السلامة") && arRaw.includes("أثناء") && arRaw.includes("عملية") && arRaw.includes("الجمع")) return true;
  const ar = arNorm(arRaw);
  if (ar.includes("السلامه") && ar.includes("اثناء") && ar.includes("عمليه") && ar.includes("الجمع")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("securite") && fr.includes("collect")) return true;
  if (fr.includes("travail") && fr.includes("arriere") && fr.includes("benne")) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("collection") && en.includes("safety")) return true;
  const p = pdfNorm(course.pdfUrl);
  if (p.includes("securite") && p.includes("collect")) return true;
  if (p.includes("collect") && p.includes("arriere") && p.includes("benn")) return true;
  if (p.includes("travail") && p.includes("arriere") && p.includes("benn")) return true;
  return false;
}

/** Safety during loading/lifting/unloading — "السلامة خلال التحميل والرفع" */
export function isLoadingLiftingFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("السلامة") && arRaw.includes("التحميل") && arRaw.includes("الرفع")) return true;
  const ar = arNorm(arRaw);
  if (ar.includes("السلامه") && ar.includes("التحميل") && ar.includes("الرفع")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("securite") && (fr.includes("charg") || fr.includes("lev"))) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("loading") && en.includes("lifting")) return true;
  if (en.includes("safety") && (en.includes("loading") || en.includes("lifting") || en.includes("unload"))) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (pAr.includes("تحميل") && pAr.includes("رفع")) return true;
  if (p.includes("charg") && (p.includes("lev") || p.includes("chargement"))) return true;
  if ((p.includes("loading") || p.includes("unload")) && p.includes("lift")) return true;
  return false;
}

/** Driving precautions — "بعض الاحتياطات أثناء السياقة" */
export function isDrivingPrecautionsFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("احتياطات") && (arRaw.includes("السياقة") || arRaw.includes("القيادة"))) return true;
  const ar = arNorm(arRaw);
  if (ar.includes("احتياطات") && (ar.includes("السياقه") || ar.includes("السياقة") || ar.includes("القياده") || ar.includes("القيادة"))) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("precaution") && fr.includes("conduite")) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("driving") && en.includes("precaution")) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (p.includes("precaution") && (p.includes("conduite") || p.includes("driving"))) return true;
  if (pAr.includes("احتياطات") && (pAr.includes("السياقه") || pAr.includes("السياقة") || pAr.includes("القياده") || pAr.includes("القيادة"))) return true;
  return false;
}

/** Collection behavior — "السلوك الواجب تبنيه أثناء عملية الجمع" */
export function isCollectionBehaviorFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("السلوك") && arRaw.includes("الواجب") && arRaw.includes("تبنيه") && arRaw.includes("عملية") && arRaw.includes("الجمع")) return true;
  const ar = arNorm(arRaw);
  if (ar.includes("السلوك") && ar.includes("الواجب") && ar.includes("تبنيه") && ar.includes("عمليه") && ar.includes("الجمع")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("comportement") && fr.includes("collect")) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("behavior") && en.includes("collection")) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (p.includes("comport") && p.includes("collect")) return true;
  if (p.includes("behavior") && p.includes("collect")) return true;
  if (pAr.includes("السلوك") && pAr.includes("الجمع")) return true;
  return false;
}

/** Avoid road traffic accidents during waste collection — "تجنب حوادث السير أثناء الجمع" */
export function isCollectionTrafficAccidentsFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (
    arRaw.includes("تجنب") &&
    arRaw.includes("حوادث") &&
    arRaw.includes("السير") &&
    arRaw.includes("أثناء") &&
    arRaw.includes("الجمع")
  ) {
    return true;
  }
  const ar = arNorm(arRaw);
  if (ar.includes("تجنب") && ar.includes("حوادث") && ar.includes("السير") && ar.includes("اثناء") && ar.includes("الجمع")) {
    return true;
  }
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("accident") && fr.includes("circulation") && (fr.includes("collect") || fr.includes("ramassage"))) {
    return true;
  }
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("avoid") && en.includes("traffic") && en.includes("accident") && en.includes("collection")) {
    return true;
  }
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (pAr.includes("تجنب") && pAr.includes("حوادث") && pAr.includes("السير") && pAr.includes("الجمع")) return true;
  if (p.includes("accident") && p.includes("collect")) return true;
  return false;
}

/** Collection instructions 2 — "تعليمات خلال عملية الجمع 2" */
export function isCollectionInstructions2FromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("تعليمات") && arRaw.includes("خلال") && arRaw.includes("عملية") && arRaw.includes("الجمع") && arRaw.includes("2")) {
    return true;
  }
  const ar = arNorm(arRaw);
  if (ar.includes("تعليمات") && ar.includes("خلال") && ar.includes("عمليه") && ar.includes("الجمع") && ar.includes("2")) {
    return true;
  }
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("instruction") && fr.includes("collect") && (fr.includes("2") || fr.includes("ii"))) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("instruction") && en.includes("collection") && en.includes("2")) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (pAr.includes("تعليمات") && pAr.includes("خلال") && pAr.includes("عمليه") && pAr.includes("الجمع") && pAr.includes("2")) return true;
  return false;
}

/** Compaction / container compaction — "عملية الكبس وكبس الحاويات" */
export function isCompactionContainersFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("الكبس") && (arRaw.includes("الحاويات") || arRaw.includes("حاويات"))) return true;
  const ar = arNorm(arRaw);
  if (ar.includes("الكبس") && (ar.includes("الحاويات") || ar.includes("حاويات"))) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("compact") && (fr.includes("bac") || fr.includes("conteneur") || fr.includes("container"))) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("compaction") && (en.includes("container") || en.includes("bin"))) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (pAr.includes("الكبس") && (pAr.includes("الحاويات") || pAr.includes("حاويات"))) return true;
  if (p.includes("compact") && (p.includes("conten") || p.includes("container") || p.includes("bac"))) return true;
  return false;
}

/** Distraction devices / loss of focus — "مخاطر استعمال أجهزة الإلهاء أو المفقدة للتركيز" */
export function isDistractionDevicesFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("مخاطر") && arRaw.includes("أجهزة") && (arRaw.includes("الإلهاء") || arRaw.includes("الالهاء"))) {
    return true;
  }
  if (arRaw.includes("المفقدة") && arRaw.includes("للتركيز")) return true;
  const ar = arNorm(arRaw);
  if (ar.includes("مخاطر") && ar.includes("اجهزه") && ar.includes("الالهاء")) return true;
  if (ar.includes("المفقده") && ar.includes("للتركيز")) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (pAr.includes("مخاطر") && pAr.includes("الهاء")) return true;
  if (pAr.includes("تركيز") && (pAr.includes("الهاتف") || pAr.includes("سماعات"))) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("distraction") || (fr.includes("telephone") && fr.includes("ecouteur"))) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("distraction") || (en.includes("phone") && en.includes("ear"))) return true;
  return false;
}

/** Driver instructions before starting work — "تعليمات للسائق قبل بداية العمل" */
export function isDriverPreWorkInstructionsFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("تعليمات") && arRaw.includes("للسائق") && arRaw.includes("قبل") && arRaw.includes("بداية") && arRaw.includes("العمل")) return true;
  const ar = arNorm(arRaw);
  if (ar.includes("تعليمات") && ar.includes("للسايق") && ar.includes("قبل") && ar.includes("بدايه") && ar.includes("العمل")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("instruction") && fr.includes("chauffeur") && (fr.includes("avant") || fr.includes("debut"))) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("driver") && en.includes("instruction") && (en.includes("before") || en.includes("start"))) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (p.includes("instruction") && (p.includes("chauffeur") || p.includes("driver")) && (p.includes("avant") || p.includes("before") || p.includes("start"))) return true;
  if (pAr.includes("تعليمات") && (pAr.includes("سائق") || pAr.includes("سايق")) && pAr.includes("بدايه")) return true;
  return false;
}

/** Long sitting while driving recommendations — "توصيات للحد من مخاطر الجلوس لفترة طويلة أثناء القيادة" */
export function isLongSittingDrivingRecoFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const slug = (course.slug ?? "").trim().toLowerCase();
  if (slug === "long-sitting-driving" || slug.includes("long-sitting")) return true;
  try {
    const decoded = decodeURIComponent(course.slug ?? "").toLowerCase();
    if (decoded.includes("جلوس") && decoded.includes("توصيات")) return true;
  } catch {
    /* ignore */
  }
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("توصيات") && arRaw.includes("الحد") && arRaw.includes("مخاطر") && arRaw.includes("الجلوس") && (arRaw.includes("القيادة") || arRaw.includes("السياقة"))) {
    return true;
  }
  const ar = arNorm(arRaw);
  if (ar.includes("توصيات") && ar.includes("الحد") && ar.includes("مخاطر") && ar.includes("الجلوس") && (ar.includes("القياده") || ar.includes("القيادة") || ar.includes("السياقه") || ar.includes("السياقة"))) {
    return true;
  }
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("assis") && fr.includes("long") && fr.includes("condu")) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("sitting") && en.includes("driv")) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (p.includes("sitting") && p.includes("driv")) return true;
  if (p.includes("assis") && p.includes("condu")) return true;
  if (pAr.includes("الجلوس") && (pAr.includes("القياده") || pAr.includes("القيادة") || pAr.includes("السياقه") || pAr.includes("السياقة"))) return true;
  return false;
}

/** Dangerous driving habits — "عادات القيادة الخطرة" */
export function isDangerousDrivingHabitsFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("عادات") && arRaw.includes("الخطرة") && (arRaw.includes("القيادة") || arRaw.includes("السياقة"))) return true;
  const ar = arNorm(arRaw);
  if (ar.includes("عادات") && ar.includes("الخطر") && (ar.includes("القياده") || ar.includes("القيادة") || ar.includes("السياقه") || ar.includes("السياقة"))) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("habitudes") && fr.includes("condu") && (fr.includes("dang") || fr.includes("risq"))) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("driving") && (en.includes("habit") || en.includes("habits")) && (en.includes("danger") || en.includes("risk"))) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (p.includes("habit") && p.includes("driv") && (p.includes("danger") || p.includes("risk"))) return true;
  if (p.includes("habitud") && p.includes("condu") && (p.includes("dang") || p.includes("risq"))) return true;
  if (pAr.includes("عادات") && pAr.includes("الخط") && (pAr.includes("القياده") || pAr.includes("القيادة") || pAr.includes("السياقه") || pAr.includes("السياقة"))) return true;
  return false;
}

/** Body preservation — "الحفاظ على الجسم" */
export function isBodyPreservationFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("الحفاظ") && arRaw.includes("الجسم")) return true;
  const ar = arNorm(arRaw);
  if (ar.includes("الحفاظ") && ar.includes("الجسم")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("preserv") && fr.includes("corps")) return true;
  if (fr.includes("garder") && fr.includes("corps")) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("body") && (en.includes("preserv") || en.includes("protect"))) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (pAr.includes("الحفاظ") && pAr.includes("الجسم")) return true;
  if (p.includes("corps") && (p.includes("preserv") || p.includes("protec"))) return true;
  if (p.includes("body") && (p.includes("preserv") || p.includes("protect"))) return true;
  return false;
}

/** Roundabout sweeping safety — "السلامة أثناء عملية الكنس - الكنس في المدار" */
export function isRoundaboutSweepingFromCourse(course: {
  slug?: string;
  title?: Record<string, string>;
  pdfUrl?: string;
}): boolean {
  const arRaw = (course.title?.ar ?? "").trim();
  if (arRaw.includes("السلامة") && arRaw.includes("الكنس") && (arRaw.includes("المدار") || arRaw.includes("في المدار"))) return true;
  if (arRaw.includes("السلامة") && (arRaw.includes("االكنس") || arRaw.includes("الكنس")) && arRaw.includes("المدار")) return true;
  const ar = arNorm(arRaw);
  if (ar.includes("السلامه") && (ar.includes("الكنس") || ar.includes("االكنس")) && ar.includes("المدار")) return true;
  const fr = (course.title?.fr ?? "").toLowerCase();
  if (fr.includes("securite") && fr.includes("balay") && (fr.includes("giratoire") || fr.includes("rond"))) return true;
  const en = (course.title?.en ?? "").toLowerCase();
  if (en.includes("sweep") && (en.includes("roundabout") || en.includes("circle"))) return true;
  const p = pdfNorm(course.pdfUrl);
  const pAr = arNorm(p);
  if (p.includes("balay") && (p.includes("giratoire") || p.includes("rond"))) return true;
  if (p.includes("roundabout") && p.includes("sweep")) return true;
  if (pAr.includes("المدار") && (pAr.includes("الكنس") || pAr.includes("االكنس"))) return true;
  return false;
}
