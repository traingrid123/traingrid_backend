import { NextFunction, Request, Response } from "express";

import { tokenService } from "../modules/auth/token.service";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: "coach" | "client";
      };
    }
  }
}

function parseBearerToken(req: Request): string | null {
  const header = req.headers.authorization;

  if (!header) {
    return null;
  }

  const [type, token] = header.split(" ");
  if (!token || type.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = parseBearerToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Missing access token"
    });
    return;
  }

  try {
    const payload = tokenService.verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.role
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid access token"
    });
  }
}
