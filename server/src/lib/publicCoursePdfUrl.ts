// ─────────────────────────────────────────────────────────────────────────────
// publicCoursePdfUrl.ts
// FIX: effectiveEmployeePdfUrl must return a RELATIVE path like "/courses/..."
//      not "http://localhost:3001/courses/..." which bypasses the Vite proxy.
// ─────────────────────────────────────────────────────────────────────────────
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Absolute path to `client/public/courses` on disk.
 * Adjust the relative path if your folder structure differs.
 */
export function getPublicCoursesDirAbs(): string {
  // server/src/lib/ → server/ → project root → client/public/courses
  return path.resolve(__dirname, "../../../client/public/courses");
}

/**
 * Convert a raw DB pdfUrl into a RELATIVE URL safe for the browser.
 *
 * Rules (in order):
 * 1. If DB has a slug-based relative path like "/courses/..." → return as-is.
 * 2. If DB has an absolute URL (old data) → strip the origin, return path only.
 * 3. If DB value is null/empty → derive from slug: "/courses/<slug>.pdf"
 * 4. Uploads path "/uploads/..." → return as-is (also proxied by Vite).
 *
 * The client's normalizePublicCoursePdfUrl + encodeCoursePdfPath will handle
 * percent-encoding of Arabic/spaces before the fetch call.
 */
export function effectiveEmployeePdfUrl(
  rawPdfUrl: string | null | undefined,
  slug: string | null | undefined
): string {
  const url = rawPdfUrl?.trim() ?? "";

  if (url) {
    // If it's an absolute URL (http://... or https://...) → strip the origin.
    try {
      const parsed = new URL(url);
      // Return just the path — relative to the server, proxied by Vite.
      return parsed.pathname;
    } catch {
      // Not an absolute URL → already relative, use as-is.
      return url;
    }
  }

  // No pdfUrl in DB — derive from slug as a best-effort fallback.
  if (slug) {
    return `/courses/${slug}.pdf`;
  }

  return "";
}