import { CoachTier, CoachingMode, Gender } from "@prisma/client";
import { z } from "zod";

const nameSchema = z.string().trim().min(2).max(120);
const emailSchema = z.string().trim().email().max(255);
const phoneSchema = z.string().trim().min(7).max(20);
const passwordSchema = z.string().min(8).max(72);

const baseIdentitySchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional()
});

const baseRegisterSchema = baseIdentitySchema
  .extend({
    fullName: nameSchema,
    password: passwordSchema
  });

const baseLoginSchema = baseIdentitySchema
  .extend({
    password: passwordSchema
  })
  .refine((data) => data.email || data.phone, {
    message: "Email or phone is required",
    path: ["email"]
  });

const clientRegisterSchema = baseRegisterSchema.extend({
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.coerce.date().optional()
});

const coachRegisterSchema = baseRegisterSchema.extend({
  tier: z.nativeEnum(CoachTier),
  specialisations: z.array(z.string().trim().min(2).max(60)).min(1).max(10),
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
