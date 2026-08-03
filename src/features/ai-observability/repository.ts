/**
 * EduBek — AI Observability repository.
 *
 * Thin Prisma-only layer. Reuses existing tables (OrchestratorAIInvocation,
 * OrchestratorTraceSpan, AIQualityEvaluation, PromptEvaluation,
 * CostSnapshot, InfraMetric, PlatformExperiment) — never duplicates storage.
 */
import { db } from "@/lib/db";

// ===========================================================================
// Reuse OrchestratorAIInvocation (System 1 — Request Tracing)
// ===========================================================================

export async function fetchAIInvocations(opts: {
  since?: Date; provider?: string; model?: string;
  userId?: string; organizationId?: string;
  limit?: number;
} = {}) {
  const where: Record<string, unknown> = {};
  if (opts.since) where.createdAt = { gte: opts.since };
  if (opts.provider) where.provider = opts.provider;
  if (opts.model) where.model = opts.model;
  if (opts.userId) where.userId = opts.userId;
  if (opts.organizationId) where.organizationId = opts.organizationId;
  return db.orchestratorAIInvocation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 500,
    select: {
      id: true, traceId: true, promptId: true, promptVersion: true,
      provider: true, model: true, status: true,
      userId: true, organizationId: true,
      tokensIn: true, tokensOut: true, costUsd: true, latencyMs: true,
      createdAt: true,
    },
  }).catch(() => []);
}

export async function countAIInvocations(opts: { since?: Date } = {}) {
  const where: Record<string, unknown> = {};
  if (opts.since) where.createdAt = { gte: opts.since };
  return db.orchestratorAIInvocation.count({ where }).catch(() => 0);
}

export async function aggregateAICost(opts: { since?: Date } = {}) {
  const since = opts.since ?? new Date(0);
  return db.orchestratorAIInvocation.aggregate({
    where: { createdAt: { gte: since } },
    _sum: { costUsd: true },
    _avg: { costUsd: true, latencyMs: true, tokensIn: true, tokensOut: true },
    _count: true,
  }).catch(() => ({ _sum: { costUsd: 0 }, _avg: { costUsd: 0, latencyMs: 0, tokensIn: 0, tokensOut: 0 }, _count: 0 }));
}

export async function groupAIByProvider(opts: { since?: Date } = {}) {
  const since = opts.since ?? new Date(0);
  return db.orchestratorAIInvocation.groupBy({
    by: ["provider"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    _sum: { costUsd: true, tokensIn: true, tokensOut: true },
    _avg: { latencyMs: true, costUsd: true },
  }).catch(() => []);
}

export async function groupAIByModel(opts: { since?: Date } = {}) {
  const since = opts.since ?? new Date(0);
  return db.orchestratorAIInvocation.groupBy({
    by: ["model"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    _sum: { costUsd: true },
    _avg: { latencyMs: true, costUsd: true },
  }).catch(() => []);
}

// ===========================================================================
// Reuse OrchestratorTraceSpan (System 1 — tracing timeline)
// ===========================================================================

export async function fetchTraceSpans(opts: {
  traceId?: string; since?: Date; limit?: number;
} = {}) {
  const where: Record<string, unknown> = {};
  if (opts.traceId) where.traceId = opts.traceId;
  if (opts.since) where.startedAt = { gte: opts.since };
  return db.orchestratorTraceSpan.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: opts.limit ?? 500,
    select: {
      id: true, spanId: true, parentSpanId: true, traceId: true,
      module: true, operation: true, status: true,
      startedAt: true, finishedAt: true, durationMs: true,
      attributes: true,
    },
  }).catch(() => []);
}

// ===========================================================================
// Reuse AIQualityEvaluation (Systems 7, 8, 9 — quality metrics)
// ===========================================================================

export async function fetchQualityEvaluations(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return db.aIQualityEvaluation.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
    select: {
      id: true, provider: true, model: true,
      promptId: true, promptVersion: true,
      overallScore: true, confidence: true,
      metrics: true, createdAt: true,
    },
  }).catch(() => []);
}

// ===========================================================================
// Reuse PromptEvaluation (Systems 2, 3 — acceptance, edit rates)
// ===========================================================================

export async function fetchPromptEvaluations(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return db.promptEvaluation.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
    select: {
      id: true, promptTemplateId: true, promptVersion: true,
      provider: true, model: true,
      acceptanceScore: true, regenerationRate: true, editRate: true,
      userRating: true, latencyMs: true, createdAt: true,
    },
  }).catch(() => []);
}

// ===========================================================================
// Reuse PlatformExperiment (System 6 — experiments)
// ===========================================================================

export async function fetchPlatformExperiments(opts: { status?: string; limit?: number } = {}) {
  const where: Record<string, unknown> = {};
  if (opts.status) where.status = opts.status;
  return db.platformExperiment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
    select: {
      id: true, name: true, description: true, type: true,
      variants: true, status: true, successMetric: true,
      winnerVariant: true, winnerConfidence: true,
      startsAt: true, endsAt: true, createdAt: true, updatedAt: true,
    },
  }).catch(() => []);
}

// ===========================================================================
// AI Observability experiments (additive)
// ===========================================================================

export async function createExperiment(input: {
  name: string; type: string; description?: string;
  variants?: unknown[]; successMetric?: string;
}) {
  return db.aIObservabilityExperiment.create({
    data: {
      name: input.name, type: input.type,
      description: input.description ?? "",
      variants: JSON.stringify(input.variants ?? []),
      successMetric: input.successMetric ?? "quality",
    },
  });
}

export async function findExperiment(id: string) {
  return db.aIObservabilityExperiment.findUnique({ where: { id } });
}

export async function listExperiments(status?: string) {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  return db.aIObservabilityExperiment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function updateExperiment(id: string, input: {
  status?: string; results?: unknown; winnerVariant?: string | null;
  winnerConfidence?: number;
}) {
  const data: Record<string, unknown> = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.results !== undefined) data.results = JSON.stringify(input.results);
  if (input.winnerVariant !== undefined) data.winnerVariant = input.winnerVariant;
  if (input.winnerConfidence !== undefined) data.winnerConfidence = input.winnerConfidence;
  return db.aIObservabilityExperiment.update({ where: { id }, data });
}

// ===========================================================================
// AI Observability anomalies (additive)
// ===========================================================================

export async function createAnomaly(input: {
  kind: string; severity: string; confidence?: number;
  description: string; rootCauseHypothesis?: string;
  affectedSystems?: string[]; recommendedActions?: string[];
}) {
  return db.aIObservabilityAnomaly.create({
    data: {
      kind: input.kind, severity: input.severity,
      confidence: input.confidence ?? 0.5,
      description: input.description,
      rootCauseHypothesis: input.rootCauseHypothesis ?? "",
      affectedSystems: JSON.stringify(input.affectedSystems ?? []),
      recommendedActions: JSON.stringify(input.recommendedActions ?? []),
    },
  });
}

export async function listAnomalies(limit = 50) {
  return db.aIObservabilityAnomaly.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ===========================================================================
// AI Observability alerts (additive)
// ===========================================================================

export async function createAlert(input: {
  kind: string; severity: string; title: string;
  description: string; affectedSystems?: string[];
  recommendedActions?: string[];
}) {
  return db.aIObservabilityAlert.create({
    data: {
      kind: input.kind, severity: input.severity,
      title: input.title, description: input.description,
      affectedSystems: JSON.stringify(input.affectedSystems ?? []),
      recommendedActions: JSON.stringify(input.recommendedActions ?? []),
    },
  });
}

export async function listAlerts(limit = 50) {
  return db.aIObservabilityAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function acknowledgeAlert(id: string) {
  return db.aIObservabilityAlert.update({
    where: { id },
    data: { acknowledgedAt: new Date() },
  });
}

export async function resolveAlert(id: string) {
  return db.aIObservabilityAlert.update({
    where: { id },
    data: { resolvedAt: new Date(), severity: "resolved" },
  });
}

// ===========================================================================
// Helpers
// ===========================================================================

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)] ?? 0;
}
