/**
 * Averda Academy — Certificate v5 FINAL
 * Design: cream bg, blue double border, recycle corners,
 * gold laurels flanking title, large name, medal image + score,
 * official seal stamp, faint watermark logo
 */
import puppeteer, { type Browser } from "puppeteer";
import fs from "fs";
import path from "path";
import type { Response } from "express";
import { fileURLToPath } from "url";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  computeEmployeeCourseMetrics,
  visibleCoursesForEmployee,
} from "../utils/employeeCourseProgress.js";

const PUPPETEER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
];

function systemBrowserCandidates(): string[] {
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA ?? "";
    const pf = process.env.ProgramFiles ?? "C:\\Program Files";
    const pf86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
    return [
      path.join(pf, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(pf86, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(local, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
      path.join(pf86, "Microsoft", "Edge", "Application", "msedge.exe"),
    ];
  }
  if (process.platform === "darwin") {
    return [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ];
  }
  return [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
}

async function launchCertificateBrowser(): Promise<Browser> {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (envPath && fs.existsSync(envPath)) {
    return puppeteer.launch({
      headless: true,
      executablePath: envPath,
      args: PUPPETEER_ARGS,
    });
  }

  const launchAttempts: Array<Parameters<typeof puppeteer.launch>[0]> = [
    { headless: true, args: PUPPETEER_ARGS },
    { headless: true, channel: "chrome", args: PUPPETEER_ARGS },
  ];

  let lastError: unknown;
  for (const opts of launchAttempts) {
    try {
      return await puppeteer.launch(opts);
    } catch (err) {
      lastError = err;
    }
  }

  for (const candidate of systemBrowserCandidates()) {
    if (!fs.existsSync(candidate)) continue;
    try {
      return puppeteer.launch({
        headless: true,
        executablePath: candidate,
        args: PUPPETEER_ARGS,
      });
    } catch (err) {
      lastError = err;
    }
  }

  const hint =
    "Install Google Chrome / Microsoft Edge, set PUPPETEER_EXECUTABLE_PATH, or run: npx puppeteer browsers install chrome";
  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new AppError(503, `Certificate PDF engine unavailable. ${hint} (${detail})`);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Bump when certificate layout changes — invalidates cached PDF filenames. */
export const CERT_TEMPLATE_VERSION = "premium-gold-v12";

/** Border corner inset — recycling logos centered on border junctions. */
const CORNER_INSET = 58;
const INNER_INSET = CORNER_INSET + 6; /* light-blue inner frame */
const CORNER_LOGO_PX = 112;
const MEDAL_IMG_PX = 140;
/** Gold disc region in medaille-logo.png (360×360) — pixel-measured overlay. */
const MEDAL_DISC = { left: "20.83%", top: "10.83%", width: "56.67%", height: "41.11%" } as const;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
export type Lang = "AR" | "FR" | "EN";

export interface CertificateOptions {
  recipientName: string;
  role: string;
  courseName: string;
  score: number;
  language?: Lang;
  completionDate?: Date;
  outputPath: string;
}

const T = {
  AR: {
    dir: "rtl", isRTL: true,
    mainTitle: "شهادة الإكمال",
    tagline: "إدارة النفايات وإعادة التدوير",
    academy: "أكاديمية أفيردا",
    awardedTo: "مُنحت إلى",
    body: (role: string, score: number, course: string) =>
      `لإتمامه بنجاح برنامج «${course}» بصفته ${role}، بمعدل نهائي قدره ${score}٪، وذلك وفق معايير السلامة والامتثال المعتمدة لدى أكاديمية أفيردا.`,
    from: "من:",
    company: "شركة أفيردا",
    ceo: "الرئيس التنفيذي",
    dateLabel: "التاريخ",
    scoreLabel: "النتيجة",
    sealLine1: "Averda Academy",
    sealLine2: "خالٍ من العهد",
  },
  FR: {
    dir: "ltr", isRTL: false,
    mainTitle: "Certificat de Réussite",
    tagline: "Gestion des Déchets et Recyclage",
    academy: "Averda Academy",
    awardedTo: "Décerné à",
    body: (role: string, score: number, course: string) =>
      `Pour avoir complété avec succès le programme « ${course} » en tant que ${role}, avec un score final de ${score}\u00A0%, conformément aux standards de sécurité et de conformité d'Averda Academy.`,
    from: "De:",
    company: "Averda S.A.",
    ceo: "Directeur Général",
    dateLabel: "Date",
    scoreLabel: "Score",
    sealLine1: "Averda Academy",
    sealLine2: "Certifié",
  },
  EN: {
    dir: "ltr", isRTL: false,
    mainTitle: "Certificate of Achievement",
    tagline: "Waste Management & Recycling",
    academy: "Averda Academy",
    awardedTo: "Awarded to",
    body: (role: string, score: number, course: string) =>
      `For successfully completing the « ${course} » programme as ${role}, achieving a final score of ${score}%, in accordance with Averda Academy's safety and compliance standards.`,
    from: "From:",
    company: "Averda Co.",
    ceo: "Chief Executive",
    dateLabel: "Date",
    scoreLabel: "Score",
    sealLine1: "Averda Academy",
    sealLine2: "Certified",
  },
} as const;

const ROLES: Record<string, Record<Lang, string>> = {
  driver:      { AR: "سائق",        FR: "Chauffeur",            EN: "Driver" },
  sweeper:     { AR: "عامل نظافة",  FR: "Balayeur",             EN: "Sweeper" },
  loader:      { AR: "عامل تحميل", FR: "Chargeur",             EN: "Loader" },
  teamLeader:  { AR: "رئيس فريق",  FR: "Chef d'Équipe",        EN: "Team Leader" },
  parkAgent:   { AR: "عامل حديقة", FR: "Agent de Parc",        EN: "Park Agent" },
  maintenance: { AR: "صيانة",       FR: "Agent de Maintenance", EN: "Maintenance" },
};

/** 1x1 transparent GIF — used only when logo files are missing */
const LOGO_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
] as const;

function fmtDate(d: Date, lang: Lang): string {
  if (lang === "AR") {
    return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  if (lang === "FR") {
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function loadAssetDataUrl(filename: string): string | null {
  const cands = [
    path.join(__dirname, "../assets", filename),
    path.join(__dirname, "../../pictures", filename),
    path.join(process.cwd(), "pictures", filename),
    path.join(process.cwd(), "../pictures", filename),
  ];
  for (const p of cands) {
    if (!fs.existsSync(p)) continue;
    const ext = path.extname(p).toLowerCase();
    const mime =
      ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
    return `data:${mime};base64,` + fs.readFileSync(p).toString("base64");
  }
  return null;
}

function getLogo(): string {
  const cands = [
    path.join(__dirname, "../../client/public/averda_logo.png"),
    path.join(__dirname, "../assets/averda_logo.png"),
    path.join(process.cwd(), "client/public/averda_logo.png"),
    path.join(process.cwd(), "../client/public/averda_logo.png"),
  ];
  for (const p of cands) if (fs.existsSync(p))
    return "data:image/png;base64," + fs.readFileSync(p).toString("base64");
  return LOGO_PLACEHOLDER;
}

function getRecyclingLogo(): string {
  return loadAssetDataUrl("recycling-logo.png") ?? LOGO_PLACEHOLDER;
}

function getMedalLogo(): string {
  return loadAssetDataUrl("medaille-logo.png") ?? LOGO_PLACEHOLDER;
}

function buildHTML(opts: CertificateOptions): string {
  const lang    = opts.language ?? "AR";
  const t       = T[lang];
  const isRTL   = t.isRTL;
  const date    = opts.completionDate ?? new Date();
  const year    = date.getFullYear();
  const certId  = `AVD-${year}-${Math.floor(10000 + Math.random() * 90000)}`;
  const roleRaw = ROLES[opts.role]?.[lang] ?? opts.role;
  const score   = Math.round(opts.score);
  const logo    = getLogo();
  const recyclingLogo = getRecyclingLogo();
  const medalLogo = getMedalLogo();
  const dateStr = escapeHtml(fmtDate(date, lang));
  const safeName = escapeHtml(opts.recipientName);
  const bodyTx  = escapeHtml(t.body(roleRaw, score, opts.courseName));

  const gFont = isRTL
    ? "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;600;700;900&display=swap"
    : "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700;900&display=swap";

  const bodyF  = isRTL ? "'Noto Sans Arabic',sans-serif" : "'Lato',sans-serif";
  const titleF = isRTL ? "'Noto Sans Arabic',sans-serif" : "'Cormorant Garamond',serif";

  /* ── SVGs ── */

  // Gold 5-point star
  const starSVG = (size: number) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 20 20">
      <polygon points="10,1 12.9,7 19.5,7.6 14.8,12 16.2,18.5 10,15 3.8,18.5 5.2,12 0.5,7.6 7.1,7"
               fill="#C8A84B"/>
    </svg>`;

  const cornerImg = `<img src="${recyclingLogo}" alt="" width="${CORNER_LOGO_PX}" height="${CORNER_LOGO_PX}" class="ci-img">`;

  return `<!DOCTYPE html>
<html dir="${t.dir}">
<head>
<meta charset="UTF-8">
<link href="${gFont}" rel="stylesheet">
<style>
*{ margin:0; padding:0; box-sizing:border-box }
html,body{ width:1122px; height:794px; overflow:hidden; font-family:${bodyF} }

/* ── PAGE ── */
.page{
  width:1122px; height:794px;
  position:relative; overflow:hidden;
  background: linear-gradient(160deg, #f8f3e8 0%, #f2ead8 50%, #ede4d0 100%);
}

/* ── INNER FRAME CONTENT (inside light-blue cadre) ── */
.frame-content{
  position:absolute;
  top:${INNER_INSET}px;
  left:${INNER_INSET}px;
  right:${INNER_INSET}px;
  bottom:${INNER_INSET}px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  align-items:center;
  padding:8px 28px 6px;
  z-index:5;
  overflow:hidden;
}

/* ── HEADER ── */
.header-block{
  flex-shrink:0;
  width:100%;
  display:flex; flex-direction:column; align-items:center;
  text-align:center;
  padding:0;
  position:relative; z-index:2;
  direction:${t.dir};
}

/* ── MAIN (name + body + medal) ── */
.main-block{
  flex:1;
  width:100%;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  text-align:center;
  padding:2px 12px;
  gap:4px;
  position:relative; z-index:2;
  direction:${t.dir};
  min-height:0;
}

/* ── FOOTER (date | seal | company) ── */
.footer-block{
  flex-shrink:0;
  width:100%;
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:end;
  gap:16px;
  padding:0 4px 2px;
  position:relative; z-index:2;
  direction:ltr;
}
.footer-date{
  display:flex; flex-direction:column;
  align-items:flex-start;
  text-align:left;
}
.footer-sign{
  display:flex; flex-direction:column;
  align-items:center;
  justify-content:flex-end;
  text-align:center;
  padding-bottom:2px;
}
.footer-company{
  display:flex; flex-direction:column;
  align-items:flex-end;
  text-align:right;
}

/* ── FAINT WATERMARK ── */
.wm{
  position:absolute;
  top:50%; left:50%;
  transform:translate(-50%,-50%);
  width:480px; opacity:0.042;
  z-index:0; pointer-events:none;
  filter:grayscale(1);
}

/* ── BORDERS (segments meet at corner-logo centers) ── */
.b-outer-h,.b-inner-h{
  position:absolute; left:${CORNER_INSET}px; right:${CORNER_INSET}px;
  height:2.5px; z-index:10; pointer-events:none;
}
.b-outer-v,.b-inner-v{
  position:absolute; top:${CORNER_INSET}px; bottom:${CORNER_INSET}px;
  width:2.5px; z-index:10; pointer-events:none;
}
.b-outer-h{ background:#1a5fa8; }
.b-outer-v{ background:#1a5fa8; }
.b-inner-h{
  height:1px; background:rgba(26,95,168,.4);
  left:${INNER_INSET}px; right:${INNER_INSET}px;
}
.b-inner-v{
  width:1px; background:rgba(26,95,168,.4);
  top:${INNER_INSET}px; bottom:${INNER_INSET}px;
}
.b-outer-top{ top:${CORNER_INSET}px; }
.b-outer-bot{ bottom:${CORNER_INSET}px; }
.b-outer-left{ left:${CORNER_INSET}px; }
.b-outer-right{ right:${CORNER_INSET}px; }
.b-inner-top{ top:${INNER_INSET}px; }
.b-inner-bot{ bottom:${INNER_INSET}px; }
.b-inner-left{ left:${INNER_INSET}px; }
.b-inner-right{ right:${INNER_INSET}px; }

/* ── CORNER RECYCLING LOGOS ── */
.ci{
  position:absolute; z-index:13;
  width:${CORNER_LOGO_PX}px; height:${CORNER_LOGO_PX}px;
  transform:translate(-50%,-50%);
  line-height:0; pointer-events:none;
}
.ci-tl{ top:${CORNER_INSET}px; left:${CORNER_INSET}px; }
.ci-tr{ top:${CORNER_INSET}px; left:calc(100% - ${CORNER_INSET}px); }
.ci-bl{ top:calc(100% - ${CORNER_INSET}px); left:${CORNER_INSET}px; }
.ci-br{ top:calc(100% - ${CORNER_INSET}px); left:calc(100% - ${CORNER_INSET}px); }
.ci-img{
  width:${CORNER_LOGO_PX}px !important;
  height:${CORNER_LOGO_PX}px !important;
  object-fit:contain;
  display:block;
}

/* ── GOLD TOP BAR ── */
.gold-bar-top{
  position:absolute; top:${CORNER_INSET - 6}px; left:${CORNER_INSET + 8}px; right:${CORNER_INSET + 8}px;
  height:2px;
  background:linear-gradient(90deg,transparent,#C8A84B 15%,#e8d070 50%,#C8A84B 85%,transparent);
  z-index:9;
}
/* ── GOLD BOTTOM BAR ── */
.gold-bar-bot{
  position:absolute; bottom:${CORNER_INSET - 6}px; left:${CORNER_INSET + 8}px; right:${CORNER_INSET + 8}px;
  height:2px;
  background:linear-gradient(90deg,transparent,#C8A84B 15%,#e8d070 50%,#C8A84B 85%,transparent);
  z-index:9;
}

/* ── CONTENT TYPOGRAPHY ── */
.logo{ height:36px; object-fit:contain; margin-bottom:3px }

/* ── TAGLINE ── */
.tagline{
  font-family:${bodyF};
  font-size:${isRTL ? "10px" : "7.5px"};
  color:#1a5fa8; font-weight:700;
  letter-spacing:${isRTL ? "0" : "3px"};
  text-transform:uppercase;
  margin-bottom:5px;
}

/* ── TITLE ROW ── */
.title-row{
  display:flex; align-items:center; justify-content:center;
  margin-bottom:2px;
}
.main-title{
  font-family:${titleF};
  font-size:${isRTL ? "40px" : "36px"};
  font-weight:700; color:#0A3161;
  line-height:1; white-space:nowrap;
}

/* ── STARS ROW ── */
.stars-row{
  display:flex; align-items:center; gap:8px;
  margin-bottom:4px;
}
.star-line{
  flex:1; max-width:160px; height:1px;
  background:linear-gradient(90deg,transparent,#C8A84B,transparent);
}

/* ── ACADEMY BADGE ── */
.academy-badge{
  display:inline-flex; align-items:center; gap:6px;
  border:1px solid #1a5fa8; border-radius:20px;
  padding:3px 14px;
  font-family:${bodyF};
  font-size:${isRTL ? "11px" : "9px"};
  color:#1a5fa8; font-weight:600;
  margin-bottom:6px;
}
.badge-dot{ width:6px; height:6px; border-radius:50%; background:#1a5fa8 }

/* ── GOLD SEPARATOR ── */
.gold-sep{
  width:80%; height:1.5px;
  background:linear-gradient(90deg,transparent,#C8A84B 20%,#e8d070 50%,#C8A84B 80%,transparent);
  margin:4px auto;
}
.gold-sep-sm{
  width:45%; height:1.5px;
  background:linear-gradient(90deg,transparent,#C8A84B 20%,#e8d070 50%,#C8A84B 80%,transparent);
  margin:2px auto 4px;
}

/* ── AWARDED TO ── */
.awarded{
  font-family:${bodyF};
  font-size:${isRTL ? "11px" : "9px"};
  color:#777;
  letter-spacing:${isRTL ? "0" : "2px"};
  margin-bottom:4px;
}

/* ── RECIPIENT NAME ── */
.name{
  font-family:${titleF};
  font-size:${isRTL ? "46px" : "48px"};
  font-weight:${isRTL ? "700" : "600"};
  color:#0A3161; line-height:1.05;
  margin-bottom:2px;
  direction:${t.dir}; unicode-bidi:plaintext;
  text-align:center;
}

/* ── BODY TEXT ── */
.body-tx{
  font-family:${bodyF};
  font-size:${isRTL ? "11.5px" : "10.5px"};
  color:#444; line-height:1.65;
  max-width:700px; margin:0 auto 6px;
  direction:${t.dir};
}

/* ── FOOTER CELLS ── */
.b-date-lbl{
  font-family:${bodyF};
  font-size:${isRTL ? "9px" : "7px"};
  color:#999; letter-spacing:${isRTL ? "0" : "2px"};
  text-transform:uppercase; margin-bottom:2px;
}
.b-date{
  font-family:${bodyF};
  font-size:${isRTL ? "14px" : "12px"};
  font-weight:700; color:#0A3161;
  white-space:nowrap;
}
.b-date--rtl{
  direction:rtl;
  unicode-bidi:plaintext;
  text-align:right;
}
.b-cert-id{
  font-family:'Lato',sans-serif;
  font-size:8px; color:#bbb; margin-top:3px;
  letter-spacing:1px;
}

.b-from-lbl{
  font-family:${bodyF};
  font-size:${isRTL ? "9px" : "7px"};
  color:#999; letter-spacing:${isRTL ? "0" : "2px"};
  text-transform:uppercase; margin-bottom:2px;
}
.b-company{
  font-family:${bodyF};
  font-size:${isRTL ? "14px" : "12px"};
  font-weight:700; color:#0A3161;
}
.seal-stamp{
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  border:2px solid rgba(26,95,168,.45);
  border-radius:50%;
  width:84px; height:84px;
  text-align:center;
  padding:8px;
  background:rgba(255,255,255,.35);
  box-shadow:0 2px 8px rgba(26,95,168,.08);
}
.seal-line1{
  font-family:'Lato',sans-serif;
  font-size:6.5px; font-weight:700; color:#1a5fa8;
  letter-spacing:.4px; text-transform:uppercase;
  line-height:1.15;
}
.seal-line2{
  font-family:${bodyF};
  font-size:${isRTL ? "7.5px" : "6.5px"}; font-weight:600; color:#0A3161;
  line-height:1.2; margin-top:3px;
}
.seal-ceo{
  font-family:${bodyF};
  font-size:5.5px; color:#888;
  margin-top:3px; line-height:1.1;
}

/* ── MEDAL (image asset + score overlay) ── */
.medal-wrap{
  display:flex; flex-direction:column; align-items:center;
  margin-top:4px;
}

.medal-lbl{
  font-family:${bodyF};
  font-size:${isRTL ? "10px" : "8px"};
  color:#888;
  letter-spacing:${isRTL ? "0" : "1.5px"};
  text-transform:uppercase;
  margin-bottom:5px;
}

.medal-img-wrap{
  position:relative;
  width:${MEDAL_IMG_PX}px;
  height:${MEDAL_IMG_PX}px;
  line-height:0;
}
.medal-img{
  width:100%;
  height:100%;
  display:block;
  object-fit:contain;
}
.medal-disc{
  position:absolute;
  left:${MEDAL_DISC.left};
  top:${MEDAL_DISC.top};
  width:${MEDAL_DISC.width};
  height:${MEDAL_DISC.height};
  display:flex;
  align-items:center;
  justify-content:center;
  pointer-events:none;
}
.medal-num{
  font-family:'Lato',sans-serif;
  font-size:22px;
  font-weight:900;
  color:#3a2000;
  text-shadow:0 1px 0 rgba(255,240,120,.95), 0 1px 3px rgba(0,0,0,.15);
  line-height:1;
  direction:ltr;
  unicode-bidi:plaintext;
}
</style>
</head>
<body>
<div class="page">

  <!-- watermark -->
  <img class="wm" src="${logo}" alt="">

  <!-- borders (corners at recycling-logo centers) -->
  <div class="b-outer-h b-outer-top"></div>
  <div class="b-outer-h b-outer-bot"></div>
  <div class="b-outer-v b-outer-left"></div>
  <div class="b-outer-v b-outer-right"></div>
  <div class="b-inner-h b-inner-top"></div>
  <div class="b-inner-h b-inner-bot"></div>
  <div class="b-inner-v b-inner-left"></div>
  <div class="b-inner-v b-inner-right"></div>

  <!-- gold bars -->
  <div class="gold-bar-top"></div>
  <div class="gold-bar-bot"></div>

  <!-- corner recycling logos -->
  <div class="ci ci-tl">${cornerImg}</div>
  <div class="ci ci-tr">${cornerImg}</div>
  <div class="ci ci-bl">${cornerImg}</div>
  <div class="ci ci-br">${cornerImg}</div>

  <div class="frame-content">

  <!-- HEADER -->
  <div class="header-block">
    <img class="logo" src="${logo}" alt="Averda">
    <div class="tagline">${t.tagline}</div>
    <div class="title-row">
      <div class="main-title">${t.mainTitle}</div>
    </div>
    <div class="stars-row">
      <div class="star-line"></div>
      ${starSVG(14)}
      ${starSVG(18)}
      ${starSVG(14)}
      <div class="star-line"></div>
    </div>
    <div class="academy-badge">
      <div class="badge-dot"></div>
      ${t.academy}
      <div class="badge-dot"></div>
    </div>
  </div>

  <!-- MAIN (name + body + medal) -->
  <div class="main-block">
    <div class="awarded">${t.awardedTo}</div>
    <div class="name">${safeName}</div>
    <div class="gold-sep-sm"></div>
    <div class="body-tx">${bodyTx}</div>
    <div class="medal-wrap">
      <div class="medal-lbl">${t.scoreLabel}</div>
      <div class="medal-img-wrap">
        <img class="medal-img" src="${medalLogo}" alt="">
        <div class="medal-disc">
          <div class="medal-num">${score}%</div>
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER (date | seal | company) -->
  <div class="footer-block">
    <div class="footer-date">
      <div class="b-date-lbl">${t.dateLabel}</div>
      <div class="b-date${isRTL ? " b-date--rtl" : ""}">${dateStr}</div>
      <div class="b-cert-id">${certId}</div>
    </div>
    <div class="footer-sign">
      <div class="seal-stamp">
        <div class="seal-line1">${t.sealLine1}</div>
        <div class="seal-line2">${t.sealLine2}</div>
        <div class="seal-ceo">${t.ceo}</div>
      </div>
    </div>
    <div class="footer-company">
      <div class="b-from-lbl">${t.from}</div>
      <div class="b-company">${t.company}</div>
    </div>
  </div>

  </div><!-- /.frame-content -->

</div>
</body>
</html>`;
}

export async function generateCertificate(opts: CertificateOptions): Promise<string> {
  const html = buildHTML(opts);
  console.info(`[certificate] generating PDF template=${CERT_TEMPLATE_VERSION} → ${opts.outputPath}`);
  const browser = await launchCertificateBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1122, height: 794, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load", timeout: 30000 });
    await page.evaluateHandle("document.fonts.ready");
    const buf = await page.pdf({
      width: "297mm",
      height: "210mm",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    fs.mkdirSync(path.dirname(opts.outputPath), { recursive: true });
    if (fs.existsSync(opts.outputPath)) {
      fs.unlinkSync(opts.outputPath);
    }
    fs.writeFileSync(opts.outputPath, buf);
    return opts.outputPath;
  } finally {
    await browser.close();
  }
}

function normalizeLang(raw?: string | null): Lang {
  if (raw === "FR" || raw === "EN") return raw;
  return "AR";
}

function courseTitleForLang(
  courses: { title: unknown; slug: string }[],
  lang: Lang
): string {
  for (const c of courses) {
    const t = c.title as { ar?: string; fr?: string; en?: string };
    const pick = lang === "AR" ? t.ar : lang === "FR" ? t.fr : t.en;
    if (pick) return pick;
    if (t.ar) return t.ar;
    if (t.fr) return t.fr;
    if (t.en) return t.en;
    if (c.slug) return c.slug;
  }
  return lang === "AR"
    ? "برنامج السلامة والامتثال المهني"
    : lang === "FR"
      ? "Programme de sécurité et conformité professionnelle"
      : "Safety and Professional Compliance Program";
}

export async function generateTrainingCertificate(params: {
  userId: string;
  employeeName: string;
  courseTitles: string[];
  uploadDir: string;
  role?: string;
  score?: number;
  courseName?: string;
  language?: Lang;
}): Promise<string> {
  const certDir = path.join(params.uploadDir, "certificates");
  fs.mkdirSync(certDir, { recursive: true });
  purgeStaleCertificatePdfs(certDir, params.userId);

  const filename = `${params.userId}-${CERT_TEMPLATE_VERSION}.pdf`;
  const outPath = path.join(certDir, filename);
  const lang = params.language ?? "AR";

  try {
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  } catch {
    /* ignore */
  }

  await generateCertificate({
    recipientName: params.employeeName,
    role: params.role ?? "driver",
    courseName:
      params.courseName ??
      params.courseTitles.find((t) => /[\u0600-\u06FF]/.test(t)) ??
      params.courseTitles[0] ??
      courseTitleForLang([], lang),
    score: params.score ?? 100,
    language: lang,
    outputPath: outPath,
  });

  return `/uploads/certificates/${filename}`;
}

function resolveUploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

function purgeStaleCertificatePdfs(certDir: string, userId: string): void {
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(certDir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (!name.startsWith(userId) || !name.endsWith(".pdf")) continue;
    try {
      fs.unlinkSync(path.join(certDir, name));
    } catch {
      /* ignore */
    }
  }
}

export async function issueEmployeeCertificate(uid: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: uid, role: "EMPLOYEE" },
    include: {
      category: true,
      progress: true,
      attempts: { include: { quiz: true } },
      lessonQuizAttempts: true,
    },
  });
  if (!user) throw new AppError(404, "Employee not found");
  if (!user.categoryId) throw new AppError(400, "Employee category not set");

  const assigned = await prisma.course.findMany({
    where: { isActive: true, categories: { some: { categoryId: user.categoryId } } },
    select: {
      id: true,
      slug: true,
      title: true,
      isHsseqFoundation: true,
      pdfUrl: true,
    },
  });

  const visible = visibleCoursesForEmployee(
    assigned,
    user.assessmentCompleted,
    user.assessmentScore,
    user.hsseqCourseRequired
  );

  const metrics = computeEmployeeCourseMetrics(
    visible,
    user.progress,
    user.lessonQuizAttempts ?? [],
    user.attempts ?? [],
    user.assessmentCompleted,
    user.assessmentScore
  );

  if (metrics.coursesTotal === 0 || metrics.coursesDone < metrics.coursesTotal) {
    throw new AppError(400, "Employee has not completed all assigned courses");
  }

  const scores = [
    ...(user.attempts ?? []).map((a) => a.score),
    ...(user.lessonQuizAttempts ?? []).map((a) => a.percentage),
  ];
  const avgScore =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  if (avgScore < 70) {
    throw new AppError(400, "Employee average score below certificate threshold");
  }

  const lang = normalizeLang(user.language);
  const courseName = courseTitleForLang(visible, lang);

  const pdfUrl = await generateTrainingCertificate({
    userId: uid,
    employeeName: user.name,
    courseTitles: visible.map((c) => courseTitleForLang([c], lang)),
    uploadDir: resolveUploadDir(),
    role: user.category?.code ?? "driver",
    score: avgScore,
    courseName,
    language: lang,
  });

  const existing = await prisma.certificate.findFirst({
    where: { userId: uid },
    orderBy: { issuedAt: "desc" },
  });
  if (existing) {
    await prisma.certificate.update({
      where: { id: existing.id },
      data: { pdfUrl, issuedAt: new Date() },
    });
  } else {
    await prisma.certificate.create({ data: { userId: uid, pdfUrl } });
  }
  return pdfUrl;
}

export function certificatePathFromUrl(pdfUrl: string): string {
  const rel = pdfUrl.replace(/^\/uploads\//, "").replace(/\\/g, "/");
  return path.join(resolveUploadDir(), rel);
}

export function buildCertificateDownloadName(employeeName: string): string {
  const cleaned = (employeeName || "employee").replace(/[\\/:*?"<>|]/g, "-").trim();
  return `certificate-${cleaned}-averda.pdf`;
}

function contentDispositionHeader(downloadName: string): string {
  const asciiFallback =
    downloadName.replace(/[^\x20-\x7E]/g, "").replace(/["\\]/g, "").trim() ||
    "certificate-averda.pdf";
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`;
}

export function sendCertificatePdf(res: Response, pdfUrl: string, downloadName: string): void {
  const absPath = certificatePathFromUrl(pdfUrl);
  if (!fs.existsSync(absPath)) {
    throw new AppError(500, "Certificate file missing after generation");
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", contentDispositionHeader(downloadName));
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Certificate-Template", CERT_TEMPLATE_VERSION);
  res.setHeader("Expires", "0");
  res.sendFile(path.resolve(absPath));
}