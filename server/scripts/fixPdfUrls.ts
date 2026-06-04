import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Update First Aid course to use real PDF
  await prisma.course.updateMany({
    where: {
      slug: { contains: "first-aid" },
    },
    data: {
      pdfUrl: "/uploads/Averda_First_Aid_Blueprint.pdf",
      pdfPageCount: 9,
    },
  });
  console.log("Updated First Aid PDF URL");
  await prisma.$disconnect();
}

main();

