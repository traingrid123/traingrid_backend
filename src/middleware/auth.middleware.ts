import { NextFunction, Request, Response } from "express";

import { resolveFirebaseAuthContext } from "../modules/auth/firebase.session";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: "coach" | "client";
        firebaseUid: string;
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

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = parseBearerToken(req);

  // DEV MODE: Allow requests without token for testing
  if (!token) {
    req.auth = {
      userId: "dev-user-id",
      role: "coach" // Default to coach for dev testing
    };
    next();
    return;
  }

  try {
    const authContext = await resolveFirebaseAuthContext(token);
    req.auth = authContext;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Invalid access token"
    });
  }
}