/**
 * EduBek — Performance Profiler (System 1).
 *
 * Performance audit: slow endpoints, slow Prisma queries, repeated
 * queries, memory allocation, CPU hotspots, async bottlenecks, event
 * loop lag, and queue latency. Produces recommendations — never
 * automatically changes code.
 *
 * REUSES:
 *   • Platform Orchestrator's OrchestratorTraceSpan table (for slow spans)
 *   • Platform Orchestrator's observability layer (for trace data)
 *   • Cloud Infrastructure's CloudJob table (for queue latency)
 *   • In-memory ring buffer (for endpoint + query samples)
 */
import { performance } from "node:perf_hooks";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  PerformanceAuditReport, SlowEndpoint, SlowQuery, RepeatedQuery,
  MemoryHotspot, CpuHotspot, AsyncBottleneck, EventLoopLagSample,
  QueueLatencySample, OptimizationRecommendation,
} from "./types";

const log = getLogger("performance-profiler");

// ===========================================================================
// Public API — audit report generation
// ===========================================================================

export async function generatePerformanceAudit(): Promise<PerformanceAuditReport> {
  const generatedAt = new Date().toISOString();
  log.info("performance.audit_start");

  const [slowEndpoints, slowQueries, repeatedQueries, memoryHotspots,
    cpuHotspots, asyncBottlenecks, eventLoopLag, queueLatency] = await Promise.all([
    detectSlowEndpoints(),
    detectSlowQueries(),
    detectRepeatedQueries(),
    detectMemoryHotspots(),
    detectCpuHotspots(),
    detectAsyncBottlenecks(),
    detectEventLoopLag(),
    detectQueueLatency(),
  ]);

  const recommendations = generateRecommendations({
    slowEndpoints, slowQueries, repeatedQueries, asyncBottlenecks, eventLoopLag,
  });

  log.info("performance.audit_complete", {
    slowEndpoints: slowEndpoints.length, slowQueries: slowQueries.length,
    repeatedQueries: repeatedQueries.length, recommendations: recommendations.length,
  });

  return {
    generatedAt,
    slowEndpoints, slowQueries, repeatedQueries,
    memoryHotspots, cpuHotspots, asyncBottlenecks,
    eventLoopLag, queueLatency,
    recommendations,
  };
}

// ===========================================================================
// Detectors
// ===========================================================================

async function detectSlowEndpoints(): Promise<SlowEndpoint[]> {
  // Group in-memory endpoint samples by route+method, compute percentiles
  const samples = repo.listEndpointSamples();
  if (samples.length === 0) return [];
  const grouped = new Map<string, typeof samples>();
  for (const s of samples) {
    const key = `${s.method} ${s.route}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }
  const slow: SlowEndpoint[] = [];
  for (const [key, group] of grouped) {
    const [method, ...routeParts] = key.split(" ");
    const route = routeParts.join(" ");
    const totalTimes = group.map(s => s.totalTimeMs);
    const p50 = repo.percentile(totalTimes, 0.5);
    const p95 = repo.percentile(totalTimes, 0.95);
    const p99 = repo.percentile(totalTimes, 0.99);
    if (p95 >= 500) {
      // Identify bottleneck stage
      const avgDb = group.reduce((s, x) => s + x.databaseMs, 0) / group.length;
      const avgAi = group.reduce((s, x) => s + x.aiMs, 0) / group.length;
      const avgSer = group.reduce((s, x) => s + x.serializationMs, 0) / group.length;
      const avgVal = group.reduce((s, x) => s + x.validationMs, 0) / group.length;
      const max = Math.max(avgDb, avgAi, avgSer, avgVal);
      const bottleneck: SlowEndpoint["bottleneck"] =
        max === avgDb ? "database" :
        max === avgAi ? "ai" :
        max === avgSer ? "serialization" :
        max === avgVal ? "validation" : "unknown";
      slow.push({
        route, method, p50Ms: p50, p95Ms: p95, p99Ms: p99,
        sampleCount: group.length, bottleneck,
        recommendation: getEndpointRecommendation(bottleneck, p95),
      });
    }
  }
  return slow.sort((a, b) => b.p95Ms - a.p95Ms).slice(0, 20);
}

async function detectSlowQueries(): Promise<SlowQuery[]> {
  const samples = repo.listQuerySamples();
  if (samples.length === 0) return [];
  const grouped = new Map<string, typeof samples>();
  for (const s of samples) {
    const key = `${s.model}:${s.operation}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }
  const slow: SlowQuery[] = [];
  for (const [key, group] of grouped) {
    const [model, operation] = key.split(":");
    const durations = group.map(s => s.durationMs);
    const p95 = repo.percentile(durations, 0.95);
    if (p95 >= 100) {
      slow.push({
        model, operation, p95Ms: p95, sampleCount: group.length,
        fingerprint: group[0]?.fingerprint ?? "",
        recommendation: `Consider adding an index on the filtered columns of ${model}, or batching the ${operation} operation.`,
      });
    }
  }
  return slow.sort((a, b) => b.p95Ms - a.p95Ms).slice(0, 20);
}

async function detectRepeatedQueries(): Promise<RepeatedQuery[]> {
  // Detect queries that appear 5+ times with the same fingerprint in a single trace
  const samples = repo.listQuerySamples();
  if (samples.length === 0) return [];
  const byTrace = new Map<string, Map<string, number>>();
  for (const s of samples) {
    if (!byTrace.has(s.traceId)) byTrace.set(s.traceId, new Map());
    const inner = byTrace.get(s.traceId)!;
    inner.set(s.fingerprint, (inner.get(s.fingerprint) ?? 0) + 1);
  }
  const repeated: RepeatedQuery[] = [];
  for (const [traceId, fingerprints] of byTrace) {
    for (const [fingerprint, count] of fingerprints) {
      if (count >= 5) {
        const sample = samples.find(s => s.fingerprint === fingerprint && s.traceId === traceId);
        repeated.push({
          model: sample?.model ?? "unknown",
          operation: sample?.operation ?? "unknown",
          count, traceId,
          recommendation: `Detected ${count} repeated queries with the same fingerprint in trace ${traceId}. Consider using a DataLoader pattern or caching the result.`,
        });
      }
    }
  }
  return repeated.sort((a, b) => b.count - a.count).slice(0, 20);
}

async function detectMemoryHotspots(): Promise<MemoryHotspot[]> {
  // Node.js doesn't expose per-allocation tracking without --inspect.
  // We approximate by checking process.memoryUsage() and reporting the heap.
  const mem = process.memoryUsage();
  return [{
    module: "process",
    allocationBytes: mem.heapUsed,
    location: "process.memoryUsage().heapUsed",
    recommendation: mem.heapUsed > 500 * 1024 * 1024
      ? "Heap usage exceeds 500MB — investigate memory leaks or consider increasing Node.js heap size."
      : "Heap usage is within normal range.",
  }];
}

async function detectCpuHotspots(): Promise<CpuHotspot[]> {
  // We can't profile CPU without a profiler session. We approximate by
  // reporting the event loop utilization if available.
  const hotspots: CpuHotspot[] = [];
  try {
    const elu = performance.eventLoopUtilization();
    hotspots.push({
      module: "event_loop",
      cpuMs: Math.round(elu.active * 1000),
      location: "performance.eventLoopUtilization().active",
      recommendation: elu.active > 0.8
        ? "Event loop utilization is high (>80%) — consider offloading CPU-intensive work to worker threads."
        : "Event loop utilization is within normal range.",
    });
  } catch {
    // performance.eventLoopUtilization may not be available in all environments
  }
  return hotspots;
}

async function detectAsyncBottlenecks(): Promise<AsyncBottleneck[]> {
  // Reuse trace spans to find deep await chains
  const spans = await repo.fetchSlowTraceSpans({ minDurationMs: 200, limit: 50 });
  if (spans.length === 0) return [];
  // Group by traceId to find chains
  type SpanRow = typeof spans[number];
  const byTrace = new Map<string, SpanRow[]>();
  for (const s of spans) {
    if (!byTrace.has(s.traceId)) byTrace.set(s.traceId, []);
    byTrace.get(s.traceId)!.push(s);
  }
  const bottlenecks: AsyncBottleneck[] = [];
  for (const [traceId, traceSpans] of byTrace) {
    if (traceSpans.length < 3) continue;
    const totalMs = traceSpans.reduce((s, x) => s + (x.durationMs ?? 0), 0);
    bottlenecks.push({
      module: traceSpans[0].module,
      operation: traceSpans[0].operation,
      awaitDepth: traceSpans.length,
      totalAwaitMs: totalMs,
      recommendation: `Trace ${traceId} has ${traceSpans.length} sequential spans totaling ${totalMs}ms. Consider parallelizing independent operations with Promise.all().`,
    });
  }
  return bottlenecks.sort((a, b) => b.totalAwaitMs - a.totalAwaitMs).slice(0, 10);
}

async function detectEventLoopLag(): Promise<EventLoopLagSample[]> {
  const samples = repo.listEventLoopSamples(50);
  return samples.map(s => ({ timestamp: new Date(s.timestamp).toISOString(), lagMs: s.lagMs }));
}

async function detectQueueLatency(): Promise<QueueLatencySample[]> {
  // Reuse CloudJob to compute queue latency (time from createdAt to startedAt)
  const jobs = await repo.fetchCloudJobs({ limit: 500 });
  if (jobs.length === 0) return [];
  const byQueue = new Map<string, number[]>();
  const depthByQueue = new Map<string, number>();
  for (const j of jobs) {
    if (!j.startedAt || !j.createdAt) continue;
    const latency = new Date(j.startedAt).getTime() - new Date(j.createdAt).getTime();
    if (latency < 0) continue;
    if (!byQueue.has(j.queue)) byQueue.set(j.queue, []);
    byQueue.get(j.queue)!.push(latency);
    // Approximate depth by counting queued jobs
    if (j.status === "queued") {
      depthByQueue.set(j.queue, (depthByQueue.get(j.queue) ?? 0) + 1);
    }
  }
  const result: QueueLatencySample[] = [];
  for (const [queue, latencies] of byQueue) {
    result.push({
      queue,
      avgLatencyMs: Math.round(latencies.reduce((s, x) => s + x, 0) / latencies.length),
      p95LatencyMs: repo.percentile(latencies, 0.95),
      depth: depthByQueue.get(queue) ?? 0,
    });
  }
  return result.sort((a, b) => b.p95LatencyMs - a.p95LatencyMs);
}

// ===========================================================================
// Recommendation generator
// ===========================================================================

function generateRecommendations(input: {
  slowEndpoints: SlowEndpoint[];
  slowQueries: SlowQuery[];
  repeatedQueries: RepeatedQuery[];
  asyncBottlenecks: AsyncBottleneck[];
  eventLoopLag: EventLoopLagSample[];
}): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = [];
  let id = 0;
  const nextId = () => `perf-${++id}`;

  if (input.slowEndpoints.length > 0) {
    const top = input.slowEndpoints[0];
    recs.push({
      id: nextId(), category: "performance",
      title: "Optimize slow endpoints",
      description: `${input.slowEndpoints.length} endpoint(s) have p95 latency > 500ms. Slowest: ${top.method} ${top.route} at ${top.p95Ms}ms.`,
      impact: top.p95Ms > 2000 ? "critical" : "high",
      effort: "medium",
      recommendation: `Focus on the ${top.bottleneck} stage. ${top.recommendation}`,
    });
  }
  if (input.slowQueries.length > 0) {
    recs.push({
      id: nextId(), category: "database",
      title: "Optimize slow Prisma queries",
      description: `${input.slowQueries.length} query pattern(s) have p95 latency > 100ms.`,
      impact: "high", effort: "medium",
      recommendation: "Add indexes to frequently-filtered columns and consider batching large reads.",
    });
  }
  if (input.repeatedQueries.length > 0) {
    recs.push({
      id: nextId(), category: "database",
      title: "Fix N+1 query patterns",
      description: `${input.repeatedQueries.length} repeated query pattern(s) detected.`,
      impact: "high", effort: "low",
      recommendation: "Use Prisma's include/select to fetch relations in a single query, or adopt a DataLoader pattern.",
    });
  }
  if (input.asyncBottlenecks.length > 0) {
    recs.push({
      id: nextId(), category: "performance",
      title: "Parallelize sequential awaits",
      description: `${input.asyncBottlenecks.length} trace(s) have deep sequential await chains.`,
      impact: "medium", effort: "medium",
      recommendation: "Identify independent awaits and wrap them in Promise.all() to reduce total latency.",
    });
  }
  const highLag = input.eventLoopLag.filter(s => s.lagMs > 100);
  if (highLag.length > 0) {
    recs.push({
      id: nextId(), category: "performance",
      title: "Investigate event loop lag",
      description: `${highLag.length} sample(s) show event loop lag > 100ms.`,
      impact: "medium", effort: "high",
      recommendation: "Profile CPU-intensive operations and offload them to worker threads.",
    });
  }
  return recs;
}

function getEndpointRecommendation(bottleneck: SlowEndpoint["bottleneck"], p95: number): string {
  if (bottleneck === "database") return `Database is the bottleneck (p95=${p95}ms). Add indexes, use select() to reduce payload, or cache results.`;
  if (bottleneck === "ai") return `AI inference is the bottleneck (p95=${p95}ms). Consider provider routing, response caching, or streaming.`;
  if (bottleneck === "serialization") return `Serialization is the bottleneck (p95=${p95}ms). Reduce payload size or use a faster serializer.`;
  if (bottleneck === "validation") return `Validation is the bottleneck (p95=${p95}ms). Simplify the Zod schema or move validation to the client.`;
  return `Bottleneck unclear (p95=${p95}ms). Add more granular tracing to identify the slow stage.`;
}

// ===========================================================================
// Recording helpers (called by middleware / instrumentation)
// ===========================================================================

export function recordEndpointTiming(input: {
  route: string; method: string; totalTimeMs: number;
  validationMs?: number; databaseMs?: number; aiMs?: number;
  serializationMs?: number; networkMs?: number;
}): void {
  repo.recordEndpointSample({
    route: input.route, method: input.method,
    totalTimeMs: input.totalTimeMs,
    validationMs: input.validationMs ?? 0,
    databaseMs: input.databaseMs ?? 0,
    aiMs: input.aiMs ?? 0,
    serializationMs: input.serializationMs ?? 0,
    networkMs: input.networkMs ?? 0,
    timestamp: Date.now(),
  });
}

export function recordQueryTiming(input: {
  model: string; operation: string; durationMs: number;
  traceId: string; fingerprint: string;
}): void {
  repo.recordQuerySample({ ...input, timestamp: Date.now() });
}

export function recordEventLoopLag(lagMs: number): void {
  repo.recordEventLoopSample({ lagMs, timestamp: Date.now() });
}
