/**
 * In-memory repository for Telemetry Platform. Phase 6G.19.
 * Stateless, Redis-compatible storage abstraction.
 */
import type {
  RegisteredService, MetricDefinition, MetricSample, MetricAggregate,
  LogEntry, TraceSpan, Trace, CorrelationContext,
  HealthCheck, Heartbeat, HeartbeatStats,
  DependencyEdge, PerformanceSnapshot, QueueMetrics,
  EventMonitorEntry, EventMonitorStats, FailureCluster,
  RegisteredError, AlertRule, Alert, Incident, IncidentEvent,
  CapacitySnapshot, ProfileSample, PlatformSnapshot,
  DiagnosticReport, SLODefinition, SLOStatus,
  ExportConfig,
} from "./types";

const services = new Map<string, RegisteredService>();
const metricDefs = new Map<string, MetricDefinition>();
const metricSamples = new Map<string, MetricSample[]>(); // by metricKey
const metricAggregates = new Map<string, MetricAggregate>(); // by metricKey
const logs: LogEntry[] = [];
const spans = new Map<string, TraceSpan>(); // by spanId
const traces = new Map<string, Trace>(); // by traceId
const correlations = new Map<string, CorrelationContext>(); // by correlationId
const healthChecks = new Map<string, HealthCheck[]>();
const heartbeats = new Map<string, Heartbeat[]>(); // by serviceId
const heartbeatStats = new Map<string, HeartbeatStats>(); // by serviceId
const dependencies = new Map<string, DependencyEdge>();
const performanceSnapshots = new Map<string, PerformanceSnapshot[]>();
const queueMetrics = new Map<string, QueueMetrics[]>();
const eventMonitor: EventMonitorEntry[] = [];
const failureClusters = new Map<string, FailureCluster>();
const errors = new Map<string, RegisteredError>();
const alertRules = new Map<string, AlertRule>();
const alerts = new Map<string, Alert>();
const incidents = new Map<string, Incident>();
const capacitySnapshots = new Map<string, CapacitySnapshot[]>();
const profileSamples = new Map<string, ProfileSample[]>(); // by serviceId
const platformSnapshots: PlatformSnapshot[] = [];
const diagnosticReports: DiagnosticReport[] = [];
const sloDefinitions = new Map<string, SLODefinition>();
const sloStatuses = new Map<string, SLOStatus>(); // by sloId
const exportConfigs = new Map<string, ExportConfig>();

// === Services ===
export const storeService = (s: RegisteredService) => services.set(s.id, s);
export const getService = (id: string) => services.get(id) ?? null;
export const getServiceByName = (name: string) => Array.from(services.values()).find(s => s.name === name) ?? null;
export const getAllServices = () => Array.from(services.values());

// === Metric definitions ===
export const storeMetricDef = (m: MetricDefinition) => metricDefs.set(m.id, m);
export const getMetricDef = (id: string) => metricDefs.get(id) ?? null;
export const getMetricDefByKey = (key: string) => Array.from(metricDefs.values()).find(m => m.key === key) ?? null;
export const getAllMetricDefs = () => Array.from(metricDefs.values());

// === Metric samples ===
export const storeMetricSample = (s: MetricSample) => {
  const list = metricSamples.get(s.metricKey) ?? [];
  list.push(s);
  if (list.length > 10000) list.shift();
  metricSamples.set(s.metricKey, list);
};
export const getMetricSamples = (metricKey: string) => metricSamples.get(metricKey) ?? [];
export const getAllMetricSamples = () => {
  const all: MetricSample[] = [];
  for (const list of metricSamples.values()) all.push(...list);
  return all;
};

// === Metric aggregates ===
export const storeMetricAggregate = (a: MetricAggregate) => metricAggregates.set(a.metricKey, a);
export const getMetricAggregate = (metricKey: string) => metricAggregates.get(metricKey) ?? null;
export const getAllMetricAggregates = () => Array.from(metricAggregates.values());

// === Logs (immutable, append-only) ===
export const appendLog = (l: LogEntry) => logs.push(l);
export const getAllLogs = () => logs.slice();
export const getLogsByCorrelation = (correlationId: string) => logs.filter(l => l.correlationId === correlationId);
export const getLogsByService = (serviceId: string) => logs.filter(l => l.serviceId === serviceId);

// === Spans ===
export const storeSpan = (s: TraceSpan) => spans.set(s.id, s);
export const getSpan = (id: string) => spans.get(id) ?? null;
export const getSpansByTrace = (traceId: string) => Array.from(spans.values()).filter(s => s.traceId === traceId);

// === Traces ===
export const storeTrace = (t: Trace) => traces.set(t.id, t);
export const getTrace = (id: string) => traces.get(id) ?? null;
export const getAllTraces = () => Array.from(traces.values());

// === Correlations ===
export const storeCorrelation = (c: CorrelationContext) => correlations.set(c.correlationId, c);
export const getCorrelation = (id: string) => correlations.get(id) ?? null;
export const getAllCorrelations = () => Array.from(correlations.values());

// === Health checks ===
export const storeHealthCheck = (h: HealthCheck) => {
  const list = healthChecks.get(h.serviceId) ?? [];
  list.push(h);
  if (list.length > 1000) list.shift();
  healthChecks.set(h.serviceId, list);
};
export const getHealthChecks = (serviceId: string) => healthChecks.get(serviceId) ?? [];
export const getAllHealthChecks = () => {
  const all: HealthCheck[] = [];
  for (const list of healthChecks.values()) all.push(...list);
  return all;
};

// === Heartbeats ===
export const storeHeartbeat = (h: Heartbeat) => {
  const list = heartbeats.get(h.serviceId) ?? [];
  list.push(h);
  if (list.length > 500) list.shift();
  heartbeats.set(h.serviceId, list);
};
export const getHeartbeats = (serviceId: string) => heartbeats.get(serviceId) ?? [];
export const storeHeartbeatStats = (s: HeartbeatStats) => heartbeatStats.set(s.serviceId, s);
export const getHeartbeatStats = (serviceId: string) => heartbeatStats.get(serviceId) ?? null;

// === Dependencies ===
export const storeDependency = (d: DependencyEdge) => dependencies.set(d.id, d);
export const getDependency = (id: string) => dependencies.get(id) ?? null;
export const getAllDependencies = () => Array.from(dependencies.values());

// === Performance snapshots ===
export const storePerformanceSnapshot = (p: PerformanceSnapshot) => {
  const list = performanceSnapshots.get(p.serviceId) ?? [];
  list.push(p);
  if (list.length > 500) list.shift();
  performanceSnapshots.set(p.serviceId, list);
};
export const getPerformanceSnapshots = (serviceId: string) => performanceSnapshots.get(serviceId) ?? [];

// === Queue metrics ===
export const storeQueueMetric = (q: QueueMetrics) => {
  const list = queueMetrics.get(q.queueName) ?? [];
  list.push(q);
  if (list.length > 500) list.shift();
  queueMetrics.set(q.queueName, list);
};
export const getQueueMetrics = (queueName: string) => queueMetrics.get(queueName) ?? [];
export const getAllQueueMetrics = () => {
  const all: QueueMetrics[] = [];
  for (const list of queueMetrics.values()) all.push(...list);
  return all;
};

// === Event monitor ===
export const appendEventMonitor = (e: EventMonitorEntry) => eventMonitor.push(e);
export const getAllEventMonitor = () => eventMonitor.slice();

// === Failure clusters ===
export const storeFailureCluster = (c: FailureCluster) => failureClusters.set(c.id, c);
export const getFailureCluster = (id: string) => failureClusters.get(id) ?? null;
export const getAllFailureClusters = () => Array.from(failureClusters.values());

// === Errors ===
export const storeError = (e: RegisteredError) => errors.set(e.id, e);
export const getError = (id: string) => errors.get(id) ?? null;
export const getErrorByCode = (code: string) => Array.from(errors.values()).find(e => e.code === code) ?? null;
export const getAllErrors = () => Array.from(errors.values());

// === Alert rules ===
export const storeAlertRule = (r: AlertRule) => alertRules.set(r.id, r);
export const getAlertRule = (id: string) => alertRules.get(id) ?? null;
export const getAllAlertRules = () => Array.from(alertRules.values());

// === Alerts ===
export const storeAlert = (a: Alert) => alerts.set(a.id, a);
export const getAlert = (id: string) => alerts.get(id) ?? null;
export const getAllAlerts = () => Array.from(alerts.values());

// === Incidents ===
export const storeIncident = (i: Incident) => incidents.set(i.id, i);
export const getIncident = (id: string) => incidents.get(id) ?? null;
export const getAllIncidents = () => Array.from(incidents.values());

// === Capacity snapshots ===
export const storeCapacitySnapshot = (c: CapacitySnapshot) => {
  const list = capacitySnapshots.get(c.serviceId) ?? [];
  list.push(c);
  if (list.length > 500) list.shift();
  capacitySnapshots.set(c.serviceId, list);
};
export const getCapacitySnapshots = (serviceId: string) => capacitySnapshots.get(serviceId) ?? [];

// === Profile samples ===
export const storeProfileSample = (p: ProfileSample) => {
  const list = profileSamples.get(p.serviceId) ?? [];
  list.push(p);
  if (list.length > 500) list.shift();
  profileSamples.set(p.serviceId, list);
};
export const getProfileSamples = (serviceId: string) => profileSamples.get(serviceId) ?? [];
export const getAllProfileSamples = () => {
  const all: ProfileSample[] = [];
  for (const list of profileSamples.values()) all.push(...list);
  return all;
};

// === Platform snapshots ===
export const appendPlatformSnapshot = (s: PlatformSnapshot) => platformSnapshots.push(s);
export const getAllPlatformSnapshots = () => platformSnapshots.slice();
export const getLatestPlatformSnapshot = () => platformSnapshots.length > 0 ? platformSnapshots[platformSnapshots.length - 1] : null;

// === Diagnostic reports ===
export const appendDiagnosticReport = (r: DiagnosticReport) => diagnosticReports.push(r);
export const getAllDiagnosticReports = () => diagnosticReports.slice();
export const getLatestDiagnosticReport = () => diagnosticReports.length > 0 ? diagnosticReports[diagnosticReports.length - 1] : null;

// === SLO definitions ===
export const storeSLODefinition = (s: SLODefinition) => sloDefinitions.set(s.id, s);
export const getSLODefinition = (id: string) => sloDefinitions.get(id) ?? null;
export const getAllSLODefinitions = () => Array.from(sloDefinitions.values());

// === SLO statuses ===
export const storeSLOStatus = (s: SLOStatus) => sloStatuses.set(s.sloId, s);
export const getSLOStatus = (sloId: string) => sloStatuses.get(sloId) ?? null;
export const getAllSLOStatuses = () => Array.from(sloStatuses.values());

// === Export configs ===
export const storeExportConfig = (c: ExportConfig) => exportConfigs.set(c.id, c);
export const getExportConfig = (id: string) => exportConfigs.get(id) ?? null;
export const getAllExportConfigs = () => Array.from(exportConfigs.values());

// === Reset ===
export function _resetRepositoryForTesting() {
  services.clear();
  metricDefs.clear(); metricSamples.clear(); metricAggregates.clear();
  logs.length = 0;
  spans.clear(); traces.clear(); correlations.clear();
  healthChecks.clear(); heartbeats.clear(); heartbeatStats.clear();
  dependencies.clear(); performanceSnapshots.clear();
  queueMetrics.clear(); eventMonitor.length = 0;
  failureClusters.clear(); errors.clear();
  alertRules.clear(); alerts.clear(); incidents.clear();
  capacitySnapshots.clear(); profileSamples.clear();
  platformSnapshots.length = 0; diagnosticReports.length = 0;
  sloDefinitions.clear(); sloStatuses.clear();
  exportConfigs.clear();
}
