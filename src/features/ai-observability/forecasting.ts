/**
 * EduBek — Forecasting (System 10).
 * Forecasts AI traffic, token usage, cost, latency, provider saturation,
 * cache growth, GPU demand, worker demand. Includes confidence, trend,
 * seasonality, risk.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { ForecastReport } from "./types";

const log = getLogger("forecasting");

export async function generateForecastReport(): Promise<ForecastReport> {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [invocations7d, invocations30d, agg30d] = await Promise.all([
    repo.fetchAIInvocations({ since: since7d, limit: 1000 }),
    repo.fetchAIInvocations({ since: since30d, limit: 2000 }),
    repo.aggregateAICost({ since: since30d }),
  ]);
  const dailyAvg7d = invocations7d.length / 7;
  const dailyAvg30d = invocations30d.length / 30;
  const trend: "increasing" | "stable" | "decreasing" =
    dailyAvg7d > dailyAvg30d * 1.1 ? "increasing"
    : dailyAvg7d < dailyAvg30d * 0.9 ? "decreasing"
    : "stable";
  // Traffic forecast — project 7-day average to 30 days
  const trafficForecast = Math.round(dailyAvg7d * 30);
  // Token forecast — based on average tokens per call
  const avgTokens = invocations7d.length > 0 ? invocations7d.reduce((s, i) => s + i.tokensIn + i.tokensOut, 0) / invocations7d.length : 0;
  const tokenForecast = Math.round(avgTokens * trafficForecast);
  // Cost forecast — based on average cost per call
  const avgCost = invocations7d.length > 0 ? invocations7d.reduce((s, i) => s + i.costUsd, 0) / invocations7d.length : 0;
  const costForecast = Math.round(avgCost * trafficForecast * 100) / 100;
  // Latency forecast — based on trend
  const avgLatency = invocations7d.length > 0 ? invocations7d.reduce((s, i) => s + i.latencyMs, 0) / invocations7d.length : 0;
  const latencyForecast = trend === "increasing" ? Math.round(avgLatency * 1.1) : Math.round(avgLatency);
  // Provider saturation — if traffic is increasing, providers may saturate
  const providerSaturation = trend === "increasing" ? Math.min(100, trafficForecast / 100) : 50;
  // Cache growth — proportional to traffic
  const cacheGrowth = Math.round(trafficForecast * 0.3);
  // GPU demand — proportional to token usage
  const gpuDemand = Math.round(tokenForecast / 100000);
  // Worker demand — proportional to traffic
  const workerDemand = Math.max(1, Math.round(trafficForecast / 100));
  const forecasts = [
    { metric: "ai_traffic", currentValue: Math.round(dailyAvg7d), forecastedValue: trafficForecast, unit: "requests/day", confidence: 0.8, trend, seasonality: "daily" as const, risk: trafficForecast > 10000 ? "high" as const : "low" as const, dataPoints: buildDataPoints(invocations7d, "count") },
    { metric: "token_usage", currentValue: Math.round(avgTokens), forecastedValue: tokenForecast, unit: "tokens", confidence: 0.75, trend, seasonality: "daily" as const, risk: tokenForecast > 5000000 ? "high" as const : "medium" as const, dataPoints: buildDataPoints(invocations7d, "tokens") },
    { metric: "cost", currentValue: Math.round(avgCost * 10000) / 10000, forecastedValue: costForecast, unit: "USD", confidence: 0.7, trend, seasonality: "monthly" as const, risk: costForecast > 100 ? "high" as const : "low" as const, dataPoints: buildDataPoints(invocations7d, "cost") },
    { metric: "latency", currentValue: Math.round(avgLatency), forecastedValue: latencyForecast, unit: "ms", confidence: 0.65, trend, seasonality: "none" as const, risk: latencyForecast > 3000 ? "high" as const : "low" as const, dataPoints: buildDataPoints(invocations7d, "latency") },
    { metric: "provider_saturation", currentValue: 50, forecastedValue: providerSaturation, unit: "percent", confidence: 0.6, trend, seasonality: "none" as const, risk: providerSaturation > 80 ? "high" as const : "medium" as const, dataPoints: [] },
    { metric: "cache_growth", currentValue: cacheGrowth, forecastedValue: Math.round(cacheGrowth * 1.2), unit: "entries", confidence: 0.65, trend, seasonality: "weekly" as const, risk: "low" as const, dataPoints: [] },
    { metric: "gpu_demand", currentValue: gpuDemand, forecastedValue: Math.round(gpuDemand * 1.1), unit: "gpu-hours", confidence: 0.5, trend, seasonality: "none" as const, risk: gpuDemand > 100 ? "medium" as const : "low" as const, dataPoints: [] },
    { metric: "worker_demand", currentValue: workerDemand, forecastedValue: Math.round(workerDemand * 1.1), unit: "workers", confidence: 0.6, trend, seasonality: "daily" as const, risk: workerDemand > 10 ? "medium" as const : "low" as const, dataPoints: [] },
  ];
  log.info("forecast.report_complete", { forecasts: forecasts.length, trend });
  return {
    generatedAt: new Date().toISOString(),
    forecasts,
  };
}

function buildDataPoints(invocations: Array<{ createdAt: Date; latencyMs: number; costUsd: number; tokensIn: number; tokensOut: number }>, metric: string): Array<{ date: string; value: number }> {
  const byDate = new Map<string, { total: number; count: number }>();
  for (const inv of invocations) {
    const date = inv.createdAt.toISOString().slice(0, 10);
    const entry = byDate.get(date) ?? { total: 0, count: 0 };
    if (metric === "count") { entry.total += 1; entry.count = 1; }
    else if (metric === "tokens") { entry.total += inv.tokensIn + inv.tokensOut; entry.count = 1; }
    else if (metric === "cost") { entry.total += inv.costUsd; entry.count = 1; }
    else if (metric === "latency") { entry.total += inv.latencyMs; entry.count = 1; }
    byDate.set(date, entry);
  }
  return Array.from(byDate.entries())
    .map(([date, data]) => ({ date, value: Math.round(data.total * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
