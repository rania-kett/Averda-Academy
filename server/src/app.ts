import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import adminCoursesRouter from "./routes/adminCourses.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";
import coursesRouter from "./routes/courses.js";
import lessonQuizRouter from "./routes/lessonQuiz.js";
import quizRouter from "./routes/quiz.js";
import userRouter from "./routes/user.js";
import aiRouter from "./routes/ai.js";
import { errorHandler, AppError } from "./middleware/errorHandler.js";
import { ensureUploadDir } from "./middleware/upload.js";
import fs from "fs";
import epiRouter from "./routes/epi.js";   // near other imports           // near other app.use() calls
import { resolveClientPath } from "./utils/resolveClientPath.js";

const __dirnameApp = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirnameApp, "../../.env") });
dotenv.config();

process.stdout.write("[server] Booting API…\n");

process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled Rejection:", reason);
  // Do NOT exit the process — log and continue
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
ensureUploadDir(uploadDir);
const epiProofsDir = path.join(uploadDir, "epi-proofs");
if (!fs.existsSync(epiProofsDir)) {
  fs.mkdirSync(epiProofsDir, { recursive: true });
}
// IMPORTANT: resolve client paths for both dev (tsx) and prod (compiled dist).
const COURSES_DIR = process.env.COURSES_DIR?.trim() || resolveClientPath("public", "courses");
const CLIENT_DIST = process.env.CLIENT_DIST?.trim() || resolveClientPath("dist");
const serveClient =
  process.env.SERVE_CLIENT === "true" ||
  (process.env.NODE_ENV === "production" && process.env.SERVE_CLIENT !== "false");
const bundledPlaceholder = path.join(__dirname, "../assets/placeholder.pdf");
const uploadPlaceholder = path.join(uploadDir, "placeholder.pdf");
if (fs.existsSync(bundledPlaceholder)) {
  if (!fs.existsSync(uploadPlaceholder)) {
    fs.copyFileSync(bundledPlaceholder, uploadPlaceholder);
  } else if (fs.statSync(uploadPlaceholder).size === 0) {
    fs.copyFileSync(bundledPlaceholder, uploadPlaceholder);
  }
}

const app = express();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use('/courses', (req, res) => {
  try {
    const rawPath = req.path;
    if (!rawPath || rawPath === '/' || rawPath === '') {
      return res.status(400).json({ error: 'No file specified' });
    }

    // Get the raw buffer representation to handle any encoding
    const rawUrl = req.url ?? '/';
    const queryStart = rawUrl.indexOf('?');
    const urlPath = queryStart === -1 ? rawUrl : rawUrl.slice(0, queryStart);

    // Keep decoding until stable
    let decoded = urlPath;
    let prev = '';
    while (prev !== decoded) {
      prev = decoded;
      try { decoded = decodeURIComponent(decoded); } catch { break; }
    }
    decoded = decoded.replace(/^\//, '');

    const filePath = path.join(COURSES_DIR, decoded);

    const tryResolve = (): string | null => {
      if (fs.existsSync(filePath)) return filePath;

      // 1) Common mismatch: trailing spaces before ".pdf" or multiple spaces.
      const normalizedDecoded = decoded.replace(/\s+\.pdf$/i, ".pdf");
      const normalizedPath = normalizedDecoded === decoded ? filePath : path.join(COURSES_DIR, normalizedDecoded);
      if (normalizedPath !== filePath && fs.existsSync(normalizedPath)) return normalizedPath;

      // 2) Robust fallback for Windows + Arabic filenames:
      // if still not found, scan the target directory and match by a loose normalization.
      // This handles double spaces, Unicode normalization (NFC), and trailing spaces safely.
      try {
        const parts = normalizedDecoded.split("/").filter(Boolean);
        if (parts.length < 2) return null;
        const folder = parts.slice(0, -1).join(path.sep);
        const wantedFile = parts[parts.length - 1] ?? "";
        const dirAbs = path.join(COURSES_DIR, folder);
        if (!fs.existsSync(dirAbs)) return null;
        const entries = fs.readdirSync(dirAbs);
        const norm = (s: string) =>
          s
            .normalize("NFC")
            // Ignore parenthetical suffixes like (1)
            .replace(/\([^)]*\)/g, " ")
            .replace(/\s+/g, " ")
            .replace(/\s+\.pdf$/i, ".pdf")
            // Treat "الجمع2" and "الجمع 2" as same
            .replace(/\s+(?=\d)/g, "")
            .trim()
            .toLowerCase();
        const target = norm(wantedFile);
        const hit = entries.find((e) => norm(e) === target);
        if (!hit) return null;
        const abs = path.join(dirAbs, hit);
        return fs.existsSync(abs) ? abs : null;
      } catch {
        return null;
      }
    };

    const chosenPath = tryResolve();
    if (!chosenPath) {
      return res.status(404).json({ error: 'File not found', path: filePath });
    }
    try {
      const stat = fs.statSync(chosenPath);
      if (!stat.isFile()) {
        return res.status(404).json({ error: 'Not a file', path: filePath });
      }
    } catch {
      return res.status(404).json({ error: 'File not found', path: filePath });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Origin', clientUrl);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Disposition', 'inline');
    const stream = fs.createReadStream(chosenPath);
    stream.on('error', (err) => {
      console.error('[PDF middleware] stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read file' });
      }
    });
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    frameguard: false,
  })
);
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / non-browser requests
      if (!origin) return cb(null, true);
      if (origin === clientUrl) return cb(null, true);
      // Dev: allow LAN access to Vite (so phones can use the app)
      if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):517\d{1,2}$/i.test(origin)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
    exposedHeaders: ["X-Certificate-Template"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use("/api/epi", epiRouter);
app.use("/uploads/certificates", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  next();
});
app.use("/uploads", express.static(uploadDir));
// Backward compatibility: some courses stored PDFs as `/uploads/<name>.pdf`.
// If the file is no longer in the API uploads folder but exists under the Vite public
// `client/public/courses/` structure, serve it from there so employees can see PDFs automatically.
app.get("/uploads/:filename", (req, res, next) => {
  try {
    const filename = String(req.params.filename || "");
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      next();
      return;
    }

    const absInUploads = path.join(uploadDir, filename);
    if (fs.existsSync(absInUploads)) {
      res.sendFile(absInUploads);
      return;
    }

    const candidates = [
      path.join(COURSES_DIR, filename),
      path.join(COURSES_DIR, "Drivers", filename),
      path.join(COURSES_DIR, "Sweepers", filename),
      path.join(COURSES_DIR, "Collect-Crew", filename),
    ];
    const hit = candidates.find((p) => fs.existsSync(p));
    if (hit) {
      res.sendFile(hit);
      return;
    }

    next();
  } catch {
    next();
  }
});

app.get("/health", async (_req, res) => {
  const { CERT_TEMPLATE_VERSION } = await import("./services/certificateService.js");
  res.json({ ok: true, certificateTemplate: CERT_TEMPLATE_VERSION });
});

app.use("/api/auth", authRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/lesson-quiz", lessonQuizRouter);
app.use("/api/user", userRouter);
app.use("/api/ai", aiRouter);
app.use("/api/admin/courses", adminCoursesRouter);
app.use("/api/admin", adminRouter);

if (serveClient && fs.existsSync(CLIENT_DIST)) {
  process.stdout.write(`[server] Serving client from ${CLIENT_DIST}\n`);
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: "1h" }));
  app.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/uploads") ||
      req.path.startsWith("/courses") ||
      req.path === "/health"
    ) {
      next();
      return;
    }
    res.sendFile(path.join(CLIENT_DIST, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use((_req, _res, next) => {
  next(new AppError(404, "Not found"));
});

app.use(errorHandler);

const port = Number(process.env.PORT) || 3011;
const server = app.listen(port, () => {
  const msg = `API listening on http://localhost:${port}\n`;
  process.stdout.write(`[server] ${msg}`);
});
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[server] Port ${port} is already in use. Stop the other process or change PORT in server/.env`
    );
  } else {
    console.error("[server] Failed to start:", err);
  }
  process.exit(1);
});
