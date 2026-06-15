import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { authSchema } from "./auth.schema";
import { AuthError } from "./auth.error";
import { authService } from "./auth.service";
import { syncFirebaseSession } from "./firebase.session";

function handleAuthError(
  error: unknown,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      issues: error.flatten()
    });
    return;
  }

  if (error instanceof AuthError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  next(error);
}

export const authController = {
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      const user = await authService.getCurrentUser({
        sub: req.auth.userId,
        role: req.auth.role
      });

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      handleAuthError(error, res, next);
    }
  },

  async syncSession(req: Request, res: Response, next: NextFunction) {
    try {
      const input = authSchema.firebaseSession.parse(req.body);
      const result = await syncFirebaseSession(input);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleAuthError(error, res, next);
    }
  },

  async logout(_req: Request, res: Response) {
    res.status(200).json({
      success: true,
      data: {
        loggedOut: true
      }
    });
  }
};
