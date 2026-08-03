/**
 * Systems 8, 9, 10, 11 — Event Metrics, Lifecycle Dashboard,
 * Observability Dashboard, Governance Dashboard.
 *
 * System 8 (Metrics): Per event publish count, consume count, latency,
 *   processing time, queue depth, retry rate, failure rate, consumer count,
 *   version adoption, classification.
 *
 * System 9 (Lifecycle): Current versions, deprecated events, experimental
 *   events, removed events, migration paths, version adoption, compatibility,
 *   ownership validation.
 *
 * System 10 (Observability): Real-time overview, top producers, top consumers,
 *   slow consumers, slow events, queue health, retry trends, dead letters,
 *   throughput, errors, processing latency, SLA compliance.
 *
 * System 11 (Governance): Ownership, validation, policy violations, schema
 *   violations, producer violations, unauthorized publishers, deprecated
 *   contracts, unused contracts, unused consumers, duplicate definitions.
 */
import { getLogger } from "@/lib/logger";
import {
  storeEventMetrics, getEventMetrics, getAllEventMetrics,
  getAllProducerHealth, getAllConsumerHealth,
  getAllPolicyViolations,
} from "./repository";
import {
  listEvents, getContract, verifySingleProducerOwnership,
  listDeprecatedEvents, listStableEvents, listExperimentalEvents,
} from "@/features/game-engine/events";
import { validateEvent } from "@/features/game-engine/events";
import { getPolicies } from "./event-policy-engine";
import { getAllRules, getDeliveryStats } from "./delivery-engine";
import { getClassificationForEvent, generateCatalog } from "./classification-catalog";
import { getAllNodes } from "./correlation-graph";
import type {
  EventMetrics,
  LifecycleDashboard,
  ObservabilityDashboard,
  GovernanceDashboard,
  PlatformHealth,
} from "./types";
import type { EventProducer } from "@/features/game-engine/events";

const log = getLogger("event-governance.dashboard");

// ===========================================================================
// System 8 — Event Metrics
// ===========================================================================

export function recordEventMetrics(input: {
  eventId: string;
  publishCount?: number;
  consumeCount?: number;
  avgLatencyMs?: number;
  p95LatencyMs?: number;
  p99LatencyMs?: number;
  avgProcessingTimeMs?: number;
  queueDepth?: number;
  retryRate?: number;
  failureRate?: number;
  consumerCount?: number;
  versionAdoption?: Record<string, number>;
  lastPublishedAt?: string | null;
  lastConsumedAt?: string | null;
}): EventMetrics {
  const existing = getEventMetrics(input.eventId);
  const classification = getClassificationForEvent(input.eventId);
  const metrics: EventMetrics = {
    eventId: input.eventId,
    publishCount: (existing?.publishCount ?? 0) + (input.publishCount ?? 0),
    consumeCount: (existing?.consumeCount ?? 0) + (input.consumeCount ?? 0),
    avgLatencyMs: input.avgLatencyMs ?? existing?.avgLatencyMs ?? 0,
    p95LatencyMs: input.p95LatencyMs ?? existing?.p95LatencyMs ?? 0,
    p99LatencyMs: input.p99LatencyMs ?? existing?.p99LatencyMs ?? 0,
    avgProcessingTimeMs: input.avgProcessingTimeMs ?? existing?.avgProcessingTimeMs ?? 0,
    queueDepth: input.queueDepth ?? existing?.queueDepth ?? 0,
    retryRate: input.retryRate ?? existing?.retryRate ?? 0,
    failureRate: input.failureRate ?? existing?.failureRate ?? 0,
    consumerCount: input.consumerCount ?? existing?.consumerCount ?? 0,
    versionAdoption: input.versionAdoption ?? existing?.versionAdoption ?? {},
    classification: classification?.classification.eventClass ?? null,
    lastPublishedAt: input.lastPublishedAt ?? existing?.lastPublishedAt ?? null,
    lastConsumedAt: input.lastConsumedAt ?? existing?.lastConsumedAt ?? null,
  };
  storeEventMetrics(metrics);
  return metrics;
}

export function getMetricsForEvent(eventId: string): EventMetrics | null {
  return getEventMetrics(eventId);
}

export function getAllMetrics(): EventMetrics[] {
  return getAllEventMetrics();
}

export function getMetricsStats(): {
  totalEvents: number;
  totalPublished: number;
  totalConsumed: number;
  avgLatencyMs: number;
  avgFailureRate: number;
  totalRetries: number;
} {
  const all = getAllEventMetrics();
  return {
    totalEvents: all.length,
    totalPublished: all.reduce((s, m) => s + m.publishCount, 0),
    totalConsumed: all.reduce((s, m) => s + m.consumeCount, 0),
    avgLatencyMs: all.length > 0 ? Math.round(all.reduce((s, m) => s + m.avgLatencyMs, 0) / all.length) : 0,
    avgFailureRate: all.length > 0 ? Math.round(all.reduce((s, m) => s + m.failureRate, 0) / all.length * 1000) / 1000 : 0,
    totalRetries: all.reduce((s, m) => s + Math.round(m.retryRate * m.publishCount), 0),
  };
}

// ===========================================================================
// System 9 — Event Lifecycle Dashboard
// ===========================================================================

export function generateLifecycleDashboard(): LifecycleDashboard {
  const allContracts = listEvents();
  const deprecated = listDeprecatedEvents();
  const stable = listStableEvents();
  const experimental = listExperimentalEvents();
  const removed = allContracts.filter(c => c.status === "removed");
  const ownershipViolations = verifySingleProducerOwnership();
  const allMetrics = getAllEventMetrics();
  // Version adoption: aggregate version counts
  const versionAdoption: Record<string, number> = {};
  for (const m of allMetrics) {
    for (const [ver, count] of Object.entries(m.versionAdoption)) {
      versionAdoption[ver] = (versionAdoption[ver] ?? 0) + count;
    }
  }
  // Migration paths
  const migrationPaths = deprecated.map(c => ({
    fromEventId: c.eventId,
    toEventId: c.replacementEventId ?? "",
    description: c.deprecationMessage ?? `Migrate from ${c.eventId} to ${c.replacementEventId ?? "replacement"}`,
  }));
  // Compatibility issues
  const compatibilityIssues = allContracts
    .filter(c => c.status === "removed")
    .map(c => ({ eventId: c.eventId, issue: "Event has been removed" }));
  // Ownership validation
  const ownershipValidation = allContracts.map(c => {
    const violation = ownershipViolations.find(v => v.eventId === c.eventId);
    return {
      eventId: c.eventId,
      valid: !violation,
      issue: violation?.issue ?? null,
    };
  });
  return {
    totalEvents: allContracts.length,
    currentVersions: stable.map(c => ({ eventId: c.eventId, version: c.version, status: c.status })),
    deprecatedEvents: deprecated.map(c => ({ eventId: c.eventId, version: c.version, replacementEventId: c.replacementEventId })),
    experimentalEvents: experimental.map(c => ({ eventId: c.eventId, version: c.version })),
    removedEvents: removed.map(c => ({ eventId: c.eventId, version: c.version })),
    migrationPaths,
    versionAdoption,
    compatibilityIssues,
    ownershipValidation,
  };
}

// ===========================================================================
// System 10 — Observability Dashboard
// ===========================================================================

export function generateObservabilityDashboard(): ObservabilityDashboard {
  const producers = getAllProducerHealth();
  const consumers = getAllConsumerHealth();
  const metrics = getAllEventMetrics();
  const deliveryStats = getDeliveryStats();
  const totalPublished = metrics.reduce((s, m) => s + m.publishCount, 0);
  const totalConsumed = metrics.reduce((s, m) => s + m.consumeCount, 0);
  const totalFailures = metrics.reduce((s, m) => s + m.failureRate * m.publishCount, 0);
  const errorRate = totalPublished > 0 ? Math.round((totalFailures / totalPublished) * 1000) / 1000 : 0;
  const avgLatency = metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.avgLatencyMs, 0) / metrics.length)
    : 0;
  const avgProcessingLatency = consumers.length > 0
    ? Math.round(consumers.reduce((s, c) => s + c.avgProcessingMs, 0) / consumers.length)
    : 0;
  // SLA compliance: percentage of events within SLA
  const slaCompliant = metrics.filter(m => m.avgLatencyMs < 5000).length;
  const slaCompliance = metrics.length > 0 ? Math.round((slaCompliant / metrics.length) * 100) : 100;
  return {
    topProducers: producers.sort((a, b) => b.throughput - a.throughput).slice(0, 10).map(p => ({
      producer: p.producer,
      throughput: p.throughput,
      healthScore: p.healthScore,
    })),
    topConsumers: consumers.sort((a, b) => b.totalProcessed - a.totalProcessed).slice(0, 10).map(c => ({
      consumer: c.consumer,
      processed: c.totalProcessed,
      healthScore: c.healthScore,
    })),
    slowConsumers: consumers.filter(c => c.avgProcessingMs > 1000).sort((a, b) => b.avgProcessingMs - a.avgProcessingMs).slice(0, 10).map(c => ({
      consumer: c.consumer,
      avgProcessingMs: c.avgProcessingMs,
    })),
    slowEvents: metrics.filter(m => m.avgLatencyMs > 1000).sort((a, b) => b.avgLatencyMs - a.avgLatencyMs).slice(0, 10).map(m => ({
      eventId: m.eventId,
      avgLatencyMs: m.avgLatencyMs,
    })),
    queueHealth: metrics.filter(m => m.queueDepth > 0).slice(0, 10).map(m => ({
      eventId: m.eventId,
      depth: m.queueDepth,
      lag: 0,
    })),
    retryTrends: [],
    deadLetters: consumers.filter(c => c.deadLetterCount > 0).map(c => ({
      eventId: "*",
      consumer: c.consumer,
      count: c.deadLetterCount,
    })),
    throughput: {
      eventsPerSecond: Math.round(totalPublished / 60),
      eventsPerMinute: totalPublished,
    },
    errorRate,
    avgProcessingLatency,
    slaCompliance,
    updatedAt: new Date().toISOString(),
  };
}

// ===========================================================================
// System 11 — Governance Dashboard
// ===========================================================================

export function generateGovernanceDashboard(): GovernanceDashboard {
  const allContracts = listEvents();
  const ownershipViolations = verifySingleProducerOwnership();
  const policyViolations = getAllPolicyViolations();
  const deprecated = listDeprecatedEvents();
  const allMetrics = getAllEventMetrics();
  const producers = getAllProducerHealth();
  const consumers = getAllConsumerHealth();
  // Ownership
  const ownership = allContracts.map(c => {
    const violation = ownershipViolations.find(v => v.eventId === c.eventId);
    return { eventId: c.eventId, producer: c.producer, valid: !violation };
  });
  // Validation issues — check each contract against a sample payload
  const validationIssues: Array<{ eventId: string; issue: string; severity: string }> = [];
  for (const c of allContracts) {
    const result = validateEvent(
      { eventId: c.eventId, version: c.version, producer: c.producer, payload: c.samplePayload },
      c,
    );
    for (const finding of result.findings) {
      if (finding.severity === "error" || finding.severity === "warning") {
        validationIssues.push({ eventId: c.eventId, issue: finding.message, severity: finding.severity });
      }
    }
  }
  // Schema violations
  const schemaViolations: Array<{ eventId: string; field: string; issue: string }> = [];
  for (const c of allContracts) {
    for (const field of c.schema.fields) {
      if (field.required && !(field.name in c.samplePayload)) {
        schemaViolations.push({ eventId: c.eventId, field: field.name, issue: "Required field missing in sample payload" });
      }
    }
  }
  // Producer violations
  const producerViolations = producers
    .filter(p => p.contractViolations > 0)
    .map(p => ({ producer: p.producer, eventId: "*", issue: `${p.contractViolations} contract violations` }));
  // Unauthorized publishers (would come from monitoring — empty for now)
  const unauthorizedPublishers: Array<{ producer: EventProducer; eventId: string; timestamp: string }> = [];
  // Deprecated contracts
  const deprecatedContracts = deprecated.map(c => ({
    eventId: c.eventId,
    version: c.version,
    replacement: c.replacementEventId,
  }));
  // Unused contracts (no metrics recorded)
  const unusedContracts = allContracts
    .filter(c => !allMetrics.find(m => m.eventId === c.eventId))
    .map(c => ({ eventId: c.eventId, lastUsed: null }));
  // Unused consumers (consumers with no recent activity)
  const unusedConsumers = consumers
    .filter(c => c.totalProcessed === 0)
    .map(c => ({ consumer: c.consumer, lastActive: c.lastProcessingAt }));
  // Duplicate definitions (check for same eventId owned by multiple producers — should be empty)
  const eventToProducers = new Map<string, string[]>();
  for (const c of allContracts) {
    const list = eventToProducers.get(c.eventId) ?? [];
    list.push(c.producer);
    eventToProducers.set(c.eventId, list);
  }
  const duplicateDefinitions = Array.from(eventToProducers.entries())
    .filter(([_, producers]) => producers.length > 1)
    .map(([eventId, producers]) => ({ eventId, producers: producers as never }));
  return {
    ownership,
    validationIssues,
    policyViolations,
    schemaViolations,
    producerViolations,
    unauthorizedPublishers,
    deprecatedContracts,
    unusedContracts,
    unusedConsumers,
    duplicateDefinitions,
  };
}

// ===========================================================================
// Platform Health (for /health endpoint)
// ===========================================================================

export function generatePlatformHealth(): PlatformHealth {
  const producers = getAllProducerHealth();
  const consumers = getAllConsumerHealth();
  const policies = getPolicies();
  const metrics = getAllEventMetrics();
  const violations = getAllPolicyViolations();
  const catalog = generateCatalog();
  const avgHealthScore = producers.length + consumers.length > 0
    ? Math.round(
        (producers.reduce((s, h) => s + h.healthScore, 0) + consumers.reduce((s, h) => s + h.healthScore, 0))
        / (producers.length + consumers.length)
      )
    : 100;
  const unhealthyCount = producers.filter(p => p.status === "unhealthy").length + consumers.filter(c => c.status === "unhealthy").length;
  const status: "healthy" | "degraded" | "unhealthy" = unhealthyCount > 0 ? "unhealthy" : avgHealthScore >= 80 ? "healthy" : "degraded";
  const components = [
    { name: "Policy Engine", status: policies.length > 0 ? "healthy" as const : "degraded" as const, details: `${policies.length} policies` },
    { name: "Delivery Engine", status: "healthy" as const, details: `${getAllRules().length} delivery rules` },
    { name: "Classification", status: "healthy" as const, details: `${catalog.totalEvents} events classified` },
    { name: "Correlation Graph", status: "healthy" as const, details: `${getAllNodes().length} nodes` },
    { name: "Producer Monitor", status: producers.some(p => p.status === "unhealthy") ? "unhealthy" as const : "healthy" as const, details: `${producers.length} producers` },
    { name: "Consumer Monitor", status: consumers.some(c => c.status === "unhealthy") ? "unhealthy" as const : "healthy" as const, details: `${consumers.length} consumers` },
    { name: "Metrics", status: "healthy" as const, details: `${metrics.length} event metrics` },
    { name: "Governance", status: violations.length > 0 ? "degraded" as const : "healthy" as const, details: `${violations.length} violations` },
  ];
  return {
    status,
    totalProducers: producers.length,
    totalConsumers: consumers.length,
    totalEvents: catalog.totalEvents,
    totalPolicies: policies.length,
    activeAlerts: violations.filter(v => v.severity === "error").length,
    deadLetterQueueSize: consumers.reduce((s, c) => s + c.deadLetterCount, 0),
    avgHealthScore,
    components,
    updatedAt: new Date().toISOString(),
  };
}
