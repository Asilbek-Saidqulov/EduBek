/**
 * Systems 6 + 7 — Producer Health + Consumer Health.
 *
 * System 6 (Producer Health): Per producer throughput, errors, latency,
 *   ownership, contract violations, version usage, deprecated usage, health score.
 *
 * System 7 (Consumer Health): Per consumer processing latency, queue lag,
 *   retry count, dead letters, success rate, average processing, last processing,
 *   health score.
 */
import { getLogger } from "@/lib/logger";
import {
  storeProducerHealth, getProducerHealth, getAllProducerHealth,
  storeConsumerHealth, getConsumerHealth, getAllConsumerHealth,
} from "./repository";
import { listEventsByProducer } from "@/features/game-engine/events";
import type {
  ProducerHealth,
  ConsumerHealth,
} from "./types";
import type { EventProducer } from "@/features/game-engine/events";

const log = getLogger("event-governance.monitor");

// ===========================================================================
// Health score computation (deterministic)
// ===========================================================================

function computeHealthScore(metrics: {
  errorRate: number;
  successRate: number;
  avgLatencyMs: number;
  targetLatencyMs: number;
}): number {
  // Health score = weighted combination of:
  //   - Success rate (50% weight)
  //   - Latency compliance (30% weight)
  //   - Error rate penalty (20% weight)
  const successScore = metrics.successRate * 50;
  const latencyRatio = metrics.targetLatencyMs > 0
    ? Math.min(1, metrics.targetLatencyMs / Math.max(1, metrics.avgLatencyMs))
    : 1;
  const latencyScore = latencyRatio * 30;
  const errorPenalty = metrics.errorRate * 20;
  return Math.max(0, Math.min(100, Math.round(successScore + latencyScore - errorPenalty)));
}

function computeStatus(healthScore: number): "healthy" | "degraded" | "unhealthy" {
  if (healthScore >= 80) return "healthy";
  if (healthScore >= 50) return "degraded";
  return "unhealthy";
}

// ===========================================================================
// System 6 — Producer Health
// ===========================================================================

export function recordProducerMetrics(input: {
  producer: EventProducer;
  throughput?: number;
  totalEvents?: number;
  errorCount?: number;
  errorRate?: number;
  avgLatencyMs?: number;
  p95LatencyMs?: number;
  p99LatencyMs?: number;
  contractViolations?: number;
  versionUsage?: Record<string, number>;
  deprecatedUsage?: number;
  lastEventAt?: string | null;
}): ProducerHealth {
  const existing = getProducerHealth(input.producer);
  const now = new Date().toISOString();
  const throughput = input.throughput ?? existing?.throughput ?? 0;
  const totalEvents = (existing?.totalEvents ?? 0) + (input.totalEvents ?? 0);
  const errorCount = (existing?.errorCount ?? 0) + (input.errorCount ?? 0);
  const errorRate = input.errorRate ?? (totalEvents > 0 ? errorCount / totalEvents : 0);
  const avgLatencyMs = input.avgLatencyMs ?? existing?.avgLatencyMs ?? 0;
  const p95LatencyMs = input.p95LatencyMs ?? existing?.p95LatencyMs ?? 0;
  const p99LatencyMs = input.p99LatencyMs ?? existing?.p99LatencyMs ?? 0;
  const contractViolations = (existing?.contractViolations ?? 0) + (input.contractViolations ?? 0);
  const versionUsage = input.versionUsage ?? existing?.versionUsage ?? {};
  const deprecatedUsage = (existing?.deprecatedUsage ?? 0) + (input.deprecatedUsage ?? 0);
  const ownedEvents = listEventsByProducer(input.producer).map(c => c.eventId);
  const healthScore = computeHealthScore({
    errorRate,
    successRate: 1 - errorRate,
    avgLatencyMs,
    targetLatencyMs: 1000,
  });
  const health: ProducerHealth = {
    producer: input.producer,
    throughput,
    totalEvents,
    errorCount,
    errorRate: Math.round(errorRate * 1000) / 1000,
    avgLatencyMs: Math.round(avgLatencyMs),
    p95LatencyMs: Math.round(p95LatencyMs),
    p99LatencyMs: Math.round(p99LatencyMs),
    ownedEvents,
    contractViolations,
    versionUsage,
    deprecatedUsage,
    healthScore,
    status: computeStatus(healthScore),
    lastEventAt: input.lastEventAt ?? existing?.lastEventAt ?? null,
    updatedAt: now,
  };
  storeProducerHealth(health);
  log.debug("producer.health.recorded", { producer: input.producer, healthScore });
  return health;
}

export function getProducerHealthRecord(producer: EventProducer): ProducerHealth | null {
  return getProducerHealth(producer);
}

export function getAllProducerHealthRecords(): ProducerHealth[] {
  return getAllProducerHealth();
}

export function getUnhealthyProducers(): ProducerHealth[] {
  return getAllProducerHealth().filter(h => h.status === "unhealthy");
}

export function getDegradedProducers(): ProducerHealth[] {
  return getAllProducerHealth().filter(h => h.status === "degraded");
}

// ===========================================================================
// System 7 — Consumer Health
// ===========================================================================

export function recordConsumerMetrics(input: {
  consumer: EventProducer;
  processingLatencyMs?: number;
  p95ProcessingMs?: number;
  queueLag?: number;
  retryCount?: number;
  deadLetterCount?: number;
  successRate?: number;
  avgProcessingMs?: number;
  totalProcessed?: number;
  totalFailed?: number;
  lastProcessingAt?: string | null;
  subscribedEvents?: string[];
}): ConsumerHealth {
  const existing = getConsumerHealth(input.consumer);
  const now = new Date().toISOString();
  const totalProcessed = (existing?.totalProcessed ?? 0) + (input.totalProcessed ?? 0);
  const totalFailed = (existing?.totalFailed ?? 0) + (input.totalFailed ?? 0);
  const successRate = input.successRate ?? (totalProcessed > 0 ? (totalProcessed - totalFailed) / totalProcessed : 1);
  const errorRate = 1 - successRate;
  const avgProcessingMs = input.avgProcessingMs ?? existing?.avgProcessingMs ?? 0;
  const healthScore = computeHealthScore({
    errorRate,
    successRate,
    avgLatencyMs: avgProcessingMs,
    targetLatencyMs: 2000,
  });
  const health: ConsumerHealth = {
    consumer: input.consumer,
    processingLatencyMs: input.processingLatencyMs ?? existing?.processingLatencyMs ?? 0,
    p95ProcessingMs: input.p95ProcessingMs ?? existing?.p95ProcessingMs ?? 0,
    queueLag: input.queueLag ?? existing?.queueLag ?? 0,
    retryCount: (existing?.retryCount ?? 0) + (input.retryCount ?? 0),
    deadLetterCount: (existing?.deadLetterCount ?? 0) + (input.deadLetterCount ?? 0),
    successRate: Math.round(successRate * 1000) / 1000,
    avgProcessingMs: Math.round(avgProcessingMs),
    totalProcessed,
    totalFailed,
    lastProcessingAt: input.lastProcessingAt ?? existing?.lastProcessingAt ?? null,
    healthScore,
    status: computeStatus(healthScore),
    subscribedEvents: input.subscribedEvents ?? existing?.subscribedEvents ?? [],
    updatedAt: now,
  };
  storeConsumerHealth(health);
  log.debug("consumer.health.recorded", { consumer: input.consumer, healthScore });
  return health;
}

export function getConsumerHealthRecord(consumer: EventProducer): ConsumerHealth | null {
  return getConsumerHealth(consumer);
}

export function getAllConsumerHealthRecords(): ConsumerHealth[] {
  return getAllConsumerHealth();
}

export function getUnhealthyConsumers(): ConsumerHealth[] {
  return getAllConsumerHealth().filter(h => h.status === "unhealthy");
}

export function getDegradedConsumers(): ConsumerHealth[] {
  return getAllConsumerHealth().filter(h => h.status === "degraded");
}

export function getSlowConsumers(thresholdMs = 5000): ConsumerHealth[] {
  return getAllConsumerHealth().filter(h => h.avgProcessingMs > thresholdMs);
}

// ===========================================================================
// Combined health statistics
// ===========================================================================

export function getOverallHealthStats(): {
  totalProducers: number;
  totalConsumers: number;
  healthyProducers: number;
  degradedProducers: number;
  unhealthyProducers: number;
  healthyConsumers: number;
  degradedConsumers: number;
  unhealthyConsumers: number;
  avgProducerHealthScore: number;
  avgConsumerHealthScore: number;
} {
  const producers = getAllProducerHealth();
  const consumers = getAllConsumerHealth();
  const avgProducer = producers.length > 0
    ? Math.round(producers.reduce((s, h) => s + h.healthScore, 0) / producers.length)
    : 0;
  const avgConsumer = consumers.length > 0
    ? Math.round(consumers.reduce((s, h) => s + h.healthScore, 0) / consumers.length)
    : 0;
  return {
    totalProducers: producers.length,
    totalConsumers: consumers.length,
    healthyProducers: producers.filter(h => h.status === "healthy").length,
    degradedProducers: producers.filter(h => h.status === "degraded").length,
    unhealthyProducers: producers.filter(h => h.status === "unhealthy").length,
    healthyConsumers: consumers.filter(h => h.status === "healthy").length,
    degradedConsumers: consumers.filter(h => h.status === "degraded").length,
    unhealthyConsumers: consumers.filter(h => h.status === "unhealthy").length,
    avgProducerHealthScore: avgProducer,
    avgConsumerHealthScore: avgConsumer,
  };
}
