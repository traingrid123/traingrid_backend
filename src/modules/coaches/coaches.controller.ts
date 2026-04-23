import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { tokenService } from "../auth/token.service";
import { coachesSchema } from "./coaches.schema";
import { CoachError, coachesService } from "./coaches.service";

function parseRequester(req: Request) {
  const header = req.headers.authorization;

  if (!header) {
    return null;
  }

  const [type, token] = header.split(" ");

  if (!token || type.toLowerCase() !== "bearer") {
    return null;
  }

  try {
    const payload = tokenService.verifyAccessToken(token);
    return {
      role: payload.role,
      userId: payload.sub
    } as const;
  } catch {
    throw new CoachError("Invalid access token", 401);
  }
}

function getCoachId(req: Request) {
  const coachId = Array.isArray(req.params.coachId)
    ? req.params.coachId[0]
    : req.params.coachId;

  if (!coachId) {
    throw new CoachError("Coach id is required", 400);
  }

  return coachId;
}

function getClientId(req: Request) {
  const clientId = Array.isArray(req.params.clientId)
    ? req.params.clientId[0]
    : req.params.clientId;

  if (!clientId) {
    throw new CoachError("Client id is required", 400);
  }

  return clientId;
}

function handleCoachError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      issues: error.flatten()
    });
    return;
  }

  if (error instanceof CoachError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  next(error);
}

export const coachesController = {
  async discover(req: Request, res: Response, next: NextFunction) {
    try {
      const input = coachesSchema.discover.parse(req.query);
      const result = await coachesService.discover(input);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleCoachError(error, res, next);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await coachesService.getProfile(getCoachId(req));

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleCoachError(error, res, next);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = parseRequester(req);
      const input = coachesSchema.updateProfile.parse(req.body);
      const result = await coachesService.updateProfile(
        getCoachId(req),
        input,
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleCoachError(error, res, next);
    }
  },

  async getDiscoveryCard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await coachesService.getDiscoveryCard(getCoachId(req));

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleCoachError(error, res, next);
    }
  },

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = parseRequester(req);
      const result = await coachesService.getDashboard(
        getCoachId(req),
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleCoachError(error, res, next);
    }
  },

  async listClients(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = parseRequester(req);
      const input = coachesSchema.listClients.parse(req.query);
      const result = await coachesService.listClients(
        getCoachId(req),
        input,
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleCoachError(error, res, next);
    }
  },

  async getClientDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = parseRequester(req);
      const result = await coachesService.getClientDetail(
        getCoachId(req),
        getClientId(req),
        requester ?? undefined
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleCoachError(error, res, next);
    }
  },

  async addClient(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = parseRequester(req);
      const input = coachesSchema.addClient.parse(req.body);
      const result = await coachesService.addClient(
        getCoachId(req),
        input,
        requester ?? undefined
      );

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleCoachError(error, res, next);
    }
  }
};
