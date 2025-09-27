import { Worker, Job } from "bullmq";
import { connection, QUEUE_NAME, type EvalJobPayload } from "@queue/queue";
import {
  markProcessing,
  completeJob,
  failJob,
  type EvalResult,
} from "@repos/job.repo";
import { getUploadById } from "@repos/upload.repo";

async function processEvaluation(job: Job<EvalJobPayload>) {
  const { jobId, uploadId } = job.data;
  await markProcessing(jobId);

  const upload = await getUploadById(uploadId);
  if (!upload) throw new Error("upload_not_found");

  // --- MOCK LOGIC: will be replaced by ML model
  const cvSignal = upload.cv_path.length % 100;
  const prSignal = upload.report_path.length % 100;

  const result: EvalResult = {
    cv_match_rate: Math.min(100, 50 + Math.floor(cvSignal / 2)),
    project_score: Math.min(100, 55 + Math.floor(prSignal / 2)),
    project_feedback: [
      "Struktur CV rapi.",
      "Project report jelas; tambahkan metrik hasil.",
      "Next: jelaskan trade-off teknis & retry/backoff.",
    ],
    overall_summary:
      "Kandidat promising untuk backend evaluasi; lanjutkan ke tahap tech interview.",
  };

  await completeJob(jobId, result);
}

new Worker<EvalJobPayload>(QUEUE_NAME, processEvaluation, { connection })
  .on("completed", (job) => console.log(`[worker] completed ${job.id}`))
  .on("failed", async (job, err) => {
    if (job?.data?.jobId)
      await failJob(job.data.jobId, err?.message || "unknown_error");
    console.error("[worker] failed", err);
  });

console.log(`[worker] listening on queue "${QUEUE_NAME}"`);
