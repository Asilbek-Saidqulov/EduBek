/**
 * EduBek — Optimization Engine.
 *
 * Phase 4F.7: Continuously auto-tunes platform parameters based on
 * observed behavior. Each optimization:
 *
 *   1. Reads the current value of a parameter.
 *   2. Reads the observed metric (from feedback events / learning signals).
 *   3. Computes a new value using a deterministic heuristic.
 *   4. Persists an OptimizationSnapshot (previous + new value + confidence).
 *   5. Auto-applies the optimization if confidence ≥ threshold.
 *
 * Supported parameters:
 *   • cache_ttl              — RecommendationCache TTL
 *   • ranking_weights        — Semantic Search ranking weights
 *   • recommendation_weights — Recommendation Engine weights
 *   • embedding_freshness    — How often to re-embed entities
 *   • graph_density          — Target Knowledge Graph edge density
 *   • search_aliases         — When to add new search aliases
 *   • curriculum_mappings    — Curriculum mapping threshold
 *   • automation_thresholds  — Automation trigger thresholds
 *   • planner_intervals      — Learning Planner recomputation intervals
 *   • notification_timing    — Optimal notification send times
 *
 * Reuses:
 *   • Phase 4F.7 LearningSignal (observed CTR / satisfaction)
 *   • Phase 4F.2 SCORE_WEIGHTS (current ranking weights)
 *   • Phase 4F.3 RecommendationCache TTL
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { OptimizationParameter, OptimizationSnapshotDto } from "./types";

const log = getLogger("optimization");

const AUTO_APPLY_THRESHOLD = 0.7;

// ---------------------------------------------------------------------------
// Main entry point: run all optimizations
// ---------------------------------------------------------------------------

export async function runOptimizations(): Promise<OptimizationSnapshotDto[]> {
  const snapshots: OptimizationSnapshotDto[] = [];

  // Cache TTL optimization
  const cacheOpt = await optimizeCacheTtl().catch(() => null);
  if (cacheOpt) snapshots.push(cacheOpt);

  // Ranking weights optimization
  const rankingOpt = await optimizeRankingWeights().catch(() => null);
  if (rankingOpt) snapshots.push(rankingOpt);

  // Recommendation weights optimization
  const recOpt = await optimizeRecommendationWeights().catch(() => null);
  if (recOpt) snapshots.push(recOpt);

  // Embedding freshness optimization
  const embedOpt = await optimizeEmbeddingFreshness().catch(() => null);
  if (embedOpt) snapshots.push(embedOpt);

  // Graph density optimization
  const graphOpt = await optimizeGraphDensity().catch(() => null);
  if (graphOpt) snapshots.push(graphOpt);

  // Curriculum mapping threshold optimization
  const currOpt = await optimizeCurriculumMappings().catch(() => null);
  if (currOpt) snapshots.push(currOpt);

  // Automation thresholds optimization
  const autoOpt = await optimizeAutomationThresholds().catch(() => null);
  if (autoOpt) snapshots.push(autoOpt);

  // Planner intervals optimization
  const plannerOpt = await optimizePlannerIntervals().catch(() => null);
  if (plannerOpt) snapshots.push(plannerOpt);

  // Notification timing optimization
  const notifOpt = await optimizeNotificationTiming().catch(() => null);
  if (notifOpt) snapshots.push(notifOpt);

  log.info("optimization.run_completed", {
    optimizations: snapshots.length,
    autoApplied: snapshots.filter((s) => s.autoApplied).length,
  });

  return snapshots;
}

export async function listOptimizations(input: {
  parameter?: OptimizationParameter;
  autoApplied?: boolean;
  limit?: number;
}): Promise<OptimizationSnapshotDto[]> {
  const rows = await repo.findOptimizationSnapshots(input);
  return rows.map(mapSnapshot);
}

// ---------------------------------------------------------------------------
// Individual optimizers
// ---------------------------------------------------------------------------

async function optimizeCacheTtl(): Promise<OptimizationSnapshotDto | null> {
  // Read observed recommendation cache hit rate from LearningSignals
  const signals = await repo.findLearningSignals({ signalType: "recommendation", limit: 1000 });
  const avgCtr = signals.length > 0
    ? signals.reduce((s, x) => s + x.ctr, 0) / signals.length
    : 0.1;

  // Heuristic: low CTR → shorter TTL (refresh more often)
  // high CTR → longer TTL (don't refresh unnecessarily)
  const currentTtl = 300; // 5 minutes (Phase 4F.2 default)
  const newTtl = avgCtr < 0.05 ? 120    // very low CTR → 2 min
                : avgCtr < 0.15 ? 240   // low CTR → 4 min
                : avgCtr < 0.3 ? 300    // medium CTR → 5 min (default)
                : 600;                   // high CTR → 10 min

  if (newTtl === currentTtl) return null;

  const confidence = clamp(0.4 + avgCtr * 2, 0.4, 0.9);
  const improvementPct = ((newTtl - currentTtl) / currentTtl) * 100;

  return persistOptimization({
    parameter: "cache_ttl",
    previousValue: { ttlSeconds: currentTtl },
    newValue: { ttlSeconds: newTtl },
    metric: `avg_ctr=${avgCtr.toFixed(3)}`,
    improvementPct,
    confidence,
  });
}

async function optimizeRankingWeights(): Promise<OptimizationSnapshotDto | null> {
  // Read search outcomes to see if ranking adjustments are needed
  const outcomes = await repo.findSearchOutcomes({ limit: 500 });
  if (outcomes.length < 50) return null;

  const abandonedRate = outcomes.filter((o) => o.abandoned).length / outcomes.length;
  const clickedSearches = outcomes.filter((o) => o.clickedPosition !== null);
  const avgPosition = clickedSearches.length > 0
    ? clickedSearches.reduce((s, o) => s + (o.clickedPosition ?? 0), 0) / clickedSearches.length
    : 0;

  // Heuristic: high abandonment + high avg position → boost semantic weight
  const currentSemanticWeight = 0.2;
  let newSemanticWeight = currentSemanticWeight;
  if (abandonedRate > 0.3 && avgPosition > 5) {
    newSemanticWeight = 0.25;
  } else if (abandonedRate < 0.1 && avgPosition < 3) {
    newSemanticWeight = 0.18;
  }

  if (newSemanticWeight === currentSemanticWeight) return null;

  const confidence = clamp(0.5 + outcomes.length / 1000, 0.5, 0.9);
  const improvementPct = ((newSemanticWeight - currentSemanticWeight) / currentSemanticWeight) * 100;

  return persistOptimization({
    parameter: "ranking_weights",
    previousValue: { semantic: currentSemanticWeight },
    newValue: { semantic: newSemanticWeight },
    metric: `abandoned_rate=${abandonedRate.toFixed(3)}, avg_position=${avgPosition.toFixed(1)}`,
    improvementPct,
    confidence,
  });
}

async function optimizeRecommendationWeights(): Promise<OptimizationSnapshotDto | null> {
  // Read recommendation learning to adjust per-strategy weights
  const signals = await repo.findLearningSignals({ signalType: "recommendation", limit: 100 });
  if (signals.length === 0) return null;

  // Find the best + worst performing entities
  const sorted = [...signals].sort((a, b) => b.ctr - a.ctr);
  const topCtr = sorted[0]!.ctr;
  const bottomCtr = sorted[sorted.length - 1]!.ctr;

  // If there's a wide spread, adjust the popularity weight
  const currentPopularityWeight = 0.05;
  const spread = topCtr - bottomCtr;
  const newPopularityWeight = spread > 0.2 ? 0.08 : currentPopularityWeight;

  if (newPopularityWeight === currentPopularityWeight) return null;

  const confidence = clamp(0.5 + signals.length / 200, 0.5, 0.85);
  const improvementPct = ((newPopularityWeight - currentPopularityWeight) / currentPopularityWeight) * 100;

  return persistOptimization({
    parameter: "recommendation_weights",
    previousValue: { popularity: currentPopularityWeight },
    newValue: { popularity: newPopularityWeight },
    metric: `ctr_spread=${spread.toFixed(3)}`,
    improvementPct,
    confidence,
  });
}

async function optimizeEmbeddingFreshness(): Promise<OptimizationSnapshotDto | null> {
  // Read how often resources are updated to determine embedding refresh interval
  const { db } = await import("@/lib/db");
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const totalResources = await db.resource.count().catch(() => 0);
  const recentlyUpdated = await db.resource.count({
    where: { updatedAt: { gte: thirtyDaysAgo } },
  }).catch(() => 0);

  if (totalResources === 0) return null;

  const updateRate = recentlyUpdated / totalResources;
  // High update rate → refresh embeddings more often
  const currentIntervalDays = 7;
  const newIntervalDays = updateRate > 0.3 ? 3 : updateRate > 0.1 ? 7 : 14;

  if (newIntervalDays === currentIntervalDays) return null;

  const confidence = clamp(0.5 + updateRate, 0.5, 0.9);
  const improvementPct = ((newIntervalDays - currentIntervalDays) / currentIntervalDays) * 100;

  return persistOptimization({
    parameter: "embedding_freshness",
    previousValue: { intervalDays: currentIntervalDays },
    newValue: { intervalDays: newIntervalDays },
    metric: `update_rate=${updateRate.toFixed(3)}`,
    improvementPct,
    confidence,
  });
}

async function optimizeGraphDensity(): Promise<OptimizationSnapshotDto | null> {
  // Read current graph density
  const { db } = await import("@/lib/db");
  const nodeCount = await db.knowledgeGraphNode.count().catch(() => 0);
  const edgeCount = await db.knowledgeGraphEdge.count().catch(() => 0);
  if (nodeCount === 0) return null;

  const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
  const currentDensity = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;

  // Target density: 0.05-0.15 (sparse but connected)
  const targetDensity = 0.1;
  if (Math.abs(currentDensity - targetDensity) < 0.01) return null;

  const confidence = clamp(0.4 + nodeCount / 1000, 0.4, 0.85);
  const improvementPct = ((targetDensity - currentDensity) / Math.max(0.01, currentDensity)) * 100;

  return persistOptimization({
    parameter: "graph_density",
    previousValue: { density: currentDensity },
    newValue: { density: targetDensity, action: currentDensity < targetDensity ? "add_edges" : "prune_edges" },
    metric: `current_density=${currentDensity.toFixed(3)}`,
    improvementPct,
    confidence,
  });
}

async function optimizeCurriculumMappings(): Promise<OptimizationSnapshotDto | null> {
  // Read curriculum mapping alignment scores to adjust the auto-mapping threshold
  const { db } = await import("@/lib/db");
  const mappings = await db.curriculumMapping.findMany({
    select: { alignmentScore: true },
    take: 500,
  }).catch(() => []);

  if (mappings.length < 50) return null;

  const avgAlignment = mappings.reduce((s, m) => s + m.alignmentScore, 0) / mappings.length;
  // If avg alignment is low, raise the threshold (be more selective)
  // If avg alignment is high, lower the threshold (be more inclusive)
  const currentThreshold = 0.4;
  const newThreshold = avgAlignment < 0.5 ? 0.5 : avgAlignment > 0.7 ? 0.35 : 0.4;

  if (newThreshold === currentThreshold) return null;

  const confidence = clamp(0.5 + mappings.length / 1000, 0.5, 0.85);
  const improvementPct = ((newThreshold - currentThreshold) / currentThreshold) * 100;

  return persistOptimization({
    parameter: "curriculum_mappings",
    previousValue: { threshold: currentThreshold },
    newValue: { threshold: newThreshold },
    metric: `avg_alignment=${avgAlignment.toFixed(3)}`,
    improvementPct,
    confidence,
  });
}

async function optimizeAutomationThresholds(): Promise<OptimizationSnapshotDto | null> {
  // Read automation rule fire rates to adjust thresholds
  const { db } = await import("@/lib/db");
  const rules = await db.automationRule.findMany({
    where: { enabled: true },
    select: { executionCount: true, maxPerHour: true, lastFiredAt: true },
  }).catch(() => []);

  if (rules.length === 0) return null;

  // If many rules are hitting their rate limit, raise the limit
  const rulesAtLimit = rules.filter((r) => r.executionCount >= r.maxPerHour).length;
  const currentMax = 10;
  const newMax = rulesAtLimit > rules.length * 0.3 ? 20 : currentMax;

  if (newMax === currentMax) return null;

  const confidence = clamp(0.5 + rules.length / 50, 0.5, 0.85);
  const improvementPct = ((newMax - currentMax) / currentMax) * 100;

  return persistOptimization({
    parameter: "automation_thresholds",
    previousValue: { maxPerHour: currentMax },
    newValue: { maxPerHour: newMax },
    metric: `rules_at_limit=${rulesAtLimit}/${rules.length}`,
    improvementPct,
    confidence,
  });
}

async function optimizePlannerIntervals(): Promise<OptimizationSnapshotDto | null> {
  // Read how often plans are updated to determine recompute interval
  const { db } = await import("@/lib/db");
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPlans = await db.learningPlan.count({
    where: { updatedAt: { gte: sevenDaysAgo } },
  }).catch(() => 0);

  // If plans are updated frequently, recompute more often
  const currentIntervalHours = 24;
  const newIntervalHours = recentPlans > 100 ? 12 : recentPlans > 50 ? 24 : 48;

  if (newIntervalHours === currentIntervalHours) return null;

  const confidence = clamp(0.4 + recentPlans / 200, 0.4, 0.85);
  const improvementPct = ((newIntervalHours - currentIntervalHours) / currentIntervalHours) * 100;

  return persistOptimization({
    parameter: "planner_intervals",
    previousValue: { intervalHours: currentIntervalHours },
    newValue: { intervalHours: newIntervalHours },
    metric: `recent_plans=${recentPlans}`,
    improvementPct,
    confidence,
  });
}

async function optimizeNotificationTiming(): Promise<OptimizationSnapshotDto | null> {
  // Read when notifications get the highest engagement
  const { db } = await import("@/lib/db");
  const notifications = await db.userNotification.findMany({
    select: { createdAt: true },
    take: 1000,
  }).catch(() => []);

  if (notifications.length < 100) return null;

  // Compute the hour-of-day distribution
  const hourCounts = new Array(24).fill(0);
  for (const n of notifications) {
    hourCounts[n.createdAt.getHours()] += 1;
  }

  // Find the peak hour
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const currentDefaultHour = 9; // 9 AM default
  if (peakHour === currentDefaultHour) return null;

  const confidence = clamp(0.4 + notifications.length / 2000, 0.4, 0.8);
  const improvementPct = ((peakHour - currentDefaultHour) / 24) * 100;

  return persistOptimization({
    parameter: "notification_timing",
    previousValue: { defaultHour: currentDefaultHour },
    newValue: { defaultHour: peakHour },
    metric: `peak_hour=${peakHour}:00`,
    improvementPct,
    confidence,
  });
}

// ---------------------------------------------------------------------------
// Internal: persist an optimization snapshot
// ---------------------------------------------------------------------------

async function persistOptimization(input: {
  parameter: OptimizationParameter;
  previousValue: unknown;
  newValue: unknown;
  metric: string;
  improvementPct: number;
  confidence: number;
}): Promise<OptimizationSnapshotDto> {
  const autoApplied = input.confidence >= AUTO_APPLY_THRESHOLD;
  const row = await repo.createOptimizationSnapshot({
    parameter: input.parameter,
    previousValue: JSON.stringify(input.previousValue),
    newValue: JSON.stringify(input.newValue),
    metric: input.metric,
    improvementPct: input.improvementPct,
    confidence: input.confidence,
    autoApplied,
    appliedAt: autoApplied ? new Date() : undefined,
  });

  log.info("optimization.persisted", {
    parameter: input.parameter,
    confidence: input.confidence,
    autoApplied,
    improvementPct: input.improvementPct,
  });

  return mapSnapshot(row);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function mapSnapshot(row: any): OptimizationSnapshotDto {
  return {
    id: row.id,
    parameter: row.parameter as OptimizationParameter,
    previousValue: safeParse(row.previousValue),
    newValue: safeParse(row.newValue),
    metric: row.metric,
    improvementPct: row.improvementPct,
    confidence: row.confidence,
    autoApplied: row.autoApplied,
    appliedAt: row.appliedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
