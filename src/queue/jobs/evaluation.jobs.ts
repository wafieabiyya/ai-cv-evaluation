import { queue, defaultJobOptions, type EvalJobPayload } from "@queue/queue";

export async function enqueueEvaluation(payload: EvalJobPayload) {
  return queue.add("evaluate", payload, defaultJobOptions);
}
