import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import adminCoursesRouter from "../../src/routes/adminCourses.js";
import adminRouter from "../../src/routes/admin.js";
import authRouter from "../../src/routes/auth.js";
import coursesRouter from "../../src/routes/courses.js";
import lessonQuizRouter from "../../src/routes/lessonQuiz.js";
import quizRouter from "../../src/routes/quiz.js";
import userRouter from "../../src/routes/user.js";
import aiRouter from "../../src/routes/ai.js";
import epiRouter from "../../src/routes/epi.js";
import { errorHandler, AppError } from "../../src/middleware/errorHandler.js";
import { ensureUploadDir } from "../../src/middleware/upload.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
ensureUploadDir(uploadDir);

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    frameguard: false,
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/api/epi", epiRouter);
app.use("/uploads", express.static(uploadDir));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/lesson-quiz", lessonQuizRouter);
app.use("/api/user", userRouter);
app.use("/api/ai", aiRouter);
app.use("/api/admin/courses", adminCoursesRouter);
app.use("/api/admin", adminRouter);

app.use((_req, _res, next) => {
  next(new AppError(404, "Not found"));
});

app.use(errorHandler);

export { app };
