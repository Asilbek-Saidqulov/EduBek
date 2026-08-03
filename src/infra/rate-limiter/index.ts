/**
 * EduBek — Rate limiter.
 *
 * A token-bucket rate limiter for HTTP routes and Socket.IO events.
 * Uses in-memory storage by default; in production, swap the `store`
 * with a Redis-backed implementation for multi-instance enforcement.
 *
 * Usage in a route handler:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });
 *   if (!limiter.check(userId)) return NextResponse.json({ error: ... }, { status: 429 });
 *
 * Usage for Socket.IO:
 *   const socketLimiter = createRateLimiter({ windowMs: 1000, max: 10 });
 *   socket.on("session:submit_answer", (payload, ack) => {
 *     if (!socketLimiter.check(socket.id)) { ack({ ok: false, error: "rate_limited" }); return; }
 *     ...
 *   });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, entry: RateLimitEntry): void;
  delete(key: string): void;
  cleanup?(now: number): void;
}

class InMemoryRateLimitStore implements RateLimitStore {
  private map = new Map<string, RateLimitEntry>();

  get(key: string) { return this.map.get(key); }
  set(key: string, entry: RateLimitEntry) { this.map.set(key, entry); }
  delete(key: string) { this.map.delete(key); }

  /** Periodic cleanup of expired entries (call every 5 min). */
  cleanup(now: number): void {
    for (const [key, entry] of this.map) {
      if (entry.resetAt < now) this.map.delete(key);
    }
  }
}

export interface RateLimiterOptions {
  /** Time window in milliseconds. */
  windowMs: number;
  /** Maximum requests per window. */
  max: number;
  /** Optional key prefix for namespacing. */
  prefix?: string;
  /** Optional store (defaults to in-memory). */
  store?: RateLimitStore;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const store = options.store ?? new InMemoryRateLimitStore();
  const prefix = options.prefix ?? "rl";

  // Periodic cleanup every 5 minutes
  setInterval(() => store.cleanup?.(Date.now()), 5 * 60_000).unref?.();

  function check(identifier: string): RateLimitResult {
    const key = `${prefix}:${identifier}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      // First request in window, or window expired
      const newEntry: RateLimitEntry = { count: 1, resetAt: now + options.windowMs };
      store.set(key, newEntry);
      return {
        allowed: true,
        remaining: options.max - 1,
        resetAt: newEntry.resetAt,
        retryAfterMs: 0,
      };
    }

    entry.count += 1;
    const allowed = entry.count <= options.max;
    return {
      allowed,
      remaining: Math.max(0, options.max - entry.count),
      resetAt: entry.resetAt,
      retryAfterMs: allowed ? 0 : entry.resetAt - now,
    };
  }

  function reset(identifier: string): void {
    store.delete(`${prefix}:${identifier}`);
  }

  return { check, reset, options };
}

// ---------------------------------------------------------------------------
// Pre-configured limiters for common use cases
// ---------------------------------------------------------------------------

/** PIN brute-force protection: 5 attempts per 5 minutes per IP. */
export const pinAttemptLimiter = createRateLimiter({
  windowMs: 5 * 60_000,
  max: 5,
  prefix: "pin",
});

/** Socket.IO event rate limiter: 20 events per second per socket. */
export const socketEventLimiter = createRateLimiter({
  windowMs: 1_000,
  max: 20,
  prefix: "socket",
});

/** Answer submission limiter: 1 per 500ms per participant. */
export const answerSubmitLimiter = createRateLimiter({
  windowMs: 500,
  max: 1,
  prefix: "answer",
});

/** General API rate limiter: 100 requests per minute per user. */
export const apiLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 100,
  prefix: "api",
});
