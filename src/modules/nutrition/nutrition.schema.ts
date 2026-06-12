import { MealType } from "@prisma/client";
import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

const listFiltersSchema = paginationSchema.extend({
  search: z.string().trim().min(1).max(120).optional(),
  tag: z.string().trim().min(1).max(60).optional(),
  includeArchived: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) =>
      v === undefined ? false : v === true || v === "true" || v === "1"
    ),
  archivedOnly: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) =>
      v === undefined ? false : v === true || v === "true" || v === "1"
    )
});

const mealFoodInputSchema = z.object({
  foodItemId: z.string().min(1).optional(),
  fdcId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(160).optional(),
  brand: z.string().trim().max(160).optional(),
  quantityGrams: z.coerce.number().min(0).max(10000),
  servingSize: z.coerce.number().min(0).max(10000).optional(),
  caloriesPer100g: z.coerce.number().min(0).max(10000).optional(),
  proteinPer100g: z.coerce.number().min(0).max(1000).optional(),
  carbsPer100g: z.coerce.number().min(0).max(1000).optional(),
  fatsPer100g: z.coerce.number().min(0).max(1000).optional(),
  fiberPer100g: z.coerce.number().min(0).max(1000).optional(),
  notes: z.string().trim().max(500).optional(),
  orderIndex: z.coerce.number().int().min(1)
}).refine((d) => d.foodItemId || d.fdcId || d.name, {
  message: "Either foodItemId, fdcId, or name is required"
});

const mealSectionInputSchema = z.object({
  mealType: z.nativeEnum(MealType),
  name: z.string().trim().min(1).max(160).optional(),
  dayNumber: z.coerce.number().int().min(1).max(60).default(1),
  weekNumber: z.coerce.number().int().min(1).max(52).default(1),
  targetCalories: z.coerce.number().int().min(0).max(10000).optional(),
  targetProtein: z.coerce.number().min(0).max(1000).optional(),
  targetCarbs: z.coerce.number().min(0).max(1000).optional(),
  targetFats: z.coerce.number().min(0).max(1000).optional(),
  orderIndex: z.coerce.number().int().min(1),
  notes: z.string().trim().max(1000).optional(),
  foods: z.array(mealFoodInputSchema).max(60).default([])
});

const createPlanSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional(),
  goal: z.string().trim().max(200).optional(),
  dailyCalories: z.coerce.number().int().min(0).max(15000).optional(),
  proteinGrams: z.coerce.number().min(0).max(2000).optional(),
  carbsGrams: z.coerce.number().min(0).max(2000).optional(),
  fatsGrams: z.coerce.number().min(0).max(2000).optional(),
  fiberGrams: z.coerce.number().min(0).max(2000).optional(),
  waterMl: z.coerce.number().int().min(0).max(20000).optional(),
  durationWeeks: z.coerce.number().int().min(1).max(104).optional(),
  isTemplate: z.boolean().optional().default(true),
  isDraft: z.boolean().optional().default(false),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  meals: z.array(mealSectionInputSchema).max(120).default([])
});

const updatePlanSchema = z.object({
  expectedVersion: z.coerce.number().int().min(1).optional(),
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  goal: z.string().trim().max(200).optional().nullable(),
  dailyCalories: z.coerce.number().int().min(0).max(15000).optional().nullable(),
  proteinGrams: z.coerce.number().min(0).max(2000).optional().nullable(),
  carbsGrams: z.coerce.number().min(0).max(2000).optional().nullable(),
  fatsGrams: z.coerce.number().min(0).max(2000).optional().nullable(),
  fiberGrams: z.coerce.number().min(0).max(2000).optional().nullable(),
  waterMl: z.coerce.number().int().min(0).max(20000).optional().nullable(),
  durationWeeks: z.coerce.number().int().min(1).max(104).optional().nullable(),
  isTemplate: z.boolean().optional(),
  isDraft: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  meals: z.array(mealSectionInputSchema).max(120).optional(),
  propagation: z.enum(["KEEP_OLD", "MIGRATE_NEW"]).optional()
});

const duplicatePlanSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  isDraft: z.boolean().optional()
});

const assignmentSchema = z.object({
  clientId: z.string().min(1).optional(),
  clientIds: z.array(z.string().min(1)).min(1).max(100).optional(),
  nutritionPlanId: z.string().min(1),
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().optional()
}).refine((d) => d.clientId || (d.clientIds && d.clientIds.length > 0), {
  message: "clientId or clientIds is required"
});

const logMealSchema = z.object({
  mealSectionId: z.string().min(1).optional(),
  loggedAt: z.coerce.date().optional(),
  isCompleted: z.boolean().default(true),
  caloriesConsumed: z.coerce.number().int().min(0).max(20000).optional(),
  proteinConsumed: z.coerce.number().min(0).max(2000).optional(),
  carbsConsumed: z.coerce.number().min(0).max(2000).optional(),
  fatsConsumed: z.coerce.number().min(0).max(2000).optional(),
  waterMl: z.coerce.number().int().min(0).max(20000).optional(),
  notes: z.string().trim().max(2000).optional()
});

export const nutritionSchema = {
  pagination: paginationSchema,
  listFilters: listFiltersSchema,
  createPlan: createPlanSchema,
  updatePlan: updatePlanSchema,
  duplicatePlan: duplicatePlanSchema,
  assignment: assignmentSchema,
  logMeal: logMealSchema
};

export type NutritionListFilters = z.infer<typeof listFiltersSchema>;
export type CreateNutritionPlanInput = z.infer<typeof createPlanSchema>;
export type UpdateNutritionPlanInput = z.infer<typeof updatePlanSchema>;
export type DuplicateNutritionPlanInput = z.infer<typeof duplicatePlanSchema>;
export type AssignNutritionPlanInput = z.infer<typeof assignmentSchema>;
export type LogMealInput = z.infer<typeof logMealSchema>;
