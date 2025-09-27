export type Decision = "strong_pass" | "pass" | "borderline" | "fail";

const TH_STRONG = Number(process.env.DECISION_STRONG ?? 80);
const TH_PASS = Number(process.env.DECISION_PASS ?? 65);
const TH_BORDER = Number(process.env.DECISION_BORDERLINE ?? 50);

export function decide(
  cv: number,
  project: number,
): {
  decision: Decision;
  reason: string;
  avg: number;
} {
  const avg = (Number(cv) + Number(project)) / 2;
  if (avg >= TH_STRONG)
    return { decision: "strong_pass", reason: "fit tinggi, lanjut cepat", avg };
  if (avg >= TH_PASS)
    return { decision: "pass", reason: "fit cukup, lanjut interview", avg };
  if (avg >= TH_BORDER)
    return {
      decision: "borderline",
      reason: "fit rendah; perlu verifikasi manual",
      avg,
    };
  return { decision: "fail", reason: "mismatch role/stack", avg };
}
