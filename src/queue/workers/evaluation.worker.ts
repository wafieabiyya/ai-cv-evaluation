import { Worker, Job } from "bullmq";
import { connection, QUEUE_NAME, type EvalJobPayload } from "@queue/queue";
import { markProcessing, completeJob, failJob } from "@repos/job.repo";
import { getUploadById } from "@repos/upload.repo";
import { PgvectorRAG } from "@rag/pgvector.store";
import { makeEmbedder } from "@llm/embedder.factory";
import { makeLLM } from "@llm/llm.factory";
import { extractText, clip, snippet } from "@utils/text-extract";
import { decide } from "@utils/decision";

const rag = new PgvectorRAG(makeEmbedder());
const llm = makeLLM();
const RAG_TOPK = Number(process.env.RAG_TOPK || 3);
const MAX_CHARS = Number(process.env.MAX_EXTRACT_CHARS || 4000);

function sim01FromCosineDistance(d?: number | null) {
  if (d == null) return 0;
  const clamped = Math.max(0, Math.min(2, d));
  return Math.round((1 - clamped / 2) * 1000) / 1000; // 0..1
}

async function processEvaluation(job: Job<EvalJobPayload>) {
  const { jobId, uploadId } = job.data;
  await markProcessing(jobId);

  const up = await getUploadById(uploadId);
  if (!up) throw new Error("upload_not_found");

  const cvText = clip(
    await extractText(up.cv_path, up.cv_mime || undefined),
    MAX_CHARS,
  );
  const prText = clip(
    await extractText(up.report_path, up.report_mime || undefined),
    MAX_CHARS,
  );

  const query =
    `Evaluate candidate backend fit (Node.js, Postgres, Redis/queues, retry/backoff, RAG/pgvector).\n\n` +
    `CV:\n${cvText}\n\nProject:\n${prText}`;

  const ctx = await rag.search(query, RAG_TOPK);

  let scored;
  try {
    scored = await llm.scoreCandidate({
      cvText,
      projectText: prText,
      contexts: ctx.map((c) => ({
        title: c.title,
        raw_text: clip(c.raw_text, 1200),
      })),
      locale: "id-ID",
    });
  } catch (e) {
    // fallback
    const baseCv = Math.min(100, 50 + Math.floor(cvText.length / 200));
    const basePr = Math.min(100, 55 + Math.floor(prText.length / 200));
    const boost = Math.round(
      (ctx.reduce((a, c) => a + (1 - (c.distance ?? 1)), 0) /
        Math.max(1, ctx.length)) *
        10,
    );
    scored = {
      cv_match_rate: Math.min(100, baseCv + boost),
      project_score: Math.min(100, basePr + boost),
      overall_summary: "LLM unavailable; using heuristic fallback.",
      project_feedback: [
        "Periksa ulang retry/backoff & dokumentasi arsitektur.",
      ],
    };
  }

  const contexts = ctx.map((c) => ({
    id: c.id,
    type: c.type,
    title: c.title,
    similarity: sim01FromCosineDistance(c.distance),
    excerpt: snippet(c.raw_text),
  }));

  const meta = decide(scored.cv_match_rate, scored.project_score);

  await completeJob(jobId, { ...scored, contexts, meta } as any);
}

new Worker<EvalJobPayload>(QUEUE_NAME, processEvaluation, { connection })
  .on("failed", async (job, err) => {
    const attempts = job?.opts?.attempts ?? 1;
    console.warn(
      `[worker] failed attempt ${job?.attemptsMade}/${attempts}:`,
      err?.message,
    );

    if (job && job.attemptsMade >= attempts) {
      if (job.data?.jobId)
        await failJob(job.data.jobId, err?.message || "unknown_error");
    }
  })
  .on("completed", (job) => console.log(`[worker] completed ${job.id}`));

console.log(`[worker] listening on queue "${QUEUE_NAME}"`);
