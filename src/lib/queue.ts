import { Queue } from "bullmq";

import { getRedisClient } from "./redis";

export function createQueue(name: string): Queue {
  return new Queue(name, {
    connection: getRedisClient()
  });
}
