/**
 * EduBek — Circuit breaker.
 *
 * Protects downstream services (AI providers, payment gateways, etc.)
 * from cascading failures. When a service fails repeatedly, the
 * circuit "opens" and requests fail fast instead of queuing up.
 *
 * States:
 *   closed    — requests flow normally
 *   open      — requests fail fast immediately (cooldown period)
 *   half-open — limited requests allowed to test if the service recovered
 *
 * Usage:
 *   const breaker = createCircuitBreaker({ threshold: 5, cooldownMs: 30_000 });
 *   const result = await breaker.execute(() => callExternalApi());
 */
import { getLogger } from "@/lib/logger";

const log = getLogger("circuit-breaker");

type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit. */
  threshold: number;
  /** How long to stay open before transitioning to half-open (ms). */
  cooldownMs: number;
  /** Number of requests to allow in half-open state. */
  halfOpenMaxAttempts: number;
  /** Optional name for logging. */
  name?: string;
}

export interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureAt: number | null;
  openedAt: number | null;
}

export function createCircuitBreaker(options: CircuitBreakerOptions) {
  let state: CircuitState = "closed";
  let failureCount = 0;
  let successCount = 0;
  let lastFailureAt: number | null = null;
  let openedAt: number | null = null;
  let halfOpenAttempts = 0;
  const name = options.name ?? "default";

  function getState(): CircuitBreakerState {
    return { state, failureCount, successCount, lastFailureAt, openedAt };
  }

  function shouldAttemptReset(): boolean {
    if (state !== "open") return false;
    if (!openedAt) return false;
    return Date.now() - openedAt >= options.cooldownMs;
  }

  async function execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we should transition from open → half-open
    if (state === "open" && shouldAttemptReset()) {
      state = "half-open";
      halfOpenAttempts = 0;
      log.info("circuit.half_open", { name });
    }

    // If open, fail fast
    if (state === "open") {
      throw new Error(`Circuit breaker "${name}" is open — requests failing fast`);
    }

    // If half-open, limit concurrent attempts
    if (state === "half-open" && halfOpenAttempts >= options.halfOpenMaxAttempts) {
      throw new Error(`Circuit breaker "${name}" is half-open — too many probe attempts`);
    }

    if (state === "half-open") halfOpenAttempts += 1;

    try {
      const result = await fn();
      onSuccess();
      return result;
    } catch (err) {
      onFailure();
      throw err;
    }
  }

  function onSuccess(): void {
    failureCount = 0;
    if (state === "half-open") {
      successCount += 1;
      if (successCount >= options.halfOpenMaxAttempts) {
        state = "closed";
        openedAt = null;
        log.info("circuit.closed", { name });
      }
    }
  }

  function onFailure(): void {
    lastFailureAt = Date.now();
    failureCount += 1;
    successCount = 0;

    if (state === "half-open") {
      // Half-open failure → re-open
      state = "open";
      openedAt = Date.now();
      log.warn("circuit.reopened", { name });
      return;
    }

    if (failureCount >= options.threshold) {
      state = "open";
      openedAt = Date.now();
      log.error("circuit.opened", { name, failureCount });
    }
  }

  function reset(): void {
    state = "closed";
    failureCount = 0;
    successCount = 0;
    openedAt = null;
    lastFailureAt = null;
  }

  return { execute, getState, reset, options };
}

// ---------------------------------------------------------------------------
// Pre-configured circuit breakers
// ---------------------------------------------------------------------------

/** Circuit breaker for AI provider calls (3 failures → 30s cooldown). */
export const aiCircuitBreaker = createCircuitBreaker({
  threshold: 3,
  cooldownMs: 30_000,
  halfOpenMaxAttempts: 1,
  name: "ai-provider",
});

/** Circuit breaker for wallet/coin operations (5 failures → 60s cooldown). */
export const walletCircuitBreaker = createCircuitBreaker({
  threshold: 5,
  cooldownMs: 60_000,
  halfOpenMaxAttempts: 2,
  name: "wallet",
});
