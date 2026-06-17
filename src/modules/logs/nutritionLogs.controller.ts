import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { logsSchema } from "./logs.schema";
import { nutritionLogsService } from "./nutritionLogs.service";

function p(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

export const nutritionLogsController = {
  async logMeal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = logsSchema.logMeal.parse(req.body);
      const log = await nutritionLogsService.logMeal(p(req, "clientId"), data);
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
      const logs = await nutritionLogsService.getTodayLogs(p(req, "clientId"));
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = logsSchema.listNutritionLogs.parse(req.query);
      const logs = await nutritionLogsService.listLogs(p(req, "clientId"), startDate, endDate);
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
