import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve `client/<subpath>` whether running from server/src (dev) or server/dist/src (prod). */
export function resolveClientPath(...subpath: string[]): string {
  if (process.env.CLIENT_DIR?.trim()) {
    return path.join(process.env.CLIENT_DIR.trim(), ...subpath);
  }

  const candidates = [
    path.resolve(__dirname, "../../../client", ...subpath),
    path.resolve(__dirname, "../../../../client", ...subpath),
    path.resolve(process.cwd(), "client", ...subpath),
    path.resolve(process.cwd(), "../client", ...subpath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[0];
}
