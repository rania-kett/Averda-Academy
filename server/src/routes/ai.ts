import { Router } from "express";
import multer from "multer";
import { body, validationResult } from "express-validator";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { extractRawTextFromPdfBuffer } from "../utils/pdfRawText.js";
import { claudeJson } from "../services/aiAnthropic.js";
import { resolveElevenLabsApiKey } from "../services/integrationKeys.js";
import { prisma } from "../lib/prisma.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function langKey(lang?: string | null): "ar" | "fr" | "en" {
  const l = String(lang || "").toLowerCase();
  if (l.startsWith("ar")) return "ar";
  if (l.startsWith("fr")) return "fr";
  return "en";
}

function ensureErrors(req: any) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(400, "Validation failed");
}

router.post(
  "/analyze-course",
  authMiddleware,
  adminOnly,
  upload.single("pdf"),
  async (req, res, next) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file?.buffer) throw new AppError(400, "PDF missing");
      const { text } = await extractRawTextFromPdfBuffer(file.buffer);
      const extractedPdfText = text.slice(0, 4000);
      const system = `You are helping an admin create a training course for Averda, a waste management company in Morocco.
Employee categories: drivers (سائق), sweepers (كناس), chargeurs (شاحن), chef d'équipe (رئيس فريق), agent de parc (عون الحظيرة), agent de maintenance (عون الصيانة).`;
      const user = `Analyze this training document:\n"""\n${extractedPdfText}\n"""\n\nReturn ONLY a valid JSON object, no markdown, no explanation:\n{\n  "name": { "ar": "...", "fr": "...", "en": "..." },\n  "description": { "ar": "...", "fr": "...", "en": "..." },\n  "emoji": "…",\n  "color": "…",\n  "quiz_topics": ["...","...","..."]\n}\n\nColor rules by topic:\n- Driving/transport → dark navy #1a1a2e or black\n- Safety/warning → orange #e67e22 or red #e74c3c\n- Environment/waste → green #27ae60\n- Tools/maintenance → gray #7f8c8d\n- Documents/admin → blue #2980b9\n- Health → teal #16a085\nPick the most fitting color for the emoji chosen.`;

      const { parsed } = await claudeJson<{
        name: { ar: string; fr: string; en: string };
        description: { ar: string; fr: string; en: string };
        emoji: string;
        color: string;
        quiz_topics: string[];
      }>({
        system,
        user,
        maxTokens: 1200,
        endpointLabel: "analyze-course",
        retryOnce: true,
      });

      res.json({ ...parsed, extractedPreview: extractedPdfText });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/generate-quiz",
  authMiddleware,
  adminOnly,
  body("courseId").isString().notEmpty(),
  async (req, res, next) => {
    try {
      ensureErrors(req);
      const { courseId } = req.body as { courseId: string };
      const course = await prisma.course.findUnique({ where: { id: courseId }, include: { quiz: true } });
      if (!course) throw new AppError(404, "Course not found");
      const extracted = String(course.extractedText || "").trim();
      if (!extracted) throw new AppError(400, "Course extractedText missing");
      const extractedPdfText = extracted.slice(0, 4000);
      const courseName = (course.title as any)?.ar || (course.title as any)?.fr || (course.title as any)?.en || "Course";
      const quizTopics = (req.body as any)?.quizTopics ?? [];
      const system = `Generate exactly 20 quiz questions for this Averda employee training course.\nReturn ONLY valid JSON array.`;
      const user = `Generate exactly 20 quiz questions for this Averda employee training course.\nCourse topic: ${courseName}\nFocus on these themes: ${Array.isArray(quizTopics) ? quizTopics.join(", ") : ""}\nDocument content:\n${extractedPdfText}\n\nQuestion distribution (STRICT):\n- Questions 1-8: type "mcq" (1 correct answer from 4 options)\n- Questions 9-13: type "true_false"\n- Questions 14-17: type "multi_select" (2-3 correct answers from 4 options)\n- Questions 18-20: type "order" (put 4 steps in correct sequence)\n\nDifficulty: 40% easy, 40% medium, 20% hard\n\nReturn ONLY a valid JSON array with the exact shapes described earlier.`;

      const { parsed } = await claudeJson<any[]>({
        system,
        user,
        maxTokens: 4000,
        endpointLabel: "generate-quiz",
        retryOnce: true,
      });
      if (!Array.isArray(parsed) || parsed.length !== 20) {
        throw new AppError(400, `Expected 20 questions, got ${Array.isArray(parsed) ? parsed.length : 0}`);
      }
      const json = JSON.parse(JSON.stringify(parsed)) as any;
      if (course.quiz) {
        await prisma.quiz.update({ where: { id: course.quiz.id }, data: { questions: json, generatedAt: new Date() } });
      } else {
        await prisma.quiz.create({ data: { courseId: course.id, questions: json } });
      }
      res.json({ success: true, questionCount: 20 });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/chat",
  authMiddleware,
  body("context").isString().notEmpty(),
  body("messages").isArray(),
  async (req, res, next) => {
    try {
      ensureErrors(req);
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");

      const userRow = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, language: true, category: { select: { code: true } } } });
      if (!userRow) throw new AppError(404, "User not found");

      const context = String((req.body as any).context);
      const userLanguage = langKey(userRow.language);
      const msgs = ((req.body as any).messages ?? []).slice(-5);

      if (!Array.isArray(msgs)) throw new AppError(400, "messages must be array");
      if (msgs.length > 5) throw new AppError(400, "Too many messages");

      const safeText = (x: any) => String(x?.content ?? "").slice(0, 800);
      const history = msgs.map((m: any) => `${m.role === "assistant" ? "Assistant" : "User"}: ${safeText(m)}`).join("\n");

      let system = "";
      if (context === "course") {
        const courseId = String((req.body as any).courseId || "");
        const course = courseId ? await prisma.course.findUnique({ where: { id: courseId }, select: { extractedText: true } }) : null;
        const pdfTextContent = String(course?.extractedText || "").slice(0, 4000);
        system = `You are a helpful training assistant for Averda employees.\nYou ONLY answer based on this course content: ${pdfTextContent}\nEmployee language: ${userLanguage} — respond ONLY in this language.\nKeep ALL answers under 3 sentences. Simple vocabulary.\nIf question is not covered in the document, respond exactly:\n  AR: "هذه المعلومات غير موجودة في هذه الدورة. تواصل مع مشرفك."\n  FR: "Cette information n'est pas dans ce cours. Contactez votre responsable."\n  EN: "This information is not in this course. Contact your manager."\nNever invent information not in the document.`;
      } else if (context === "quiz_fail") {
        const courseName = String((req.body as any).courseName || "");
        const wrongAnswers = JSON.stringify((req.body as any).wrongAnswers ?? []);
        system = `You are helping an Averda employee understand their quiz mistakes.\nCourse: ${courseName}\nQuestions they got wrong: ${wrongAnswers}\nRespond in: ${userLanguage}. Max 3 sentences. Be encouraging, not discouraging.`;
      } else {
        const completedCourses = Number((req.body as any).completedCourses ?? 0) || 0;
        const remainingCourses = Number((req.body as any).remainingCourses ?? 0) || 0;
        system = `You are a friendly onboarding assistant for Averda Academy.\nEmployee: ${userRow.name}, Category: ${userRow.category?.code ?? ""}\nCompleted: ${completedCourses}, Remaining: ${remainingCourses}\nLanguage: ${userLanguage}. Max 3 sentences per reply.\nOnly help with navigation and training progress questions.\nFor anything else: "تواصل مع قسم الموارد البشرية / Contactez les RH / Contact HR"`;
      }

      const { parsed, rawText } = await claudeJson<{ text: string }>({
        system,
        user: `Conversation:\n${history}\n\nReply now.`,
        maxTokens: 300,
        endpointLabel: "chat",
        retryOnce: false,
      });

      // If Claude didn't return JSON, fall back to raw text.
      const text = (parsed as any)?.text ? String((parsed as any).text) : String(rawText || "").trim();
      res.json({ message: text });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/speak",
  authMiddleware,
  body("courseId").isString().notEmpty(),
  body("lang").optional().isString(),
  async (req, res, next) => {
    try {
      ensureErrors(req);
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const courseId = String((req.body as any).courseId);
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { extractedText: true } });
      if (!course) throw new AppError(404, "Course not found");
      const text = String(course.extractedText || "").slice(0, 1000).trim();
      if (!text) throw new AppError(400, "Course extractedText missing");

      const lang = langKey((req.body as any).lang);
      const voiceId =
        lang === "fr"
          ? "EXAVITQu4vr4xnSDxMaL"
          : lang === "ar"
            ? "21m00Tcm4TlvDq8ikWAM"
            : "21m00Tcm4TlvDq8ikWAM";

      const apiKey = await resolveElevenLabsApiKey();
      if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured");

      const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
      });
      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text().catch(() => "");
        throw new AppError(502, `ElevenLabs error: ${upstream.status} ${errText}`);
      }

      res.status(200);
      res.setHeader("Content-Type", upstream.headers.get("content-type") || "audio/mpeg");
      res.setHeader("Cache-Control", "no-store");

      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) res.write(Buffer.from(value));
      }
      res.end();
    } catch (e) {
      next(e);
    }
  }
);

export default router;

