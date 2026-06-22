import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

let seeded = false;

/** Run prisma seed once per test process (integration suites). */
export function ensureSeed(): void {
  if (seeded) return;
  const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  execSync("npx tsx prisma/seed.ts", {
    cwd: serverRoot,
    stdio: "pipe",
    env: { ...process.env },
  });
  seeded = true;
}
