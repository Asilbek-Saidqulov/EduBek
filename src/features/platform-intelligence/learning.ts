/**
 * EduBek — Learning & Evaluation Engine.
 *
 * Phase 4F.7: Aggregates feedback events + recommendation outcomes +
 * search outcomes + prompt evaluations into actionable learning:
 *
 *   • Recommendation Learning — CTR, completion, dismiss, ignore →
 *     per-strategy confidence adjustments
 *   • Search Learning — clicked/ignored/reformulated/abandoned →
 *     ranking weight suggestions
 *   • Prompt Optimization — acceptance, regeneration, edits, rating →
 *     best/worst prompt detection + drift detection
 *
 * Reuses:
 *   • Phase 4F.7 FeedbackEvent + LearningSignal tables
 *   • Phase 4F.2 Recommendation Analytics (recommendation outcomes)
 *   • Phase 4F.7 SearchOutcome + PromptEvaluation tables
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  LearningSignalDto,
  LearningSignalType,
  PromptLearningDto,
  RecommendationLearningDto,
  SearchLearningDto,
} from "./types";

const log = getLogger("learning");

// ---------------------------------------------------------------------------
// Recommendation Learning
// ---------------------------------------------------------------------------

export async function computeRecommendationLearning(input: {
  sinceDays?: number;
}): Promise<RecommendationLearningDto[]> {
  const since = input.sinceDays
    ? new Date(Date.now() - input.sinceDays * 24 * 60 * 60 * 1000)
    : undefined;

  const outcomes = await repo.findRecommendationOutcomes({ since, limit: 5000 });

  // Group by strategy
  const byStrategy = new Map<string, typeof outcomes>();
  for (const o of outcomes) {
    const list = byStrategy.get(o.strategy) ?? [];
    list.push(o);
    byStrategy.set(o.strategy, list);
  }

  const results: RecommendationLearningDto[] = [];
  for (const [strategy, strategyOutcomes] of byStrategy) {
    const totalImpressions = strategyOutcomes.filter((o) => o.outcome === "impression").length;
    const totalClicks = strategyOutcomes.filter((o) => o.outcome === "click" || o.outcome === "open").length;
    const totalCompletions = strategyOutcomes.filter((o) => o.outcome === "complete").length;
    const totalDismissals = strategyOutcomes.filter((o) => o.outcome === "dismiss").length;

    const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const satisfaction = totalClicks > 0 ? totalCompletions / totalClicks : 0;

    // Confidence adjustment: strategies with high CTR get a boost (max 1.5),
    // strategies with low CTR get a penalty (min 0.5).
    const confidenceAdjustment = clamp(0.5 + ctr * 2, 0.5, 1.5);

    // Per-position CTR
    const positionMap = new Map<number, { impressions: number; clicks: number }>();
    for (const o of strategyOutcomes) {
      const entry = positionMap.get(o.position) ?? { impressions: 0, clicks: 0 };
      if (o.outcome === "impression") entry.impressions += 1;
      if (o.outcome === "click" || o.outcome === "open") entry.clicks += 1;
      positionMap.set(o.position, entry);
    }
    const positionCtr = Array.from(positionMap.entries())
      .map(([position, e]) => ({
        position,
        ctr: e.impressions > 0 ? e.clicks / e.impressions : 0,
      }))
      .sort((a, b) => a.position - b.position);

    results.push({
      strategy,
      totalImpressions,
      totalClicks,
      totalCompletions,
      totalDismissals,
      ctr,
      satisfaction,
      confidenceAdjustment,
      positionCtr,
    });
  }

  // Sort by CTR descending
  results.sort((a, b) => b.ctr - a.ctr);

  log.info("recommendation_learning.computed", {
    strategies: results.length,
    totalOutcomes: outcomes.length,
  });

  return results;
}

// ---------------------------------------------------------------------------
// Search Learning
// ---------------------------------------------------------------------------

export async function computeSearchLearning(input: {
  sinceDays?: number;
}): Promise<SearchLearningDto> {
  const since = input.sinceDays
    ? new Date(Date.now() - input.sinceDays * 24 * 60 * 60 * 1000)
    : undefined;

  const outcomes = await repo.findSearchOutcomes({ since, limit: 5000 });

  const totalSearches = outcomes.length;
  const successfulSearches = outcomes.filter((o) => o.outcome === "success").length;
  const failedSearches = outcomes.filter((o) => o.outcome === "failure").length;
  const abandonedSearches = outcomes.filter((o) => o.abandoned).length;
  const reformulatedSearches = outcomes.filter((o) => o.reformulated).length;

  // Average clicked position
  const clickedSearches = outcomes.filter((o) => o.clickedPosition !== null);
  const avgClickedPosition = clickedSearches.length > 0
    ? clickedSearches.reduce((s, o) => s + (o.clickedPosition ?? 0), 0) / clickedSearches.length
    : 0;

  // Top queries
  const queryCounts = new Map<string, { count: number; clicks: number }>();
  for (const o of outcomes) {
    const entry = queryCounts.get(o.query) ?? { count: 0, clicks: 0 };
    entry.count += 1;
    if (o.clickedPosition !== null) entry.clicks += 1;
    queryCounts.set(o.query, entry);
  }
  const topQueries = Array.from(queryCounts.entries())
    .map(([query, e]) => ({
      query,
      count: e.count,
      ctr: e.count > 0 ? e.clicks / e.count : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Zero-result queries
  const zeroResultQueries = Array.from(queryCounts.entries())
    .filter(([, e]) => e.count > 0)
    .map(([query, e]) => ({ query, count: e.count }))
    .filter((q) => {
      // Find outcomes with this query and check if all have resultCount=0
      const matches = outcomes.filter((o) => o.query === q.query);
      return matches.length > 0 && matches.every((o) => o.resultCount === 0);
    })
    .slice(0, 20);

  // Ranking adjustments — based on observed outcomes
  const rankingAdjustments = computeRankingAdjustments(outcomes);

  log.info("search_learning.computed", {
    totalSearches,
    successRate: totalSearches > 0 ? successfulSearches / totalSearches : 0,
  });

  return {
    totalSearches,
    successfulSearches,
    failedSearches,
    abandonedSearches,
    reformulatedSearches,
    avgClickedPosition,
    topQueries,
    zeroResultQueries,
    rankingAdjustments,
  };
}

function computeRankingAdjustments(outcomes: any[]): SearchLearningDto["rankingAdjustments"] {
  const adjustments: SearchLearningDto["rankingAdjustments"] = [];

  // If many searches are abandoned, boost popularity weight
  const abandonedRate = outcomes.length > 0
    ? outcomes.filter((o) => o.abandoned).length / outcomes.length
    : 0;
  if (abandonedRate > 0.3) {
    adjustments.push({
      signal: "popularity",
      currentWeight: 0.05,
      suggestedWeight: 0.1,
      reason: `High abandonment rate (${Math.round(abandonedRate * 100)}%) suggests relevance is low — boost popularity signal.`,
    });
  }

  // If average clicked position is high (>5), boost semantic weight
  const clickedSearches = outcomes.filter((o) => o.clickedPosition !== null);
  const avgPosition = clickedSearches.length > 0
    ? clickedSearches.reduce((s, o) => s + (o.clickedPosition ?? 0), 0) / clickedSearches.length
    : 0;
  if (avgPosition > 5) {
    adjustments.push({
      signal: "semantic",
      currentWeight: 0.2,
      suggestedWeight: 0.25,
      reason: `Average clicked position is ${avgPosition.toFixed(1)} — users are scrolling past top results, suggesting semantic relevance needs a boost.`,
    });
  }

  // If reformulation rate is high, boost keyword weight
  const reformulationRate = outcomes.length > 0
    ? outcomes.filter((o) => o.reformulated).length / outcomes.length
    : 0;
  if (reformulationRate > 0.2) {
    adjustments.push({
      signal: "keyword",
      currentWeight: 0.15,
      suggestedWeight: 0.2,
      reason: `High reformulation rate (${Math.round(reformulationRate * 100)}%) suggests keyword matching needs improvement.`,
    });
  }

  return adjustments;
}

// ---------------------------------------------------------------------------
// Prompt Optimization
// ---------------------------------------------------------------------------

export async function recordPromptEvaluation(input: {
  promptTemplateId?: string;
  promptVersion?: string;
  provider: string;
  model: string;
  generationId?: string;
  acceptanceScore?: number;
  regenerationRate?: number;
  editRate?: number;
  userRating?: number;
  costCredits?: number;
  latencyMs?: number;
  locale?: string;
}): Promise<void> {
  // Compute overall quality: weighted blend of acceptance, (1 - regen rate),
  // (1 - edit rate), user rating
  const acceptance = input.acceptanceScore ?? 0.5;
  const regenPenalty = 1 - (input.regenerationRate ?? 0);
  const editPenalty = 1 - (input.editRate ?? 0);
  const rating = input.userRating ?? 0.5;
  const overallQuality = (acceptance * 0.35) + (regenPenalty * 0.25) + (editPenalty * 0.2) + (rating * 0.2);

  await repo.createPromptEvaluation({
    ...input,
    overallQuality,
  });

  log.info("prompt_evaluation.recorded", {
    promptTemplateId: input.promptTemplateId,
    overallQuality,
    acceptance,
  });
}

export async function computePromptLearning(input: {
  sinceDays?: number;
}): Promise<PromptLearningDto[]> {
  const since = input.sinceDays
    ? new Date(Date.now() - input.sinceDays * 24 * 60 * 60 * 1000)
    : undefined;

  const evaluations = await repo.findPromptEvaluations({ since, limit: 5000 });

  // Group by (promptTemplateId, promptVersion)
  const byPrompt = new Map<string, typeof evaluations>();
  for (const e of evaluations) {
    const key = `${e.promptTemplateId ?? "unknown"}:${e.promptVersion ?? "unknown"}`;
    const list = byPrompt.get(key) ?? [];
    list.push(e);
    byPrompt.set(key, list);
  }

  const results: PromptLearningDto[] = [];
  for (const [key, evals] of byPrompt) {
    const [promptTemplateId, promptVersion] = key.split(":");
    const totalGenerations = evals.length;
    const avgAcceptance = avg(evals.map((e) => e.acceptanceScore));
    const avgRegenerationRate = avg(evals.map((e) => e.regenerationRate));
    const avgEditRate = avg(evals.map((e) => e.editRate));
    const avgUserRating = avg(evals.map((e) => e.userRating ?? 0.5));
    const avgCostCredits = avg(evals.map((e) => e.costCredits));
    const avgLatencyMs = avg(evals.map((e) => e.latencyMs));
    const overallQuality = avg(evals.map((e) => e.overallQuality));

    // Drift detection: compare first half vs second half quality
    const half = Math.floor(evals.length / 2);
    const firstHalfQuality = avg(evals.slice(0, half).map((e) => e.overallQuality));
    const secondHalfQuality = avg(evals.slice(half).map((e) => e.overallQuality));
    const qualityDelta = secondHalfQuality - firstHalfQuality;
    const isDrifting = qualityDelta < -0.1; // >10% decline

    // Recommendation
    let recommendation: PromptLearningDto["recommendation"] = "keep";
    if (isDrifting && overallQuality < 0.5) recommendation = "rollback";
    else if (isDrifting) recommendation = "tune";
    else if (overallQuality < 0.4) recommendation = "deprecate";
    else if (overallQuality < 0.6) recommendation = "tune";

    results.push({
      promptTemplateId: promptTemplateId!,
      promptVersion: promptVersion === "unknown" ? null : promptVersion!,
      totalGenerations,
      avgAcceptance,
      avgRegenerationRate,
      avgEditRate,
      avgUserRating,
      avgCostCredits,
      avgLatencyMs,
      overallQuality,
      isDrifting,
      recommendation,
    });
  }

  // Sort by overall quality descending
  results.sort((a, b) => b.overallQuality - a.overallQuality);

  log.info("prompt_learning.computed", {
    prompts: results.length,
    drifting: results.filter((r) => r.isDrifting).length,
  });

  return results;
}

// ---------------------------------------------------------------------------
// Learning Signals query
// ---------------------------------------------------------------------------

export async function listLearningSignals(input: {
  signalType?: LearningSignalType;
  entityType?: string;
  limit?: number;
}): Promise<LearningSignalDto[]> {
  const rows = await repo.findLearningSignals(input);
  return rows.map((r) => ({
    id: r.id,
    signalType: r.signalType as LearningSignalType,
    entityType: r.entityType,
    entityId: r.entityId,
    secondaryEntityType: r.secondaryEntityType,
    secondaryEntityId: r.secondaryEntityId,
    impressions: r.impressions,
    clicks: r.clicks,
    completions: r.completions,
    dismissals: r.dismissals,
    ignores: r.ignores,
    ctr: r.ctr,
    satisfaction: r.satisfaction,
    recentOutcomes: safeParseArray(r.recentOutcomes),
    lastComputedAt: r.lastComputedAt?.toISOString() ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
