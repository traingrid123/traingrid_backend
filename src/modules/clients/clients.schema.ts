import { Gender } from "@prisma/client";
import { z } from "zod";

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  profilePhoto: z.string().trim().url().max(2000).optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  city: z.string().trim().min(2).max(80).optional().nullable(),
  country: z.string().trim().min(2).max(80).optional().nullable(),
  heightCm: z.coerce.number().positive().max(300).optional().nullable(),
  startingWeight: z.coerce.number().positive().max(500).optional().nullable(),
  currentWeight: z.coerce.number().positive().max(500).optional().nullable(),
  goalWeight: z.coerce.number().positive().max(500).optional().nullable(),
  fitnessGoal: z.string().trim().min(2).max(120).optional().nullable(),
  isActive: z.boolean().optional()
});

const leaderboardSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

export const clientsSchema = {
  updateProfile: profileUpdateSchema,
  leaderboard: leaderboardSchema
};

export type UpdateClientProfileInput = z.infer<typeof profileUpdateSchema>;
export type ClientLeaderboardInput = z.infer<typeof leaderboardSchema>;
