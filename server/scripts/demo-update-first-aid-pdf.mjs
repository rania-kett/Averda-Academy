import fs from "fs";
import pdfParse from "pdf-parse";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pdfPath = "uploads/Averda_First_Aid_Blueprint.pdf";
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Missing PDF at ${pdfPath}`);
  }
  const buf = fs.readFileSync(pdfPath);
  const parsed = await pdfParse(buf);
  const pageCount = parsed.numpages || 1;

  const course = await prisma.course.findUnique({ where: { slug: "first-aid" } });
  if (!course) throw new Error("Course first-aid not found");

  const updated = await prisma.course.update({
    where: { id: course.id },
    data: {
      pdfUrl: "/uploads/Averda_First_Aid_Blueprint.pdf",
      pdfPageCount: pageCount,
      extractedText: null,
    },
  });

  console.log({
    ok: true,
    slug: updated.slug,
    pdfUrl: updated.pdfUrl,
    pdfPageCount: updated.pdfPageCount,
    extractedTextReset: updated.extractedText === null,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

