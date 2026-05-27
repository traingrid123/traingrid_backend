import { z } from "zod";

export const progressSchema = {
    getProgress: z.object({
        clientId: z.string().min(1, "Client ID required")
    }),

    getMetrics: z.object({
        clientId: z.string().min(1, "Client ID required")
    })
};
