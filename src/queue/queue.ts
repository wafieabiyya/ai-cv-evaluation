import { Queue, Worker, type JobsOptions } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const QUEUE_NAME = process.env.QUEUE_NAME || "evaluator";
export const queue = new Queue(QUEUE_NAME, { connection });
// new QueueScheduler(QUEUE_NAME, { connection }); // handle delayed/retries

export type EvalJobPayload = { jobId: string; uploadId: string };

export const defaultJobOptions: JobsOptions = {
  attempts: Number(process.env.JOB_ATTEMPTS ?? 5),
  backoff:
    (process.env.JOB_BACKOFF_TYPE ?? "exponential") === "fixed"
      ? { type: "fixed", delay: Number(process.env.JOB_BACKOFF_MS ?? 3000) }
      : {
          type: "exponential",
          delay: Number(process.env.JOB_BACKOFF_MS ?? 3000),
        },
  removeOnComplete: 100,
  removeOnFail: 100,
};
