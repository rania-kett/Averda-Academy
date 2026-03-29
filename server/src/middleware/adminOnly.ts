import type { NextFunction, Request, Response } from "express";
import type { AuthedRequest } from "./auth.js";
import { AppError } from "./errorHandler.js";

export function adminOnly(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const r = req as AuthedRequest;
    if (r.user.role !== "ADMIN") {
      throw new AppError(403, "Forbidden");
    }
    next();
  } catch (e) {
    if (e instanceof AppError) {
      res.status(e.statusCode).json({ error: e.message });
      return;
    }
    res.status(403).json({ error: "Forbidden" });
  }
}
