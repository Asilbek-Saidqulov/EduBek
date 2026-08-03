/** Systems 11, 12, 13, 14, 15 — Event Monitor, Failure Analysis, Error Registry, Alerts, Incidents. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  appendEventMonitor, getAllEventMonitor,
  storeFailureCluster, getFailureCluster, getAllFailureClusters,
  storeError, getError, getErrorByCode, getAllErrors,
  storeAlertRule, getAlertRule, getAllAlertRules,
  storeAlert, getAlert, getAllAlerts,
  storeIncident, getIncident, getAllIncidents,
} from "./repository";
import type {
  EventMonitorEntry, EventMonitorStats,
  FailureCluster,
  RegisteredError, ErrorCategory, ErrorSeverity,
  AlertRule, AlertCondition, AlertSeverity, AlertStatus, Alert,
  Incident, IncidentSeverity, IncidentStatus, IncidentEvent,
} from "./types";
import { publishTelemetryEvent } from "./event-bus-bridge";

const log = getLogger("telemetry.events");

// ===== System 11 — Event Monitoring =====

export function recordPublishedEvent(input: {
  eventType: string;
  producerServiceId: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
}): EventMonitorEntry {
  const entry: EventMonitorEntry = {
    id: randomUUID(), eventType: input.eventType,
    producerServiceId: input.producerServiceId,
    consumerServiceId: null,
    status: "published",
    publishedAt: new Date().toISOString(),
    consumedAt: null, latencyMs: null,
    retryCount: 0,
    correlationId: input.correlationId ?? randomUUID(),
    payload: input.payload ?? {},
  };
  appendEventMonitor(entry);
  return entry;
}

export function recordConsumedEvent(input: {
  eventType: string;
  producerServiceId: string;
  consumerServiceId: string;
  publishedAt: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
}): EventMonitorEntry {
  const now = new Date();
  const entry: EventMonitorEntry = {
    id: randomUUID(), eventType: input.eventType,
    producerServiceId: input.producerServiceId,
    consumerServiceId: input.consumerServiceId,
    status: "consumed",
    publishedAt: input.publishedAt,
    consumedAt: now.toISOString(),
    latencyMs: now.getTime() - new Date(input.publishedAt).getTime(),
    retryCount: 0,
    correlationId: input.correlationId ?? randomUUID(),
    payload: input.payload ?? {},
  };
  appendEventMonitor(entry);
  return entry;
}

export function recordEventRetry(input: {
  eventType: string;
  producerServiceId: string;
  consumerServiceId: string;
  correlationId?: string;
  retryCount?: number;
}): EventMonitorEntry {
  const entry: EventMonitorEntry = {
    id: randomUUID(), eventType: input.eventType,
    producerServiceId: input.producerServiceId,
    consumerServiceId: input.consumerServiceId,
    status: "retry",
    publishedAt: new Date().toISOString(),
    consumedAt: null, latencyMs: null,
    retryCount: input.retryCount ?? 1,
    correlationId: input.correlationId ?? randomUUID(),
    payload: {},
  };
  appendEventMonitor(entry);
  return entry;
}

export function recordDeadLetter(input: {
  eventType: string;
  producerServiceId: string;
  consumerServiceId: string;
  correlationId?: string;
  reason: string;
}): EventMonitorEntry {
  const entry: EventMonitorEntry = {
    id: randomUUID(), eventType: input.eventType,
    producerServiceId: input.producerServiceId,
    consumerServiceId: input.consumerServiceId,
    status: "dead_letter",
    publishedAt: new Date().toISOString(),
    consumedAt: null, latencyMs: null,
    retryCount: 0,
    correlationId: input.correlationId ?? randomUUID(),
    payload: { reason: input.reason },
  };
  appendEventMonitor(entry);
  return entry;
}

export function listEventMonitorEntries(limit = 100, status?: EventMonitorEntry["status"]): EventMonitorEntry[] {
  let all = getAllEventMonitor();
  if (status) all = all.filter(e => e.status === status);
  return all.slice(-limit).reverse();
}

export function generateEventMonitorStats(): EventMonitorStats {
  const all = getAllEventMonitor();
  const byEventType: Record<string, number> = {};
  let published = 0, consumed = 0, retries = 0, deadLetters = 0;
  let totalLatency = 0, latencyCount = 0;
  for (const e of all) {
    byEventType[e.eventType] = (byEventType[e.eventType] ?? 0) + 1;
    if (e.status === "published") published += 1;
    if (e.status === "consumed") {
      consumed += 1;
      if (e.latencyMs !== null) { totalLatency += e.latencyMs; latencyCount += 1; }
    }
    if (e.status === "retry") retries += 1;
    if (e.status === "dead_letter") deadLetters += 1;
  }
  return {
    totalPublished: published, totalConsumed: consumed,
    totalRetries: retries, totalDeadLetters: deadLetters,
    avgLatencyMs: latencyCount > 0 ? totalLatency / latencyCount : 0,
    byEventType,
  };
}

// ===== System 12 — Failure Analysis =====

function computeSignature(exceptionType: string, message: string): string {
  // Deterministic signature: type + first 50 chars of message
  return `${exceptionType}:${message.slice(0, 50)}`;
}

export function recordFailure(input: {
  exceptionType: string;
  message: string;
  serviceId?: string | null;
  stackTrace?: string | null;
  metadata?: Record<string, unknown>;
}): FailureCluster {
  const signature = computeSignature(input.exceptionType, input.message);
  const existing = getAllFailureClusters().find(c => c.signature === signature);
  if (existing) {
    existing.occurrences += 1;
    existing.lastSeenAt = new Date().toISOString();
    if (input.stackTrace && !existing.sampleStackTrace) {
      existing.sampleStackTrace = input.stackTrace;
    }
    storeFailureCluster(existing);
    if (existing.occurrences === 10 || existing.occurrences === 100) {
      publishTelemetryEvent("ErrorClusterDetected", null, {
        clusterId: existing.id, signature: existing.signature, occurrences: existing.occurrences,
      });
    }
    return existing;
  }
  const now = new Date().toISOString();
  const cluster: FailureCluster = {
    id: randomUUID(), signature,
    exceptionType: input.exceptionType,
    message: input.message,
    serviceId: input.serviceId ?? null,
    occurrences: 1,
    firstSeenAt: now, lastSeenAt: now,
    rootCause: null,
    relatedClusters: [],
    sampleStackTrace: input.stackTrace ?? null,
    metadata: input.metadata ?? {},
  };
  storeFailureCluster(cluster);
  log.info("failure.cluster_created", { id: cluster.id, signature });
  return cluster;
}

export function getFailureClusterById(id: string): FailureCluster | null { return getFailureCluster(id); }
export function listFailureClusters(serviceId?: string | null): FailureCluster[] {
  const all = getAllFailureClusters();
  return serviceId !== undefined ? all.filter(c => c.serviceId === serviceId) : all;
}

export function setRootCause(clusterId: string, rootCause: string): FailureCluster | null {
  const c = getFailureCluster(clusterId);
  if (!c) return null;
  c.rootCause = rootCause;
  storeFailureCluster(c);
  return c;
}

export function linkFailureClusters(clusterId: string, relatedId: string): FailureCluster | null {
  const c = getFailureCluster(clusterId);
  if (!c) return null;
  if (!c.relatedClusters.includes(relatedId)) {
    c.relatedClusters.push(relatedId);
    storeFailureCluster(c);
  }
  return c;
}

// ===== System 13 — Error Registry =====

export function registerError(input: {
  code: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  message: string;
  description?: string;
  remediation?: string | null;
  version?: string;
  metadata?: Record<string, unknown>;
}): RegisteredError {
  if (getErrorByCode(input.code)) throw new Error(`Error code already exists: ${input.code}`);
  const error: RegisteredError = {
    id: randomUUID(), code: input.code,
    category: input.category ?? "unknown",
    severity: input.severity ?? "medium",
    message: input.message,
    description: input.description ?? "",
    remediation: input.remediation ?? null,
    documentedAt: new Date().toISOString(),
    version: input.version ?? "1.0.0",
    active: true,
    occurrences: 0,
    metadata: input.metadata ?? {},
  };
  storeError(error);
  log.info("error.registered", { id: error.id, code: error.code });
  return error;
}

export function getErrorById(id: string): RegisteredError | null { return getError(id); }
export function getErrorByErrorCode(code: string): RegisteredError | null { return getErrorByCode(code); }
export function listErrors(category?: ErrorCategory, severity?: ErrorSeverity): RegisteredError[] {
  let all = getAllErrors();
  if (category) all = all.filter(e => e.category === category);
  if (severity) all = all.filter(e => e.severity === severity);
  return all;
}

export function recordErrorOccurrence(code: string): RegisteredError | null {
  const e = getErrorByCode(code);
  if (!e) return null;
  e.occurrences += 1;
  storeError(e);
  return e;
}

export function deactivateError(id: string): RegisteredError | null {
  const e = getError(id);
  if (!e) return null;
  e.active = false;
  storeError(e);
  return e;
}

export function supportsAllErrorCategories(): ErrorCategory[] {
  return ["system", "network", "database", "auth", "config", "external", "logic", "unknown"];
}
export function supportsAllErrorSeverities(): ErrorSeverity[] {
  return ["low", "medium", "high", "critical"];
}

// ===== System 14 — Alert Platform =====

export function createAlertRule(input: {
  name: string;
  condition: AlertCondition;
  metricKey?: string | null;
  threshold: number;
  operator?: "gt" | "lt" | "gte" | "lte" | "eq";
  windowMinutes?: number;
  severity?: AlertSeverity;
  serviceId?: string | null;
  metadata?: Record<string, unknown>;
}): AlertRule {
  const rule: AlertRule = {
    id: randomUUID(), name: input.name,
    condition: input.condition,
    metricKey: input.metricKey ?? null,
    threshold: input.threshold,
    operator: input.operator ?? "gt",
    windowMinutes: input.windowMinutes ?? 5,
    severity: input.severity ?? "warning",
    serviceId: input.serviceId ?? null,
    active: true,
    createdAt: new Date().toISOString(),
    metadata: input.metadata ?? {},
  };
  storeAlertRule(rule);
  log.info("alert_rule.created", { id: rule.id, name: rule.name });
  return rule;
}

export function getAlertRuleById(id: string): AlertRule | null { return getAlertRule(id); }
export function listAlertRules(active?: boolean): AlertRule[] {
  const all = getAllAlertRules();
  return active === undefined ? all : all.filter(r => r.active === active);
}

export function deactivateAlertRule(id: string): AlertRule | null {
  const r = getAlertRule(id);
  if (!r) return null;
  r.active = false;
  storeAlertRule(r);
  return r;
}

export function triggerAlert(input: {
  ruleId?: string | null;
  severity?: AlertSeverity;
  title: string;
  description: string;
  serviceId?: string | null;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): Alert {
  const alert: Alert = {
    id: randomUUID(), ruleId: input.ruleId ?? null,
    severity: input.severity ?? "warning",
    status: "active",
    title: input.title,
    description: input.description,
    serviceId: input.serviceId ?? null,
    triggeredAt: new Date().toISOString(),
    acknowledgedAt: null, acknowledgedBy: null,
    resolvedAt: null,
    correlationId: input.correlationId ?? randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeAlert(alert);
  publishTelemetryEvent("AlertTriggered", null, {
    alertId: alert.id, title: alert.title, severity: alert.severity,
    correlationId: alert.correlationId,
  });
  log.warn("alert.triggered", { id: alert.id, title: alert.title });
  return alert;
}

export function getAlertById(id: string): Alert | null { return getAlert(id); }
export function listAlerts(status?: AlertStatus, severity?: AlertSeverity): Alert[] {
  let all = getAllAlerts();
  if (status) all = all.filter(a => a.status === status);
  if (severity) all = all.filter(a => a.severity === severity);
  return all.sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt));
}

export function acknowledgeAlert(id: string, userId: string): Alert | null {
  const a = getAlert(id);
  if (!a) return null;
  if (a.status !== "active") return null;
  a.status = "acknowledged";
  a.acknowledgedAt = new Date().toISOString();
  a.acknowledgedBy = userId;
  storeAlert(a);
  return a;
}

export function resolveAlert(id: string): Alert | null {
  const a = getAlert(id);
  if (!a) return null;
  if (a.status === "resolved") return null;
  a.status = "resolved";
  a.resolvedAt = new Date().toISOString();
  storeAlert(a);
  publishTelemetryEvent("AlertResolved", null, { alertId: a.id, correlationId: a.correlationId });
  return a;
}

export function suppressAlert(id: string): Alert | null {
  const a = getAlert(id);
  if (!a) return null;
  if (a.status !== "active") return null;
  a.status = "suppressed";
  storeAlert(a);
  return a;
}

export function supportsAllAlertConditions(): AlertCondition[] {
  return ["threshold", "error_rate", "latency", "memory", "cpu", "queue_size", "heartbeat_missed", "custom"];
}
export function supportsAllAlertSeverities(): AlertSeverity[] {
  return ["info", "warning", "minor", "major", "critical"];
}
export function supportsAllAlertStatuses(): AlertStatus[] {
  return ["active", "acknowledged", "resolved", "suppressed"];
}

// ===== System 15 — Incident Timeline =====

export function openIncident(input: {
  title: string;
  severity: IncidentSeverity;
  serviceId?: string | null;
  owner?: string | null;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): Incident {
  const now = new Date().toISOString();
  const incident: Incident = {
    id: randomUUID(), title: input.title,
    severity: input.severity,
    status: "open",
    serviceId: input.serviceId ?? null,
    openedAt: now,
    resolvedAt: null, closedAt: null,
    owner: input.owner ?? null,
    rootCause: null, resolution: null,
    correlationId: input.correlationId ?? randomUUID(),
    timeline: [{
      id: randomUUID(), timestamp: now, type: "opened",
      actorId: input.owner ?? null, description: "Incident opened",
      metadata: {},
    }],
    metadata: input.metadata ?? {},
  };
  storeIncident(incident);
  publishTelemetryEvent("IncidentOpened", input.owner ?? null, {
    incidentId: incident.id, severity: incident.severity, title: incident.title,
    correlationId: incident.correlationId,
  });
  log.warn("incident.opened", { id: incident.id, severity: incident.severity });
  return incident;
}

export function getIncidentById(id: string): Incident | null { return getIncident(id); }
export function listIncidents(status?: IncidentStatus, severity?: IncidentSeverity): Incident[] {
  let all = getAllIncidents();
  if (status) all = all.filter(i => i.status === status);
  if (severity) all = all.filter(i => i.severity === severity);
  return all.sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}

const VALID_INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["investigating", "identified", "resolved", "closed"],
  investigating: ["identified", "resolved", "closed"],
  identified: ["monitoring", "resolved", "closed", "investigating"],
  monitoring: ["resolved", "closed", "investigating"],
  resolved: ["closed", "investigating"],
  closed: [],
};

export function canTransitionIncident(from: IncidentStatus, to: IncidentStatus): boolean {
  return VALID_INCIDENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionIncident(id: string, to: IncidentStatus, actorId: string | null, description: string): Incident | null {
  const inc = getIncident(id);
  if (!inc) return null;
  if (!canTransitionIncident(inc.status, to)) return null;
  const now = new Date().toISOString();
  inc.status = to;
  if (to === "resolved") inc.resolvedAt = now;
  if (to === "closed") inc.closedAt = now;
  const event: IncidentEvent = {
    id: randomUUID(), timestamp: now, type: `transition:${to}`,
    actorId, description, metadata: {},
  };
  inc.timeline.push(event);
  storeIncident(inc);
  if (to === "closed") {
    publishTelemetryEvent("IncidentClosed", actorId, {
      incidentId: inc.id, correlationId: inc.correlationId,
    });
  }
  return inc;
}

export function addIncidentEvent(id: string, type: string, actorId: string | null, description: string, metadata: Record<string, unknown> = {}): Incident | null {
  const inc = getIncident(id);
  if (!inc) return null;
  const event: IncidentEvent = {
    id: randomUUID(), timestamp: new Date().toISOString(),
    type, actorId, description, metadata,
  };
  inc.timeline.push(event);
  storeIncident(inc);
  return inc;
}

export function setIncidentRootCause(id: string, rootCause: string): Incident | null {
  const inc = getIncident(id);
  if (!inc) return null;
  inc.rootCause = rootCause;
  storeIncident(inc);
  return inc;
}

export function setIncidentResolution(id: string, resolution: string): Incident | null {
  const inc = getIncident(id);
  if (!inc) return null;
  inc.resolution = resolution;
  storeIncident(inc);
  return inc;
}

export function assignIncidentOwner(id: string, owner: string): Incident | null {
  const inc = getIncident(id);
  if (!inc) return null;
  inc.owner = owner;
  storeIncident(inc);
  return inc;
}

export function supportsAllIncidentSeverities(): IncidentSeverity[] {
  return ["sev1", "sev2", "sev3", "sev4"];
}
export function supportsAllIncidentStatuses(): IncidentStatus[] {
  return ["open", "investigating", "identified", "monitoring", "resolved", "closed"];
}
