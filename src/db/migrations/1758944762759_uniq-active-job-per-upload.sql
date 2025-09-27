-- Up Migration
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_job_per_upload
ON jobs(upload_id)
WHERE status IN ('queued','processing');

-- Down Migration
DROP INDEX IF EXISTS uniq_active_job_per_upload;
