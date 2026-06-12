import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { nutritionSchema } from "./nutrition.schema";
import { NutritionError, nutritionPlansService } from "./nutritionPlans.service";

function getParam(req: Request, key: string) {
  const raw = req.params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) throw new NutritionError(`${key} is required`, 400);
  return value;
}

function requesterFromRequest(req: Request) {
  return req.auth;
}

function handleError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      issues: error.flatten()
    });
    return;
  }
  if (error instanceof NutritionError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  next(error);
}

export const nutritionPlansController = {
  async createCoachPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const input = nutritionSchema.createPlan.parse(req.body);
      const result = await nutritionPlansService.createPlan(
        coachId,
        input,
        requesterFromRequest(req)
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async listCoachPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const filters = nutritionSchema.listFilters.parse(req.query);
      const result = await nutritionPlansService.listCoachPlans(
        coachId,
        filters,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async getCoachPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const planId = getParam(req, "planId");
      const result = await nutritionPlansService.getCoachPlan(
        coachId,
        planId,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async updateCoachPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const planId = getParam(req, "planId");
      const input = nutritionSchema.updatePlan.parse(req.body);
      const result = await nutritionPlansService.updateCoachPlan(
        coachId,
        planId,
        input,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async deleteCoachPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const planId = getParam(req, "planId");
      const result = await nutritionPlansService.deleteCoachPlan(
        coachId,
        planId,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async archiveCoachPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const planId = getParam(req, "planId");
      const result = await nutritionPlansService.setArchived(
        coachId,
        planId,
        true,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async unarchiveCoachPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const planId = getParam(req, "planId");
      const result = await nutritionPlansService.setArchived(
        coachId,
        planId,
        false,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async duplicateCoachPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const planId = getParam(req, "planId");
      const input = nutritionSchema.duplicatePlan.parse(req.body);
      const result = await nutritionPlansService.duplicateCoachPlan(
        coachId,
        planId,
        input,
        requesterFromRequest(req)
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async assignPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const input = nutritionSchema.assignment.parse(req.body);
      const result = await nutritionPlansService.assignPlan(
        coachId,
        input,
        requesterFromRequest(req)
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async getTodayNutrition(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = getParam(req, "clientId");
      const result = await nutritionPlansService.getTodayNutrition(
        clientId,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async logMeal(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = getParam(req, "clientId");
      const input = nutritionSchema.logMeal.parse(req.body);
      const result = await nutritionPlansService.logMeal(
        clientId,
        input,
        requesterFromRequest(req)
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async getClientCompliance(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = getParam(req, "clientId");
      const days = Number(req.query.days ?? 14);
      const result = await nutritionPlansService.getClientCompliance(
        clientId,
        Number.isFinite(days) ? Math.min(Math.max(days, 1), 90) : 14,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async getCoachClientCompliance(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const clientId = getParam(req, "clientId");
      const result = await nutritionPlansService.getCoachClientCompliance(
        coachId,
        clientId,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  }
};
