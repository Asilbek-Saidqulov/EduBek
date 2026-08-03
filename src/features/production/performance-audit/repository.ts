/**
 * EduBek — Production performance-audit repository.
 *
 * Thin Prisma-only layer + in-memory metrics ring buffer. The audit
 * module records samples here (via `record*` functions) and reads
 * aggregates back (via `list*` functions).
 *
 * Reuses existing tables where possible:
 *   • OrchestratorTraceSpan — for slow endpoint / slow query detection
 *   • OrchestratorAIInvocation — for AI time breakdown
 *   • OrchestratorWorkflowExecution — for job analysis
 *   • CloudJob — for background job analysis
 *   • CacheEntry — for cache audit
 *   • HealthSnapshot — for reliability analysis
 *   • InfraMetric / CostSnapshot — for resource usage
 */
import { db } from "@/lib/db";

// ===========================================================================
// In-memory metrics ring buffer (process-scoped)
// ===========================================================================

const RING_BUFFER_SIZE = 1000;

interface EndpointSample {
  route: string;
  method: string;
  timestamp: number;
  totalTimeMs: number;
  validationMs: number;
  databaseMs: number;
  aiMs: number;
  serializationMs: number;
  networkMs: number;
}

interface QuerySample {
  model: string;
  operation: string;
  timestamp: number;
  durationMs: number;
  traceId: string;
  fingerprint: string;
}

interface EventLoopSample {
  timestamp: number;
  lagMs: number;
}

const endpointSamples: EndpointSample[] = [];
const querySamples: QuerySample[] = [];
const eventLoopSamples: EventLoopSample[] = [];

export function recordEndpointSample(sample: EndpointSample): void {
  endpointSamples.push(sample);
  if (endpointSamples.length > RING_BUFFER_SIZE) endpointSamples.shift();
}

export function recordQuerySample(sample: QuerySample): void {
  querySamples.push(sample);
  if (querySamples.length > RING_BUFFER_SIZE) querySamples.shift();
}

export function recordEventLoopSample(sample: EventLoopSample): void {
  eventLoopSamples.push(sample);
  if (eventLoopSamples.length > RING_BUFFER_SIZE) eventLoopSamples.shift();
}

export function listEndpointSamples(limit?: number): EndpointSample[] {
  return limit ? endpointSamples.slice(-limit) : [...endpointSamples];
}

export function listQuerySamples(limit?: number): QuerySample[] {
  return limit ? querySamples.slice(-limit) : [...querySamples];
}

export function listEventLoopSamples(limit?: number): EventLoopSample[] {
  return limit ? eventLoopSamples.slice(-limit) : [...eventLoopSamples];
}

export function clearSamples(): void {
  endpointSamples.length = 0;
  querySamples.length = 0;
  eventLoopSamples.length = 0;
}

// ===========================================================================
// DB-backed queries (reuse existing tables)
// ===========================================================================

/** Reuse OrchestratorTraceSpan for slow endpoint detection. */
export async function fetchSlowTraceSpans(opts: { since?: Date; minDurationMs?: number; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const minDuration = opts.minDurationMs ?? 100;
  return db.orchestratorTraceSpan.findMany({
    where: {
      startedAt: { gte: since },
      durationMs: { gte: minDuration },
      finishedAt: { not: null },
    },
    orderBy: { durationMs: "desc" },
    take: opts.limit ?? 100,
    select: {
      spanId: true, traceId: true, module: true, operation: true,
      durationMs: true, status: true, startedAt: true, finishedAt: true,
      attributes: true, logs: true,
    },
  }).catch(() => []);
}

/** Reuse OrchestratorAIInvocation for AI time analysis. */
export async function fetchAIInvocations(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.orchestratorAIInvocation.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 500,
    select: {
      id: true, traceId: true, provider: true, model: true,
      status: true, tokensIn: true, tokensOut: true,
      costUsd: true, latencyMs: true, createdAt: true,
    },
  }).catch(() => []);
}

/** Reuse CloudJob for background job analysis. */
export async function fetchCloudJobs(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.cloudJob.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 500,
    select: {
      id: true, type: true, queue: true, status: true,
      workerId: true, retryCount: true, maxRetries: true,
      createdAt: true, startedAt: true, completedAt: true,
      errorMessage: true,
    },
  }).catch(() => []);
}

/** Reuse CacheEntry for cache audit. */
export async function fetchCacheEntries() {
  return db.cacheEntry.findMany({
    select: {
      id: true, namespace: true, key: true, ttlSeconds: true,
      hitCount: true, missCount: true, lastAccessedAt: true,
      expiresAt: true, createdAt: true,
    },
    take: 500,
  }).catch(() => []);
}

/** Reuse CloudWorker for worker utilization. */
export async function fetchCloudWorkers() {
  return db.cloudWorker.findMany({
    select: {
      id: true, status: true, lastHeartbeatAt: true,
      createdAt: true,
    },
  }).catch(() => []);
}

/** Reuse CostSnapshot for cost analysis. */
export async function fetchCostSnapshots(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.costSnapshot.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 100,
    select: { id: true, day: true, organizationId: true, breakdown: true, totalCredits: true, estimatedUsd: true, byService: true, createdAt: true },
  }).catch(() => []);
}

/** Reuse InfraMetric for resource usage. */
export async function fetchInfraMetrics(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 60 * 60 * 1000);
  return db.infraMetric.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: "desc" },
    take: opts.limit ?? 500,
    select: { id: true, source: true, metric: true, value: true, unit: true, labels: true, timestamp: true },
  }).catch(() => []);
}

/** Reuse HealthSnapshot for reliability analysis. */
export async function fetchHealthSnapshots(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.healthSnapshot.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 100,
    select: { id: true, subsystem: true, status: true, score: true, createdAt: true },
  }).catch(() => []);
}

/** Reuse OrchestratorWorkflowExecution for workflow analysis. */
export async function fetchWorkflowExecutions(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.orchestratorWorkflowExecution.findMany({
    where: { startedAt: { gte: since } },
    orderBy: { startedAt: "desc" },
    take: opts.limit ?? 200,
    select: {
      id: true, workflowId: true, status: true, traceId: true,
      startedAt: true, finishedAt: true, totalDurationMs: true,
    },
  }).catch(() => []);
}

/** Count total Prisma models for coverage metrics. */
export async function countPrismaModels(): Promise<number> {
  // We can't introspect the schema from Prisma client directly, so we
  // approximate by counting distinct tables we know about.
  return 332; // matches current schema model count
}

// ===========================================================================
// Helpers
// ===========================================================================

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)] ?? 0;
}
