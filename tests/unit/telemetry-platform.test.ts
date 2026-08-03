/**
 * EduBek — Platform Observability, Telemetry & Diagnostics tests.
 * Phase 6G.19: 500+ deterministic tests covering all 25 systems.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  // Systems 1-5
  registerService, getServiceById, listServices, touchService, deactivateService,
  supportsAllServiceCategories, supportsAllServiceCriticalities,
  defineMetric, getMetricDefinition, getMetricDefinitionByKey, listMetrics,
  recordMetric, getMetricAggregateForKey, incrementCounter, setGauge, recordTimer,
  supportsAllMetricTypes,
  log, logTrace, logDebug, logInfo, logWarn, logError, logFatal,
  listLogs, getLogsForCorrelation, getLogsForService, supportsAllLogLevels,
  startTrace, startSpan, finishSpan, addSpanAttribute, addSpanEvent,
  getTraceById, listTraces, getTraceSpans, supportsAllSpanKinds, supportsAllSpanStatuses,
  createCorrelationContext, getCorrelationContext, listCorrelations, deriveCorrelation,
  // Systems 6-10
  recordHealthCheck, getLatestHealth, listHealthChecks, getPlatformHealth,
  supportsAllHealthStatuses,
  sendHeartbeat, getHeartbeatStatsForService, markHeartbeatMissed,
  registerDependency, getDependencyById, listDependencies,
  updateDependencyStatus, getDependencyGraph,
  supportsAllDependencyTypes, supportsAllDependencyStatuses,
  recordPerformanceSnapshot, listPerformanceSnapshots, getPerformanceStats,
  recordQueueMetric, listQueueMetrics, getQueueSummary, supportsAllQueueTypes,
  // Systems 11-15
  recordPublishedEvent, recordConsumedEvent, recordEventRetry, recordDeadLetter,
  listEventMonitorEntries, generateEventMonitorStats,
  recordFailure, getFailureClusterById, listFailureClusters,
  setRootCause, linkFailureClusters,
  registerError, getErrorById, getErrorByErrorCode, listErrors,
  recordErrorOccurrence, deactivateError,
  supportsAllErrorCategories, supportsAllErrorSeverities,
  createAlertRule, getAlertRuleById, listAlertRules, deactivateAlertRule,
  triggerAlert, getAlertById, listAlerts,
  acknowledgeAlert, resolveAlert, suppressAlert,
  supportsAllAlertConditions, supportsAllAlertSeverities, supportsAllAlertStatuses,
  openIncident, getIncidentById, listIncidents,
  canTransitionIncident, transitionIncident, addIncidentEvent,
  setIncidentRootCause, setIncidentResolution, assignIncidentOwner,
  supportsAllIncidentSeverities, supportsAllIncidentStatuses,
  // Systems 16-20
  recordCapacitySnapshot, listCapacitySnapshots,
  getCapacityUtilization, getPlatformCapacitySummary,
  recordProfileSample, listProfileSamples, getHotPaths, getSlowestMethods,
  takePlatformSnapshot, listPlatformSnapshots, getLatestSnapshot,
  runDiagnosticCheck, runDiagnosticReport, listDiagnosticReports,
  supportsAllDiagnosticCheckTypes, supportsAllDiagnosticCheckStatuses,
  createSLO, getSLOById, listSLOs, updateSLOStatus,
  getSLOStatusForSLO, listSLOStatuses, getSLOSummary, supportsAllSLOTypes,
  // Systems 21-24
  generateDeveloperDiagnosticReport, generateOperationalDashboard,
  registerExportConfig, getExportConfigById, listExportConfigs,
  markExported, setExportEnabled, exportMetrics, supportsAllExportFormats,
  generateTelemetryDocumentation, generateMarkdownDocumentation, getTelemetryVersion,
  getDeveloperIntegration, getTelemetryStatus,
  // System 25
  subscribeTelemetry, unsubscribeTelemetry, isTelemetrySubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishTelemetryEvent, _resetBridgeForTesting,
  // Reset
  _resetRepositoryForTesting,
} from "@/features/telemetry-platform";

beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); });

const futureIso = (s: number) => new Date(Date.now() + s * 1000).toISOString();
const pastIso = (s: number) => new Date(Date.now() - s * 1000).toISOString();

// ===========================================================================
// System 1 — Telemetry Registry
// ===========================================================================
describe("Telemetry — Registry (System 1)", () => {
  it("registers service", () => {
    const s = registerService({ name: "api-gateway", category: "core", version: "1.0.0" });
    expect(s.id).toBeDefined();
    expect(s.active).toBe(true);
  });
  it("registers with criticality", () => {
    const s = registerService({ name: "db", category: "data", criticality: "critical", version: "1.0.0" });
    expect(s.criticality).toBe("critical");
  });
  it("registers with tags", () => {
    const s = registerService({ name: "svc", category: "core", version: "1.0.0", tags: ["api", "v1"] });
    expect(s.tags.length).toBe(2);
  });
  it("gets service by id", () => {
    const s = registerService({ name: "svc", category: "core", version: "1.0.0" });
    expect(getServiceById(s.id)).not.toBeNull();
    expect(getServiceById("missing")).toBeNull();
  });
  it("lists services", () => {
    registerService({ name: "a", category: "core", version: "1.0.0" });
    registerService({ name: "b", category: "data", version: "1.0.0" });
    expect(listServices().length).toBe(2);
  });
  it("lists by category", () => {
    registerService({ name: "a", category: "core", version: "1.0.0" });
    registerService({ name: "b", category: "data", version: "1.0.0" });
    expect(listServices("core").length).toBe(1);
  });
  it("lists active only", () => {
    const s = registerService({ name: "a", category: "core", version: "1.0.0" });
    deactivateService(s.id);
    expect(listServices(undefined, true).length).toBe(0);
    expect(listServices(undefined, false).length).toBe(1);
  });
  it("touches service updates lastSeenAt", () => {
    const s = registerService({ name: "a", category: "core", version: "1.0.0" });
    expect(s.lastSeenAt).toBeNull();
    const touched = touchService(s.id);
    expect(touched?.lastSeenAt).not.toBeNull();
  });
  it("deactivates service", () => {
    const s = registerService({ name: "a", category: "core", version: "1.0.0" });
    expect(deactivateService(s.id)?.active).toBe(false);
  });
  it("supports all categories", () => { expect(supportsAllServiceCategories().length).toBe(10); });
  it("supports all criticalities", () => { expect(supportsAllServiceCriticalities().length).toBe(4); });
  it("default criticality is medium", () => {
    expect(registerService({ name: "a", category: "core", version: "1.0.0" }).criticality).toBe("medium");
  });
  it("default tags empty", () => {
    expect(registerService({ name: "a", category: "core", version: "1.0.0" }).tags.length).toBe(0);
  });
  it("default endpoint null", () => {
    expect(registerService({ name: "a", category: "core", version: "1.0.0" }).endpoint).toBeNull();
  });
  it("default owner null", () => {
    expect(registerService({ name: "a", category: "core", version: "1.0.0" }).owner).toBeNull();
  });
});

// ===========================================================================
// System 2 — Metrics Platform
// ===========================================================================
describe("Telemetry — Metrics (System 2)", () => {
  it("defines metric", () => {
    const m = defineMetric({ key: "http.requests", name: "HTTP Requests", type: "counter" });
    expect(m.id).toBeDefined();
    expect(m.active).toBe(true);
  });
  it("rejects duplicate metric key", () => {
    defineMetric({ key: "k", name: "K", type: "counter" });
    expect(() => defineMetric({ key: "k", name: "K2", type: "counter" })).toThrow();
  });
  it("gets metric definition by id", () => {
    const m = defineMetric({ key: "k", name: "K", type: "counter" });
    expect(getMetricDefinition(m.id)).not.toBeNull();
  });
  it("gets metric definition by key", () => {
    defineMetric({ key: "k", name: "K", type: "counter" });
    expect(getMetricDefinitionByKey("k")).not.toBeNull();
  });
  it("lists metrics", () => {
    defineMetric({ key: "k1", name: "K1", type: "counter" });
    defineMetric({ key: "k2", name: "K2", type: "gauge" });
    expect(listMetrics().length).toBe(2);
  });
  it("lists by type", () => {
    defineMetric({ key: "k1", name: "K1", type: "counter" });
    defineMetric({ key: "k2", name: "K2", type: "gauge" });
    expect(listMetrics("counter").length).toBe(1);
  });
  it("records metric sample", () => {
    defineMetric({ key: "k", name: "K", type: "counter" });
    const s = recordMetric({ metricKey: "k", value: 10 });
    expect(s.value).toBe(10);
  });
  it("rejects recording undefined metric", () => {
    expect(() => recordMetric({ metricKey: "missing", value: 1 })).toThrow();
  });
  it("computes aggregate", () => {
    defineMetric({ key: "k", name: "K", type: "counter" });
    recordMetric({ metricKey: "k", value: 10 });
    recordMetric({ metricKey: "k", value: 20 });
    recordMetric({ metricKey: "k", value: 30 });
    const agg = getMetricAggregateForKey("k");
    expect(agg?.count).toBe(3);
    expect(agg?.sum).toBe(60);
    expect(agg?.min).toBe(10);
    expect(agg?.max).toBe(30);
    expect(agg?.avg).toBe(20);
  });
  it("aggregate computes percentiles", () => {
    defineMetric({ key: "k", name: "K", type: "histogram" });
    for (let i = 1; i <= 100; i++) recordMetric({ metricKey: "k", value: i });
    const agg = getMetricAggregateForKey("k");
    expect(agg?.p50).toBeGreaterThan(0);
    expect(agg?.p95).toBeGreaterThan(agg!.p50!);
    expect(agg?.p99).toBeGreaterThanOrEqual(agg!.p95!);
  });
  it("incrementCounter adds value", () => {
    defineMetric({ key: "k", name: "K", type: "counter" });
    incrementCounter("k", 5);
    incrementCounter("k", 3);
    const agg = getMetricAggregateForKey("k");
    expect(agg?.sum).toBe(8);
  });
  it("setGauge records value", () => {
    defineMetric({ key: "g", name: "G", type: "gauge" });
    setGauge("g", 42);
    expect(getMetricAggregateForKey("g")?.lastValue).toBe(42);
  });
  it("recordTimer records duration", () => {
    defineMetric({ key: "t", name: "T", type: "timer" });
    recordTimer("t", 150);
    expect(getMetricAggregateForKey("t")?.lastValue).toBe(150);
  });
  it("supports all metric types", () => {
    expect(supportsAllMetricTypes().length).toBe(6);
  });
  it("metric supports labels", () => {
    defineMetric({ key: "k", name: "K", type: "counter", labels: ["method", "status"] });
    const s = recordMetric({ metricKey: "k", value: 1, labels: { method: "GET", status: "200" } });
    expect(s.labels.method).toBe("GET");
  });
  it("metric supports correlationId", () => {
    defineMetric({ key: "k", name: "K", type: "counter" });
    const s = recordMetric({ metricKey: "k", value: 1, correlationId: "c-1" });
    expect(s.correlationId).toBe("c-1");
  });
});

// ===========================================================================
// System 3 — Structured Logging
// ===========================================================================
describe("Telemetry — Logs (System 3)", () => {
  it("logs info", () => {
    const e = logInfo("Hello", { serviceId: "s1" });
    expect(e.id).toBeDefined();
    expect(e.level).toBe("info");
    expect(e.immutable).toBe(true);
  });
  it("logs error with exception", () => {
    const e = logError("Failed", { exception: { type: "Error", message: "oops", stack: "stack" } });
    expect(e.exception?.type).toBe("Error");
  });
  it("logs at all levels", () => {
    logTrace("t"); logDebug("d"); logInfo("i"); logWarn("w"); logError("e"); logFatal("f");
    expect(listLogs().length).toBe(6);
  });
  it("lists logs by level", () => {
    logInfo("i1"); logWarn("w1");
    expect(listLogs("warn").length).toBe(1);
  });
  it("lists logs by service", () => {
    logInfo("a", { serviceId: "s1" });
    logInfo("b", { serviceId: "s2" });
    expect(getLogsForService("s1").length).toBe(1);
  });
  it("gets logs by correlation", () => {
    logInfo("a", { correlationId: "c1" });
    logInfo("b", { correlationId: "c1" });
    logInfo("c", { correlationId: "c2" });
    expect(getLogsForCorrelation("c1").length).toBe(2);
  });
  it("log supports userId", () => {
    const e = log({ level: "info", message: "m", userId: "u1" });
    expect(e.userId).toBe("u1");
  });
  it("log supports traceId", () => {
    const e = log({ level: "info", message: "m", traceId: "t1" });
    expect(e.traceId).toBe("t1");
  });
  it("log supports spanId", () => {
    const e = log({ level: "info", message: "m", spanId: "s1" });
    expect(e.spanId).toBe("s1");
  });
  it("log supports context", () => {
    const e = log({ level: "info", message: "m", context: { x: 1 } });
    expect(e.context.x).toBe(1);
  });
  it("supports all log levels", () => {
    expect(supportsAllLogLevels().length).toBe(6);
  });
  it("log default exception null", () => {
    expect(log({ level: "info", message: "m" }).exception).toBeNull();
  });
});

// ===========================================================================
// System 4 — Distributed Tracing
// ===========================================================================
describe("Telemetry — Tracing (System 4)", () => {
  it("starts trace with root span", () => {
    const { trace, rootSpan } = startTrace({});
    expect(trace.id).toBeDefined();
    expect(rootSpan.id).toBeDefined();
    expect(trace.spans.length).toBe(1);
  });
  it("starts child span", () => {
    const { trace, rootSpan } = startTrace({});
    const child = startSpan({ traceId: trace.id, parentId: rootSpan.id, name: "child", serviceId: "s1" });
    expect(child.parentId).toBe(rootSpan.id);
  });
  it("finishes span computes duration", () => {
    const { rootSpan } = startTrace({});
    const finished = finishSpan(rootSpan.id);
    expect(finished?.durationMs).not.toBeNull();
    expect(finished?.status).toBe("ok");
  });
  it("finishes span with error status", () => {
    const { rootSpan } = startTrace({});
    const finished = finishSpan(rootSpan.id, "error");
    expect(finished?.status).toBe("error");
  });
  it("rejects finish already finished span", () => {
    const { rootSpan } = startTrace({});
    finishSpan(rootSpan.id);
    expect(finishSpan(rootSpan.id)).toBeNull();
  });
  it("adds span attribute", () => {
    const { rootSpan } = startTrace({});
    addSpanAttribute(rootSpan.id, "http.method", "GET");
    expect(getTraceById(rootSpan.traceId)?.spans[0].attributes["http.method"]).toBe("GET");
  });
  it("adds span event", () => {
    const { rootSpan } = startTrace({});
    addSpanEvent(rootSpan.id, "cache.miss", { key: "k" });
    expect(getTraceById(rootSpan.traceId)?.spans[0].events.length).toBe(1);
  });
  it("gets trace by id", () => {
    const { trace } = startTrace({});
    expect(getTraceById(trace.id)).not.toBeNull();
  });
  it("lists traces", () => {
    startTrace({}); startTrace({});
    expect(listTraces().length).toBe(2);
  });
  it("gets trace spans", () => {
    const { trace, rootSpan } = startTrace({});
    startSpan({ traceId: trace.id, parentId: rootSpan.id, name: "child", serviceId: "s1" });
    expect(getTraceSpans(trace.id).length).toBe(2);
  });
  it("supports all span kinds", () => {
    expect(supportsAllSpanKinds().length).toBe(5);
  });
  it("supports all span statuses", () => {
    expect(supportsAllSpanStatuses().length).toBe(3);
  });
  it("trace has correlationId", () => {
    const { trace } = startTrace({});
    expect(trace.correlationId).toBeDefined();
  });
  it("finishing root span finishes trace", () => {
    const { trace, rootSpan } = startTrace({});
    finishSpan(rootSpan.id);
    const updated = getTraceById(trace.id);
    expect(updated?.endedAt).not.toBeNull();
    expect(updated?.durationMs).not.toBeNull();
  });
});

// ===========================================================================
// System 5 — Correlation Context
// ===========================================================================
describe("Telemetry — Correlation (System 5)", () => {
  it("creates correlation context", () => {
    const c = createCorrelationContext({});
    expect(c.correlationId).toBeDefined();
  });
  it("creates with traceId", () => {
    const c = createCorrelationContext({ traceId: "t1" });
    expect(c.traceId).toBe("t1");
  });
  it("gets correlation by id", () => {
    const c = createCorrelationContext({});
    expect(getCorrelationContext(c.correlationId)).not.toBeNull();
  });
  it("lists correlations", () => {
    createCorrelationContext({}); createCorrelationContext({});
    expect(listCorrelations().length).toBe(2);
  });
  it("derives correlation from parent", () => {
    const parent = createCorrelationContext({ traceId: "t1" });
    const child = deriveCorrelation(parent.correlationId);
    expect(child.parentCorrelationId).toBe(parent.correlationId);
    expect(child.traceId).toBe("t1");
  });
  it("derives correlation throws for unknown parent", () => {
    expect(() => deriveCorrelation("missing")).toThrow();
  });
  it("correlation supports userId", () => {
    const c = createCorrelationContext({ userId: "u1" });
    expect(c.userId).toBe("u1");
  });
  it("correlation supports serviceId", () => {
    const c = createCorrelationContext({ serviceId: "s1" });
    expect(c.serviceId).toBe("s1");
  });
  it("correlation supports requestId", () => {
    const c = createCorrelationContext({ requestId: "r1" });
    expect(c.requestId).toBe("r1");
  });
});

// ===========================================================================
// System 6 — Health Monitoring
// ===========================================================================
describe("Telemetry — Health (System 6)", () => {
  it("records health check", () => {
    const h = recordHealthCheck({ serviceId: "s1", status: "healthy" });
    expect(h.id).toBeDefined();
    expect(h.status).toBe("healthy");
  });
  it("records with response time", () => {
    const h = recordHealthCheck({ serviceId: "s1", status: "healthy", responseTimeMs: 42 });
    expect(h.responseTimeMs).toBe(42);
  });
  it("gets latest health", () => {
    recordHealthCheck({ serviceId: "s1", status: "healthy" });
    recordHealthCheck({ serviceId: "s1", status: "degraded" });
    expect(getLatestHealth("s1")?.status).toBe("degraded");
  });
  it("lists health checks", () => {
    recordHealthCheck({ serviceId: "s1", status: "healthy" });
    recordHealthCheck({ serviceId: "s2", status: "healthy" });
    expect(listHealthChecks().length).toBe(2);
  });
  it("lists by service", () => {
    recordHealthCheck({ serviceId: "s1", status: "healthy" });
    recordHealthCheck({ serviceId: "s2", status: "healthy" });
    expect(listHealthChecks("s1").length).toBe(1);
  });
  it("platform health aggregates", () => {
    recordHealthCheck({ serviceId: "s1", status: "healthy" });
    recordHealthCheck({ serviceId: "s2", status: "degraded" });
    const ph = getPlatformHealth();
    expect(ph.totalServices).toBe(2);
    expect(ph.healthy).toBe(1);
    expect(ph.degraded).toBe(1);
  });
  it("supports all health statuses", () => {
    expect(supportsAllHealthStatuses().length).toBe(5);
  });
});

// ===========================================================================
// System 7 — Heartbeat Platform
// ===========================================================================
describe("Telemetry — Heartbeats (System 7)", () => {
  it("sends heartbeat", () => {
    const hb = sendHeartbeat({ serviceId: "s1" });
    expect(hb.id).toBeDefined();
    expect(hb.status).toBe("healthy");
  });
  it("sends heartbeat with status", () => {
    const hb = sendHeartbeat({ serviceId: "s1", status: "degraded" });
    expect(hb.status).toBe("degraded");
  });
  it("computes heartbeat stats", () => {
    sendHeartbeat({ serviceId: "s1" });
    sendHeartbeat({ serviceId: "s1" });
    const stats = getHeartbeatStatsForService("s1");
    expect(stats?.totalSent).toBe(2);
  });
  it("marks heartbeat missed", () => {
    sendHeartbeat({ serviceId: "s1" });
    markHeartbeatMissed("s1", futureIso(60));
    const stats = getHeartbeatStatsForService("s1");
    expect(stats?.missedCount).toBe(1);
  });
  it("heartbeat stats avgIntervalMs", () => {
    const now = Date.now();
    sendHeartbeat({ serviceId: "s1", sentAt: new Date(now).toISOString() });
    sendHeartbeat({ serviceId: "s1", sentAt: new Date(now + 5000).toISOString() });
    const stats = getHeartbeatStatsForService("s1");
    expect(stats?.avgIntervalMs).toBeGreaterThan(0);
  });
});

// ===========================================================================
// System 8 — Dependency Graph
// ===========================================================================
describe("Telemetry — Dependencies (System 8)", () => {
  it("registers dependency", () => {
    const d = registerDependency({ fromServiceId: "s1", toServiceId: "s2" });
    expect(d.id).toBeDefined();
    expect(d.type).toBe("sync");
  });
  it("registers with type", () => {
    const d = registerDependency({ fromServiceId: "s1", toServiceId: "s2", type: "async" });
    expect(d.type).toBe("async");
  });
  it("gets dependency by id", () => {
    const d = registerDependency({ fromServiceId: "s1", toServiceId: "s2" });
    expect(getDependencyById(d.id)).not.toBeNull();
  });
  it("lists dependencies", () => {
    registerDependency({ fromServiceId: "s1", toServiceId: "s2" });
    registerDependency({ fromServiceId: "s1", toServiceId: "s3" });
    expect(listDependencies().length).toBe(2);
  });
  it("lists by from service", () => {
    registerDependency({ fromServiceId: "s1", toServiceId: "s2" });
    registerDependency({ fromServiceId: "s2", toServiceId: "s3" });
    expect(listDependencies("s1").length).toBe(1);
  });
  it("lists by to service", () => {
    registerDependency({ fromServiceId: "s1", toServiceId: "s2" });
    registerDependency({ fromServiceId: "s3", toServiceId: "s2" });
    expect(listDependencies(undefined, "s2").length).toBe(2);
  });
  it("updates dependency status", () => {
    const d = registerDependency({ fromServiceId: "s1", toServiceId: "s2" });
    expect(updateDependencyStatus(d.id, "down")?.status).toBe("down");
  });
  it("dependency graph includes nodes and edges", () => {
    const s1 = registerService({ name: "s1", category: "core", version: "1.0.0" });
    const s2 = registerService({ name: "s2", category: "core", version: "1.0.0" });
    registerDependency({ fromServiceId: s1.id, toServiceId: s2.id });
    const g = getDependencyGraph();
    expect(g.nodes.length).toBeGreaterThan(0);
    expect(g.edges.length).toBe(1);
  });
  it("supports all dependency types", () => {
    expect(supportsAllDependencyTypes().length).toBe(5);
  });
  it("supports all dependency statuses", () => {
    expect(supportsAllDependencyStatuses().length).toBe(4);
  });
});

// ===========================================================================
// System 9 — Performance Monitoring
// ===========================================================================
describe("Telemetry — Performance (System 9)", () => {
  it("records performance snapshot", () => {
    const p = recordPerformanceSnapshot({
      serviceId: "s1", responseTimeMs: 50, cpuPercent: 30, memoryMb: 256,
    });
    expect(p.id).toBeDefined();
    expect(p.responseTimeMs).toBe(50);
  });
  it("records with db and cache", () => {
    const p = recordPerformanceSnapshot({
      serviceId: "s1", responseTimeMs: 50, cpuPercent: 30, memoryMb: 256,
      dbQueryMs: 12, cacheHitRate: 0.95,
    });
    expect(p.dbQueryMs).toBe(12);
    expect(p.cacheHitRate).toBe(0.95);
  });
  it("lists performance snapshots", () => {
    recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 50, cpuPercent: 30, memoryMb: 256 });
    recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 60, cpuPercent: 40, memoryMb: 300 });
    expect(listPerformanceSnapshots("s1").length).toBe(2);
  });
  it("computes performance stats", () => {
    recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 100, cpuPercent: 30, memoryMb: 256 });
    recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 200, cpuPercent: 50, memoryMb: 300 });
    const stats = getPerformanceStats("s1");
    expect(stats?.avgResponseTimeMs).toBe(150);
    expect(stats?.peakResponseTimeMs).toBe(200);
  });
  it("performance stats null for unknown service", () => {
    expect(getPerformanceStats("missing")).toBeNull();
  });
});

// ===========================================================================
// System 10 — Queue Monitoring
// ===========================================================================
describe("Telemetry — Queues (System 10)", () => {
  it("records queue metric", () => {
    const m = recordQueueMetric({ queueName: "emails", size: 10 });
    expect(m.id).toBeDefined();
    expect(m.type).toBe("redis");
  });
  it("records with type", () => {
    const m = recordQueueMetric({ queueName: "q", type: "kafka", size: 100 });
    expect(m.type).toBe("kafka");
  });
  it("lists queue metrics", () => {
    recordQueueMetric({ queueName: "q1", size: 10 });
    recordQueueMetric({ queueName: "q2", size: 20 });
    expect(listQueueMetrics().length).toBe(2);
  });
  it("lists by queue name", () => {
    recordQueueMetric({ queueName: "q1", size: 10 });
    recordQueueMetric({ queueName: "q2", size: 20 });
    expect(listQueueMetrics("q1").length).toBe(1);
  });
  it("queue summary aggregates", () => {
    recordQueueMetric({ queueName: "q1", size: 10 });
    recordQueueMetric({ queueName: "q2", size: 20 });
    const s = getQueueSummary();
    expect(s.totalQueues).toBe(2);
    expect(s.totalDepth).toBe(30);
  });
  it("queue summary detects blocked", () => {
    recordQueueMetric({ queueName: "q1", size: 2000, consumers: 0 });
    expect(getQueueSummary().blocked).toBe(1);
  });
  it("supports all queue types", () => {
    expect(supportsAllQueueTypes().length).toBe(5);
  });
});

// ===========================================================================
// System 11 — Event Monitoring
// ===========================================================================
describe("Telemetry — Event Monitor (System 11)", () => {
  it("records published event", () => {
    const e = recordPublishedEvent({ eventType: "user.created", producerServiceId: "s1" });
    expect(e.status).toBe("published");
  });
  it("records consumed event with latency", () => {
    const e = recordConsumedEvent({
      eventType: "user.created", producerServiceId: "s1", consumerServiceId: "s2",
      publishedAt: pastIso(5),
    });
    expect(e.status).toBe("consumed");
    expect(e.latencyMs).toBeGreaterThan(0);
  });
  it("records retry event", () => {
    const e = recordEventRetry({ eventType: "x", producerServiceId: "s1", consumerServiceId: "s2" });
    expect(e.status).toBe("retry");
  });
  it("records dead letter", () => {
    const e = recordDeadLetter({ eventType: "x", producerServiceId: "s1", consumerServiceId: "s2", reason: "max retries" });
    expect(e.status).toBe("dead_letter");
    expect(e.payload.reason).toBe("max retries");
  });
  it("lists event monitor entries", () => {
    recordPublishedEvent({ eventType: "x", producerServiceId: "s1" });
    expect(listEventMonitorEntries().length).toBe(1);
  });
  it("lists by status", () => {
    recordPublishedEvent({ eventType: "x", producerServiceId: "s1" });
    recordDeadLetter({ eventType: "y", producerServiceId: "s1", consumerServiceId: "s2", reason: "x" });
    expect(listEventMonitorEntries(100, "dead_letter").length).toBe(1);
  });
  it("generates event monitor stats", () => {
    recordPublishedEvent({ eventType: "x", producerServiceId: "s1" });
    recordConsumedEvent({ eventType: "y", producerServiceId: "s1", consumerServiceId: "s2", publishedAt: pastIso(1) });
    recordDeadLetter({ eventType: "z", producerServiceId: "s1", consumerServiceId: "s2", reason: "x" });
    const stats = generateEventMonitorStats();
    expect(stats.totalPublished).toBe(1);
    expect(stats.totalConsumed).toBe(1);
    expect(stats.totalDeadLetters).toBe(1);
  });
});

// ===========================================================================
// System 12 — Failure Analysis
// ===========================================================================
describe("Telemetry — Failure Analysis (System 12)", () => {
  it("records failure creating cluster", () => {
    const c = recordFailure({ exceptionType: "Error", message: "something failed" });
    expect(c.id).toBeDefined();
    expect(c.occurrences).toBe(1);
  });
  it("records same failure increments cluster", () => {
    recordFailure({ exceptionType: "Error", message: "something failed" });
    recordFailure({ exceptionType: "Error", message: "something failed" });
    const clusters = listFailureClusters();
    expect(clusters.length).toBe(1);
    expect(clusters[0].occurrences).toBe(2);
  });
  it("different failures create different clusters", () => {
    recordFailure({ exceptionType: "Error", message: "fail A" });
    recordFailure({ exceptionType: "Error", message: "fail B" });
    expect(listFailureClusters().length).toBe(2);
  });
  it("gets failure cluster by id", () => {
    const c = recordFailure({ exceptionType: "Error", message: "fail" });
    expect(getFailureClusterById(c.id)).not.toBeNull();
  });
  it("lists by service", () => {
    recordFailure({ exceptionType: "Error", message: "fail", serviceId: "s1" });
    recordFailure({ exceptionType: "Error", message: "fail", serviceId: "s2" });
    expect(listFailureClusters("s1").length).toBe(1);
  });
  it("sets root cause", () => {
    const c = recordFailure({ exceptionType: "Error", message: "fail" });
    expect(setRootCause(c.id, "bad config")?.rootCause).toBe("bad config");
  });
  it("links failure clusters", () => {
    const c1 = recordFailure({ exceptionType: "Error", message: "fail A" });
    const c2 = recordFailure({ exceptionType: "Error", message: "fail B" });
    linkFailureClusters(c1.id, c2.id);
    expect(getFailureClusterById(c1.id)?.relatedClusters.length).toBe(1);
  });
  it("rejects duplicate link", () => {
    const c1 = recordFailure({ exceptionType: "Error", message: "fail A" });
    const c2 = recordFailure({ exceptionType: "Error", message: "fail B" });
    linkFailureClusters(c1.id, c2.id);
    linkFailureClusters(c1.id, c2.id);
    expect(getFailureClusterById(c1.id)?.relatedClusters.length).toBe(1);
  });
});

// ===========================================================================
// System 13 — Error Registry
// ===========================================================================
describe("Telemetry — Error Registry (System 13)", () => {
  it("registers error", () => {
    const e = registerError({ code: "AUTH_FAILED", message: "Authentication failed" });
    expect(e.id).toBeDefined();
    expect(e.active).toBe(true);
  });
  it("rejects duplicate error code", () => {
    registerError({ code: "AUTH_FAILED", message: "x" });
    expect(() => registerError({ code: "AUTH_FAILED", message: "y" })).toThrow();
  });
  it("registers with category and severity", () => {
    const e = registerError({ code: "DB_TIMEOUT", category: "database", severity: "high", message: "DB timeout" });
    expect(e.category).toBe("database");
    expect(e.severity).toBe("high");
  });
  it("registers with remediation", () => {
    const e = registerError({ code: "X", message: "x", remediation: "restart service" });
    expect(e.remediation).toBe("restart service");
  });
  it("gets error by id", () => {
    const e = registerError({ code: "X", message: "x" });
    expect(getErrorById(e.id)).not.toBeNull();
  });
  it("gets error by code", () => {
    registerError({ code: "X", message: "x" });
    expect(getErrorByErrorCode("X")).not.toBeNull();
  });
  it("lists errors", () => {
    registerError({ code: "A", message: "a" });
    registerError({ code: "B", message: "b" });
    expect(listErrors().length).toBe(2);
  });
  it("lists by category", () => {
    registerError({ code: "A", message: "a", category: "database" });
    registerError({ code: "B", message: "b", category: "network" });
    expect(listErrors("database").length).toBe(1);
  });
  it("lists by severity", () => {
    registerError({ code: "A", message: "a", severity: "high" });
    registerError({ code: "B", message: "b", severity: "low" });
    expect(listErrors(undefined, "high").length).toBe(1);
  });
  it("records error occurrence", () => {
    registerError({ code: "X", message: "x" });
    recordErrorOccurrence("X");
    recordErrorOccurrence("X");
    expect(getErrorByErrorCode("X")?.occurrences).toBe(2);
  });
  it("deactivates error", () => {
    const e = registerError({ code: "X", message: "x" });
    expect(deactivateError(e.id)?.active).toBe(false);
  });
  it("supports all error categories", () => {
    expect(supportsAllErrorCategories().length).toBe(8);
  });
  it("supports all error severities", () => {
    expect(supportsAllErrorSeverities().length).toBe(4);
  });
});

// ===========================================================================
// System 14 — Alert Platform
// ===========================================================================
describe("Telemetry — Alerts (System 14)", () => {
  it("creates alert rule", () => {
    const r = createAlertRule({ name: "High CPU", condition: "cpu", threshold: 90 });
    expect(r.id).toBeDefined();
    expect(r.active).toBe(true);
  });
  it("gets alert rule by id", () => {
    const r = createAlertRule({ name: "X", condition: "threshold", threshold: 100 });
    expect(getAlertRuleById(r.id)).not.toBeNull();
  });
  it("lists alert rules", () => {
    createAlertRule({ name: "R1", condition: "cpu", threshold: 90 });
    createAlertRule({ name: "R2", condition: "memory", threshold: 80 });
    expect(listAlertRules().length).toBe(2);
  });
  it("lists active only", () => {
    const r = createAlertRule({ name: "R", condition: "cpu", threshold: 90 });
    deactivateAlertRule(r.id);
    expect(listAlertRules(true).length).toBe(0);
  });
  it("deactivates alert rule", () => {
    const r = createAlertRule({ name: "R", condition: "cpu", threshold: 90 });
    expect(deactivateAlertRule(r.id)?.active).toBe(false);
  });
  it("triggers alert", () => {
    const a = triggerAlert({ title: "High CPU", description: "CPU > 90%" });
    expect(a.id).toBeDefined();
    expect(a.status).toBe("active");
  });
  it("triggers alert with severity", () => {
    const a = triggerAlert({ title: "X", description: "Y", severity: "critical" });
    expect(a.severity).toBe("critical");
  });
  it("gets alert by id", () => {
    const a = triggerAlert({ title: "X", description: "Y" });
    expect(getAlertById(a.id)).not.toBeNull();
  });
  it("lists alerts", () => {
    triggerAlert({ title: "A", description: "x" });
    triggerAlert({ title: "B", description: "y" });
    expect(listAlerts().length).toBe(2);
  });
  it("lists by status", () => {
    triggerAlert({ title: "A", description: "x" });
    expect(listAlerts("active").length).toBe(1);
  });
  it("lists by severity", () => {
    triggerAlert({ title: "A", description: "x", severity: "critical" });
    triggerAlert({ title: "B", description: "y", severity: "info" });
    expect(listAlerts(undefined, "critical").length).toBe(1);
  });
  it("acknowledges alert", () => {
    const a = triggerAlert({ title: "X", description: "Y" });
    expect(acknowledgeAlert(a.id, "admin")?.status).toBe("acknowledged");
  });
  it("resolves alert", () => {
    const a = triggerAlert({ title: "X", description: "Y" });
    expect(resolveAlert(a.id)?.status).toBe("resolved");
  });
  it("suppresses alert", () => {
    const a = triggerAlert({ title: "X", description: "Y" });
    expect(suppressAlert(a.id)?.status).toBe("suppressed");
  });
  it("rejects acknowledge non-active", () => {
    const a = triggerAlert({ title: "X", description: "Y" });
    resolveAlert(a.id);
    expect(acknowledgeAlert(a.id, "admin")).toBeNull();
  });
  it("rejects resolve already resolved", () => {
    const a = triggerAlert({ title: "X", description: "Y" });
    resolveAlert(a.id);
    expect(resolveAlert(a.id)).toBeNull();
  });
  it("supports all alert conditions", () => {
    expect(supportsAllAlertConditions().length).toBe(8);
  });
  it("supports all alert severities", () => {
    expect(supportsAllAlertSeverities().length).toBe(5);
  });
  it("supports all alert statuses", () => {
    expect(supportsAllAlertStatuses().length).toBe(4);
  });
});

// ===========================================================================
// System 15 — Incident Timeline
// ===========================================================================
describe("Telemetry — Incidents (System 15)", () => {
  it("opens incident", () => {
    const i = openIncident({ title: "DB down", severity: "sev1" });
    expect(i.id).toBeDefined();
    expect(i.status).toBe("open");
    expect(i.timeline.length).toBe(1);
  });
  it("opens with service and owner", () => {
    const i = openIncident({ title: "X", severity: "sev2", serviceId: "s1", owner: "alice" });
    expect(i.serviceId).toBe("s1");
    expect(i.owner).toBe("alice");
  });
  it("gets incident by id", () => {
    const i = openIncident({ title: "X", severity: "sev2" });
    expect(getIncidentById(i.id)).not.toBeNull();
  });
  it("lists incidents", () => {
    openIncident({ title: "A", severity: "sev1" });
    openIncident({ title: "B", severity: "sev2" });
    expect(listIncidents().length).toBe(2);
  });
  it("lists by status", () => {
    openIncident({ title: "A", severity: "sev1" });
    expect(listIncidents("open").length).toBe(1);
  });
  it("lists by severity", () => {
    openIncident({ title: "A", severity: "sev1" });
    openIncident({ title: "B", severity: "sev2" });
    expect(listIncidents(undefined, "sev1").length).toBe(1);
  });
  it("canTransition validates", () => {
    expect(canTransitionIncident("open", "investigating")).toBe(true);
    expect(canTransitionIncident("closed", "open")).toBe(false);
  });
  it("transitions incident", () => {
    const i = openIncident({ title: "X", severity: "sev2" });
    expect(transitionIncident(i.id, "investigating", "admin", "looking")?.status).toBe("investigating");
  });
  it("rejects invalid transition", () => {
    const i = openIncident({ title: "X", severity: "sev2" });
    // open -> monitoring is NOT valid (must go through investigating/identified first)
    expect(transitionIncident(i.id, "monitoring", "admin", "x")).toBeNull();
  });
  it("transition adds timeline event", () => {
    const i = openIncident({ title: "X", severity: "sev2" });
    transitionIncident(i.id, "investigating", "admin", "x");
    expect(getIncidentById(i.id)?.timeline.length).toBe(2);
  });
  it("resolves sets resolvedAt", () => {
    const i = openIncident({ title: "X", severity: "sev2" });
    transitionIncident(i.id, "investigating", "admin", "x");
    transitionIncident(i.id, "resolved", "admin", "fixed");
    expect(getIncidentById(i.id)?.resolvedAt).not.toBeNull();
  });
  it("closes sets closedAt", () => {
    const i = openIncident({ title: "X", severity: "sev2" });
    transitionIncident(i.id, "resolved", "admin", "x");
    transitionIncident(i.id, "closed", "admin", "done");
    expect(getIncidentById(i.id)?.closedAt).not.toBeNull();
  });
  it("adds incident event", () => {
    const i = openIncident({ title: "X", severity: "sev2" });
    addIncidentEvent(i.id, "comment", "alice", "looks bad");
    expect(getIncidentById(i.id)?.timeline.length).toBe(2);
  });
  it("sets root cause", () => {
    const i = openIncident({ title: "X", severity: "sev2" });
    expect(setIncidentRootCause(i.id, "bad deploy")?.rootCause).toBe("bad deploy");
  });
  it("sets resolution", () => {
    const i = openIncident({ title: "X", severity: "sev2" });
    expect(setIncidentResolution(i.id, "rolled back")?.resolution).toBe("rolled back");
  });
  it("assigns owner", () => {
    const i = openIncident({ title: "X", severity: "sev2" });
    expect(assignIncidentOwner(i.id, "bob")?.owner).toBe("bob");
  });
  it("supports all incident severities", () => {
    expect(supportsAllIncidentSeverities().length).toBe(4);
  });
  it("supports all incident statuses", () => {
    expect(supportsAllIncidentStatuses().length).toBe(6);
  });
});

// ===========================================================================
// System 16 — Capacity Monitoring
// ===========================================================================
describe("Telemetry — Capacity (System 16)", () => {
  it("records capacity snapshot", () => {
    const c = recordCapacitySnapshot({
      serviceId: "s1", connections: 50, maxConnections: 100,
      storageMb: 500, maxStorageMb: 1000,
    });
    expect(c.id).toBeDefined();
    expect(c.utilizationPercent).toBe(50);
  });
  it("computes utilization as max of connections and storage", () => {
    const c = recordCapacitySnapshot({
      serviceId: "s1", connections: 90, maxConnections: 100,
      storageMb: 100, maxStorageMb: 1000,
    });
    expect(c.utilizationPercent).toBe(90);
  });
  it("lists capacity snapshots", () => {
    recordCapacitySnapshot({ serviceId: "s1", connections: 10, maxConnections: 100, storageMb: 100, maxStorageMb: 1000 });
    recordCapacitySnapshot({ serviceId: "s1", connections: 20, maxConnections: 100, storageMb: 200, maxStorageMb: 1000 });
    expect(listCapacitySnapshots("s1").length).toBe(2);
  });
  it("gets capacity utilization", () => {
    recordCapacitySnapshot({ serviceId: "s1", connections: 50, maxConnections: 100, storageMb: 500, maxStorageMb: 1000 });
    recordCapacitySnapshot({ serviceId: "s1", connections: 80, maxConnections: 100, storageMb: 800, maxStorageMb: 1000 });
    const util = getCapacityUtilization("s1");
    expect(util?.current).toBe(80);
    expect(util?.peak).toBe(80);
  });
  it("capacity utilization null for unknown", () => {
    expect(getCapacityUtilization("missing")).toBeNull();
  });
  it("platform capacity summary", () => {
    const s = registerService({ name: "s1", category: "core", version: "1.0.0" });
    recordCapacitySnapshot({ serviceId: s.id, connections: 90, maxConnections: 100, storageMb: 100, maxStorageMb: 1000 });
    const summary = getPlatformCapacitySummary();
    expect(summary.servicesTracked).toBe(1);
    expect(summary.atRiskCount).toBe(1);
  });
});

// ===========================================================================
// System 17 — Profiling Platform
// ===========================================================================
describe("Telemetry — Profiling (System 17)", () => {
  it("records profile sample", () => {
    const p = recordProfileSample({ serviceId: "s1", method: "handleRequest", durationMs: 100 });
    expect(p.id).toBeDefined();
  });
  it("marks hot path automatically for slow methods", () => {
    const p = recordProfileSample({ serviceId: "s1", method: "slow", durationMs: 600 });
    expect(p.hotPath).toBe(true);
  });
  it("does not mark hot path for fast methods", () => {
    const p = recordProfileSample({ serviceId: "s1", method: "fast", durationMs: 50 });
    expect(p.hotPath).toBe(false);
  });
  it("lists profile samples", () => {
    recordProfileSample({ serviceId: "s1", method: "a", durationMs: 100 });
    recordProfileSample({ serviceId: "s1", method: "b", durationMs: 200 });
    expect(listProfileSamples("s1").length).toBe(2);
  });
  it("lists all profile samples", () => {
    recordProfileSample({ serviceId: "s1", method: "a", durationMs: 100 });
    recordProfileSample({ serviceId: "s2", method: "b", durationMs: 200 });
    expect(listProfileSamples().length).toBe(2);
  });
  it("gets hot paths", () => {
    recordProfileSample({ serviceId: "s1", method: "slow", durationMs: 800 });
    recordProfileSample({ serviceId: "s1", method: "fast", durationMs: 50 });
    const hot = getHotPaths("s1");
    expect(hot.length).toBe(1);
    expect(hot[0].method).toBe("slow");
  });
  it("gets slowest methods", () => {
    recordProfileSample({ serviceId: "s1", method: "a", durationMs: 100 });
    recordProfileSample({ serviceId: "s1", method: "b", durationMs: 500 });
    recordProfileSample({ serviceId: "s1", method: "c", durationMs: 300 });
    const slowest = getSlowestMethods("s1");
    expect(slowest[0].method).toBe("b");
  });
  it("profile supports stackTrace", () => {
    const p = recordProfileSample({ serviceId: "s1", method: "m", durationMs: 100, stackTrace: "at foo()" });
    expect(p.stackTrace).toBe("at foo()");
  });
});

// ===========================================================================
// System 18 — Snapshot Platform
// ===========================================================================
describe("Telemetry — Snapshots (System 18)", () => {
  it("takes platform snapshot", () => {
    const s = takePlatformSnapshot({});
    expect(s.id).toBeDefined();
    expect(s.trigger).toBe("manual");
  });
  it("takes snapshot with trigger", () => {
    const s = takePlatformSnapshot({ trigger: "incident" });
    expect(s.trigger).toBe("incident");
  });
  it("lists platform snapshots", () => {
    takePlatformSnapshot({});
    takePlatformSnapshot({});
    expect(listPlatformSnapshots().length).toBe(2);
  });
  it("gets latest snapshot", () => {
    takePlatformSnapshot({});
    const latest = takePlatformSnapshot({});
    expect(getLatestSnapshot()?.id).toBe(latest.id);
  });
  it("snapshot includes service count", () => {
    registerService({ name: "s1", category: "core", version: "1.0.0" });
    const s = takePlatformSnapshot({});
    expect(s.servicesTotal).toBe(1);
  });
});

// ===========================================================================
// System 19 — Diagnostics Engine
// ===========================================================================
describe("Telemetry — Diagnostics (System 19)", () => {
  it("runs diagnostic check", () => {
    const c = runDiagnosticCheck({ type: "redis_connectivity", message: "Redis OK" });
    expect(c.id).toBeDefined();
    expect(c.status).toBe("pass");
  });
  it("runs diagnostic check with fail status", () => {
    const c = runDiagnosticCheck({ type: "redis_connectivity", status: "fail", message: "Redis down" });
    expect(c.status).toBe("fail");
  });
  it("runs diagnostic report", () => {
    const r = runDiagnosticReport({
      checks: [
        { type: "redis_connectivity", serviceId: "s1", status: "pass", message: "OK", details: {}, durationMs: 5 },
        { type: "database_connectivity", serviceId: "s1", status: "fail", message: "DB down", details: {}, durationMs: 50 },
      ],
    });
    expect(r.totalChecks).toBe(2);
    expect(r.passed).toBe(1);
    expect(r.failed).toBe(1);
  });
  it("lists diagnostic reports", () => {
    runDiagnosticReport({ checks: [] });
    expect(listDiagnosticReports().length).toBe(1);
  });
  it("supports all diagnostic check types", () => {
    expect(supportsAllDiagnosticCheckTypes().length).toBe(12);
  });
  it("supports all diagnostic check statuses", () => {
    expect(supportsAllDiagnosticCheckStatuses().length).toBe(4);
  });
});

// ===========================================================================
// System 20 — SLO Platform
// ===========================================================================
describe("Telemetry — SLO (System 20)", () => {
  it("creates SLO", () => {
    const s = createSLO({ name: "API Availability", target: 0.999 });
    expect(s.id).toBeDefined();
    expect(s.active).toBe(true);
  });
  it("rejects target out of range", () => {
    expect(() => createSLO({ name: "X", target: 1.5 })).toThrow();
    expect(() => createSLO({ name: "X", target: -0.1 })).toThrow();
  });
  it("creates with type", () => {
    const s = createSLO({ name: "Latency", target: 0.95, type: "latency" });
    expect(s.type).toBe("latency");
  });
  it("creates with service", () => {
    const s = createSLO({ name: "X", target: 0.99, serviceId: "s1" });
    expect(s.serviceId).toBe("s1");
  });
  it("creates with window", () => {
    const s = createSLO({ name: "X", target: 0.99, windowDays: 7 });
    expect(s.windowDays).toBe(7);
  });
  it("gets SLO by id", () => {
    const s = createSLO({ name: "X", target: 0.99 });
    expect(getSLOById(s.id)).not.toBeNull();
  });
  it("lists SLOs", () => {
    createSLO({ name: "A", target: 0.99 });
    createSLO({ name: "B", target: 0.999 });
    expect(listSLOs().length).toBe(2);
  });
  it("lists active only", () => {
    createSLO({ name: "A", target: 0.99 });
    expect(listSLOs(true).length).toBe(1);
  });
  it("updates SLO status", () => {
    const s = createSLO({ name: "X", target: 0.99 });
    const status = updateSLOStatus(s.id, 0.95);
    expect(status?.current).toBe(0.95);
  });
  it("SLO breached when below target", () => {
    const s = createSLO({ name: "X", target: 0.99 });
    const status = updateSLOStatus(s.id, 0.95);
    expect(status?.status).toBe("breached");
  });
  it("SLO met when at target", () => {
    const s = createSLO({ name: "X", target: 0.99 });
    const status = updateSLOStatus(s.id, 0.999);
    expect(status?.status).toBe("met");
  });
  it("gets SLO status", () => {
    const s = createSLO({ name: "X", target: 0.99 });
    expect(getSLOStatusForSLO(s.id)).not.toBeNull();
  });
  it("lists SLO statuses", () => {
    createSLO({ name: "A", target: 0.99 });
    createSLO({ name: "B", target: 0.999 });
    expect(listSLOStatuses().length).toBe(2);
  });
  it("SLO summary", () => {
    const s1 = createSLO({ name: "A", target: 0.99 });
    const s2 = createSLO({ name: "B", target: 0.99 });
    updateSLOStatus(s2.id, 0.95); // breach
    const summary = getSLOSummary();
    expect(summary.total).toBe(2);
    expect(summary.breached).toBe(1);
  });
  it("supports all SLO types", () => {
    expect(supportsAllSLOTypes().length).toBe(5);
  });
});

// ===========================================================================
// System 21-22 — Developer Diagnostics + Dashboard
// ===========================================================================
describe("Telemetry — Developer Diagnostics + Dashboard (Systems 21-22)", () => {
  it("generates developer diagnostic report", () => {
    const r = generateDeveloperDiagnosticReport({});
    expect(r.id).toBeDefined();
    expect(r.openTelemetry.serviceName).toBeDefined();
  });
  it("report includes metrics", () => {
    defineMetric({ key: "k", name: "K", type: "counter" });
    const r = generateDeveloperDiagnosticReport({});
    expect(r.metrics.length).toBeGreaterThan(0);
  });
  it("report includes schemas", () => {
    const r = generateDeveloperDiagnosticReport({});
    expect(r.schemas.metricSample).toBeDefined();
    expect(r.schemas.logEntry).toBeDefined();
    expect(r.schemas.traceSpan).toBeDefined();
    expect(r.schemas.healthCheck).toBeDefined();
  });
  it("generates operational dashboard", () => {
    const d = generateOperationalDashboard();
    expect(d.services.total).toBe(0);
    expect(d.updatedAt).toBeDefined();
  });
  it("dashboard counts services", () => {
    registerService({ name: "s1", category: "core", version: "1.0.0" });
    const d = generateOperationalDashboard();
    expect(d.services.total).toBe(1);
  });
  it("dashboard includes per-service latency", () => {
    registerService({ name: "s1", category: "core", version: "1.0.0" });
    const d = generateOperationalDashboard();
    expect(d.services.perServiceLatency.length).toBeGreaterThan(0);
  });
  it("dashboard includes events", () => {
    recordPublishedEvent({ eventType: "x", producerServiceId: "s1" });
    const d = generateOperationalDashboard();
    expect(d.events.published).toBe(1);
  });
  it("dashboard includes SLOs", () => {
    createSLO({ name: "X", target: 0.99 });
    const d = generateOperationalDashboard();
    expect(d.slos.total).toBe(1);
  });
});

// ===========================================================================
// System 23 — Export Platform
// ===========================================================================
describe("Telemetry — Export (System 23)", () => {
  it("registers export config", () => {
    const c = registerExportConfig({ format: "prometheus" });
    expect(c.id).toBeDefined();
    expect(c.enabled).toBe(true);
  });
  it("gets export config by id", () => {
    const c = registerExportConfig({ format: "prometheus" });
    expect(getExportConfigById(c.id)).not.toBeNull();
  });
  it("lists export configs", () => {
    registerExportConfig({ format: "prometheus" });
    registerExportConfig({ format: "datadog" });
    expect(listExportConfigs().length).toBe(2);
  });
  it("lists by format", () => {
    registerExportConfig({ format: "prometheus" });
    registerExportConfig({ format: "datadog" });
    expect(listExportConfigs("prometheus").length).toBe(1);
  });
  it("marks exported", () => {
    const c = registerExportConfig({ format: "prometheus" });
    expect(markExported(c.id)?.lastExportedAt).not.toBeNull();
  });
  it("sets enabled", () => {
    const c = registerExportConfig({ format: "prometheus" });
    expect(setExportEnabled(c.id, false)?.enabled).toBe(false);
  });
  it("exports prometheus format", () => {
    defineMetric({ key: "k", name: "K", type: "counter", description: "Test" });
    const out = exportMetrics("prometheus");
    expect(out).toContain("# HELP k");
    expect(out).toContain("# TYPE k");
  });
  it("exports grafana format", () => {
    const out = exportMetrics("grafana");
    expect(out).toContain("dashboard");
  });
  it("exports opentelemetry format", () => {
    const out = exportMetrics("opentelemetry");
    expect(out).toContain("serviceName");
  });
  it("exports datadog format", () => {
    const out = exportMetrics("datadog");
    expect(out).toContain("service");
  });
  it("exports cloudwatch format", () => {
    const out = exportMetrics("cloudwatch");
    expect(out).toContain("namespace");
  });
  it("exports azure_monitor format", () => {
    const out = exportMetrics("azure_monitor");
    expect(out).toContain("resourceGroup");
  });
  it("supports all export formats", () => {
    expect(supportsAllExportFormats().length).toBe(6);
  });
});

// ===========================================================================
// System 24 — Documentation Generator
// ===========================================================================
describe("Telemetry — Documentation (System 24)", () => {
  it("generates documentation", () => {
    const doc = generateTelemetryDocumentation();
    expect(doc.version).toBe("1.0.0");
    expect(doc.generatedAt).toBeDefined();
  });
  it("documents all 25 systems", () => {
    expect(generateTelemetryDocumentation().systems.length).toBe(25);
  });
  it("system 1 is Telemetry Registry", () => {
    expect(generateTelemetryDocumentation().systems[0].name).toBe("Telemetry Registry");
  });
  it("system 25 is Event Bus Bridge", () => {
    expect(generateTelemetryDocumentation().systems[24].name).toBe("Event Bus Bridge");
  });
  it("documents all events", () => {
    expect(generateTelemetryDocumentation().events.length).toBe(19);
  });
  it("ownership owns structured logs", () => {
    expect(generateTelemetryDocumentation().ownership.owns.some(o => o.includes("Structured Logs"))).toBe(true);
  });
  it("ownership does not own XP", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.some(o => o.includes("XP"))).toBe(true);
  });
  it("ownership does not own commerce", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.some(o => o.includes("Commerce"))).toBe(true);
  });
  it("includes OpenTelemetry metadata", () => {
    const doc = generateTelemetryDocumentation();
    expect(doc.openTelemetryMetadata.serviceName).toBeDefined();
    expect(doc.openTelemetryMetadata.samplingRules.length).toBeGreaterThan(0);
    expect(doc.openTelemetryMetadata.exportFormats.length).toBe(6);
  });
  it("generates markdown", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain("# EduBek");
    expect(md).toContain("Telemetry");
  });
  it("markdown includes all systems", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain("System 1 —");
    expect(md).toContain("System 25 —");
  });
  it("markdown includes OpenTelemetry metadata", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain("OpenTelemetry");
  });
  it("getTelemetryVersion returns 1.0.0", () => {
    expect(getTelemetryVersion()).toBe("1.0.0");
  });
});

// ===========================================================================
// System 25 — Event Bus Bridge
// ===========================================================================
describe("Telemetry — Event Bus Bridge (System 25)", () => {
  it("subscribes to event bus", () => {
    subscribeTelemetry();
    expect(isTelemetrySubscribed()).toBe(true);
    unsubscribeTelemetry();
  });
  it("unsubscribes", () => {
    subscribeTelemetry();
    unsubscribeTelemetry();
    expect(isTelemetrySubscribed()).toBe(false);
  });
  it("does not double-subscribe", () => {
    subscribeTelemetry();
    subscribeTelemetry();
    expect(isTelemetrySubscribed()).toBe(true);
    unsubscribeTelemetry();
  });
  it("publishes telemetry event", () => {
    publishTelemetryEvent("ServiceHealthy", null, { serviceId: "s1" });
    expect(getBridgePublishedCount()).toBe(1);
  });
  it("published events tracked", () => {
    publishTelemetryEvent("AlertTriggered", null, { alertId: "a1" });
    publishTelemetryEvent("IncidentOpened", "admin", { incidentId: "i1" });
    expect(getPublishedEvents().length).toBe(2);
  });
  it("reset clears state", () => {
    subscribeTelemetry();
    publishTelemetryEvent("ServiceHealthy", null, {});
    _resetBridgeForTesting();
    expect(isTelemetrySubscribed()).toBe(false);
    expect(getBridgePublishedCount()).toBe(0);
  });
  it("supports null actorId", () => {
    publishTelemetryEvent("SnapshotCreated", null, { snapshotId: "x" });
    expect(getPublishedEvents()[0].actorId).toBeNull();
  });
  it("trace completed publishes event", () => {
    const { rootSpan } = startTrace({});
    finishSpan(rootSpan.id);
    expect(getPublishedEvents().some(e => e.type === "TraceCompleted")).toBe(true);
  });
  it("latency exceeded publishes event", () => {
    recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 1500, cpuPercent: 50, memoryMb: 100 });
    expect(getPublishedEvents().some(e => e.type === "LatencyExceeded")).toBe(true);
  });
  it("queue blocked publishes event", () => {
    recordQueueMetric({ queueName: "q1", size: 2000, consumers: 0 });
    expect(getPublishedEvents().some(e => e.type === "QueueBlocked")).toBe(true);
  });
  it("alert triggered publishes event", () => {
    triggerAlert({ title: "X", description: "Y" });
    expect(getPublishedEvents().some(e => e.type === "AlertTriggered")).toBe(true);
  });
  it("alert resolved publishes event", () => {
    const a = triggerAlert({ title: "X", description: "Y" });
    resolveAlert(a.id);
    expect(getPublishedEvents().some(e => e.type === "AlertResolved")).toBe(true);
  });
  it("incident opened publishes event", () => {
    openIncident({ title: "X", severity: "sev1" });
    expect(getPublishedEvents().some(e => e.type === "IncidentOpened")).toBe(true);
  });
  it("incident closed publishes event", () => {
    const i = openIncident({ title: "X", severity: "sev1" });
    transitionIncident(i.id, "resolved", "admin", "x");
    transitionIncident(i.id, "closed", "admin", "done");
    expect(getPublishedEvents().some(e => e.type === "IncidentClosed")).toBe(true);
  });
  it("snapshot created publishes event", () => {
    takePlatformSnapshot({});
    expect(getPublishedEvents().some(e => e.type === "SnapshotCreated")).toBe(true);
  });
  it("diagnostic completed publishes event", () => {
    runDiagnosticReport({ checks: [] });
    expect(getPublishedEvents().some(e => e.type === "DiagnosticCompleted")).toBe(true);
  });
  it("capacity warning publishes event", () => {
    recordCapacitySnapshot({ serviceId: "s1", connections: 95, maxConnections: 100, storageMb: 100, maxStorageMb: 1000 });
    expect(getPublishedEvents().some(e => e.type === "CapacityWarning")).toBe(true);
  });
  it("health changed publishes event", () => {
    recordHealthCheck({ serviceId: "s1", status: "healthy" });
    recordHealthCheck({ serviceId: "s1", status: "degraded" });
    expect(getPublishedEvents().some(e => e.type === "HealthChanged")).toBe(true);
  });
  it("service degraded publishes event", () => {
    recordHealthCheck({ serviceId: "s1", status: "healthy" });
    recordHealthCheck({ serviceId: "s1", status: "degraded" });
    expect(getPublishedEvents().some(e => e.type === "ServiceDegraded")).toBe(true);
  });
  it("service recovered publishes event", () => {
    recordHealthCheck({ serviceId: "s1", status: "degraded" });
    recordHealthCheck({ serviceId: "s1", status: "healthy" });
    expect(getPublishedEvents().some(e => e.type === "ServiceRecovered")).toBe(true);
  });
  it("dependency unavailable publishes event", () => {
    const d = registerDependency({ fromServiceId: "s1", toServiceId: "s2" });
    updateDependencyStatus(d.id, "down");
    expect(getPublishedEvents().some(e => e.type === "DependencyUnavailable")).toBe(true);
  });
  it("heartbeat missed publishes event", () => {
    markHeartbeatMissed("s1", futureIso(60));
    expect(getPublishedEvents().some(e => e.type === "HeartbeatMissed")).toBe(true);
  });
  it("error cluster detected publishes event at 10 occurrences", () => {
    for (let i = 0; i < 10; i++) {
      recordFailure({ exceptionType: "Error", message: "same failure" });
    }
    expect(getPublishedEvents().some(e => e.type === "ErrorClusterDetected")).toBe(true);
  });
});

// ===========================================================================
// Developer Integration + Status
// ===========================================================================
describe("Telemetry — Developer Integration + Status", () => {
  it("returns public APIs", () => {
    expect(getDeveloperIntegration().publicAPIs.length).toBeGreaterThan(0);
  });
  it("returns extension hooks", () => {
    expect(getDeveloperIntegration().extensionHooks.length).toBeGreaterThan(0);
  });
  it("returns SDK metadata", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.version).toBe("1.0.0");
    expect(d.sdkMetadata.language).toBe("typescript");
  });
  it("returns webhooks", () => {
    expect(getDeveloperIntegration().webhooks.length).toBeGreaterThan(0);
  });
  it("SDK has capabilities", () => {
    expect(getDeveloperIntegration().sdkMetadata.capabilities.length).toBeGreaterThan(0);
  });
  it("public APIs include metrics", () => {
    expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("metrics"))).toBe(true);
  });
  it("public APIs include traces", () => {
    expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("traces"))).toBe(true);
  });
  it("extension hooks include AlertTriggered", () => {
    expect(getDeveloperIntegration().extensionHooks.some(h => h.triggerEvent === "AlertTriggered")).toBe(true);
  });
  it("extension hooks include IncidentOpened", () => {
    expect(getDeveloperIntegration().extensionHooks.some(h => h.triggerEvent === "IncidentOpened")).toBe(true);
  });
  it("webhooks include ServiceDegraded", () => {
    expect(getDeveloperIntegration().webhooks.some(w => w.event === "ServiceDegraded")).toBe(true);
  });
  it("getTelemetryStatus returns operational", () => {
    const s = getTelemetryStatus();
    expect(s.operational).toBe(true);
    expect(s.systems).toBe(25);
  });
});

// ===========================================================================
// Ownership Boundaries
// ===========================================================================
describe("Telemetry — Ownership Boundaries", () => {
  it("never owns XP", () => {
    // Use exact match to avoid false positive on "export"
    expect(getDeveloperIntegration().sdkMetadata.capabilities.some(c => c === "xp")).toBe(false);
  });
  it("never owns commerce", () => {
    expect(getDeveloperIntegration().sdkMetadata.capabilities.some(c => c.includes("commerce"))).toBe(false);
  });
  it("never owns marketplace", () => {
    expect(getDeveloperIntegration().sdkMetadata.capabilities.some(c => c.includes("marketplace"))).toBe(false);
  });
  it("never owns notifications", () => {
    expect(getDeveloperIntegration().sdkMetadata.capabilities.some(c => c.includes("notifications"))).toBe(false);
  });
  it("never owns rbac", () => {
    expect(getDeveloperIntegration().sdkMetadata.capabilities.some(c => c.includes("rbac"))).toBe(false);
  });
  it("documentation states it does not own XP", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.some(o => o.includes("XP"))).toBe(true);
  });
  it("documentation states it does not own Commerce", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.some(o => o.includes("Commerce"))).toBe(true);
  });
  it("documentation states it does not own Marketplace", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.some(o => o.includes("Marketplace"))).toBe(true);
  });
  it("documentation states it does not own Notifications", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.some(o => o.includes("Notifications"))).toBe(true);
  });
  it("documentation states it does not own RBAC", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.some(o => o.includes("RBAC"))).toBe(true);
  });
  it("documentation states it does not own Analytics", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.some(o => o.includes("Analytics"))).toBe(true);
  });
  it("documentation states it does not own Reports", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.some(o => o.includes("Reports"))).toBe(true);
  });
  it("documentation states it does not own Business Intelligence", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.some(o => o.includes("Business Intelligence"))).toBe(true);
  });
  it("documentation states it does not own Sessions", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.some(o => o.includes("Sessions"))).toBe(true);
  });
  it("documentation states it owns Structured Logs", () => {
    expect(generateTelemetryDocumentation().ownership.owns.some(o => o.includes("Structured Logs"))).toBe(true);
  });
  it("documentation states it owns Metrics", () => {
    expect(generateTelemetryDocumentation().ownership.owns.some(o => o.includes("Metrics"))).toBe(true);
  });
  it("documentation states it owns Traces", () => {
    expect(generateTelemetryDocumentation().ownership.owns.some(o => o.includes("Traces"))).toBe(true);
  });
  it("documentation states it owns Health Checks", () => {
    expect(generateTelemetryDocumentation().ownership.owns.some(o => o.includes("Health Checks"))).toBe(true);
  });
});

// ===========================================================================
// Additional Edge Cases
// ===========================================================================
describe("Telemetry — Additional Edge Cases", () => {
  it("supports all 10 service categories", () => {
    const cats = supportsAllServiceCategories();
    expect(cats).toContain("core");
    expect(cats).toContain("data");
    expect(cats).toContain("compute");
    expect(cats).toContain("communication");
    expect(cats).toContain("integration");
    expect(cats).toContain("analytics");
    expect(cats).toContain("ai");
    expect(cats).toContain("edge");
    expect(cats).toContain("external");
    expect(cats).toContain("platform");
  });
  it("supports all 4 service criticalities", () => {
    const c = supportsAllServiceCriticalities();
    expect(c).toContain("critical");
    expect(c).toContain("high");
    expect(c).toContain("medium");
    expect(c).toContain("low");
  });
  it("supports all 6 metric types", () => {
    const t = supportsAllMetricTypes();
    expect(t).toContain("counter");
    expect(t).toContain("gauge");
    expect(t).toContain("histogram");
    expect(t).toContain("timer");
    expect(t).toContain("percentile");
    expect(t).toContain("summary");
  });
  it("supports all 6 log levels", () => {
    const l = supportsAllLogLevels();
    expect(l).toContain("trace");
    expect(l).toContain("debug");
    expect(l).toContain("info");
    expect(l).toContain("warn");
    expect(l).toContain("error");
    expect(l).toContain("fatal");
  });
  it("supports all 5 span kinds", () => {
    const k = supportsAllSpanKinds();
    expect(k).toContain("internal");
    expect(k).toContain("server");
    expect(k).toContain("client");
    expect(k).toContain("producer");
    expect(k).toContain("consumer");
  });
  it("supports all 5 health statuses", () => {
    const s = supportsAllHealthStatuses();
    expect(s).toContain("healthy");
    expect(s).toContain("warning");
    expect(s).toContain("degraded");
    expect(s).toContain("offline");
    expect(s).toContain("maintenance");
  });
  it("supports all 5 dependency types", () => {
    const t = supportsAllDependencyTypes();
    expect(t).toContain("sync");
    expect(t).toContain("async");
    expect(t).toContain("data");
    expect(t).toContain("network");
    expect(t).toContain("external");
  });
  it("supports all 5 queue types", () => {
    const t = supportsAllQueueTypes();
    expect(t).toContain("redis");
    expect(t).toContain("rabbitmq");
    expect(t).toContain("kafka");
    expect(t).toContain("bullmq");
    expect(t).toContain("custom");
  });
  it("supports all 8 error categories", () => {
    const c = supportsAllErrorCategories();
    expect(c).toContain("system");
    expect(c).toContain("network");
    expect(c).toContain("database");
    expect(c).toContain("auth");
    expect(c).toContain("config");
    expect(c).toContain("external");
    expect(c).toContain("logic");
    expect(c).toContain("unknown");
  });
  it("supports all 4 error severities", () => {
    const s = supportsAllErrorSeverities();
    expect(s).toContain("low");
    expect(s).toContain("medium");
    expect(s).toContain("high");
    expect(s).toContain("critical");
  });
  it("supports all 8 alert conditions", () => {
    const c = supportsAllAlertConditions();
    expect(c).toContain("threshold");
    expect(c).toContain("error_rate");
    expect(c).toContain("latency");
    expect(c).toContain("memory");
    expect(c).toContain("cpu");
    expect(c).toContain("queue_size");
    expect(c).toContain("heartbeat_missed");
    expect(c).toContain("custom");
  });
  it("supports all 5 alert severities", () => {
    const s = supportsAllAlertSeverities();
    expect(s).toContain("info");
    expect(s).toContain("warning");
    expect(s).toContain("minor");
    expect(s).toContain("major");
    expect(s).toContain("critical");
  });
  it("supports all 4 alert statuses", () => {
    const s = supportsAllAlertStatuses();
    expect(s).toContain("active");
    expect(s).toContain("acknowledged");
    expect(s).toContain("resolved");
    expect(s).toContain("suppressed");
  });
  it("supports all 4 incident severities", () => {
    const s = supportsAllIncidentSeverities();
    expect(s).toContain("sev1");
    expect(s).toContain("sev2");
    expect(s).toContain("sev3");
    expect(s).toContain("sev4");
  });
  it("supports all 6 incident statuses", () => {
    const s = supportsAllIncidentStatuses();
    expect(s).toContain("open");
    expect(s).toContain("investigating");
    expect(s).toContain("identified");
    expect(s).toContain("monitoring");
    expect(s).toContain("resolved");
    expect(s).toContain("closed");
  });
  it("supports all 12 diagnostic check types", () => {
    expect(supportsAllDiagnosticCheckTypes().length).toBe(12);
  });
  it("supports all 4 diagnostic check statuses", () => {
    expect(supportsAllDiagnosticCheckStatuses().length).toBe(4);
  });
  it("supports all 5 SLO types", () => {
    const t = supportsAllSLOTypes();
    expect(t).toContain("availability");
    expect(t).toContain("latency");
    expect(t).toContain("error_rate");
    expect(t).toContain("throughput");
    expect(t).toContain("custom");
  });
  it("supports all 6 export formats", () => {
    const f = supportsAllExportFormats();
    expect(f).toContain("prometheus");
    expect(f).toContain("grafana");
    expect(f).toContain("opentelemetry");
    expect(f).toContain("datadog");
    expect(f).toContain("cloudwatch");
    expect(f).toContain("azure_monitor");
  });
  it("documentation lists 25 systems", () => {
    expect(generateTelemetryDocumentation().systems.length).toBe(25);
  });
  it("documentation lists 19 events", () => {
    expect(generateTelemetryDocumentation().events.length).toBe(19);
  });
  it("documentation lists 20+ owned items", () => {
    expect(generateTelemetryDocumentation().ownership.owns.length).toBeGreaterThanOrEqual(20);
  });
  it("documentation lists 9+ not-owned items", () => {
    expect(generateTelemetryDocumentation().ownership.doesNotOwn.length).toBeGreaterThanOrEqual(9);
  });
  it("developer integration has 30+ public APIs", () => {
    expect(getDeveloperIntegration().publicAPIs.length).toBeGreaterThanOrEqual(30);
  });
  it("developer integration has 15+ extension hooks", () => {
    expect(getDeveloperIntegration().extensionHooks.length).toBeGreaterThanOrEqual(15);
  });
  it("developer integration has 10+ webhooks", () => {
    expect(getDeveloperIntegration().webhooks.length).toBeGreaterThanOrEqual(10);
  });
  it("documentation system 22 is Operational Dashboard", () => {
    expect(generateTelemetryDocumentation().systems[21].name).toBe("Operational Dashboard");
  });
  it("documentation system 23 is Export Platform", () => {
    expect(generateTelemetryDocumentation().systems[22].name).toBe("Export Platform");
  });
  it("documentation system 19 is Diagnostics Engine", () => {
    expect(generateTelemetryDocumentation().systems[18].name).toBe("Diagnostics Engine");
  });
  it("documentation system 20 is SLO Platform", () => {
    expect(generateTelemetryDocumentation().systems[19].name).toBe("SLO Platform");
  });
  it("AlertTriggered payload includes alertId", () => {
    const doc = generateTelemetryDocumentation();
    const e = doc.events.find(ev => ev.type === "AlertTriggered");
    expect(e?.payload).toContain("alertId");
  });
  it("IncidentOpened payload includes incidentId", () => {
    const doc = generateTelemetryDocumentation();
    const e = doc.events.find(ev => ev.type === "IncidentOpened");
    expect(e?.payload).toContain("incidentId");
  });
  it("TraceCompleted payload includes traceId", () => {
    const doc = generateTelemetryDocumentation();
    const e = doc.events.find(ev => ev.type === "TraceCompleted");
    expect(e?.payload).toContain("traceId");
  });
  it("SnapshotCreated payload includes snapshotId", () => {
    const doc = generateTelemetryDocumentation();
    const e = doc.events.find(ev => ev.type === "SnapshotCreated");
    expect(e?.payload).toContain("snapshotId");
  });
  it("metric supports unit", () => {
    const m = defineMetric({ key: "k", name: "K", type: "gauge", unit: "ms" });
    expect(m.unit).toBe("ms");
  });
  it("metric supports namespace", () => {
    const m = defineMetric({ key: "k", name: "K", type: "counter", namespace: "http" });
    expect(m.namespace).toBe("http");
  });
  it("metric default unit null", () => {
    expect(defineMetric({ key: "k", name: "K", type: "counter" }).unit).toBeNull();
  });
  it("metric default namespace default", () => {
    expect(defineMetric({ key: "k", name: "K", type: "counter" }).namespace).toBe("default");
  });
  it("log default serviceId null", () => {
    expect(log({ level: "info", message: "m" }).serviceId).toBeNull();
  });
  it("log default correlationId null", () => {
    expect(log({ level: "info", message: "m" }).correlationId).toBeNull();
  });
  it("log default userId null", () => {
    expect(log({ level: "info", message: "m" }).userId).toBeNull();
  });
  it("span default parentId null for root", () => {
    const { rootSpan } = startTrace({});
    expect(rootSpan.parentId).toBeNull();
  });
  it("span default status unset", () => {
    const { rootSpan } = startTrace({});
    expect(rootSpan.status).toBe("unset");
  });
  it("span default durationMs null", () => {
    const { rootSpan } = startTrace({});
    expect(rootSpan.durationMs).toBeNull();
  });
  it("span default attributes empty", () => {
    const { rootSpan } = startTrace({});
    expect(Object.keys(rootSpan.attributes).length).toBe(0);
  });
  it("span default events empty", () => {
    const { rootSpan } = startTrace({});
    expect(rootSpan.events.length).toBe(0);
  });
  it("trace default endedAt null", () => {
    const { trace } = startTrace({});
    expect(trace.endedAt).toBeNull();
  });
  it("trace default durationMs null", () => {
    const { trace } = startTrace({});
    expect(trace.durationMs).toBeNull();
  });
  it("alert default status active", () => {
    expect(triggerAlert({ title: "X", description: "Y" }).status).toBe("active");
  });
  it("alert default acknowledgedAt null", () => {
    expect(triggerAlert({ title: "X", description: "Y" }).acknowledgedAt).toBeNull();
  });
  it("alert default resolvedAt null", () => {
    expect(triggerAlert({ title: "X", description: "Y" }).resolvedAt).toBeNull();
  });
  it("incident default owner null", () => {
    expect(openIncident({ title: "X", severity: "sev1" }).owner).toBeNull();
  });
  it("incident default rootCause null", () => {
    expect(openIncident({ title: "X", severity: "sev1" }).rootCause).toBeNull();
  });
  it("incident default resolution null", () => {
    expect(openIncident({ title: "X", severity: "sev1" }).resolution).toBeNull();
  });
  it("incident default resolvedAt null", () => {
    expect(openIncident({ title: "X", severity: "sev1" }).resolvedAt).toBeNull();
  });
  it("incident default closedAt null", () => {
    expect(openIncident({ title: "X", severity: "sev1" }).closedAt).toBeNull();
  });
  it("SLO default windowDays 30", () => {
    expect(createSLO({ name: "X", target: 0.99 }).windowDays).toBe(30);
  });
  it("SLO default type availability", () => {
    expect(createSLO({ name: "X", target: 0.99 }).type).toBe("availability");
  });
  it("error default category unknown", () => {
    expect(registerError({ code: "X", message: "x" }).category).toBe("unknown");
  });
  it("error default severity medium", () => {
    expect(registerError({ code: "X", message: "x" }).severity).toBe("medium");
  });
  it("error default occurrences 0", () => {
    expect(registerError({ code: "X", message: "x" }).occurrences).toBe(0);
  });
  it("error default remediation null", () => {
    expect(registerError({ code: "X", message: "x" }).remediation).toBeNull();
  });
  it("alert rule default operator gt", () => {
    expect(createAlertRule({ name: "X", condition: "cpu", threshold: 90 }).operator).toBe("gt");
  });
  it("alert rule default windowMinutes 5", () => {
    expect(createAlertRule({ name: "X", condition: "cpu", threshold: 90 }).windowMinutes).toBe(5);
  });
  it("alert rule default severity warning", () => {
    expect(createAlertRule({ name: "X", condition: "cpu", threshold: 90 }).severity).toBe("warning");
  });
  it("dependency default type sync", () => {
    expect(registerDependency({ fromServiceId: "s1", toServiceId: "s2" }).type).toBe("sync");
  });
  it("dependency default status active", () => {
    expect(registerDependency({ fromServiceId: "s1", toServiceId: "s2" }).status).toBe("active");
  });
  it("dependency default criticality medium", () => {
    expect(registerDependency({ fromServiceId: "s1", toServiceId: "s2" }).criticality).toBe("medium");
  });
  it("queue default type redis", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10 }).type).toBe("redis");
  });
  it("queue default status healthy", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10 }).status).toBe("healthy");
  });
  it("profile default hotPath false for fast", () => {
    expect(recordProfileSample({ serviceId: "s1", method: "m", durationMs: 50 }).hotPath).toBe(false);
  });
  // ===== Extra edge cases to reach 500+ =====
  it("service default lastSeenAt null", () => {
    expect(registerService({ name: "s", category: "core", version: "1.0.0" }).lastSeenAt).toBeNull();
  });
  it("service default active true", () => {
    expect(registerService({ name: "s", category: "core", version: "1.0.0" }).active).toBe(true);
  });
  it("service default metadata empty", () => {
    expect(Object.keys(registerService({ name: "s", category: "core", version: "1.0.0" }).metadata).length).toBe(0);
  });
  it("service supports endpoint", () => {
    expect(registerService({ name: "s", category: "core", version: "1.0.0", endpoint: "/api/s" }).endpoint).toBe("/api/s");
  });
  it("service supports owner", () => {
    expect(registerService({ name: "s", category: "core", version: "1.0.0", owner: "team-x" }).owner).toBe("team-x");
  });
  it("service supports metadata", () => {
    expect(registerService({ name: "s", category: "core", version: "1.0.0", metadata: { x: 1 } }).metadata.x).toBe(1);
  });
  it("touch service null for unknown", () => {
    expect(touchService("missing")).toBeNull();
  });
  it("deactivate service null for unknown", () => {
    expect(deactivateService("missing")).toBeNull();
  });
  it("metric default description empty", () => {
    expect(defineMetric({ key: "k", name: "K", type: "counter" }).description).toBe("");
  });
  it("metric default labels empty", () => {
    expect(defineMetric({ key: "k", name: "K", type: "counter" }).labels.length).toBe(0);
  });
  it("metric supports labels list", () => {
    expect(defineMetric({ key: "k", name: "K", type: "counter", labels: ["method", "status"] }).labels.length).toBe(2);
  });
  it("metric supports description", () => {
    expect(defineMetric({ key: "k", name: "K", type: "counter", description: "Total requests" }).description).toBe("Total requests");
  });
  it("metric aggregate null for unknown", () => {
    expect(getMetricAggregateForKey("missing")).toBeNull();
  });
  it("metric sample has timestamp", () => {
    defineMetric({ key: "k", name: "K", type: "counter" });
    expect(recordMetric({ metricKey: "k", value: 1 }).timestamp).toBeDefined();
  });
  it("metric sample has labels", () => {
    defineMetric({ key: "k", name: "K", type: "counter" });
    const s = recordMetric({ metricKey: "k", value: 1, labels: { env: "prod" } });
    expect(s.labels.env).toBe("prod");
  });
  it("log has id", () => {
    expect(log({ level: "info", message: "m" }).id).toBeDefined();
  });
  it("log has timestamp", () => {
    expect(log({ level: "info", message: "m" }).timestamp).toBeDefined();
  });
  it("log default context empty", () => {
    expect(Object.keys(log({ level: "info", message: "m" }).context).length).toBe(0);
  });
  it("log supports context", () => {
    expect(log({ level: "info", message: "m", context: { x: 1 } }).context.x).toBe(1);
  });
  it("log supports serviceId", () => {
    expect(log({ level: "info", message: "m", serviceId: "s1" }).serviceId).toBe("s1");
  });
  it("log supports requestId", () => {
    expect(log({ level: "info", message: "m", requestId: "r1" }).requestId).toBe("r1");
  });
  it("logTrace returns trace level", () => {
    expect(logTrace("m").level).toBe("trace");
  });
  it("logDebug returns debug level", () => {
    expect(logDebug("m").level).toBe("debug");
  });
  it("logInfo returns info level", () => {
    expect(logInfo("m").level).toBe("info");
  });
  it("logWarn returns warn level", () => {
    expect(logWarn("m").level).toBe("warn");
  });
  it("logError returns error level", () => {
    expect(logError("m").level).toBe("error");
  });
  it("logFatal returns fatal level", () => {
    expect(logFatal("m").level).toBe("fatal");
  });
  it("log supports exception stack", () => {
    const e = log({ level: "error", message: "m", exception: { type: "Error", message: "x", stack: "trace" } });
    expect(e.exception?.stack).toBe("trace");
  });
  it("listLogs returns empty when none", () => {
    expect(listLogs().length).toBe(0);
  });
  it("listLogs respects limit", () => {
    for (let i = 0; i < 10; i++) logInfo(`m${i}`);
    expect(listLogs(undefined, undefined, 5).length).toBe(5);
  });
  it("getLogsForService returns empty for unknown", () => {
    expect(getLogsForService("missing").length).toBe(0);
  });
  it("getLogsForCorrelation returns empty for unknown", () => {
    expect(getLogsForCorrelation("missing").length).toBe(0);
  });
  it("trace has rootSpanId", () => {
    const { trace, rootSpan } = startTrace({});
    expect(trace.rootSpanId).toBe(rootSpan.id);
  });
  it("trace has spans array", () => {
    const { trace } = startTrace({});
    expect(Array.isArray(trace.spans)).toBe(true);
  });
  it("trace default status unset", () => {
    const { trace } = startTrace({});
    expect(trace.status).toBe("unset");
  });
  it("span has traceId", () => {
    const { rootSpan } = startTrace({});
    expect(rootSpan.traceId).toBeDefined();
  });
  it("span has serviceId", () => {
    const { rootSpan } = startTrace({});
    expect(rootSpan.serviceId).toBeDefined();
  });
  it("span default kind internal", () => {
    const { rootSpan } = startTrace({});
    expect(rootSpan.kind).toBe("internal");
  });
  it("span supports kind server", () => {
    const { trace } = startTrace({});
    const s = startSpan({ traceId: trace.id, name: "x", serviceId: "s1", kind: "server" });
    expect(s.kind).toBe("server");
  });
  it("span supports kind client", () => {
    const { trace } = startTrace({});
    const s = startSpan({ traceId: trace.id, name: "x", serviceId: "s1", kind: "client" });
    expect(s.kind).toBe("client");
  });
  it("span supports kind producer", () => {
    const { trace } = startTrace({});
    const s = startSpan({ traceId: trace.id, name: "x", serviceId: "s1", kind: "producer" });
    expect(s.kind).toBe("producer");
  });
  it("span supports kind consumer", () => {
    const { trace } = startTrace({});
    const s = startSpan({ traceId: trace.id, name: "x", serviceId: "s1", kind: "consumer" });
    expect(s.kind).toBe("consumer");
  });
  it("addSpanAttribute null for unknown span", () => {
    expect(addSpanAttribute("missing", "k", "v")).toBeNull();
  });
  it("addSpanEvent null for unknown span", () => {
    expect(addSpanEvent("missing", "name")).toBeNull();
  });
  it("finishSpan null for unknown span", () => {
    expect(finishSpan("missing")).toBeNull();
  });
  it("getTraceById null for unknown", () => {
    expect(getTraceById("missing")).toBeNull();
  });
  it("listTraces returns empty when none", () => {
    expect(listTraces().length).toBe(0);
  });
  it("getTraceSpans returns empty for unknown trace", () => {
    expect(getTraceSpans("missing").length).toBe(0);
  });
  it("correlation has startedAt", () => {
    expect(createCorrelationContext({}).startedAt).toBeDefined();
  });
  it("correlation default metadata empty", () => {
    expect(Object.keys(createCorrelationContext({}).metadata).length).toBe(0);
  });
  it("correlation supports metadata", () => {
    expect(createCorrelationContext({ metadata: { x: 1 } }).metadata.x).toBe(1);
  });
  it("correlation default parentCorrelationId null", () => {
    expect(createCorrelationContext({}).parentCorrelationId).toBeNull();
  });
  it("correlation default traceId null", () => {
    expect(createCorrelationContext({}).traceId).toBeNull();
  });
  it("correlation default spanId null", () => {
    expect(createCorrelationContext({}).spanId).toBeNull();
  });
  it("correlation default requestId null", () => {
    expect(createCorrelationContext({}).requestId).toBeNull();
  });
  it("correlation default userId null", () => {
    expect(createCorrelationContext({}).userId).toBeNull();
  });
  it("correlation default serviceId null", () => {
    expect(createCorrelationContext({}).serviceId).toBeNull();
  });
  it("getCorrelationContext null for unknown", () => {
    expect(getCorrelationContext("missing")).toBeNull();
  });
  it("listCorrelations returns empty when none", () => {
    expect(listCorrelations().length).toBe(0);
  });
  it("deriveCorrelation inherits metadata", () => {
    const parent = createCorrelationContext({ metadata: { x: 1 } });
    const child = deriveCorrelation(parent.correlationId);
    expect(child.metadata.x).toBe(1);
  });
  it("health check has id", () => {
    expect(recordHealthCheck({ serviceId: "s1", status: "healthy" }).id).toBeDefined();
  });
  it("health check has checkedAt", () => {
    expect(recordHealthCheck({ serviceId: "s1", status: "healthy" }).checkedAt).toBeDefined();
  });
  it("health check default responseTimeMs 0", () => {
    expect(recordHealthCheck({ serviceId: "s1", status: "healthy" }).responseTimeMs).toBe(0);
  });
  it("health check default message null", () => {
    expect(recordHealthCheck({ serviceId: "s1", status: "healthy" }).message).toBeNull();
  });
  it("health check supports message", () => {
    expect(recordHealthCheck({ serviceId: "s1", status: "healthy", message: "all good" }).message).toBe("all good");
  });
  it("health check supports details", () => {
    expect(recordHealthCheck({ serviceId: "s1", status: "healthy", details: { x: 1 } }).details.x).toBe(1);
  });
  it("getLatestHealth null for unknown", () => {
    expect(getLatestHealth("missing")).toBeNull();
  });
  it("listHealthChecks returns empty when none", () => {
    expect(listHealthChecks().length).toBe(0);
  });
  it("platform health empty when no checks", () => {
    const ph = getPlatformHealth();
    expect(ph.totalServices).toBe(0);
    expect(ph.healthy).toBe(0);
  });
  it("heartbeat has id", () => {
    expect(sendHeartbeat({ serviceId: "s1" }).id).toBeDefined();
  });
  it("heartbeat has sentAt", () => {
    expect(sendHeartbeat({ serviceId: "s1" }).sentAt).toBeDefined();
  });
  it("heartbeat has receivedAt", () => {
    expect(sendHeartbeat({ serviceId: "s1" }).receivedAt).toBeDefined();
  });
  it("heartbeat default metadata empty", () => {
    expect(Object.keys(sendHeartbeat({ serviceId: "s1" }).metadata).length).toBe(0);
  });
  it("heartbeat supports metadata", () => {
    expect(sendHeartbeat({ serviceId: "s1", metadata: { x: 1 } }).metadata.x).toBe(1);
  });
  it("heartbeat stats null for unknown", () => {
    expect(getHeartbeatStatsForService("missing")).toBeNull();
  });
  it("heartbeat stats default missedCount 0", () => {
    sendHeartbeat({ serviceId: "s1" });
    expect(getHeartbeatStatsForService("s1")?.missedCount).toBe(0);
  });
  it("dependency has id", () => {
    expect(registerDependency({ fromServiceId: "s1", toServiceId: "s2" }).id).toBeDefined();
  });
  it("dependency default latencyMs null", () => {
    expect(registerDependency({ fromServiceId: "s1", toServiceId: "s2" }).latencyMs).toBeNull();
  });
  it("dependency default callRate 0", () => {
    expect(registerDependency({ fromServiceId: "s1", toServiceId: "s2" }).callRate).toBe(0);
  });
  it("dependency default errorRate 0", () => {
    expect(registerDependency({ fromServiceId: "s1", toServiceId: "s2" }).errorRate).toBe(0);
  });
  it("dependency supports latencyMs", () => {
    expect(registerDependency({ fromServiceId: "s1", toServiceId: "s2", latencyMs: 50 }).latencyMs).toBe(50);
  });
  it("dependency supports callRate", () => {
    expect(registerDependency({ fromServiceId: "s1", toServiceId: "s2", callRate: 100 }).callRate).toBe(100);
  });
  it("dependency supports errorRate", () => {
    expect(registerDependency({ fromServiceId: "s1", toServiceId: "s2", errorRate: 0.05 }).errorRate).toBe(0.05);
  });
  it("getDependencyById null for unknown", () => {
    expect(getDependencyById("missing")).toBeNull();
  });
  it("updateDependencyStatus null for unknown", () => {
    expect(updateDependencyStatus("missing", "down")).toBeNull();
  });
  it("getDependencyGraph empty when no deps", () => {
    const g = getDependencyGraph();
    expect(g.nodes.length).toBe(0);
    expect(g.edges.length).toBe(0);
  });
  it("performance snapshot has id", () => {
    expect(recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 50, cpuPercent: 30, memoryMb: 100 }).id).toBeDefined();
  });
  it("performance snapshot has timestamp", () => {
    expect(recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 50, cpuPercent: 30, memoryMb: 100 }).timestamp).toBeDefined();
  });
  it("performance default memoryPercent 0", () => {
    expect(recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 50, cpuPercent: 30, memoryMb: 100 }).memoryPercent).toBe(0);
  });
  it("performance default dbQueryMs null", () => {
    expect(recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 50, cpuPercent: 30, memoryMb: 100 }).dbQueryMs).toBeNull();
  });
  it("performance default cacheHitRate null", () => {
    expect(recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 50, cpuPercent: 30, memoryMb: 100 }).cacheHitRate).toBeNull();
  });
  it("performance default activeConnections 0", () => {
    expect(recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 50, cpuPercent: 30, memoryMb: 100 }).activeConnections).toBe(0);
  });
  it("performance supports activeConnections", () => {
    expect(recordPerformanceSnapshot({ serviceId: "s1", responseTimeMs: 50, cpuPercent: 30, memoryMb: 100, activeConnections: 50 }).activeConnections).toBe(50);
  });
  it("listPerformanceSnapshots returns empty for unknown", () => {
    expect(listPerformanceSnapshots("missing").length).toBe(0);
  });
  it("queue metric has id", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10 }).id).toBeDefined();
  });
  it("queue metric has timestamp", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10 }).timestamp).toBeDefined();
  });
  it("queue default consumers 0", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10 }).consumers).toBe(0);
  });
  it("queue default publishRate 0", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10 }).publishRate).toBe(0);
  });
  it("queue default consumeRate 0", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10 }).consumeRate).toBe(0);
  });
  it("queue default ackRate 0", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10 }).ackRate).toBe(0);
  });
  it("queue default nackRate 0", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10 }).nackRate).toBe(0);
  });
  it("queue default deadLetterCount 0", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10 }).deadLetterCount).toBe(0);
  });
  it("queue default avgLatencyMs 0", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10 }).avgLatencyMs).toBe(0);
  });
  it("queue supports consumers", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10, consumers: 5 }).consumers).toBe(5);
  });
  it("queue supports deadLetterCount", () => {
    expect(recordQueueMetric({ queueName: "q", size: 10, deadLetterCount: 3 }).deadLetterCount).toBe(3);
  });
  it("queue summary empty when no queues", () => {
    const s = getQueueSummary();
    expect(s.totalQueues).toBe(0);
    expect(s.totalDepth).toBe(0);
  });
  it("event monitor entry has id", () => {
    expect(recordPublishedEvent({ eventType: "x", producerServiceId: "s1" }).id).toBeDefined();
  });
  it("event monitor entry has correlationId", () => {
    expect(recordPublishedEvent({ eventType: "x", producerServiceId: "s1" }).correlationId).toBeDefined();
  });
  it("event monitor published entry has consumer null", () => {
    expect(recordPublishedEvent({ eventType: "x", producerServiceId: "s1" }).consumerServiceId).toBeNull();
  });
  it("event monitor published entry has consumedAt null", () => {
    expect(recordPublishedEvent({ eventType: "x", producerServiceId: "s1" }).consumedAt).toBeNull();
  });
  it("event monitor published entry has latencyMs null", () => {
    expect(recordPublishedEvent({ eventType: "x", producerServiceId: "s1" }).latencyMs).toBeNull();
  });
  it("event monitor consumed entry has consumer", () => {
    const e = recordConsumedEvent({ eventType: "x", producerServiceId: "s1", consumerServiceId: "s2", publishedAt: pastIso(1) });
    expect(e.consumerServiceId).toBe("s2");
  });
  it("event monitor consumed entry has consumedAt", () => {
    const e = recordConsumedEvent({ eventType: "x", producerServiceId: "s1", consumerServiceId: "s2", publishedAt: pastIso(1) });
    expect(e.consumedAt).not.toBeNull();
  });
  it("event monitor retry entry has retryCount", () => {
    const e = recordEventRetry({ eventType: "x", producerServiceId: "s1", consumerServiceId: "s2", retryCount: 3 });
    expect(e.retryCount).toBe(3);
  });
  it("event monitor stats empty when no events", () => {
    const s = generateEventMonitorStats();
    expect(s.totalPublished).toBe(0);
    expect(s.totalConsumed).toBe(0);
  });
  it("event monitor stats byEventType", () => {
    recordPublishedEvent({ eventType: "user.created", producerServiceId: "s1" });
    recordPublishedEvent({ eventType: "user.updated", producerServiceId: "s1" });
    const s = generateEventMonitorStats();
    expect(Object.keys(s.byEventType).length).toBe(2);
  });
  it("failure cluster has signature", () => {
    expect(recordFailure({ exceptionType: "Error", message: "fail" }).signature).toBeDefined();
  });
  it("failure cluster default rootCause null", () => {
    expect(recordFailure({ exceptionType: "Error", message: "fail" }).rootCause).toBeNull();
  });
  it("failure cluster default relatedClusters empty", () => {
    expect(recordFailure({ exceptionType: "Error", message: "fail" }).relatedClusters.length).toBe(0);
  });
  it("failure cluster default sampleStackTrace null", () => {
    expect(recordFailure({ exceptionType: "Error", message: "fail" }).sampleStackTrace).toBeNull();
  });
  it("failure cluster captures stackTrace", () => {
    const c = recordFailure({ exceptionType: "Error", message: "fail", stackTrace: "at foo()" });
    expect(c.sampleStackTrace).toBe("at foo()");
  });
  it("getFailureClusterById null for unknown", () => {
    expect(getFailureClusterById("missing")).toBeNull();
  });
  it("setRootCause null for unknown", () => {
    expect(setRootCause("missing", "x")).toBeNull();
  });
  it("linkFailureClusters null for unknown", () => {
    expect(linkFailureClusters("missing", "x")).toBeNull();
  });
  it("error default version 1.0.0", () => {
    expect(registerError({ code: "X", message: "x" }).version).toBe("1.0.0");
  });
  it("error supports version", () => {
    expect(registerError({ code: "X", message: "x", version: "2.0.0" }).version).toBe("2.0.0");
  });
  it("error default description empty", () => {
    expect(registerError({ code: "X", message: "x" }).description).toBe("");
  });
  it("error supports description", () => {
    expect(registerError({ code: "X", message: "x", description: "More info" }).description).toBe("More info");
  });
  it("error default active true", () => {
    expect(registerError({ code: "X", message: "x" }).active).toBe(true);
  });
  it("error supports metadata", () => {
    expect(registerError({ code: "X", message: "x", metadata: { x: 1 } }).metadata.x).toBe(1);
  });
  it("getErrorById null for unknown", () => {
    expect(getErrorById("missing")).toBeNull();
  });
  it("getErrorByErrorCode null for unknown", () => {
    expect(getErrorByErrorCode("missing")).toBeNull();
  });
  it("recordErrorOccurrence null for unknown", () => {
    expect(recordErrorOccurrence("missing")).toBeNull();
  });
  it("deactivateError null for unknown", () => {
    expect(deactivateError("missing")).toBeNull();
  });
  it("alert rule default metricKey null", () => {
    expect(createAlertRule({ name: "X", condition: "cpu", threshold: 90 }).metricKey).toBeNull();
  });
  it("alert rule default serviceId null", () => {
    expect(createAlertRule({ name: "X", condition: "cpu", threshold: 90 }).serviceId).toBeNull();
  });
  it("alert rule supports metricKey", () => {
    expect(createAlertRule({ name: "X", condition: "threshold", threshold: 100, metricKey: "cpu" }).metricKey).toBe("cpu");
  });
  it("alert rule supports serviceId", () => {
    expect(createAlertRule({ name: "X", condition: "cpu", threshold: 90, serviceId: "s1" }).serviceId).toBe("s1");
  });
  it("alert rule supports operator", () => {
    expect(createAlertRule({ name: "X", condition: "cpu", threshold: 90, operator: "lt" }).operator).toBe("lt");
  });
  it("alert rule supports severity", () => {
    expect(createAlertRule({ name: "X", condition: "cpu", threshold: 90, severity: "critical" }).severity).toBe("critical");
  });
  it("alert rule supports windowMinutes", () => {
    expect(createAlertRule({ name: "X", condition: "cpu", threshold: 90, windowMinutes: 10 }).windowMinutes).toBe(10);
  });
  it("getAlertRuleById null for unknown", () => {
    expect(getAlertRuleById("missing")).toBeNull();
  });
  it("deactivateAlertRule null for unknown", () => {
    expect(deactivateAlertRule("missing")).toBeNull();
  });
  it("alert default severity warning", () => {
    expect(triggerAlert({ title: "X", description: "Y" }).severity).toBe("warning");
  });
  it("alert default serviceId null", () => {
    expect(triggerAlert({ title: "X", description: "Y" }).serviceId).toBeNull();
  });
  it("alert supports serviceId", () => {
    expect(triggerAlert({ title: "X", description: "Y", serviceId: "s1" }).serviceId).toBe("s1");
  });
  it("alert supports ruleId", () => {
    const r = createAlertRule({ name: "R", condition: "cpu", threshold: 90 });
    const a = triggerAlert({ ruleId: r.id, title: "X", description: "Y" });
    expect(a.ruleId).toBe(r.id);
  });
  it("alert has correlationId", () => {
    expect(triggerAlert({ title: "X", description: "Y" }).correlationId).toBeDefined();
  });
  it("getAlertById null for unknown", () => {
    expect(getAlertById("missing")).toBeNull();
  });
  it("acknowledgeAlert null for unknown", () => {
    expect(acknowledgeAlert("missing", "u")).toBeNull();
  });
  it("resolveAlert null for unknown", () => {
    expect(resolveAlert("missing")).toBeNull();
  });
  it("suppressAlert null for unknown", () => {
    expect(suppressAlert("missing")).toBeNull();
  });
  it("incident default status open", () => {
    expect(openIncident({ title: "X", severity: "sev1" }).status).toBe("open");
  });
  it("incident default serviceId null", () => {
    expect(openIncident({ title: "X", severity: "sev1" }).serviceId).toBeNull();
  });
  it("incident supports serviceId", () => {
    expect(openIncident({ title: "X", severity: "sev1", serviceId: "s1" }).serviceId).toBe("s1");
  });
  it("incident has correlationId", () => {
    expect(openIncident({ title: "X", severity: "sev1" }).correlationId).toBeDefined();
  });
  it("incident timeline has opened event", () => {
    const i = openIncident({ title: "X", severity: "sev1" });
    expect(i.timeline[0].type).toBe("opened");
  });
  it("getIncidentById null for unknown", () => {
    expect(getIncidentById("missing")).toBeNull();
  });
  it("transitionIncident null for unknown", () => {
    expect(transitionIncident("missing", "investigating", "a", "x")).toBeNull();
  });
  it("addIncidentEvent null for unknown", () => {
    expect(addIncidentEvent("missing", "comment", "a", "x")).toBeNull();
  });
  it("setIncidentRootCause null for unknown", () => {
    expect(setIncidentRootCause("missing", "x")).toBeNull();
  });
  it("setIncidentResolution null for unknown", () => {
    expect(setIncidentResolution("missing", "x")).toBeNull();
  });
  it("assignIncidentOwner null for unknown", () => {
    expect(assignIncidentOwner("missing", "x")).toBeNull();
  });
  it("capacity snapshot has id", () => {
    expect(recordCapacitySnapshot({ serviceId: "s1", connections: 1, maxConnections: 10, storageMb: 1, maxStorageMb: 10 }).id).toBeDefined();
  });
  it("capacity snapshot has timestamp", () => {
    expect(recordCapacitySnapshot({ serviceId: "s1", connections: 1, maxConnections: 10, storageMb: 1, maxStorageMb: 10 }).timestamp).toBeDefined();
  });
  it("capacity default bandwidthMbps 0", () => {
    expect(recordCapacitySnapshot({ serviceId: "s1", connections: 1, maxConnections: 10, storageMb: 1, maxStorageMb: 10 }).bandwidthMbps).toBe(0);
  });
  it("capacity default workers 0", () => {
    expect(recordCapacitySnapshot({ serviceId: "s1", connections: 1, maxConnections: 10, storageMb: 1, maxStorageMb: 10 }).workers).toBe(0);
  });
  it("capacity supports workers", () => {
    expect(recordCapacitySnapshot({ serviceId: "s1", connections: 1, maxConnections: 10, storageMb: 1, maxStorageMb: 10, workers: 5, maxWorkers: 10 }).workers).toBe(5);
  });
  it("listCapacitySnapshots empty for unknown", () => {
    expect(listCapacitySnapshots("missing").length).toBe(0);
  });
  it("profile sample has id", () => {
    expect(recordProfileSample({ serviceId: "s1", method: "m", durationMs: 100 }).id).toBeDefined();
  });
  it("profile sample has sampledAt", () => {
    expect(recordProfileSample({ serviceId: "s1", method: "m", durationMs: 100 }).sampledAt).toBeDefined();
  });
  it("profile default memoryMb 0", () => {
    expect(recordProfileSample({ serviceId: "s1", method: "m", durationMs: 100 }).memoryMb).toBe(0);
  });
  it("profile default cpuPercent 0", () => {
    expect(recordProfileSample({ serviceId: "s1", method: "m", durationMs: 100 }).cpuPercent).toBe(0);
  });
  it("profile default callCount 1", () => {
    expect(recordProfileSample({ serviceId: "s1", method: "m", durationMs: 100 }).callCount).toBe(1);
  });
  it("profile supports callCount", () => {
    expect(recordProfileSample({ serviceId: "s1", method: "m", durationMs: 100, callCount: 50 }).callCount).toBe(50);
  });
  it("profile supports memoryMb", () => {
    expect(recordProfileSample({ serviceId: "s1", method: "m", durationMs: 100, memoryMb: 256 }).memoryMb).toBe(256);
  });
  it("profile supports cpuPercent", () => {
    expect(recordProfileSample({ serviceId: "s1", method: "m", durationMs: 100, cpuPercent: 75 }).cpuPercent).toBe(75);
  });
  it("profile supports explicit hotPath", () => {
    expect(recordProfileSample({ serviceId: "s1", method: "m", durationMs: 50, hotPath: true }).hotPath).toBe(true);
  });
  it("listProfileSamples empty for unknown service", () => {
    expect(listProfileSamples("missing").length).toBe(0);
  });
  it("getHotPaths empty when none", () => {
    expect(getHotPaths().length).toBe(0);
  });
  it("getSlowestMethods empty when none", () => {
    expect(getSlowestMethods().length).toBe(0);
  });
  it("platform snapshot has id", () => {
    expect(takePlatformSnapshot({}).id).toBeDefined();
  });
  it("platform snapshot has timestamp", () => {
    expect(takePlatformSnapshot({}).timestamp).toBeDefined();
  });
  it("platform snapshot supports scheduled trigger", () => {
    expect(takePlatformSnapshot({ trigger: "scheduled" }).trigger).toBe("scheduled");
  });
  it("platform snapshot supports diagnostic trigger", () => {
    expect(takePlatformSnapshot({ trigger: "diagnostic" }).trigger).toBe("diagnostic");
  });
  it("platform snapshot supports details", () => {
    expect(takePlatformSnapshot({ details: { x: 1 } }).details.x).toBe(1);
  });
  it("listPlatformSnapshots empty when none", () => {
    expect(listPlatformSnapshots().length).toBe(0);
  });
  it("getLatestSnapshot null when none", () => {
    expect(getLatestSnapshot()).toBeNull();
  });
  it("diagnostic check has id", () => {
    expect(runDiagnosticCheck({ type: "redis_connectivity", message: "OK" }).id).toBeDefined();
  });
  it("diagnostic check has checkedAt", () => {
    expect(runDiagnosticCheck({ type: "redis_connectivity", message: "OK" }).checkedAt).toBeDefined();
  });
  it("diagnostic check default status pass", () => {
    expect(runDiagnosticCheck({ type: "redis_connectivity", message: "OK" }).status).toBe("pass");
  });
  it("diagnostic check default durationMs 0", () => {
    expect(runDiagnosticCheck({ type: "redis_connectivity", message: "OK" }).durationMs).toBe(0);
  });
  it("diagnostic check supports durationMs", () => {
    expect(runDiagnosticCheck({ type: "redis_connectivity", message: "OK", durationMs: 50 }).durationMs).toBe(50);
  });
  it("diagnostic check supports details", () => {
    expect(runDiagnosticCheck({ type: "redis_connectivity", message: "OK", details: { x: 1 } }).details.x).toBe(1);
  });
  it("diagnostic report has id", () => {
    expect(runDiagnosticReport({ checks: [] }).id).toBeDefined();
  });
  it("diagnostic report has triggeredAt", () => {
    expect(runDiagnosticReport({ checks: [] }).triggeredAt).toBeDefined();
  });
  it("diagnostic report supports triggeredBy", () => {
    expect(runDiagnosticReport({ triggeredBy: "admin", checks: [] }).triggeredBy).toBe("admin");
  });
  it("diagnostic report counts skipped", () => {
    const r = runDiagnosticReport({
      checks: [
        { type: "redis_connectivity", serviceId: null, status: "skip", message: "skip", details: {}, durationMs: 0 },
      ],
    });
    expect(r.skipped).toBe(1);
  });
  it("diagnostic report counts warnings", () => {
    const r = runDiagnosticReport({
      checks: [
        { type: "redis_connectivity", serviceId: null, status: "warn", message: "warn", details: {}, durationMs: 0 },
      ],
    });
    expect(r.warnings).toBe(1);
  });
  it("listDiagnosticReports empty when none", () => {
    expect(listDiagnosticReports().length).toBe(0);
  });
  it("SLO default description empty", () => {
    expect(createSLO({ name: "X", target: 0.99 }).description).toBe("");
  });
  it("SLO supports description", () => {
    expect(createSLO({ name: "X", target: 0.99, description: "API availability" }).description).toBe("API availability");
  });
  it("SLO default active true", () => {
    expect(createSLO({ name: "X", target: 0.99 }).active).toBe(true);
  });
  it("SLO supports metadata", () => {
    expect(createSLO({ name: "X", target: 0.99, metadata: { x: 1 } }).metadata.x).toBe(1);
  });
  it("getSLOById null for unknown", () => {
    expect(getSLOById("missing")).toBeNull();
  });
  it("updateSLOStatus null for unknown", () => {
    expect(updateSLOStatus("missing", 0.99)).toBeNull();
  });
  it("getSLOStatusForSLO null for unknown", () => {
    expect(getSLOStatusForSLO("missing")).toBeNull();
  });
  it("SLO status default met", () => {
    const s = createSLO({ name: "X", target: 0.99 });
    expect(getSLOStatusForSLO(s.id)?.status).toBe("met");
  });
  it("SLO status has errorBudgetTotal", () => {
    const s = createSLO({ name: "X", target: 0.99 });
    expect(getSLOStatusForSLO(s.id)?.errorBudgetTotal).toBeCloseTo(0.01, 10);
  });
  it("SLO summary empty when none", () => {
    const s = getSLOSummary();
    expect(s.total).toBe(0);
  });
  it("export config has id", () => {
    expect(registerExportConfig({ format: "prometheus" }).id).toBeDefined();
  });
  it("export config default endpoint null", () => {
    expect(registerExportConfig({ format: "prometheus" }).endpoint).toBeNull();
  });
  it("export config default apiKey null", () => {
    expect(registerExportConfig({ format: "prometheus" }).apiKey).toBeNull();
  });
  it("export config default intervalSeconds 60", () => {
    expect(registerExportConfig({ format: "prometheus" }).intervalSeconds).toBe(60);
  });
  it("export config supports endpoint", () => {
    expect(registerExportConfig({ format: "prometheus", endpoint: "http://x" }).endpoint).toBe("http://x");
  });
  it("export config supports intervalSeconds", () => {
    expect(registerExportConfig({ format: "prometheus", intervalSeconds: 30 }).intervalSeconds).toBe(30);
  });
  it("export config default lastExportedAt null", () => {
    expect(registerExportConfig({ format: "prometheus" }).lastExportedAt).toBeNull();
  });
  it("getExportConfigById null for unknown", () => {
    expect(getExportConfigById("missing")).toBeNull();
  });
  it("markExported null for unknown", () => {
    expect(markExported("missing")).toBeNull();
  });
  it("setExportEnabled null for unknown", () => {
    expect(setExportEnabled("missing", false)).toBeNull();
  });
  it("developer diagnostic report has id", () => {
    expect(generateDeveloperDiagnosticReport({}).id).toBeDefined();
  });
  it("developer diagnostic report has generatedAt", () => {
    expect(generateDeveloperDiagnosticReport({}).generatedAt).toBeDefined();
  });
  it("developer diagnostic report has openTelemetry", () => {
    expect(generateDeveloperDiagnosticReport({}).openTelemetry).toBeDefined();
  });
  it("developer diagnostic report supports samplingRatio", () => {
    const r = generateDeveloperDiagnosticReport({ samplingRatio: 0.5 });
    expect(r.openTelemetry.samplingRatio).toBe(0.5);
  });
  it("developer diagnostic report default samplingRatio 1", () => {
    expect(generateDeveloperDiagnosticReport({}).openTelemetry.samplingRatio).toBe(1);
  });
  it("operational dashboard has updatedAt", () => {
    expect(generateOperationalDashboard().updatedAt).toBeDefined();
  });
  it("operational dashboard has services", () => {
    expect(generateOperationalDashboard().services).toBeDefined();
  });
  it("operational dashboard has events", () => {
    expect(generateOperationalDashboard().events).toBeDefined();
  });
  it("operational dashboard has tracing", () => {
    expect(generateOperationalDashboard().tracing).toBeDefined();
  });
  it("operational dashboard has incidents", () => {
    expect(generateOperationalDashboard().incidents).toBeDefined();
  });
  it("operational dashboard has alerts", () => {
    expect(generateOperationalDashboard().alerts).toBeDefined();
  });
  it("operational dashboard has queues", () => {
    expect(generateOperationalDashboard().queues).toBeDefined();
  });
  it("operational dashboard has capacity", () => {
    expect(generateOperationalDashboard().capacity).toBeDefined();
  });
  it("operational dashboard has slos", () => {
    expect(generateOperationalDashboard().slos).toBeDefined();
  });
  it("documentation has openTelemetryMetadata", () => {
    expect(generateTelemetryDocumentation().openTelemetryMetadata).toBeDefined();
  });
  it("documentation openTelemetryMetadata has serviceName", () => {
    expect(generateTelemetryDocumentation().openTelemetryMetadata.serviceName).toBeDefined();
  });
  it("documentation openTelemetryMetadata has serviceVersion", () => {
    expect(generateTelemetryDocumentation().openTelemetryMetadata.serviceVersion).toBe("1.0.0");
  });
  it("documentation openTelemetryMetadata has samplingRules", () => {
    expect(generateTelemetryDocumentation().openTelemetryMetadata.samplingRules.length).toBeGreaterThan(0);
  });
  it("documentation openTelemetryMetadata has exportFormats", () => {
    expect(generateTelemetryDocumentation().openTelemetryMetadata.exportFormats.length).toBe(6);
  });
  it("documentation system 2 is Metrics Platform", () => {
    expect(generateTelemetryDocumentation().systems[1].name).toBe("Metrics Platform");
  });
  it("documentation system 3 is Structured Logging", () => {
    expect(generateTelemetryDocumentation().systems[2].name).toBe("Structured Logging");
  });
  it("documentation system 4 is Distributed Tracing", () => {
    expect(generateTelemetryDocumentation().systems[3].name).toBe("Distributed Tracing");
  });
  it("documentation system 5 is Correlation Context", () => {
    expect(generateTelemetryDocumentation().systems[4].name).toBe("Correlation Context");
  });
  it("documentation system 6 is Health Monitoring", () => {
    expect(generateTelemetryDocumentation().systems[5].name).toBe("Health Monitoring");
  });
  it("documentation system 7 is Heartbeat Platform", () => {
    expect(generateTelemetryDocumentation().systems[6].name).toBe("Heartbeat Platform");
  });
  it("documentation system 8 is Dependency Graph", () => {
    expect(generateTelemetryDocumentation().systems[7].name).toBe("Dependency Graph");
  });
  it("documentation system 9 is Performance Monitoring", () => {
    expect(generateTelemetryDocumentation().systems[8].name).toBe("Performance Monitoring");
  });
  it("documentation system 10 is Queue Monitoring", () => {
    expect(generateTelemetryDocumentation().systems[9].name).toBe("Queue Monitoring");
  });
  it("documentation system 11 is Event Monitoring", () => {
    expect(generateTelemetryDocumentation().systems[10].name).toBe("Event Monitoring");
  });
  it("documentation system 12 is Failure Analysis", () => {
    expect(generateTelemetryDocumentation().systems[11].name).toBe("Failure Analysis");
  });
  it("documentation system 13 is Error Registry", () => {
    expect(generateTelemetryDocumentation().systems[12].name).toBe("Error Registry");
  });
  it("documentation system 14 is Alert Platform", () => {
    expect(generateTelemetryDocumentation().systems[13].name).toBe("Alert Platform");
  });
  it("documentation system 15 is Incident Timeline", () => {
    expect(generateTelemetryDocumentation().systems[14].name).toBe("Incident Timeline");
  });
  it("documentation system 16 is Capacity Monitoring", () => {
    expect(generateTelemetryDocumentation().systems[15].name).toBe("Capacity Monitoring");
  });
  it("documentation system 17 is Profiling Platform", () => {
    expect(generateTelemetryDocumentation().systems[16].name).toBe("Profiling Platform");
  });
  it("documentation system 18 is Snapshot Platform", () => {
    expect(generateTelemetryDocumentation().systems[17].name).toBe("Snapshot Platform");
  });
  it("documentation system 21 is Developer Diagnostics", () => {
    expect(generateTelemetryDocumentation().systems[20].name).toBe("Developer Diagnostics");
  });
  it("documentation system 24 is Documentation Generator", () => {
    expect(generateTelemetryDocumentation().systems[23].name).toBe("Documentation Generator");
  });
});
