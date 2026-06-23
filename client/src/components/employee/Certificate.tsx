import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { buildCertificatePreviewHtml, generateCertificate } from "@/utils/generateCertificate";
import {
  buildCertificateId,
  CERT_HEIGHT_PX,
  CERT_WIDTH_PX,
  resolveCertificateLocale,
  type CertificateLocale,
} from "@/utils/certificateTemplate";

export type CertificateProps = {
  employeeName: string;
  role: string;
  programName?: string;
  score: number;
  date: string;
  certId?: string;
  locale?: CertificateLocale;
  showPreview?: boolean;
  showExport?: boolean;
  showExportIcon?: boolean;
  className?: string;
  downloadApi?: "user" | "admin";
  userId?: string;
};

function safeFileName(name: string): string {
  return (name || "employee").replace(/[\\/:*?"<>|]/g, "-").trim();
}

async function downloadBlob(blob: Blob, fileName: string): Promise<void> {
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

export function Certificate({
  employeeName,
  role,
  programName,
  score,
  date,
  certId,
  locale,
  showPreview = false,
  showExport = true,
  showExportIcon = true,
  className = "",
}: CertificateProps) {
  const { t } = useTranslation();
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const resolvedCertId = certId ?? buildCertificateId(employeeName, date);
  const resolvedLocale = resolveCertificateLocale(locale);
  const previewScale = 0.42;
  const previewW = Math.round(CERT_WIDTH_PX * previewScale);
  const previewH = Math.round(CERT_HEIGHT_PX * previewScale);

  useEffect(() => {
    if (!showPreview || !previewRef.current) return;

    let cancelled = false;

    (async () => {
      const html = await buildCertificatePreviewHtml({
        name: employeeName,
        role,
        programName,
        avgScore: score,
        completionDate: date,
        certificateId: resolvedCertId,
        locale: resolvedLocale,
      });
      if (cancelled || !previewRef.current) return;
      previewRef.current.innerHTML = html;
    })();

    return () => {
      cancelled = true;
    };
  }, [employeeName, role, programName, score, date, resolvedCertId, resolvedLocale, showPreview]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const fileName = `certificate-${safeFileName(employeeName)}-averda.pdf`;
      const doc = await generateCertificate({
        name: employeeName,
        role,
        programName,
        avgScore: score,
        completionDate: date,
        certificateId: resolvedCertId,
        locale: resolvedLocale,
      });
      const blob = doc.output("blob");
      await downloadBlob(blob, fileName);
    } catch (err) {
      console.error("Certificate export failed:", err);
      window.alert(t("employee.profile.certificateExportFailed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={className}>
      {showPreview && (
        <div
          className="overflow-hidden rounded-xl border border-[#0d2137]/20 bg-white shadow-sm"
          style={{ width: previewW, height: previewH }}
          aria-hidden={!showPreview}
        >
          <div
            style={{
              width: CERT_WIDTH_PX,
              height: CERT_HEIGHT_PX,
              transform: `scale(${previewScale})`,
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
          className={`${showPreview ? "mt-3 " : ""}inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0d2137]/25 bg-white px-4 py-3 text-[15px] font-extrabold text-[#0d2137] shadow-sm transition hover:border-[#5eb8e8]/60 hover:bg-[#f8fbff] active:scale-[0.98] disabled:opacity-70`}
        >
          {showExportIcon ? "🏆 " : null}
          {exporting
            ? t("employee.profile.generatingCertificate")
            : t("employee.profile.downloadCertificate")}
        </button>
      )}
    </div>
  );
}
