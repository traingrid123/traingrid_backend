import { ClientStatus, CoachTier, CoachingMode, DropOffRisk, Gender } from "@prisma/client";
import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

const certificationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  issuingBody: z.string().trim().min(2).max(120).optional(),
  fileUrl: z.string().trim().url().max(2000).optional(),
  isVerified: z.boolean().optional(),
  expiresAt: z.coerce.date().optional()
});

const pricingTierSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(2).max(120),
  price: z.coerce.number().nonnegative(),
  currency: z.string().trim().min(3).max(10).default("INR"),
  billingCycle: z.string().trim().min(2).max(50),
  features: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional()
});

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  profilePhoto: z.string().trim().url().max(2000).optional().nullable(),
  location: z.string().trim().min(1).max(160).optional().nullable(),
  city: z.string().trim().min(2).max(80).optional().nullable(),
  country: z.string().trim().min(2).max(80).optional().nullable(),
  yearsExperience: z.coerce.number().int().min(0).max(80).optional().nullable(),
  specialization: z.string().trim().min(1).max(120).optional().nullable(),
  specialisations: z.array(z.string().trim().min(2).max(60)).min(1).max(12).optional(),
  monthlyFee: z.coerce.number().nonnegative().optional().nullable(),
  coachingMode: z.nativeEnum(CoachingMode).optional().nullable(),
  bio: z.string().trim().max(4000).optional().nullable(),
  instagramUrl: z.string().trim().url().max(2000).optional().nullable(),
  websiteUrl: z.string().trim().url().max(2000).optional().nullable(),
  tier: z.nativeEnum(CoachTier).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  setupCompleted: z.boolean().optional(),
  peopleTrainedCount: z.coerce.number().int().min(0).optional(),
  certifications: z.array(certificationSchema).max(20).optional(),
  marketingProfile: z
    .object({
      headline: z.string().trim().max(160).optional().nullable(),
      philosophy: z.string().trim().max(4000).optional().nullable(),
      ctaBookCall: z.boolean().optional(),
      ctaAskQuestion: z.boolean().optional(),
      ctaBuyProgram: z.boolean().optional(),
      isPublished: z.boolean().optional(),
      pricingTiers: z.array(pricingTierSchema).max(10).optional()
    })
    .optional()
});

const discoverCoachesSchema = paginationSchema.extend({
  search: z.string().trim().min(1).max(120).optional(),
  specialisation: z.string().trim().min(1).max(60).optional(),
  coachingMode: z.nativeEnum(CoachingMode).optional(),
  verifiedOnly: z.coerce.boolean().optional()
});

const listClientsSchema = paginationSchema.extend({
  status: z.nativeEnum(ClientStatus).optional(),
  goal: z.string().trim().min(1).max(120).optional(),
  planType: z.enum(["workout", "nutrition", "combined"]).optional(),
  risk: z.nativeEnum(DropOffRisk).optional(),
  search: z.string().trim().min(1).max(120).optional()
});

const addClientSchema = z.object({
  clientId: z.string().min(1),
  status: z.nativeEnum(ClientStatus).default(ClientStatus.ACTIVE),
  workoutPlanId: z.string().min(1).optional(),
  nutritionPlanId: z.string().min(1).optional(),
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().optional(),
  monthlyFee: z.coerce.number().nonnegative().optional(),
  nextPaymentDue: z.coerce.date().optional(),
  dropOffRisk: z.nativeEnum(DropOffRisk).optional(),
  notes: z.string().trim().max(4000).optional()
});

export const coachesSchema = {
  pagination: paginationSchema,
  discover: discoverCoachesSchema,
  updateProfile: profileUpdateSchema,
  listClients: listClientsSchema,
  addClient: addClientSchema
};

export type DiscoverCoachesInput = z.infer<typeof discoverCoachesSchema>;
export type UpdateCoachProfileInput = z.infer<typeof profileUpdateSchema>;
export type ListCoachClientsInput = z.infer<typeof listClientsSchema>;
export type AddCoachClientInput = z.infer<typeof addClientSchema>;
