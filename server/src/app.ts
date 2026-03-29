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
import quizRouter from "./routes/quiz.js";
import userRouter from "./routes/user.js";
import { errorHandler, AppError } from "./middleware/errorHandler.js";
import { ensureUploadDir } from "./middleware/upload.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
ensureUploadDir(uploadDir);

const app = express();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadDir));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/user", userRouter);
app.use("/api/admin/courses", adminCoursesRouter);
app.use("/api/admin", adminRouter);

app.use((_req, _res, next) => {
  next(new AppError(404, "Not found"));
});

app.use(errorHandler);

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
