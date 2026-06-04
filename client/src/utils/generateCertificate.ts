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
  injectCertificateStyles,
  type CertificateTemplateData,
} from "@/utils/certificateTemplate";

export type EmployeeCertificateInput = {
  name: string;
  role: string;
  programName?: string;
  avgScore: number;
  completionDate: string; // ISO string
  certificateId?: string;
};

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap";

const NOTO_FONT_LINK_ID = "averda-certificate-noto-fonts";

async function imageUrlToDataUrl(url: string, whiteSilhouette = false): Promise<string | null> {
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
    if (whiteSilhouette) {
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
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
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

async function ensureCertificateFonts(): Promise<void> {
  if (!document.getElementById(NOTO_FONT_LINK_ID)) {
    const link = document.createElement("link");
    link.id = NOTO_FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
    await new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve();
      setTimeout(resolve, 3000);
    });
  }

  const fonts = document.fonts;
  if (!fonts?.load) return;
  await Promise.all([
    fonts.load('700 40px "Noto Naskh Arabic"'),
    fonts.load('400 34px "Noto Naskh Arabic"'),
    fonts.load('600 16px "Noto Naskh Arabic"'),
    fonts.load('700 36px "Inter"'),
    fonts.load('500 14px "Inter"'),
    fonts.load('700 11px "Courier New"'),
  ]).catch(() => undefined);
  if (fonts.ready) await fonts.ready;
  await new Promise((r) => setTimeout(r, 350));
}

function forceLightModeOnClone(clonedDoc: Document): void {
  const html = clonedDoc.documentElement;
  const body = clonedDoc.body;
  html.classList.remove("dark");
  html.style.colorScheme = "light";
  html.style.background = "#FDFAF3";
  body.style.colorScheme = "light";
  body.style.background = "#FDFAF3";
  body.style.color = "#003366";

  if (!clonedDoc.getElementById(CERTIFICATE_STYLE_ELEMENT_ID)) {
    const style = clonedDoc.createElement("style");
    style.id = CERTIFICATE_STYLE_ELEMENT_ID;
    style.textContent = CERTIFICATE_CSS;
    clonedDoc.head.appendChild(style);
  }

  if (!clonedDoc.getElementById(NOTO_FONT_LINK_ID)) {
    const link = clonedDoc.createElement("link");
    link.id = NOTO_FONT_LINK_ID;
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
    "left:0",
    "top:0",
    `width:${CERT_WIDTH_PX}px`,
    `height:${CERT_HEIGHT_PX}px`,
    "max-width:" + CERT_WIDTH_PX + "px",
    "max-height:" + CERT_HEIGHT_PX + "px",
    "overflow:hidden",
    "color-scheme:light",
    "background:#FDFAF3",
    "z-index:2147483646",
    "pointer-events:none",
  ].join(";");

  host.innerHTML = html;
  document.body.appendChild(host);

  const root = host.querySelector(".cert-root") as HTMLElement | null;
  if (!root) {
    host.remove();
    throw new Error("Certificate template failed to mount");
  }

  root.style.colorScheme = "light";
  root.style.background = "#FDFAF3";

  return { host, root };
}

async function captureWithHtml2Canvas(root: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(root, {
    backgroundColor: "#FDFAF3",
    scale: 2,
    width: CERT_WIDTH_PX,
    height: CERT_HEIGHT_PX,
    useCORS: true,
    allowTaint: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 20000,
    windowWidth: CERT_WIDTH_PX,
    windowHeight: CERT_HEIGHT_PX,
    onclone: forceLightModeOnClone,
  });
}

function ensureSingleLandscapePage(doc: jsPDF): jsPDF {
  const total = doc.getNumberOfPages();
  for (let p = total; p > 1; p--) {
    doc.deletePage(p);
  }
  doc.setPage(1);
  return doc;
}

function addCanvasToPdf(doc: jsPDF, canvas: HTMLCanvasElement): jsPDF {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  if (canvas.width < 100 || canvas.height < 100) {
    throw new Error("Certificate capture produced an empty image");
  }

  try {
    doc.addImage(canvas, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
  } catch {
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
  }

  return ensureSingleLandscapePage(doc);
}

export async function generateCertificate(employee: EmployeeCertificateInput): Promise<jsPDF> {
  injectCertificateStyles();
  await ensureCertificateFonts();

  const watermarkDataUrl = await imageUrlToDataUrl(AverdaLogoUrl, true);
  const templateData: CertificateTemplateData = {
    name: employee.name,
    role: employee.role,
    programName: employee.programName,
    avgScore: employee.avgScore,
    completionDate: employee.completionDate,
    watermarkDataUrl,
    certificateId: employee.certificateId ?? buildCertificateId(employee.name, employee.completionDate),
  };

  const html = buildCertificateHtml(templateData);
  const { host, root } = mountCertificateElement(html);

  try {
    await waitForImages(root);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await captureWithHtml2Canvas(root);
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
      compress: true,
    });
    return addCanvasToPdf(doc, canvas);
  } finally {
    host.remove();
  }
}
