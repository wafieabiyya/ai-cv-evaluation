import "dotenv/config";
import { queryRows } from "@db/pool";
import { PgvectorRAG } from "@rag/pgvector.store";
import { makeEmbedder } from "@llm/embedder.factory";
import type { KbType } from "@rag/ports";

async function main() {
  const rag = new PgvectorRAG(makeEmbedder());

  const rows = await queryRows<{
    id: string;
    type: KbType;
    title: string;
    raw_text: string;
  }>(
    `SELECT id, type, title, raw_text FROM kb_docs WHERE embedding IS NULL LIMIT 10000`,
  );

  let ok = 0;
  for (const r of rows) {
    await rag.upsertDoc(r);
    ok++;
  }
  console.log({ updated: ok });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
