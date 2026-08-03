/**
 * EduBek — AI Governance repository.
 * Thin Prisma-only layer. Reuses existing tables for audit and evaluation data.
 */
import { db } from "@/lib/db";

// ===========================================================================
// Policies
// ===========================================================================

export async function createPolicy(input: {
  scope: string; scopeId?: string | null; name: string;
  description?: string; rules?: unknown[]; inheritedFrom?: string | null;
}) {
  return db.aIGovernancePolicy.create({
    data: {
      scope: input.scope, scopeId: input.scopeId ?? null,
      name: input.name, description: input.description ?? "",
      rules: JSON.stringify(input.rules ?? []),
      inheritedFrom: input.inheritedFrom ?? null,
    },
  });
}

export async function findPolicy(id: string) {
  return db.aIGovernancePolicy.findUnique({ where: { id } });
}

export async function listPolicies(scope?: string, scopeId?: string) {
  const where: Record<string, unknown> = {};
  if (scope) where.scope = scope;
  if (scopeId) where.scopeId = scopeId;
  return db.aIGovernancePolicy.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
}

export async function updatePolicy(id: string, input: { rules?: unknown[]; status?: string }) {
  const data: Record<string, unknown> = {};
  if (input.rules !== undefined) data.rules = JSON.stringify(input.rules);
  if (input.status !== undefined) data.status = input.status;
  return db.aIGovernancePolicy.update({ where: { id }, data });
}

// ===========================================================================
// Approvals
// ===========================================================================

export async function createApproval(input: {
  type: string; title: string; description?: string; requestedBy: string;
}) {
  return db.aIGovernanceApproval.create({
    data: {
      type: input.type, title: input.title,
      description: input.description ?? "", requestedBy: input.requestedBy,
    },
  });
}

export async function findApproval(id: string) {
  return db.aIGovernanceApproval.findUnique({ where: { id } });
}

export async function listApprovals(status?: string) {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  return db.aIGovernanceApproval.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
}

export async function updateApproval(id: string, input: {
  status?: string; reviewedBy?: string; reviewNotes?: string; riskAssessment?: string;
}) {
  const data: Record<string, unknown> = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.reviewedBy !== undefined) data.reviewedBy = input.reviewedBy;
  if (input.reviewNotes !== undefined) data.reviewNotes = input.reviewNotes;
  if (input.riskAssessment !== undefined) data.riskAssessment = input.riskAssessment;
  if (input.status === "approved" || input.status === "rejected") data.reviewedAt = new Date();
  return db.aIGovernanceApproval.update({ where: { id }, data });
}

// ===========================================================================
// Audit
// ===========================================================================

export async function createAuditEntry(input: {
  action: string; actorType?: string; actorId?: string | null;
  entityType?: string | null; entityId?: string | null;
  scope?: string; details?: unknown;
}) {
  return db.aIGovernanceAudit.create({
    data: {
      action: input.action, actorType: input.actorType ?? "system",
      actorId: input.actorId ?? null,
      entityType: input.entityType ?? null, entityId: input.entityId ?? null,
      scope: input.scope ?? "platform",
      details: JSON.stringify(input.details ?? {}),
    },
  });
}

export async function listAuditEntries(opts: { action?: string; actorType?: string; limit?: number } = {}) {
  const where: Record<string, unknown> = {};
  if (opts.action) where.action = opts.action;
  if (opts.actorType) where.actorType = opts.actorType;
  return db.aIGovernanceAudit.findMany({
    where, orderBy: { occurredAt: "desc" }, take: opts.limit ?? 100,
  });
}

// ===========================================================================
// Model governance
// ===========================================================================

export async function upsertModel(input: {
  provider: string; model: string; status?: string;
  approvedBy?: string | null; recommendation?: string | null;
}) {
  return db.aIGovernanceModel.upsert({
    where: { provider_model: { provider: input.provider, model: input.model } },
    update: {
      status: input.status, approvedBy: input.approvedBy,
      recommendation: input.recommendation,
      approvedAt: input.status === "approved" ? new Date() : undefined,
    },
    create: {
      provider: input.provider, model: input.model,
      status: input.status ?? "experimental",
      approvedBy: input.approvedBy ?? null,
      recommendation: input.recommendation ?? null,
      approvedAt: input.status === "approved" ? new Date() : null,
    },
  });
}

export async function listModels(status?: string) {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  return db.aIGovernanceModel.findMany({ where, orderBy: { updatedAt: "desc" } });
}

export async function updateModelHistory(provider: string, model: string, input: {
  qualityHistory?: unknown[]; latencyHistory?: unknown[];
  costHistory?: unknown[]; riskHistory?: unknown[];
}) {
  const existing = await db.aIGovernanceModel.findUnique({
    where: { provider_model: { provider, model } },
  });
  if (!existing) return null;
  const data: Record<string, unknown> = {};
  if (input.qualityHistory !== undefined) data.qualityHistory = JSON.stringify(input.qualityHistory);
  if (input.latencyHistory !== undefined) data.latencyHistory = JSON.stringify(input.latencyHistory);
  if (input.costHistory !== undefined) data.costHistory = JSON.stringify(input.costHistory);
  if (input.riskHistory !== undefined) data.riskHistory = JSON.stringify(input.riskHistory);
  return db.aIGovernanceModel.update({ where: { id: existing.id }, data });
}

// ===========================================================================
// Reuse existing tables
// ===========================================================================

export async function fetchAIInvocations(opts: { since?: Date; limit?: number } = {}) {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.orchestratorAIInvocation.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
    select: { id: true, provider: true, model: true, status: true, userId: true, organizationId: true, costUsd: true, createdAt: true },
  }).catch(() => []);
}

export async function fetchQualityEvaluations(limit = 100) {
  return db.aIQualityEvaluation.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, provider: true, model: true, overallScore: true, createdAt: true },
  }).catch(() => []);
}

export async function fetchAlerts(limit = 50) {
  return db.aIObservabilityAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, kind: true, severity: true, title: true, createdAt: true },
  }).catch(() => []);
}

export async function fetchExistingAuditEvents(limit = 100) {
  return db.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, actionType: true, actorType: true, actorId: true, entityType: true, entityId: true, createdAt: true },
  }).catch(() => []);
}

// ===========================================================================
// Helpers
// ===========================================================================

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
