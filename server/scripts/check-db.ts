import { prisma } from "../src/lib/prisma.js";

async function main() {
  try {
    const count = await prisma.user.count();
    console.log("DB OK — users:", count);
  } catch (e) {
    console.error("DB FAIL:", e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
