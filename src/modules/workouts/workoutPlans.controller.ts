import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { WorkoutError, workoutPlansService } from "./workoutPlans.service";
import { workoutsSchema } from "./workouts.schema";

function getParam(req: Request, key: string) {
  const raw = req.params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    throw new WorkoutError(`${key} is required`, 400);
  }
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

  if (error instanceof WorkoutError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  next(error);
}

export const workoutPlansController = {
  async createCoachPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const input = workoutsSchema.createPlan.parse(req.body);
      const result = await workoutPlansService.createPlan(
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
      const pagination = workoutsSchema.pagination.parse(req.query);
      const result = await workoutPlansService.listCoachPlans(
        coachId,
        pagination,
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
      const result = await workoutPlansService.getCoachPlan(
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
      const input = workoutsSchema.updatePlan.parse(req.body);
      const result = await workoutPlansService.updateCoachPlan(
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

  async duplicateCoachPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const coachId = getParam(req, "coachId");
      const planId = getParam(req, "planId");
      const input = workoutsSchema.duplicatePlan.parse(req.body);
      const result = await workoutPlansService.duplicateCoachPlan(
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
      const input = workoutsSchema.assignment.parse(req.body);
      const result = await workoutPlansService.assignPlan(
        coachId,
        input,
        requesterFromRequest(req)
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async getCoachClientWorkoutAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const coachId = getParam(req, "coachId");
      const clientId = getParam(req, "clientId");
      const result = await workoutPlansService.getCoachClientWorkoutAnalytics(
        coachId,
        clientId,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async getTodayWorkout(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = getParam(req, "clientId");
      const result = await workoutPlansService.getTodayWorkout(
        clientId,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async getWorkoutDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = getParam(req, "clientId");
      const workoutDayId = getParam(req, "workoutDayId");
      const result = await workoutPlansService.getWorkoutDetail(
        clientId,
        workoutDayId,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async completeWorkout(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = getParam(req, "clientId");
      const workoutDayId = getParam(req, "workoutDayId");
      const input = workoutsSchema.completeWorkout.parse(req.body);
      const result = await workoutPlansService.completeWorkout(
        clientId,
        workoutDayId,
        input,
        requesterFromRequest(req)
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async getClientWorkoutAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const clientId = getParam(req, "clientId");
      const result = await workoutPlansService.getClientWorkoutAnalytics(
        clientId,
        requesterFromRequest(req)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  }
};
