import fs from "fs";
import multer from "multer";
import path from "path";

export function ensureUploadDir(base: string): void {
  if (!fs.existsSync(base)) {
    fs.mkdirSync(base, { recursive: true });
  }
  const certs = path.join(base, "certificates");
  if (!fs.existsSync(certs)) {
    fs.mkdirSync(certs, { recursive: true });
  }
}

export function createCoursePdfUploader(uploadDir: string) {
  ensureUploadDir(uploadDir);
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".pdf";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype !== "application/pdf") {
        cb(new Error("Only PDF files are allowed"));
        return;
      }
      cb(null, true);
    },
  });
}
