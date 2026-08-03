/**
 * EduBek — Caching abstraction.
 *
 * A simple TTL cache for read-only metadata that changes infrequently.
 * Uses in-memory storage by default; in production, swap the `store`
 * with a Redis-backed implementation for multi-instance sharing.
 *
 * Common use cases:
 *   • Game Mode metadata (changes only on deploy)
 *   • Subscription plan catalogue (changes only on admin update)
 *   • User profile display names (changes rarely)
 *
 * Usage:
 *   const modeCache = createCache<GameModeMetadata>({ ttlMs: 5 * 60_000 });
 *   const metadata = modeCache.get("classic") ?? modeCache.set("classic", loadMetadata());
 */
import { getLogger } from "@/lib/logger";

const log = getLogger("cache");

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheStore<T> {
  get(key: string): CacheEntry<T> | undefined;
  set(key: string, entry: CacheEntry<T>): void;
  delete(key: string): void;
  clear(): void;
  keys(): string[];
}

class InMemoryCacheStore<T> implements CacheStore<T> {
  private map = new Map<string, CacheEntry<T>>();

  get(key: string) { return this.map.get(key); }
  set(key: string, entry: CacheEntry<T>) { this.map.set(key, entry); }
  delete(key: string) { this.map.delete(key); }
  clear() { this.map.clear(); }
  keys() { return [...this.map.keys()]; }
}

export interface CacheOptions {
  ttlMs: number;
  /** Optional name for logging. */
  name?: string;
  /** Optional store (defaults to in-memory). */
  store?: any;
}

export function createCache<T>(options: CacheOptions) {
  const store: CacheStore<T> = options.store ?? new InMemoryCacheStore<T>();
  const name = options.name ?? "default";

  // Periodic cleanup
  setInterval(() => {
    const now = Date.now();
    for (const key of store.keys()) {
      const entry = store.get(key);
      if (entry && entry.expiresAt < now) store.delete(key);
    }
  }, 60_000).unref?.();

  function get(key: string): T | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function set(key: string, value: T, customTtlMs?: number): T {
    store.set(key, {
      value,
      expiresAt: Date.now() + (customTtlMs ?? options.ttlMs),
    });
    return value;
  }

  /** Get-or-set: if the key exists, return the cached value; otherwise call `loader` and cache the result. */
  async function getOrSet(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = get(key);
    if (cached !== undefined) return cached;
    const value = await loader();
    return set(key, value);
  }

  function deleteKey(key: string): void {
    store.delete(key);
  }

  function clear(): void {
    store.clear();
    log.debug("cache.cleared", { name });
  }

  return { get, set, getOrSet, delete: deleteKey, clear, options };
}

// ---------------------------------------------------------------------------
// Pre-configured caches
// ---------------------------------------------------------------------------

/** Game Mode metadata cache (5-minute TTL — changes only on deploy). */
export const gameModeMetadataCache = createCache<any>({
  ttlMs: 5 * 60_000,
  name: "game-mode-metadata",
});

/** Subscription plan cache (5-minute TTL — changes only on admin update). */
export const subscriptionPlanCache = createCache<any>({
  ttlMs: 5 * 60_000,
  name: "subscription-plans",
});

/** User display name cache (1-minute TTL — used in leaderboard / lobby). */
export const userDisplayNameCache = createCache<string>({
  ttlMs: 60_000,
  name: "user-display-name",
});
