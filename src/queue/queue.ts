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
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 100,
};
