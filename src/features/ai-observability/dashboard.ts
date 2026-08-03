/**
 * EduBek — AI Control Tower Dashboard (System 11).
 * Unified dashboard: total requests, success rate, latency, costs, tokens,
 * providers, models, experiments, alerts, drift, forecasts, optimization
 * opportunities, quality trends, cache hit rate, routing distribution.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { generateLatencyReport } from "./latency-analytics";
import { generateCostReport } from "./cost-analytics";
import { generateRoutingReport } from "./routing-analytics";
import { generateExperimentReport } from "./experiment-engine";
import { generateDriftReport } from "./drift-monitor";
import { generateAnomalyReport } from "./anomaly-detector";
import { generateOptimizationReport } from "./optimization-engine";
import { generateForecastReport } from "./forecasting";
import { listAlerts } from "./alert-manager";
import type { ControlTowerDashboard } from "./types";

const log = getLogger("dashboard");

export async function generateDashboard(): Promise<ControlTowerDashboard> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [invocations, evaluations, latency, cost, routing, experiments, drift, anomalies, optimization, forecast, alerts] = await Promise.all([
    repo.fetchAIInvocations({ since: since24h, limit: 1000 }),
    repo.fetchQualityEvaluations({ since: since7d, limit: 100 }),
    generateLatencyReport().catch(() => null),
    generateCostReport().catch(() => null),
    generateRoutingReport().catch(() => null),
    generateExperimentReport().catch(() => null),
    generateDriftReport().catch(() => null),
    generateAnomalyReport().catch(() => null),
    generateOptimizationReport().catch(() => null),
    generateForecastReport().catch(() => null),
    listAlerts(50).catch(() => []),
  ]);
  const totalRequests = invocations.length;
  const successRate = totalRequests > 0 ? invocations.filter(i => i.status === "succeeded").length / totalRequests : 0;
  const avgLatencyMs = latency?.overall.avgMs ?? 0;
  const totalCostUsd = cost?.today ?? 0;
  const totalTokens = invocations.reduce((s, i) => s + i.tokensIn + i.tokensOut, 0);
  // Provider distribution
  const providerCounts = new Map<string, number>();
  for (const i of invocations) providerCounts.set(i.provider, (providerCounts.get(i.provider) ?? 0) + 1);
  const providers = Array.from(providerCounts.entries()).map(([provider, count]) => ({
    provider, requestCount: count, percent: totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0,
  })).sort((a, b) => b.requestCount - a.requestCount);
  // Model distribution
  const modelCounts = new Map<string, number>();
  for (const i of invocations) modelCounts.set(i.model, (modelCounts.get(i.model) ?? 0) + 1);
  const models = Array.from(modelCounts.entries()).map(([model, count]) => ({
    model, requestCount: count, percent: totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0,
  })).sort((a, b) => b.requestCount - a.requestCount);
  // Experiments
  const experimentsSummary = {
    running: experiments?.runningCount ?? 0,
    completed: experiments?.completedCount ?? 0,
    total: experiments?.totalExperiments ?? 0,
  };
  // Alerts
  const alertsList = alerts.map(a => ({ severity: repo.safeParse(a.severity, "info") as string }));
  const alertSummary = {
    critical: alertsList.filter(a => a.severity === "critical").length,
    warning: alertsList.filter(a => a.severity === "warning").length,
    info: alertsList.filter(a => a.severity === "info").length,
    resolved: alertsList.filter(a => a.severity === "resolved").length,
  };
  // Drift count
  const driftCount = drift?.totalDrifts ?? 0;
  // Forecast summary
  const forecastSummary = (forecast?.forecasts ?? []).slice(0, 5).map(f => ({
    metric: f.metric, trend: f.trend, risk: f.risk,
  }));
  // Optimization opportunities
  const optimizationOpportunities = optimization?.totalCount ?? 0;
  // Quality trend
  const qualityTrend = evaluations.slice(0, 30).reverse().map(e => ({
    date: e.createdAt.toISOString().slice(0, 10),
    score: e.overallScore,
  }));
  // Cache hit rate (approximate from trace spans)
  const cacheHitRate = 0; // would need trace span analysis
  // Routing distribution
  const routingDistribution = (routing?.providerDistribution ?? []).slice(0, 5).map(p => ({
    provider: p.provider, percent: p.selectionPercent,
  }));
  log.info("dashboard.generated", { totalRequests, successRate, driftCount, alerts: alertSummary.critical });
  return {
    generatedAt: new Date().toISOString(),
    totalRequests,
    successRate: Math.round(successRate * 100) / 100,
    avgLatencyMs,
    totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
    totalTokens,
    providers,
    models,
    experiments: experimentsSummary,
    alerts: alertSummary,
    driftCount,
    forecasts: forecastSummary,
    optimizationOpportunities,
    qualityTrend,
    cacheHitRate,
    routingDistribution,
  };
}
