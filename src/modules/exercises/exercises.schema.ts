import { DifficultyLevel, EquipmentType, MuscleGroup } from "@prisma/client";
import { z } from "zod";

export const exercisesSchema = {
  list: z.object({
    search: z.string().optional(),
    muscleGroup: z.nativeEnum(MuscleGroup).optional(),
    equipment: z.nativeEnum(EquipmentType).optional(),
    level: z.nativeEnum(DifficultyLevel).optional(),
    limit: z.coerce.number().int().positive().max(100).default(20),
    offset: z.coerce.number().int().nonnegative().default(0)
  }),

  create: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    muscleGroup: z.nativeEnum(MuscleGroup),
    equipment: z.nativeEnum(EquipmentType),
    level: z.nativeEnum(DifficultyLevel),
    videoUrl: z.string().url().optional(),
    thumbnailUrl: z.string().url().optional(),
    instructions: z.string().max(5000).optional()
  }),

  update: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    muscleGroup: z.nativeEnum(MuscleGroup).optional(),
    equipment: z.nativeEnum(EquipmentType).optional(),
    level: z.nativeEnum(DifficultyLevel).optional(),
    videoUrl: z.string().url().optional(),
    thumbnailUrl: z.string().url().optional(),
    instructions: z.string().max(5000).optional()
  })
};

export type ListExercisesInput = z.infer<typeof exercisesSchema.list>;
export type CreateExerciseInput = z.infer<typeof exercisesSchema.create>;
export type UpdateExerciseInput = z.infer<typeof exercisesSchema.update>;
