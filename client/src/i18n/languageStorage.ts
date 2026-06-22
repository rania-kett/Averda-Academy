export const supportedLngs = ["ar", "fr", "en"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

export const LANG_STORAGE_KEY = "averda-academy-lang";

export function readStoredLanguage(): SupportedLng {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && supportedLngs.includes(stored as SupportedLng)) {
      return stored as SupportedLng;
    }
  } catch {
    /* ignore */
  }
  return "ar";
}

export function writeStoredLanguage(code: SupportedLng): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}

export function resolveCurrentLng(lng: string): SupportedLng {
  if (lng.startsWith("ar")) return "ar";
  if (lng.startsWith("fr")) return "fr";
  return "en";
}
