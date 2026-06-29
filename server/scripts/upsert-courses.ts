/**
 * Safe course restore — upserts training modules from courseSeedData + PDFs on disk.
 * Does not delete users, progress, or unrelated courses.
 *
 * Run: npx tsx scripts/upsert-courses.ts
 */
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma.js";
import { SEED_COURSE_ROWS } from "../prisma/courseSeedData.js";
import { resolveSeedVisual } from "../src/data/courseSlugCardVisuals.js";
import {
  coursesPublicDir,
  findPdfForArabicTitle,
  listCoursePdfs,
} from "../src/utils/coursePdfMatch.js";
import { getPdfPageCount } from "../src/utils/pdfExtract.js";

const FALLBACK_PDF = "/courses/توجيهات أساسية.pdf";

async function readPageCount(pdfRel: string, coursesRoot: string): Promise<number> {
  try {
    const rel = pdfRel.replace(/^\/courses\//, "").replace(/\\/g, "/");
    const abs = path.join(coursesRoot, rel);
    if (!fs.existsSync(abs)) return 10;
    const buf = fs.readFileSync(abs);
    const n = await getPdfPageCount(buf);
    return n > 0 ? n : 10;
  } catch {
    return 10;
  }
}

async function main() {
  const coursesRoot = coursesPublicDir();
  const pdfs = listCoursePdfs(coursesRoot);
  console.log(`📁 PDF library: ${pdfs.length} files under ${coursesRoot}`);

  const categories = await prisma.category.findMany({ select: { id: true, code: true } });
  const categoryIdByCode = new Map(categories.map((c) => [c.code, c.id]));

  let created = 0;
  let updated = 0;
  let missingPdf = 0;

  for (const row of SEED_COURSE_ROWS) {
    const pdfUrl =
      findPdfForArabicTitle(row.title.ar, pdfs) ??
      (fs.existsSync(path.join(coursesRoot, "توجيهات أساسية.pdf")) ? FALLBACK_PDF : null);

    if (!pdfUrl) {
      console.warn(`⚠️  No PDF for slug=${row.slug} (${row.title.ar}) — skipped`);
      missingPdf++;
      continue;
    }

    const visual = resolveSeedVisual(row.slug, row.icon, row.cover);
    const pdfPageCount = await readPageCount(pdfUrl, coursesRoot);

    const categoryIds = row.categoryCodes
      .map((code) => categoryIdByCode.get(code))
      .filter((id): id is string => Boolean(id));

    if (!categoryIds.length) {
      console.warn(`⚠️  No categories for slug=${row.slug} — skipped`);
      continue;
    }

    const existing = await prisma.course.findUnique({ where: { slug: row.slug } });
    const data = {
      title: row.title,
      description: row.desc,
      icon: visual.icon,
      coverColor: visual.coverColor,
      pdfUrl,
      pdfPageCount,
      isActive: true,
      order: row.order,
      isHsseqFoundation: row.isHsseqFoundation ?? false,
    };

    const course = existing
      ? await prisma.course.update({ where: { id: existing.id }, data })
      : await prisma.course.create({ data: { slug: row.slug, ...data } });

    if (existing) updated++;
    else created++;

    await prisma.courseCategory.deleteMany({ where: { courseId: course.id } });
    await prisma.courseCategory.createMany({
      data: categoryIds.map((categoryId) => ({ courseId: course.id, categoryId })),
      skipDuplicates: true,
    });
  }

  const total = await prisma.course.count({ where: { isActive: true } });
  console.log(`✅ Courses restored — created: ${created}, updated: ${updated}, skipped (no PDF): ${missingPdf}`);
  console.log(`   Active courses in DB: ${total}`);
  console.log("   Lesson quizzes: built-in per slug (no DB seed needed)");
  console.log("   Final AI quizzes: generate from Admin → Courses when needed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
