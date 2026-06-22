import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./ar.json";
import en from "./en.json";
import fr from "./fr.json";
import { readStoredLanguage, supportedLngs, type SupportedLng } from "./languageStorage";

export { supportedLngs, type SupportedLng };

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: readStoredLanguage(),
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

export function applyDocumentDirection(lng: string): void {
  const rtl = lng === "ar";
  document.documentElement.lang = lng;
  document.documentElement.dir = rtl ? "rtl" : "ltr";
}

export default i18n;
