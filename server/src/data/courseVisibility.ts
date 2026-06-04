import { ROAD_TRAFFIC_SAFETY_SLUG } from "./roadSafetyLessonQuiz.js";
import { SWEEPING_SAFETY_SLUG } from "./sweepingLessonQuiz.js";

function titleAr(title: unknown): string {
  const t = title as Record<string, string> | undefined;
  return t?.ar ?? "";
}

function titleEn(title: unknown): string {
  const t = title as Record<string, string> | undefined;
  return t?.en ?? "";
}

function titleFr(title: unknown): string {
  const t = title as Record<string, string> | undefined;
  return t?.fr ?? "";
}

/** Normalize PDF path for substring checks (accents / encoding). */
function pdfNorm(pdfUrl: string | null | undefined): string {
  try {
    return decodeURIComponent(pdfUrl ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
  } catch {
    return (pdfUrl ?? "").toLowerCase();
  }
}

/**
 * Courses that share the road-safety lesson quiz (same 10 questions + API).
 * Matches: canonical slug, Arabic titles, or Conduite / responsible-driving PDF filename.
 */
export function isRoadTrafficSafetyCourse(
  slug: string,
  title: unknown,
  pdfUrl?: string | null
): boolean {
  if (slug === ROAD_TRAFFIC_SAFETY_SLUG || slug === "responsible-driving-safety") return true;
  const ar = titleAr(title);
  if (ar.includes("السلامة أولاً")) return true;
  if (ar.includes("القيادة المسؤولة") && ar.includes("السلامة الطرقية")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("conduite") && fr.includes("responsable") && fr.includes("rout")) return true;
  const p = pdfNorm(pdfUrl);
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

/** سلامة عمليات الكنس — matches Arabic title or Balayage PDF filename. */
export function isSweepingSafetyCourse(
  slug: string,
  title: unknown,
  pdfUrl?: string | null
): boolean {
  if (slug === SWEEPING_SAFETY_SLUG) return true;
  const ar = titleAr(title);
  if (ar.includes("سلامة عمليات الكنس")) return true;
  if (ar.includes("أساسيات") && ar.includes("السلامة") && ar.includes("الكنس")) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("balayage") && p.includes("securite")) return true;
  if (p.includes("securite_du_balayage")) return true;
  return false;
}

/** Sweeping against traffic — "الكنس مقابل حركة المرور" */
export function isSweepingAgainstTrafficCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("الكنس") && ar.includes("مقابل") && ar.includes("حركة") && ar.includes("المرور")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("balay") && fr.includes("traffic")) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("sweep") && en.includes("traffic")) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("الكنس") && p.includes("مقابل") && p.includes("المرور")) return true;
  if (p.includes("balay") && p.includes("traffic")) return true;
  if (p.includes("sweep") && p.includes("traffic")) return true;
  return false;
}

/** Traffic law (custom quiz) — match Arabic/FR/EN title or PDF filename. */
export function isTrafficLawCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("احترام") && ar.includes("قانون") && ar.includes("السير")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("code") && fr.includes("route")) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("traffic") && en.includes("law")) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("code") && p.includes("route")) return true;
  if (p.includes("traffic") && p.includes("law")) return true;
  return false;
}

/** Reverse driving (backing up) — "القيادة إلى الخلف" */
export function isReverseDrivingCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("القيادة") && ar.includes("إلى الخلف")) return true;
  if (ar.includes("القيادة") && ar.includes("الى الخلف")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("marche") && fr.includes("arriere")) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("reverse") || (en.includes("back") && en.includes("driv"))) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("marche") && p.includes("arriere")) return true;
  if (p.includes("reverse") || p.includes("back")) return true;
  return false;
}

/** Sweeping equipment order — "الحرص على ترتيب معدات الكنس" */
export function isSweepingEquipmentOrderCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("الحرص") && ar.includes("ترتيب") && ar.includes("معدات") && ar.includes("الكنس")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("rangement") && (fr.includes("balayage") || fr.includes("materiel"))) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("rangement") && (p.includes("balayage") || p.includes("materiel"))) return true;
  if (p.includes("rangement") && p.includes("equip")) return true;
  return false;
}

/** Safe riding behind compactor — "الركوب بأمان خلف آلية الضغط" */
export function isSafeRideBehindCompactorCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("الركوب") && ar.includes("بأمان") && ar.includes("آلية") && ar.includes("الضغط")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("marchepied") && (fr.includes("compact") || fr.includes("benne") || fr.includes("presse"))) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("marchepied") && (p.includes("compact") || p.includes("benne") || p.includes("presse"))) return true;
  if (p.includes("ride") && p.includes("safe") && p.includes("comp")) return true;
  return false;
}

/** Footrest reporting safety (marchepied / مسند القدم). */
export function isFootrestReportingCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("مسند") && ar.includes("القدم")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("marchepied")) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("marchepied")) return true;
  if (p.includes("signalez") && p.includes("prevenir")) return true;
  return false;
}

/** Safety during waste collection — "السلامة أثناء عملية الجمع" / "Sécurité en collecte" */
export function isCollectionSafetyCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("السلامة") && ar.includes("أثناء") && ar.includes("عملية") && ar.includes("الجمع")) return true;
  if (ar.includes("السلامه") && ar.includes("اثناء") && ar.includes("عمليه") && ar.includes("الجمع")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("securite") && fr.includes("collect")) return true;
  if (fr.includes("travail") && fr.includes("arriere") && fr.includes("benne")) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("collection") && en.includes("safety")) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("securite") && p.includes("collect")) return true;
  if (p.includes("collect") && p.includes("arriere") && p.includes("benn")) return true;
  if (p.includes("travail") && p.includes("arriere") && p.includes("benn")) return true;
  return false;
}

/** Safety during loading/lifting/unloading — "السلامة خلال التحميل والرفع" */
export function isLoadingLiftingCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("السلامة") && (ar.includes("التحميل") || ar.includes("تحميل")) && (ar.includes("الرفع") || ar.includes("رفع"))) return true;
  if (ar.includes("السلامه") && ar.includes("التحميل") && ar.includes("الرفع")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("securite") && (fr.includes("charg") || fr.includes("lev"))) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("loading") && en.includes("lifting")) return true;
  if (en.includes("safety") && (en.includes("loading") || en.includes("lifting") || en.includes("unload"))) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("تحميل") && p.includes("رفع")) return true;
  if (p.includes("charg") && (p.includes("lev") || p.includes("chargement"))) return true;
  if ((p.includes("loading") || p.includes("unload")) && p.includes("lift")) return true;
  return false;
}

/** Driving precautions — "بعض الاحتياطات أثناء السياقة" */
export function isDrivingPrecautionsCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("احتياطات") && (ar.includes("السياقة") || ar.includes("القيادة"))) return true;
  if (ar.includes("بعض") && ar.includes("احتياطات") && ar.includes("السياقة")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("precaution") && fr.includes("conduite")) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("driving") && en.includes("precaution")) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("precaution") && (p.includes("conduite") || p.includes("driving"))) return true;
  const pAr = p; // already normalized/decoded + lowercased
  if (pAr.includes("احتياطات") && (pAr.includes("السياقة") || pAr.includes("القيادة"))) return true;
  return false;
}

/** Collection behavior — "السلوك الواجب تبنيه أثناء عملية الجمع" */
export function isCollectionBehaviorCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("السلوك") && ar.includes("الواجب") && ar.includes("تبنيه") && ar.includes("عملية") && ar.includes("الجمع")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("comportement") && fr.includes("collect")) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("behavior") && en.includes("collection")) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("comport") && p.includes("collect")) return true;
  if (p.includes("behavior") && p.includes("collect")) return true;
  if (p.includes("السلوك") && p.includes("الجمع")) return true;
  return false;
}

/** Avoid road traffic accidents during waste collection — "تجنب حوادث السير أثناء الجمع" */
export function isCollectionTrafficAccidentsCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("تجنب") && ar.includes("حوادث") && ar.includes("السير") && ar.includes("أثناء") && ar.includes("الجمع")) {
    return true;
  }
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("accident") && fr.includes("circulation") && (fr.includes("collect") || fr.includes("ramassage"))) {
    return true;
  }
  const en = titleEn(title).toLowerCase();
  if (en.includes("avoid") && en.includes("traffic") && en.includes("accident") && en.includes("collection")) {
    return true;
  }
  const p = pdfNorm(pdfUrl);
  if (p.includes("تجنب") && p.includes("حوادث") && p.includes("السير") && p.includes("الجمع")) return true;
  if (p.includes("accident") && p.includes("collect")) return true;
  return false;
}

/** Collection instructions 2 — "تعليمات خلال عملية الجمع 2" */
export function isCollectionInstructions2Course(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("تعليمات") && ar.includes("خلال") && ar.includes("عملية") && ar.includes("الجمع") && ar.includes("2")) {
    return true;
  }
  // Some titles may omit the trailing number; use PDF markers too.
  const p = pdfNorm(pdfUrl);
  if (p.includes("تعليمات") && p.includes("خلال") && p.includes("عملية") && p.includes("الجمع") && (p.includes(" 2") || p.includes("2"))) {
    return true;
  }
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("instruction") && fr.includes("collect") && (fr.includes("2") || fr.includes("ii"))) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("instruction") && en.includes("collection") && en.includes("2")) return true;
  return false;
}

/** Compaction / container compaction — "عملية الكبس وكبس الحاويات" */
export function isCompactionContainersCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("الكبس") && (ar.includes("الحاويات") || ar.includes("الحاويه") || ar.includes("حاويات"))) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("compact") && (fr.includes("bac") || fr.includes("conteneur") || fr.includes("container"))) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("compaction") && (en.includes("container") || en.includes("bin"))) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("الكبس") && (p.includes("حاويات") || p.includes("الحاويات"))) return true;
  if (p.includes("compact") && (p.includes("conten") || p.includes("container") || p.includes("bac"))) return true;
  return false;
}

/** Distraction devices / loss of focus — "مخاطر استعمال أجهزة الإلهاء أو المفقدة للتركيز" */
export function isDistractionDevicesCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("مخاطر") && ar.includes("أجهزة") && (ar.includes("الإلهاء") || ar.includes("الالهاء"))) return true;
  if (ar.includes("المفقدة") && ar.includes("للتركيز")) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("مخاطر") && p.includes("الهاء")) return true;
  if (p.includes("تركيز") && (p.includes("الهاتف") || p.includes("سماعات"))) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("distraction") || (fr.includes("telephone") && fr.includes("ecouteur"))) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("distraction") || (en.includes("phone") && en.includes("ear"))) return true;
  return false;
}

/** Driver instructions before starting work — "تعليمات للسائق قبل بداية العمل" */
export function isDriverPreWorkInstructionsCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("تعليمات") && ar.includes("للسائق") && ar.includes("قبل") && ar.includes("بداية") && ar.includes("العمل")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("instruction") && fr.includes("chauffeur") && (fr.includes("avant") || fr.includes("debut"))) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("driver") && en.includes("instruction") && (en.includes("before") || en.includes("start"))) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("instruction") && (p.includes("chauffeur") || p.includes("driver")) && (p.includes("avant") || p.includes("before") || p.includes("start"))) return true;
  if (p.includes("تعليمات") && p.includes("سائق") && p.includes("بداية")) return true;
  return false;
}

/** Long sitting while driving recommendations — "توصيات للحد من مخاطر الجلوس لفترة طويلة أثناء القيادة" */
export function isLongSittingDrivingRecoCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const s = (slug ?? "").trim().toLowerCase();
  if (s === "long-sitting-driving" || s.includes("long-sitting")) return true;
  try {
    const decoded = decodeURIComponent(slug).toLowerCase();
    if (decoded.includes("جلوس") && decoded.includes("توصيات")) return true;
    if (decoded.includes("جلوس") && decoded.includes("مخاطر") && decoded.includes("قيادة")) return true;
  } catch {
    /* ignore */
  }
  const ar = titleAr(title);
  if (
    ar.includes("توصيات") &&
    ar.includes("الحد") &&
    ar.includes("مخاطر") &&
    ar.includes("الجلوس") &&
    (ar.includes("القيادة") || ar.includes("السياقة") || ar.includes("أثناء") || ar.includes("اثناء"))
  ) {
    return true;
  }
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("assis") && fr.includes("long") && fr.includes("condu")) return true;
  if (fr.includes("position") && fr.includes("condu")) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("sitting") && en.includes("driv")) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("sitting") && p.includes("driv")) return true;
  if (p.includes("assis") && p.includes("condu")) return true;
  if (p.includes("الجلوس") && (p.includes("القيادة") || p.includes("السياقة"))) return true;
  return false;
}

/** Dangerous driving habits — "عادات القيادة الخطرة" */
export function isDangerousDrivingHabitsCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("عادات") && (ar.includes("القيادة") || ar.includes("السياقة")) && ar.includes("الخطرة")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("habitudes") && fr.includes("condu") && (fr.includes("dang") || fr.includes("risq"))) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("driving") && (en.includes("habit") || en.includes("habits")) && (en.includes("danger") || en.includes("risk"))) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("habit") && p.includes("driv") && (p.includes("danger") || p.includes("risk"))) return true;
  if (p.includes("habitud") && p.includes("condu") && (p.includes("dang") || p.includes("risq"))) return true;
  if (p.includes("عادات") && p.includes("الخطرة") && (p.includes("القيادة") || p.includes("السياقة"))) return true;
  return false;
}

/** Body preservation — "الحفاظ على الجسم" */
export function isBodyPreservationCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("الحفاظ") && ar.includes("الجسم")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("preserv") && fr.includes("corps")) return true;
  if (fr.includes("garder") && fr.includes("corps")) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("body") && (en.includes("preserv") || en.includes("protect"))) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("الحفاظ") && p.includes("الجسم")) return true;
  if (p.includes("corps") && (p.includes("preserv") || p.includes("protec"))) return true;
  if (p.includes("body") && (p.includes("preserv") || p.includes("protect"))) return true;
  return false;
}

/** Roundabout sweeping safety — "السلامة أثناء عملية الكنس - الكنس في المدار" */
export function isRoundaboutSweepingCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("السلامة") && ar.includes("الكنس") && (ar.includes("المدار") || ar.includes("في المدار"))) return true;
  // Handle common typo/double alef in user content (االكنس)
  if (ar.includes("السلامة") && (ar.includes("االكنس") || ar.includes("الكنس")) && ar.includes("المدار")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("securite") && fr.includes("balay") && (fr.includes("rond") || fr.includes("giratoire"))) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("sweep") && (en.includes("roundabout") || en.includes("circle"))) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("balay") && (p.includes("giratoire") || p.includes("rond"))) return true;
  if (p.includes("roundabout") && p.includes("sweep")) return true;
  if (p.includes("المدار") && (p.includes("الكنس") || p.includes("االكنس"))) return true;
  return false;
}

/** Hand/forearm injury prevention when picking plastic bags — "تجنب الإصابة في اليد او الساعد عند" */
export function isHandInjuryAvoidanceCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  if (ar.includes("تجنب") && ar.includes("الإصابة") && (ar.includes("اليد") || ar.includes("يد")) && (ar.includes("الساعد") || ar.includes("ساعد"))) {
    return true;
  }
  // Some titles are truncated in data; fall back to PDF filename markers.
  const p = pdfNorm(pdfUrl);
  if (p.includes("تجنب") && p.includes("الإصابة") && (p.includes("اليد") || p.includes("يد")) && (p.includes("الساعد") || p.includes("ساعد"))) {
    return true;
  }
  if (p.includes("glove") && (p.includes("bag") || p.includes("bags"))) return true;
  return false;
}

/** Avoid collision with traffic while sweeping — "تجنب الاصطدام مع حركة المرور أثناء الكنس" */
export function isTrafficCollisionWhileSweepingCourse(
  slug: string,
  title: unknown,
  pdfUrl?: string | null
): boolean {
  const ar = titleAr(title);
  const hasAvoid = ar.includes("تجنب");
  const hasCollision =
    ar.includes("اصطدام") || ar.includes("إصطدام") || ar.includes("الاصطدام") || ar.includes("الإصطدام");
  const hasTraffic = ar.includes("مرور") || (ar.includes("حركة") && ar.includes("المرور"));
  const hasSweeping = ar.includes("كنس");
  if (hasAvoid && hasCollision && hasTraffic && hasSweeping) return true;
  const p = pdfNorm(pdfUrl);
  const pHasCollision =
    p.includes("اصطدام") || p.includes("إصطدام") || p.includes("collision") || p.includes("heurt");
  if (p.includes("تجنب") && pHasCollision && (p.includes("مرور") || p.includes("traffic")) && p.includes("كنس")) {
    return true;
  }
  if (p.includes("avoid") && p.includes("traffic") && (p.includes("sweep") || p.includes("balay"))) return true;
  return false;
}

/** Sweeping in bad weather — "حالة الكنس في طقس سيء" */
export function isBadWeatherSweepingCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  const badWeather =
    ar.includes("سيء") ||
    ar.includes("سيئ") ||
    ar.includes("سوء") ||
    ar.includes("ممطر") ||
    ar.includes("عاصفة");
  if (ar.includes("كنس") && ar.includes("طقس") && badWeather) return true;
  if (ar.includes("حالة") && ar.includes("كنس") && ar.includes("طقس") && badWeather) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("كنس") && p.includes("طقس") && (p.includes("سيء") || p.includes("weather") || p.includes("meteo"))) {
    return true;
  }
  if ((p.includes("bad") || p.includes("severe")) && p.includes("weather") && (p.includes("sweep") || p.includes("balay"))) {
    return true;
  }
  return false;
}

/** Stay safe on the roads — "من أجل البقاء آمنا على الطرق" */
export function isStaySafeOnRoadsCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const ar = titleAr(title);
  const staySafe =
    ar.includes("آمنا") ||
    ar.includes("آمناً") ||
    ar.includes("آمِن") ||
    (ar.includes("آمن") && ar.includes("على") && ar.includes("الطرق"));
  if (ar.includes("البقاء") && ar.includes("الطرق") && staySafe) return true;
  if (ar.includes("من أجل") && ar.includes("البقاء") && ar.includes("الطرق")) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("البقاء") && p.includes("طريق") && (p.includes("امن") || p.includes("safe"))) return true;
  if (p.includes("stay") && p.includes("safe") && (p.includes("road") || p.includes("route"))) return true;
  return false;
}

/** Serious/fatal accident prevention in sweeping — "موجز تحسيسي لتجنب الحوادث البليغة في عمليات الكنس" */
export function isSeriousSweepingAccidentsAwarenessCourse(
  slug: string,
  title: unknown,
  pdfUrl?: string | null
): boolean {
  const ar = titleAr(title);
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
  const p = pdfNorm(pdfUrl);
  if (
    p.includes("كنس") &&
    (p.includes("accident") || p.includes("grave") || p.includes("fatal") || p.includes("mortel")) &&
    (p.includes("balay") || p.includes("sweep") || p.includes("mo3az") || p.includes("tahsis"))
  ) {
    return true;
  }
  return false;
}

/** Basics guidance course: "توجيهات أساسية" (assessment-based remedial). */
export function isBasicsGuidanceCourse(slug: string, title: unknown, pdfUrl?: string | null): boolean {
  const s = (slug ?? "").trim().toLowerCase();
  if (s === "basic-guidelines" || s === "basics-guidelines" || s === "basic-guidance") return true;
  const ar = titleAr(title);
  if (ar.includes("توجيهات") && ar.includes("أساسية")) return true;
  const fr = titleFr(title).toLowerCase();
  if (fr.includes("direct") && fr.includes("base")) return true;
  const en = titleEn(title).toLowerCase();
  if (en.includes("basic") && (en.includes("guidance") || en.includes("guidelines"))) return true;
  const p = pdfNorm(pdfUrl);
  if (p.includes("توجيهات") || (p.includes("basic") && p.includes("guid"))) return true;
  return false;
}

/** Any course that exposes a built-in lesson quiz (road safety or sweeping). */
export function isLessonQuizCourse(
  slug: string,
  title: unknown,
  pdfUrl?: string | null
): boolean {
  return (
    isRoadTrafficSafetyCourse(slug, title, pdfUrl) ||
    isSweepingSafetyCourse(slug, title, pdfUrl) ||
    isSweepingAgainstTrafficCourse(slug, title, pdfUrl) ||
    isTrafficLawCourse(slug, title, pdfUrl) ||
    isReverseDrivingCourse(slug, title, pdfUrl) ||
    isSweepingEquipmentOrderCourse(slug, title, pdfUrl) ||
    isSafeRideBehindCompactorCourse(slug, title, pdfUrl) ||
    isFootrestReportingCourse(slug, title, pdfUrl) ||
    isCollectionSafetyCourse(slug, title, pdfUrl) ||
    isLoadingLiftingCourse(slug, title, pdfUrl) ||
    isDrivingPrecautionsCourse(slug, title, pdfUrl) ||
    isCollectionBehaviorCourse(slug, title, pdfUrl) ||
    isDriverPreWorkInstructionsCourse(slug, title, pdfUrl) ||
    isCollectionTrafficAccidentsCourse(slug, title, pdfUrl) ||
    isCollectionInstructions2Course(slug, title, pdfUrl) ||
    isCompactionContainersCourse(slug, title, pdfUrl) ||
    isDistractionDevicesCourse(slug, title, pdfUrl) ||
    isLongSittingDrivingRecoCourse(slug, title, pdfUrl) ||
    isDangerousDrivingHabitsCourse(slug, title, pdfUrl) ||
    isBodyPreservationCourse(slug, title, pdfUrl) ||
    isRoundaboutSweepingCourse(slug, title, pdfUrl) ||
    isHandInjuryAvoidanceCourse(slug, title, pdfUrl) ||
    isTrafficCollisionWhileSweepingCourse(slug, title, pdfUrl) ||
    isBadWeatherSweepingCourse(slug, title, pdfUrl) ||
    isStaySafeOnRoadsCourse(slug, title, pdfUrl) ||
    isSeriousSweepingAccidentsAwarenessCourse(slug, title, pdfUrl)
  );
}

/**
 * HSSEQ intro / Averda-intro — foundation flag, known slugs, or title markers.
 * Used only to hide when assessment ≥70% (never affects Road Safety).
 */
export function isHsseqIntroCourse(
  isHsseqFoundation: boolean,
  slug: string,
  title: unknown
): boolean {
  if (isHsseqFoundation) return true;
  if (slug === "company-policy" || slug === "hsseq-intro") return true;
  const ar = titleAr(title);
  const en = titleEn(title);
  if (ar.includes("المخطط الشامل")) return true;
  if (en.includes("Comprehensive Occupational Health")) return true;
  return false;
}
