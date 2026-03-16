import { createServer } from "http";

import { env } from "./config/env";
import { createApp } from "./app";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { getRedisClient } from "./lib/redis";

async function bootstrap(): Promise<void> {
  const app = createApp();
  const server = createServer(app);

  try {
    await prisma.$connect();
    logger.info("Prisma connected");
  } catch (error) {
    logger.warn({ error }, "Prisma connection failed during startup");
  }

  try {
    await getRedisClient().connect();
    logger.info("Redis connected");
  } catch (error) {
    logger.warn({ error }, "Redis connection failed during startup");
  }

  server.listen(env.PORT, () => {
    logger.info(`TrainGrid backend running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
