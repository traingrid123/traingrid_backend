import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";

import { env } from "../../config/env";
import { authSchema } from "./auth.schema";
import { AuthError, authService } from "./auth.service";
import { tokenService } from "./token.service";

function parseRole(value: unknown): "coach" | "client" {
  if (Array.isArray(value)) {
    return parseRole(value[0]);
  }

  if (typeof value !== "string") {
    return "client";
  }

  return value.trim().toLowerCase() === "coach" ? "coach" : "client";
}

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

  if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
    return;
  }

  next(error);
}

export const authController = {
  async registerClient(req: Request, res: Response, next: NextFunction) {
    try {
      const input = authSchema.clientRegister.parse(req.body);
      const result = await authService.registerClient(input);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleAuthError(error, res, next);
    }
  },

  async loginClient(req: Request, res: Response, next: NextFunction) {
    try {
      const input = authSchema.clientLogin.parse(req.body);
      const result = await authService.loginClient(input);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleAuthError(error, res, next);
    }
  },

  async registerCoach(req: Request, res: Response, next: NextFunction) {
    try {
      const input = authSchema.coachRegister.parse(req.body);
      const result = await authService.registerCoach(input);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleAuthError(error, res, next);
    }
  },

  async loginCoach(req: Request, res: Response, next: NextFunction) {
    try {
      const input = authSchema.coachLogin.parse(req.body);
      const result = await authService.loginCoach(input);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleAuthError(error, res, next);
    }
  },

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

  async logout(_req: Request, res: Response) {
    res.status(200).json({
      success: true,
      data: {
        loggedOut: true
      }
    });
  },

  async startGoogleOAuth(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({
      success: false,
      message: "Google OAuth not available in MVP"
    });
  },

  async handleGoogleCallback(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({
      success: false,
      message: "Google OAuth not available in MVP"
    });
  }
};