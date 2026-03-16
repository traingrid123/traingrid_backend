import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  CORS_ORIGIN: z.string().default("*"),
  SWAGGER_ENABLED: z
    .string()
    .optional()
    .transform((value) => value !== "false")
});

export const env = envSchema.parse(process.env);

export type AppEnv = typeof env;
