import type { RAGCtx } from "@llm/ports";

export function buildEvalPrompt(p: {
  cvText: string;
  projectText: string;
  contexts: RAGCtx[];
  locale?: string;
}) {
  const locale = p.locale || "id-ID";
  const ctxStr = p.contexts
    .map((c, i) => `### Context ${i + 1}: ${c.title}\n${c.raw_text}`)
    .join("\n\n");

  return `
Anda adalah reviewer teknis. Jawab ${
    locale === "id-ID" ? "dalam Bahasa Indonesia" : "in ${locale}"
  }.

Tujuan: Nilai kecocokan kandidat backend berdasarkan CV & project report, dengan mempertimbangkan konteks (job desc / rubric) yang diberikan.

Batasan:
- Skor integer 0..100.
- Feedback maksimal 5 butir, kalimat singkat, actionable.
- Ringkas, hindari basa-basi.

Rubric ringkas:
- CV Match (0..100): relevansi Node.js, Postgres, Redis/queues, retry/backoff, RAG/pgvector, pengalaman nyata, metrik berdampak.
- Project Score (0..100): correctness, arsitektur/code quality, reliability (retries, idempotency), dokumentasi, trade-off.

Format output HARUS JSON murni (tanpa markdown), schema:
{
  "cv_match_rate": number,
  "project_score": number,
  "overall_summary": string,
  "project_feedback": string[]
}

=== CONTEXTS ===
${ctxStr}

=== CV ===
${p.cvText}

=== PROJECT REPORT ===
${p.projectText}
`.trim();
}
