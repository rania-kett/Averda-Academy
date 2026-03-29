import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./ar.json";
import en from "./en.json";
import fr from "./fr.json";

export const supportedLngs = ["ar", "fr", "en"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: "ar",
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

export function applyDocumentDirection(lng: string): void {
  const rtl = lng === "ar";
  document.documentElement.lang = lng;
  document.documentElement.dir = rtl ? "rtl" : "ltr";
}

export default i18n;
