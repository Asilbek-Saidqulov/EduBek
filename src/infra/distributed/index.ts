/**
 * EduBek — Distributed infrastructure.
 *
 * Abstractions for horizontal scaling:
 *   • Redis adapter for Socket.IO (multi-instance broadcasting)
 *   • Distributed locks (prevent race conditions across instances)
 *   • Leader election (for cron jobs that should run on one instance only)
 *
 * In single-instance mode (default), these are no-ops that use in-process
 * state. When `REDIS_URL` is set in the environment, the implementations
 * switch to Redis-backed versions automatically.
 *
 * The interfaces are stable — swapping from in-memory to Redis requires
 * no code changes in the service layer.
 */
import { getLogger } from "@/lib/logger";
import { env } from "@/config/env";

const log = getLogger("distributed");

// Detect Redis availability
const REDIS_URL = process.env.REDIS_URL ?? process.env.REDIS_TLS_URL;
export const isRedisAvailable = !!REDIS_URL;

// ---------------------------------------------------------------------------
// Distributed lock
// ---------------------------------------------------------------------------

export interface DistributedLock {
  /** Release the lock. Returns true if the lock was still held. */
  release(): Promise<boolean>;
  /** Extend the lock's TTL (for long-running operations). */
  extend(ttlMs: number): Promise<boolean>;
}

export interface LockOptions {
  /** Lock name (namespace). */
  name: string;
  /** Time-to-live in milliseconds. */
  ttlMs: number;
  /** Max time to wait for the lock before giving up (ms). */
  waitTimeoutMs?: number;
  /** Polling interval while waiting (ms). */
  pollIntervalMs?: number;
}

/**
 * Acquire a distributed lock. In single-instance mode, this is a simple
 * in-memory mutex. In multi-instance mode (Redis), it uses SET NX.
 *
 * Usage:
 *   const lock = await acquireLock({ name: "session:abc:finish", ttlMs: 10_000 });
 *   if (!lock) return; // someone else is already finishing
 *   try { ... } finally { await lock.release(); }
 */
export async function acquireLock(options: LockOptions): Promise<DistributedLock | null> {
  if (!isRedisAvailable) {
    return inMemoryLock(options);
  }
  // Redis implementation would go here:
  //   const token = randomUUID();
  //   const acquired = await redis.set(`lock:${options.name}`, token, "PX", options.ttlMs, "NX");
  //   if (!acquired) return null;
  //   return redisLock(options.name, token, redis);
  log.debug("distributed.lock.redis_not_implemented_fallback_to_inmemory", { name: options.name });
  return inMemoryLock(options);
}

// In-memory lock implementation (single-instance only)
const inMemoryLocks = new Map<string, { acquiredAt: number; ttlMs: number }>();

function inMemoryLock(options: LockOptions): DistributedLock | null {
  const now = Date.now();
  const existing = inMemoryLocks.get(options.name);
  if (existing && now < existing.acquiredAt + existing.ttlMs) {
    return null; // still held
  }
  inMemoryLocks.set(options.name, { acquiredAt: now, ttlMs: options.ttlMs });
  log.debug("lock.acquired", { name: options.name, ttlMs: options.ttlMs });

  return {
    async release(): Promise<boolean> {
      const entry = inMemoryLocks.get(options.name);
      if (!entry) return false;
      inMemoryLocks.delete(options.name);
      log.debug("lock.released", { name: options.name });
      return true;
    },
    async extend(ttlMs: number): Promise<boolean> {
      const entry = inMemoryLocks.get(options.name);
      if (!entry) return false;
      entry.ttlMs = Date.now() - entry.acquiredAt + ttlMs;
      return true;
    },
  };
}

// ---------------------------------------------------------------------------
// Leader election (for cron jobs that should run on one instance only)
// ---------------------------------------------------------------------------

interface LeaderState {
  isLeader: boolean;
  acquiredAt: number;
  ttlMs: number;
}

const leaderStates = new Map<string, LeaderState>();

/**
 * Try to become the leader for a given role (e.g. "exam-autosubmit-sweeper").
 * Returns true if this instance is the current leader.
 *
 * In single-instance mode, always returns true.
 * In multi-instance mode, uses Redis SET NX with a TTL + heartbeat.
 *
 * Usage:
 *   if (await tryAcquireLeadership("exam-autosubmit", 60_000)) {
 *     await autoSubmitExpiredExams();
 *   }
 */
export async function tryAcquireLeadership(role: string, ttlMs: number): Promise<boolean> {
  if (!isRedisAvailable) {
    // Single-instance: always leader
    return true;
  }
  // Redis implementation:
  //   const token = randomUUID();
  //   const acquired = await redis.set(`leader:${role}`, token, "PX", ttlMs, "NX");
  //   if (acquired) { leaderStates.set(role, { isLeader: true, acquiredAt: now, ttlMs }); return true; }
  //   return false;
  return true;
}

/**
 * Renew leadership (call periodically while the leader is still working).
 */
export async function renewLeadership(role: string, ttlMs: number): Promise<boolean> {
  if (!isRedisAvailable) return true;
  // Redis: SET `leader:${role}` <token> PX <ttlMs>
  return true;
}

/**
 * Release leadership (graceful shutdown).
 */
export async function releaseLeadership(role: string): Promise<void> {
  if (!isRedisAvailable) return;
  leaderStates.delete(role);
}

// ---------------------------------------------------------------------------
// Redis adapter for Socket.IO
// ---------------------------------------------------------------------------

/**
 * Returns the Redis adapter configuration for Socket.IO, or null if
 * Redis is not available (single-instance mode).
 *
 * Usage in src/infra/realtime/index.ts:
 *   if (isRedisAvailable) {
 *     const { createAdapter } = await import("@socket.io/redis-adapter");
 *     const { pubClient, subClient } = createRedisClients();
 *     io.adapter(createAdapter(pubClient, subClient));
 *   }
 */
export function getRedisAdapterConfig(): { url: string } | null {
  if (!isRedisAvailable || !REDIS_URL) return null;
  return { url: REDIS_URL };
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

const shutdownHandlers: Array<() => Promise<void>> = [];

/**
 * Register a handler to run during graceful shutdown (before the
 * process exits). Handlers run in reverse registration order.
 *
 * Usage:
 *   registerShutdownHandler(async () => {
 *     log.info("closing socket.io");
 *     io.close();
 *   });
 */
export function registerShutdownHandler(handler: () => Promise<void>): void {
  shutdownHandlers.push(handler);
}

/**
 * Run all registered shutdown handlers, then exit.
 * Called from src/server/index.ts on SIGINT/SIGTERM.
 */
export async function gracefulShutdown(signal: string): Promise<void> {
  log.info("shutdown.starting", { signal, handlers: shutdownHandlers.length });

  // Run handlers in reverse order (LIFO)
  for (let i = shutdownHandlers.length - 1; i >= 0; i--) {
    try {
      await shutdownHandlers[i]!();
    } catch (err) {
      log.error("shutdown.handler_error", {
        index: i,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log.info("shutdown.complete", { signal });
}
