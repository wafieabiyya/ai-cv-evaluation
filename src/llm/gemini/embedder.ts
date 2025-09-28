import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EmbeddingsPort } from "@rag/ports";

export class GeminiEmbedder implements EmbeddingsPort {
  private model: string;
  private client: GoogleGenerativeAI;
  constructor() {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
  }
  async embed(text: string): Promise<number[]> {
    const mdl = this.client.getGenerativeModel({ model: this.model });
    const res: any = await mdl.embedContent(text);
    return res?.embedding?.values as number[];
  }
}
