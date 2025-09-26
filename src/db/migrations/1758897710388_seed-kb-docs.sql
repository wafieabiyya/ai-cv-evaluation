-- Up Migration
INSERT INTO kb_docs (id,type,title,raw_text,embedding)
VALUES
  ('seed-jobdesc','job_desc','Default Job Desc',
   'Backend Engineer (AI-augmented). Node.js, Postgres, Redis. Familiar RAG/pgvector, retry/backoff.', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO kb_docs (id,type,title,raw_text,embedding)
VALUES
  ('seed-rubric','rubric','Default Rubric',
   'CV: Tech(40), Exp(25), Achievements(20), Cultural(15) — skala 1-5.
    Project: Correctness(30), Code(25), Resilience(20), Docs(15), Creativity(10) — skala 1-5.', NULL)
ON CONFLICT (id) DO NOTHING;

-- Down Migration
DELETE FROM kb_docs WHERE id IN ('seed-jobdesc','seed-rubric');
