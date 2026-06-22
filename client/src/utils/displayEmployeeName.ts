export type DisplayLang = "ar" | "fr" | "en";

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

/** Full-name overrides (French-style spelling used in Morocco). */
const FULL_NAME_MAP: Record<string, string> = {
  "يوسف العلوي": "Youssef Alaoui",
  "كريم بنعلي": "Karim Benali",
  "أمين الراشدي": "Amine Rachidi",
  "سعيد المنصوري": "Said Mansouri",
  "هشام التازي": "Hicham Tazi",
  "محمد العلاوي": "Mohammed Allaoui",
};

/** Common given names / family particles. */
const WORD_MAP: Record<string, string> = {
  يوسف: "Youssef",
  محمد: "Mohamed",
  كريم: "Karim",
  أمين: "Amine",
  سعيد: "Said",
  هشام: "Hicham",
  العلوي: "Alaoui",
  العلاوي: "Allaoui",
  بنعلي: "Benali",
  الراشدي: "Rachidi",
  المنصوري: "Mansouri",
  التازي: "Tazi",
  فاطمة: "Fatima",
  مريم: "Mariam",
  أحمد: "Ahmed",
  علي: "Ali",
  حسن: "Hassan",
  رشيد: "Rachid",
};

/** Latin spellings → Arabic (includes common variants). */
const LATIN_TO_AR: Record<string, string> = {
  youssef: "يوسف",
  mohammed: "محمد",
  mohamed: "محمد",
  mohammad: "محمد",
  karim: "كريم",
  amine: "أمين",
  said: "سعيد",
  saïd: "سعيد",
  hicham: "هشام",
  alaoui: "العلوي",
  allaoui: "العلاوي",
  benali: "بنعلي",
  rachidi: "الراشدي",
  mansouri: "المنصوري",
  tazi: "التازي",
  fatima: "فاطمة",
  mariam: "مريم",
  ahmed: "أحمد",
  ali: "علي",
  hassan: "حسن",
  rachid: "رشيد",
};

const REVERSE_FULL_NAME_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(FULL_NAME_MAP).map(([ar, latin]) => [latin.toLowerCase(), ar])
);

const CHAR_MAP: Record<string, string> = {
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "a",
  ئ: "i",
  ؤ: "ou",
  ء: "",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "ch",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "ou",
  ي: "i",
  ى: "i",
  ة: "a",
  ﻻ: "la",
  پ: "p",
  چ: "ch",
  ژ: "j",
  گ: "g",
  ڤ: "v",
};

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function transliterateChars(word: string, atWordStart: boolean): string {
  const chars = [...word.normalize("NFC")];
  let out = "";

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === " ") {
      out += " ";
      continue;
    }
    if (ch === "ّ") continue;

    if (ch === "ي" && atWordStart && i === 0) {
      out += "Y";
      continue;
    }

    out += CHAR_MAP[ch] ?? ch;
  }

  return out;
}

function transliterateWord(word: string): string {
  const normalized = word.normalize("NFC").trim();
  if (!normalized) return "";

  const mapped = WORD_MAP[normalized];
  if (mapped) return mapped;

  if (normalized.startsWith("ال") && normalized.length > 2) {
    const rest = transliterateWord(normalized.slice(2));
    return rest ? `Al${rest}` : transliterateChars(normalized, true);
  }

  if (normalized.startsWith("بن") && normalized.length > 2) {
    const rest = transliterateWord(normalized.slice(2));
    return rest ? `Ben${rest}` : transliterateChars(normalized, true);
  }

  const roman = transliterateChars(normalized, true);
  return capitalizeWord(roman);
}

function transliterateArabicName(name: string): string {
  const trimmed = name.normalize("NFC").trim();
  const full = FULL_NAME_MAP[trimmed];
  if (full) return full;

  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => transliterateWord(w))
    .join(" ");
}

function normalizeLatinToken(word: string): string {
  return word
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-zàâäéèêëïîôùûüç-]/gi, "");
}

function arabizeLatinWord(word: string): string | null {
  const lower = normalizeLatinToken(word);
  if (!lower) return null;

  const direct = LATIN_TO_AR[lower];
  if (direct) return direct;

  if (lower.startsWith("al") && lower.length > 2) {
    const rest = arabizeLatinWord(lower.slice(2));
    return rest ? `ال${rest}` : null;
  }
  if (lower.startsWith("el") && lower.length > 2) {
    const rest = arabizeLatinWord(lower.slice(2));
    return rest ? `ال${rest}` : null;
  }
  if (lower.startsWith("ben") && lower.length > 3) {
    const rest = arabizeLatinWord(lower.slice(3));
    return rest ? `بن${rest}` : null;
  }

  return null;
}

function arabizeLatinName(name: string): string {
  const trimmed = name.normalize("NFC").trim();
  const full = REVERSE_FULL_NAME_MAP[trimmed.toLowerCase()];
  if (full) return full;

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const arParts = parts.map((w) => arabizeLatinWord(w) ?? w);
  const anyConverted = arParts.some((p, i) => p !== parts[i]);
  return anyConverted ? arParts.join(" ") : trimmed;
}

/**
 * Arabic UI → Arabic script (transliterate Latin names when needed).
 * English/French UI → Latin transliteration for Arabic-script names.
 */
export function displayEmployeeName(name: string, lang: DisplayLang): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "—";
  const hasArabic = ARABIC_RE.test(trimmed);

  if (lang === "ar") {
    return hasArabic ? trimmed : arabizeLatinName(trimmed);
  }

  if (!hasArabic) return trimmed;
  return transliterateArabicName(trimmed) || trimmed;
}
