import { Worker, Job } from "bullmq";
import { connection, QUEUE_NAME, type EvalJobPayload } from "@queue/queue";
import { markProcessing, completeJob, failJob } from "@repos/job.repo";
import { getUploadById } from "@repos/upload.repo";
import { PgvectorRAG } from "@rag/pgvector.store";
import { makeEmbedder } from "@llm/embedder.factory";
import { makeLLM } from "@llm/llm.factory";
import { extractText, clip, snippet } from "@utils/text-extract";
import { decide } from "@utils/decision";
import { WEIGHT, weighted5, toPercent } from "@utils/scoring";

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

  let result: {
    cv_breakdown: Record<string, number>;
    project_breakdown: Record<string, number>;
    cv_match_rate: number;
    project_score: number;
    overall_summary: string;
    project_feedback: string[];
  };

  try {
    const raw = await llm.scoreCandidate({
      cvText,
      projectText: prText,
      contexts: ctx.map((c) => ({
        title: c.title,
        raw_text: clip(c.raw_text, 1200),
      })),
      locale: "id-ID",
    });

    const cv5 = weighted5(raw.cvBreakdown, WEIGHT.cv);
    const pr5 = weighted5(raw.projectBreakdown, WEIGHT.prj);

    result = {
      cv_breakdown: raw.cvBreakdown,
      project_breakdown: raw.projectBreakdown,
      cv_match_rate: toPercent(cv5),
      project_score: toPercent(pr5),
      overall_summary: raw.summary,
      project_feedback: raw.feedback,
    };
  } catch (e) {
    const simAvg =
      ctx.length > 0
        ? ctx.reduce((a, c) => a + (1 - (c.distance ?? 1)), 0) / ctx.length
        : 0;

    const clamp15 = (n: number) => Math.max(1, Math.min(5, n));

    const cv_bd = {
      tech: clamp15(2 + simAvg * 2.5),
      experience: clamp15(1 + Math.min(cvText.length / 1500, 4)),
      achievements: clamp15(1 + Math.min(cvText.length / 2200, 4)),
      culture: clamp15(2 + (prText.length > 800 ? 1 : 0) + simAvg),
    };

    const pr_bd = {
      correctness: clamp15(2 + simAvg * 2),
      code: clamp15(2 + Math.min(prText.length / 1800, 3)),
      resilience: clamp15(
        2 +
          (/\b(retry|backoff|idempotent|idempotency)\b/i.test(prText)
            ? 1.5
            : 0) +
          simAvg,
      ),
      docs: clamp15(2 + (prText.length > 1200 ? 1 : 0)),
      creativity: clamp15(2 + (/rag|pgvector/i.test(prText) ? 1 : 0)),
    };

    const cv5 = weighted5(cv_bd, WEIGHT.cv);
    const pr5 = weighted5(pr_bd, WEIGHT.prj);

    result = {
      cv_breakdown: cv_bd,
      project_breakdown: pr_bd,
      cv_match_rate: toPercent(cv5),
      project_score: toPercent(pr5),
      overall_summary:
        "LLM unavailable; heuristic scoring based on similarity and signal density.",
      project_feedback: [
        "Perjelas kontribusi backend & metrik dampak.",
        "Tambahkan trade-off arsitektur & dokumenkan retry/idempotency.",
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

  const meta = decide(result.cv_match_rate, result.project_score);

  await completeJob(jobId, { ...result, contexts, meta } as any);
}

new Worker<EvalJobPayload>(QUEUE_NAME, processEvaluation, { connection })
  .on("failed", async (job, err) => {
    const attempts = job?.opts?.attempts ?? 1;
    console.warn(
      `[worker] failed attempt ${job?.attemptsMade}/${attempts}:`,
      (err as any)?.message,
    );

    if (job && job.attemptsMade >= attempts) {
      if (job.data?.jobId)
        await failJob(job.data.jobId, (err as any)?.message || "unknown_error");
    }
  })
  .on("completed", (job) => console.log(`[worker] completed ${job.id}`));

console.log(`[worker] listening on queue "${QUEUE_NAME}"`);
