export const COURSE_PDF_MAP: Record<string, { category: string; filename: string }> = {

  // Drivers - Arabic slugs from DB
  "احترام-قانون-السير": { category: "Drivers", filename: "احترام قانون السير" },
  "القيادة-إلى-الخلف": { category: "Drivers", filename: "القيادة إلى الخلف" },
  "بعض-الاحتياطات-أثناء-السياقة": { category: "Drivers", filename: "بعض الاحتياطات أثناء السياقة" },
  "تعليمات-للسائق-قبل-بداية-العمل": { category: "Drivers", filename: "تعليمات للسائق قبل بداية العمل" },
  "توصيات-للحد-من-مخاطر-الجلوس-لفترة-طويلة-أثناء-القيادة": {
    category: "Drivers",
    filename: "توصيات للحد من مخاطر الجلوس لفترة طويلة أثناء القيادة",
  },
  "عادات-القيادة-الخطرة": { category: "Drivers", filename: "عادات القيادة الخطرة" },

  // Collect-Crew - Arabic slugs from DB
  "الإبلاغ-عن-الاعطال-في-مسند-القدم": { category: "Collect-Crew", filename: "الإبلاغ عن  الاعطال في مسند القدم" },
  "الركوب-بأمان-خلف-آلية-الضغط": { category: "Collect-Crew", filename: "الركوب بأمان خلف آلية الضغط (1)" },
  "السلامة-أثناء-عملية-الجمع": { category: "Collect-Crew", filename: "السلامة أثناء عملية الجمع" },
  "السلامة-خلال-التحميل-والرفع": { category: "Collect-Crew", filename: "السلامة خلال التحميل والرفع " },
  "السلوك-الواجب-تبنيه-أثناء-عملية-الجمع": { category: "Collect-Crew", filename: "السلوك الواجب تبنيه أثناء عملية الجمع" },
  "تجنب-حوادث-السير-أثناء-الجمع": { category: "Collect-Crew", filename: "تجنب حوادث السير أثناء الجمع2" },
  "تعليمات-السلامة-عند-استعمال-مسند-القدم": { category: "Collect-Crew", filename: "تعليمات السلامة عند استعمال مسند القدم" },
  "تعليمات-خلال-عملية-الجمع": { category: "Collect-Crew", filename: "تعليمات خلال عملية الجمع 2" },
  "عملية-الكبس-وكبس-الحاويات": { category: "Collect-Crew", filename: "عملية الكبس وكبس الحاويات" },
  "تجنب-الإصابة-في-اليد-او-الساعد-عند": { category: "Collect-Crew", filename: "تجنب الإصابة في اليد او الساعد عند " },
  "مخاطر-استعمال-أجهزة-الإلهاء-أو-المفقدة-للتركيز-كالهاتف-أو-سماعات-الأذن": {
    category: "Collect-Crew",
    filename: "مخاطر استعمال أجهزة الإلهاء أو المفقدة للتركيز (كالهاتف أو سماعات الأذن)  ",
  },

  // Sweepers - Arabic slugs from DB
  "أساسيات-السلامة-في-الكنس": { category: "Sweepers", filename: "أساسيات السلامة في الكنس" },
  "الحرص-على-ترتيب-معدات-الكنس": { category: "Sweepers", filename: "الحرص على ترتيب معدات الكنس" },
  "الحفاظ-على-الجسم": { category: "Sweepers", filename: "الحفاظ على الجسم +" },
  "السلامة-أثناء-عملية-الكنس---االكنس-في-المدار": { category: "Sweepers", filename: "السلامة أثناء عملية الكنس - االكنس في المدار" },
  "السلامة-أثناء-عملية-الكنس---استعمال-المخاريط-في-الشوارع-الرئيسية": {
    category: "Sweepers",
    filename: "السلامة أثناء عملية الكنس - استعمال المخاريط في الشوارع الرئيسية",
  },
  "السلامة-أثناء-عملية-الكنس": { category: "Sweepers", filename: "السلامة أثناء عملية الكنس +" },
  "الطريقة-الصحيحة-لإفراغ-العربة": { category: "Sweepers", filename: "الطريقة الصحيحة لإفراغ العربة " },
  "الكنس-مقابل-حركة-المرور": { category: "Sweepers", filename: "الكنس مقابل حركة المرور" },
  "تجنب-الاصطدام-مع-حركة-المرور-أثناء-الكنس": { category: "Sweepers", filename: "تجنب الاصطدام مع حركة المرور أثناء الكنس" },
  "حالة-الكنس-في-طقس-سيء": { category: "Sweepers", filename: "حالة الكنس في طقس سيء+" },
  "من-أجل-البقاء-آمنا-على-الطرق": { category: "Sweepers", filename: "من أجل البقاء آمنا على الطرق " },
  "موجز-تحسيسي-لتجنب-الحوادث-البليغة-في-عمليات-الكنس": {
    category: "Sweepers",
    filename: "موجز تحسيسي لتجنب الحوادث البليغة في عمليات الكنس",
  },
};

export function getCoursePdfUrl(slugOrTitle: string): string {
  if (!slugOrTitle) return "";

  const normPath = (s: string) => s.trim().replace(/\s+/g, " ");

  // Normalize for matching (Arabic-safe, tolerant of punctuation, (1), trailing numbers, etc.)
  const normMatch = (input: string) => {
    const s = (input ?? "")
      .normalize("NFC")
      // Remove tatweel
      .replace(/\u0640/g, "")
      // Unify common Arabic letter variants
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      // Normalize common "و/أو" differences (keep both as و separated word)
      .replace(/\bاو\b/g, "او")
      // Drop parenthetical suffixes like (1)
      .replace(/\([^)]*\)/g, " ")
      // Remove file extension if present
      .replace(/\.pdf$/i, "")
      // Replace separators/punctuation with spaces
      .replace(/[-_/]+/g, " ")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    // Also allow matching without trailing standalone numbers (e.g. "الجمع 2")
    return s.replace(/\s+\d+$/g, "").trim();
  };

  // Direct slug match
  const bySlug = COURSE_PDF_MAP[slugOrTitle];
  if (bySlug) {
    return `/courses/${bySlug.category}/${normPath(bySlug.filename)}.pdf`;
  }

  // Fuzzy match by slug key OR filename (tolerant of (1), "أو"/"او", trailing numbers, etc.)
  const hay = normMatch(slugOrTitle);
  const entries = Object.entries(COURSE_PDF_MAP);

  const hit = entries.find(([k, v]) => {
    const key = normMatch(k);
    const fn = normMatch(v.filename);
    return (
      key === hay ||
      fn === hay ||
      hay.includes(fn) ||
      fn.includes(hay) ||
      hay.includes(key) ||
      key.includes(hay)
    );
  });

  if (hit) {
    const [, entry] = hit;
    return `/courses/${entry.category}/${normPath(entry.filename)}.pdf`;
  }

  return "";
}
