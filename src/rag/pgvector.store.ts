import { randomUUID } from "crypto";
import { queryRows, query } from "@db/pool";
import type {
  EmbeddingsPort,
  RAGPort,
  RagDoc,
  RagHit,
  KbType,
} from "@rag/ports";

const DIM = Number(process.env.EMBEDDING_DIM || 1536);

const RawQuery = {
  upsertKbDoc: `
  INSERT INTO kb_docs (id, type, title, raw_text, embedding)
        VALUES ($1, $2, $3, $4, $5::vector)
        ON CONFLICT (id) DO UPDATE
        SET type = EXCLUDED.type,
            title = EXCLUDED.title,
            raw_text = EXCLUDED.raw_text,
            embedding = EXCLUDED.embedding
  `,
  searchKbDoc: `
  SELECT id, type, title, raw_text,
         (embedding <=> $1::vector) AS distance
  FROM 
    kb_docs
  WHERE 
    embedding 
  IS NOT NULL       
  ORDER BY 
    embedding <#> $1::vector
  LIMIT $2
`,
};

function toPgVectorLiteral(vec: number[]) {
  return `[${vec.join(",")}]`;
}

export class PgvectorRAG implements RAGPort {
  constructor(private readonly embedder: EmbeddingsPort) {}

  async upsertDoc(doc: RagDoc): Promise<{ id: string }> {
    const id = doc.id ?? "kb_" + randomUUID();
    const emb = await this.embedder.embed(doc.raw_text);
    if (!Array.isArray(emb) || emb.length !== DIM) {
      throw new Error(
        `embedding_dim_mismatch: got ${emb.length}, expected ${DIM}`,
      );
    }
    await query(RawQuery.upsertKbDoc, [
      id,
      doc.type,
      doc.title,
      doc.raw_text,
      toPgVectorLiteral(emb),
    ]);
    return { id };
  }

  async search(textQuery: string, topK = 4): Promise<RagHit[]> {
    const qvec = await this.embedder.embed(textQuery);
    if (!Array.isArray(qvec) || qvec.length !== DIM) {
      throw new Error(
        `embedding_dim_mismatch: got ${qvec.length}, expected ${DIM}`,
      );
    }
    const rows = await queryRows<{
      id: string;
      type: KbType;
      title: string;
      raw_text: string;
      distance: number;
    }>(RawQuery.searchKbDoc, [toPgVectorLiteral(qvec), topK]);
    return rows;
  }
}
