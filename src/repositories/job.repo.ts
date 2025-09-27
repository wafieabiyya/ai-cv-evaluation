import { query, queryRows } from "@db/pool";
import { randomUUID } from "crypto";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type EvalResult = {
  cv_match_rate: number;
  project_score: number;
  project_feedback: string[];
  overall_summary: string;
};

export const RawQuery = {
  createJobRecord: `
    INSERT INTO jobs (id, upload_id, status)
    VALUES ($1, $2, 'queued')
  `,
  getActiveByUpload: `
    SELECT id, status FROM jobs
    WHERE upload_id = $1 AND status IN ('queued','processing')
    ORDER BY created_at DESC
    LIMIT 1
  `,
  markAsProcessing: `
    UPDATE jobs
    SET status = 'processing'
    WHERE id = $1
  `,
  updateJobAsCompleted: `
    UPDATE jobs
    SET status = 'completed',
        result_json = $2::jsonb
    WHERE id = $1
  `,
  updateJobAsFailed: `
    UPDATE jobs
    SET status = 'failed',
        error = $2
    WHERE id = $1
  `,
  getJobRecordById: `
    SELECT id, status, result_json, error
    FROM jobs
    WHERE id = $1
  `,
};

export async function createJob(uploadID: string) {
  const id = "job_" + randomUUID();
  try {
    await query(RawQuery.createJobRecord, [id, uploadID]);
    return { id };
  } catch (e: any) {
    // unique_violation
    if (e?.code === "23505") {
      const rows = await queryRows<{ id: string; status: JobStatus }>(
        RawQuery.getActiveByUpload,
        [uploadID],
      );
      if (rows[0]) return { id: rows[0].id };
    }
    throw e;
  }
}

export async function markProcessing(jobID: string) {
  await query(RawQuery.markAsProcessing, [jobID]);
}

export async function completeJob(jobID: string, result: EvalResult) {
  await query(RawQuery.updateJobAsCompleted, [jobID, JSON.stringify(result)]);
}

export async function failJob(jobID: string, errMsg: string) {
  await query(RawQuery.updateJobAsFailed, [jobID, errMsg]);
}

export async function getJobById(jobID: string) {
  const r = await queryRows<{
    id: string;
    status: JobStatus;
    result_json: any;
    error: string | null;
  }>(RawQuery.getJobRecordById, [jobID]);

  return r[0] ?? null;
}
