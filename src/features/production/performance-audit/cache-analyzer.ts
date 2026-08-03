/**
 * EduBek — Cache Optimization Analyzer (System 3).
 *
 * Audits existing cache usage (Cloud Infrastructure's CacheEntry table)
 * and recommends cache candidates, TTL adjustments, invalidation
 * strategies, tag strategies, warmup strategies, and hit predictions.
 *
 * REUSES Cloud Infrastructure's cache layer — never duplicates cache
 * implementation.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  CacheOptimizationReport, CacheStatsSummary, CacheCandidate,
  TtlRecommendation, InvalidationStrategy, TagStrategy,
  WarmupStrategy, HitPrediction, OptimizationRecommendation,
} from "./types";

const log = getLogger("cache-analyzer");

// ===========================================================================
// Public API
// ===========================================================================

export async function generateCacheReport(): Promise<CacheOptimizationReport> {
  const generatedAt = new Date().toISOString();
  const [cacheStats, cacheCandidates, ttlRecs, invalidationStrategies,
    tagStrategies, warmupStrategies, hitPredictions] = await Promise.all([
    computeCacheStats(),
    identifyCacheCandidates(),
    recommendTtls(),
    recommendInvalidationStrategies(),
    recommendTagStrategies(),
    recommendWarmupStrategies(),
    predictHitRates(),
  ]);
  const recommendations = generateCacheRecommendations({
    cacheStats, cacheCandidates, ttlRecs, hitPredictions,
  });
  log.info("cache.audit_complete", {
    entries: cacheStats.totalEntries, hitRate: cacheStats.hitRate,
    candidates: cacheCandidates.length, recommendations: recommendations.length,
  });
  return {
    generatedAt,
    cacheStats, cacheCandidates, ttlRecommendations: ttlRecs,
    invalidationStrategies, tagStrategies, warmupStrategies,
    hitPredictions, recommendations,
  };
}

// ===========================================================================
// Analyzers
// ===========================================================================

async function computeCacheStats(): Promise<CacheStatsSummary> {
  const entries = await repo.fetchCacheEntries();
  if (entries.length === 0) {
    return {
      totalEntries: 0, totalHits: 0, totalMisses: 0, hitRate: 0,
      avgTtlSeconds: 0, namespaces: [],
    };
  }
  const byNamespace = new Map<string, { entries: number; hits: number; misses: number }>();
  let totalHits = 0, totalMisses = 0, totalTtl = 0;
  for (const e of entries) {
    const ns = byNamespace.get(e.namespace) ?? { entries: 0, hits: 0, misses: 0 };
    ns.entries++;
    ns.hits += e.hitCount;
    ns.misses += e.missCount;
    totalHits += e.hitCount;
    totalMisses += e.missCount;
    totalTtl += e.ttlSeconds;
    byNamespace.set(e.namespace, ns);
  }
  const namespaces = Array.from(byNamespace.entries()).map(([namespace, s]) => ({
    namespace, entries: s.entries, hits: s.hits, misses: s.misses,
    hitRate: s.hits + s.misses > 0 ? Math.round((s.hits / (s.hits + s.misses)) * 100) / 100 : 0,
  }));
  return {
    totalEntries: entries.length,
    totalHits, totalMisses,
    hitRate: totalHits + totalMisses > 0 ? Math.round((totalHits / (totalHits + totalMisses)) * 100) / 100 : 0,
    avgTtlSeconds: Math.round(totalTtl / entries.length),
    namespaces,
  };
}

async function identifyCacheCandidates(): Promise<CacheCandidate[]> {
  // Candidates = expensive queries (slow trace spans on database) that are read frequently
  const spans = await repo.fetchSlowTraceSpans({ minDurationMs: 100, limit: 30 });
  const candidates: CacheCandidate[] = [];
  const seen = new Set<string>();
  for (const s of spans) {
    if (s.module !== "database") continue;
    const attrs = repo.safeParse<Record<string, unknown>>(s.attributes, {});
    const model = String(attrs.model ?? "unknown");
    if (seen.has(model)) continue;
    seen.add(model);
    candidates.push({
      entityType: `database:${model}`,
      reason: `${model} queries take ${s.durationMs}ms p95 — caching would eliminate the query.`,
      estimatedHitRate: 0.7,
      recommendedTtlSeconds: 300,
      estimatedMemoryBytes: Number(attrs.payloadBytes ?? 50000),
    });
  }
  // Add well-known cache candidates from the codebase
  const knownCandidates: CacheCandidate[] = [
    {
      entityType: "dashboard:admin",
      reason: "Admin dashboard aggregates data from 20+ subsystems — caching eliminates redundant aggregation.",
      estimatedHitRate: 0.85, recommendedTtlSeconds: 60,
      estimatedMemoryBytes: 100000,
    },
    {
      entityType: "curriculum:coverage",
      reason: "Curriculum coverage analysis is expensive and changes infrequently.",
      estimatedHitRate: 0.9, recommendedTtlSeconds: 600,
      estimatedMemoryBytes: 50000,
    },
    {
      entityType: "knowledge_graph:traversal",
      reason: "Knowledge graph traversals are expensive and graph structure changes rarely.",
      estimatedHitRate: 0.8, recommendedTtlSeconds: 300,
      estimatedMemoryBytes: 200000,
    },
    {
      entityType: "recommendations:personalized",
      reason: "Personalized recommendations are recomputed frequently but user preferences change slowly.",
      estimatedHitRate: 0.6, recommendedTtlSeconds: 120,
      estimatedMemoryBytes: 30000,
    },
  ];
  return [...candidates, ...knownCandidates].slice(0, 15);
}

async function recommendTtls(): Promise<TtlRecommendation[]> {
  const entries = await repo.fetchCacheEntries();
  const byNamespace = new Map<string, { ttlSum: number; count: number; hits: number; misses: number }>();
  for (const e of entries) {
    const ns = byNamespace.get(e.namespace) ?? { ttlSum: 0, count: 0, hits: 0, misses: 0 };
    ns.ttlSum += e.ttlSeconds;
    ns.count++;
    ns.hits += e.hitCount;
    ns.misses += e.missCount;
    byNamespace.set(e.namespace, ns);
  }
  const recommendations: TtlRecommendation[] = [];
  for (const [namespace, stats] of byNamespace) {
    const currentTtl = Math.round(stats.ttlSum / stats.count);
    const hitRate = stats.hits + stats.misses > 0 ? stats.hits / (stats.hits + stats.misses) : 0;
    let recommendedTtl = currentTtl;
    let reason = "TTL is appropriate for the observed hit rate.";
    if (hitRate < 0.3 && currentTtl < 60) {
      recommendedTtl = currentTtl * 2;
      reason = `Hit rate is low (${(hitRate * 100).toFixed(0)}%) — increasing TTL may improve hit rate.`;
    } else if (hitRate > 0.8 && currentTtl > 600) {
      recommendedTtl = Math.max(300, currentTtl / 2);
      reason = `Hit rate is very high (${(hitRate * 100).toFixed(0)}%) — shorter TTL would free memory without hurting hit rate.`;
    }
    recommendations.push({ namespace, currentTtlSeconds: currentTtl, recommendedTtlSeconds: recommendedTtl, reason });
  }
  return recommendations;
}

async function recommendInvalidationStrategies(): Promise<InvalidationStrategy[]> {
  // Well-known invalidation strategies per namespace
  const strategies: InvalidationStrategy[] = [
    {
      namespace: "ai",
      currentStrategy: "TTL-based",
      recommendedStrategy: "Tag-based + TTL fallback",
      reason: "AI responses should be invalidated when the source prompt or context changes. Tags allow targeted invalidation.",
    },
    {
      namespace: "search",
      currentStrategy: "TTL-based",
      recommendedStrategy: "Write-through + TTL fallback",
      reason: "Search indices should be updated immediately when resources change, with TTL as a safety net.",
    },
    {
      namespace: "recommendations",
      currentStrategy: "TTL-based",
      recommendedStrategy: "Event-driven + TTL fallback",
      reason: "Recommendations should be refreshed when user behavior events arrive, not just on TTL expiry.",
    },
    {
      namespace: "dashboards",
      currentStrategy: "TTL-based",
      recommendedStrategy: "Tag-based + scheduled refresh",
      reason: "Dashboard data should be refreshed on a schedule and invalidated by tag when source data changes.",
    },
  ];
  return strategies;
}

async function recommendTagStrategies(): Promise<TagStrategy[]> {
  return [
    {
      namespace: "ai",
      recommendedTags: ["prompt:{promptId}", "user:{userId}", "org:{orgId}"],
      reason: "Tag by prompt, user, and org for targeted invalidation.",
    },
    {
      namespace: "search",
      recommendedTags: ["resource:{resourceId}", "concept:{conceptId}", "subject:{subject}"],
      reason: "Tag by resource, concept, and subject to invalidate only affected entries.",
    },
    {
      namespace: "recommendations",
      recommendedTags: ["user:{userId}", "classroom:{classroomId}"],
      reason: "Tag by user and classroom for personalized invalidation.",
    },
    {
      namespace: "dashboards",
      recommendedTags: ["org:{orgId}", "subsystem:{subsystem}"],
      reason: "Tag by org and subsystem for granular invalidation.",
    },
  ];
}

async function recommendWarmupStrategies(): Promise<WarmupStrategy[]> {
  return [
    {
      namespace: "dashboards",
      warmupTrigger: "On startup + every 5 minutes",
      estimatedWarmupMs: 5000,
      reason: "Pre-compute dashboard data so the first request is fast.",
    },
    {
      namespace: "search",
      warmupTrigger: "On resource create/update",
      estimatedWarmupMs: 500,
      reason: "Index new resources immediately to avoid cold-cache misses.",
    },
    {
      namespace: "recommendations",
      warmupTrigger: "On user login",
      estimatedWarmupMs: 2000,
      reason: "Pre-compute recommendations for active users on login.",
    },
  ];
}

async function predictHitRates(): Promise<HitPrediction[]> {
  const entries = await repo.fetchCacheEntries();
  const byNamespace = new Map<string, { hits: number; misses: number }>();
  for (const e of entries) {
    const ns = byNamespace.get(e.namespace) ?? { hits: 0, misses: 0 };
    ns.hits += e.hitCount;
    ns.misses += e.missCount;
    byNamespace.set(e.namespace, ns);
  }
  const predictions: HitPrediction[] = [];
  for (const [namespace, stats] of byNamespace) {
    const currentHitRate = stats.hits + stats.misses > 0 ? stats.hits / (stats.hits + stats.misses) : 0;
    // Predict: with recommended TTL adjustments, hit rate would be ~10% higher
    const predictedHitRate = Math.min(0.95, currentHitRate + 0.1);
    predictions.push({
      entityType: `namespace:${namespace}`,
      predictedHitRate: Math.round(predictedHitRate * 100) / 100,
      confidence: stats.hits + stats.misses > 100 ? 0.9 : 0.5,
    });
  }
  return predictions;
}

// ===========================================================================
// Recommendation generator
// ===========================================================================

function generateCacheRecommendations(input: {
  cacheStats: CacheStatsSummary;
  cacheCandidates: CacheCandidate[];
  ttlRecs: TtlRecommendation[];
  hitPredictions: HitPrediction[];
}): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = [];
  let id = 0;
  const nextId = () => `cache-${++id}`;
  if (input.cacheStats.hitRate < 0.5 && input.cacheStats.totalEntries > 0) {
    recs.push({
      id: nextId(), category: "cache",
      title: "Improve cache hit rate",
      description: `Current hit rate is ${(input.cacheStats.hitRate * 100).toFixed(0)}% — below the 50% target.`,
      impact: "high", effort: "medium",
      recommendation: "Review TTL values, add warmup strategies, and identify new cache candidates.",
    });
  }
  if (input.cacheCandidates.length > 0) {
    recs.push({
      id: nextId(), category: "cache",
      title: "Add new cache candidates",
      description: `${input.cacheCandidates.length} entity type(s) would benefit from caching.`,
      impact: "medium", effort: "low",
      recommendation: "Cache the identified entities with the recommended TTLs.",
    });
  }
  const ttlChanges = input.ttlRecs.filter(r => r.currentTtlSeconds !== r.recommendedTtlSeconds);
  if (ttlChanges.length > 0) {
    recs.push({
      id: nextId(), category: "cache",
      title: "Adjust cache TTLs",
      description: `${ttlChanges.length} namespace(s) would benefit from TTL changes.`,
      impact: "low", effort: "low",
      recommendation: "Apply the recommended TTL values to optimize memory usage and hit rate.",
    });
  }
  return recs;
}
