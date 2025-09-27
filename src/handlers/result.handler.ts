import { getJobById } from "@repos/job.repo";
import type { Request, Response } from "express";

export async function resultHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const job = await getJobById(id);
  if (!job) return res.status(404).json({ error: "job_not_found" });

  return res.json({
    job_id: job.id,
    status: job.status,
    result: job.result_json ?? null,
    error: job.error ?? null,
  });
}
