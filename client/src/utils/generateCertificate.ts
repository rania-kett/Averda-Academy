import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import AverdaLogoUrl from "@/assets/averda_logo.png";
import {
  buildCertificateHtml,
  buildCertificateId,
  CERTIFICATE_CSS,
  CERTIFICATE_STYLE_ELEMENT_ID,
  CERT_HEIGHT_PX,
  CERT_WIDTH_PX,
  getCertificateCopyForRaster,
  injectCertificateStyles,
  resolveCertificateLocale,
  type CertificateLocale,
  type CertificateTemplateData,
} from "@/utils/certificateTemplate";
import { rasterizeArabicCertificate } from "@/utils/certificateTextRaster";

export type EmployeeCertificateInput = {
  name: string;
  role: string;
  programName?: string;
  avgScore: number;
  completionDate: string;
  certificateId?: string;
  locale?: CertificateLocale;
};

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Great+Vibes&family=Inter:wght@400;700;800&family=Noto+Sans+Arabic:wght@400;600;700&family=Playfair+Display:wght@400&display=swap";

const FONT_LINK_ID = "averda-certificate-fonts";

async function imageUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          const done = () => resolve();
          if (img.complete && img.naturalWidth > 0) {
            done();
            return;
          }
          img.onload = done;
          img.onerror = done;
          if (img.decode) void img.decode().then(done).catch(done);
        })
    )
  );
}

async function ensureCertificateFonts(): Promise<void> {
  if (!document.getElementById(FONT_LINK_ID)) {
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
    await new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve();
      setTimeout(resolve, 3500);
    });
  }
  const fonts = document.fonts;
  if (!fonts?.load) return;
  await Promise.all([
    fonts.load('700 100px "Amiri"'),
    fonts.load('700 48px "Amiri"'),
    fonts.load('400 14px "Noto Sans Arabic"'),
    fonts.load('600 15px "Noto Sans Arabic"'),
    fonts.load('400 50px "Great Vibes"'),
    fonts.load('400 13px "Playfair Display"'),
    fonts.load('800 100px "Inter"'),
  ]).catch(() => undefined);
  if (fonts.ready) await fonts.ready;
  await new Promise((r) => setTimeout(r, 800));
}

function forceLightModeOnClone(clonedDoc: Document): void {
  clonedDoc.documentElement.classList.remove("dark");
  clonedDoc.documentElement.style.background = "#ffffff";
  clonedDoc.body.style.background = "#ffffff";
  clonedDoc.body.style.color = "#111111";

  if (!clonedDoc.getElementById(CERTIFICATE_STYLE_ELEMENT_ID)) {
    const style = clonedDoc.createElement("style");
    style.id = CERTIFICATE_STYLE_ELEMENT_ID;
    style.textContent = CERTIFICATE_CSS;
    clonedDoc.head.appendChild(style);
  }
  if (!clonedDoc.getElementById(FONT_LINK_ID)) {
    const link = clonedDoc.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    clonedDoc.head.appendChild(link);
  }
}

function mountCertificateElement(html: string): { host: HTMLDivElement; root: HTMLElement } {
  const host = document.createElement("div");
  host.setAttribute("data-certificate-export", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-9999px",
    "top:0",
    `width:${CERT_WIDTH_PX}px`,
    `height:${CERT_HEIGHT_PX}px`,
    "overflow:visible",
    "background:#ffffff",
    "z-index:-1",
  ].join(";");

  host.innerHTML = html;
  document.body.appendChild(host);

  const root = host.querySelector(".cert-root") as HTMLElement | null;
  if (!root) {
    host.remove();
    throw new Error("Certificate template failed to mount");
  }
  return { host, root };
}

async function captureCertificate(root: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(root, {
    backgroundColor: "#ffffff",
    scale: 2.5,
    width: CERT_WIDTH_PX,
    height: CERT_HEIGHT_PX,
    useCORS: true,
    allowTaint: true,
    logging: false,
    onclone: forceLightModeOnClone,
  });
}

async function buildTemplateData(
  employee: EmployeeCertificateInput,
  watermarkDataUrl: string | null
): Promise<CertificateTemplateData> {
  const locale = resolveCertificateLocale(employee.locale);
  const issueDate = new Date().toISOString();
  const base: CertificateTemplateData = {
    name: employee.name,
    role: employee.role,
    programName: employee.programName,
    avgScore: employee.avgScore,
    completionDate: employee.completionDate,
    issueDate,
    watermarkDataUrl,
    certificateId: employee.certificateId ?? buildCertificateId(employee.name, issueDate),
    locale,
  };
  if (locale === "ar") {
    base.raster = await rasterizeArabicCertificate(getCertificateCopyForRaster(base));
  }
  return base;
}

export async function generateCertificate(employee: EmployeeCertificateInput): Promise<jsPDF> {
  injectCertificateStyles();
  await ensureCertificateFonts();

  const watermarkDataUrl = await imageUrlToDataUrl(AverdaLogoUrl);
  const templateData = await buildTemplateData(employee, watermarkDataUrl);
  const html = buildCertificateHtml(templateData);
  const { host, root } = mountCertificateElement(html);

  try {
    await waitForImages(root);
    await new Promise((r) => setTimeout(r, 400));

    const canvas = await captureCertificate(root);
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4", compress: true });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const img = canvas.toDataURL("image/png");
    doc.addImage(img, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
    return doc;
  } finally {
    host.remove();
  }
}

export async function buildCertificatePreviewHtml(employee: EmployeeCertificateInput): Promise<string> {
  injectCertificateStyles();
  await ensureCertificateFonts();
  const watermarkDataUrl = await imageUrlToDataUrl(AverdaLogoUrl);
  const templateData = await buildTemplateData(employee, watermarkDataUrl);
  return buildCertificateHtml(templateData);
}
