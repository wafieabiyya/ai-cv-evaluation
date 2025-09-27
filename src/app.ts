import { uploadRouter } from "@routes/upload.route";
import express, { type Request, type Response } from "express";
import morgan from "morgan";
import path from "path";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.use("/uploads", express.static(path.resolve("uploads")));

  app.get("/", (_req: Request, res: Response) =>
    res.json({ name: "ai-cv-evaluation", status: "ok" }),
  );
  app.get("/health", (_req: Request, res: Response) => {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true });
  });

  // mount
  app.use(uploadRouter);

  // 404 last
  app.use((_req, res) => res.status(404).json({ error: "Not Found" }));
  return app;
}
