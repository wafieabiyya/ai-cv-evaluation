# CV with RAG + LLM Scoring

Build a practical BE with Docker-encapsulated for candidate evaluator uses **BullMQ** for asynchronous job processing, **pgvector** for semantic context grounding, and an LLM with integrated guardrails for accurate, production-ready scoring of CVs and project reports.

---

## Architecture Overview

- **API (Express)**: `/upload` → store files (dev), `/evaluate` → enqueue job, `/result/:id` → fetch status/result.
- **Worker(BullMQ)**: extract text → RAG (pgvector) → LLM scoring → decision → persist `result_json`
- **Storage**: Postgres (+ pgvector), Redis for queue & embedding cache.

---

## Key Decision

- **Stack** : Node.js + TypeScript + Express (lean), Postgres (pgvector) for vectors, Redis + BullMQ for background jobs.
- **RAG over pure LLM**: grounds scoring with JD/rubric context, cheaper & more stable; exposes `contexts[]` + similarity.
- **Embeddings (768-dim)**: Gemini `text-embedding-004`; wrapped with retry + jitter, circuit breaker, Redis cache, and mock fallback (same dim) to keep the pipeline alive during outages.
- **LLM scoring**: Gemini Flash; JSON-only prompt, schema guard, clamped 0–100, heuristic fallback if model fails.
- **Idempotency**: partial unique index on `jobs(upload_id)` for `queued|processing`; `queue jobId` = DB id.
- **Validation & UX**: Zod for body validation, `/evaluate` rate-limited, Multer errors mapped to proper HTTP status.
- **File storage**: `/uploads` only for dev; **S3 presigned URLs** recommended for prod.

---

## Result Shape

- **Scores:**: `cv_match_rate`, `project_score (0–100)`, `overall_summary`, `project_feedback[]`, `contexts[]`.
- **Decision meta**: `strong_pass` | `pass` | `borderline` | `fail` (thresholds via _.env_); gives a crisp recommendation.

## Reliability

- **Two Entry Layers**:
  - **Embedder**: fine-grained retry/backoff + circuit breaker + cache + fallback.
  - **BullMQ**: job-level attempts/backoff for non-embedding failures.
- `removeOnComplete/Fail` keeps the queue tidy.

## Data Model

- `uploads` (file metadata), `jobs` (status + `result_json`), `kb_docs` (JD/rubric + `embedding vector(768)`).

## Security & Nodes

- `.env` is git-ignored; provide `.env.example.`
- Accept safe file types & size cap; don’t expose local paths in prod.
- Mark `/rag/search` as **dev-only**.
- API docs at `/docs` (Swagger UI)

## Endpoints (at a glance)

- `POST /upload` — multipart (`cv`, `project_report`) → returns `upload_id` and file URLs (dev)
- `POST /evaluate` — `{ "upload_id": "..." }` → idempotent; returns existing or new `job_id`
- `GET /result/:job_id` — returns status/result (scores, feedback, contexts, decision)
- `GET /health` — health check
- `GET /docs` — Swagger UI

## Environment

Use `.env.example` as a template:

- Copy it to `.env`
- Set `GEMINI_API_KEY` (required)
- If you switch providers, keep `EMBEDDING_DIM` consistent (Gemini 768, OpenAI 1536)

## Run Instruction

**Prereqs**:

- Node.js 20+ and **Package Manager**
- Docker Desktop running
- A valid `.env` (see Environment section)

### 1. Start infrastructure (Postgres + Redis)

```bash
docker compose up -d
```

### 2. Install dependencies

```
npm i
```

### 3. Apply database migrations

```
npm run migrate:up
```

### 4. Backfill RAG embeddings for seeded Knowledge Base

```
npm run rag:backfill
```

### 5. Start Services

- **API Server**

```
npm run dev
```

- **BullMQ Worker**

```
npm run worker
```

### API Reference

## See full interactive docs at **/docs** (Swagger UI).
