import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { resourcesSchema } from "./resources.schema";
import { ResourceError, resourcesService } from "./resources.service";

function getRequesterId(req: Request): string {
  return req.auth?.userId ?? "dev-user-id";
}

function p(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

function handleError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({ success: false, message: "Validation error", issues: error.flatten() });
    return;
  }
  if (error instanceof ResourceError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  next(error);
}

export const resourcesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = getRequesterId(req);
      const coachId = p(req, "coachId") || requesterId;
      const data = resourcesSchema.create.parse(req.body);
      const resource = await resourcesService.createResource(coachId, requesterId, data);
      res.status(201).json({ success: true, data: resource });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async listCoachResources(req: Request, res: Response, next: NextFunction) {
    try {
      const resources = await resourcesService.listCoachResources(p(req, "coachId"), getRequesterId(req));
      res.json({ success: true, data: resources });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resourcesSchema.update.parse(req.body);
      const resource = await resourcesService.updateResource(getRequesterId(req), p(req, "resourceId"), data);
      res.json({ success: true, data: resource });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await resourcesService.deleteResource(getRequesterId(req), p(req, "resourceId"));
      res.json({ success: true, message: "Resource deleted" });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async grantAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resourcesSchema.grantAccess.parse(req.body);
      const result = await resourcesService.grantAccess(getRequesterId(req), p(req, "resourceId"), data);
      res.json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async revokeAccess(req: Request, res: Response, next: NextFunction) {
    try {
      await resourcesService.revokeAccess(getRequesterId(req), p(req, "resourceId"), p(req, "clientId"));
      res.json({ success: true, message: "Access revoked" });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async listClientResources(req: Request, res: Response, next: NextFunction) {
    try {
      const resources = await resourcesService.listClientResources(p(req, "clientId"), getRequesterId(req));
      res.json({ success: true, data: resources });
    } catch (error) {
      handleError(error, res, next);
    }
  }
};
