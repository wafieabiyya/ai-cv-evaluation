import { enqueueEvaluation } from "@queue/jobs/evaluation.jobs";
import { createJob } from "@repos/job.repo";
import { getUploadById } from "@repos/upload.repo";
import type { Request, Response } from "express";

export async function evaluateHandler(req: Request, res: Response) {
  const { upload_id } = req.body as { upload_id?: string };
  if (!upload_id) return res.status(400).json({ error: "upload_id_required" });

  const up = await getUploadById(upload_id);
  if (!up) return res.status(404).json({ error: "upload_not_found" });

  try {
    const { id: jobId } = await createJob(upload_id);
    await enqueueEvaluation({ jobId, uploadId: upload_id });
    return res.status(202).json({ job_id: jobId, status: "queued" });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: "enqueue_failed", detail: e?.message ?? String(e) });
  }
}
