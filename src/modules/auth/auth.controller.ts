import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { authSchema } from "./auth.schema";
import { AuthError, authService } from "./auth.service";

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
  }
};
