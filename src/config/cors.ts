import cors from "cors";

import { env } from "./env";

const corsOrigins = env.CORS_ORIGIN
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsMiddleware = cors({
  origin: corsOrigins.includes("*") ? true : corsOrigins,
  credentials: true
});
