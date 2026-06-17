import { z } from "zod";

export const marketingSchema = {
  upsertProfile: z.object({
    headline: z.string().max(200).optional(),
    philosophy: z.string().max(2000).optional(),
    ctaBookCall: z.boolean().optional(),
    ctaAskQuestion: z.boolean().optional(),
    ctaBuyProgram: z.boolean().optional(),
    isPublished: z.boolean().optional()
  }),

  createPricingTier: z.object({
    name: z.string().min(1).max(100),
    price: z.number().nonnegative(),
    currency: z.string().default("INR"),
    billingCycle: z.string().min(1),
    features: z.array(z.string()).default([]),
    isPopular: z.boolean().default(false)
  }),

  updatePricingTier: z.object({
    name: z.string().min(1).max(100).optional(),
    price: z.number().nonnegative().optional(),
    currency: z.string().optional(),
    billingCycle: z.string().optional(),
    features: z.array(z.string()).optional(),
    isPopular: z.boolean().optional(),
    isActive: z.boolean().optional()
  }),

  createTestimonial: z.object({
    clientName: z.string().min(1).max(100),
    clientPhoto: z.string().url().optional(),
    content: z.string().min(10).max(2000),
    rating: z.number().int().min(1).max(5).optional(),
    beforePhotoUrl: z.string().url().optional(),
    afterPhotoUrl: z.string().url().optional()
  })
};

export type UpsertMarketingProfileInput = z.infer<typeof marketingSchema.upsertProfile>;
export type CreatePricingTierInput = z.infer<typeof marketingSchema.createPricingTier>;
export type UpdatePricingTierInput = z.infer<typeof marketingSchema.updatePricingTier>;
export type CreateTestimonialInput = z.infer<typeof marketingSchema.createTestimonial>;
