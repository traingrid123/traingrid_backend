import { z } from "zod";

export const habitsSchema = {
    createHabit: z.object({
        name: z.string().min(1, "Name required"),
        description: z.string().optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "CUSTOM"]).default("DAILY"),
        targetDaysPerWeek: z.number().min(1).max(7).optional(),
        clientId: z.string().min(1, "Client ID required")
    }),

    updateHabit: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "CUSTOM"]).optional(),
        targetDaysPerWeek: z.number().optional()
    }),

    logHabit: z.object({
        completed: z.boolean(),
        notes: z.string().optional()
    })
};
