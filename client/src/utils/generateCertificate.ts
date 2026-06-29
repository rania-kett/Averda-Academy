import { jsPDF } from "jspdf";
import { userApi } from "@/api/api";
import AverdaLogoUrl from "@/assets/averda_logo.png";
import {
  buildCertificateHtml,
  buildCertificateId,
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
  "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@500;600;700&family=Great+Vibes&family=Inter:wght@400;700;800&family=Noto+Sans+Arabic:wght@400;600;700&family=Playfair+Display:wght@400&family=Reem+Kufi:wght@500;700&display=swap";

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
    fonts.load('700 51px "Amiri"'),
    fonts.load('700 56px "Amiri"'),
    fonts.load('600 19px "Cairo"'),
    fonts.load('400 17px "Cairo"'),
    fonts.load('700 22px "Amiri"'),
    fonts.load('400 50px "Great Vibes"'),
    fonts.load('400 13px "Playfair Display"'),
    fonts.load('800 46px "Inter"'),
  ]).catch(() => undefined);
  if (fonts.ready) await fonts.ready;
  await new Promise((r) => setTimeout(r, 800));
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

/** @deprecated Use userApi.certificate() / adminApi.certificate() — server Puppeteer PDF only. */
export async function generateCertificate(employee: EmployeeCertificateInput): Promise<jsPDF> {
  const { data } = await userApi.certificate();
  const blob = data as Blob;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `certificate-${(employee.name || "employee").replace(/[\\/:*?"<>|]/g, "-")}-averda.pdf`;
  link.click();
  URL.revokeObjectURL(url);
  throw new Error("Certificate downloaded via server API. jsPDF instance not returned.");
}

export async function buildCertificatePreviewHtml(employee: EmployeeCertificateInput): Promise<string> {
  injectCertificateStyles();
  await ensureCertificateFonts();
  const watermarkDataUrl = await imageUrlToDataUrl(AverdaLogoUrl);
  const templateData = await buildTemplateData(employee, watermarkDataUrl);
  return buildCertificateHtml(templateData);
}
