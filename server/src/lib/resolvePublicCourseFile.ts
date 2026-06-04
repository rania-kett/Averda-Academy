// ─────────────────────────────────────────────────────────────────────────────
// resolvePublicCourseFile.ts
// FIX: decodeURIComponent the incoming path segment BEFORE joining with the
//      filesystem path. Without this, "%D8%A7%D8%AD..." stays encoded and
//      fs.existsSync() returns false → 404.
// ─────────────────────────────────────────────────────────────────────────────
import path from "path";
import fs from "fs";

/**
 * Safely resolve a public course PDF file path.
 *
 * @param publicCoursesDir  Absolute path to the `client/public/courses` directory.
 * @param rel               Relative path from the request URL (may be URL-encoded).
 * @returns                 Absolute path if file exists and is safe, otherwise null.
 */
export function resolvePublicCourseFile(
  publicCoursesDir: string,
  rel: string
): string | null {
  if (!rel) return null;

  // ── Decode URL encoding (handles Arabic chars + spaces from the browser) ──
  let decoded: string;
  try {
    decoded = decodeURIComponent(rel);
  } catch {
    // Malformed percent-encoding — reject.
    return null;
  }

  // ── Security: block path traversal ──────────────────────────────────────
  // Normalise to remove any ".." components.
  const joined = path.join(publicCoursesDir, decoded);
  if (!joined.startsWith(publicCoursesDir + path.sep) && joined !== publicCoursesDir) {
    // Path escapes the allowed directory.
    return null;
  }

  // ── Check file exists ────────────────────────────────────────────────────
  if (!fs.existsSync(joined)) {
    return null;
  }

  // ── Must be a file, not a directory ─────────────────────────────────────
  try {
    const stat = fs.statSync(joined);
    if (!stat.isFile()) return null;
  } catch {
    return null;
  }

  return joined;
}