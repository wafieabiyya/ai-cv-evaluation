import path from "path";
import fs from "fs/promises";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractText(
  filePath: string,
  mime?: string,
): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  //pdf
  if (mime === "application/pdf" || ext === ".pdf") {
    const buff = await fs.readFile(filePath);
    const out = await (pdfParse as any)(buff);
    return (out?.text as string) || "";
  }

  //docx
  if (mime?.includes("word") || ext === ".docx") {
    const out = await (mammoth as any).extractRawText({ path: filePath });
    return (out?.value as string) || "";
  }

  //fallback as txt
  if (mime === "text/plain" || ext === ".txt") {
    return await fs.readFile(filePath, "utf8");
  }

  return "";
}

export function clip(text: string, max = 4000): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function snippet(text: string, len = 240): string {
  if (!text) return "";
  return text.length > len ? text.slice(0, len) + "…" : text;
}
