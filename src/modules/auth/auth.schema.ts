import { CoachTier, CoachingMode, Gender } from "@prisma/client";
import { z } from "zod";

const nameSchema = z.string().trim().min(2).max(120);
const emailSchema = z.string().trim().email().max(255);
const phoneSchema = z.string().trim().min(10).max(20).optional();
const passwordSchema = z.string().min(6).max(72).optional(); // Reduced min for dev mode

const baseIdentitySchema = z.object({
  email: emailSchema.or(phoneSchema),
});

const baseRegisterSchema = baseIdentitySchema.extend({
  fullName: nameSchema,
  password: passwordSchema
});

const baseLoginSchema = baseIdentitySchema.extend({
  password: passwordSchema
});

const clientRegisterSchema = baseRegisterSchema.extend({
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.coerce.date().optional()
});

const coachRegisterSchema = baseRegisterSchema.extend({
  tier: z.nativeEnum(CoachTier).optional(),
  specialisations: z.array(z.string().trim().min(2).max(60)).optional(),
  coachingMode: z.nativeEnum(CoachingMode).optional()
});

export const authSchema = {
  clientRegister: clientRegisterSchema,
  clientLogin: baseLoginSchema,
  coachRegister: coachRegisterSchema,
  coachLogin: baseLoginSchema
};

export type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;
export type ClientLoginInput = z.infer<typeof baseLoginSchema>;
export type CoachRegisterInput = z.infer<typeof coachRegisterSchema>;
export type CoachLoginInput = z.infer<typeof baseLoginSchema>;