import type { RAGCtx } from "@llm/ports";

export function buildEvalPrompt(p: {
  cvText: string;
  projectText: string;
  contexts: RAGCtx[];
  locale?: string;
}) {
  const locale = p.locale || "id-ID";
  const langLine =
    locale === "id-ID"
      ? "Tulis ringkasan & feedback dalam Bahasa Indonesia."
      : `Write summary & feedback in ${locale}.`;

  const ctxStr = p.contexts
    .map((c, i) => `# Context ${i + 1}: ${c.title}\n${c.raw_text}`)
    .join("\n\n");

  return `
You are a precise evaluator. Output STRICT JSON ONLY (no markdown, no prose outside JSON). ${langLine}
Score each parameter on a 1–5 scale. Do not return percentages.

RUBRIC (weights for information only)
CV (1–5 each):
- tech (40%): alignment with backend (Node.js, DB, APIs, cloud), AI/LLM exposure
- experience (25%): years & project complexity
- achievements (20%): measurable impact/outcomes
- culture (15%): communication, teamwork/leadership, learning mindset

Project (1–5 each):
- correctness (30%): prompt design / chaining / RAG context injection
- code (25%): clean, modular, reusable, tested
- resilience (20%): handles long jobs, retries/backoff, API failures, idempotency
- docs (15%): README clarity, setup, trade-offs explanation
- creativity (10%): useful extras beyond requirements

CONTEXT
${ctxStr}

CANDIDATE_CV
${p.cvText}

PROJECT_REPORT
${p.projectText}

Respond with JSON only in exactly this shape:
{
  "cvBreakdown": { "tech": 1, "experience": 1, "achievements": 1, "culture": 1 },
  "projectBreakdown": { "correctness": 1, "code": 1, "resilience": 1, "docs": 1, "creativity": 1 },
  "summary": "3–5 sentences ...",
  "feedback": ["...", "..."]
}
Rules:
- All scores must be numbers in the range 1..5.
- "summary" must be 3–5 sentences.
- "feedback" is an array of short, actionable bullet points (max 5 items).
- No text outside the JSON.
`.trim();
}
