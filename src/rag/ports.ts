export type KbType = "job_desc" | "rubric";

export interface EmbeddingsPort {
  embed(text: string): Promise<number[]>; // will be implementing LLM
}

export type RagDoc = {
  id?: string;
  type: KbType;
  title: string;
  raw_text: string;
};

export type RagHit = {
  id: string;
  type: KbType;
  title: string;
  raw_text: string;
  distance: number; // pgvector cosine distance
};

export interface RAGPort {
  upsertDoc(doc: RagDoc): Promise<{ id: string }>;
  search(textQuery: string, topK?: number): Promise<RagHit[]>;
}
