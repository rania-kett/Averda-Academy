/**
 * Averda Academy — Premium Certificate
 * Inspired by the reference design: cream background, blue border,
 * laurel icons, large centered name, real gold medal + red/gold ribbons
 * HTML → PDF via Puppeteer | AR / FR / EN
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
      return await puppeteer.launch({
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
export const CERT_TEMPLATE_VERSION = "premium-gold-v22";

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
    dir: "rtl",
    isRTL: true,
    mainTitle: "شهادة الإكمال",
    tagline: "إدارة النفايات وإعادة التدوير",
    academy: "أكاديمية أفيردا",
    awardedTo: "مُنحت إلى",
    body: (role: string, score: number, course: string) =>
      `لإتمامه بنجاح برنامج «${course}» بصفته ${role}، بمعدل نهائي قدره ${score}٪، وذلك وفق معايير السلامة والامتثال المعتمدة لدى أكاديمية أفيردا.`,
    from: "من:",
    company: "شركة أفيردا",
    dateLabel: "التاريخ",
    scoreLabel: "النتيجة",
    purity: "خالٍ من العهد",
  },
  FR: {
    dir: "ltr",
    isRTL: false,
    mainTitle: "Certificat de Réussite",
    tagline: "Gestion des Déchets et Recyclage",
    academy: "Averda Academy",
    awardedTo: "Décerné à",
    body: (role: string, score: number, course: string) =>
      `Pour avoir complété avec succès le programme « ${course} » en tant que ${role}, avec un score final de ${score}\u00A0%, conformément aux standards de sécurité d'Averda Academy.`,
    from: "De:",
    company: "Averda S.A.",
    dateLabel: "Date",
    scoreLabel: "Score",
    purity: "Certifié",
  },
  EN: {
    dir: "ltr",
    isRTL: false,
    mainTitle: "Certificate of Achievement",
    tagline: "Waste Management and Recycling",
    academy: "Averda Academy",
    awardedTo: "Awarded to",
    body: (role: string, score: number, course: string) =>
      `For successfully completing the « ${course} » programme as ${role}, achieving a final score of ${score}%, in accordance with Averda Academy standards.`,
    from: "From:",
    company: "Averda Co.",
    dateLabel: "Date",
    scoreLabel: "Score",
    purity: "Certified",
  },
} as const;

const ROLES: Record<string, Record<Lang, string>> = {
  driver: { AR: "سائق", FR: "Chauffeur", EN: "Driver" },
  sweeper: { AR: "عامل نظافة", FR: "Balayeur", EN: "Sweeper" },
  loader: { AR: "عامل تحميل", FR: "Chargeur", EN: "Loader" },
  teamLeader: { AR: "رئيس فريق", FR: "Chef d'Équipe", EN: "Team Leader" },
  parkAgent: { AR: "عامل حديقة", FR: "Agent de Parc", EN: "Park Agent" },
  maintenance: { AR: "صيانة", FR: "Agent de Maintenance", EN: "Maintenance" },
};

/** 1×1 transparent GIF — used only when logo files are missing */
const LOGO_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function fmtDate(d: Date, lang: Lang): string {
  return d.toLocaleDateString(
    lang === "AR" ? "ar-MA" : lang === "FR" ? "fr-FR" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );
}

function getLogo(): string {
  const cands = [
    path.join(__dirname, "../../client/public/averda_logo.png"),
    path.join(__dirname, "../assets/averda_logo.png"),
    path.join(process.cwd(), "client/public/averda_logo.png"),
    path.join(process.cwd(), "../client/public/averda_logo.png"),
  ];
  for (const p of cands) {
    if (fs.existsSync(p)) {
      return "data:image/png;base64," + fs.readFileSync(p).toString("base64");
    }
  }
  return LOGO_PLACEHOLDER;
}

function buildHTML(opts: CertificateOptions): string {
  const lang = opts.language ?? "AR";
  const t = T[lang];
  const isRTL = t.isRTL;
  const date = opts.completionDate ?? new Date();
  const year = date.getFullYear();
  const certId = `AVD-${year}-${Math.floor(10000 + Math.random() * 90000)}`;
  const role = ROLES[opts.role]?.[lang] ?? opts.role;
  const score = Math.round(opts.score);
  const logo = getLogo();
  const dateStr = fmtDate(date, lang);
  const bodyTx = t.body(role, score, opts.courseName);

  const gFont = isRTL
    ? "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;600;700;900&display=swap"
    : "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700&family=Lato:wght@300;400;700;900&display=swap";

  const bodyF = isRTL ? "'Noto Sans Arabic',sans-serif" : "'Lato',sans-serif";
  const titleF = isRTL ? "'Noto Sans Arabic',sans-serif" : "'Cormorant Garamond',serif";
  const nameF = isRTL ? "'Noto Sans Arabic',sans-serif" : "'Cormorant Garamond',serif";

  const BLUE = "#28609d";
  const GOLD = "#c5a059";
  const GOLD_LIGHT = "#d4af37";

  const cornerBracket = (pos: "tl" | "tr" | "bl" | "br") => {
    const flip =
      pos === "tr" ? "scaleX(-1)" : pos === "bl" ? "scaleY(-1)" : pos === "br" ? "scale(-1)" : "";
    return `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform:${flip}" aria-hidden="true">
      <path d="M3 22 L3 3 L22 3" stroke="${GOLD}" stroke-width="2.5" fill="none" stroke-linecap="square"/>
      <circle cx="5" cy="5" r="2" fill="${BLUE}" opacity=".55"/>
    </svg>`;
  };

  const titleStar = (id: "L" | "R") =>
    `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="starGrad${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f5d76e"/>
          <stop offset="55%" stop-color="${GOLD_LIGHT}"/>
          <stop offset="100%" stop-color="${GOLD}"/>
        </linearGradient>
      </defs>
      <path d="M12 1.8 L14.6 9.1 H22.4 L16.2 13.6 L18.8 21 L12 16.4 L5.2 21 L7.8 13.6 L1.6 9.1 H9.4 Z"
        fill="url(#starGrad${id})" stroke="${GOLD}" stroke-width=".65" stroke-linejoin="round"/>
    </svg>`;

  const footerStar = `<svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2 L14 9 H21 L15.5 13 L17.5 20 L12 16 L6.5 20 L8.5 13 L3 9 H10 Z"
      fill="${GOLD_LIGHT}" stroke="${GOLD}" stroke-width=".6"/>
  </svg>`;

  const iconAward = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="9" r="6" stroke="${GOLD}" stroke-width="1.5" fill="rgba(212,175,55,.12)"/>
    <path d="M8.5 14 L7 20 L12 17 L17 20 L15.5 14" stroke="${GOLD}" stroke-width="1.3" fill="none" stroke-linejoin="round"/>
  </svg>`;

  const donutR = 40;
  const donutCx = 48;
  const donutCirc = 2 * Math.PI * donutR;
  const donutFill = (score / 100) * donutCirc;
  const donutGap = donutCirc - donutFill;
  const scoreDonutSVG = `<svg width="108" height="108" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="donutGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f1c40f"/>
        <stop offset="50%" stop-color="#d4af37"/>
        <stop offset="100%" stop-color="#b8963E"/>
      </linearGradient>
      <radialGradient id="donutGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(212,175,55,.18)"/>
        <stop offset="100%" stop-color="rgba(212,175,55,0)"/>
      </radialGradient>
    </defs>
    <circle cx="${donutCx}" cy="${donutCx}" r="44" fill="url(#donutGlow)"/>
    <circle cx="${donutCx}" cy="${donutCx}" r="${donutR}" fill="none" stroke="#e8e0d4" stroke-width="6"/>
    <circle cx="${donutCx}" cy="${donutCx}" r="${donutR}" fill="none" stroke="url(#donutGold)" stroke-width="6"
      stroke-dasharray="${donutFill.toFixed(2)} ${donutGap.toFixed(2)}"
      stroke-linecap="round" transform="rotate(-90 ${donutCx} ${donutCx})"/>
    <text x="${donutCx}" y="${donutCx + 1}" text-anchor="middle" dominant-baseline="middle"
      font-family="Lato,sans-serif" font-size="22" font-weight="900" fill="${BLUE}">${score}%</text>
  </svg>`;

  return `<!DOCTYPE html>
<html dir="${t.dir}">
<head>
<meta charset="UTF-8">
<link href="${gFont}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{
  width:1122px;height:794px;overflow:hidden;
  font-family:${bodyF};
}

.page{
  width:1122px;height:794px;
  position:relative;overflow:hidden;
  background:linear-gradient(165deg,#faf8f4 0%,#f8f5ef 42%,#f2ede4 100%);
}
.page::before{
  content:"";
  position:absolute;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 70% 55% at 50% 42%,rgba(40,96,157,.07) 0%,transparent 68%),
    repeating-linear-gradient(
      0deg,
      transparent,transparent 39px,
      rgba(197,160,89,.025) 39px,rgba(197,160,89,.025) 40px
    );
}

/* Royal frame */
.frame-outer{
  position:absolute;inset:10px;z-index:10;pointer-events:none;
  border:2.5px solid ${GOLD};
  box-shadow:inset 0 1px 0 rgba(255,248,220,.35);
}
.frame-gap{
  position:absolute;inset:14px;z-index:10;pointer-events:none;
  border:2px solid #f8f5ef;
}
.frame-inner{
  position:absolute;inset:18px;z-index:10;pointer-events:none;
  border:1.5px solid ${BLUE};
  opacity:.9;
}

.corner{position:absolute;z-index:12;line-height:0}
.c-tl{top:21px;left:21px}
.c-tr{top:21px;right:21px}
.c-bl{bottom:21px;left:21px}
.c-br{bottom:21px;right:21px}

/* Background Averda watermark — subtle, behind centred content */
.cert-wm{
  position:absolute;
  top:50%;left:50%;
  transform:translate(-50%,-54%);
  width:520px;
  max-width:78%;
  opacity:0.048;
  z-index:0;
  pointer-events:none;
  filter:grayscale(35%) sepia(5%) hue-rotate(192deg);
}
.cert-wm img{width:100%;height:auto;display:block;object-fit:contain}

.cert{
  position:relative;z-index:2;
  display:flex;flex-direction:column;
  height:100%;
  padding:12px 80px 24px;
  margin:20px;
  direction:${t.dir};
}

/* Three-zone layout: header · body · footer */
.cert-stack{
  flex:1;
  display:flex;flex-direction:column;
  align-items:center;justify-content:space-between;
  position:relative;z-index:2;
  width:100%;
  min-height:0;
  padding:28px 0 22px;
}

/* ── Header zone ── */
.cert-header{
  flex-shrink:0;
  text-align:center;
  width:100%;
  max-width:720px;
}
.logo-hero{
  height:${isRTL ? "54px" : "50px"};
  width:auto;
  object-fit:contain;
  display:block;
  margin:0 auto 12px;
}
.title-row{
  display:flex;align-items:center;justify-content:center;
  gap:14px;
}
.title-row svg{
  flex-shrink:0;
  filter:drop-shadow(0 1px 2px rgba(197,160,89,.25));
}
.main-title{
  font-family:${titleF};
  font-size:${isRTL ? "31px" : "27px"};
  font-weight:700;
  color:${BLUE};
  line-height:1.2;
  padding:0 10px;
  letter-spacing:${isRTL ? "0.02em" : "0.06em"};
}
.header-rule{
  width:min(420px,70%);height:1px;margin:10px auto 0;
  background:linear-gradient(90deg,transparent,${GOLD_LIGHT} 22%,${GOLD} 50%,${GOLD_LIGHT} 78%,transparent);
}
.academy-badge{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  margin-top:10px;
  padding:5px 16px;
  border:1px solid rgba(197,160,89,.5);
  border-radius:20px;
  font-size:${isRTL ? "9px" : "8px"};
  font-weight:700;
  color:${BLUE};
  letter-spacing:${isRTL ? "0.03em" : "0.1em"};
  text-transform:${isRTL ? "none" : "uppercase"};
  background:rgba(255,255,255,.55);
  box-shadow:0 1px 4px rgba(40,96,157,.06);
}
.academy-badge svg{flex-shrink:0}

/* ── Body zone (name unchanged) ── */
.cert-main{
  flex:1;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  width:100%;
  max-width:760px;
  padding:20px 20px 16px;
}

.name-stage{
  position:relative;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  text-align:center;
  padding:0;
}
.awarded{
  position:relative;z-index:1;
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  font-size:${isRTL ? "12px" : "9px"};
  color:#7a8a9a;
  letter-spacing:${isRTL ? "0.04em" : "0.22em"};
  text-transform:${isRTL ? "none" : "uppercase"};
  margin-bottom:14px;
  font-weight:600;
}
.name-accent{
  position:relative;z-index:1;
  width:min(600px,92%);height:2px;
  background:linear-gradient(90deg,transparent,#c5a059 8%,#d4af37 50%,#c5a059 92%,transparent);
}
.name-accent-top{margin-bottom:14px}
.name-accent-bottom{margin-top:14px}

.name{
  position:relative;z-index:1;
  font-family:${nameF};
  font-size:${isRTL ? "72px" : "74px"};
  font-weight:700;
  color:${BLUE};
  line-height:1.05;
  width:100%;
  text-align:center;
  display:block;
  margin:0 auto;
  padding:4px 12px;
  direction:${t.dir};
  unicode-bidi:plaintext;
  text-shadow:0 1px 0 rgba(255,255,255,.95),0 3px 20px rgba(40,96,157,.1);
  letter-spacing:${isRTL ? "0" : ".5px"};
}

.body-score{
  flex-shrink:0;
  display:flex;flex-direction:column;align-items:center;
  margin:16px auto 18px;
  position:relative;z-index:1;
  padding:4px 8px 2px;
}
.score-donut{line-height:0;display:block;filter:drop-shadow(0 4px 12px rgba(40,96,157,.12))}
.score-cap{
  font-size:${isRTL ? "9px" : "8px"};
  color:${BLUE};
  margin-top:8px;
  letter-spacing:${isRTL ? "0.02em" : "0.12em"};
  text-transform:${isRTL ? "none" : "uppercase"};
  font-weight:700;
  opacity:.75;
}

.body-tx{
  flex-shrink:0;
  position:relative;z-index:1;
  font-size:${isRTL ? "12.5px" : "10.5px"};
  color:#445063;
  line-height:1.88;
  max-width:660px;
  margin:0 auto;
  padding:0 8px;
  text-align:center;
}

/* ── Footer zone ── */
.footer-band{
  flex-shrink:0;
  width:100%;
  max-width:760px;
  padding:10px 24px 4px;
  margin-top:0;
}
.footer-ornament{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  margin-bottom:14px;
}
.footer-ornament-line{
  flex:1;
  max-width:220px;
  height:1px;
  background:linear-gradient(90deg,transparent,${GOLD_LIGHT} 35%,${GOLD} 50%,${GOLD_LIGHT} 65%,transparent);
}
.footer-ornament-star{
  line-height:0;
  flex-shrink:0;
  opacity:.92;
}
.footer-grid{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:32px;
  width:100%;
  direction:${isRTL ? "rtl" : "ltr"};
}
.footer-block{
  display:flex;
  flex-direction:column;
  gap:2px;
  min-width:0;
}
.footer-issuer{
  align-items:${isRTL ? "flex-end" : "flex-start"};
  text-align:${isRTL ? "right" : "left"};
}
.footer-date{
  align-items:${isRTL ? "flex-start" : "flex-end"};
  text-align:${isRTL ? "left" : "right"};
}
.footer-lbl{
  font-size:${isRTL ? "8px" : "7px"};
  color:#8b95a3;
  line-height:1.1;
  letter-spacing:${isRTL ? "0" : "0.14em"};
  text-transform:${isRTL ? "none" : "uppercase"};
  font-weight:700;
}
.footer-val{
  font-size:${isRTL ? "13px" : "11px"};
  font-weight:700;
  color:${BLUE};
  line-height:1.2;
  letter-spacing:${isRTL ? "0" : "0.02em"};
}
.footer-ref{
  margin-top:10px;
  text-align:center;
  font-size:6.5px;
  color:#a0aab4;
  letter-spacing:1.1px;
  font-family:'Lato',sans-serif;
  opacity:.85;
}
</style>
</head>
<body>
<div class="page">

  <div class="frame-outer"></div>
  <div class="frame-gap"></div>
  <div class="frame-inner"></div>

  <div class="corner c-tl">${cornerBracket("tl")}</div>
  <div class="corner c-tr">${cornerBracket("tr")}</div>
  <div class="corner c-bl">${cornerBracket("bl")}</div>
  <div class="corner c-br">${cornerBracket("br")}</div>

  <div class="cert">
    <div class="cert-wm"><img src="${logo}" alt=""></div>
    <div class="cert-stack">
    <header class="cert-header">
      <img class="logo-hero" src="${logo}" alt="Averda">
      <div class="title-row">
        ${titleStar("L")}
        <h1 class="main-title">${t.mainTitle}</h1>
        ${titleStar("R")}
      </div>
      <div class="header-rule"></div>
      <div class="academy-badge">${iconAward}<span>${t.academy}</span></div>
    </header>

    <section class="cert-main">
      <div class="name-stage">
        <p class="awarded">${iconAward}<span>${t.awardedTo}</span></p>
        <div class="name-accent name-accent-top"></div>
        <div class="name">${opts.recipientName}</div>
        <div class="name-accent name-accent-bottom"></div>
      </div>
      <div class="body-score">
        <span class="score-donut">${scoreDonutSVG}</span>
        <span class="score-cap">${t.scoreLabel}</span>
      </div>
      <p class="body-tx">${bodyTx}</p>
    </section>

    <div class="footer-band">
      <div class="footer-ornament">
        <span class="footer-ornament-line"></span>
        <span class="footer-ornament-star">${footerStar}</span>
        <span class="footer-ornament-line"></span>
      </div>
      <div class="footer-grid">
        <div class="footer-block footer-issuer">
          <span class="footer-lbl">${t.from}</span>
          <span class="footer-val">${t.company}</span>
        </div>
        <div class="footer-block footer-date">
          <span class="footer-lbl">${t.dateLabel}</span>
          <span class="footer-val">${dateStr}</span>
        </div>
      </div>
      <p class="footer-ref">${certId}</p>
    </div>
    </div>
  </div>

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

  // Always render fresh — avoids serving a PDF from a previous server process / template.
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
