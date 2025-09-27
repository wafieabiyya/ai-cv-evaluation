import crypto from "crypto";
import type { EmbeddingsPort } from "@rag/ports";
import { connection as redis } from "@queue/queue";

const MAX_ATTEMPTS = Number(process.env.EMB_MAX_ATTEMPTS ?? 4);
const BASE_DELAY = Number(process.env.EMB_BASE_DELAY_MS ?? 400);
const CB_FAILS = Number(process.env.EMB_CIRCUIT_FAILS ?? 3);
const CB_COOLDOWN = Number(process.env.EMB_CIRCUIT_COOLDOWN_MS ?? 12000);
const CACHE_TTL = Number(process.env.EMB_CACHE_TTL_SEC ?? 86400);
const DIM = Number(process.env.EMBEDDING_DIM ?? 768);

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
function jitter(n: number) {
  return Math.floor(n * (0.5 + Math.random()));
}

function errorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const anyErr = err as { message?: unknown; toString?: () => string };
    if (typeof anyErr.message === "string") return anyErr.message;
    if (typeof anyErr.toString === "function") return anyErr.toString();
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isRetriable(err: unknown) {
  const msg = errorMessage(err);
  return /5\d\d|ECONN|ETIMEDOUT|fetch failed|Service Unavailable/i.test(msg);
}

export class ResilientEmbedder implements EmbeddingsPort {
  private fails = 0;
  private openUntil = 0;

  constructor(
    private readonly primary: EmbeddingsPort,
    private readonly fallback: EmbeddingsPort,
    private readonly providerName = "primary",
  ) {}

  private key(text: string) {
    const h = crypto.createHash("sha256").update(text).digest("hex");
    return `emb:${this.providerName}:d${DIM}:${h}`;
  }

  private async cacheGet(k: string): Promise<number[] | null> {
    try {
      const s = await redis.get(k);
      if (!s) return null;
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? (arr as number[]) : null;
    } catch {
      return null;
    }
  }

  private async cacheSet(k: string, vec: number[]) {
    try {
      await redis.set(k, JSON.stringify(vec), "EX", CACHE_TTL);
    } catch {}
  }

  private ensureDim(vec: number[]): number[] {
    if (!Array.isArray(vec)) throw new Error("embedder_returned_non_array");
    if (vec.length !== DIM)
      throw new Error(`embedding_dim_mismatch:${vec.length}!=${DIM}`);
    return vec;
  }

  private async tryPrimary(text: string): Promise<number[]> {
    let lastErr: any;
    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      try {
        const v = await this.primary.embed(text);
        this.fails = 0; // reset CB
        this.openUntil = 0;
        return this.ensureDim(v);
      } catch (e) {
        lastErr = e;
        if (!isRetriable(e) || i === MAX_ATTEMPTS) break;
        const wait = jitter(BASE_DELAY * Math.pow(2, i - 1));
        console.warn(
          `[emb] primary retry ${i}/${MAX_ATTEMPTS} in ${wait}ms:`,
          errorMessage(e),
        );

        await sleep(wait);
      }
    }
    this.fails++;
    if (this.fails >= CB_FAILS) {
      this.openUntil = Date.now() + CB_COOLDOWN;
      // eslint-disable-next-line no-console
      console.warn(`[emb] circuit open for ${CB_COOLDOWN}ms`);
    }
    throw lastErr instanceof Error ? lastErr : new Error(errorMessage(lastErr));
  }

  private async useFallback(text: string): Promise<number[]> {
    // eslint-disable-next-line no-console
    console.warn("[emb] using fallback embedder");
    const v = await this.fallback.embed(text);
    return this.ensureDim(v);
  }

  async embed(text: string): Promise<number[]> {
    const key = this.key(text);

    const cached = await this.cacheGet(key);
    if (cached && cached.length === DIM) return cached;

    let vec: number[];
    const now = Date.now();
    const cbOpen = now < this.openUntil;

    if (!cbOpen) {
      try {
        vec = await this.tryPrimary(text);
      } catch (e) {
        vec = await this.useFallback(text);
      }
    } else {
      vec = await this.useFallback(text);
    }

    this.cacheSet(key, vec).catch(() => {});
    return vec;
  }
}
