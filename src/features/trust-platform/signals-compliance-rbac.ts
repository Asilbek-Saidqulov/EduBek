/** Systems 9, 10, 11, 12, 13 — Safety Signals, Content Moderation, Compliance, Moderator Workflow, Moderator RBAC. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeSignal, getSignal, getAllSignals,
  storeContentRecord, getContentRecord, getContentRecordByRef, getAllContentRecords,
  storeComplianceRecord, getComplianceRecord, getAllComplianceRecords,
  storeModeratorAssignment, getModeratorAssignment, getAllModeratorAssignments,
  storeModeratorRole, getModeratorRole, getModeratorRoleByKey, getAllModeratorRoles,
  storeModeratorRoleAssignment, getModeratorRoleAssignment, getAllModeratorRoleAssignments,
  appendAudit,
} from "./repository";
import type {
  SafetySignal, SignalType, SignalStatus,
  ContentModerationRecord, ContentClassification, ContentStatus,
  ComplianceRecord, ComplianceDomain, ComplianceStatus,
  ModeratorAssignment, ModeratorQueueType, WorkflowPriority,
  ModeratorRole, ModeratorRoleType, ModeratorRoleAssignment,
  PolicySeverity,
} from "./types";
import { publishTrustEvent } from "./event-bus-bridge";
import { openInvestigation } from "./core";

const log = getLogger("trust.signals");

// ===== System 9 — Safety Signals =====

export function ingestSignal(input: {
  type: SignalType;
  sourceEventId: string;
  targetId: string;
  severity?: PolicySeverity;
  description: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
}): SafetySignal {
  // Duplicate detection: same sourceEventId + type
  const existing = getAllSignals().find(s => s.sourceEventId === input.sourceEventId && s.type === input.type);
  const now = new Date().toISOString();
  if (existing) {
    // Create a new signal marked as duplicate referencing the original
    const dupSignal: SafetySignal = {
      id: randomUUID(),
      type: input.type,
      sourceEventId: input.sourceEventId,
      targetId: input.targetId,
      severity: input.severity ?? "minor",
      description: input.description,
      status: "duplicate",
      investigationId: null,
      duplicateOfId: existing.id,
      receivedAt: now,
      processedAt: now,
      correlationId: input.correlationId ?? randomUUID(),
      payload: input.payload ?? {},
    };
    storeSignal(dupSignal);
    return dupSignal;
  }
  const signal: SafetySignal = {
    id: randomUUID(),
    type: input.type,
    sourceEventId: input.sourceEventId,
    targetId: input.targetId,
    severity: input.severity ?? "minor",
    description: input.description,
    status: "new",
    investigationId: null,
    duplicateOfId: null,
    receivedAt: now,
    processedAt: null,
    correlationId: input.correlationId ?? randomUUID(),
    payload: input.payload ?? {},
  };
  storeSignal(signal);
  log.info("signal.ingested", { id: signal.id, type: signal.type });
  return signal;
}

export function getSignalById(id: string): SafetySignal | null { return getSignal(id); }
export function listSignals(status?: SignalStatus, type?: SignalType): SafetySignal[] {
  let all = getAllSignals();
  if (status) all = all.filter(s => s.status === status);
  if (type) all = all.filter(s => s.type === type);
  return all.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

export function createInvestigationFromSignal(signalId: string): SafetySignal | null {
  const s = getSignal(signalId);
  if (!s) return null;
  if (s.status !== "new") return null;
  const inv = openInvestigation({
    title: `Auto-investigation from ${s.type} signal`,
    description: s.description,
    priority: s.severity === "critical" ? "p1" : s.severity === "major" ? "p2" : "p3",
  });
  s.status = "investigation_created";
  s.investigationId = inv.id;
  s.processedAt = new Date().toISOString();
  storeSignal(s);
  publishTrustEvent("SignalProcessed", null, {
    signalId: s.id, investigationId: inv.id, correlationId: s.correlationId,
  });
  return s;
}

export function dismissSignal(signalId: string, reason: string): SafetySignal | null {
  const s = getSignal(signalId);
  if (!s) return null;
  if (s.status !== "new") return null;
  s.status = "dismissed";
  s.processedAt = new Date().toISOString();
  if (!s.metadata) s.metadata = {};
  s.metadata.dismissalReason = reason;
  storeSignal(s);
  return s;
}

export function supportsAllSignalTypes(): SignalType[] {
  return ["AntiCheatFinding", "PlayerReported", "ContentReported", "SuspiciousActivity", "PolicyViolation"];
}
export function supportsAllSignalStatuses(): SignalStatus[] {
  return ["new", "investigation_created", "dismissed", "duplicate"];
}

// ===== System 10 — Content Moderation Metadata =====

export function registerContentRecord(input: {
  contentRef: string;
  contentType: string;
  classification?: ContentClassification;
  owner?: string | null;
  policyKey?: string | null;
  metadata?: Record<string, unknown>;
}): ContentModerationRecord {
  // Reference only — never stores content
  const existing = getContentRecordByRef(input.contentRef);
  if (existing) return existing;
  const now = new Date().toISOString();
  const record: ContentModerationRecord = {
    id: randomUUID(),
    contentRef: input.contentRef,
    contentType: input.contentType,
    classification: input.classification ?? "safe",
    status: "pending",
    owner: input.owner ?? null,
    reportedCount: 0,
    reviewedBy: null,
    reviewedAt: null,
    decision: null,
    policyKey: input.policyKey ?? null,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeContentRecord(record);
  return record;
}

export function getContentRecordById(id: string): ContentModerationRecord | null { return getContentRecord(id); }
export function getContentRecordByReference(ref: string): ContentModerationRecord | null { return getContentRecordByRef(ref); }
export function listContentRecords(classification?: ContentClassification, status?: ContentStatus): ContentModerationRecord[] {
  let all = getAllContentRecords();
  if (classification) all = all.filter(c => c.classification === classification);
  if (status) all = all.filter(c => c.status === status);
  return all;
}

export function classifyContent(id: string, classification: ContentClassification, reviewerId: string): ContentModerationRecord | null {
  const c = getContentRecord(id);
  if (!c) return null;
  c.classification = classification;
  c.reviewedBy = reviewerId;
  c.reviewedAt = new Date().toISOString();
  c.updatedAt = c.reviewedAt;
  storeContentRecord(c);
  return c;
}

export function removeContent(id: string, reviewerId: string, reason: string): ContentModerationRecord | null {
  const c = getContentRecord(id);
  if (!c) return null;
  if (c.status === "removed") return c;
  c.status = "removed";
  c.decision = reason;
  c.reviewedBy = reviewerId;
  c.reviewedAt = new Date().toISOString();
  c.updatedAt = c.reviewedAt;
  storeContentRecord(c);
  publishTrustEvent("ContentRemoved", reviewerId, { contentRef: c.contentRef, reason });
  return c;
}

export function restoreContent(id: string, reviewerId: string, reason: string): ContentModerationRecord | null {
  const c = getContentRecord(id);
  if (!c) return null;
  if (c.status !== "removed") return null;
  c.status = "restored";
  c.decision = reason;
  c.reviewedBy = reviewerId;
  c.reviewedAt = new Date().toISOString();
  c.updatedAt = c.reviewedAt;
  storeContentRecord(c);
  publishTrustEvent("ContentRestored", reviewerId, { contentRef: c.contentRef, reason });
  return c;
}

export function incrementContentReportCount(id: string): ContentModerationRecord | null {
  const c = getContentRecord(id);
  if (!c) return null;
  c.reportedCount += 1;
  c.updatedAt = new Date().toISOString();
  storeContentRecord(c);
  return c;
}

export function supportsAllContentClassifications(): ContentClassification[] {
  return ["safe", "borderline", "inappropriate", "harmful", "illegal"];
}
export function supportsAllContentStatuses(): ContentStatus[] {
  return ["pending", "under_review", "approved", "removed", "restored"];
}

// ===== System 11 — Compliance Platform =====

export function createComplianceRecord(input: {
  domain: ComplianceDomain;
  status?: ComplianceStatus;
  targetId: string;
  targetType?: "user" | "organization" | "service";
  requirementKey: string;
  description?: string;
  evidenceRefs?: string[];
  consentRef?: string | null;
  retentionUntil?: string | null;
  verifiedBy?: string | null;
  metadata?: Record<string, unknown>;
}): ComplianceRecord {
  const now = new Date().toISOString();
  const record: ComplianceRecord = {
    id: randomUUID(),
    domain: input.domain,
    status: input.status ?? "unknown",
    targetId: input.targetId,
    targetType: input.targetType ?? "user",
    requirementKey: input.requirementKey,
    description: input.description ?? "",
    evidenceRefs: input.evidenceRefs ?? [],
    consentRef: input.consentRef ?? null,
    retentionUntil: input.retentionUntil ?? null,
    verifiedAt: input.verifiedBy ? now : null,
    verifiedBy: input.verifiedBy ?? null,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeComplianceRecord(record);
  if (record.status === "non_compliant") {
    publishTrustEvent("ComplianceViolationDetected", null, {
      complianceId: record.id, domain: record.domain, targetId: record.targetId,
    });
  }
  return record;
}

export function getComplianceRecordById(id: string): ComplianceRecord | null { return getComplianceRecord(id); }
export function listComplianceRecords(domain?: ComplianceDomain, status?: ComplianceStatus): ComplianceRecord[] {
  let all = getAllComplianceRecords();
  if (domain) all = all.filter(c => c.domain === domain);
  if (status) all = all.filter(c => c.status === status);
  return all;
}

export function verifyCompliance(id: string, verifiedBy: string, status: ComplianceStatus): ComplianceRecord | null {
  const c = getComplianceRecord(id);
  if (!c) return null;
  const before = c.status;
  c.status = status;
  c.verifiedBy = verifiedBy;
  c.verifiedAt = new Date().toISOString();
  c.updatedAt = c.verifiedAt;
  storeComplianceRecord(c);
  appendAudit({
    id: randomUUID(), action: "compliance.verified",
    actorId: verifiedBy, itemType: "compliance", itemId: c.id,
    before: { status: before }, after: { status },
    reason: "Compliance verification", correlationId: randomUUID(),
    approvalRef: null, occurredAt: c.verifiedAt, immutable: true, metadata: {},
  });
  if (status === "non_compliant") {
    publishTrustEvent("ComplianceViolationDetected", verifiedBy, {
      complianceId: c.id, domain: c.domain, targetId: c.targetId,
    });
  }
  return c;
}

export function supportsAllComplianceDomains(): ComplianceDomain[] {
  return ["academic", "organization", "minor_protection", "regional", "retention", "consent"];
}
export function supportsAllComplianceStatuses(): ComplianceStatus[] {
  return ["compliant", "warning", "non_compliant", "unknown"];
}

// ===== System 12 — Moderator Workflow =====

export function assignModerator(input: {
  moderatorId: string;
  itemType: "report" | "investigation" | "appeal" | "evidence";
  itemId: string;
  queueType?: ModeratorQueueType;
  priority?: WorkflowPriority;
  assignedBy: string;
  dueAt?: string | null;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): ModeratorAssignment {
  const now = new Date().toISOString();
  const assignment: ModeratorAssignment = {
    id: randomUUID(),
    moderatorId: input.moderatorId,
    itemType: input.itemType,
    itemId: input.itemId,
    queueType: input.queueType ?? "reports",
    priority: input.priority ?? "normal",
    assignedBy: input.assignedBy,
    assignedAt: now,
    dueAt: input.dueAt ?? null,
    completedAt: null,
    status: "active",
    correlationId: input.correlationId ?? randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeModeratorAssignment(assignment);
  publishTrustEvent("ModeratorAssigned", input.assignedBy, {
    moderatorId: input.moderatorId, itemType: input.itemType, itemId: input.itemId,
    correlationId: assignment.correlationId,
  });
  return assignment;
}

export function getModeratorAssignmentById(id: string): ModeratorAssignment | null { return getModeratorAssignment(id); }
export function listModeratorAssignments(moderatorId?: string, status?: ModeratorAssignment["status"]): ModeratorAssignment[] {
  let all = getAllModeratorAssignments();
  if (moderatorId) all = all.filter(a => a.moderatorId === moderatorId);
  if (status) all = all.filter(a => a.status === status);
  return all.sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
}

export function completeAssignment(id: string): ModeratorAssignment | null {
  const a = getModeratorAssignment(id);
  if (!a) return null;
  if (a.status !== "active") return null;
  a.status = "completed";
  a.completedAt = new Date().toISOString();
  storeModeratorAssignment(a);
  return a;
}

export function reassignAssignment(id: string, newModeratorId: string, reassignedBy: string): ModeratorAssignment | null {
  const a = getModeratorAssignment(id);
  if (!a) return null;
  if (a.status !== "active") return null;
  a.status = "reassigned";
  a.completedAt = new Date().toISOString();
  storeModeratorAssignment(a);
  // Create new assignment for new moderator
  return assignModerator({
    moderatorId: newModeratorId,
    itemType: a.itemType,
    itemId: a.itemId,
    queueType: a.queueType,
    priority: a.priority,
    assignedBy: reassignedBy,
    dueAt: a.dueAt,
  });
}

export function escalateAssignment(id: string, escalatedBy: string, reason: string): ModeratorAssignment | null {
  const a = getModeratorAssignment(id);
  if (!a) return null;
  if (a.status !== "active") return null;
  a.priority = "urgent";
  a.metadata.escalationReason = reason;
  a.metadata.escalatedBy = escalatedBy;
  a.metadata.escalatedAt = new Date().toISOString();
  storeModeratorAssignment(a);
  publishTrustEvent("ModeratorEscalated", escalatedBy, {
    assignmentId: a.id, reason, correlationId: a.correlationId,
  });
  return a;
}

export function getModeratorQueue(queueType: ModeratorQueueType): {
  type: ModeratorQueueType;
  items: ModeratorAssignment[];
  size: number;
  oldestItemAgeMs: number;
} {
  const items = getAllModeratorAssignments()
    .filter(a => a.queueType === queueType && a.status === "active")
    .sort((a, b) => a.assignedAt.localeCompare(b.assignedAt));
  const oldest = items[0];
  const oldestItemAgeMs = oldest ? Date.now() - new Date(oldest.assignedAt).getTime() : 0;
  return { type: queueType, items, size: items.length, oldestItemAgeMs };
}

export function supportsAllModeratorQueueTypes(): ModeratorQueueType[] {
  return ["reports", "investigations", "appeals", "evidence_review", "escalations"];
}
export function supportsAllWorkflowPriorities(): WorkflowPriority[] {
  return ["low", "normal", "high", "urgent"];
}

// ===== System 13 — Moderator RBAC =====

export function createModeratorRole(input: {
  key: string;
  type: ModeratorRoleType;
  name: string;
  description?: string;
  permissions?: string[];
  scope?: "global" | "organization" | "regional";
  scopeId?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
}): ModeratorRole {
  if (getModeratorRoleByKey(input.key)) throw new Error(`Moderator role key already exists: ${input.key}`);
  const role: ModeratorRole = {
    id: randomUUID(), key: input.key,
    type: input.type,
    name: input.name,
    description: input.description ?? "",
    permissions: input.permissions ?? [],
    scope: input.scope ?? "global",
    scopeId: input.scopeId ?? null,
    active: input.active ?? true,
    createdAt: new Date().toISOString(),
    metadata: input.metadata ?? {},
  };
  storeModeratorRole(role);
  return role;
}

export function getModeratorRoleById(id: string): ModeratorRole | null { return getModeratorRole(id); }
export function getModeratorRoleByReference(key: string): ModeratorRole | null { return getModeratorRoleByKey(key); }
export function listModeratorRoles(type?: ModeratorRoleType, active?: boolean): ModeratorRole[] {
  let all = getAllModeratorRoles();
  if (type) all = all.filter(r => r.type === type);
  if (active !== undefined) all = all.filter(r => r.active === active);
  return all;
}

export function assignModeratorRole(input: {
  moderatorId: string;
  roleKey: string;
  scope?: "global" | "organization" | "regional";
  scopeId?: string | null;
  assignedBy: string;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}): ModeratorRoleAssignment {
  const role = getModeratorRoleByKey(input.roleKey);
  if (!role) throw new Error(`Moderator role not found: ${input.roleKey}`);
  if (!role.active) throw new Error(`Moderator role is not active: ${input.roleKey}`);
  const assignment: ModeratorRoleAssignment = {
    id: randomUUID(),
    moderatorId: input.moderatorId,
    roleKey: input.roleKey,
    scope: input.scope ?? role.scope,
    scopeId: input.scopeId ?? role.scopeId,
    assignedBy: input.assignedBy,
    assignedAt: new Date().toISOString(),
    expiresAt: input.expiresAt ?? null,
    revokedAt: null,
    metadata: input.metadata ?? {},
  };
  storeModeratorRoleAssignment(assignment);
  return assignment;
}

export function getModeratorRoleAssignmentById(id: string): ModeratorRoleAssignment | null { return getModeratorRoleAssignment(id); }
export function listModeratorRoleAssignments(moderatorId?: string): ModeratorRoleAssignment[] {
  const all = getAllModeratorRoleAssignments();
  return moderatorId ? all.filter(a => a.moderatorId === moderatorId) : all;
}

export function listActiveModeratorRoleAssignments(moderatorId: string): ModeratorRoleAssignment[] {
  const now = Date.now();
  return getAllModeratorRoleAssignments().filter(a =>
    a.moderatorId === moderatorId &&
    !a.revokedAt &&
    (!a.expiresAt || new Date(a.expiresAt).getTime() > now)
  );
}

export function revokeModeratorRoleAssignment(id: string, reason: string): ModeratorRoleAssignment | null {
  const a = getModeratorRoleAssignment(id);
  if (!a) return null;
  if (a.revokedAt) return null;
  a.revokedAt = new Date().toISOString();
  a.metadata.revocationReason = reason;
  storeModeratorRoleAssignment(a);
  return a;
}

export function getModeratorPermissions(moderatorId: string): string[] {
  const assignments = listActiveModeratorRoleAssignments(moderatorId);
  const perms = new Set<string>();
  for (const a of assignments) {
    const role = getModeratorRoleByKey(a.roleKey);
    if (role) for (const p of role.permissions) perms.add(p);
  }
  return Array.from(perms);
}

export function moderatorHasPermission(moderatorId: string, permission: string): boolean {
  return getModeratorPermissions(moderatorId).includes(permission);
}

export function supportsAllModeratorRoleTypes(): ModeratorRoleType[] {
  return ["moderator", "reviewer", "appeal_reviewer", "organization_moderator", "global_moderator", "compliance_officer"];
}
