import { Gender } from "@prisma/client";
import { z } from "zod";

const nullableStringFromUnknown = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => (typeof item === "string" ? item.trim() : String(item)))
      .filter(Boolean)
      .join(", ");
    return joined || null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  return String(value);
}, z.string().optional().nullable());

const genderInputSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  if (normalized === "PREFER_NOT_TO_SAY" || normalized === "PREFERNOTTOSAY") {
    return "PREFER_NOT_TO_SAY";
  }

  return normalized;
}, z.nativeEnum(Gender).optional().nullable());

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  age: z.coerce.number().int().min(0).max(120).optional().nullable(),
  gender: genderInputSchema,
  profilePhoto: z.string().trim().url().max(2000).optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  city: z.string().trim().min(2).max(80).optional().nullable(),
  country: z.string().trim().min(2).max(80).optional().nullable(),
  heightCm: z.coerce.number().positive().max(300).optional().nullable(),
  startingWeight: z.coerce.number().positive().max(500).optional().nullable(),
  currentWeight: z.coerce.number().positive().max(500).optional().nullable(),
  goalWeight: z.coerce.number().positive().max(500).optional().nullable(),
  primaryGoal: nullableStringFromUnknown,
  fitnessGoal: nullableStringFromUnknown,
  experienceLevel: nullableStringFromUnknown,
  dietaryPreference: nullableStringFromUnknown,
  pastInjuries: nullableStringFromUnknown,
  setupCompleted: z.boolean().optional(),
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
