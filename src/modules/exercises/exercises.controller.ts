import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { DifficultyLevel, EquipmentType, MuscleGroup } from "@prisma/client";

import { ExerciseError, exercisesService } from "./exercises.service";

const listSchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  muscleGroup: z.nativeEnum(MuscleGroup).optional(),
  equipment: z.nativeEnum(EquipmentType).optional(),
  level: z.nativeEnum(DifficultyLevel).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

const createSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  muscleGroup: z.nativeEnum(MuscleGroup),
  equipment: z.nativeEnum(EquipmentType),
  level: z.nativeEnum(DifficultyLevel),
  videoUrl: z.string().trim().url().max(500).optional(),
  thumbnailUrl: z.string().trim().url().max(500).optional(),
  instructions: z.string().trim().max(4000).optional()
});

function handleError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof z.ZodError) {
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
      const params = listSchema.parse(req.query);
      const items = await exercisesService.list(params);
      res.status(200).json({ success: true, data: { items } });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = req.params.id;
      const id = Array.isArray(raw) ? raw[0] : raw;
      if (!id) throw new ExerciseError("id required", 400);
      const item = await exercisesService.get(id);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async createForCoach(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = req.params.coachId;
      const coachId = Array.isArray(raw) ? raw[0] : raw;
      if (!coachId) throw new ExerciseError("coachId required", 400);
      if (req.auth?.role !== "coach" || req.auth.userId !== coachId) {
        throw new ExerciseError("Forbidden", 403);
      }
      const input = createSchema.parse(req.body);
      const item = await exercisesService.createForCoach(coachId, input);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      handleError(error, res, next);
    }
  }
};
