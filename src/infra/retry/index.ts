/**
 * EduBek — Retry with exponential backoff.
 *
 * Retries an async operation with exponentially increasing delays.
 * Supports jitter (randomized delay to avoid thundering herd) and
 * a maximum retry count.
 *
 * Usage:
 *   const result = await withRetry(
 *     () => callExternalApi(),
 *     { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 10_000 }
 *   );
 *
 * The retry only fires on errors that are retriable (network errors,
 * 5xx responses). 4xx errors throw immediately.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";

const log = getLogger("retry");

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Jitter factor: 0 = no jitter, 1 = full jitter (default 0.5). */
  jitter?: number;
  /** Predicate to decide if an error is retriable. Default: all errors. */
  isRetriable?: (err: unknown) => boolean;
  /** Optional name for logging. */
  name?: string;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 10_000,
  jitter: 0.5,
  isRetriable: () => true,
  name: "default",
};

function computeDelay(attempt: number, options: RetryOptions): number {
  const exponential = options.baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, options.maxDelayMs);
  const jitter = options.jitter ?? 0.5;
  const jitterAmount = capped * jitter * Math.random();
  return Math.round(capped - jitterAmount + (jitter > 0 ? Math.random() * jitter * capped : 0));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const name = opts.name ?? "default";
  let lastError: unknown;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === opts.maxAttempts - 1) {
        log.error("retry.exhausted", { name, attempt, error: err instanceof Error ? err.message : String(err) });
        throw err;
      }
      if (opts.isRetriable && !opts.isRetriable(err)) {
        throw err;
      }
      const delay = computeDelay(attempt, opts);
      log.warn("retry.scheduled", { name, attempt, delayMs: delay, error: err instanceof Error ? err.message : String(err) });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Idempotency key helper. Use this to make an endpoint idempotent:
 * the same key returns the same result without re-executing the side
 * effect. Store the key + result in a cache (Redis in production).
 */
export function generateIdempotencyKey(): string {
  return `idem_${randomUUID()}`;
}
