import { z } from "zod";

export const pricingTiersSchema = {
  create: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    price: z.coerce.number().nonnegative("Price must be non-negative"),
    currency: z.string().trim().min(3).max(10).default("INR"),
    billingCycle: z.string().trim().min(2).max(50).default("monthly"),
    features: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
    isPopular: z.boolean().default(false),
    isActive: z.boolean().default(true)
  }),

  update: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    price: z.coerce.number().nonnegative().optional(),
    currency: z.string().trim().min(3).max(10).optional(),
    billingCycle: z.string().trim().min(2).max(50).optional(),
    features: z.array(z.string().trim().min(1).max(160)).max(20).optional(),
    isPopular: z.boolean().optional(),
    isActive: z.boolean().optional()
  }),

  setPopular: z.object({
    isPopular: z.boolean().default(true)
  })
};

export type PricingTierCreateInput = z.infer<typeof pricingTiersSchema.create>;
export type PricingTierUpdateInput = z.infer<typeof pricingTiersSchema.update>;
