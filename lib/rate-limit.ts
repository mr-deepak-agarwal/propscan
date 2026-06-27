// Lightweight in-memory rate limiter.
//
// LIMITATION: this state lives in the serverless function's memory, which
// resets on cold starts and is NOT shared across concurrent instances if
// Vercel scales this function horizontally. It still meaningfully reduces
// abuse from a single scripted client hitting a single warm instance, but
// it is not a hard guarantee under high concurrent load.
//
// For a hard guarantee, replace this with Vercel KV / Upstash Redis (both
// have generous free tiers) and swap the Map below for a Redis INCR + EXPIRE
// call. The function signature here is designed so that swap only touches
// this file.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically sweep expired buckets so the Map doesn't grow unbounded
// across the lifetime of a warm function instance.
let lastSweep = Date.now();
function sweepIfNeeded() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Fixed-window rate limiter keyed by an arbitrary string (typically an IP).
 * @param key Identifier to rate limit on (e.g. client IP)
 * @param limit Max requests allowed per window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  sweepIfNeeded();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/**
 * Best-effort extraction of the client IP from a Next.js request, looking
 * at the headers Vercel's edge network sets. Falls back to a constant
 * string if no IP can be determined (better to rate-limit "unknown" as one
 * shared bucket than to silently skip limiting entirely).
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list; the first entry is the
    // original client.
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
