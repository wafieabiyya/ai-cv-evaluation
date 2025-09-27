import express, { type Request, type Response } from "express";
import morgan from "morgan";
import path from "path";

import { uploadRouter, evaluateRouter } from "@routes/index.route";
import { errorMiddleware } from "@middlewares/error.middleware";

import { PgvectorRAG } from "@rag/pgvector.store";
import { makeEmbedder } from "@llm/embedder.factory";

export function createApp() {
  const app = express();
  const rag = new PgvectorRAG(makeEmbedder());

  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  // static dev
  app.use("/uploads", express.static(path.resolve("uploads")));

  // health / root
  app.get("/", (_req: Request, res: Response) =>
    res.json({ name: "ai-cv-evaluation", status: "ok" }),
  );
  app.get("/health", (_req: Request, res: Response) => {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true });
  });

  // dev-only RAG search
  app.get("/rag/search", async (req, res) => {
    const q = String(req.query.q || "");
    if (!q) return res.status(400).json({ error: "query_required" });
    const hits = await rag.search(q, 3);
    res.json({ q, hits });
  });

  // routes
  app.use(uploadRouter);
  app.use(evaluateRouter);

  // 404
  app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

  // err middleware
  app.use(errorMiddleware);

  return app;
}
