import type { EmbeddingsPort } from "@rag/ports";

export class MockEmbedder implements EmbeddingsPort {
  async embed(text: string): Promise<number[]> {
    const dim = (Number(process.env.EMBEDDING_DIM) || 1536) | 0;
    const out: number[] = Array(dim).fill(0);

    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      const idx = c % dim;

      out[idx] = (out[idx] ?? 0) + 1;
    }

    const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
    return out.map((v) => v / norm);
  }
}
