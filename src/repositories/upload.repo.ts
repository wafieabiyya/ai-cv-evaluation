import { randomUUID } from "crypto";
import { query, queryRows } from "@db/pool";

export type UploadRow = {
  id: string;
  cv_path: string;
  cv_mime: string | null;
  report_path: string;
  report_mime: string | null;
};

export type CreateUploadArgs = {
  cvPath: string;
  cvMime?: string | null;
  cvSize?: number | null;
  reportPath: string;
  reportMime?: string | null;
  reportSize?: number | null;
};

export const RawQuery = {
  createUploadRecord: `
  INSERT INTO 
    uploads (
    id, 
    cv_path, 
    cv_mime, 
    cv_size_bytes, 
    report_path, 
    report_mime, 
    report_size_bytes
    )
  VALUES ($1,$2,$3,$4,$5,$6,$7)
  `,

  getUploadRecordById: `
  SELECT
    id,
    cv_path,
    report_path,
    created_at
  FROM 
    uploads
  WHERE 
    id = $1
  `,
};

export async function createUpload(args: CreateUploadArgs) {
  const id = "ul_" + randomUUID();
  await query(RawQuery.createUploadRecord, [
    id,
    args.cvPath,
    args.cvMime ?? null,
    args.cvSize ?? null,
    args.reportPath,
    args.reportMime ?? null,
    args.reportSize ?? null,
  ]);

  return id;
}

export async function getUploadById(id: string) {
  const r = await queryRows<UploadRow>(RawQuery.getUploadRecordById, [id]);
  return r[0] ?? null;
}
