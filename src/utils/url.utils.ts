import type { Request } from "express";

export function publicBaseUrl(req: Request) {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host");
  return `${proto}://${host}`;
}

export function toPublicUrl(req: Request, relPath: string) {
  return `${publicBaseUrl(req)}/${relPath.replace(/^\/+/, "")}`;
}
