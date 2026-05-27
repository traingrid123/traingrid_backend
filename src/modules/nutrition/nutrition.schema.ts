import { z } from "zod";

export const nutritionSchema = {
    createPlan: z.object({
        title: z.string().min(1, "Title required"),
        description: z.string().optional(),
        level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
        clientId: z.string().optional()
    }),

    updatePlan: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional()
    }),

    addFoodItem: z.object({
        name: z.string().min(1, "Name required"),
        servingSize: z.string().optional(),
        calories: z.number().positive().optional(),
        protein: z.number().nonnegative().optional(),
        carbs: z.number().nonnegative().optional(),
        fat: z.number().nonnegative().optional()
    })
};
