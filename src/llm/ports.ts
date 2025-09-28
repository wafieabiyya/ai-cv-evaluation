export type RAGCtx = { title: string; raw_text: string };

import type { CvBreakdown, ProjectBreakdown } from "@utils/scoring";

export type LLMScoreRaw = {
  cvBreakdown: CvBreakdown; // 1..5
  projectBreakdown: ProjectBreakdown; // 1..5
  summary: string; // 3–5 sentences
  feedback: string[]; // bullet points
};

export interface LLMPort {
  scoreCandidate(input: {
    cvText: string;
    projectText: string;
    contexts: RAGCtx[];
    locale?: string; // e.g. "id-ID"
  }): Promise<LLMScoreRaw>;
}
