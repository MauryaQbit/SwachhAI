/**
 * Minimal in-memory sliding-window rate limiter for API routes.
 *
 * Why it exists: /api/analyze and /api/assistant spend real money
 * (Gemini calls) and /api/reports writes to the database — all must be
 * abuse-resistant even in a prototype.
 *
 * Note: state is per server instance. Correct for a hackathon MVP on
 * serverless (each instance enforces its own window); a shared store
 * (Upstash/Vercel KV) is the documented upgrade path, not built here.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// Hygiene: never let the map grow unbounded from random IPs.
const MAX_BUCKETS = 5000;
function prune(now: number, windowMs: number): void {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [k, b] of buckets) {
    if (b.hits.length === 0 || now - b.hits[b.hits.length - 1] > windowMs) {
      buckets.delete(k);
    }
    if (buckets.size <= MAX_BUCKETS) break;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  prune(now, windowMs);
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSec: 0 };
}

/** Stable client identity for limiting: first forwarded IP, else direct. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64);
  return "direct";
}

/** Preset budgets per route. */
export const LIMITS = {
  analyze: { limit: 10, windowMs: 60_000 }, // expensive vision calls
  assistant: { limit: 30, windowMs: 60_000 }, // cheap text calls
  reportWrite: { limit: 30, windowMs: 60_000 }, // DB writes
  reportPatch: { limit: 60, windowMs: 60_000 }, // status flips
} as const;
