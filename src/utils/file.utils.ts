import path from "path";
import fs from "fs/promises";

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export function sanitizeFilename(fileName: string) {
  const { name, ext } = path.parse(fileName);

  const safeBase = name.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "");
  const safeExt = ext.replace(/[^.\w]+/g, "");

  return `${safeBase}${safeExt}`;
}

export async function moveTempFile(
  tempPath: string,
  destDir: string,
  originalName: string,
) {
  await ensureDir(destDir);

  const finalPath = path.join(destDir, sanitizeFilename(originalName));
  await fs.rename(tempPath, finalPath);

  return finalPath;
}
