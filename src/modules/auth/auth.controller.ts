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
    try {
      const role = req.query.role === "coach" ? "coach" : "client";
      const url = authService.getGoogleAuthorizationUrl(role);

      res.redirect(url);
    } catch (error) {
      handleAuthError(error, res, next);
    }
  },

  async handleGoogleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = typeof req.query.code === "string" ? req.query.code : undefined;
      const state = typeof req.query.state === "string" ? req.query.state : undefined;
      const errorCode = typeof req.query.error === "string" ? req.query.error : undefined;

      if (errorCode) {
        const redirect = new URL("/auth/callback", env.FRONTEND_URL);
        redirect.search = new URLSearchParams({
          role: "client",
          error: errorCode
        }).toString();

        res.redirect(redirect.toString());
        return;
      }

      if (!code) {
        throw new AuthError("Google authorization code is missing", 400);
      }

      const result = await authService.authenticateWithGoogle({ code, state });
      const redirect = new URL("/auth/callback", env.FRONTEND_URL);
      redirect.search = new URLSearchParams({
        role: result.role,
        token: result.response.tokens.accessToken
      }).toString();

      res.redirect(redirect.toString());
    } catch (error) {
      const redirect = new URL("/auth/callback", env.FRONTEND_URL);
      redirect.search = new URLSearchParams({
        role: "client",
        error: error instanceof Error ? error.message : "oauth_callback_failed"
      }).toString();

      res.redirect(redirect.toString());
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = req.auth;
      if (!auth) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: "currentPassword and newPassword are required" });
        return;
      }
      if (newPassword.length < 8) {
        res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
        return;
      }
      await authService.changePassword(auth.userId, auth.role, currentPassword, newPassword);
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      handleAuthError(error, res, next);
    }
  }
};
