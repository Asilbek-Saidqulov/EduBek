/**
 * EduBek — Platform Audit.
 *
 * Phase 4F.7: Every autonomous action becomes auditable. The audit
 * log captures:
 *
 *   • Why a recommendation was made
 *   • Why AI generated content
 *   • Why a workflow executed
 *   • Why an automation triggered
 *   • Why a student was flagged
 *   • Why a teacher was notified
 *
 * Each AuditEvent includes:
 *   • inputs (what triggered the action)
 *   • reasoning (why the action was taken)
 *   • confidence (how sure the system was)
 *   • affected modules (which subsystems were involved)
 *   • timestamp
 *
 * This is the explainability layer for the entire autonomous platform.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { AuditActionType, AuditEventDto } from "./types";

const log = getLogger("audit");

// ---------------------------------------------------------------------------
// Main entry point: record an audit event
// ---------------------------------------------------------------------------

export async function recordAudit(input: {
  actionType: AuditActionType;
  actorType?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  affectedUserId?: string;
  scopeType?: string;
  scopeId?: string;
  reasoning?: {
    inputs?: Record<string, unknown>;
    reasoning?: string;
    confidence?: number;
    affectedModules?: string[];
  };
  confidence?: number;
  outcome?: "success" | "failure" | "pending";
}): Promise<AuditEventDto> {
  const reasoningStr = input.reasoning ? JSON.stringify(input.reasoning) : "{}";
  const confidence = input.confidence ?? input.reasoning?.confidence ?? 0.5;

  const row = await repo.createAuditEvent({
    actionType: input.actionType,
    actorType: input.actorType ?? "system",
    actorId: input.actorId,
    entityType: input.entityType,
    entityId: input.entityId,
    affectedUserId: input.affectedUserId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    reasoning: reasoningStr,
    confidence,
    outcome: input.outcome ?? "success",
  });

  log.info("audit.recorded", {
    actionType: input.actionType,
    actorType: input.actorType,
    confidence,
    outcome: input.outcome,
  });

  return mapAuditEvent(row);
}

// ---------------------------------------------------------------------------
// Query audit events
// ---------------------------------------------------------------------------

export async function listAuditEvents(input: {
  actionType?: AuditActionType;
  actorType?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  affectedUserId?: string;
  scopeType?: string;
  scopeId?: string;
  outcome?: string;
  sinceDays?: number;
  limit?: number;
}): Promise<AuditEventDto[]> {
  const since = input.sinceDays ? new Date(Date.now() - input.sinceDays * 24 * 60 * 60 * 1000) : undefined;
  const rows = await repo.findAuditEvents({
    actionType: input.actionType,
    actorType: input.actorType,
    actorId: input.actorId,
    entityType: input.entityType,
    entityId: input.entityId,
    affectedUserId: input.affectedUserId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    outcome: input.outcome,
    since,
    limit: input.limit,
  });
  return rows.map(mapAuditEvent);
}

export async function countAuditEvents(): Promise<number> {
  return repo.countAuditEvents();
}

// ---------------------------------------------------------------------------
// Convenience helpers for common audit scenarios
// ---------------------------------------------------------------------------

export async function auditRecommendation(input: {
  userId: string;
  entityType: string;
  entityId: string;
  strategy: string;
  reasoning: string;
  confidence: number;
  affectedModules: string[];
}): Promise<void> {
  await recordAudit({
    actionType: "recommendation",
    actorType: "agent",
    actorId: input.strategy,
    entityType: input.entityType,
    entityId: input.entityId,
    affectedUserId: input.userId,
    scopeType: "user",
    scopeId: input.userId,
    reasoning: {
      inputs: { strategy: input.strategy, userId: input.userId },
      reasoning: input.reasoning,
      confidence: input.confidence,
      affectedModules: input.affectedModules,
    },
    confidence: input.confidence,
  });
}

export async function auditAiGeneration(input: {
  generationId: string;
  userId: string;
  prompt: string;
  reasoning: string;
  confidence: number;
}): Promise<void> {
  await recordAudit({
    actionType: "ai_generation",
    actorType: "agent",
    actorId: "ai-workspace",
    entityType: "ai_session",
    entityId: input.generationId,
    affectedUserId: input.userId,
    scopeType: "user",
    scopeId: input.userId,
    reasoning: {
      inputs: { prompt: input.prompt.slice(0, 200), userId: input.userId },
      reasoning: input.reasoning,
      confidence: input.confidence,
      affectedModules: ["ai-workspace"],
    },
    confidence: input.confidence,
  });
}

export async function auditWorkflowExecution(input: {
  workflowId: string;
  workflowType: string;
  initiatedBy: string;
  reasoning: string;
  confidence: number;
}): Promise<void> {
  await recordAudit({
    actionType: "workflow_execution",
    actorType: "system",
    actorId: input.workflowId,
    entityType: "workflow",
    entityId: input.workflowId,
    affectedUserId: input.initiatedBy,
    scopeType: "user",
    scopeId: input.initiatedBy,
    reasoning: {
      inputs: { workflowType: input.workflowType, initiatedBy: input.initiatedBy },
      reasoning: input.reasoning,
      confidence: input.confidence,
      affectedModules: ["education-os"],
    },
    confidence: input.confidence,
  });
}

export async function auditAutomationTrigger(input: {
  ruleId: string;
  ruleName: string;
  eventType: string;
  reasoning: string;
  confidence: number;
}): Promise<void> {
  await recordAudit({
    actionType: "automation_trigger",
    actorType: "automation",
    actorId: input.ruleId,
    entityType: "automation_rule",
    entityId: input.ruleId,
    reasoning: {
      inputs: { ruleName: input.ruleName, eventType: input.eventType },
      reasoning: input.reasoning,
      confidence: input.confidence,
      affectedModules: ["education-os", "automation"],
    },
    confidence: input.confidence,
  });
}

export async function auditOptimizationApplied(input: {
  optimizationId: string;
  parameter: string;
  newValue: unknown;
  reasoning: string;
  confidence: number;
}): Promise<void> {
  await recordAudit({
    actionType: "optimization_applied",
    actorType: "system",
    actorId: input.optimizationId,
    entityType: "optimization",
    entityId: input.optimizationId,
    reasoning: {
      inputs: { parameter: input.parameter, newValue: input.newValue },
      reasoning: input.reasoning,
      confidence: input.confidence,
      affectedModules: ["platform-intelligence", "optimization"],
    },
    confidence: input.confidence,
  });
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapAuditEvent(row: any): AuditEventDto {
  return {
    id: row.id,
    actionType: row.actionType as AuditActionType,
    actorType: row.actorType,
    actorId: row.actorId,
    entityType: row.entityType,
    entityId: row.entityId,
    affectedUserId: row.affectedUserId,
    scopeType: row.scopeType,
    scopeId: row.scopeId,
    reasoning: safeParseReasoning(row.reasoning),
    confidence: row.confidence,
    outcome: row.outcome,
    occurredAt: row.occurredAt.toISOString(),
  };
}

function safeParseReasoning(raw: string | null): AuditEventDto["reasoning"] {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
