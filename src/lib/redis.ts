import Redis from "ioredis";

import { env } from "../config/env";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true
    });
  }

  return redisClient;
}
