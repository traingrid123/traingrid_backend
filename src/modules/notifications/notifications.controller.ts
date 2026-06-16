import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { resolveFirebaseAuthContext } from "../auth/firebase.session";
import { notificationsSchema } from "./notifications.schema";
import { NotificationError, notificationsService } from "./notifications.service";

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
    return {
      role: req.auth.role,
      userId: req.auth.userId
    } as const;
  }

  const token = parseBearerToken(req);

  if (!token) {
    return null;
  }

  try {
    return await resolveFirebaseAuthContext(token);
  } catch {
    throw new NotificationError("Invalid access token", 401);
  }
}

function getCoachId(req: Request) {
  const coachId = Array.isArray(req.params.coachId)
    ? req.params.coachId[0]
    : req.params.coachId;

  if (!coachId) {
    throw new NotificationError("Coach id is required", 400);
  }

  return coachId;
}

function getClientId(req: Request) {
  const clientId = Array.isArray(req.params.clientId)
    ? req.params.clientId[0]
    : req.params.clientId;

  if (!clientId) {
    throw new NotificationError("Client id is required", 400);
  }

  return clientId;
}

function handleNotificationError(
  error: unknown,
  res: Response,
  next: NextFunction
) {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      issues: error.flatten()
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

export const notificationsController = {
  async listCoachNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const input = notificationsSchema.list.parse(req.query);
      const result = await notificationsService.listCoachNotifications(
        getCoachId(req),
        input,
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleNotificationError(error, res, next);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const input = notificationsSchema.markRead.parse(req.body);
      const result = await notificationsService.markRead(
        getCoachId(req),
        input.notificationId,
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleNotificationError(error, res, next);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = await parseRequester(req);
      const result = await notificationsService.markAllRead(
        getCoachId(req),
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleNotificationError(error, res, next);
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
      handleNotificationError(error, res, next);
    }
  }
};
