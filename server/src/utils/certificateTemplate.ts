/**
 * Averda certificate HTML template — Puppeteer PDF rendering.
 * Visual design mirrors client/src/utils/certificateTemplate.ts.
 */

export type CertificateLocale = "ar" | "fr" | "en";

export type ServerCertificateInput = {
  recipientName: string;
  role: string;
  programName: string;
  score: number;
  language: "AR" | "FR" | "EN";
  completionDate?: Date;
  logoBase64?: string;
  certificateId?: string;
};

const CERT_WIDTH_PX = 1122;
const CERT_HEIGHT_PX = 794;

const NAVY = "#0d2137";
const SKY = "#4da8d8";
const GOLD = "#c9a227";
const AVBLUE = "#4da8d8";
const AVBLUE_DK = "#2e8fc4";
const AVBLUE_LT = "#7ec4e8";
const CREAM = "#FAFAF5";
const GOLD2 = "#e8c96a";
const GOLD3 = "#f0d878";
const NAVY2 = "#1a3a5c";

function normalizeProgramForBody(program: string, locale: CertificateLocale): string {
  let p = program.trim();
  if (locale === "ar") p = p.replace(/^برنامج\s+/u, "");
  if (locale === "fr") p = p.replace(/^programme\s+/i, "");
  return p || program.trim();
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;700;800&family=Noto+Sans+Arabic:wght@400;600;700&family=Playfair+Display:wght@400&display=swap";

const COPY = {
  ar: {
    dir: "rtl" as const,
    lang: "ar",
    title1: "شهادة",
    title2: "الإنجاز",
    awardedTo: "تُمنح هذه الشهادة إلى",
    body: (p: { role: string; program: string; score: number }) => {
      const prog = normalizeProgramForBody(p.program, "ar");
      return `لإتمامه بنجاح برنامج «${prog}» بصفته ${p.role}، بمعدل نهائي قدره ${p.score}٪، وذلك وفق معايير السلامة والامتثال المعتمدة لدى أكاديمية أفيردا.`;
    },
    dateLabel: "التاريخ",
    signatureLabel: "التوقيع",
    directorName: "مدير الأكاديمية",
    scoreLabel: "النتيجة النهائية",
    academyLine: "أكاديمية أفيردا",
    tagline: "إدارة النفايات والاستدامة البيئية",
  },
  fr: {
    dir: "ltr" as const,
    lang: "fr",
    title1: "CERTIFICAT",
    title2: "DE RÉUSSITE",
    awardedTo: "CE CERTIFICAT EST DÉCERNÉ À",
    body: (p: { role: string; program: string; score: number }) => {
      const prog = normalizeProgramForBody(p.program, "fr");
      return `Pour avoir complété avec succès le programme « ${prog} » en tant que ${p.role}, avec un score final de ${p.score} %, conformément aux standards de sécurité et de conformité d'Averda Academy.`;
    },
    dateLabel: "Date",
    signatureLabel: "Signature",
    directorName: "Directeur de l'Académie",
    scoreLabel: "Score final",
    academyLine: "AVERDA ACADEMY",
    tagline: "Gestion des déchets & durabilité environnementale",
  },
  en: {
    dir: "ltr" as const,
    lang: "en",
    title1: "CERTIFICATE",
    title2: "OF ACHIEVEMENT",
    awardedTo: "THIS CERTIFICATE IS AWARDED TO",
    body: (p: { role: string; program: string; score: number }) =>
      `For successfully completing the ${p.program} training program as a ${p.role}, with a final score of ${p.score}%, in accordance with Averda Academy safety and compliance standards.`,
    dateLabel: "Date",
    signatureLabel: "Signature",
    directorName: "Academy Director",
    scoreLabel: "Final score",
    academyLine: "AVERDA ACADEMY",
    tagline: "Waste Management & Environmental Sustainability",
  },
};

function langToLocale(lang: ServerCertificateInput["language"]): CertificateLocale {
  if (lang === "FR") return "fr";
  if (lang === "EN") return "en";
  return "ar";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildCertificateId(name: string, issueIso: string): string {
  const d = new Date(issueIso);
  const year = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % 100000;
  return `AVD-${year}-${String(10000 + (hash % 90000)).padStart(5, "0")}`;
}

function formatCertificateDate(iso: string, locale: CertificateLocale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const loc = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-GB";
  return new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric" }).format(d);
}

const CERTIFICATE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${CERT_WIDTH_PX}px; height: ${CERT_HEIGHT_PX}px; overflow: hidden; background: ${CREAM}; }
  .cert-root, .cert-root * { box-sizing: border-box; color-scheme: light !important; }
  .cert-root {
    width: ${CERT_WIDTH_PX}px; height: ${CERT_HEIGHT_PX}px; margin: 0; padding: 0;
    overflow: hidden; background: ${CREAM} !important; position: relative;
    font-family: Inter, "Segoe UI", Arial, sans-serif;
  }
  .cert-root[dir="rtl"] *:not(img):not(svg *) { letter-spacing: 0 !important; text-transform: none !important; }
  .cert-bg {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(180deg, #ffffff 0%, ${CREAM} 55%, #f5f3ee 100%); z-index: 0;
  }
  .cert-logo-watermark {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 1020px; height: 1180px; pointer-events: none; z-index: 1;
  }
  .cert-logo-watermark svg { width: 100%; height: 100%; display: block; }
  .cert-corner-deco { position: absolute; width: 160px; height: 160px; pointer-events: none; z-index: 3; opacity: 0.92; }
  .cert-corner-deco svg { width: 100%; height: 100%; display: block; }
  .cert-corner-deco-tl { top: 18px; left: 18px; }
  .cert-corner-deco-br { bottom: 18px; right: 18px; transform: rotate(180deg); }
  .cert-frame {
    position: absolute; top: 26px; left: 26px; right: 26px; bottom: 26px;
    border: 1px solid ${GOLD};
    box-shadow: inset 0 0 0 5px ${CREAM}, inset 0 0 0 6px ${GOLD};
    border-radius: 3px; pointer-events: none; z-index: 2;
  }
  .cert-header {
    position: absolute; top: 48px; left: 0; right: 0; z-index: 6;
    text-align: center; padding: 0 120px;
  }
  .cert-logo {
    height: 100px; width: auto; max-width: 340px;
    display: block; margin: 0 auto; object-fit: contain;
    filter: drop-shadow(0 2px 8px rgba(13,33,55,0.08));
  }
  .cert-tagline {
    margin: 6px 0 0; font-size: 9px; font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase; color: ${SKY}; opacity: 0.85;
  }
  .cert-root[dir="rtl"] .cert-tagline {
    font-family: "Noto Sans Arabic", sans-serif; letter-spacing: 0; text-transform: none; font-size: 10px;
  }
  .cert-body-area {
    position: absolute; top: 168px; left: 100px; right: 100px; bottom: 118px;
    text-align: center; z-index: 5;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .cert-title-en {
    margin: 0; font-size: 46px; font-weight: 800; letter-spacing: 0.12em; color: ${AVBLUE_DK}; line-height: 1;
  }
  .cert-subtitle-en {
    margin: 6px 0 0; font-size: 15px; font-weight: 700; letter-spacing: 0.34em; color: #333; line-height: 1.2;
  }
  .cert-academy-line {
    margin: 4px 0 0; font-size: 10px; font-weight: 700;
    letter-spacing: 0.26em; text-transform: uppercase; color: ${AVBLUE}; opacity: 0.65;
  }
  .cert-root[dir="rtl"] .cert-academy-line {
    font-family: "Noto Sans Arabic", sans-serif; letter-spacing: 0; text-transform: none; font-size: 11px;
  }
  .cert-line {
    width: 220px; height: 1px; margin: 14px auto 12px;
    background: linear-gradient(90deg, transparent, ${GOLD}, transparent);
  }
  .cert-awarded-en {
    margin: 0 0 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #555;
  }
  .cert-name-hero {
    position: relative; width: 100%; margin: 6px 0 0; padding: 10px 16px 2px;
  }
  .cert-name-hero::before {
    content: ""; position: absolute; left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    width: min(720px, 95%); height: 120px;
    background: radial-gradient(ellipse 70% 80% at 50% 50%, rgba(77,168,216,0.14), transparent 72%);
    pointer-events: none; z-index: 0;
  }
  .cert-name-hero > * { position: relative; z-index: 1; }
  .cert-name-en {
    margin: 0; font-family: Inter, "Segoe UI", Arial, sans-serif;
    font-size: 100px; font-weight: 800; color: ${AVBLUE}; line-height: 1.02;
    letter-spacing: -0.03em; max-width: 100%; word-break: break-word;
    text-shadow: 0 2px 0 rgba(255,255,255,0.9), 0 6px 28px rgba(77,168,216,0.45), 0 1px 3px rgba(46,143,196,0.35);
  }
  .cert-name-rule {
    width: min(480px, 90%); height: 3px;
    background: linear-gradient(90deg, transparent, ${AVBLUE}, ${GOLD}, ${AVBLUE}, transparent);
    margin: 12px auto 12px; opacity: 0.55; border-radius: 2px;
  }
  .cert-text-en {
    margin: 0 auto; max-width: 560px;
    font-family: "Playfair Display", Georgia, serif;
    font-size: 13px; line-height: 1.8; color: #3a3a3a;
  }
  .cert-medal-wrap {
    margin-top: 12px; display: flex; flex-direction: column; align-items: center; gap: 6px;
    filter: drop-shadow(0 10px 18px rgba(0,0,0,0.14));
  }
  .cert-medal-wrap svg { display: block; width: 124px; height: auto; }
  .cert-medal-lbl {
    font-size: 8px; font-weight: 700; color: ${AVBLUE};
    letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.8;
  }
  .cert-root[dir="rtl"] .cert-medal-lbl {
    font-family: "Noto Sans Arabic", sans-serif; letter-spacing: 0; text-transform: none; font-size: 9px;
  }
  .cert-footer { position: absolute; left: 100px; right: 100px; bottom: 44px; z-index: 6; }
  .cert-footer-row { display: flex; align-items: flex-end; justify-content: space-between; }
  .cert-footer-cell {
    flex: 1; text-align: center; padding: 0 16px; min-height: 72px;
    display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  }
  .cert-footer-cell + .cert-footer-cell { border-left: 1px solid rgba(201, 162, 39, 0.35); }
  .cert-footer-val {
    display: block; font-family: "Playfair Display", Georgia, serif;
    font-size: 12px; color: #111; margin-bottom: 5px; min-height: 16px;
  }
  .cert-footer-hr { width: 100px; margin: 0 auto 5px; border: none; border-top: 1.5px solid #333; }
  .cert-footer-lbl {
    font-size: 8px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${SKY};
  }
  .cert-root[dir="rtl"] .cert-footer-lbl {
    font-family: "Noto Sans Arabic", sans-serif; letter-spacing: 0; text-transform: none; font-size: 9px;
  }
  .cert-signature-svg { display: block; margin: 0 auto 2px; }
  .cert-seal { width: 76px; height: 76px; display: block; margin: 0 auto 2px; }
  .cert-id-strip {
    position: absolute; bottom: 0; left: 0; right: 0; height: 20px;
    background: linear-gradient(90deg, ${AVBLUE_DK}, ${AVBLUE});
    display: flex; align-items: center; justify-content: center; z-index: 7;
  }
  .cert-id-strip span {
    font-family: Inter, "Segoe UI", sans-serif; font-size: 7.5px; font-weight: 600;
    color: rgba(255,255,255,0.72); letter-spacing: 0.18em; text-transform: uppercase;
  }
`.trim();

function averdaAWatermarkSvg(): string {
  const fill = AVBLUE_LT;
  const fill2 = AVBLUE;
  return `<svg viewBox="0 0 100 115" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g opacity="0.22">
    <path d="M50,4 L26,98 L38,98 L44,72 L56,72 L62,98 L74,98 Z M46,58 L50,36 L54,58 Z" fill="${fill}"/>
    <path d="M62,98 Q74,98 74,108 Q74,114 62,114" fill="none" stroke="${fill2}" stroke-width="5" stroke-linecap="round"/>
  </g>
  <g opacity="0.09">
    <path d="M50,4 L26,98 L38,98 L44,72 L56,72 L62,98 L74,98 Z M46,58 L50,36 L54,58 Z" fill="${fill2}" transform="translate(2,3) scale(1.06)"/>
  </g>
</svg>`;
}

function cornerDecoSvg(uid: string): string {
  return `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="cw-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${AVBLUE}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${AVBLUE}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path fill="url(#cw-${uid})" d="M0,0 L0,140 Q50,90 140,0 Z"/>
  <path fill="none" stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round" d="M18,18 L18,62 M18,18 L62,18"/>
  <path fill="none" stroke="${GOLD2}" stroke-width="1" opacity="0.65" stroke-linecap="round" d="M26,26 L26,52 M26,26 L52,26"/>
  <g transform="translate(34,34) scale(1.1)" opacity="0.55" stroke="${AVBLUE_DK}" fill="none" stroke-width="2.2" stroke-linecap="round">
    <path d="M12,6 A14,14 0 0,1 26,20"/>
    <polygon points="24,14 28,22 20,20" fill="${AVBLUE}" stroke="none"/>
    <path d="M26,20 A14,14 0 0,1 6,30"/>
    <polygon points="6,28 14,34 10,24" fill="${AVBLUE}" stroke="none"/>
    <path d="M6,30 A14,14 0 0,1 12,6"/>
    <polygon points="10,4 20,4 16,16" fill="${AVBLUE}" stroke="none"/>
  </g>
</svg>`;
}

function sealSvg(): string {
  return `<svg class="cert-seal" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="sg2" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${AVBLUE_LT}"/>
      <stop offset="100%" stop-color="${AVBLUE_DK}"/>
    </radialGradient>
    <path id="textArc" d="M 8,48 A 40,40 0 1,1 88,48"/>
  </defs>
  <circle cx="48" cy="48" r="46" fill="none" stroke="${GOLD}" stroke-width="1.5" stroke-dasharray="3 2"/>
  <circle cx="48" cy="48" r="38" fill="url(#sg2)"/>
  <path d="M48,18 L34,58 L40,58 L44,47 L52,47 L56,58 L62,58 Z M45.5,42 L48,34 L50.5,42 Z" fill="${GOLD}"/>
  <path d="M56,58 Q62,58 62,64 Q62,70 56,70" fill="none" stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round"/>
  <text font-family="Inter, sans-serif" font-size="7" font-weight="700" fill="${GOLD2}" letter-spacing="1.5">
    <textPath href="#textArc" startOffset="8%">AVERDA ACADEMY</textPath>
  </text>
</svg>`;
}

function medalSvg(score: number): string {
  const fs = score >= 100 ? 20 : score >= 10 ? 24 : 26;
  const uid = `m${score}`;
  return `<svg viewBox="0 0 124 156" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="gold-${uid}" cx="36%" cy="28%" r="72%">
      <stop offset="0%" stop-color="#fffef0"/>
      <stop offset="18%" stop-color="#ffe97a"/>
      <stop offset="45%" stop-color="#ffc833"/>
      <stop offset="72%" stop-color="#e8a820"/>
      <stop offset="100%" stop-color="#b87a14"/>
    </radialGradient>
    <linearGradient id="ribL-${uid}" x1="0%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="${AVBLUE_LT}"/>
      <stop offset="100%" stop-color="${AVBLUE_DK}"/>
    </linearGradient>
    <linearGradient id="ribR-${uid}" x1="100%" y1="0%" x2="20%" y2="100%">
      <stop offset="0%" stop-color="#6ec8ef"/>
      <stop offset="100%" stop-color="${AVBLUE_DK}"/>
    </linearGradient>
    <linearGradient id="rim-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff4c4"/>
      <stop offset="50%" stop-color="#d4a017"/>
      <stop offset="100%" stop-color="#fff8dc"/>
    </linearGradient>
  </defs>
  <ellipse cx="62" cy="148" rx="40" ry="7" fill="#000" opacity="0.14"/>
  <path fill="#1a5f85" opacity="0.22" d="M30,84 L16,150 L50,150 L54,84 Z"/>
  <path fill="#1a5f85" opacity="0.22" d="M94,84 L108,150 L74,150 L70,84 Z"/>
  <path fill="url(#ribL-${uid})" d="M32,82 L18,150 L50,150 L54,82 Z"/>
  <path fill="url(#ribR-${uid})" d="M92,82 L106,150 L74,150 L70,82 Z"/>
  <path fill="${AVBLUE_DK}" opacity="0.45" d="M52,82 L56,82 L54,150 L50,150 Z"/>
  <path fill="none" stroke="#fff" stroke-width="1" opacity="0.25" d="M36,90 L22,142 M88,90 L102,142"/>
  <circle cx="62" cy="54" r="50" fill="#8b6914" opacity="0.2" transform="translate(0,3)"/>
  <circle cx="62" cy="52" r="50" fill="url(#gold-${uid})" stroke="url(#rim-${uid})" stroke-width="3"/>
  <circle cx="62" cy="52" r="42" fill="none" stroke="#fff8dc" stroke-width="1.5" opacity="0.55"/>
  <ellipse cx="50" cy="38" rx="20" ry="14" fill="#ffffff" opacity="0.38"/>
  <path fill="none" stroke="#c9941a" stroke-width="2" opacity="0.35"
    d="M40,52 C40,38 50,26 62,26 C74,26 84,38 84,52 C84,66 74,78 62,78 C50,78 40,66 40,52Z"
    stroke-dasharray="2 4"/>
  <text x="62" y="58" text-anchor="middle" font-family="Inter,sans-serif"
    font-size="${fs}" font-weight="800" fill="#ffffff"
    stroke="#9a7010" stroke-width="1.2" paint-order="stroke">${score}%</text>
</svg>`;
}

function medalBlock(score: number, label: string, isAr: boolean): string {
  return `<div class="cert-medal-wrap">${medalSvg(score)}<span class="cert-medal-lbl" ${isAr ? `style="font-family:'Noto Sans Arabic',sans-serif;letter-spacing:0;text-transform:none"` : ""}>${esc(label)}</span></div>`;
}

function signatureSvg(): string {
  return `<svg class="cert-signature-svg" width="110" height="28" viewBox="0 0 110 28" aria-hidden="true">
    <path d="M8,20 C22,8 32,26 48,16 C62,6 72,24 86,14 C96,8 104,18 108,13"
      fill="none" stroke="${AVBLUE_DK}" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
}

function buildCertificateArticle(opts: ServerCertificateInput): string {
  const locale = langToLocale(opts.language);
  const copy = COPY[locale];
  const isAr = locale === "ar";
  const score = Math.round(opts.score);
  const body = copy.body({ role: opts.role, program: opts.programName, score });
  const issueIso = (opts.completionDate ?? new Date()).toISOString();
  const dateStr = formatCertificateDate(issueIso, locale);
  const certId = esc(opts.certificateId ?? buildCertificateId(opts.recipientName, issueIso));
  const certIdLine = `Document Officiel · Averda Academy · ${certId} · averda.com`;

  const logoWatermark = `<div class="cert-logo-watermark">${averdaAWatermarkSvg()}</div>`;

  const logoHeader = opts.logoBase64
    ? `<header class="cert-header">
        <img class="cert-logo" src="${opts.logoBase64}" alt="Averda" />
        <p class="cert-tagline">${esc(copy.tagline)}</p>
      </header>`
    : `<header class="cert-header"><p class="cert-tagline">${esc(copy.tagline)}</p></header>`;

  const titleBlock = isAr
    ? `<p class="cert-title-en" style="font-family:'Amiri',serif;letter-spacing:0;font-size:44px;font-weight:700">${esc(copy.title1)} ${esc(copy.title2)}</p>`
    : `<h1 class="cert-title-en">${esc(copy.title1)}</h1><h2 class="cert-subtitle-en">${esc(copy.title2)}</h2>`;

  const nameBlock = isAr
    ? `<p class="cert-name-en" style="font-family:'Amiri',serif;font-size:100px;font-weight:700;color:${AVBLUE}">${esc(opts.recipientName)}</p>`
    : `<p class="cert-name-en">${esc(opts.recipientName)}</p>`;

  const bodyBlock = isAr
    ? `<p class="cert-text-en" style="font-family:'Noto Sans Arabic',sans-serif">${esc(body)}</p>`
    : `<p class="cert-text-en">${esc(body)}</p>`;

  const signatureBlockHtml = isAr
    ? `<span class="cert-footer-val" style="font-family:'Noto Sans Arabic',sans-serif">${esc(copy.directorName)}</span>`
    : signatureSvg();

  return `<article class="cert-root" lang="${copy.lang}" dir="${copy.dir}">
  <div class="cert-bg"></div>
  ${logoWatermark}
  <div class="cert-corner-deco cert-corner-deco-tl">${cornerDecoSvg("tl")}</div>
  <div class="cert-corner-deco cert-corner-deco-br">${cornerDecoSvg("br")}</div>
  <div class="cert-frame"></div>
  ${logoHeader}
  <div class="cert-body-area">
    ${titleBlock}
    <p class="cert-academy-line">${esc(copy.academyLine)}</p>
    <div class="cert-line"></div>
    <p class="cert-awarded-en" ${isAr ? `style="font-family:'Noto Sans Arabic',sans-serif;letter-spacing:0"` : ""}>${esc(copy.awardedTo)}</p>
    <div class="cert-name-hero">
      ${nameBlock}
      <div class="cert-name-rule"></div>
    </div>
    ${bodyBlock}
    ${medalBlock(score, copy.scoreLabel, isAr)}
  </div>
  <div class="cert-footer">
    <div class="cert-footer-row">
      <div class="cert-footer-cell">
        <span class="cert-footer-val">${esc(dateStr)}</span>
        <hr class="cert-footer-hr"/>
        <span class="cert-footer-lbl">${esc(copy.dateLabel)}</span>
      </div>
      <div class="cert-footer-cell">${sealSvg()}</div>
      <div class="cert-footer-cell">
        ${signatureBlockHtml}
        <hr class="cert-footer-hr"/>
        <span class="cert-footer-lbl">${esc(copy.signatureLabel)}</span>
      </div>
    </div>
  </div>
  <div class="cert-id-strip"><span>${certIdLine}</span></div>
</article>`;
}

/** Full HTML document for Puppeteer PDF rendering. */
export function buildCertificateDocument(opts: ServerCertificateInput): string {
  const locale = langToLocale(opts.language);
  const article = buildCertificateArticle(opts);
  return `<!DOCTYPE html>
<html lang="${locale}" dir="${COPY[locale].dir}">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONT_HREF}" rel="stylesheet">
<style>${CERTIFICATE_CSS}</style>
</head>
<body>${article}</body>
</html>`;
}
