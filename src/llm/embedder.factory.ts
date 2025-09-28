import type { EmbeddingsPort } from "@rag/ports";
import { MockEmbedder } from "@llm/mock/embedder";
import { OpenAIEmbedder } from "@llm/openai/embedder";
import { GeminiEmbedder } from "@llm/gemini/embedder";
import { ResilientEmbedder } from "@llm/resilient.embbeder";

export function makeEmbedder(): EmbeddingsPort {
  const prov = (process.env.EMBEDDING_PROVIDER || "mock").toLowerCase();
  const dim = Number(process.env.EMBEDDING_DIM || 768);

  let primary: EmbeddingsPort;
  if (prov === "openai") primary = new OpenAIEmbedder();
  else if (prov === "gemini") primary = new GeminiEmbedder();
  else primary = new MockEmbedder();

  const fallback = new MockEmbedder();

  return new ResilientEmbedder(primary, fallback, prov);
}
