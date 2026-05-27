import { z } from "zod";

export const relationshipsSchema = {
    createRelationship: z.object({
        clientId: z.string().min(1, "Client ID required"),
        monthlyFee: z.number().nonnegative().optional(),
        notes: z.string().optional()
    }),

    updateRelationship: z.object({
        status: z.enum(["ACTIVE", "PAUSED", "INACTIVE"]).optional(),
        monthlyFee: z.number().nonnegative().optional(),
        notes: z.string().optional(),
        dropOffRisk: z.enum(["LOW", "MEDIUM", "HIGH"]).optional()
    }),

    assignPlan: z.object({
        planId: z.string().min(1, "Plan ID required")
    })
};
