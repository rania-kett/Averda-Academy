import i18n, { applyDocumentDirection, type SupportedLng } from "./i18n";
import { writeStoredLanguage } from "./languageStorage";

export { LANG_STORAGE_KEY, readStoredLanguage, resolveCurrentLng } from "./languageStorage";

/** Persist UI language for the whole app (employee + admin). */
export function persistAppLanguage(code: SupportedLng): void {
  void i18n.changeLanguage(code);
  applyDocumentDirection(code);
  writeStoredLanguage(code);
}
