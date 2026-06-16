import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { resolveFirebaseAuthContext } from "../auth/firebase.session";
import { notificationsSchema } from "../notifications/notifications.schema";
import {
  NotificationError,
  notificationsService
} from "../notifications/notifications.service";
import { clientsSchema } from "./clients.schema";
import { ClientError, clientsService } from "./clients.service";

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

async function parseRequester(req: Request) {
  if (req.auth) {
    return req.auth;
  }

  const token = parseBearerToken(req);

  if (!token) {
    return null;
  }

  try {
    return await resolveFirebaseAuthContext(token);
  } catch (error) {
    throw new ClientError("Invalid access token", 401);
  }
}

function getClientId(req: Request) {
  const clientId = Array.isArray(req.params.clientId)
    ? req.params.clientId[0]
    : req.params.clientId;

  if (!clientId) {
    throw new ClientError("Client id is required", 400);
  }

  return clientId;
}

function handleClientError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      issues: error.flatten()
    });
    return;
  }

  if (error instanceof ClientError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  if (error instanceof NotificationError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  next(error);
}

export const clientsController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const result = await clientsService.getProfile(
        getClientId(req),
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleClientError(error, res, next);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const input = clientsSchema.updateProfile.parse(req.body);
      const result = await clientsService.updateProfile(
        getClientId(req),
        input,
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleClientError(error, res, next);
    }
  },

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const result = await clientsService.getDashboard(
        getClientId(req),
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleClientError(error, res, next);
    }
  },

  async getAssignedCoach(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const result = await clientsService.getAssignedCoach(
        getClientId(req),
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleClientError(error, res, next);
    }
  },

  async requestPlanUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const input = notificationsSchema.planUpdateRequest.parse(req.body);
      const result = await notificationsService.requestPlanUpdate(
        getClientId(req),
        input,
        requester ?? undefined
      );

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleClientError(error, res, next);
    }
  },

  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const input = clientsSchema.leaderboard.parse(req.query);
      const result = await clientsService.getLeaderboard(
        getClientId(req),
        input,
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleClientError(error, res, next);
    }
  },

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const result = await clientsService.getAnalytics(
        getClientId(req),
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleClientError(error, res, next);
    }
  },

  async getTodayWorkout(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const result = await clientsService.getTodayWorkout(
        getClientId(req),
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleClientError(error, res, next);
    }
  },

  async getWorkoutDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const workoutDayId = Array.isArray(req.params.workoutDayId)
        ? req.params.workoutDayId[0]
        : req.params.workoutDayId;

      if (!workoutDayId) {
        throw new ClientError("Workout day id is required", 400);
      }

      const result = await clientsService.getWorkoutDetail(
        getClientId(req),
        workoutDayId,
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleClientError(error, res, next);
    }
  },

  async completeWorkout(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const workoutDayId = Array.isArray(req.params.workoutDayId)
        ? req.params.workoutDayId[0]
        : req.params.workoutDayId;

      if (!workoutDayId) {
        throw new ClientError("Workout day id is required", 400);
      }

      const input = req.body || {};
      const result = await clientsService.completeWorkout(
        getClientId(req),
        workoutDayId,
        input,
        requester ?? undefined
      );

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleClientError(error, res, next);
    }
  }
};
