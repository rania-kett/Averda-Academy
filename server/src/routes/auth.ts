import { Router } from "express";
import { body, validationResult } from "express-validator";
import { RateLimiterMemory } from "rate-limiter-flexible";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { comparePassword, comparePin } from "../utils/hash.js";
import {
  signAccessToken,
  signRefreshToken,
} from "../utils/jwt.js";
import { evaluateAllBadgesForUser } from "../services/badgeService.js";

const router = Router();

const loginLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60,
});

router.post(
  "/login",
  body("employeeId").trim().notEmpty(),
  body("pin").isLength({ min: 4, max: 4 }),
  async (req, res, next) => {
    try {
      try {
        await loginLimiter.consume(req.ip || "unknown");
      } catch {
        res.status(429).json({ error: "Too many requests" });
        return;
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const { employeeId, pin } = req.body as { employeeId: string; pin: string };
      const user = await prisma.user.findUnique({
        where: { employeeId: employeeId.trim() },
      });
      if (!user || user.role !== "EMPLOYEE" || !user.isActive) {
        throw new AppError(401, "Invalid credentials");
      }
      const ok = await comparePin(pin, user.pin);
      if (!ok) throw new AppError(401, "Invalid credentials");
      void evaluateAllBadgesForUser(user.id).catch(() => {});
      const access = signAccessToken({ sub: user.id, role: "EMPLOYEE" });
      const refresh = signRefreshToken({ sub: user.id, role: "EMPLOYEE" });
      res.json({
        accessToken: access,
        refreshToken: refresh,
        user: {
          id: user.id,
          employeeId: user.employeeId,
          name: user.name,
          role: user.role,
          language: user.language,
          avatarColor: user.avatarColor,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/admin-login",
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res, next) => {
    try {
      try {
        await loginLimiter.consume(req.ip || "unknown");
      } catch {
        res.status(429).json({ error: "Too many requests" });
        return;
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const { email, password } = req.body as { email: string; password: string };
      const user = await prisma.user.findFirst({
        where: { email: email.toLowerCase().trim(), role: "ADMIN" },
      });
      if (!user?.passwordHash) {
        throw new AppError(401, "Invalid credentials");
      }
      const ok = await comparePassword(password, user.passwordHash);
      if (!ok) throw new AppError(401, "Invalid credentials");
      const access = signAccessToken({ sub: user.id, role: "ADMIN" });
      const refresh = signRefreshToken({ sub: user.id, role: "ADMIN" });
      res.json({
        accessToken: access,
        refreshToken: refresh,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post("/refresh", body("refreshToken").notEmpty(), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const { refreshToken } = req.body as { refreshToken: string };
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      throw new Error("JWT_REFRESH_SECRET is not set");
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(refreshToken, refreshSecret) as jwt.JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError || err instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
      }
      throw err;
    }

    if (payload.type !== "refresh") {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub as string } });
    if (!user || !user.isActive) {
      throw new AppError(401, "Invalid token");
    }
    const access = signAccessToken({
      sub: user.id,
      role: user.role as "ADMIN" | "EMPLOYEE",
    });
    res.json({ accessToken: access });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", (_req, res) => {
  res.json({ success: true });
});

export default router;
