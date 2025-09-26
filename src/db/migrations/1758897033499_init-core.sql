-- Up Migration

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Enum status job
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('queued','processing','completed','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- uploads: metadata CV & project report
CREATE TABLE IF NOT EXISTS uploads (
  id                TEXT PRIMARY KEY,
  cv_path           TEXT NOT NULL,
  cv_mime           TEXT,
  cv_size_bytes     BIGINT,
  report_path       TEXT NOT NULL,
  report_mime       TEXT,
  report_size_bytes BIGINT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- jobs: status evaluasi async + res
CREATE TABLE IF NOT EXISTS jobs (
  id          TEXT PRIMARY KEY,
  upload_id   TEXT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  status      job_status NOT NULL DEFAULT 'queued',
  attempts    INT NOT NULL DEFAULT 0,
  result_json JSONB,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- auto-update updated_at
CREATE OR REPLACE FUNCTION set_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jobs_set_timestamp ON jobs;
CREATE TRIGGER trg_jobs_set_timestamp
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();


CREATE INDEX IF NOT EXISTS idx_jobs_status     ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_upload_id  ON jobs(upload_id);


CREATE TABLE IF NOT EXISTS kb_docs (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL CHECK (type IN ('job_desc','rubric')),
  title      TEXT NOT NULL DEFAULT '',
  raw_text   TEXT NOT NULL,
  embedding  VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- index vektor (cosine)
CREATE INDEX IF NOT EXISTS kb_docs_embedding_idx
  ON kb_docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);


-- Down Migration


DROP INDEX IF EXISTS kb_docs_embedding_idx;

DROP TRIGGER IF EXISTS trg_jobs_set_timestamp ON jobs;
DROP FUNCTION IF EXISTS set_timestamp();

DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS uploads;
DROP TABLE IF EXISTS kb_docs;


DROP TYPE IF EXISTS job_status;

-- DROP EXTENSION IF EXISTS vector;
