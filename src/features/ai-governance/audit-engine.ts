/**
 * EduBek — Governance Audit (System 7).
 * Records policy evaluations, approvals, exceptions, risk assessments,
 * provider changes, model changes, permission changes, manual overrides.
 * Everything becomes searchable.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { GovernanceAuditEntry, GovernanceAuditReport } from "./types";

const log = getLogger("audit-engine");

export async function recordAudit(input: {
  action: string; actorType?: string; actorId?: string | null;
  entityType?: string | null; entityId?: string | null;
  scope?: string; details?: Record<string, unknown>;
}): Promise<void> {
  await repo.createAuditEntry(input);
  log.debug("audit.recorded", { action: input.action, actor: input.actorId });
}

export async function generateAuditReport(opts: {
  action?: string; actorType?: string; limit?: number;
} = {}): Promise<GovernanceAuditReport> {
  const entries = await repo.listAuditEntries(opts);
  const byAction: Record<string, number> = {};
  const byActorType: Record<string, number> = {};
  for (const e of entries) {
    byAction[e.action] = (byAction[e.action] ?? 0) + 1;
    byActorType[e.actorType] = (byActorType[e.actorType] ?? 0) + 1;
  }
  log.info("audit.report_complete", { entries: entries.length });
  return {
    generatedAt: new Date().toISOString(),
    entries: entries.map(e => ({
      id: e.id, action: e.action, actorType: e.actorType as GovernanceAuditEntry["actorType"],
      actorId: e.actorId, entityType: e.entityType ?? "", entityId: e.entityId,
      scope: e.scope,
      details: repo.safeParse(e.details, {}),
      occurredAt: e.occurredAt.toISOString(),
    })),
    totalCount: entries.length, byAction, byActorType,
  };
}

export async function searchAudit(query: string, limit = 50): Promise<GovernanceAuditEntry[]> {
  const all = await repo.listAuditEntries({ limit: 500 });
  const lower = query.toLowerCase();
  return all
    .filter(e => e.action.toLowerCase().includes(lower)
      || (e.entityType ?? "").toLowerCase().includes(lower)
      || (e.actorId ?? "").toLowerCase().includes(lower)
      || repo.safeParse<Record<string, unknown>>(e.details, {}).toString().toLowerCase().includes(lower))
    .slice(0, limit)
    .map(e => ({
      id: e.id, action: e.action, actorType: e.actorType as GovernanceAuditEntry["actorType"],
      actorId: e.actorId, entityType: e.entityType ?? "", entityId: e.entityId,
      scope: e.scope,
      details: repo.safeParse(e.details, {}),
      occurredAt: e.occurredAt.toISOString(),
    }));
}
