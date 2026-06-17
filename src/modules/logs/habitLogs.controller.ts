import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { habitLogsService } from "./habitLogs.service";
import { logsSchema } from "./logs.schema";

function p(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

export const habitLogsController = {
  async logHabit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = logsSchema.logHabit.parse(req.body);
      const log = await habitLogsService.logHabit(p(req, "clientId"), p(req, "habitId"), data);
      res.status(201).json({ success: true, data: log });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, message: "Validation error", issues: error.flatten() });
        return;
      }
      next(error);
    }
  },

  async getToday(req: Request, res: Response, next: NextFunction) {
    try {
      const habits = await habitLogsService.getTodayLogs(p(req, "clientId"));
      res.json({ success: true, data: habits });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, habitId } = logsSchema.listHabitLogs.parse(req.query);
      const logs = await habitLogsService.listLogs(p(req, "clientId"), habitId, startDate, endDate);
      res.json({ success: true, data: logs });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, message: "Validation error", issues: error.flatten() });
        return;
      }
      next(error);
    }
  }
};
