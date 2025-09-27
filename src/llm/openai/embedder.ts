import OpenAI from "openai";
import type { EmbeddingsPort } from "@rag/ports";

export class OpenAIEmbedder implements EmbeddingsPort {
  private client: OpenAI;
  private model: string;
  constructor() {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  }
  async embed(text: string): Promise<number[]> {
    const r = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });
    return r.data[0]?.embedding as unknown as number[];
  }
}
