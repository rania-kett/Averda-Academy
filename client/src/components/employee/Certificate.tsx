import { useEffect, useRef, useState } from "react";
import type { jsPDF } from "jspdf";
import AverdaLogoUrl from "@/assets/averda_logo.png";
import { generateCertificate } from "@/utils/generateCertificate";
import {
  buildCertificateHtml,
  buildCertificateId,
  CERT_HEIGHT_PX,
  CERT_WIDTH_PX,
  injectCertificateStyles,
  type CertificateTemplateData,
} from "@/utils/certificateTemplate";

export type CertificateProps = {
  employeeName: string;
  role: string;
  programName?: string;
  score: number;
  date: string;
  certId?: string;
  /** Show inline preview (scaled). Default false — export-only use cases hide it. */
  showPreview?: boolean;
  /** Show PDF download button. Default true. */
  showExport?: boolean;
  className?: string;
};

function safeFileName(name: string): string {
  return (name || "employee").replace(/[\\/:*?"<>|]/g, "-").trim();
}

async function downloadPdf(doc: jsPDF, fileName: string): Promise<void> {
  try {
    const maybePromise = doc.save(fileName, { returnPromise: true });
    if (maybePromise instanceof Promise) {
      await maybePromise;
      return;
    }
  } catch {
    // fall through to blob download
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function logoToDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(AverdaLogoUrl);
    const blob = await res.blob();
    const img = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export function Certificate({
  employeeName,
  role,
  programName,
  score,
  date,
  certId,
  showPreview = false,
  showExport = true,
  className = "",
}: CertificateProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const resolvedCertId = certId ?? buildCertificateId(employeeName, date);

  useEffect(() => {
    if (!showPreview || !previewRef.current) return;

    let cancelled = false;

    (async () => {
      injectCertificateStyles();
      const watermarkDataUrl = await logoToDataUrl();
      if (cancelled || !previewRef.current) return;

      const data: CertificateTemplateData = {
        name: employeeName,
        role,
        programName,
        avgScore: score,
        completionDate: date,
        watermarkDataUrl,
        certificateId: resolvedCertId,
      };

      previewRef.current.innerHTML = buildCertificateHtml(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [employeeName, role, programName, score, date, resolvedCertId, showPreview]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const doc = await generateCertificate({
        name: employeeName,
        role,
        programName,
        avgScore: score,
        completionDate: date,
        certificateId: resolvedCertId,
      });
      const fileName = `certificate-${safeFileName(employeeName)}-averda.pdf`;
      await downloadPdf(doc, fileName);
    } catch (err) {
      console.error("Certificate export failed:", err);
      window.alert("تعذّر إنشاء الشهادة. حاول مرة أخرى.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={className}>
      {showPreview && (
        <div
          className="overflow-hidden rounded-xl border border-[#C9A227]/40 bg-[#FDFAF3] shadow-sm"
          aria-hidden={!showPreview}
        >
          <div
            style={{
              width: CERT_WIDTH_PX,
              height: CERT_HEIGHT_PX,
              transform: "scale(0.42)",
              transformOrigin: "top left",
            }}
          >
            <div ref={previewRef} />
          </div>
        </div>
      )}

      {showExport && (
        <button
          type="button"
          disabled={exporting}
          onClick={handleExport}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#C9A227] bg-[#FDFAF3] px-4 py-3 text-[15px] font-extrabold text-[#003366] shadow-sm transition hover:bg-[#F5F0E8] active:scale-[0.98] disabled:opacity-70"
        >
          🏆 {exporting ? "جاري إنشاء الشهادة..." : "تحميل الشهادة PDF"}
        </button>
      )}
    </div>
  );
}
