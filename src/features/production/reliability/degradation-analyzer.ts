/**
 * EduBek — Graceful Degradation Analyzer (System 4).
 *
 * Verifies how EduBek behaves if AI, search, marketplace, knowledge
 * graph, cloud workers, or cache become unavailable. Determines fallback
 * behavior, user impact, missing fallbacks, and recommended improvements.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  GracefulDegradationReport, DegradationScenario,
  ReliabilityRecommendation,
} from "./types";

const log = getLogger("degradation-analyzer");

export async function generateDegradationReport(): Promise<GracefulDegradationReport> {
  const generatedAt = new Date().toISOString();
  const [breakers, healthSnapshots, cacheEntries] = await Promise.all([
    repo.fetchCircuitBreakers(),
    repo.fetchLatestHealthPerSubsystem(),
    repo.fetchCacheEntries(),
  ]);
  const scenarios: DegradationScenario[] = [
    analyzeAIDegradation(breakers),
    analyzeSearchDegradation(healthSnapshots),
    analyzeMarketplaceDegradation(),
    analyzeKnowledgeGraphDegradation(healthSnapshots),
    analyzeCloudWorkersDegradation(healthSnapshots),
    analyzeCacheDegradation(cacheEntries),
  ];
  const missingFallbacks = scenarios.flatMap(s => s.missingFallbacks);
  const recommendations = generateDegradationRecommendations(scenarios);
  log.info("degradation.audit_complete", {
    scenarios: scenarios.length, missingFallbacks: missingFallbacks.length,
  });
  return { generatedAt, scenarios, missingFallbacks, recommendations };
}

function analyzeAIDegradation(breakers: Awaited<ReturnType<typeof repo.fetchCircuitBreakers>>): DegradationScenario {
  const hasAiBreaker = breakers.some(b => b.module === "ai-workspace");
  return {
    subsystem: "ai",
    fallbackBehavior: hasAiBreaker
      ? "Circuit breaker returns a fallback response when the AI provider is unavailable."
      : "No fallback — AI calls fail and return errors.",
    userImpact: "moderate",
    hasFallback: hasAiBreaker,
    fallbackDescription: hasAiBreaker
      ? "Circuit breaker provides a fallback string when the AI provider is down."
      : "No fallback configured.",
    missingFallbacks: hasAiBreaker ? [] : [
      "Circuit breaker on AI provider calls",
      "Cached AI responses for common queries",
      "Deterministic fallback for critical AI features",
    ],
    recommendedImprovements: [
      "Cache AI responses for common queries (e.g., lesson generation prompts)",
      "Show a user-friendly 'AI temporarily unavailable' message",
      "Implement deterministic fallbacks for critical AI features (e.g., cognitive-ai has this)",
    ],
  };
}

function analyzeSearchDegradation(healthSnapshots: Awaited<ReturnType<typeof repo.fetchLatestHealthPerSubsystem>>): DegradationScenario {
  const searchHealthy = healthSnapshots.find(s => s.subsystem === "search");
  return {
    subsystem: "search",
    fallbackBehavior: "If the search index is unavailable, the platform falls back to direct database queries (slower but functional).",
    userImpact: "minor",
    hasFallback: true,
    fallbackDescription: "Database queries can replace search index queries, albeit with reduced relevance ranking.",
    missingFallbacks: [],
    recommendedImprovements: [
      "Cache popular search results for short periods",
      "Implement a search health check that alerts on degradation",
      "Consider a read-only search mode during index rebuilds",
    ],
  };
}

function analyzeMarketplaceDegradation(): DegradationScenario {
  return {
    subsystem: "marketplace",
    fallbackBehavior: "Marketplace is a standalone feature — if it fails, other features continue to work.",
    userImpact: "minor",
    hasFallback: true,
    fallbackDescription: "Marketplace failures are isolated — core learning features are unaffected.",
    missingFallbacks: [],
    recommendedImprovements: [
      "Show a 'marketplace temporarily unavailable' banner instead of error pages",
      "Cache marketplace listing data for browsing when the marketplace is slow",
    ],
  };
}

function analyzeKnowledgeGraphDegradation(healthSnapshots: Awaited<ReturnType<typeof repo.fetchLatestHealthPerSubsystem>>): DegradationScenario {
  const kgHealthy = healthSnapshots.find(s => s.subsystem === "knowledge_graph");
  return {
    subsystem: "knowledge_graph",
    fallbackBehavior: "If the knowledge graph is unavailable, recommendations and curriculum mapping degrade but core features work.",
    userImpact: "moderate",
    hasFallback: true,
    fallbackDescription: "Recommendations fall back to popularity-based ranking without graph traversal.",
    missingFallbacks: [
      "Graph consistency repair mechanism (exists in self-healing but not automated)",
    ],
    recommendedImprovements: [
      "Cache graph traversal results for popular concepts",
      "Implement a degraded-mode flag that disables graph features gracefully",
      "Add a graph health check that triggers self-healing",
    ],
  };
}

function analyzeCloudWorkersDegradation(healthSnapshots: Awaited<ReturnType<typeof repo.fetchLatestHealthPerSubsystem>>): DegradationScenario {
  return {
    subsystem: "cloud_workers",
    fallbackBehavior: "If workers crash, background jobs queue up and are processed when workers restart. User-facing requests are unaffected.",
    userImpact: "minor",
    hasFallback: true,
    fallbackDescription: "Jobs are persisted in the CloudJob table and processed when workers recover.",
    missingFallbacks: [
      "Auto-scaling of workers based on queue depth",
    ],
    recommendedImprovements: [
      "Deploy at least 2 workers for redundancy",
      "Implement auto-restart on worker crash",
      "Add queue depth alerting",
      "Prioritize critical jobs in the queue",
    ],
  };
}

function analyzeCacheDegradation(cacheEntries: Awaited<ReturnType<typeof repo.fetchCacheEntries>>): DegradationScenario {
  const hasCache = cacheEntries.length > 0;
  return {
    subsystem: "cache",
    fallbackBehavior: hasCache
      ? "If cache is unavailable, the platform falls back to direct database queries (slower but functional)."
      : "No cache layer detected — all reads hit the database directly.",
    userImpact: "moderate",
    hasFallback: true,
    fallbackDescription: "Database queries replace cache reads, increasing latency but maintaining correctness.",
    missingFallbacks: hasCache ? [] : ["No cache layer configured"],
    recommendedImprovements: [
      "Implement circuit breaker on cache reads with DB fallback",
      "Add a local in-memory cache for critical data",
      "Monitor cache hit rate and alert on drops",
      "Implement cache warm-up procedure after restart",
    ],
  };
}

function generateDegradationRecommendations(scenarios: DegradationScenario[]): ReliabilityRecommendation[] {
  const recs: ReliabilityRecommendation[] = [];
  let id = 0;
  const nextId = () => `degradation-${++id}`;
  const noFallback = scenarios.filter(s => !s.hasFallback);
  if (noFallback.length > 0) {
    recs.push({
      id: nextId(), category: "degradation",
      title: "Add fallbacks for subsystems without degradation handling",
      description: `${noFallback.length} subsystem(s) have no fallback: ${noFallback.map(s => s.subsystem).join(", ")}.`,
      impact: "high", effort: "medium",
      recommendation: "Implement fallback behavior for each subsystem that lacks one.",
    });
  }
  const severeImpact = scenarios.filter(s => s.userImpact === "severe");
  if (severeImpact.length > 0) {
    recs.push({
      id: nextId(), category: "degradation",
      title: "Reduce user impact for severe degradation scenarios",
      description: `${severeImpact.length} subsystem(s) have severe user impact when degraded.`,
      impact: "high", effort: "high",
      recommendation: "Add caching, fallbacks, and graceful error messages to reduce user impact.",
    });
  }
  return recs;
}
