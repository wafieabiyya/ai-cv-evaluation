export type CvBreakdown = {
  tech: number; // 1..5
  experience: number; // 1..5
  achievements: number; // 1..5
  culture: number; // 1..5
};

export type ProjectBreakdown = {
  correctness: number; // 1..5
  code: number; // 1..5
  resilience: number; // 1..5
  docs: number; // 1..5
  creativity: number; // 1..5
};

export const WEIGHT = {
  cv: { tech: 0.4, experience: 0.25, achievements: 0.2, culture: 0.15 },
  prj: {
    correctness: 0.3,
    code: 0.25,
    resilience: 0.2,
    docs: 0.15,
    creativity: 0.1,
  },
} as const;

export function weighted5(
  bd: CvBreakdown | ProjectBreakdown,
  w: Record<string, number>,
) {
  let sum = 0;
  for (const k of Object.keys(w)) sum += (bd as any)[k] * (w as any)[k];
  return sum; // 1..5
}
export const toPercent = (x: number) => Math.round(x * 20);
