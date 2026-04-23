import { Queue } from "bullmq";

import { getRedisClient } from "./redis";

export function createQueue(name: string): Queue {
  return new Queue(name, {
    // BullMQ and the app currently resolve slightly different ioredis type copies.
    // The runtime client is valid, so we narrow the mismatch at the boundary.
    connection: getRedisClient() as never
  });
}
