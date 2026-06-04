/** Luxury A4 landscape certificate HTML for html2canvas → jsPDF export. */

export type CertificateTemplateData = {
  name: string;
  role: string;
  programName?: string;
  avgScore: number;
  completionDate: string; // ISO
  watermarkDataUrl?: string | null;
  certificateId?: string;
};

export type CertificateDimensions = {
  width: number;
  height: number;
};

export const CERT_WIDTH_PX = 1122;
export const CERT_HEIGHT_PX = 794;
export const CERT_HEADER_HEIGHT_PX = 80;
export const CERT_BODY_HEIGHT_PX = CERT_HEIGHT_PX - CERT_HEADER_HEIGHT_PX;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** DD/MM/YYYY — e.g. 02/06/2026 */
export function formatCertificateDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function buildCertificateId(name: string, completionDate: string): string {
  const d = new Date(completionDate);
  const year = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % 100000;
  const seq = String(10000 + (hash % 90000)).padStart(5, "0");
  return `AVD-${year}-${seq}`;
}

/** Injected into document.head — isolated from app dark mode. */
export const CERTIFICATE_STYLE_ELEMENT_ID = "averda-certificate-styles";

export const CERTIFICATE_CSS = `
  [data-certificate-export],
  [data-certificate-export] *,
  .cert-root,
  .cert-root * {
    color-scheme: light !important;
  }

  .cert-root {
    display: block;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    width: ${CERT_WIDTH_PX}px;
    height: ${CERT_HEIGHT_PX}px;
    max-width: ${CERT_WIDTH_PX}px;
    max-height: ${CERT_HEIGHT_PX}px;
    overflow: hidden;
    background: #FDFAF3 !important;
    color: #003366 !important;
    font-family: "Inter", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .cert-root * {
    box-sizing: border-box;
  }

  .cert-ar {
    font-family: "Noto Naskh Arabic", serif !important;
  }
  .cert-en {
    font-family: "Inter", Arial, sans-serif !important;
    direction: ltr;
    unicode-bidi: isolate;
  }

  .cert-sheet {
    width: ${CERT_WIDTH_PX}px;
    height: ${CERT_HEIGHT_PX}px;
    position: relative;
    overflow: hidden;
    background: #FDFAF3 !important;
    background-image:
      radial-gradient(rgba(0, 51, 102, 0.025) 0.6px, transparent 0.6px),
      linear-gradient(180deg, #FDFAF3 0%, #FAF6EE 100%);
    background-size: 4px 4px, 100% 100%;
  }

  .cert-frame-outer {
    position: absolute;
    top: 14px;
    left: 14px;
    right: 14px;
    bottom: 14px;
    border: 2px solid #C9A227;
    pointer-events: none;
    background: transparent !important;
  }
  .cert-frame-inner {
    position: absolute;
    top: 22px;
    left: 22px;
    right: 22px;
    bottom: 22px;
    border: 0.5px dashed #C9A227;
    pointer-events: none;
    background: transparent !important;
  }
  .cert-corner {
    position: absolute;
    z-index: 2;
    pointer-events: none;
  }

  .cert-header {
    height: ${CERT_HEADER_HEIGHT_PX}px;
    background: #003366 !important;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0 28px;
    direction: ltr;
    overflow: hidden;
  }
  .cert-header-logo-wrap {
    width: 180px;
    flex-shrink: 0;
    background: transparent !important;
  }
  .cert-header-logo {
    height: 40px;
    width: auto;
    max-width: 160px;
    object-fit: contain;
    opacity: 0.95;
    background: transparent !important;
  }
  .cert-header-logo-fallback {
    font-family: "Inter", Arial, sans-serif;
    font-weight: 800;
    font-size: 18px;
    letter-spacing: 0.12em;
    color: #ffffff !important;
    background: transparent !important;
  }
  .cert-header-title {
    flex: 1;
    text-align: center;
    line-height: 1.35;
    background: transparent !important;
  }
  .cert-header-title .cert-ar {
    font-size: 20px;
    font-weight: 700;
    color: #C9A227 !important;
  }
  .cert-header-title .cert-en {
    display: block;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.22em;
    color: #C9A227 !important;
    margin-top: 2px;
  }
  .cert-header-id {
    width: 180px;
    flex-shrink: 0;
    text-align: right;
    font-family: "Courier New", Courier, monospace;
    font-size: 11px;
    font-weight: 700;
    color: #C9A227 !important;
    letter-spacing: 0.06em;
    background: transparent !important;
  }

  .cert-body-wrap {
    width: ${CERT_WIDTH_PX}px;
    height: ${CERT_BODY_HEIGHT_PX}px;
    max-height: ${CERT_BODY_HEIGHT_PX}px;
    padding: 18px 40px 14px;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
    overflow: hidden;
    background: #FDFAF3 !important;
  }

  .cert-subtitle-en {
    text-align: center;
    font-family: "Inter", Arial, sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: #C9A227 !important;
    margin: 0 0 6px;
    direction: ltr;
    background: transparent !important;
  }
  .cert-title-ar {
    text-align: center;
    font-size: 34px;
    font-weight: 700;
    color: #003366 !important;
    margin: 0 0 8px;
    line-height: 1.2;
    background: transparent !important;
  }

  .cert-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 6px auto 10px;
    width: 480px;
    max-width: 85%;
    background: transparent !important;
  }
  .cert-divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #C9A227, transparent);
  }
  .cert-divider-gem {
    margin: 0 12px;
    flex-shrink: 0;
  }

  .cert-main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    overflow: hidden;
    background: transparent !important;
  }

  .cert-witness {
    font-size: 13px;
    font-style: italic;
    color: #6B7280 !important;
    margin: 0 0 8px;
    background: transparent !important;
  }
  .cert-witness .cert-en { font-style: italic; }

  .cert-recipient {
    font-size: 40px;
    font-weight: 700;
    color: #003366 !important;
    margin: 0 0 10px;
    line-height: 1.15;
    padding-bottom: 6px;
    border-bottom: 3px solid #C9A227;
    display: inline-block;
    max-width: 92%;
    background: transparent !important;
  }
  .cert-role-badge {
    display: inline-block;
    padding: 6px 20px;
    border-radius: 999px;
    background: #003366 !important;
    color: #C9A227 !important;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 10px;
    background-color: #003366 !important;
  }
  .cert-statement {
    font-family: "Inter", Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #374151 !important;
    margin: 0 0 8px;
    max-width: 640px;
    line-height: 1.45;
    direction: ltr;
    background: transparent !important;
  }
  .cert-statement-ar {
    font-size: 13px;
    color: #6B7280 !important;
    margin: 0 0 12px;
    background: transparent !important;
  }
  .cert-program-box {
    width: 600px;
    max-width: 92%;
    padding: 10px 20px;
    border: 2px solid #C9A227;
    background: #F5F0E8 !important;
    margin-bottom: 12px;
  }
  .cert-program-label {
    font-family: "Inter", Arial, sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #C9A227 !important;
    margin-bottom: 4px;
    direction: ltr;
    background: transparent !important;
  }
  .cert-program-name {
    font-size: 16px;
    font-weight: 700;
    color: #003366 !important;
    line-height: 1.4;
    background: transparent !important;
  }

  .cert-score-row {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 4px 0 10px;
    width: 440px;
    max-width: 88%;
    direction: ltr;
    background: transparent !important;
  }
  .cert-score-flank {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #C9A227);
  }
  .cert-score-flank:last-child {
    background: linear-gradient(90deg, #C9A227, transparent);
  }
  .cert-score-block {
    text-align: center;
    flex-shrink: 0;
    margin: 0 16px;
    background: transparent !important;
  }
  .cert-score-value {
    font-family: "Inter", Arial, sans-serif;
    font-size: 36px;
    font-weight: 700;
    color: #003366 !important;
    line-height: 1;
    background: transparent !important;
  }
  .cert-score-label {
    font-family: "Inter", Arial, sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #C9A227 !important;
    margin-top: 2px;
    background: transparent !important;
  }

  .cert-footer {
    flex-shrink: 0;
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    padding-top: 8px;
    margin-top: auto;
    width: 100%;
    overflow: hidden;
    background: transparent !important;
  }
  .cert-footer-left {
    width: 30%;
    text-align: left;
    direction: ltr;
    background: transparent !important;
  }
  .cert-date-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    background: transparent !important;
  }
  .cert-date-row svg {
    margin-right: 8px;
    flex-shrink: 0;
  }
  .cert-date-value {
    font-family: "Inter", Arial, sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #003366 !important;
    background: transparent !important;
  }
  .cert-id-chip {
    display: inline-block;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid #E5D4A1;
    background: #F5F0E8 !important;
    font-family: "Courier New", Courier, monospace;
    font-size: 10px;
    font-weight: 700;
    color: #003366 !important;
    letter-spacing: 0.04em;
  }
  .cert-footer-center {
    width: 34%;
    text-align: center;
    background: transparent !important;
  }
  .cert-seal {
    width: 80px;
    height: 80px;
  }
  .cert-verified-label {
    font-family: "Inter", Arial, sans-serif;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #003366 !important;
    margin-top: 2px;
    background: transparent !important;
  }
  .cert-footer-right {
    width: 30%;
    text-align: right;
    direction: ltr;
    background: transparent !important;
  }
  .cert-signature-svg {
    display: block;
    margin: 0 0 4px auto;
  }
  .cert-signature-rule {
    width: 160px;
    height: 0;
    border: none;
    border-top: 2px solid #C9A227;
    margin: 0 0 6px auto;
    background: transparent !important;
  }
  .cert-signature-title {
    font-size: 13px;
    font-weight: 800;
    color: #003366 !important;
    text-align: right;
    background: transparent !important;
  }
  .cert-signature-sub {
    font-family: "Inter", Arial, sans-serif;
    font-size: 10px;
    color: #6B7280 !important;
    margin-top: 2px;
    text-align: right;
    background: transparent !important;
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

function cornerFlourish(position: "tl" | "tr" | "bl" | "br"): string {
  const rotate =
    position === "tr" ? "rotate(90)" : position === "bl" ? "rotate(-90)" : position === "br" ? "rotate(180)" : "";
  const style =
    position === "tl"
      ? "top:18px;left:18px"
      : position === "tr"
        ? "top:18px;right:18px"
        : position === "bl"
          ? "bottom:18px;left:18px"
          : "bottom:18px;right:18px";
  return `
    <svg class="cert-corner" style="${style}" width="48" height="48" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="${rotate ? `translate(56,0) ${rotate}` : ""}">
        <path d="M4 4 H28 V8 H8 V28 H4 Z" fill="#C9A227" opacity="0.95"/>
        <path d="M12 12 H20 V16 H16 V20 H12 Z" fill="#003366" opacity="0.35"/>
        <path d="M4 32 Q4 4 32 4" stroke="#C9A227" stroke-width="1.2" fill="none" opacity="0.7"/>
        <circle cx="6" cy="6" r="2" fill="#C9A227"/>
      </g>
    </svg>`;
}

function dividerOrnament(): string {
  return `
    <div class="cert-divider" aria-hidden="true">
      <span class="cert-divider-line"></span>
      <svg class="cert-divider-gem" width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 1 L17 9 L9 17 L1 9 Z" fill="#C9A227" stroke="#003366" stroke-width="0.6"/>
      </svg>
      <span class="cert-divider-line"></span>
    </div>`;
}

function officialSeal(): string {
  return `
    <svg class="cert-seal" width="80" height="80" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="48" cy="48" r="44" fill="#FDFAF3" stroke="#C9A227" stroke-width="3"/>
      <circle cx="48" cy="48" r="36" fill="none" stroke="#003366" stroke-width="1.5" stroke-dasharray="4 3"/>
      ${Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x1 = 48 + Math.cos(a) * 28;
        const y1 = 48 + Math.sin(a) * 28;
        const x2 = 48 + Math.cos(a) * 38;
        const y2 = 48 + Math.sin(a) * 38;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#C9A227" stroke-width="1.2"/>`;
      }).join("")}
      <polygon points="48,34 52,44 63,44 54,51 57,62 48,55 39,62 42,51 33,44 44,44" fill="#003366" opacity="0.9"/>
    </svg>`;
}

function signatureSvg(): string {
  return `
    <svg class="cert-signature-svg" width="160" height="36" viewBox="0 0 180 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 32 C28 8, 52 40, 72 22 S112 36, 132 18 S158 28, 172 14" stroke="#003366" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.55"/>
    </svg>`;
}

function calendarIcon(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#C9A227" stroke-width="1.2"/>
      <path d="M2 6.5 H14" stroke="#C9A227" stroke-width="1.2"/>
      <path d="M5 2 V4.5 M11 2 V4.5" stroke="#C9A227" stroke-width="1.2" stroke-linecap="round"/>
    </svg>`;
}

/** Split "Arabic — English" program titles for correct fonts per script. */
function programNameHtml(raw: string): string {
  const sep = raw.includes(" — ") ? " — " : raw.includes(" - ") ? " - " : null;
  if (!sep) {
    return `<span class="cert-ar" lang="ar" dir="rtl">${escapeHtml(raw)}</span>`;
  }
  const [ar, en] = raw.split(sep);
  return `<span class="cert-ar" lang="ar" dir="rtl">${escapeHtml(ar.trim())}</span><span class="cert-en" lang="en" dir="ltr">${sep}${escapeHtml(en.trim())}</span>`;
}

export function buildCertificateHtml(
  data: CertificateTemplateData,
  dims: CertificateDimensions = { width: CERT_WIDTH_PX, height: CERT_HEIGHT_PX }
): string {
  const w = dims.width;
  const h = dims.height;
  const name = escapeHtml(data.name);
  const role = escapeHtml(data.role);
  const programRaw =
    data.programName ?? "برنامج السلامة والامتثال — Driver Safety & Compliance Onboarding";
  const score = Math.round(data.avgScore);
  const dateSlash = formatCertificateDate(data.completionDate);
  const certId = escapeHtml(data.certificateId ?? buildCertificateId(data.name, data.completionDate));

  const logo = data.watermarkDataUrl
    ? `<div class="cert-header-logo-wrap"><img class="cert-header-logo" src="${data.watermarkDataUrl}" alt="Averda" /></div>`
    : `<div class="cert-header-logo-wrap"><div class="cert-header-logo-fallback">AVERDA</div></div>`;

  return `
<article class="cert-root" lang="ar" style="width:${w}px;height:${h}px;max-width:${w}px;max-height:${h}px;overflow:hidden;color-scheme:light;background:#FDFAF3;">
  <div class="cert-sheet" style="background:#FDFAF3;">
    <div class="cert-frame-outer"></div>
    <div class="cert-frame-inner"></div>
    ${cornerFlourish("tl")}
    ${cornerFlourish("tr")}
    ${cornerFlourish("bl")}
    ${cornerFlourish("br")}

    <header class="cert-header" style="background:#003366;">
      ${logo}
      <div class="cert-header-title">
        <span class="cert-ar" lang="ar" dir="rtl">أفيردا أكاديمي</span>
        <span class="cert-en" lang="en" dir="ltr">AVERDA ACADEMY</span>
      </div>
      <div class="cert-header-id">${certId}</div>
    </header>

    <div class="cert-body-wrap" style="background:#FDFAF3;">
      <div class="cert-subtitle-en">Certificate of Completion</div>
      <h1 class="cert-title-ar cert-ar" lang="ar" dir="rtl">شهادة إتمام التدريب</h1>
      ${dividerOrnament()}

      <div class="cert-main">
        <p class="cert-witness">
          <span class="cert-en" lang="en" dir="ltr">This is to certify that</span>
          <span class="cert-ar" lang="ar" dir="rtl"> / يُشهد بأن</span>
        </p>
        <h2 class="cert-recipient cert-ar" lang="ar" dir="rtl">${name}</h2>
        <span class="cert-role-badge cert-ar" lang="ar" dir="rtl">${role}</span>
        <p class="cert-statement cert-en" lang="en" dir="ltr">has successfully completed all required training courses</p>
        <p class="cert-statement-ar cert-ar" lang="ar" dir="rtl">قد أتم / أتمت جميع الدورات التدريبية المطلوبة بنجاح</p>

        <div class="cert-program-box" style="background:#F5F0E8;">
          <div class="cert-program-label">Training Program</div>
          <div class="cert-program-name">${programNameHtml(programRaw)}</div>
        </div>

        <div class="cert-score-row" role="img" aria-label="Final score ${score} percent">
          <span class="cert-score-flank"></span>
          <div class="cert-score-block">
            <div class="cert-score-value">${score}%</div>
            <div class="cert-score-label">Final Score</div>
          </div>
          <span class="cert-score-flank"></span>
        </div>
      </div>

      ${dividerOrnament()}

      <footer class="cert-footer">
        <div class="cert-footer-left">
          <div class="cert-date-row">
            ${calendarIcon()}
            <span class="cert-date-value">${dateSlash}</span>
          </div>
          <span class="cert-id-chip">${certId}</span>
        </div>

        <div class="cert-footer-center">
          ${officialSeal()}
          <div class="cert-verified-label">VERIFIED</div>
        </div>

        <div class="cert-footer-right">
          ${signatureSvg()}
          <hr class="cert-signature-rule" />
          <div class="cert-signature-title cert-ar" lang="ar" dir="rtl">مدير الأكاديمي</div>
          <div class="cert-signature-sub cert-en" lang="en" dir="ltr">Academy Director — Averda</div>
        </div>
      </footer>
    </div>
  </div>
</article>
`.trim();
}
