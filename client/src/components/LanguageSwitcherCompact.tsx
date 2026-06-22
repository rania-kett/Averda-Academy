import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { persistAppLanguage, resolveCurrentLng } from "@/i18n/persistLanguage";
import type { SupportedLng } from "@/i18n/i18n";

const LANGS: { code: SupportedLng; flagSrc: string; label: string }[] = [
  { code: "en", flagSrc: "/flags/gb.svg", label: "EN" },
  { code: "fr", flagSrc: "/flags/fr.svg", label: "FR" },
  { code: "ar", flagSrc: "/flags/ma.svg", label: "AR" },
];

const MENU_W = 168;

export function LanguageSwitcherCompact({
  tone = "surface",
}: {
  /** `onDark` for controls on the navy sidebar */
  tone?: "surface" | "onDark";
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const current = resolveCurrentLng(i18n.language);
  const active = LANGS.find((l) => l.code === current) ?? LANGS[2];

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    let left = rect.left;
    if (left + MENU_W > window.innerWidth - 8) left = window.innerWidth - MENU_W - 8;
    if (left < 8) left = 8;
    setMenuPos({ top: rect.bottom + 6, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const n = e.target as Node;
      if (btnRef.current?.contains(n) || menuRef.current?.contains(n)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const btnClass =
    tone === "onDark"
      ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
      : "border-[var(--admin-border)] bg-[var(--admin-btn-bg)] text-[var(--admin-btn-fg)] hover:bg-[var(--admin-hover)]";

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          role="listbox"
          aria-label={t("common.language")}
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] py-1 shadow-[var(--admin-shadow-lg)]"
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
            minWidth: MENU_W,
          }}
          dir="ltr"
        >
          {LANGS.map((l) => {
            const isActive = current === l.code;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  persistAppLanguage(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-start text-sm font-semibold transition hover:bg-[var(--admin-hover)] ${
                  isActive ? "text-[#1e3a5f] dark:text-white" : "text-[var(--admin-fg)]"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <img
                    src={l.flagSrc}
                    width="20"
                    height="14"
                    alt=""
                    className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
                    aria-hidden
                  />
                  {l.label}
                </span>
                {isActive ? <Check className="h-4 w-4 shrink-0 text-[#1e3a5f] dark:text-white" aria-hidden /> : null}
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("common.language")}
        className={`inline-flex h-9 min-w-[4.5rem] items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition ${btnClass}`}
        dir="ltr"
      >
        <img
          src={active.flagSrc}
          width="20"
          height="14"
          alt=""
          className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
          aria-hidden
        />
        <span>{active.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {menu}
    </>
  );
}
