/**
 * EduBek — API Performance Analyzer (System 4).
 *
 * Measures response time, serialization time, validation time, database
 * time, AI time, and network time per endpoint. Produces endpoint
 * rankings.
 *
 * REUSES the in-memory endpoint samples from the performance profiler.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { ApiPerformanceReport, EndpointRanking, TimeBreakdown, OptimizationRecommendation } from "./types";

const log = getLogger("api-analyzer");

export async function generateApiReport(): Promise<ApiPerformanceReport> {
  const generatedAt = new Date().toISOString();
  const samples = repo.listEndpointSamples();
  const rankings = rankEndpoints(samples);
  const averageBreakdown = computeAverageBreakdown(samples);
  const recommendations = generateApiRecommendations(rankings);
  log.info("api.audit_complete", { endpoints: rankings.length, samples: samples.length });
  return { generatedAt, endpointRankings: rankings, averageBreakdown, recommendations };
}

function rankEndpoints(samples: ReturnType<typeof repo.listEndpointSamples>): EndpointRanking[] {
  const grouped = new Map<string, typeof samples>();
  for (const s of samples) {
    const key = `${s.method} ${s.route}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }
  const rankings: EndpointRanking[] = [];
  for (const [key, group] of grouped) {
    const [method, ...routeParts] = key.split(" ");
    const route = routeParts.join(" ");
    const totalTimes = group.map(s => s.totalTimeMs);
    const breakdown: TimeBreakdown = {
      validationMs: Math.round(group.reduce((s, x) => s + x.validationMs, 0) / group.length),
      databaseMs: Math.round(group.reduce((s, x) => s + x.databaseMs, 0) / group.length),
      aiMs: Math.round(group.reduce((s, x) => s + x.aiMs, 0) / group.length),
      serializationMs: Math.round(group.reduce((s, x) => s + x.serializationMs, 0) / group.length),
      networkMs: Math.round(group.reduce((s, x) => s + x.networkMs, 0) / group.length),
      totalMs: Math.round(group.reduce((s, x) => s + x.totalTimeMs, 0) / group.length),
    };
    rankings.push({
      route, method, sampleCount: group.length,
      totalTimeMs: breakdown.totalMs, breakdown,
      p50Ms: repo.percentile(totalTimes, 0.5),
      p95Ms: repo.percentile(totalTimes, 0.95),
      p99Ms: repo.percentile(totalTimes, 0.99),
      rank: 0, // assigned after sort
    });
  }
  rankings.sort((a, b) => b.p95Ms - a.p95Ms);
  rankings.forEach((r, i) => { r.rank = i + 1; });
  return rankings;
}

function computeAverageBreakdown(samples: ReturnType<typeof repo.listEndpointSamples>): TimeBreakdown {
  if (samples.length === 0) {
    return { validationMs: 0, databaseMs: 0, aiMs: 0, serializationMs: 0, networkMs: 0, totalMs: 0 };
  }
  return {
    validationMs: Math.round(samples.reduce((s, x) => s + x.validationMs, 0) / samples.length),
    databaseMs: Math.round(samples.reduce((s, x) => s + x.databaseMs, 0) / samples.length),
    aiMs: Math.round(samples.reduce((s, x) => s + x.aiMs, 0) / samples.length),
    serializationMs: Math.round(samples.reduce((s, x) => s + x.serializationMs, 0) / samples.length),
    networkMs: Math.round(samples.reduce((s, x) => s + x.networkMs, 0) / samples.length),
    totalMs: Math.round(samples.reduce((s, x) => s + x.totalTimeMs, 0) / samples.length),
  };
}

function generateApiRecommendations(rankings: EndpointRanking[]): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = [];
  let id = 0;
  const nextId = () => `api-${++id}`;
  if (rankings.length > 0 && rankings[0].p95Ms > 1000) {
    const top = rankings[0];
    recs.push({
      id: nextId(), category: "api",
      title: "Optimize slowest endpoint",
      description: `${top.method} ${top.route} has p95=${top.p95Ms}ms (rank #1).`,
      impact: "high", effort: "medium",
      recommendation: `Focus on the ${identifyBottleneck(top.breakdown)} stage (${identifyBottleneckValue(top.breakdown)}ms average).`,
    });
  }
  const slowEndpoints = rankings.filter(r => r.p95Ms > 500);
  if (slowEndpoints.length > 5) {
    recs.push({
      id: nextId(), category: "api",
      title: "Multiple slow endpoints",
      description: `${slowEndpoints.length} endpoints have p95 > 500ms.`,
      impact: "high", effort: "high",
      recommendation: "Systematic performance review needed. Consider a performance budget per endpoint.",
    });
  }
  return recs;
}

function identifyBottleneck(b: TimeBreakdown): string {
  const entries: Array<[string, number]> = [
    ["validation", b.validationMs],
    ["database", b.databaseMs],
    ["ai", b.aiMs],
    ["serialization", b.serializationMs],
    ["network", b.networkMs],
  ];
  entries.sort((a, x) => x[1] - a[1]);
  return entries[0][0];
}

function identifyBottleneckValue(b: TimeBreakdown): number {
  return Math.max(b.validationMs, b.databaseMs, b.aiMs, b.serializationMs, b.networkMs);
}
