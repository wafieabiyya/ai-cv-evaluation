import { queue, defaultJobOptions, type EvalJobPayload } from "@queue/queue";

export async function enqueueEvaluation(p: EvalJobPayload) {
  return queue.add("evaluate", p, { jobId: p.jobId, ...defaultJobOptions });
}
