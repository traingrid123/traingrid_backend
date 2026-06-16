import { z } from "zod";

export const logsSchema = {
  createWorkoutLog: z.object({
    workoutDayId: z.string().optional(),
    loggedAt: z.string().datetime().optional(),
    isCompleted: z.boolean().default(true),
    durationMinutes: z.number().int().positive().optional(),
    perceivedEffort: z.number().int().min(1).max(10).optional(),
    notes: z.string().max(1000).optional(),
    exercises: z.array(z.object({
      exerciseId: z.string().optional(),
      exerciseName: z.string().min(1),
      sets: z.any().optional(),
      notes: z.string().optional()
    })).default([])
  }),

  listWorkoutLogs: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(20),
    offset: z.coerce.number().int().nonnegative().default(0)
  }),

  logHabit: z.object({
    isCompleted: z.boolean().default(true),
    value: z.string().optional(),
    notes: z.string().max(500).optional(),
    loggedAt: z.string().datetime().optional()
  }),

  listHabitLogs: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    habitId: z.string().optional()
  }),

  logMeal: z.object({
    mealSectionId: z.string().optional(),
    isCompleted: z.boolean().default(true),
    caloriesConsumed: z.number().int().nonnegative().optional(),
    proteinConsumed: z.number().nonnegative().optional(),
    carbsConsumed: z.number().nonnegative().optional(),
    fatsConsumed: z.number().nonnegative().optional(),
    notes: z.string().max(500).optional(),
    loggedAt: z.string().datetime().optional()
  }),

  listNutritionLogs: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional()
  })
};
