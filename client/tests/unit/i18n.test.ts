import { describe, it, expect } from "vitest";
import en from "@/i18n/en.json";
import fr from "@/i18n/fr.json";
import ar from "@/i18n/ar.json";
import {
  LANG_STORAGE_KEY,
  readStoredLanguage,
  writeStoredLanguage,
  supportedLngs,
} from "@/i18n/languageStorage";

function topLevelKeys(obj: Record<string, unknown>): string[] {
  return Object.keys(obj).sort();
}

describe("i18n", () => {
  it("en, fr, ar share the same top-level keys", () => {
    expect(topLevelKeys(en as Record<string, unknown>)).toEqual(
      topLevelKeys(fr as Record<string, unknown>)
    );
    expect(topLevelKeys(en as Record<string, unknown>)).toEqual(
      topLevelKeys(ar as Record<string, unknown>)
    );
  });

  it("ar locale contains RTL-specific Arabic strings", () => {
    const loginAr = (ar as { login?: { employeeId?: string } }).login?.employeeId ?? "";
    expect(loginAr.length).toBeGreaterThan(0);
    expect(/[\u0600-\u06FF]/.test(loginAr)).toBe(true);
  });

  it("languageStorage set/get round-trip", () => {
    const prev = localStorage.getItem(LANG_STORAGE_KEY);
    writeStoredLanguage("fr");
    expect(readStoredLanguage()).toBe("fr");
    if (prev) localStorage.setItem(LANG_STORAGE_KEY, prev);
    else localStorage.removeItem(LANG_STORAGE_KEY);
    expect(supportedLngs).toContain("ar");
  });
});
