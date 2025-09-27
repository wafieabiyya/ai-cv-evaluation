-- Up
DROP INDEX IF EXISTS idx_kb_docs_embedding_cos;

ALTER TABLE kb_docs
  ALTER COLUMN embedding TYPE vector(768)
  USING NULL;

CREATE INDEX IF NOT EXISTS idx_kb_docs_embedding_cos
  ON kb_docs USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);
ANALYZE kb_docs;

-- Down
DROP INDEX IF EXISTS idx_kb_docs_embedding_cos;

ALTER TABLE kb_docs
  ALTER COLUMN embedding TYPE vector(1536)
  USING NULL;

CREATE INDEX IF NOT EXISTS idx_kb_docs_embedding_cos
  ON kb_docs USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);
ANALYZE kb_docs;
