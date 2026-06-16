import { createQueue } from "../../lib/queue";

let queue: ReturnType<typeof createQueue> | null = null;

function getQueue() {
  if (!queue) {
    queue = createQueue("notifications");
  }
  return queue;
}

export async function addNotificationJob(type: string, payload: Record<string, unknown>) {
  try {
    return await getQueue().add(type, payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 }
    });
  } catch {
    // Non-critical: log but don't fail the request if Redis is unavailable
    console.warn("[notificationQueue] Failed to enqueue job:", type);
  }
}
