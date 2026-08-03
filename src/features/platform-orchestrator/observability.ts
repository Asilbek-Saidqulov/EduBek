/**
 * EduBek — End-to-End Observability.
 *
 * Phase 5D.4: Generate traces spanning the whole platform. Every API
 * request, workflow execution, AI invocation, and background job
 * participates in a single distributed trace identified by a `traceId`.
 *
 * API → Workflow → Knowledge Graph → Planner → Recommendation →
 * Marketplace → AI → Cloud Worker → Notification → Audit → Analytics →
 * Timeline → Response — all under one traceId.
 *
 * This module is intentionally lightweight: spans are persisted to the
 * `OrchestratorTraceSpan` table, and in-process state is kept in a
 * bounded LRU map so we can return recent traces without hitting the DB
 * for every read.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { TraceDto, TraceSpan, ObservabilitySnapshotDto, SpanStatus } from "./types";

const log = getLogger("observability");

// ===========================================================================
// In-process span state (bounded LRU)
// ===========================================================================

const MAX_IN_MEMORY_SPANS = 1000;
const spansByTraceId = new Map<string, TraceSpan[]>();

function rememberSpan(span: TraceSpan): void {
  const arr = spansByTraceId.get(span.traceId) ?? [];
  arr.push(span);
  spansByTraceId.set(span.traceId, arr);
  // Bound the cache
  if (spansByTraceId.size > MAX_IN_MEMORY_SPANS) {
    const firstKey = spansByTraceId.keys().next().value;
    if (firstKey) spansByTraceId.delete(firstKey);
  }
}

// ===========================================================================
// Public API
// ===========================================================================

export interface StartSpanInput {
  traceId?: string;
  parentSpanId?: string | null;
  module: string;
  operation: string;
  attributes?: Record<string, unknown>;
}

export function startSpan(input: StartSpanInput): string {
  const traceId = input.traceId ?? randomUUID();
  const spanId = randomUUID();
  const span: TraceSpan = {
    spanId,
    parentSpanId: input.parentSpanId ?? null,
    traceId,
    module: input.module,
    operation: input.operation,
    status: "ok",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    durationMs: null,
    attributes: input.attributes ?? {},
    logs: [],
  };
  rememberSpan(span);
  // Persist asynchronously — fire-and-forget so the caller doesn't wait
  void repo.createTraceSpan({
    spanId, parentSpanId: span.parentSpanId, traceId,
    module: input.module, operation: input.operation,
    status: "ok", attributes: input.attributes ?? {},
  }).catch(err => log.warn("span.persist_failed", { spanId, error: (err as Error).message }));
  return spanId;
}

export function finishSpan(spanId: string, traceId: string, input: {
  status: SpanStatus; durationMs: number; logs?: TraceSpan["logs"];
}): void {
  const finishedAt = new Date().toISOString();
  const arr = spansByTraceId.get(traceId);
  if (arr) {
    const span = arr.find(s => s.spanId === spanId);
    if (span) {
      span.status = input.status;
      span.finishedAt = finishedAt;
      span.durationMs = input.durationMs;
      span.logs = input.logs ?? [];
    }
  }
  void repo.finishTraceSpan(spanId, traceId, {
    status: input.status, durationMs: input.durationMs, logs: input.logs ?? [],
  }).catch(err => log.warn("span.finish_failed", { spanId, error: (err as Error).message }));
}

export function addSpanLog(traceId: string, spanId: string, level: "info" | "warn" | "error", message: string): void {
  const arr = spansByTraceId.get(traceId);
  if (arr) {
    const span = arr.find(s => s.spanId === spanId);
    if (span) {
      span.logs.push({ ts: new Date().toISOString(), level, message });
    }
  }
}

export function getTraceFromMemory(traceId: string): TraceDto | null {
  const arr = spansByTraceId.get(traceId);
  if (!arr || arr.length === 0) return null;
  return buildTraceDto(traceId, arr);
}

export async function getTrace(traceId: string): Promise<TraceDto | null> {
  const inMemory = getTraceFromMemory(traceId);
  if (inMemory) return inMemory;
  // Fall back to DB
  const rows = await repo.listTraceSpans(traceId);
  if (rows.length === 0) return null;
  const spans: TraceSpan[] = rows.map(r => ({
    spanId: r.spanId, parentSpanId: r.parentSpanId, traceId: r.traceId,
    module: r.module, operation: r.operation, status: r.status as SpanStatus,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
    durationMs: r.durationMs,
    attributes: safeParse(r.attributes, {}),
    logs: safeParse(r.logs, []),
  }));
  return buildTraceDto(traceId, spans);
}

function buildTraceDto(traceId: string, spans: TraceSpan[]): TraceDto {
  const sorted = [...spans].sort((a, b) =>
    new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );
  const root = sorted.find(s => s.parentSpanId === null) ?? sorted[0];
  const startedAt = sorted[0]?.startedAt ?? new Date().toISOString();
  const finishedAt = sorted
    .map(s => s.finishedAt ? new Date(s.finishedAt).getTime() : 0)
    .reduce((max, t) => Math.max(max, t), 0);
  const totalDurationMs = finishedAt > 0 ? finishedAt - new Date(startedAt).getTime() : null;
  const hasErrors = sorted.some(s => s.status === "error" || s.status === "timeout");
  const modules = Array.from(new Set(sorted.map(s => s.module)));
  const status: SpanStatus = hasErrors ? "error" : sorted.every(s => s.status === "ok") ? "ok" : "skipped";
  return {
    traceId,
    rootOperation: root?.operation ?? "unknown",
    spans: sorted,
    totalDurationMs,
    status,
    startedAt,
    finishedAt: finishedAt > 0 ? new Date(finishedAt).toISOString() : null,
    modules,
    spanCount: sorted.length,
    hasErrors,
  };
}

export async function listRecentTraces(limit = 20): Promise<TraceDto[]> {
  const summaries = await repo.listRecentTraces(limit);
  const traces: TraceDto[] = [];
  for (const s of summaries) {
    // Try memory first
    const inMemory = getTraceFromMemory(s.traceId);
    if (inMemory) {
      traces.push(inMemory);
      continue;
    }
    // Build a stub trace from the summary — full span detail only on demand
    traces.push({
      traceId: s.traceId,
      rootOperation: s.rootOp,
      spans: [],
      totalDurationMs: null,
      status: s.hasError ? "error" : "ok",
      startedAt: s.startedAt.toISOString(),
      finishedAt: null,
      modules: Array.from(s.modules),
      spanCount: 0,
      hasErrors: s.hasError,
    });
  }
  return traces;
}

export async function getObservabilitySnapshot(): Promise<ObservabilitySnapshotDto> {
  const since = new Date(Date.now() - 60 * 60 * 1000); // last hour
  const [stats, activeTraces, recentTraces] = await Promise.all([
    repo.getTraceStats(since),
    repo.countActiveTraces(),
    repo.listRecentTraces(10),
  ]);
  const recentTraceDtos: TraceDto[] = [];
  for (const s of recentTraces) {
    const inMemory = getTraceFromMemory(s.traceId);
    if (inMemory) {
      recentTraceDtos.push(inMemory);
    } else {
      recentTraceDtos.push({
        traceId: s.traceId,
        rootOperation: s.rootOp,
        spans: [],
        totalDurationMs: null,
        status: s.hasError ? "error" : "ok",
        startedAt: s.startedAt.toISOString(),
        finishedAt: null,
        modules: Array.from(s.modules),
        spanCount: 0,
        hasErrors: s.hasError,
      });
    }
  }
  return {
    activeTraces,
    recentTraces: recentTraceDtos,
    errorRate: stats.errorRate,
    p50LatencyMs: stats.p50LatencyMs,
    p95LatencyMs: stats.p95LatencyMs,
    p99LatencyMs: stats.p99LatencyMs,
    topErrorModules: stats.topErrorModules,
    slowestModules: stats.slowestModules,
    throughput: stats.throughput,
    generatedAt: new Date().toISOString(),
  };
}

// ===========================================================================
// Helpers
// ===========================================================================

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

/**
 * Wrap an async function with a span. The span is automatically finished
 * (with status ok/error) when the function resolves or rejects.
 */
export async function withSpan<T>(input: StartSpanInput, fn: (spanId: string, traceId: string) => Promise<T>): Promise<T> {
  const spanId = startSpan(input);
  const traceId = input.traceId ?? spansByTraceId.size > 0
    ? (Array.from(spansByTraceId.entries()).find(([, arr]) => arr.some(s => s.spanId === spanId))?.[0] ?? randomUUID())
    : randomUUID();
  const startedAt = Date.now();
  try {
    const result = await fn(spanId, traceId);
    finishSpan(spanId, traceId, { status: "ok", durationMs: Date.now() - startedAt });
    return result;
  } catch (err) {
    finishSpan(spanId, traceId, {
      status: "error",
      durationMs: Date.now() - startedAt,
      logs: [{ ts: new Date().toISOString(), level: "error", message: (err as Error).message }],
    });
    throw err;
  }
}

/**
 * Get or generate a traceId from the incoming request headers. Used by
 * middleware to propagate trace IDs from clients (e.g. `X-Trace-Id`).
 */
export function resolveTraceId(headers: { get(name: string): string | null }): string {
  const incoming = headers.get("x-trace-id") ?? headers.get("X-Trace-Id");
  if (incoming && /^[a-f0-9-]{8,64}$/i.test(incoming)) return incoming;
  return randomUUID();
}
