/**
 * EduBek — Platform Orchestrator repository.
 *
 * Thin Prisma-only layer for orchestrator persistence. All business logic
 * lives in `service.ts` and the dedicated subsystem files.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";

const log = getLogger("platform-orchestrator-repo");

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ===========================================================================
// Prompts
// ===========================================================================

export async function createPrompt(input: {
  promptId: string; name: string; description: string; module: string;
  version: number; versionTag: string; template: string;
  variables: unknown[]; providerOverride?: string | null; modelOverride?: string | null;
  localizations: unknown[]; active: boolean; experimentId?: string | null;
  evaluation?: unknown | null; notes?: string | null; createdBy?: string | null;
}) {
  return db.orchestratorPrompt.create({
    data: {
      promptId: input.promptId, name: input.name, description: input.description,
      module: input.module, version: input.version, versionTag: input.versionTag,
      template: input.template, variables: JSON.stringify(input.variables),
      providerOverride: input.providerOverride ?? null,
      modelOverride: input.modelOverride ?? null,
      localizations: JSON.stringify(input.localizations),
      active: input.active, experimentId: input.experimentId ?? null,
      evaluation: input.evaluation ? JSON.stringify(input.evaluation) : null,
      notes: input.notes ?? null, createdBy: input.createdBy ?? null,
    },
  });
}

export async function findPromptById(promptId: string) {
  // Active version first
  return db.orchestratorPrompt.findFirst({
    where: { promptId, active: true },
    orderBy: { version: "desc" },
  });
}

export async function findPromptVersion(promptId: string, version: number) {
  return db.orchestratorPrompt.findUnique({
    where: { promptId_version: { promptId, version } },
  });
}

export async function listPrompts(opts: { module?: string; activeOnly?: boolean } = {}) {
  const where: Record<string, unknown> = {};
  if (opts.module) where.module = opts.module;
  if (opts.activeOnly) where.active = true;
  // Group by promptId, take the latest active version
  const rows = await db.orchestratorPrompt.findMany({
    where,
    orderBy: [{ promptId: "asc" }, { version: "desc" }],
  });
  // Deduplicate by promptId — keep the highest version row
  const byId = new Map<string, typeof rows[number]>();
  for (const row of rows) {
    if (!byId.has(row.promptId)) byId.set(row.promptId, row);
  }
  return Array.from(byId.values());
}

export async function listPromptVersions(promptId: string) {
  return db.orchestratorPrompt.findMany({
    where: { promptId },
    orderBy: { version: "desc" },
  });
}

export async function updatePromptActive(promptId: string, version: number, active: boolean) {
  return db.orchestratorPrompt.update({
    where: { promptId_version: { promptId, version } },
    data: { active },
  });
}

export async function updatePromptEvaluation(promptId: string, version: number, evaluation: unknown) {
  return db.orchestratorPrompt.update({
    where: { promptId_version: { promptId, version } },
    data: { evaluation: JSON.stringify(evaluation) },
  });
}

// ===========================================================================
// Workflow executions
// ===========================================================================

export async function createWorkflowExecution(input: {
  workflowId: string; triggerEvent: string; triggerPayload: unknown;
  status: string; steps: unknown[]; traceId: string;
}) {
  return db.orchestratorWorkflowExecution.create({
    data: {
      workflowId: input.workflowId, triggerEvent: input.triggerEvent,
      triggerPayload: JSON.stringify(input.triggerPayload),
      status: input.status, steps: JSON.stringify(input.steps),
      traceId: input.traceId,
    },
  });
}

export async function updateWorkflowExecution(id: string, input: {
  status: string; steps?: unknown[]; finishedAt?: Date; totalDurationMs?: number | null;
}) {
  return db.orchestratorWorkflowExecution.update({
    where: { id },
    data: {
      status: input.status,
      steps: input.steps ? JSON.stringify(input.steps) : undefined,
      finishedAt: input.finishedAt,
      totalDurationMs: input.totalDurationMs,
    },
  });
}

export async function findWorkflowExecution(id: string) {
  return db.orchestratorWorkflowExecution.findUnique({ where: { id } });
}

export async function listWorkflowExecutions(limit = 50) {
  return db.orchestratorWorkflowExecution.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function countWorkflowExecutionsByStatus(status: string, since: Date) {
  return db.orchestratorWorkflowExecution.count({
    where: { status, startedAt: { gte: since } },
  });
}

// ===========================================================================
// AI invocations
// ===========================================================================

export async function createAIInvocation(input: {
  traceId: string; promptId?: string | null; promptVersion?: number | null;
  provider: string; model: string; input: unknown; output: unknown;
  status: string; userId?: string | null; organizationId?: string | null;
  tokensIn: number; tokensOut: number; costUsd: number; latencyMs: number;
}) {
  return db.orchestratorAIInvocation.create({
    data: {
      traceId: input.traceId, promptId: input.promptId ?? null,
      promptVersion: input.promptVersion ?? null,
      provider: input.provider, model: input.model,
      input: JSON.stringify(input.input), output: JSON.stringify(input.output),
      status: input.status, userId: input.userId ?? null,
      organizationId: input.organizationId ?? null,
      tokensIn: input.tokensIn, tokensOut: input.tokensOut,
      costUsd: input.costUsd, latencyMs: input.latencyMs,
    },
  });
}

export async function listAIInvocations(limit = 50) {
  return db.orchestratorAIInvocation.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countAIInvocationsSince(since: Date) {
  return db.orchestratorAIInvocation.count({ where: { createdAt: { gte: since } } });
}

export async function averageAILatencySince(since: Date) {
  const rows = await db.orchestratorAIInvocation.findMany({
    where: { createdAt: { gte: since } },
    select: { latencyMs: true, status: true },
  });
  if (rows.length === 0) return { avg: 0, successRate: 0 };
  const total = rows.reduce((s, r) => s + r.latencyMs, 0);
  const succeeded = rows.filter(r => r.status === "succeeded").length;
  return { avg: Math.round(total / rows.length), successRate: succeeded / rows.length };
}

// ===========================================================================
// Trace spans
// ===========================================================================

export async function createTraceSpan(input: {
  spanId: string; parentSpanId?: string | null; traceId: string;
  module: string; operation: string; status: string; attributes?: unknown;
}) {
  return db.orchestratorTraceSpan.create({
    data: {
      spanId: input.spanId, parentSpanId: input.parentSpanId ?? null,
      traceId: input.traceId, module: input.module, operation: input.operation,
      status: input.status, attributes: JSON.stringify(input.attributes ?? {}),
      logs: "[]",
    },
  });
}

export async function finishTraceSpan(spanId: string, traceId: string, input: {
  status: string; durationMs: number; logs?: unknown[];
}) {
  // We update by spanId+traceId pair — there's no unique constraint on spanId alone
  // Find the row first
  const row = await db.orchestratorTraceSpan.findFirst({
    where: { spanId, traceId },
    orderBy: { startedAt: "desc" },
  });
  if (!row) return null;
  return db.orchestratorTraceSpan.update({
    where: { id: row.id },
    data: {
      status: input.status, durationMs: input.durationMs,
      finishedAt: new Date(), logs: JSON.stringify(input.logs ?? []),
    },
  });
}

export async function listTraceSpans(traceId: string) {
  return db.orchestratorTraceSpan.findMany({
    where: { traceId },
    orderBy: { startedAt: "asc" },
  });
}

export async function listRecentTraces(limit = 20) {
  // Get distinct traceIds by listing recent spans
  const rows = await db.orchestratorTraceSpan.findMany({
    orderBy: { startedAt: "desc" },
    take: limit * 10,
    select: { traceId: true, startedAt: true, status: true, module: true, operation: true },
  });
  const seen = new Map<string, { traceId: string; startedAt: Date; hasError: boolean; modules: Set<string>; rootOp: string }>();
  for (const r of rows) {
    let entry = seen.get(r.traceId);
    if (!entry) {
      entry = { traceId: r.traceId, startedAt: r.startedAt, hasError: false, modules: new Set(), rootOp: r.operation };
      seen.set(r.traceId, entry);
    }
    entry.modules.add(r.module);
    if (r.status === "error") entry.hasError = true;
  }
  return Array.from(seen.values()).slice(0, limit);
}

export async function countActiveTraces() {
  // Traces that have at least one span without finishedAt
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const rows = await db.orchestratorTraceSpan.findMany({
    where: { startedAt: { gte: since }, finishedAt: null },
    select: { traceId: true },
    distinct: ["traceId"],
  });
  return rows.length;
}

export async function getTraceStats(since: Date) {
  const rows = await db.orchestratorTraceSpan.findMany({
    where: { startedAt: { gte: since } },
    select: { module: true, status: true, durationMs: true },
  });
  const errorByModule = new Map<string, number>();
  const latencyByModule = new Map<string, number[]>();
  let errors = 0;
  let total = 0;
  const durations: number[] = [];
  for (const r of rows) {
    total++;
    if (r.status === "error" || r.status === "timeout") {
      errors++;
      errorByModule.set(r.module, (errorByModule.get(r.module) ?? 0) + 1);
    }
    if (r.durationMs != null) {
      durations.push(r.durationMs);
      const arr = latencyByModule.get(r.module) ?? [];
      arr.push(r.durationMs);
      latencyByModule.set(r.module, arr);
    }
  }
  const percentile = (arr: number[], p: number): number => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * p);
    return sorted[Math.min(idx, sorted.length - 1)] ?? 0;
  };
  const topErrorModules = Array.from(errorByModule.entries())
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const slowestModules = Array.from(latencyByModule.entries())
    .map(([module, arr]) => ({ module, p95Ms: percentile(arr, 0.95) }))
    .filter(x => x.p95Ms > 0)
    .sort((a, b) => b.p95Ms - a.p95Ms)
    .slice(0, 5);
  return {
    errorRate: total === 0 ? 0 : errors / total,
    p50LatencyMs: percentile(durations, 0.5),
    p95LatencyMs: percentile(durations, 0.95),
    p99LatencyMs: percentile(durations, 0.99),
    topErrorModules,
    slowestModules,
    throughput: total / (60 * 60), // per second over the last hour
  };
}

// ===========================================================================
// Self-healing actions
// ===========================================================================

export async function createHealingAction(input: {
  kind: string; module: string; triggerType: string; triggerDetails: unknown;
  status: string; autoExecuted: boolean;
}) {
  return db.orchestratorHealingAction.create({
    data: {
      kind: input.kind, module: input.module, triggerType: input.triggerType,
      triggerDetails: JSON.stringify(input.triggerDetails), status: input.status,
      autoExecuted: input.autoExecuted,
      resultMessage: "pending",
    },
  });
}

export async function updateHealingAction(id: string, input: {
  status: string; startedAt?: Date | null; finishedAt?: Date | null;
  durationMs?: number | null; resultSuccess?: boolean; resultMessage?: string;
  resultDetails?: unknown;
}) {
  return db.orchestratorHealingAction.update({
    where: { id },
    data: {
      status: input.status, startedAt: input.startedAt, finishedAt: input.finishedAt,
      durationMs: input.durationMs, resultSuccess: input.resultSuccess,
      resultMessage: input.resultMessage,
      resultDetails: JSON.stringify(input.resultDetails ?? {}),
    },
  });
}

export async function listHealingActions(limit = 50) {
  return db.orchestratorHealingAction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countHealingActionsSince(since: Date) {
  return db.orchestratorHealingAction.count({ where: { createdAt: { gte: since } } });
}

export async function getHealingSuccessRate(since: Date) {
  const rows = await db.orchestratorHealingAction.findMany({
    where: { createdAt: { gte: since } },
    select: { resultSuccess: true },
  });
  if (rows.length === 0) return 0;
  const succeeded = rows.filter(r => r.resultSuccess).length;
  return succeeded / rows.length;
}

// ===========================================================================
// Detected issues
// ===========================================================================

export async function createDetectedIssue(input: {
  module: string; severity: string; description: string; autoHealable: boolean;
}) {
  return db.orchestratorDetectedIssue.create({
    data: {
      module: input.module, severity: input.severity, description: input.description,
      autoHealable: input.autoHealable,
    },
  });
}

export async function listOpenDetectedIssues() {
  return db.orchestratorDetectedIssue.findMany({
    where: { resolvedAt: null },
    orderBy: { detectedAt: "desc" },
  });
}

export async function resolveDetectedIssue(id: string, resolution: string) {
  return db.orchestratorDetectedIssue.update({
    where: { id },
    data: { resolvedAt: new Date(), resolution },
  });
}

// ===========================================================================
// Feature flags
// ===========================================================================

export async function listFeatureFlags() {
  return db.orchestratorFeatureFlag.findMany({ orderBy: { key: "asc" } });
}

export async function findFeatureFlag(key: string) {
  return db.orchestratorFeatureFlag.findUnique({ where: { key } });
}

export async function upsertFeatureFlag(input: {
  key: string; description?: string; enabled?: boolean; rollout?: number; cohorts?: string[];
}) {
  return db.orchestratorFeatureFlag.upsert({
    where: { key: input.key },
    update: {
      description: input.description,
      enabled: input.enabled,
      rollout: input.rollout,
      cohorts: input.cohorts ? JSON.stringify(input.cohorts) : undefined,
    },
    create: {
      key: input.key,
      description: input.description ?? "",
      enabled: input.enabled ?? false,
      rollout: input.rollout ?? 0,
      cohorts: JSON.stringify(input.cohorts ?? []),
    },
  });
}

// ===========================================================================
// Circuit breakers
// ===========================================================================

export async function listCircuitBreakers() {
  return db.orchestratorCircuitBreaker.findMany({ orderBy: { name: "asc" } });
}

export async function findCircuitBreaker(name: string) {
  return db.orchestratorCircuitBreaker.findUnique({ where: { name } });
}

export async function upsertCircuitBreaker(input: {
  name: string; module: string; state?: string; failureCount?: number;
  failureThreshold?: number; lastFailureAt?: Date | null; resetAt?: Date | null;
  successCount?: number;
}) {
  return db.orchestratorCircuitBreaker.upsert({
    where: { name: input.name },
    update: {
      state: input.state, failureCount: input.failureCount,
      failureThreshold: input.failureThreshold, lastFailureAt: input.lastFailureAt,
      resetAt: input.resetAt, successCount: input.successCount,
    },
    create: {
      name: input.name, module: input.module,
      state: input.state ?? "closed", failureCount: input.failureCount ?? 0,
      failureThreshold: input.failureThreshold ?? 5,
      lastFailureAt: input.lastFailureAt ?? null, resetAt: input.resetAt ?? null,
      successCount: input.successCount ?? 0,
    },
  });
}

// ===========================================================================
// Idempotency keys
// ===========================================================================

export async function findIdempotencyKey(key: string) {
  return db.orchestratorIdempotencyKey.findUnique({ where: { key } });
}

export async function createIdempotencyKey(input: {
  key: string; status: string; expiresAt: Date;
}) {
  return db.orchestratorIdempotencyKey.create({ data: input });
}

export async function completeIdempotencyKey(key: string, responseHash: string, responsePayload: unknown) {
  return db.orchestratorIdempotencyKey.update({
    where: { key },
    data: { status: "completed", responseHash, responsePayload: JSON.stringify(responsePayload) },
  });
}

export async function countIdempotencyKeys() {
  return db.orchestratorIdempotencyKey.count();
}

// ===========================================================================
// Distributed locks
// ===========================================================================

export async function acquireLock(input: { resource: string; holder: string; ttlMs: number }) {
  const expiresAt = new Date(Date.now() + input.ttlMs);
  // Try to insert — if a non-expired lock exists for this resource, fail
  const existing = await db.orchestratorDistributedLock.findFirst({
    where: { resource: input.resource, expiresAt: { gt: new Date() }, releasedAt: null },
    orderBy: { acquiredAt: "desc" },
  });
  if (existing && existing.holder !== input.holder) return null;
  return db.orchestratorDistributedLock.create({
    data: { resource: input.resource, holder: input.holder, expiresAt },
  });
}

export async function releaseLock(resource: string, holder: string) {
  const row = await db.orchestratorDistributedLock.findFirst({
    where: { resource, holder, releasedAt: null },
    orderBy: { acquiredAt: "desc" },
  });
  if (!row) return null;
  return db.orchestratorDistributedLock.update({
    where: { id: row.id },
    data: { releasedAt: new Date() },
  });
}

export async function countActiveLocks() {
  return db.orchestratorDistributedLock.count({
    where: { expiresAt: { gt: new Date() }, releasedAt: null },
  });
}

export { safeParse, log };
