import Redis from "ioredis";

import { env } from "../config/env";
import { logger } from "./logger";

let redisClient: Redis | null = null;
let lastRedisErrorLogAt = 0;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      retryStrategy: (attempt) => Math.min(attempt * 500, 5000)
    });

    redisClient.on("error", (error) => {
      const now = Date.now();
      // Prevent log floods when Redis is unavailable.
      if (now - lastRedisErrorLogAt > 10000) {
        logger.warn({ error }, "Redis client error");
        lastRedisErrorLogAt = now;
      }
    });
  }

  return redisClient;
}
