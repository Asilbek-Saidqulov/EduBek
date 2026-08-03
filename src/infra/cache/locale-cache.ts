/**
 * EduBek — Locale-aware caching utilities.
 *
 * Phase 4E.6: Cache keys include locale to prevent cache contamination
 * between languages. Instead of `resource:123`, use `resource:123:en`.
 *
 * These helpers wrap the existing cache infrastructure (src/infra/cache)
 * with locale-aware key generation.
 */
import { createCache } from "@/infra/cache";

/**
 * Build a locale-aware cache key.
 * Example: buildLocaleKey("resource", "abc123", "en") → "resource:abc123:en"
 */
export function buildLocaleKey(
  entity: string,
  id: string,
  locale: string,
): string {
  return `${entity}:${id}:${locale}`;
}

/**
 * Build a locale-aware cache key for a list.
 * Example: buildLocaleListKey("marketplace", "featured", "uz") → "marketplace:featured:uz"
 */
export function buildLocaleListKey(
  entity: string,
  listType: string,
  locale: string,
): string {
  return `${entity}:${listType}:${locale}`;
}

// ---------------------------------------------------------------------------
// Pre-configured locale-aware caches
// ---------------------------------------------------------------------------

/** Resource content cache (per-locale). 5-minute TTL. */
export const resourceCache = createCache<any>({
  ttlMs: 5 * 60_000,
  name: "resource-by-locale",
});

/** Marketplace listing cache (per-locale). 5-minute TTL. */
export const marketplaceCache = createCache<any>({
  ttlMs: 5 * 60_000,
  name: "marketplace-by-locale",
});

/** Category tree cache (per-locale). 10-minute TTL (categories change rarely). */
export const categoryCache = createCache<any>({
  ttlMs: 10 * 60_000,
  name: "categories-by-locale",
});

/** Subscription plan cache (per-locale). 10-minute TTL. */
export const planCache = createCache<any>({
  ttlMs: 10 * 60_000,
  name: "plans-by-locale",
});

/** Search results cache (per-locale, per-query). 2-minute TTL. */
export const searchCache = createCache<any>({
  ttlMs: 2 * 60_000,
  name: "search-by-locale",
});

// ---------------------------------------------------------------------------
// Convenience: get-or-set with locale key
// ---------------------------------------------------------------------------

/**
 * Get a cached value by entity + id + locale, or call the loader and cache
 * the result. Prevents cache contamination between languages.
 */
export async function getOrSetLocale<T>(
  cache: ReturnType<typeof createCache<T>>,
  entity: string,
  id: string,
  locale: string,
  loader: () => Promise<T>,
): Promise<T> {
  const key = buildLocaleKey(entity, id, locale);
  return cache.getOrSet(key, loader);
}

/**
 * Invalidate all locale variants for a given entity + id.
 * Called when a resource is updated — clears the cache for all languages.
 */
export function invalidateEntity(
  caches: ReturnType<typeof createCache<any>>[],
  entity: string,
  id: string,
  locales: readonly string[],
): void {
  for (const locale of locales) {
    const key = buildLocaleKey(entity, id, locale);
    for (const cache of caches) {
      cache.delete(key);
    }
  }
}
