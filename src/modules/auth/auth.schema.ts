import { z } from "zod";

const emailSchema = z.string().trim().email().max(255);
const phoneSchema = z.string().trim().min(10).max(20).optional();

const firebaseSessionSchema = z.object({
  idToken: z.string().min(1),
  role: z.enum(["client", "coach"]).optional(),
  profile: z
    .object({
      fullName: z.string().trim().min(1).max(120).optional(),
      email: emailSchema.optional(),
      phone: phoneSchema
    })
    .optional()
});

export const authSchema = {
  firebaseSession: firebaseSessionSchema
};

export type FirebaseSessionInput = z.infer<typeof firebaseSessionSchema>;
