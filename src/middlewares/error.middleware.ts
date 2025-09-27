import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { HttpError } from "@utils/http-error";

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Multer errors
  if (err instanceof MulterError) {
    // https://github.com/expressjs/multer#error-handling
    const map: Record<string, number> = {
      LIMIT_FILE_SIZE: 413, // Payload Too Large
      LIMIT_FILE_COUNT: 400,
      LIMIT_FIELD_KEY: 400,
      LIMIT_FIELD_VALUE: 400,
      LIMIT_FIELD_COUNT: 400,
      LIMIT_UNEXPECTED_FILE: 400,
      LIMIT_PART_COUNT: 400,
    };
    const status = map[err.code] ?? 400;
    return res.status(status).json({ error: err.code, message: err.message });
  }

  // cstm unsupported media type
  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ error: err.code ?? "http_error", message: err.message });
  }

  // fallback
  console.error("[unhandled]", err);
  return res.status(500).json({ error: "internal_error" });
}
