interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  resetAt: Date;
  remaining: number;
}

export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      resetAt: new Date(resetAt),
      remaining: limit - 1,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      resetAt: new Date(record.resetAt),
      remaining: 0,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    resetAt: new Date(record.resetAt),
    remaining: limit - record.count,
  };
}
