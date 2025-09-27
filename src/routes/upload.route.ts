import { Router } from "express";
import multer from "multer";
import path from "path";
import { uploadHandler } from "@handlers/upload.handler";

export const uploadRouter = Router();

const upload = multer({
  dest: path.resolve("uploads", "tmp"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(_req, file, cb) {
    const ok = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ].includes(file.mimetype);
    if (!ok) return cb(new Error("Unsupported file type"));
    cb(null, true);
  },
});

uploadRouter.post(
  "/upload",
  (req, res, next) => {
    upload.fields([
      { name: "cv", maxCount: 1 },
      { name: "project_report", maxCount: 1 },
    ])(req, res, (err: any) => (err ? next(err) : next()));
  },
  // @ts-ignore
  uploadHandler,
);
