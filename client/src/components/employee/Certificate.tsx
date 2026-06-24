import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AxiosError } from "axios";
import { adminApi, userApi } from "@/api/api";
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

function downloadFileName(employeeName: string): string {
  const cleaned = (employeeName || "employee").replace(/[\\/:*?"<>|]/g, "-").trim();
  return `certificate-${cleaned}-averda.pdf`;
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

async function fetchCertificatePdf(
  downloadApi: "user" | "admin",
  userId?: string
): Promise<{ blob: Blob; templateVer: string }> {
  const response =
    downloadApi === "admin"
      ? await adminApi.certificate(userId!)
      : await userApi.certificate();

  const blob = response.data as Blob;
  const contentType = String(response.headers["content-type"] ?? "");
  const templateVer = String(response.headers["x-certificate-template"] ?? "");
  if (templateVer) {
    console.info("[certificate] server template:", templateVer);
  }
  if (!contentType.includes("application/pdf")) {
    const text = await blob.text();
    let message = text;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      /* raw text */
    }
    throw new Error(message || "Invalid certificate response");
  }
  if (blob.size < 2048) {
    throw new Error("Certificate file was empty or incomplete");
  }
  return { blob, templateVer };
}

async function logCertificateError(err: unknown): Promise<void> {
  const ax = err as AxiosError<Blob>;
  if (ax.response?.data instanceof Blob) {
    try {
      const text = await ax.response.data.text();
      const parsed = JSON.parse(text) as { message?: string };
      console.error("Certificate export failed:", parsed.message ?? text);
      return;
    } catch {
      console.error("Certificate export failed:", err);
      return;
    }
  }
  console.error("Certificate export failed:", err);
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
  downloadApi = "user",
  userId,
}: CertificateProps) {
  const { t } = useTranslation();
  const previewRef = useRef<HTMLDivElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const resolvedCertId = certId ?? buildCertificateId(employeeName, date);
  const resolvedLocale = resolveCertificateLocale(locale);
  const previewScale = 0.42;
  const previewW = Math.round(CERT_WIDTH_PX * previewScale);
  const previewH = Math.round(CERT_HEIGHT_PX * previewScale);

  useEffect(() => {
    if (!showPreview || !previewRef.current) return;
    if (downloadApi === "admin" && !userId) return;

    let cancelled = false;
    setPreviewLoading(true);

    (async () => {
      try {
        const { blob } = await fetchCertificatePdf(downloadApi, userId);
        if (cancelled || !previewRef.current) return;
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        previewRef.current.innerHTML = `<iframe title="certificate" src="${url}" width="${CERT_WIDTH_PX}" height="${CERT_HEIGHT_PX}" style="border:0;display:block"></iframe>`;
      } catch (err) {
        await logCertificateError(err);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [
    employeeName,
    role,
    programName,
    score,
    date,
    resolvedCertId,
    resolvedLocale,
    showPreview,
    downloadApi,
    userId,
  ]);

  const handleExport = async () => {
    if (exporting) return;
    if (downloadApi === "admin" && !userId) {
      console.error("Certificate export: admin API requires userId");
      window.alert(t("employee.profile.certificateExportFailed"));
      return;
    }
    setExporting(true);
    try {
      const { blob } = await fetchCertificatePdf(downloadApi, userId);
      await downloadBlob(blob, downloadFileName(employeeName));
    } catch (err) {
      await logCertificateError(err);
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
          {previewLoading ? (
            <div
              className="flex h-full items-center justify-center text-[13px] font-semibold text-[#57534E]"
              style={{ width: previewW, height: previewH }}
            >
              {t("employee.profile.generatingCertificate")}
            </div>
          ) : (
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
          )}
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
