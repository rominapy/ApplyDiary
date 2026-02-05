import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid authorization header" });
    return;
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const payload = verifyAuthToken(token);
    req.auth = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
