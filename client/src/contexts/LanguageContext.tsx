import { createContext, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";

type Language = "ar" | "ma" | "fr" | "en";

const LanguageContext = createContext<{ language: Language }>({ language: "ar" });

function normalizeLanguage(raw: string): Language {
  const s = (raw || "").toLowerCase();
  if (s.startsWith("fr")) return "fr";
  if (s.startsWith("ar")) return "ar";
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const value = useMemo(() => ({ language: normalizeLanguage(i18n.language) }), [i18n.language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

