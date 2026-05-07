import { analyticsJob } from "./analytics.job";
import { dropOffRiskJob } from "./dropOffRisk.job";
import { missedWorkoutJob } from "./missedWorkout.job";
import { streakJob } from "./streak.job";

type RunnableJob = {
  name: string;
  run: () => Promise<unknown>;
};

const jobs: RunnableJob[] = [missedWorkoutJob, streakJob, dropOffRiskJob, analyticsJob];

async function runJob(job: RunnableJob) {
  try {
    const output = await job.run();
    console.log(`[worker] ${job.name} success`, output ?? "");
  } catch (error) {
    console.error(`[worker] ${job.name} failed`, error);
  }
}

export async function startWorker(): Promise<void> {
  console.log("[worker] started");
  await Promise.all(jobs.map((job) => runJob(job)));

  setInterval(() => {
    void runJob(missedWorkoutJob);
  }, 15 * 60 * 1000);

  setInterval(() => {
    void runJob(streakJob);
  }, 30 * 60 * 1000);

  setInterval(() => {
    void runJob(dropOffRiskJob);
  }, 60 * 60 * 1000);

  setInterval(() => {
    void runJob(analyticsJob);
  }, 2 * 60 * 60 * 1000);
}

void startWorker();
