import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  CORS_ORIGIN: z.string().default("*"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  PASSWORD_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  SWAGGER_ENABLED: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  VITE_USDA_API_KEY: z.string().optional().default("igpNworMcrAU7FneUKywX5RPFiB8QvbA9fhHLvH0"),
  USDA_BASE_URL: z.string().url().default("https://api.nal.usda.gov/fdc/v1"),
  USDA_CACHE_TTL_HOURS: z.coerce.number().int().min(1).max(8760).default(168)
});

export const env = envSchema.parse(process.env);

export type AppEnv = typeof env;
