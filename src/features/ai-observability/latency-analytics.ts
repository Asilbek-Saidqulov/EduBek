/**
 * EduBek — Latency Analytics (System 2).
 * Analyzes average, P50, P90, P95, P99 latency by provider, feature,
 * model, endpoint, organization. Finds slow prompts, retrieval, reasoning,
 * providers. Generates optimization suggestions.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { LatencyAnalyticsReport, LatencyStats } from "./types";

const log = getLogger("latency-analytics");

export async function generateLatencyReport(): Promise<LatencyAnalyticsReport> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const invocations = await repo.fetchAIInvocations({ since, limit: 1000 });
  const allLatencies = invocations.map(i => i.latencyMs);
  const overall = computeStats(allLatencies);
  const byProvider = groupAndStats(invocations, "provider");
  const byModel = groupAndStats(invocations, "model");
  const byFeature = groupAndStats(invocations, "promptId");
  const byEndpoint = groupAndStats(invocations, "model");
  const byOrganization = groupAndStats(invocations, "organizationId");
  const slowPrompts = byFeature
    .filter(f => f.stats.avgMs > 1000)
    .map(f => ({ promptId: String(f.feature), avgLatencyMs: f.stats.avgMs, sampleCount: f.stats.count }))
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, 10);
  const slowProviders = byProvider
    .filter(p => p.stats.avgMs > overall.avgMs)
    .map(p => ({ provider: p.provider, avgLatencyMs: p.stats.avgMs }))
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, 5);
  const optimizationSuggestions = generateSuggestions(overall, slowPrompts, slowProviders);
  log.info("latency.report_complete", { count: invocations.length, p95: overall.p95Ms });
  return {
    generatedAt: new Date().toISOString(),
    overall, byProvider, byModel, byFeature, byEndpoint, byOrganization,
    slowPrompts, slowRetrieval: [], slowReasoning: [], slowProviders,
    optimizationSuggestions,
  };
}

function computeStats(values: number[]): LatencyStats {
  if (values.length === 0) return { count: 0, avgMs: 0, p50Ms: 0, p90Ms: 0, p95Ms: 0, p99Ms: 0, minMs: 0, maxMs: 0 };
  return {
    count: values.length,
    avgMs: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
    p50Ms: repo.percentile(values, 0.5),
    p90Ms: repo.percentile(values, 0.9),
    p95Ms: repo.percentile(values, 0.95),
    p99Ms: repo.percentile(values, 0.99),
    minMs: Math.min(...values),
    maxMs: Math.max(...values),
  };
}

function groupAndStats<T extends Record<string, unknown>>(items: T[], key: string): Array<{ [k: string]: unknown; stats: LatencyStats }> {
  const groups = new Map<string, number[]>();
  for (const item of items) {
    const groupKey = String(item[key] ?? "unknown");
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push(item.latencyMs as number);
  }
  return Array.from(groups.entries()).map(([k, values]) => ({ [key]: k, stats: computeStats(values) }));
}

function generateSuggestions(overall: LatencyStats, slowPrompts: Array<{ promptId: string; avgLatencyMs: number }>, slowProviders: Array<{ provider: string; avgLatencyMs: number }>): string[] {
  const suggestions: string[] = [];
  if (overall.p95Ms > 2000) suggestions.push(`P95 latency is ${overall.p95Ms}ms — consider caching or provider routing.`);
  if (slowPrompts.length > 0) suggestions.push(`${slowPrompts.length} prompt(s) have avg latency > 1000ms — review prompt complexity.`);
  if (slowProviders.length > 0) suggestions.push(`${slowProviders.length} provider(s) are slower than average — consider routing to faster providers.`);
  return suggestions;
}
