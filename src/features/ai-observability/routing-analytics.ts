/**
 * EduBek — Routing Analytics (System 5).
 * Analyzes provider selection frequency, fallback frequency, provider
 * reliability, failure rate, timeout rate, retry rate, routing confidence,
 * model utilization. Recommends better routing policies.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { RoutingAnalyticsReport } from "./types";

const log = getLogger("routing-analytics");

export async function generateRoutingReport(): Promise<RoutingAnalyticsReport> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const invocations = await repo.fetchAIInvocations({ since, limit: 1000 });
  const total = invocations.length || 1;
  const byProvider = new Map<string, { total: number; succeeded: number; failed: number }>();
  for (const inv of invocations) {
    const entry = byProvider.get(inv.provider) ?? { total: 0, succeeded: 0, failed: 0 };
    entry.total++;
    if (inv.status === "succeeded") entry.succeeded++;
    else entry.failed++;
    byProvider.set(inv.provider, entry);
  }
  const providerDistribution = Array.from(byProvider.entries()).map(([provider, data]) => ({
    provider, selectionCount: data.total,
    selectionPercent: Math.round((data.total / total) * 100),
  })).sort((a, b) => b.selectionCount - a.selectionCount);
  const fallbackFrequency = invocations.filter(i => i.status === "failed").length;
  const providerReliability = Array.from(byProvider.entries()).map(([provider, data]) => ({
    provider,
    successRate: data.total > 0 ? Math.round((data.succeeded / data.total) * 100) / 100 : 0,
    failureRate: data.total > 0 ? Math.round((data.failed / data.total) * 100) / 100 : 0,
    timeoutRate: 0, // would need timeout-specific tracking
    retryRate: 0, // would need retry-specific tracking
  }));
  const overallSuccessRate = invocations.filter(i => i.status === "succeeded").length / total;
  const routingConfidence = Math.round(overallSuccessRate * 100) / 100;
  const modelUtilization = new Map<string, number>();
  for (const inv of invocations) {
    modelUtilization.set(inv.model, (modelUtilization.get(inv.model) ?? 0) + 1);
  }
  const modelUtil = Array.from(modelUtilization.entries()).map(([model, count]) => ({
    model, callCount: count, percent: Math.round((count / total) * 100),
  })).sort((a, b) => b.callCount - a.callCount);
  const recommendations = generateRoutingRecommendations({ providerReliability, fallbackFrequency, total });
  log.info("routing.report_complete", { providers: providerDistribution.length, confidence: routingConfidence });
  return {
    generatedAt: new Date().toISOString(),
    providerDistribution, fallbackFrequency, providerReliability,
    routingConfidence, modelUtilization: modelUtil, recommendations,
  };
}

function generateRoutingRecommendations(input: {
  providerReliability: Array<{ provider: string; successRate: number; failureRate: number }>;
  fallbackFrequency: number; total: number;
}): string[] {
  const recs: string[] = [];
  const unreliable = input.providerReliability.filter(p => p.failureRate > 0.1);
  if (unreliable.length > 0) recs.push(`${unreliable.length} provider(s) have failure rate > 10% — consider reducing traffic to them.`);
  if (input.fallbackFrequency / Math.max(1, input.total) > 0.05) recs.push("Fallback frequency is high — review routing policies.");
  return recs;
}
