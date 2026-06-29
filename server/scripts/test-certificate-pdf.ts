/**
 * Quick smoke test for Puppeteer certificate PDF generation.
 * Usage: npx tsx scripts/test-certificate-pdf.ts
 */
import path from "path";
import { fileURLToPath } from "url";
import { generateCertificate } from "../src/services/certificateService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "../uploads/certificates/test-smoke.pdf");

async function main() {
  console.log("Generating test certificate →", out);
  await generateCertificate({
    recipientName: "يوسف العلوي",
    role: "driver",
    courseName: "السلامة والامتثال",
    score: 85,
    language: "AR",
    outputPath: out,
  });
  console.log("OK");
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
