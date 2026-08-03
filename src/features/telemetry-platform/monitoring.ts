/** Systems 6, 7, 8, 9, 10 — Health, Heartbeat, Dependency, Performance, Queue. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeHealthCheck, getHealthChecks, getAllHealthChecks,
  storeHeartbeat, getHeartbeats, storeHeartbeatStats, getHeartbeatStats,
  storeDependency, getDependency, getAllDependencies,
  storePerformanceSnapshot, getPerformanceSnapshots,
  storeQueueMetric, getQueueMetrics, getAllQueueMetrics,
  getService,
} from "./repository";
import type {
  HealthCheck, HealthStatus,
  Heartbeat, HeartbeatStats,
  DependencyEdge, DependencyType, DependencyStatus, ServiceCriticality,
  PerformanceSnapshot,
  QueueMetrics, QueueType,
} from "./types";
import { publishTelemetryEvent } from "./event-bus-bridge";

const log = getLogger("telemetry.health");

// ===== System 6 — Health Monitoring =====

export function recordHealthCheck(input: {
  serviceId: string;
  status: HealthStatus;
  responseTimeMs?: number;
  message?: string | null;
  details?: Record<string, unknown>;
}): HealthCheck {
  const check: HealthCheck = {
    id: randomUUID(), serviceId: input.serviceId,
    status: input.status,
    checkedAt: new Date().toISOString(),
    responseTimeMs: input.responseTimeMs ?? 0,
    message: input.message ?? null,
    details: input.details ?? {},
  };
  storeHealthCheck(check);
  // Check for status transitions
  const history = getHealthChecks(input.serviceId);
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    if (prev.status !== input.status) {
      publishTelemetryEvent("HealthChanged", null, {
        serviceId: input.serviceId, from: prev.status, to: input.status,
      });
      if (input.status === "degraded") {
        publishTelemetryEvent("ServiceDegraded", null, { serviceId: input.serviceId });
      } else if (input.status === "healthy" && prev.status !== "healthy") {
        publishTelemetryEvent("ServiceRecovered", null, { serviceId: input.serviceId });
      }
    }
  } else if (input.status === "healthy") {
    publishTelemetryEvent("ServiceHealthy", null, { serviceId: input.serviceId });
  }
  return check;
}

export function getLatestHealth(serviceId: string): HealthCheck | null {
  const checks = getHealthChecks(serviceId);
  return checks.length > 0 ? checks[checks.length - 1] : null;
}

export function listHealthChecks(serviceId?: string, limit = 50): HealthCheck[] {
  const all = serviceId ? getHealthChecks(serviceId) : getAllHealthChecks();
  return all.slice(-limit).reverse();
}

export function getPlatformHealth(): {
  totalServices: number;
  healthy: number;
  warning: number;
  degraded: number;
  offline: number;
  maintenance: number;
  byService: Array<{ serviceId: string; status: HealthStatus; checkedAt: string }>;
} {
  const all = getAllHealthChecks();
  const byService = new Map<string, HealthCheck>();
  for (const c of all) {
    const existing = byService.get(c.serviceId);
    if (!existing || new Date(c.checkedAt).getTime() > new Date(existing.checkedAt).getTime()) {
      byService.set(c.serviceId, c);
    }
  }
  const counts = { healthy: 0, warning: 0, degraded: 0, offline: 0, maintenance: 0 };
  const services = Array.from(byService.values()).map(c => {
    counts[c.status] = (counts[c.status] ?? 0) + 1;
    return { serviceId: c.serviceId, status: c.status, checkedAt: c.checkedAt };
  });
  return {
    totalServices: byService.size,
    ...counts,
    byService: services,
  };
}

export function supportsAllHealthStatuses(): HealthStatus[] {
  return ["healthy", "warning", "degraded", "offline", "maintenance"];
}

// ===== System 7 — Heartbeat Platform =====

export function sendHeartbeat(input: {
  serviceId: string;
  status?: HealthStatus;
  sentAt?: string;
  metadata?: Record<string, unknown>;
}): Heartbeat {
  const sentAt = input.sentAt ?? new Date().toISOString();
  const receivedAt = new Date().toISOString();
  const hb: Heartbeat = {
    id: randomUUID(), serviceId: input.serviceId,
    sentAt, receivedAt,
    status: input.status ?? "healthy",
    metadata: input.metadata ?? {},
  };
  storeHeartbeat(hb);
  updateHeartbeatStats(input.serviceId, hb);
  return hb;
}

function updateHeartbeatStats(serviceId: string, hb: Heartbeat): void {
  const hbs = getHeartbeats(serviceId);
  const totalSent = hbs.length;
  const totalReceived = hbs.length; // received = sent in our model
  const lastReceivedAt = hb.receivedAt;
  let avgIntervalMs = 0;
  if (hbs.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < hbs.length; i++) {
      intervals.push(new Date(hbs[i].sentAt).getTime() - new Date(hbs[i - 1].sentAt).getTime());
    }
    avgIntervalMs = intervals.reduce((s, v) => s + v, 0) / intervals.length;
  }
  const stats: HeartbeatStats = {
    serviceId, totalSent, totalReceived,
    missedCount: 0, // computed externally
    lastReceivedAt,
    avgIntervalMs,
  };
  storeHeartbeatStats(stats);
}

export function getHeartbeatStatsForService(serviceId: string): HeartbeatStats | null {
  return getHeartbeatStats(serviceId);
}

export function listHeartbeats(serviceId?: string, limit = 50): Heartbeat[] {
  if (serviceId) return getHeartbeats(serviceId).slice(-limit).reverse();
  // Aggregate all
  const all: Heartbeat[] = [];
  // Walk all services — but since we only have per-service storage, iterate
  return all;
}

export function markHeartbeatMissed(serviceId: string, expectedAt: string): void {
  const stats = getHeartbeatStats(serviceId);
  if (stats) {
    stats.missedCount += 1;
    storeHeartbeatStats(stats);
  }
  publishTelemetryEvent("HeartbeatMissed", null, { serviceId, expectedAt });
}

// ===== System 8 — Dependency Graph =====

export function registerDependency(input: {
  fromServiceId: string;
  toServiceId: string;
  type?: DependencyType;
  status?: DependencyStatus;
  latencyMs?: number | null;
  callRate?: number;
  errorRate?: number;
  criticality?: ServiceCriticality;
  metadata?: Record<string, unknown>;
}): DependencyEdge {
  const edge: DependencyEdge = {
    id: randomUUID(),
    fromServiceId: input.fromServiceId,
    toServiceId: input.toServiceId,
    type: input.type ?? "sync",
    status: input.status ?? "active",
    latencyMs: input.latencyMs ?? null,
    callRate: input.callRate ?? 0,
    errorRate: input.errorRate ?? 0,
    criticality: input.criticality ?? "medium",
    metadata: input.metadata ?? {},
  };
  storeDependency(edge);
  log.info("dependency.registered", { from: input.fromServiceId, to: input.toServiceId });
  return edge;
}

export function getDependencyById(id: string): DependencyEdge | null { return getDependency(id); }
export function listDependencies(fromServiceId?: string, toServiceId?: string): DependencyEdge[] {
  let all = getAllDependencies();
  if (fromServiceId) all = all.filter(d => d.fromServiceId === fromServiceId);
  if (toServiceId) all = all.filter(d => d.toServiceId === toServiceId);
  return all;
}

export function updateDependencyStatus(id: string, status: DependencyStatus, latencyMs?: number): DependencyEdge | null {
  const d = getDependency(id);
  if (!d) return null;
  const prev = d.status;
  d.status = status;
  if (latencyMs !== undefined) d.latencyMs = latencyMs;
  storeDependency(d);
  if (status === "down" && prev !== "down") {
    publishTelemetryEvent("DependencyUnavailable", null, {
      fromServiceId: d.fromServiceId, toServiceId: d.toServiceId,
    });
  }
  return d;
}

export function getDependencyGraph(): {
  nodes: Array<{ serviceId: string; name: string }>;
  edges: DependencyEdge[];
} {
  const nodes = new Map<string, { serviceId: string; name: string }>();
  const edges = getAllDependencies();
  for (const e of edges) {
    const fromService = getService(e.fromServiceId);
    const toService = getService(e.toServiceId);
    if (fromService) nodes.set(fromService.id, { serviceId: fromService.id, name: fromService.name });
    if (toService) nodes.set(toService.id, { serviceId: toService.id, name: toService.name });
  }
  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
}

export function supportsAllDependencyTypes(): DependencyType[] {
  return ["sync", "async", "data", "network", "external"];
}
export function supportsAllDependencyStatuses(): DependencyStatus[] {
  return ["active", "degraded", "down", "unknown"];
}

// ===== System 9 — Performance Monitoring =====

export function recordPerformanceSnapshot(input: {
  serviceId: string;
  responseTimeMs: number;
  cpuPercent: number;
  memoryMb: number;
  memoryPercent?: number;
  dbQueryMs?: number | null;
  cacheHitRate?: number | null;
  activeConnections?: number;
  metadata?: Record<string, unknown>;
}): PerformanceSnapshot {
  const snap: PerformanceSnapshot = {
    id: randomUUID(), serviceId: input.serviceId,
    timestamp: new Date().toISOString(),
    responseTimeMs: input.responseTimeMs,
    cpuPercent: input.cpuPercent,
    memoryMb: input.memoryMb,
    memoryPercent: input.memoryPercent ?? 0,
    dbQueryMs: input.dbQueryMs ?? null,
    cacheHitRate: input.cacheHitRate ?? null,
    activeConnections: input.activeConnections ?? 0,
    metadata: input.metadata ?? {},
  };
  storePerformanceSnapshot(snap);
  // Trigger latency alert if applicable
  if (input.responseTimeMs > 1000) {
    publishTelemetryEvent("LatencyExceeded", null, {
      serviceId: input.serviceId, responseTimeMs: input.responseTimeMs,
    });
  }
  return snap;
}

export function listPerformanceSnapshots(serviceId: string, limit = 50): PerformanceSnapshot[] {
  return getPerformanceSnapshots(serviceId).slice(-limit).reverse();
}

export function getPerformanceStats(serviceId: string): {
  avgResponseTimeMs: number;
  avgCpuPercent: number;
  avgMemoryMb: number;
  peakResponseTimeMs: number;
  samples: number;
} | null {
  const snaps = getPerformanceSnapshots(serviceId);
  if (snaps.length === 0) return null;
  const totalRt = snaps.reduce((s, p) => s + p.responseTimeMs, 0);
  const totalCpu = snaps.reduce((s, p) => s + p.cpuPercent, 0);
  const totalMem = snaps.reduce((s, p) => s + p.memoryMb, 0);
  const peakRt = snaps.reduce((m, p) => Math.max(m, p.responseTimeMs), 0);
  return {
    avgResponseTimeMs: totalRt / snaps.length,
    avgCpuPercent: totalCpu / snaps.length,
    avgMemoryMb: totalMem / snaps.length,
    peakResponseTimeMs: peakRt,
    samples: snaps.length,
  };
}

// ===== System 10 — Queue Monitoring =====

export function recordQueueMetric(input: {
  queueName: string;
  type?: QueueType;
  size: number;
  consumers?: number;
  publishRate?: number;
  consumeRate?: number;
  ackRate?: number;
  nackRate?: number;
  deadLetterCount?: number;
  avgLatencyMs?: number;
  status?: HealthStatus;
}): QueueMetrics {
  const m: QueueMetrics = {
    id: randomUUID(), queueName: input.queueName,
    type: input.type ?? "redis",
    size: input.size,
    consumers: input.consumers ?? 0,
    publishRate: input.publishRate ?? 0,
    consumeRate: input.consumeRate ?? 0,
    ackRate: input.ackRate ?? 0,
    nackRate: input.nackRate ?? 0,
    deadLetterCount: input.deadLetterCount ?? 0,
    avgLatencyMs: input.avgLatencyMs ?? 0,
    status: input.status ?? "healthy",
    timestamp: new Date().toISOString(),
  };
  storeQueueMetric(m);
  // Detect blocked queue
  if (m.size > 1000 && m.consumers === 0) {
    publishTelemetryEvent("QueueBlocked", null, { queueName: m.queueName, size: m.size });
  } else if (m.size < 100 && m.status === "healthy") {
    // Check if previously blocked
    const history = getQueueMetrics(m.queueName);
    if (history.length > 1 && history[history.length - 2].size > 1000) {
      publishTelemetryEvent("QueueRecovered", null, { queueName: m.queueName });
    }
  }
  return m;
}

export function listQueueMetrics(queueName?: string, limit = 50): QueueMetrics[] {
  if (queueName) return getQueueMetrics(queueName).slice(-limit).reverse();
  return getAllQueueMetrics().slice(-limit).reverse();
}

export function getQueueSummary(): {
  totalQueues: number;
  totalDepth: number;
  blocked: number;
  deadLetters: number;
  byType: Record<QueueType, number>;
} {
  const all = getAllQueueMetrics();
  const byQueue = new Map<string, QueueMetrics>();
  for (const m of all) {
    const existing = byQueue.get(m.queueName);
    if (!existing || new Date(m.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
      byQueue.set(m.queueName, m);
    }
  }
  const queues = Array.from(byQueue.values());
  const byType: Record<QueueType, number> = { redis: 0, rabbitmq: 0, kafka: 0, bullmq: 0, custom: 0 };
  let totalDepth = 0, blocked = 0, deadLetters = 0;
  for (const q of queues) {
    byType[q.type] += 1;
    totalDepth += q.size;
    if (q.size > 1000 && q.consumers === 0) blocked += 1;
    deadLetters += q.deadLetterCount;
  }
  return { totalQueues: queues.length, totalDepth, blocked, deadLetters, byType };
}

export function supportsAllQueueTypes(): QueueType[] {
  return ["redis", "rabbitmq", "kafka", "bullmq", "custom"];
}
