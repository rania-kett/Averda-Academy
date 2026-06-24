/** A4 landscape certificate — html2canvas → jsPDF. */

import type { CertificateRasterSet, RasterResult } from "@/utils/certificateTextRaster";

export type CertificateLocale = "ar" | "fr" | "en";

export type CertificateTemplateData = {
  name: string;
  role: string;
  programName?: string;
  avgScore: number;
  completionDate: string;
  /** Date printed on certificate — defaults to today when the PDF is generated. */
  issueDate?: string;
  watermarkDataUrl?: string | null;
  certificateId?: string;
  locale?: CertificateLocale;
  raster?: CertificateRasterSet;
};

export const CERT_WIDTH_PX = 1122;
export const CERT_HEIGHT_PX = 794;

const NAVY = "#0d2137";
const AVERDA_BLUE = "#28609d";
const ROYAL_BLUE = "#1b436f";
const SKY = "#4da8d8";
const SKY_DK = "#2e8fc4";
const GOLD_STAMP = "#d4af37";
const CREAM = "#F8F6F0";

/** Avoid «برنامج برنامج…» when program title already includes the word. */
function normalizeProgramForBody(program: string, locale: CertificateLocale): string {
  let p = program.trim();
  if (locale === "ar") p = p.replace(/^برنامج\s+/u, "");
  if (locale === "fr") p = p.replace(/^programme\s+/i, "");
  if (locale === "en") p = p.replace(/^(.+\s+)?program\s*$/i, (m) => m);
  return p || program.trim();
}

const COPY = {
  ar: {
    dir: "rtl" as const,
    lang: "ar",
    title1: "شهادة",
    title2: "الإكمال",
    titleFull: "شهادة الإكمال",
    departmentSubtitle: "إدارة النفايات وإعادة التدوير",
    awardedTo: "مُنِحت إلى",
    issuerLine: "من: شركة أفيردا",
    ceoTitle: "الرئيس التنفيذي",
    sealEn: "Averda Academy",
    sealAr: "خالي من الهدر",
    body: (p: { role: string; program: string; score: number }) => {
      const prog = normalizeProgramForBody(p.program, "ar");
      return `لإتمامه بنجاح برنامج «${prog}» بصفته ${p.role}، بمعدل نهائي قدره ${p.score}٪، وذلك وفق معايير السلامة والامتثال المعتمدة لدى أكاديمية أفيردا.`;
    },
    dateLabel: "في :",
    issuerLabel: "من :",
    issuerName: "شركة أفيردا",
    directorName: "شركة أفيردا",
    signatureLabel: "من :",
    scoreLabel: "النتيجة النهائية",
    academyLine: "أكاديمية أفيردا",
    tagline: "إدارة النفايات والاستدامة البيئية",
  },
  fr: {
    dir: "ltr" as const,
    lang: "fr",
    title1: "CERTIFICAT",
    title2: "DE COMPLETION",
    awardedTo: "DÉCERNÉ À",
    body: (p: { role: string; program: string; score: number }) => {
      const prog = normalizeProgramForBody(p.program, "fr");
      return `Pour avoir complété avec succès le programme « ${prog} » en tant que ${p.role}, avec un score final de ${p.score} %, conformément aux standards de sécurité et de conformité d'Averda Academy.`;
    },
    dateLabel: "LE :",
    issuerLabel: "PAR :",
    issuerName: "Entreprise Averda",
    directorName: "Entreprise Averda",
    signatureLabel: "PAR :",
    scoreLabel: "Score final",
    academyLine: "AVERDA ACADEMY",
    tagline: "Gestion des déchets & durabilité environnementale",
  },
  en: {
    dir: "ltr" as const,
    lang: "en",
    title1: "CERTIFICATE",
    title2: "OF COMPLETION",
    awardedTo: "AWARDED TO",
    body: (p: { role: string; program: string; score: number }) =>
      `For successfully completing the ${p.program} training program as a ${p.role}, with a final score of ${p.score}%, in accordance with Averda Academy safety and compliance standards.`,
    dateLabel: "DATE :",
    issuerLabel: "BY :",
    issuerName: "Entreprise Averda",
    directorName: "Entreprise Averda",
    signatureLabel: "BY :",
    scoreLabel: "Final score",
    academyLine: "AVERDA ACADEMY",
    tagline: "Waste Management & Environmental Sustainability",
  },
};

export function resolveCertificateLocale(input?: string | null): CertificateLocale {
  const raw = (input ?? "ar").toLowerCase();
  if (raw.startsWith("fr")) return "fr";
  if (raw.startsWith("en")) return "en";
  return "ar";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function certificateIssueDate(data?: { issueDate?: string }): string {
  return data?.issueDate ?? new Date().toISOString();
}

export function formatCertificateDate(iso: string, locale: CertificateLocale = "ar"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const loc = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-GB";
  return new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function buildCertificateId(name: string, completionDate: string): string {
  const d = new Date(completionDate);
  const year = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % 100000;
  return `AVD-${year}-${String(10000 + (hash % 90000)).padStart(5, "0")}`;
}

function resolveProgram(raw: string | undefined, locale: CertificateLocale): string {
  const fb = {
    ar: "برنامج السلامة والامتثال المهني",
    fr: "Programme d'intégration — Sécurité et conformité",
    en: "Driver Safety & Compliance Onboarding Program",
  };
  if (!raw?.trim()) return fb[locale];
  const sep = raw.includes(" — ") ? " — " : raw.includes(" - ") ? " - " : null;
  if (!sep) return raw.trim();
  const [a, b] = raw.split(sep).map((s) => s.trim());
  if (locale === "ar") return a || fb.ar;
  if (locale === "en") return b || a || fb.en;
  return b || a || fb.fr;
}

export const CERTIFICATE_STYLE_ELEMENT_ID = "averda-certificate-styles";

export const CERTIFICATE_CSS = `
  .cert-root, .cert-root * { box-sizing: border-box; color-scheme: light !important; }
  .cert-root {
    width: ${CERT_WIDTH_PX}px;
    height: ${CERT_HEIGHT_PX}px;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #ffffff !important;
    position: relative;
    font-family: Inter, "Segoe UI", Arial, sans-serif;
  }
  .cert-root[dir="rtl"] *:not(img):not(svg *) { letter-spacing: 0 !important; text-transform: none !important; }

  .cert-bg { position: absolute; inset: 0; background: #ffffff; z-index: 0; }

  .cert-left-bar {
    position: absolute;
    top: 0; left: 0;
    width: 16px; height: ${CERT_HEIGHT_PX}px;
    background: ${NAVY};
    z-index: 1;
  }

  .cert-border-outer {
    position: absolute;
    top: 22px; left: 32px; right: 22px; bottom: 22px;
    border: 2.5px solid ${SKY_DK};
    pointer-events: none; z-index: 3;
  }
  .cert-border-inner {
    position: absolute;
    top: 30px; left: 40px; right: 30px; bottom: 30px;
    border: 1px solid ${SKY};
    opacity: 0.55; pointer-events: none; z-index: 3;
  }

  .cert-corner {
    position: absolute; width: 32px; height: 32px;
    z-index: 2; pointer-events: none; line-height: 0;
  }
  .cert-corner svg { width: 32px; height: 32px; display: block; }
  .cert-corner-tl { top: 24px; left: 24px; }
  .cert-corner-tr { top: 24px; right: 24px; }
  .cert-corner-bl { bottom: 24px; left: 24px; }
  .cert-corner-br { bottom: 24px; right: 24px; }

  .cert-header {
    position: absolute;
    top: 28px; left: 0; right: 0;
    text-align: center; padding: 0 120px;
    z-index: 6;
  }

  .cert-line {
    width: min(400px, 65%);
    height: 1px;
    margin: 8px auto 0;
    background: linear-gradient(90deg, transparent, #c9a227 30%, #c9a227 70%, transparent);
  }

  .cert-body-area {
    position: absolute;
    top: 130px;
    left: 68px;
    right: 68px;
    bottom: 110px;
    z-index: 4;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    text-align: center;
  }

  .cert-body-watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 380px;
    max-width: 80%;
    opacity: 0.04;
    z-index: 0;
    pointer-events: none;
  }
  .cert-body-watermark img { width: 100%; height: auto; display: block; object-fit: contain; }

  .cert-body-score {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    flex-shrink: 0;
  }
  .cert-body-score p {
    margin: 0;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.10em; text-transform: uppercase;
    color: ${NAVY}; opacity: 0.65;
    text-align: center;
  }
  .cert-root[dir="rtl"] .cert-body-score p {
    font-family: "Noto Sans Arabic", sans-serif;
    letter-spacing: 0; text-transform: none; font-size: 10px;
  }

  .cert-footer {
    position: absolute;
    left: 55px; right: 55px; bottom: 28px;
    height: 72px;
    display: flex; align-items: flex-end; justify-content: space-between;
    z-index: 5;
  }
  .cert-footer-cell {
    flex: 1; text-align: center; padding: 0 16px;
  }
  .cert-footer-cell:not(:last-child) {
    border-right: 1px solid rgba(201,162,39,0.40);
  }
  .cert-footer-hr {
    width: 70%; margin: 0 auto 6px;
    border: none; border-top: 1.5px solid ${NAVY};
  }
  .cert-footer-val {
    display: block;
    font-family: "Playfair Display", Georgia, serif;
    font-size: 13px; font-weight: 600;
    color: ${NAVY}; margin-bottom: 5px;
  }
  .cert-footer-lbl {
    display: block;
    font-size: 8.5px; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: ${SKY};
  }
  .cert-root[dir="rtl"] .cert-footer-lbl {
    font-family: "Noto Sans Arabic", sans-serif;
    letter-spacing: 0; text-transform: none; font-size: 10px;
  }
  .cert-root[dir="rtl"] .cert-footer-val {
    font-family: "Amiri", "Noto Sans Arabic", serif;
    font-size: 14px;
  }

  .cert-sig-svg { display: block; margin: 0 auto 6px; width: 110px; height: 28px; }

  .cert-seal-circle {
    width: 72px; height: 72px;
    margin: 0 auto;
    border-radius: 50%;
    border: 2px dashed ${GOLD_STAMP};
    background: ${ROYAL_BLUE};
    display: table;
    text-align: center;
    box-sizing: border-box;
    padding: 8px 5px;
  }
  .cert-seal-inner {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
  }
  .cert-seal-en {
    display: block;
    font-family: Inter, Arial, sans-serif;
    font-size: 6.5pt;
    font-weight: 700;
    color: ${GOLD_STAMP};
    letter-spacing: 0.04em;
    line-height: 1.3;
    margin-bottom: 2px;
  }
  .cert-seal-ar {
    display: block;
    font-family: "Cairo", "Noto Sans Arabic", sans-serif;
    font-size: 8pt;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
  }

  .cert-id-strip {
    position: absolute;
    bottom: 0; left: 0; right: 0; height: 20px;
    background: ${NAVY};
    display: flex; align-items: center; justify-content: center;
    z-index: 8;
  }
  .cert-id-strip span {
    font-family: Inter, sans-serif;
    font-size: 7.5px; font-weight: 600;
    color: rgba(255,255,255,0.60);
    letter-spacing: 0.20em; text-transform: uppercase;
  }

  .cert-kicker {
    margin: 0 0 6px;
    font-size: 13px; font-weight: 600;
    letter-spacing: 0.42em; text-transform: uppercase;
    color: ${SKY_DK};
  }
  .cert-root[dir="rtl"] .cert-kicker {
    font-family: "Noto Sans Arabic", sans-serif;
    letter-spacing: 0; text-transform: none; font-size: 15px;
  }

  .cert-main-title {
    margin: 0;
    font-family: "Playfair Display", Georgia, serif;
    font-size: 44px; font-weight: 700;
    line-height: 1.12; color: ${SKY_DK};
    letter-spacing: 0.04em;
    max-width: 100%;
  }

  .cert-awarded-en {
    margin: 0 0 12px;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.28em; text-transform: uppercase;
    color: ${NAVY}; opacity: 0.75;
    position: relative; z-index: 1;
  }
  .cert-root[dir="rtl"] .cert-awarded-en {
    font-family: "Noto Sans Arabic", sans-serif;
    letter-spacing: 0; text-transform: none; font-size: 13px;
  }

  .cert-name-wrap {
    width: min(640px, 100%);
    margin: 0 auto 14px;
    position: relative; z-index: 1;
  }
  .cert-name-en {
    margin: 0;
    font-family: "Great Vibes", cursive;
    font-size: 56px; font-weight: 400;
    color: ${NAVY}; line-height: 1.15;
    word-break: break-word;
  }
  .cert-name-underline {
    width: 100%; height: 1.5px; margin-top: 6px;
    background: ${SKY};
  }

  .cert-text-en {
    margin: 0 auto; max-width: 100%;
    font-family: "Playfair Display", Georgia, serif;
    font-size: 12px; line-height: 1.7; color: #4a5568;
    position: relative; z-index: 1;
  }

  .cert-raster { display: block; margin-left: auto; margin-right: auto; position: relative; z-index: 1; }
  .cert-raster-title  { margin-bottom: 4px; }
  .cert-raster-awarded { margin: 0 auto 12px; }
  .cert-raster-name   { margin: 0 auto 12px; max-width: 100%; height: auto !important; width: auto !important; }
  .cert-raster-body   { margin: 0 auto; }
  .cert-raster-sm     { display: block; margin: 0 auto 4px; max-width: 100%; }

  /* ── Arabic premium (RTL) ── */
  .cert-root--ar {
    background: ${CREAM} !important;
    font-family: "Cairo", "Noto Sans Arabic", sans-serif;
  }
  .cert-root--ar .cert-bg { background: transparent; }
  .cert-root--ar .cert-border-outer { border-color: ${AVERDA_BLUE}; }
  .cert-root--ar .cert-border-inner { border-color: ${AVERDA_BLUE}; }
  .cert-root--ar .cert-main-title,
  .cert-ar-main-title {
    margin: 0;
    font-family: "Amiri", "Reem Kufi", serif;
    font-size: 34px;
    font-weight: 700;
    color: ${ROYAL_BLUE};
    line-height: 1.2;
  }
  .cert-ar-awarded {
    display: block;
    width: 100%;
    text-align: center;
    margin: 0 0 12px;
    font-family: "Cairo", sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #9ca3af;
    position: relative; z-index: 1;
  }
  .cert-ar-name-wrap {
    width: 100%;
    text-align: center;
    display: block;
    margin: 0 auto 14px;
    position: relative; z-index: 1;
  }
  .cert-root--ar .cert-raster-name {
    width: auto !important;
    max-width: 100%;
    height: auto !important;
    margin: 0 auto !important;
  }
  .cert-ar-name {
    margin: 0 auto;
    font-family: "Amiri", serif;
    font-size: 52px;
    font-weight: 700;
    color: ${AVERDA_BLUE};
    line-height: 1.2;
    word-break: break-word;
    text-align: center;
    display: block;
    text-shadow: 0 1px 0 rgba(255,255,255,0.95);
  }
  .cert-ar-text {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    font-family: "Cairo", sans-serif;
    font-size: 13px;
    line-height: 1.8;
    color: #3d4a5c;
    position: relative; z-index: 1;
  }
`.trim();

export function injectCertificateStyles(): void {
  let el = document.getElementById(CERTIFICATE_STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = CERTIFICATE_STYLE_ELEMENT_ID;
    document.head.appendChild(el);
  }
  el.textContent = CERTIFICATE_CSS;
}

/** Universal recycling symbol — 32×32, rotation baked into SVG for crisp print. */
function recyclingCornerSvg(rotateDeg: number): string {
  return `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g transform="rotate(${rotateDeg} 16 16)" fill="none" stroke="${AVERDA_BLUE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 4 A12 12 0 0 1 26.5 14"/>
    <polyline points="26.5,10.5 26.5,14 23,14"/>
    <path d="M28 17 A12 12 0 0 1 17.5 27.5"/>
    <polyline points="21,27.5 17.5,27.5 17.5,24"/>
    <path d="M14 28 A12 12 0 0 1 4 16"/>
    <polyline points="4,19.5 4,16 7.5,16"/>
  </g>
</svg>`;
}

function averdaLetterWatermarkSvg(): string {
  return `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M100,12 L52,218 L72,218 L84,158 L116,158 L128,218 L148,218 Z M92,128 L100,72 L108,128 Z" fill="${AVERDA_BLUE}" opacity="0.9"/>
  <path d="M128,218 Q148,218 148,238 Q148,252 128,254" fill="none" stroke="${AVERDA_BLUE}" stroke-width="10" stroke-linecap="round" opacity="0.9"/>
</svg>`;
}

function arabicSealHtml(sealEn: string, sealAr: string): string {
  return `<div class="cert-seal-circle"><div class="cert-seal-inner">
    <span class="cert-seal-en">${esc(sealEn)}</span>
    <span class="cert-seal-ar">${esc(sealAr)}</span>
  </div></div>`;
}

function ceoSignatureSvg(): string {
  return `<svg class="cert-sig-svg" width="120" height="32" viewBox="0 0 120 32" aria-hidden="true">
    <path d="M6,22 C20,10 30,28 48,18 C62,8 78,26 92,16 C102,10 112,20 116,15"
      fill="none" stroke="${NAVY}" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
  </svg>`;
}

function signatureSvg(): string {
  return ceoSignatureSvg();
}

function scoreRingSvg(score: number, locale: CertificateLocale): string {
  const R = 40;
  const circ = 2 * Math.PI * R;
  const dash = (score / 100) * circ;
  const gap = circ - dash;
  const sub = locale === "ar" ? "" : "SCORE";
  return `<svg viewBox="0 0 100 100" width="110" height="110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0d2137"/>
        <stop offset="100%" stop-color="#4da8d8"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="${R}" fill="none" stroke="#dde3ea" stroke-width="9"/>
    <circle cx="50" cy="50" r="${R}" fill="none"
      stroke="url(#rg)" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
      transform="rotate(-90 50 50)"/>
    <text x="50" y="46" text-anchor="middle"
      font-family="Inter, sans-serif" font-size="18" font-weight="800" fill="#0d2137">${score}%</text>
    <text x="50" y="62" text-anchor="middle"
      font-family="Inter, sans-serif" font-size="8" font-weight="600" fill="#666">${sub}</text>
  </svg>`;
}

function laurelSvg(): string {
  return `<svg width="200" height="20" viewBox="0 0 200 20" style="display:block;margin:4px auto 0" aria-hidden="true">
    <path d="M5,10 Q15,4 25,10 Q35,4 45,10 Q55,4 65,10 Q75,4 85,10"
      fill="none" stroke="#c9a227" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
    <polygon points="100,4 104,10 100,16 96,10" fill="#c9a227" opacity="0.9"/>
    <path d="M195,10 Q185,4 175,10 Q165,4 155,10 Q145,4 135,10 Q125,4 115,10"
      fill="none" stroke="#c9a227" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
  </svg>`;
}

function sealSvg(sealEn: string, sealAr: string): string {
  return arabicSealHtml(sealEn, sealAr);
}

function westernSealHtml(academyLine: string): string {
  return `<div class="cert-seal-circle"><div class="cert-seal-inner">
    <span class="cert-seal-en">${esc(academyLine)}</span>
  </div></div>`;
}

function bodyWatermarkHtml(dataUrl: string | null | undefined, ar = false): string {
  if (dataUrl) {
    return `<div class="cert-body-watermark"><img src="${dataUrl}" alt="" /></div>`;
  }
  if (ar) {
    return `<div class="cert-body-watermark">${averdaLetterWatermarkSvg()}</div>`;
  }
  return "";
}

function rasterImg(r: RasterResult | undefined, cls: string, alt: string): string {
  if (!r?.src || r.w < 1) return "";
  return `<img class="cert-raster ${cls}" src="${r.src}" width="${r.w}" height="${r.h}" alt="${esc(alt)}" />`;
}

function buildArabicCertificateHtml(data: CertificateTemplateData): string {
  const copy = COPY.ar;
  const r = data.raster;
  const program = resolveProgram(data.programName, "ar");
  const score = Math.round(data.avgScore);
  const body = copy.body({ role: data.role, program, score });
  const issueIso = certificateIssueDate(data);
  const dateStr = formatCertificateDate(issueIso, "ar");
  const certId = esc(data.certificateId ?? buildCertificateId(data.name, issueIso));
  const certIdLine = `Document Officiel · Averda Academy · ${certId} · averda.com`;

  const titleBlock =
    rasterImg(r?.title, "cert-raster-title", copy.titleFull) ||
    `<h1 class="cert-ar-main-title">${esc(copy.titleFull)}</h1>`;

  const awardedBlock =
    rasterImg(r?.awarded, "cert-raster-awarded", copy.awardedTo) ||
    `<p class="cert-ar-awarded">${esc(copy.awardedTo)}</p>`;

  const nameInner =
    rasterImg(r?.name, "cert-raster-name", data.name) ||
    `<p class="cert-ar-name">${esc(data.name)}</p>`;

  const nameBlock = `<div class="cert-ar-name-wrap">${nameInner}</div>`;

  const bodyBlock =
    rasterImg(r?.body, "cert-raster-body", body) ||
    `<p class="cert-ar-text">${esc(body)}</p>`;

  const dirVal =
    rasterImg(r?.signatureLabel, "cert-raster-sm", copy.ceoTitle) ||
    `<span class="cert-footer-val">${esc(copy.ceoTitle)}</span>`;

  const sigLbl = `<span class="cert-footer-lbl">${esc(copy.signatureLabel)}</span>`;

  const dateVal =
    rasterImg(r?.date, "cert-raster-sm", dateStr) ||
    `<span class="cert-footer-val">${esc(dateStr)}</span>`;

  const dateLbl =
    rasterImg(r?.dateLabel, "cert-raster-sm", copy.dateLabel) ||
    `<span class="cert-footer-lbl">${esc(copy.dateLabel)}</span>`;

  const scoreLbl =
    rasterImg(r?.scoreLabel, "cert-raster-sm", copy.scoreLabel) ||
    `<p>${esc(copy.scoreLabel)}</p>`;

  const scoreBlock = `<div class="cert-body-score">${scoreRingSvg(score, "ar")}${scoreLbl}</div>`;

  return `<article class="cert-root cert-root--ar" lang="ar" dir="rtl">
  <div class="cert-bg"></div>
  <div class="cert-left-bar"></div>
  <div class="cert-border-outer"></div>
  <div class="cert-border-inner"></div>
  <div class="cert-corner cert-corner-tl">${recyclingCornerSvg(0)}</div>
  <div class="cert-corner cert-corner-tr">${recyclingCornerSvg(90)}</div>
  <div class="cert-corner cert-corner-bl">${recyclingCornerSvg(270)}</div>
  <div class="cert-corner cert-corner-br">${recyclingCornerSvg(180)}</div>

  <header class="cert-header">
    ${titleBlock}
    ${laurelSvg()}
    <div class="cert-line"></div>
  </header>

  <div class="cert-body-area">
    ${bodyWatermarkHtml(data.watermarkDataUrl, true)}
    ${awardedBlock}
    ${nameBlock}
    ${scoreBlock}
    ${bodyBlock}
  </div>

  <footer class="cert-footer">
    <div class="cert-footer-cell">
      ${dirVal}
      <hr class="cert-footer-hr"/>
      ${sigLbl}
    </div>
    <div class="cert-footer-cell">
      ${sealSvg(copy.sealEn, copy.sealAr)}
    </div>
    <div class="cert-footer-cell">
      ${dateVal}
      <hr class="cert-footer-hr"/>
      ${dateLbl}
    </div>
  </footer>

  <div class="cert-id-strip"><span>${certIdLine}</span></div>
</article>`;
}

function buildWesternCertificateHtml(data: CertificateTemplateData): string {
  const locale = resolveCertificateLocale(data.locale);
  const copy = COPY[locale];
  const program = resolveProgram(data.programName, locale);
  const score = Math.round(data.avgScore);
  const body = copy.body({ role: data.role, program, score });
  const issueIso = certificateIssueDate(data);
  const dateStr = formatCertificateDate(issueIso, locale);
  const certId = esc(data.certificateId ?? buildCertificateId(data.name, issueIso));
  const certIdLine = `Document Officiel · Averda Academy · ${certId} · averda.com`;

  const titleBlock = `<p class="cert-kicker">${esc(copy.title1)}</p><h1 class="cert-main-title">${esc(copy.title2)}</h1>`;
  const awardedBlock = `<p class="cert-awarded-en">${esc(copy.awardedTo)}</p>`;
  const nameBlock = `<div class="cert-name-wrap"><p class="cert-name-en">${esc(data.name)}</p><div class="cert-name-underline"></div></div>`;
  const bodyBlock = `<p class="cert-text-en">${esc(body)}</p>`;
  const scoreBlock = `<div class="cert-body-score">${scoreRingSvg(score, locale)}<p>${esc(copy.scoreLabel)}</p></div>`;

  return `<article class="cert-root" lang="${copy.lang}" dir="${copy.dir}">
  <div class="cert-bg"></div>
  <div class="cert-left-bar"></div>
  <div class="cert-border-outer"></div>
  <div class="cert-border-inner"></div>

  <header class="cert-header">
    ${titleBlock}
    ${laurelSvg()}
    <div class="cert-line"></div>
  </header>

  <div class="cert-body-area">
    ${bodyWatermarkHtml(data.watermarkDataUrl)}
    ${awardedBlock}
    ${nameBlock}
    ${scoreBlock}
    ${bodyBlock}
  </div>

  <footer class="cert-footer">
    <div class="cert-footer-cell">
      ${signatureSvg()}
      <span class="cert-footer-val">${esc(copy.directorName)}</span>
      <hr class="cert-footer-hr"/>
      <span class="cert-footer-lbl">${esc(copy.signatureLabel)}</span>
    </div>
    <div class="cert-footer-cell">
      ${westernSealHtml(copy.academyLine)}
    </div>
    <div class="cert-footer-cell">
      <span class="cert-footer-val">${esc(dateStr)}</span>
      <hr class="cert-footer-hr"/>
      <span class="cert-footer-lbl">${esc(copy.dateLabel)}</span>
    </div>
  </footer>

  <div class="cert-id-strip"><span>${certIdLine}</span></div>
</article>`;
}

export function buildCertificateHtml(data: CertificateTemplateData): string {
  const locale = resolveCertificateLocale(data.locale);
  if (locale === "ar") return buildArabicCertificateHtml(data);
  return buildWesternCertificateHtml(data);
}

export function getCertificateCopyForRaster(data: CertificateTemplateData) {
  const locale = resolveCertificateLocale(data.locale);
  const copy = COPY[locale];
  const program = resolveProgram(data.programName, locale);
  const score = Math.round(data.avgScore);
  const issueIso = certificateIssueDate(data);
  const ar = locale === "ar" ? COPY.ar : null;
  return {
    title: ar ? ar.titleFull : `${copy.title1} ${copy.title2}`,
    awarded: copy.awardedTo,
    name: data.name,
    body: copy.body({ role: data.role, program, score }),
    date: formatCertificateDate(issueIso, locale),
    dateLabel: copy.dateLabel,
    director: ar ? ar.issuerLine : copy.issuerName,
    signatureLabel: ar ? ar.ceoTitle : copy.issuerLabel,
    scoreLabel: copy.scoreLabel,
  };
}
