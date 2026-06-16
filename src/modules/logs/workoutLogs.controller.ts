import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { logsSchema } from "./logs.schema";
import { workoutLogsService } from "./workoutLogs.service";

function p(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

export const workoutLogsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = logsSchema.createWorkoutLog.parse(req.body);
      const log = await workoutLogsService.createLog(p(req, "clientId"), data);
      res.status(201).json({ success: true, data: log });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, message: "Validation error", issues: error.flatten() });
        return;
      }
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, limit, offset } = logsSchema.listWorkoutLogs.parse(req.query);
      const result = await workoutLogsService.listLogs(p(req, "clientId"), startDate, endDate, limit, offset);
      res.json({ success: true, data: result.items, total: result.total });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, message: "Validation error", issues: error.flatten() });
        return;
      }
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await workoutLogsService.getLog(p(req, "logId"));
      res.json({ success: true, data: log });
    } catch (error) {
      const err = error as { statusCode?: number; message?: string };
      if (err.statusCode) {
        res.status(err.statusCode).json({ success: false, message: err.message });
        return;
      }
      next(error);
    }
  }
};
