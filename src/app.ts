import express from "express";
import morgan from "morgan";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  return app;
}
