import { z } from "zod";
import type { LLMScoreRaw } from "@llm/ports";

const clamp15 = (n: unknown) => Math.max(1, Math.min(5, Number(n) || 1));

const Schema = z.object({
  cvBreakdown: z.object({
    tech: z.number(),
    experience: z.number(),
    achievements: z.number(),
    culture: z.number(),
  }),
  projectBreakdown: z.object({
    correctness: z.number(),
    code: z.number(),
    resilience: z.number(),
    docs: z.number(),
    creativity: z.number(),
  }),
  summary: z.string().min(10),
  feedback: z.array(z.string()).min(1),
});

export function parseEvalJson(raw: string): LLMScoreRaw {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    throw new Error("llm_invalid_json");
  }
  const data = Schema.parse(obj);

  for (const k of Object.keys(data.cvBreakdown))
    (data.cvBreakdown as any)[k] = clamp15((data.cvBreakdown as any)[k]);
  for (const k of Object.keys(data.projectBreakdown))
    (data.projectBreakdown as any)[k] = clamp15(
      (data.projectBreakdown as any)[k],
    );

  const sents = data.summary.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sents.length > 5) data.summary = sents.slice(0, 5).join(" ");

  return data as LLMScoreRaw;
}
