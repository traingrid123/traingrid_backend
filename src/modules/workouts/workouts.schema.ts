import { DifficultyLevel, WeekDay } from "@prisma/client";
import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

const workoutDayExerciseInputSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.coerce.number().int().min(1).max(100).optional(),
  reps: z.string().trim().min(1).max(100).optional(),
  restSeconds: z.coerce.number().int().min(0).max(3600).optional(),
  durationSecs: z.coerce.number().int().min(0).max(7200).optional(),
  tempo: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1000).optional(),
  orderIndex: z.coerce.number().int().min(1)
});

const workoutDayInputSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  weekNumber: z.coerce.number().int().min(1).max(52).default(1),
  dayOfWeek: z.nativeEnum(WeekDay).optional(),
  orderIndex: z.coerce.number().int().min(1),
  isRestDay: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional(),
  exercises: z.array(workoutDayExerciseInputSchema).max(60).default([])
});

const createWorkoutPlanSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional(),
  level: z.nativeEnum(DifficultyLevel),
  durationWeeks: z.coerce.number().int().min(1).max(104).optional(),
  isTemplate: z.boolean().optional().default(false),
  isDraft: z.boolean().optional().default(false),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  days: z.array(workoutDayInputSchema).min(1).max(365)
});

const updateWorkoutPlanSchema = z.object({
  expectedVersion: z.coerce.number().int().min(1),
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  level: z.nativeEnum(DifficultyLevel).optional(),
  durationWeeks: z.coerce.number().int().min(1).max(104).optional().nullable(),
  isTemplate: z.boolean().optional(),
  isDraft: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  days: z.array(workoutDayInputSchema).min(1).max(365).optional()
});

const duplicateWorkoutPlanSchema = z.object({
  mode: z.enum(["WEEKLY", "MONTHLY"]).default("WEEKLY"),
  title: z.string().trim().min(2).max(160).optional(),
  isDraft: z.boolean().optional()
});

const assignmentSchema = z.object({
  clientId: z.string().min(1),
  workoutPlanId: z.string().min(1),
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().optional()
});

const completeWorkoutSchema = z.object({
  loggedAt: z.coerce.date().optional(),
  sourceEventId: z.string().trim().min(8).max(120).optional(),
  durationMinutes: z.coerce.number().int().min(1).max(600).optional(),
  perceivedEffort: z.coerce.number().int().min(1).max(10).optional(),
  notes: z.string().trim().max(2000).optional(),
  exerciseLogs: z
    .array(
      z.object({
        exerciseId: z.string().min(1).optional(),
        exerciseName: z.string().trim().min(1).max(160),
        sets: z.unknown().optional(),
        notes: z.string().trim().max(1000).optional()
      })
    )
    .max(120)
    .optional()
});

export const workoutsSchema = {
  pagination: paginationSchema,
  createPlan: createWorkoutPlanSchema,
  updatePlan: updateWorkoutPlanSchema,
  duplicatePlan: duplicateWorkoutPlanSchema,
  assignment: assignmentSchema,
  completeWorkout: completeWorkoutSchema
};

export type CreateWorkoutPlanInput = z.infer<typeof createWorkoutPlanSchema>;
export type UpdateWorkoutPlanInput = z.infer<typeof updateWorkoutPlanSchema>;
export type DuplicateWorkoutPlanInput = z.infer<typeof duplicateWorkoutPlanSchema>;
export type AssignWorkoutPlanInput = z.infer<typeof assignmentSchema>;
export type CompleteWorkoutInput = z.infer<typeof completeWorkoutSchema>;
export type WorkoutPaginationInput = z.infer<typeof paginationSchema>;
