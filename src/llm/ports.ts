export type RAGCtx = { title: string; raw_text: string };

export type LLMScore = {
  cv_match_rate: number; // 0..100
  project_score: number; // 0..100
  overall_summary: string; // <= 500 chars
  project_feedback: string[]; // <= 5 items
};

export interface LLMPort {
  scoreCandidate(input: {
    cvText: string;
    projectText: string;
    contexts: RAGCtx[];
    locale?: string; // e.g. "en" or "id-ID"
  }): Promise<LLMScore>;
}
