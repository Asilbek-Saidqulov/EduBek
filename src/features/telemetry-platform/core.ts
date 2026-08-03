/** Systems 1, 2, 3, 4, 5 — Registry, Metrics, Logging, Tracing, Correlation Context. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeService, getService, getAllServices,
  storeMetricDef, getMetricDef, getMetricDefByKey, getAllMetricDefs,
  storeMetricSample, getMetricSamples, storeMetricAggregate, getMetricAggregate,
  appendLog, getAllLogs, getLogsByCorrelation, getLogsByService,
  storeSpan, getSpan, getSpansByTrace,
  storeTrace, getTrace, getAllTraces,
  storeCorrelation, getCorrelation, getAllCorrelations,
} from "./repository";
import type {
  RegisteredService, ServiceCategory, ServiceCriticality,
  MetricDefinition, MetricType, MetricSample, MetricAggregate,
  LogEntry, LogLevel,
  TraceSpan, SpanKind, SpanStatus, Trace,
  CorrelationContext,
} from "./types";
import { publishTelemetryEvent } from "./event-bus-bridge";

const logger = getLogger("telemetry.core");

// ===== System 1 — Telemetry Registry =====

export function registerService(input: {
  name: string;
  category: ServiceCategory;
  criticality?: ServiceCriticality;
  version: string;
  owner?: string | null;
  endpoint?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}): RegisteredService {
  const now = new Date().toISOString();
  const service: RegisteredService = {
    id: randomUUID(), name: input.name,
    category: input.category,
    criticality: input.criticality ?? "medium",
    version: input.version,
    owner: input.owner ?? null,
    endpoint: input.endpoint ?? null,
    tags: input.tags ?? [],
    registeredAt: now, lastSeenAt: null,
    active: true,
    metadata: input.metadata ?? {},
  };
  storeService(service);
  logger.info("service.registered", { id: service.id, name: service.name });
  return service;
}

export function getServiceById(id: string): RegisteredService | null { return getService(id); }
export function listServices(category?: ServiceCategory, active?: boolean): RegisteredService[] {
  let all = getAllServices();
  if (category) all = all.filter(s => s.category === category);
  if (active !== undefined) all = all.filter(s => s.active === active);
  return all;
}

export function touchService(id: string): RegisteredService | null {
  const s = getService(id);
  if (!s) return null;
  s.lastSeenAt = new Date().toISOString();
  storeService(s);
  return s;
}

export function deactivateService(id: string): RegisteredService | null {
  const s = getService(id);
  if (!s) return null;
  s.active = false;
  storeService(s);
  return s;
}

export function supportsAllServiceCategories(): ServiceCategory[] {
  return ["core", "data", "compute", "communication", "integration", "analytics", "ai", "edge", "external", "platform"];
}
export function supportsAllServiceCriticalities(): ServiceCriticality[] {
  return ["critical", "high", "medium", "low"];
}

// ===== System 2 — Metrics Platform =====

export function defineMetric(input: {
  key: string; name: string;
  type: MetricType;
  unit?: string | null;
  description?: string;
  labels?: string[];
  namespace?: string;
  metadata?: Record<string, unknown>;
}): MetricDefinition {
  if (getMetricDefByKey(input.key)) throw new Error(`Metric key already exists: ${input.key}`);
  const def: MetricDefinition = {
    id: randomUUID(), key: input.key, name: input.name,
    type: input.type,
    unit: input.unit ?? null,
    description: input.description ?? "",
    labels: input.labels ?? [],
    namespace: input.namespace ?? "default",
    active: true,
    createdAt: new Date().toISOString(),
    metadata: input.metadata ?? {},
  };
  storeMetricDef(def);
  logger.info("metric.defined", { id: def.id, key: def.key, type: def.type });
  return def;
}

export function getMetricDefinition(id: string): MetricDefinition | null { return getMetricDef(id); }
export function getMetricDefinitionByKey(key: string): MetricDefinition | null { return getMetricDefByKey(key); }
export function listMetrics(type?: MetricType, active?: boolean): MetricDefinition[] {
  let all = getAllMetricDefs();
  if (type) all = all.filter(m => m.type === type);
  if (active !== undefined) all = all.filter(m => m.active === active);
  return all;
}

export function recordMetric(input: {
  metricKey: string;
  value: number;
  labels?: Record<string, string>;
  correlationId?: string | null;
}): MetricSample {
  const def = getMetricDefByKey(input.metricKey);
  if (!def) throw new Error(`Metric not defined: ${input.metricKey}`);
  if (!def.active) throw new Error(`Metric not active: ${input.metricKey}`);
  const sample: MetricSample = {
    id: randomUUID(), metricKey: input.metricKey,
    value: input.value,
    labels: input.labels ?? {},
    timestamp: new Date().toISOString(),
    correlationId: input.correlationId ?? null,
  };
  storeMetricSample(sample);
  updateAggregate(input.metricKey, sample);
  return sample;
}

function updateAggregate(metricKey: string, sample: MetricSample): void {
  const samples = getMetricSamples(metricKey);
  const values = samples.map(s => s.value).sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((s, v) => s + v, 0);
  const min = count > 0 ? values[0] : 0;
  const max = count > 0 ? values[count - 1] : 0;
  const avg = count > 0 ? sum / count : 0;
  const pct = (p: number) => count > 0 ? values[Math.min(values.length - 1, Math.floor(values.length * p))] : null;
  const existing = getMetricAggregate(metricKey);
  const agg: MetricAggregate = {
    metricKey,
    count, sum, min, max, avg,
    p50: pct(0.5), p95: pct(0.95), p99: pct(0.99),
    lastValue: sample.value,
    firstSeenAt: existing?.firstSeenAt ?? sample.timestamp,
    lastSeenAt: sample.timestamp,
  };
  storeMetricAggregate(agg);
}

export function getMetricAggregateForKey(metricKey: string): MetricAggregate | null {
  return getMetricAggregate(metricKey);
}

export function incrementCounter(metricKey: string, amount = 1, labels?: Record<string, string>, correlationId?: string | null): MetricSample {
  return recordMetric({ metricKey, value: amount, labels, correlationId });
}

export function setGauge(metricKey: string, value: number, labels?: Record<string, string>, correlationId?: string | null): MetricSample {
  return recordMetric({ metricKey, value, labels, correlationId });
}

export function recordTimer(metricKey: string, durationMs: number, labels?: Record<string, string>, correlationId?: string | null): MetricSample {
  return recordMetric({ metricKey, value: durationMs, labels, correlationId });
}

export function supportsAllMetricTypes(): MetricType[] {
  return ["counter", "gauge", "histogram", "timer", "percentile", "summary"];
}

// ===== System 3 — Structured Logging =====

export function log(input: {
  level: LogLevel;
  message: string;
  serviceId?: string | null;
  correlationId?: string | null;
  traceId?: string | null;
  spanId?: string | null;
  requestId?: string | null;
  userId?: string | null;
  context?: Record<string, unknown>;
  exception?: { type: string; message: string; stack: string | null } | null;
}): LogEntry {
  const entry: LogEntry = {
    id: randomUUID(),
    level: input.level,
    message: input.message,
    serviceId: input.serviceId ?? null,
    timestamp: new Date().toISOString(),
    correlationId: input.correlationId ?? null,
    traceId: input.traceId ?? null,
    spanId: input.spanId ?? null,
    requestId: input.requestId ?? null,
    userId: input.userId ?? null,
    context: input.context ?? {},
    exception: input.exception ?? null,
    immutable: true,
  };
  appendLog(entry);
  return entry;
}

export function logTrace(message: string, opts: { serviceId?: string | null; correlationId?: string | null; context?: Record<string, unknown> } = {}): LogEntry {
  return log({ level: "trace", message, ...opts });
}
export function logDebug(message: string, opts: { serviceId?: string | null; correlationId?: string | null; context?: Record<string, unknown> } = {}): LogEntry {
  return log({ level: "debug", message, ...opts });
}
export function logInfo(message: string, opts: { serviceId?: string | null; correlationId?: string | null; context?: Record<string, unknown> } = {}): LogEntry {
  return log({ level: "info", message, ...opts });
}
export function logWarn(message: string, opts: { serviceId?: string | null; correlationId?: string | null; context?: Record<string, unknown> } = {}): LogEntry {
  return log({ level: "warn", message, ...opts });
}
export function logError(message: string, opts: { serviceId?: string | null; correlationId?: string | null; context?: Record<string, unknown>; exception?: { type: string; message: string; stack: string | null } | null } = {}): LogEntry {
  return log({ level: "error", message, ...opts });
}
export function logFatal(message: string, opts: { serviceId?: string | null; correlationId?: string | null; context?: Record<string, unknown>; exception?: { type: string; message: string; stack: string | null } | null } = {}): LogEntry {
  return log({ level: "fatal", message, ...opts });
}

export function listLogs(level?: LogLevel, serviceId?: string, limit = 100): LogEntry[] {
  let all = getAllLogs();
  if (level) all = all.filter(l => l.level === level);
  if (serviceId) all = all.filter(l => l.serviceId === serviceId);
  return all.slice(-limit).reverse();
}

export function getLogsForCorrelation(correlationId: string): LogEntry[] {
  return getLogsByCorrelation(correlationId);
}

export function getLogsForService(serviceId: string, limit = 100): LogEntry[] {
  return getLogsByService(serviceId).slice(-limit).reverse();
}

export function supportsAllLogLevels(): LogLevel[] {
  return ["trace", "debug", "info", "warn", "error", "fatal"];
}

// ===== System 4 — Distributed Tracing =====

export function startTrace(input: {
  correlationId?: string | null;
  rootSpanName?: string;
  serviceId?: string;
}): { trace: Trace; rootSpan: TraceSpan } {
  const traceId = randomUUID();
  const correlationId = input.correlationId ?? randomUUID();
  const now = new Date().toISOString();
  const rootSpanId = randomUUID();
  const rootSpan: TraceSpan = {
    id: rootSpanId, traceId, parentId: null,
    name: input.rootSpanName ?? "root",
    serviceId: input.serviceId ?? "gateway",
    kind: "internal",
    status: "unset",
    startedAt: now, endedAt: null,
    durationMs: null,
    attributes: {},
    events: [],
    correlationId,
  };
  const trace: Trace = {
    id: traceId, rootSpanId,
    status: "unset",
    startedAt: now, endedAt: null,
    durationMs: null,
    spans: [rootSpan],
    correlationId,
  };
  storeSpan(rootSpan);
  storeTrace(trace);
  return { trace, rootSpan };
}

export function startSpan(input: {
  traceId: string;
  parentId?: string | null;
  name: string;
  serviceId: string;
  kind?: SpanKind;
  correlationId?: string | null;
}): TraceSpan {
  const span: TraceSpan = {
    id: randomUUID(), traceId: input.traceId,
    parentId: input.parentId ?? null,
    name: input.name,
    serviceId: input.serviceId,
    kind: input.kind ?? "internal",
    status: "unset",
    startedAt: new Date().toISOString(), endedAt: null,
    durationMs: null,
    attributes: {},
    events: [],
    correlationId: input.correlationId ?? null,
  };
  storeSpan(span);
  // Add to trace
  const trace = getTrace(input.traceId);
  if (trace) {
    trace.spans.push(span);
    storeTrace(trace);
  }
  return span;
}

export function finishSpan(spanId: string, status: SpanStatus = "ok"): TraceSpan | null {
  const span = getSpan(spanId);
  if (!span) return null;
  if (span.endedAt) return null; // already finished
  const now = new Date().toISOString();
  span.endedAt = now;
  span.durationMs = new Date(now).getTime() - new Date(span.startedAt).getTime();
  span.status = status;
  storeSpan(span);
  // Update trace if root span finished
  const trace = getTrace(span.traceId);
  if (trace && trace.rootSpanId === span.id) {
    trace.endedAt = now;
    trace.durationMs = span.durationMs;
    trace.status = status;
    storeTrace(trace);
    publishTelemetryEvent("TraceCompleted", null, {
      traceId: trace.id, durationMs: trace.durationMs, status,
      correlationId: trace.correlationId,
    });
  }
  return span;
}

export function addSpanAttribute(spanId: string, key: string, value: unknown): TraceSpan | null {
  const span = getSpan(spanId);
  if (!span) return null;
  span.attributes[key] = value;
  storeSpan(span);
  return span;
}

export function addSpanEvent(spanId: string, name: string, attributes: Record<string, unknown> = {}): TraceSpan | null {
  const span = getSpan(spanId);
  if (!span) return null;
  span.events.push({ name, timestamp: new Date().toISOString(), attributes });
  storeSpan(span);
  return span;
}

export function getTraceById(id: string): Trace | null { return getTrace(id); }
export function listTraces(limit = 50): Trace[] {
  return getAllTraces().slice(-limit).reverse();
}

export function getTraceSpans(traceId: string): TraceSpan[] {
  return getSpansByTrace(traceId);
}

export function supportsAllSpanKinds(): SpanKind[] {
  return ["internal", "server", "client", "producer", "consumer"];
}
export function supportsAllSpanStatuses(): SpanStatus[] {
  return ["unset", "ok", "error"];
}

// ===== System 5 — Correlation Context =====

export function createCorrelationContext(input: {
  correlationId?: string | null;
  traceId?: string | null;
  spanId?: string | null;
  requestId?: string | null;
  userId?: string | null;
  serviceId?: string | null;
  parentCorrelationId?: string | null;
  metadata?: Record<string, unknown>;
}): CorrelationContext {
  const ctx: CorrelationContext = {
    correlationId: input.correlationId ?? randomUUID(),
    traceId: input.traceId ?? null,
    spanId: input.spanId ?? null,
    requestId: input.requestId ?? null,
    userId: input.userId ?? null,
    serviceId: input.serviceId ?? null,
    parentCorrelationId: input.parentCorrelationId ?? null,
    startedAt: new Date().toISOString(),
    metadata: input.metadata ?? {},
  };
  storeCorrelation(ctx);
  return ctx;
}

export function getCorrelationContext(id: string): CorrelationContext | null {
  return getCorrelation(id);
}

export function listCorrelations(limit = 100): CorrelationContext[] {
  return getAllCorrelations().slice(-limit).reverse();
}

export function deriveCorrelation(parentId: string, opts: { serviceId?: string | null; userId?: string | null } = {}): CorrelationContext {
  const parent = getCorrelation(parentId);
  if (!parent) throw new Error(`Parent correlation not found: ${parentId}`);
  return createCorrelationContext({
    correlationId: randomUUID(),
    traceId: parent.traceId,
    spanId: parent.spanId,
    requestId: parent.requestId,
    userId: opts.userId ?? parent.userId,
    serviceId: opts.serviceId ?? parent.serviceId,
    parentCorrelationId: parentId,
    metadata: { ...parent.metadata },
  });
}
