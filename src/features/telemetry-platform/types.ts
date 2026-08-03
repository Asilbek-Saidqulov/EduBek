/**
 * EduBek — Platform Observability, Telemetry & Diagnostics types.
 * Phase 6G.19: Single source of truth for operational visibility.
 *
 * Owns ONLY operational data: logs, metrics, traces, health checks, performance,
 * errors, alerts, incidents, capacity, profiling, snapshots, diagnostics, SLOs,
 * dashboards, and developer diagnostics.
 *
 * NEVER owns business data: XP, commerce, marketplace, notifications, RBAC,
 * sessions, analytics, reports, business intelligence.
 *
 * All cross-module communication happens exclusively through the Event Bus.
 */

// ===========================================================================
// System 1 — Telemetry Registry
// ===========================================================================
export type ServiceCategory =
  | "core" | "data" | "compute" | "communication" | "integration"
  | "analytics" | "ai" | "edge" | "external" | "platform";

export type ServiceCriticality = "critical" | "high" | "medium" | "low";

export interface RegisteredService {
  id: string; name: string;
  category: ServiceCategory;
  criticality: ServiceCriticality;
  version: string;
  owner: string | null;
  endpoint: string | null;
  tags: string[];
  registeredAt: string;
  lastSeenAt: string | null;
  active: boolean;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 2 — Metrics Platform
// ===========================================================================
export type MetricType = "counter" | "gauge" | "histogram" | "timer" | "percentile" | "summary";

export interface MetricDefinition {
  id: string; key: string; name: string;
  type: MetricType;
  unit: string | null;
  description: string;
  labels: string[];
  namespace: string;
  active: boolean;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface MetricSample {
  id: string; metricKey: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
  correlationId: string | null;
}

export interface MetricAggregate {
  metricKey: string;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number | null;
  p95: number | null;
  p99: number | null;
  lastValue: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

// ===========================================================================
// System 3 — Structured Logging
// ===========================================================================
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  serviceId: string | null;
  timestamp: string;
  correlationId: string | null;
  traceId: string | null;
  spanId: string | null;
  requestId: string | null;
  userId: string | null;
  context: Record<string, unknown>;
  exception: { type: string; message: string; stack: string | null } | null;
  immutable: true;
}

// ===========================================================================
// System 4 — Distributed Tracing
// ===========================================================================
export type SpanKind = "internal" | "server" | "client" | "producer" | "consumer";
export type SpanStatus = "unset" | "ok" | "error";

export interface TraceSpan {
  id: string; traceId: string; parentId: string | null;
  name: string; serviceId: string;
  kind: SpanKind;
  status: SpanStatus;
  startedAt: string; endedAt: string | null;
  durationMs: number | null;
  attributes: Record<string, unknown>;
  events: Array<{ name: string; timestamp: string; attributes: Record<string, unknown> }>;
  correlationId: string | null;
}

export interface Trace {
  id: string;
  rootSpanId: string | null;
  status: SpanStatus;
  startedAt: string; endedAt: string | null;
  durationMs: number | null;
  spans: TraceSpan[];
  correlationId: string | null;
}

// ===========================================================================
// System 5 — Correlation Context
// ===========================================================================
export interface CorrelationContext {
  correlationId: string;
  traceId: string | null;
  spanId: string | null;
  requestId: string | null;
  userId: string | null;
  serviceId: string | null;
  parentCorrelationId: string | null;
  startedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 6 — Health Monitoring
// ===========================================================================
export type HealthStatus = "healthy" | "warning" | "degraded" | "offline" | "maintenance";

export interface HealthCheck {
  id: string; serviceId: string;
  status: HealthStatus;
  checkedAt: string;
  responseTimeMs: number;
  message: string | null;
  details: Record<string, unknown>;
}

// ===========================================================================
// System 7 — Heartbeat Platform
// ===========================================================================
export interface Heartbeat {
  id: string; serviceId: string;
  sentAt: string;
  receivedAt: string;
  status: HealthStatus;
  metadata: Record<string, unknown>;
}

export interface HeartbeatStats {
  serviceId: string;
  totalSent: number;
  totalReceived: number;
  missedCount: number;
  lastReceivedAt: string | null;
  avgIntervalMs: number;
}

// ===========================================================================
// System 8 — Dependency Graph
// ===========================================================================
export type DependencyType = "sync" | "async" | "data" | "network" | "external";
export type DependencyStatus = "active" | "degraded" | "down" | "unknown";

export interface DependencyEdge {
  id: string;
  fromServiceId: string;
  toServiceId: string;
  type: DependencyType;
  status: DependencyStatus;
  latencyMs: number | null;
  callRate: number;
  errorRate: number;
  criticality: ServiceCriticality;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 9 — Performance Monitoring
// ===========================================================================
export interface PerformanceSnapshot {
  id: string; serviceId: string;
  timestamp: string;
  responseTimeMs: number;
  cpuPercent: number;
  memoryMb: number;
  memoryPercent: number;
  dbQueryMs: number | null;
  cacheHitRate: number | null;
  activeConnections: number;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 10 — Queue Monitoring
// ===========================================================================
export type QueueType = "redis" | "rabbitmq" | "kafka" | "bullmq" | "custom";

export interface QueueMetrics {
  id: string; queueName: string;
  type: QueueType;
  size: number;
  consumers: number;
  publishRate: number;
  consumeRate: number;
  ackRate: number;
  nackRate: number;
  deadLetterCount: number;
  avgLatencyMs: number;
  status: HealthStatus;
  timestamp: string;
}

// ===========================================================================
// System 11 — Event Monitoring
// ===========================================================================
export interface EventMonitorEntry {
  id: string; eventType: string;
  producerServiceId: string;
  consumerServiceId: string | null;
  status: "published" | "consumed" | "retry" | "dead_letter";
  publishedAt: string;
  consumedAt: string | null;
  latencyMs: number | null;
  retryCount: number;
  correlationId: string;
  payload: Record<string, unknown>;
}

export interface EventMonitorStats {
  totalPublished: number;
  totalConsumed: number;
  totalRetries: number;
  totalDeadLetters: number;
  avgLatencyMs: number;
  byEventType: Record<string, number>;
}

// ===========================================================================
// System 12 — Failure Analysis
// ===========================================================================
export interface FailureCluster {
  id: string;
  signature: string;
  exceptionType: string;
  message: string;
  serviceId: string | null;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  rootCause: string | null;
  relatedClusters: string[];
  sampleStackTrace: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 13 — Error Registry
// ===========================================================================
export type ErrorCategory = "system" | "network" | "database" | "auth" | "config" | "external" | "logic" | "unknown";
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export interface RegisteredError {
  id: string; code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  description: string;
  remediation: string | null;
  documentedAt: string;
  version: string;
  active: boolean;
  occurrences: number;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 14 — Alert Platform
// ===========================================================================
export type AlertSeverity = "info" | "warning" | "minor" | "major" | "critical";
export type AlertStatus = "active" | "acknowledged" | "resolved" | "suppressed";
export type AlertCondition = "threshold" | "error_rate" | "latency" | "memory" | "cpu" | "queue_size" | "heartbeat_missed" | "custom";

export interface AlertRule {
  id: string; name: string;
  condition: AlertCondition;
  metricKey: string | null;
  threshold: number;
  operator: "gt" | "lt" | "gte" | "lte" | "eq";
  windowMinutes: number;
  severity: AlertSeverity;
  serviceId: string | null;
  active: boolean;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface Alert {
  id: string; ruleId: string | null;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  serviceId: string | null;
  triggeredAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 15 — Incident Timeline
// ===========================================================================
export type IncidentSeverity = "sev1" | "sev2" | "sev3" | "sev4";
export type IncidentStatus = "open" | "investigating" | "identified" | "monitoring" | "resolved" | "closed";

export interface IncidentEvent {
  id: string;
  timestamp: string;
  type: string;
  actorId: string | null;
  description: string;
  metadata: Record<string, unknown>;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  serviceId: string | null;
  openedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  owner: string | null;
  rootCause: string | null;
  resolution: string | null;
  correlationId: string;
  timeline: IncidentEvent[];
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 16 — Capacity Monitoring
// ===========================================================================
export interface CapacitySnapshot {
  id: string; serviceId: string;
  timestamp: string;
  connections: number;
  maxConnections: number;
  storageMb: number;
  maxStorageMb: number;
  bandwidthMbps: number;
  maxBandwidthMbps: number;
  workers: number;
  maxWorkers: number;
  utilizationPercent: number;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 17 — Profiling Platform
// ===========================================================================
export interface ProfileSample {
  id: string; serviceId: string;
  method: string;
  durationMs: number;
  memoryMb: number;
  cpuPercent: number;
  callCount: number;
  sampledAt: string;
  hotPath: boolean;
  stackTrace: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 18 — Snapshot Platform
// ===========================================================================
export interface PlatformSnapshot {
  id: string;
  timestamp: string;
  trigger: "manual" | "scheduled" | "incident" | "diagnostic";
  servicesTotal: number;
  servicesHealthy: number;
  servicesDegraded: number;
  servicesOffline: number;
  incidentsOpen: number;
  alertsActive: number;
  avgLatencyMs: number;
  eventThroughput: number;
  queueDepth: number;
  details: Record<string, unknown>;
}

// ===========================================================================
// System 19 — Diagnostics Engine
// ===========================================================================
export type DiagnosticCheckStatus = "pass" | "warn" | "fail" | "skip";
export type DiagnosticCheckType =
  | "redis_connectivity" | "database_connectivity" | "cache_health"
  | "certificate_expiry" | "queue_stalled" | "disk_space"
  | "memory_pressure" | "cpu_pressure" | "service_dependency"
  | "event_bus_health" | "auth_provider_reachable" | "custom";

export interface DiagnosticCheck {
  id: string; type: DiagnosticCheckType;
  serviceId: string | null;
  status: DiagnosticCheckStatus;
  message: string;
  details: Record<string, unknown>;
  checkedAt: string;
  durationMs: number;
}

export interface DiagnosticReport {
  id: string;
  triggeredAt: string;
  triggeredBy: string | null;
  totalChecks: number;
  passed: number;
  warnings: number;
  failed: number;
  skipped: number;
  checks: DiagnosticCheck[];
}

// ===========================================================================
// System 20 — SLO Platform
// ===========================================================================
export type SLOType = "availability" | "latency" | "error_rate" | "throughput" | "custom";

export interface SLODefinition {
  id: string; name: string;
  serviceId: string | null;
  type: SLOType;
  target: number; // e.g., 0.999 for 99.9%
  windowDays: number;
  description: string;
  active: boolean;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface SLOStatus {
  sloId: string;
  current: number;
  errorBudgetRemaining: number;
  errorBudgetTotal: number;
  status: "met" | "at_risk" | "breached";
  lastUpdated: string;
}

// ===========================================================================
// System 21 — Developer Diagnostics
// ===========================================================================
export interface DeveloperDiagnosticReport {
  id: string;
  generatedAt: string;
  serviceId: string | null;
  openTelemetry: {
    serviceName: string;
    serviceVersion: string;
    endpoint: string;
    samplingRatio: number;
  };
  metrics: Array<{ name: string; type: MetricType; description: string }>;
  healthChecks: Array<{ name: string; criticality: ServiceCriticality }>;
  alerts: Array<{ name: string; severity: AlertSeverity }>;
  schemas: Record<string, unknown>;
}

// ===========================================================================
// System 22 — Operational Dashboard
// ===========================================================================
export interface OperationalDashboard {
  services: {
    total: number;
    healthy: number;
    degraded: number;
    offline: number;
    byCategory: Record<ServiceCategory, number>;
    perServiceLatency: Array<{ serviceId: string; name: string; latencyMs: number; status: HealthStatus }>;
  };
  events: {
    published: number;
    consumed: number;
    retries: number;
    deadLetters: number;
    throughput: number;
  };
  tracing: {
    slowestRequests: Array<{ traceId: string; name: string; durationMs: number; serviceId: string }>;
    avgTraceDuration: number;
  };
  incidents: {
    open: number;
    recent: Array<{ id: string; title: string; severity: IncidentSeverity; status: IncidentStatus; openedAt: string }>;
  };
  alerts: {
    active: number;
    critical: number;
  };
  queues: {
    total: number;
    totalDepth: number;
    blocked: number;
  };
  capacity: {
    avgUtilization: number;
    atRisk: number;
  };
  slos: {
    total: number;
    met: number;
    atRisk: number;
    breached: number;
  };
  updatedAt: string;
}

// ===========================================================================
// System 23 — Export Platform
// ===========================================================================
export type ExportFormat = "prometheus" | "grafana" | "opentelemetry" | "datadog" | "cloudwatch" | "azure_monitor";

export interface ExportConfig {
  id: string; format: ExportFormat;
  endpoint: string | null;
  apiKey: string | null;
  intervalSeconds: number;
  enabled: boolean;
  lastExportedAt: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 24 — Documentation Generator
// ===========================================================================
export interface TelemetryDocumentation {
  version: string; generatedAt: string;
  systems: Array<{
    id: number; name: string; description: string;
    endpoints: string[]; events: string[];
  }>;
  events: Array<{
    type: TelemetryEventType; payload: string[]; description: string;
  }>;
  ownership: {
    owns: string[]; doesNotOwn: string[];
  };
  openTelemetryMetadata: {
    serviceName: string;
    serviceVersion: string;
    samplingRules: string[];
    exportFormats: ExportFormat[];
  };
}

// ===========================================================================
// System 25 — Event Bus Bridge
// ===========================================================================
export type TelemetryEventType =
  | "ServiceHealthy" | "ServiceDegraded" | "ServiceRecovered"
  | "TraceCompleted" | "LatencyExceeded"
  | "QueueBlocked" | "QueueRecovered"
  | "AlertTriggered" | "AlertResolved"
  | "IncidentOpened" | "IncidentClosed"
  | "HealthChanged" | "MetricThresholdExceeded"
  | "DependencyUnavailable" | "HeartbeatMissed"
  | "SnapshotCreated" | "DiagnosticCompleted"
  | "CapacityWarning" | "ErrorClusterDetected";

// ===========================================================================
// Developer Integration (used by API route)
// ===========================================================================
export interface TelemetryDeveloperIntegration {
  publicAPIs: Array<{
    path: string; method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    description: string; authRequired: boolean; scope: string;
  }>;
  extensionHooks: Array<{
    id: string; name: string; triggerEvent: TelemetryEventType;
    description: string;
  }>;
  sdkMetadata: {
    version: string; language: string; docsUrl: string;
    capabilities: string[];
  };
  webhooks: Array<{
    id: string; event: TelemetryEventType; description: string;
  }>;
}
