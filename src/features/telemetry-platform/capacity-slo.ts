/** Systems 16, 17, 18, 19, 20 — Capacity, Profiling, Snapshots, Diagnostics, SLO. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeCapacitySnapshot, getCapacitySnapshots,
  storeProfileSample, getProfileSamples, getAllProfileSamples,
  appendPlatformSnapshot, getAllPlatformSnapshots, getLatestPlatformSnapshot,
  appendDiagnosticReport, getAllDiagnosticReports, getLatestDiagnosticReport,
  storeSLODefinition, getSLODefinition, getAllSLODefinitions,
  storeSLOStatus, getSLOStatus, getAllSLOStatuses,
  getAllServices, getAllHealthChecks, getAllTraces,
} from "./repository";
import type {
  CapacitySnapshot,
  ProfileSample,
  PlatformSnapshot,
  DiagnosticReport, DiagnosticCheck, DiagnosticCheckType, DiagnosticCheckStatus,
  SLODefinition, SLOType, SLOStatus,
} from "./types";
import { publishTelemetryEvent } from "./event-bus-bridge";

const log = getLogger("telemetry.capacity");

// ===== System 16 — Capacity Monitoring =====

export function recordCapacitySnapshot(input: {
  serviceId: string;
  connections: number;
  maxConnections: number;
  storageMb: number;
  maxStorageMb: number;
  bandwidthMbps?: number;
  maxBandwidthMbps?: number;
  workers?: number;
  maxWorkers?: number;
  metadata?: Record<string, unknown>;
}): CapacitySnapshot {
  const utilizationPercent = Math.max(
    (input.connections / Math.max(1, input.maxConnections)) * 100,
    (input.storageMb / Math.max(1, input.maxStorageMb)) * 100,
  );
  const snap: CapacitySnapshot = {
    id: randomUUID(), serviceId: input.serviceId,
    timestamp: new Date().toISOString(),
    connections: input.connections,
    maxConnections: input.maxConnections,
    storageMb: input.storageMb,
    maxStorageMb: input.maxStorageMb,
    bandwidthMbps: input.bandwidthMbps ?? 0,
    maxBandwidthMbps: input.maxBandwidthMbps ?? 0,
    workers: input.workers ?? 0,
    maxWorkers: input.maxWorkers ?? 0,
    utilizationPercent,
    metadata: input.metadata ?? {},
  };
  storeCapacitySnapshot(snap);
  if (utilizationPercent > 80) {
    publishTelemetryEvent("CapacityWarning", null, {
      serviceId: input.serviceId, utilizationPercent,
    });
  }
  return snap;
}

export function listCapacitySnapshots(serviceId: string, limit = 50): CapacitySnapshot[] {
  return getCapacitySnapshots(serviceId).slice(-limit).reverse();
}

export function getCapacityUtilization(serviceId: string): {
  current: number;
  peak: number;
  avg: number;
  samples: number;
} | null {
  const snaps = getCapacitySnapshots(serviceId);
  if (snaps.length === 0) return null;
  const current = snaps[snaps.length - 1].utilizationPercent;
  const peak = snaps.reduce((m, s) => Math.max(m, s.utilizationPercent), 0);
  const avg = snaps.reduce((s, c) => s + c.utilizationPercent, 0) / snaps.length;
  return { current, peak, avg, samples: snaps.length };
}

export function getPlatformCapacitySummary(): {
  servicesTracked: number;
  avgUtilization: number;
  atRiskCount: number;
} {
  const services = getAllServices();
  let totalUtil = 0, tracked = 0, atRisk = 0;
  for (const s of services) {
    const snaps = getCapacitySnapshots(s.id);
    if (snaps.length > 0) {
      const latest = snaps[snaps.length - 1];
      totalUtil += latest.utilizationPercent;
      tracked += 1;
      if (latest.utilizationPercent > 80) atRisk += 1;
    }
  }
  return {
    servicesTracked: tracked,
    avgUtilization: tracked > 0 ? totalUtil / tracked : 0,
    atRiskCount: atRisk,
  };
}

// ===== System 17 — Profiling Platform =====

export function recordProfileSample(input: {
  serviceId: string;
  method: string;
  durationMs: number;
  memoryMb?: number;
  cpuPercent?: number;
  callCount?: number;
  hotPath?: boolean;
  stackTrace?: string | null;
  metadata?: Record<string, unknown>;
}): ProfileSample {
  const sample: ProfileSample = {
    id: randomUUID(), serviceId: input.serviceId,
    method: input.method,
    durationMs: input.durationMs,
    memoryMb: input.memoryMb ?? 0,
    cpuPercent: input.cpuPercent ?? 0,
    callCount: input.callCount ?? 1,
    sampledAt: new Date().toISOString(),
    hotPath: input.hotPath ?? input.durationMs > 500,
    stackTrace: input.stackTrace ?? null,
    metadata: input.metadata ?? {},
  };
  storeProfileSample(sample);
  return sample;
}

export function listProfileSamples(serviceId?: string, limit = 50): ProfileSample[] {
  if (serviceId) return getProfileSamples(serviceId).slice(-limit).reverse();
  return getAllProfileSamples().slice(-limit).reverse();
}

export function getHotPaths(serviceId?: string, limit = 10): ProfileSample[] {
  const all = serviceId ? getProfileSamples(serviceId) : getAllProfileSamples();
  return all.filter(p => p.hotPath).sort((a, b) => b.durationMs - a.durationMs).slice(0, limit);
}

export function getSlowestMethods(serviceId?: string, limit = 10): ProfileSample[] {
  const all = serviceId ? getProfileSamples(serviceId) : getAllProfileSamples();
  return all.sort((a, b) => b.durationMs - a.durationMs).slice(0, limit);
}

// ===== System 18 — Snapshot Platform =====

export function takePlatformSnapshot(input: {
  trigger?: "manual" | "scheduled" | "incident" | "diagnostic";
  details?: Record<string, unknown>;
}): PlatformSnapshot {
  const services = getAllServices();
  const healthChecks = getAllHealthChecks();
  // Aggregate current health per service
  const healthByService = new Map<string, string>();
  for (const c of healthChecks) {
    const existing = healthByService.get(c.serviceId);
    if (!existing || new Date(c.checkedAt).getTime() > new Date(healthByService.get(c.serviceId) ?? "0").getTime()) {
      healthByService.set(c.serviceId, c.status);
    }
  }
  let healthy = 0, degraded = 0, offline = 0;
  for (const s of services) {
    const status = healthByService.get(s.id);
    if (status === "healthy") healthy += 1;
    else if (status === "degraded" || status === "warning") degraded += 1;
    else if (status === "offline") offline += 1;
  }
  // Get recent traces for avg latency
  const traces = getAllTraces().slice(-100);
  const completedTraces = traces.filter(t => t.durationMs !== null);
  const avgLatency = completedTraces.length > 0
    ? completedTraces.reduce((s, t) => s + (t.durationMs ?? 0), 0) / completedTraces.length
    : 0;
  const snapshot: PlatformSnapshot = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    trigger: input.trigger ?? "manual",
    servicesTotal: services.length,
    servicesHealthy: healthy,
    servicesDegraded: degraded,
    servicesOffline: offline,
    incidentsOpen: 0, // computed in dashboard
    alertsActive: 0, // computed in dashboard
    avgLatencyMs: avgLatency,
    eventThroughput: 0, // computed in dashboard
    queueDepth: 0, // computed in dashboard
    details: input.details ?? {},
  };
  appendPlatformSnapshot(snapshot);
  publishTelemetryEvent("SnapshotCreated", null, {
    snapshotId: snapshot.id, trigger: snapshot.trigger,
  });
  log.info("snapshot.created", { id: snapshot.id, trigger: snapshot.trigger });
  return snapshot;
}

export function listPlatformSnapshots(limit = 50): PlatformSnapshot[] {
  return getAllPlatformSnapshots().slice(-limit).reverse();
}

export function getLatestSnapshot(): PlatformSnapshot | null {
  return getLatestPlatformSnapshot();
}

// ===== System 19 — Diagnostics Engine =====

export function runDiagnosticCheck(input: {
  type: DiagnosticCheckType;
  serviceId?: string | null;
  status?: DiagnosticCheckStatus;
  message: string;
  details?: Record<string, unknown>;
  durationMs?: number;
}): DiagnosticCheck {
  return {
    id: randomUUID(), type: input.type,
    serviceId: input.serviceId ?? null,
    status: input.status ?? "pass",
    message: input.message,
    details: input.details ?? {},
    checkedAt: new Date().toISOString(),
    durationMs: input.durationMs ?? 0,
  };
}

export function runDiagnosticReport(input: {
  triggeredBy?: string | null;
  checks?: Array<Omit<DiagnosticCheck, "id" | "checkedAt">>;
}): DiagnosticReport {
  const checks: DiagnosticCheck[] = (input.checks ?? []).map(c => ({
    ...c,
    id: randomUUID(),
    checkedAt: new Date().toISOString(),
  }));
  const passed = checks.filter(c => c.status === "pass").length;
  const warnings = checks.filter(c => c.status === "warn").length;
  const failed = checks.filter(c => c.status === "fail").length;
  const skipped = checks.filter(c => c.status === "skip").length;
  const report: DiagnosticReport = {
    id: randomUUID(),
    triggeredAt: new Date().toISOString(),
    triggeredBy: input.triggeredBy ?? null,
    totalChecks: checks.length,
    passed, warnings, failed, skipped,
    checks,
  };
  appendDiagnosticReport(report);
  publishTelemetryEvent("DiagnosticCompleted", input.triggeredBy ?? null, {
    reportId: report.id, total: report.totalChecks, passed, failed,
  });
  log.info("diagnostic.completed", { id: report.id, passed, failed });
  return report;
}

export function listDiagnosticReports(limit = 50): DiagnosticReport[] {
  return getAllDiagnosticReports().slice(-limit).reverse();
}

export function getLatestDiagnosticReportFor(): DiagnosticReport | null {
  return getLatestDiagnosticReport();
}

export function supportsAllDiagnosticCheckTypes(): DiagnosticCheckType[] {
  return ["redis_connectivity", "database_connectivity", "cache_health", "certificate_expiry", "queue_stalled", "disk_space", "memory_pressure", "cpu_pressure", "service_dependency", "event_bus_health", "auth_provider_reachable", "custom"];
}
export function supportsAllDiagnosticCheckStatuses(): DiagnosticCheckStatus[] {
  return ["pass", "warn", "fail", "skip"];
}

// ===== System 20 — SLO Platform =====

export function createSLO(input: {
  name: string;
  serviceId?: string | null;
  type?: SLOType;
  target: number; // e.g., 0.999
  windowDays?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}): SLODefinition {
  if (input.target < 0 || input.target > 1) throw new Error("target must be between 0 and 1");
  const slo: SLODefinition = {
    id: randomUUID(), name: input.name,
    serviceId: input.serviceId ?? null,
    type: input.type ?? "availability",
    target: input.target,
    windowDays: input.windowDays ?? 30,
    description: input.description ?? "",
    active: true,
    createdAt: new Date().toISOString(),
    metadata: input.metadata ?? {},
  };
  storeSLODefinition(slo);
  // Initialize status
  const errorBudgetTotal = 1 - input.target;
  const status: SLOStatus = {
    sloId: slo.id,
    current: input.target, // start at target
    errorBudgetRemaining: errorBudgetTotal,
    errorBudgetTotal,
    status: "met",
    lastUpdated: new Date().toISOString(),
  };
  storeSLOStatus(status);
  log.info("slo.created", { id: slo.id, target: slo.target });
  return slo;
}

export function getSLOById(id: string): SLODefinition | null { return getSLODefinition(id); }
export function listSLOs(active?: boolean): SLODefinition[] {
  const all = getAllSLODefinitions();
  return active === undefined ? all : all.filter(s => s.active === active);
}

export function updateSLOStatus(sloId: string, current: number): SLOStatus | null {
  const slo = getSLODefinition(sloId);
  if (!slo) return null;
  const errorBudgetUsed = Math.max(0, slo.target - current);
  const errorBudgetRemaining = Math.max(0, (1 - slo.target) - errorBudgetUsed);
  const ratio = errorBudgetRemaining / Math.max(0.0001, 1 - slo.target);
  const status: SLOStatus["status"] = ratio > 0.5 ? "met" : ratio > 0 ? "at_risk" : "breached";
  // Also breached if current below target
  const finalStatus: SLOStatus["status"] = current < slo.target ? "breached" : status;
  const updated: SLOStatus = {
    sloId, current,
    errorBudgetRemaining,
    errorBudgetTotal: 1 - slo.target,
    status: finalStatus,
    lastUpdated: new Date().toISOString(),
  };
  storeSLOStatus(updated);
  return updated;
}

export function getSLOStatusForSLO(sloId: string): SLOStatus | null {
  return getSLOStatus(sloId);
}

export function listSLOStatuses(): SLOStatus[] {
  return getAllSLOStatuses();
}

export function getSLOSummary(): {
  total: number;
  met: number;
  atRisk: number;
  breached: number;
} {
  const statuses = getAllSLOStatuses();
  return {
    total: statuses.length,
    met: statuses.filter(s => s.status === "met").length,
    atRisk: statuses.filter(s => s.status === "at_risk").length,
    breached: statuses.filter(s => s.status === "breached").length,
  };
}

export function supportsAllSLOTypes(): SLOType[] {
  return ["availability", "latency", "error_rate", "throughput", "custom"];
}
