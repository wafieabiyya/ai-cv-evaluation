import { createUpload } from "@repos/upload.repo";
import { moveTempFile } from "@utils/file.utils";

export async function serviceUpload(opts: {
  cv: { path: string; mime?: string; size?: number; originalname: string };
  report: { path: string; mime?: string; size?: number; originalname: string };
  uploadIdDir: string;
}) {
  const cvName: string = opts.cv.originalname;
  const projectReportName: string = opts.report.originalname;

  const cvFinal: string = await moveTempFile(
    opts.cv.path,
    opts.uploadIdDir,
    cvName,
  );
  const reportFinal: string = await moveTempFile(
    opts.report.path,
    opts.uploadIdDir,
    projectReportName,
  );

  const id = await createUpload({
    cvPath: cvFinal,
    cvMime: opts.cv.mime ?? null,
    cvSize: opts.cv.size ?? null,
    reportPath: reportFinal,
    reportMime: opts.report.mime ?? null,
    reportSize: opts.report.size ?? null,
  });

  return { upload_id: id, cv_path: cvFinal, report_path: reportFinal };
}
