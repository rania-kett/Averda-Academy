import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type TokenPayload } from "../utils/jwt.js";
import { AppError } from "./errorHandler.js";

export type AuthedRequest = Request & { user: TokenPayload & { userId: string } };

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "Unauthorized");
    }
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    (req as AuthedRequest).user = {
      ...payload,
      userId: payload.sub,
    };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
