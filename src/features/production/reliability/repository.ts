/**
 * EduBek — Reliability repository.
 *
 * Thin Prisma-only layer. Reuses existing tables (HealthSnapshot,
 * CloudJob, CloudWorker, CacheEntry, EventStore, WebhookDelivery,
 * OrchestratorCircuitBreaker, OrchestratorTraceSpan).
 */
import { db } from "@/lib/db";

// ===========================================================================
// Health snapshots (reuse existing)
// ===========================================================================

export async function fetchHealthSnapshots(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.healthSnapshot.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 100,
    select: { id: true, subsystem: true, status: true, score: true, createdAt: true, details: true },
  }).catch(() => []);
}

export async function fetchLatestHealthPerSubsystem() {
  const snapshots = await db.healthSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, subsystem: true, status: true, score: true, createdAt: true },
  }).catch(() => []);
  const latest = new Map<string, typeof snapshots[number]>();
  for (const s of snapshots) {
    if (!latest.has(s.subsystem)) latest.set(s.subsystem, s);
  }
  return Array.from(latest.values());
}

// ===========================================================================
// Cloud jobs + workers (reuse existing)
// ===========================================================================

export async function fetchCloudJobs(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.cloudJob.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 500,
    select: {
      id: true, type: true, queue: true, status: true,
      workerId: true, retryCount: true, maxRetries: true,
      createdAt: true, startedAt: true, completedAt: true,
      errorMessage: true,
    },
  }).catch(() => []);
}

export async function fetchCloudWorkers() {
  return db.cloudWorker.findMany({
    select: { id: true, status: true, lastHeartbeatAt: true, createdAt: true },
  }).catch(() => []);
}

// ===========================================================================
// Circuit breakers (reuse existing)
// ===========================================================================

export async function fetchCircuitBreakers() {
  return db.orchestratorCircuitBreaker.findMany({
    select: { name: true, module: true, state: true, failureCount: true, failureThreshold: true, lastFailureAt: true, resetAt: true, successCount: true },
  }).catch(() => []);
}

// ===========================================================================
// Trace spans (reuse existing — for incident detection)
// ===========================================================================

export async function fetchErrorSpans(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 60 * 60 * 1000);
  return db.orchestratorTraceSpan.findMany({
    where: { startedAt: { gte: since }, status: "error" },
    orderBy: { startedAt: "desc" },
    take: opts.limit ?? 100,
    select: { id: true, spanId: true, traceId: true, module: true, operation: true, status: true, startedAt: true, durationMs: true, attributes: true, logs: true },
  }).catch(() => []);
}

// ===========================================================================
// Cache entries (reuse existing)
// ===========================================================================

export async function fetchCacheEntries() {
  return db.cacheEntry.findMany({
    select: { id: true, namespace: true, key: true, ttlSeconds: true, hitCount: true, missCount: true, expiresAt: true, createdAt: true },
    take: 500,
  }).catch(() => []);
}

// ===========================================================================
// Event store (reuse existing — for backup verification)
// ===========================================================================

export async function fetchEventStoreCount() {
  return db.eventStore.count().catch(() => 0);
}

export async function fetchEventStoreLatest(opts: { limit?: number } = {}) {
  return db.eventStore.findMany({
    orderBy: { occurredAt: "desc" },
    take: opts.limit ?? 5,
    select: { id: true, eventType: true, occurredAt: true, entityId: true, entityType: true },
  }).catch(() => []);
}

// ===========================================================================
// Webhook deliveries (reuse existing — for failure analysis)
// ===========================================================================

export async function fetchWebhookDeliveries(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.webhookDelivery.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 100,
    select: { id: true, status: true, responseCode: true, errorMessage: true, createdAt: true },
  }).catch(() => []);
}

// ===========================================================================
// Digital twins (reuse existing — for backup verification)
// ===========================================================================

export async function fetchDigitalTwinCount() {
  return db.digitalTwin.count().catch(() => 0);
}

export async function fetchDigitalTwinLatest() {
  return db.digitalTwin.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true, twinType: true, entityId: true, updatedAt: true, lastSyncedAt: true },
  }).catch(() => null);
}

// ===========================================================================
// Knowledge graph (reuse existing — for backup verification)
// ===========================================================================

export async function fetchConceptCount() {
  return db.concept.count().catch(() => 0);
}

export async function fetchConceptRelationshipCount() {
  return db.conceptRelationship.count().catch(() => 0);
}

// ===========================================================================
// AI invocations (reuse existing — for failure analysis)
// ===========================================================================

export async function fetchAIInvocationFailures(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.orchestratorAIInvocation.findMany({
    where: { createdAt: { gte: since }, status: "failed" },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
    select: { id: true, provider: true, model: true, status: true, createdAt: true, latencyMs: true },
  }).catch(() => []);
}

// ===========================================================================
// Marketplace (reuse existing — for backup verification)
// ===========================================================================

export async function fetchMarketplaceListingCount() {
  return db.marketplaceListing.count().catch(() => 0);
}

// ===========================================================================
// Helpers
// ===========================================================================

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
