import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { exercisesSchema } from "./exercises.schema";
import { ExerciseError, exercisesService } from "./exercises.service";

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
  if (error instanceof ExerciseError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  next(error);
}

export const exercisesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const params = exercisesSchema.list.parse(req.query);
      const coachId = req.auth?.userId;
      const result = await exercisesService.listExercises(params, coachId);
      res.json({ success: true, data: result.items, total: result.total });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const exercise = await exercisesService.getExercise(p(req, "exerciseId"));
      res.json({ success: true, data: exercise });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async createCustom(req: Request, res: Response, next: NextFunction) {
    try {
      const data = exercisesSchema.create.parse(req.body);
      const exercise = await exercisesService.createCustomExercise(getRequesterId(req), data);
      res.status(201).json({ success: true, data: exercise });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = exercisesSchema.update.parse(req.body);
      const exercise = await exercisesService.updateExercise(getRequesterId(req), p(req, "exerciseId"), data);
      res.json({ success: true, data: exercise });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await exercisesService.deleteExercise(getRequesterId(req), p(req, "exerciseId"));
      res.json({ success: true, message: "Exercise deleted" });
    } catch (error) {
      handleError(error, res, next);
    }
  }
};
