import path from "path";
import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import { serviceUpload } from "@services/upload.service";
import { toPublicUrl } from "@utils/url.utils";

type UploadReqFiles = {
  cv?: Express.Multer.File[];
  project_report?: Express.Multer.File[];
};

export async function uploadHandler(req: Request, res: Response) {
  const files = req.files as UploadReqFiles | undefined;

  const cv = files?.cv?.[0];
  const projectReport = files?.project_report?.[0];

  if (!cv || !projectReport) {
    return res
      .status(400)
      .json({ error: "cv and project_report are required" });
  }

  const destDir = path.join("uploads", `u_${randomUUID()}`);

  try {
    const result = await serviceUpload({
      cv: {
        path: cv.path,
        mime: cv.mimetype,
        size: cv.size,
        originalname: cv.originalname,
      },
      report: {
        path: projectReport.path,
        mime: projectReport.mimetype,
        size: projectReport.size,
        originalname: projectReport.originalname,
      },
      uploadIdDir: destDir,
    });

    const body = {
      ...result,
      cv_url: toPublicUrl(req, result.cv_path),
      project_report_url: toPublicUrl(req, result.report_path),
    };

    return res.status(201).location(body.cv_url).json(body);
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "upload_failed", detail: err?.message ?? String(err) });
  }
}
