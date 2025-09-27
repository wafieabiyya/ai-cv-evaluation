import type { LLMScore } from "@llm/ports";

export function parseEvalJson(s: string): LLMScore {
  let obj: any;
  try {
    obj = JSON.parse(s);
  } catch {
    throw new Error("llm_invalid_json");
  }
  const int01 = (n: any) => {
    const v = Math.round(Number(n));
    return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
  };
  const arr = Array.isArray(obj?.project_feedback) ? obj.project_feedback : [];
  return {
    cv_match_rate: int01(obj?.cv_match_rate),
    project_score: int01(obj?.project_score),
    overall_summary: String(obj?.overall_summary || "").slice(0, 500),
    project_feedback: arr.slice(0, 5).map((x: any) => String(x).slice(0, 200)),
  };
}
