import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export async function generateTrainingCertificate(params: {
  userId: string;
  employeeName: string;
  courseTitles: string[];
  uploadDir: string;
}): Promise<string> {
  const { userId, employeeName, courseTitles, uploadDir } = params;
  const certDir = path.join(uploadDir, "certificates");
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }
  const filename = `${userId}-cert.pdf`;
  const outPath = path.join(certDir, filename);

  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 40,
  });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  doc.lineWidth(2);
  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke("#6366F1");

  doc.fontSize(10).fillColor("#333").text("FleetLearn", 50, 45);
  doc
    .fontSize(9)
    .text(
      "شهادة إتمام التدريب / Certificat de Formation / Training Completion Certificate",
      50,
      70,
      { align: "center", width: doc.page.width - 100 }
    );

  doc.moveDown(2);
  doc
    .fontSize(22)
    .fillColor("#111")
    .text(employeeName, { align: "center" });

  doc.moveDown(1.2);
  doc
    .fontSize(11)
    .fillColor("#444")
    .text(
      "Has successfully completed the following training courses:",
      { align: "center" }
    );

  doc.moveDown(0.8);
  courseTitles.forEach((t, i) => {
    doc.fontSize(12).fillColor("#222").text(`${i + 1}. ${t}`, {
      align: "center",
    });
  });

  doc.moveDown(1.5);
  doc
    .fontSize(10)
    .fillColor("#666")
    .text(`Issue date: ${new Date().toLocaleDateString("en-GB")}`, {
      align: "center",
    });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return `/uploads/certificates/${filename}`;
}
