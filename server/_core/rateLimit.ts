/**
 * In-memory rate limiter
 *
 * ── Upgrade to Upstash Redis for production ──────────────────────────────────
 * 1. npm install @upstash/ratelimit @upstash/redis
 * 2. Add to .env:
 *      UPSTASH_REDIS_REST_URL=https://...upstash.io
 *      UPSTASH_REDIS_REST_TOKEN=AX...
 * 3. Replace createRateLimiter with:
 *      import { Ratelimit } from "@upstash/ratelimit";
 *      import { Redis } from "@upstash/redis";
 *      const limiter = new Ratelimit({
 *        redis: Redis.fromEnv(),
 *        limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs / 1000} s`),
 *        prefix: keyPrefix,
 *      });
 *      // middleware: const { success } = await limiter.limit(ip);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Request, Response, NextFunction } from "express";

interface Entry { count: number; resetAt: number; }
const store = new Map<string, Entry>();

// Prune stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

export function createRateLimiter(maxRequests: number, windowMs: number, keyPrefix = "rl") {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${keyPrefix}:${getClientIp(req)}`;
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({ error: "Too many requests. Please slow down.", retryAfterSeconds: retryAfter });
    }
    res.setHeader("X-RateLimit-Remaining", maxRequests - entry.count);
    next();
  };
}

/** Auth: 10 attempts per 15 min per IP */
export const authRateLimiter = createRateLimiter(10, 15 * 60 * 1000, "auth");

/** General API: 200 requests per minute per IP */
export const apiRateLimiter = createRateLimiter(200, 60 * 1000, "api");
