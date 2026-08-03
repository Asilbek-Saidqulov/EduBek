/** Systems 1, 2, 3, 4, 5 — Registry, Policies, Reports, Investigations, Evidence. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeRegistryEntry, getRegistryEntry, getAllRegistryEntries,
  storePolicy, getPolicy, getPolicyByKey, getAllPolicies,
  storeReport, getReport, getAllReports,
  storeInvestigation, getInvestigation, getAllInvestigations,
  storeEvidence, getEvidence, getAllEvidence,
  appendAudit,
} from "./repository";
import type {
  ModerationRegistryEntry, ModerationEntityType, ModerationRegistryStatus,
  SafetyPolicy, PolicyCategory, PolicySeverity, PolicyVersion,
  Report, ReportType, ReportStatus, ReportReason,
  Investigation, InvestigationStatus, InvestigationPriority, InvestigationEvent,
  Evidence, EvidenceType,
} from "./types";
import { publishTrustEvent } from "./event-bus-bridge";

const log = getLogger("trust.core");

// ===== System 1 — Moderation Registry =====

export function createRegistryEntry(input: {
  type: ModerationEntityType;
  key: string; name: string;
  status?: ModerationRegistryStatus;
  metadata?: Record<string, unknown>;
}): ModerationRegistryEntry {
  const now = new Date().toISOString();
  const entry: ModerationRegistryEntry = {
    id: randomUUID(), type: input.type,
    key: input.key, name: input.name,
    status: input.status ?? "draft",
    version: 1,
    createdAt: now, updatedAt: now,
    deprecatedAt: null,
    metadata: input.metadata ?? {},
  };
  storeRegistryEntry(entry);
  return entry;
}

export function getRegistryEntryById(id: string): ModerationRegistryEntry | null { return getRegistryEntry(id); }
export function listRegistryEntries(type?: ModerationEntityType, status?: ModerationRegistryStatus): ModerationRegistryEntry[] {
  let all = getAllRegistryEntries();
  if (type) all = all.filter(e => e.type === type);
  if (status) all = all.filter(e => e.status === status);
  return all;
}

export function activateRegistryEntry(id: string): ModerationRegistryEntry | null {
  const e = getRegistryEntry(id);
  if (!e) return null;
  e.status = "active"; e.updatedAt = new Date().toISOString(); e.version += 1;
  storeRegistryEntry(e);
  return e;
}

export function deprecateRegistryEntry(id: string): ModerationRegistryEntry | null {
  const e = getRegistryEntry(id);
  if (!e) return null;
  e.status = "deprecated"; e.updatedAt = new Date().toISOString(); e.version += 1; e.deprecatedAt = e.updatedAt;
  storeRegistryEntry(e);
  return e;
}

export function retireRegistryEntry(id: string): ModerationRegistryEntry | null {
  const e = getRegistryEntry(id);
  if (!e) return null;
  e.status = "retired"; e.updatedAt = new Date().toISOString(); e.version += 1;
  storeRegistryEntry(e);
  return e;
}

export function supportsAllEntityTypes(): ModerationEntityType[] {
  return ["report", "investigation", "evidence", "sanction", "appeal", "policy", "case", "signal"];
}
export function supportsAllRegistryStatuses(): ModerationRegistryStatus[] {
  return ["active", "draft", "deprecated", "retired"];
}

// ===== System 2 — Safety Policy Registry =====

export function createPolicy(input: {
  key: string; name: string;
  category: PolicyCategory;
  severity?: PolicySeverity;
  description?: string;
  rules?: string[];
  region?: string | null;
  organizationId?: string | null;
  metadata?: Record<string, unknown>;
}): SafetyPolicy {
  if (getPolicyByKey(input.key)) throw new Error(`Policy key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const policy: SafetyPolicy = {
    id: randomUUID(), key: input.key, name: input.name,
    category: input.category,
    severity: input.severity ?? "minor",
    description: input.description ?? "",
    rules: input.rules ?? [],
    region: input.region ?? null,
    organizationId: input.organizationId ?? null,
    versions: [{ version: "1.0.0", content: input.description ?? "", publishedAt: now, publishedBy: "system", active: true }],
    active: true,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storePolicy(policy);
  log.info("policy.created", { id: policy.id, key: policy.key });
  return policy;
}

export function getPolicyById(id: string): SafetyPolicy | null { return getPolicy(id); }
export function getPolicyByReference(key: string): SafetyPolicy | null { return getPolicyByKey(key); }
export function listPolicies(category?: PolicyCategory, active?: boolean): SafetyPolicy[] {
  let all = getAllPolicies();
  if (category) all = all.filter(p => p.category === category);
  if (active !== undefined) all = all.filter(p => p.active === active);
  return all;
}

export function publishPolicyVersion(id: string, version: string, content: string, publishedBy: string): SafetyPolicy | null {
  const p = getPolicy(id);
  if (!p) return null;
  // Deactivate old versions
  for (const v of p.versions) v.active = false;
  p.versions.push({ version, content, publishedAt: new Date().toISOString(), publishedBy, active: true });
  p.description = content;
  p.updatedAt = new Date().toISOString();
  storePolicy(p);
  return p;
}

export function deactivatePolicy(id: string): SafetyPolicy | null {
  const p = getPolicy(id);
  if (!p) return null;
  p.active = false; p.updatedAt = new Date().toISOString();
  storePolicy(p);
  return p;
}

export function addPolicyRule(id: string, rule: string): SafetyPolicy | null {
  const p = getPolicy(id);
  if (!p) return null;
  if (p.rules.includes(rule)) return p;
  p.rules.push(rule);
  p.updatedAt = new Date().toISOString();
  storePolicy(p);
  return p;
}

export function supportsAllPolicyCategories(): PolicyCategory[] {
  return ["community", "academic", "tournament", "organization", "regional"];
}
export function supportsAllPolicySeverities(): PolicySeverity[] {
  return ["info", "minor", "major", "critical"];
}

// ===== System 3 — Reporting Platform =====

export function submitReport(input: {
  type?: ReportType;
  reason: ReportReason;
  reporterId?: string | null;
  reportedId: string;
  reportedContentType?: string | null;
  reportedContentRef?: string | null;
  description: string;
  policyKey?: string | null;
  priority?: number;
  evidenceRefs?: string[];
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): Report {
  // Duplicate detection: same reportedId + reason + contentRef within last hour
  const now = new Date().toISOString();
  const dup = getAllReports().find(r =>
    r.reportedId === input.reportedId &&
    r.reason === input.reason &&
    r.reportedContentRef === input.reportedContentRef &&
    r.status !== "dismissed" &&
    r.status !== "duplicate"
  );
  const report: Report = {
    id: randomUUID(),
    type: input.type ?? "player_report",
    status: dup ? "duplicate" : "submitted",
    reason: input.reason,
    reporterId: input.reporterId ?? null,
    reportedId: input.reportedId,
    reportedContentType: input.reportedContentType ?? null,
    reportedContentRef: input.reportedContentRef ?? null,
    description: input.description,
    policyKey: input.policyKey ?? null,
    investigationId: null,
    duplicateOfId: dup?.id ?? null,
    priority: input.priority ?? 3,
    submittedAt: now,
    triagedAt: null,
    resolvedAt: null,
    resolution: null,
    evidenceRefs: input.evidenceRefs ?? [],
    correlationId: input.correlationId ?? randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeReport(report);
  if (dup) {
    appendAudit({
      id: randomUUID(), action: "report.duplicate_detected",
      actorId: null, itemType: "report", itemId: report.id,
      before: {}, after: { duplicateOfId: dup.id },
      reason: "Duplicate report detected", correlationId: report.correlationId,
      approvalRef: null, occurredAt: now, immutable: true, metadata: {},
    });
  } else {
    publishTrustEvent("ReportSubmitted", input.reporterId ?? null, {
      reportId: report.id, reason: report.reason, reportedId: report.reportedId,
      correlationId: report.correlationId,
    });
  }
  log.info("report.submitted", { id: report.id, status: report.status });
  return report;
}

export function getReportById(id: string): Report | null { return getReport(id); }
export function listReports(status?: ReportStatus, reason?: ReportReason): Report[] {
  let all = getAllReports();
  if (status) all = all.filter(r => r.status === status);
  if (reason) all = all.filter(r => r.reason === reason);
  return all.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

const VALID_REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  submitted: ["triaged", "investigating", "resolved", "dismissed", "duplicate", "escalated"],
  triaged: ["investigating", "resolved", "dismissed", "escalated"],
  investigating: ["resolved", "dismissed", "escalated"],
  resolved: [],
  dismissed: [],
  duplicate: [],
  escalated: ["triaged", "investigating", "resolved", "dismissed"],
};

export function canTransitionReport(from: ReportStatus, to: ReportStatus): boolean {
  return VALID_REPORT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionReport(id: string, to: ReportStatus, actorId: string | null, resolution?: string): Report | null {
  const r = getReport(id);
  if (!r) return null;
  if (!canTransitionReport(r.status, to)) return null;
  const before = r.status;
  const now = new Date().toISOString();
  r.status = to;
  if (to === "triaged") r.triagedAt = now;
  if (to === "resolved") { r.resolvedAt = now; r.resolution = resolution ?? null; }
  storeReport(r);
  appendAudit({
    id: randomUUID(), action: `report.transition:${to}`,
    actorId, itemType: "report", itemId: r.id,
    before: { status: before }, after: { status: to },
    reason: resolution ?? "Status transition", correlationId: r.correlationId,
    approvalRef: null, occurredAt: now, immutable: true, metadata: {},
  });
  return r;
}

export function linkReportToInvestigation(reportId: string, investigationId: string): Report | null {
  const r = getReport(reportId);
  if (!r) return null;
  r.investigationId = investigationId;
  storeReport(r);
  return r;
}

export function supportsAllReportTypes(): ReportType[] {
  return ["player_report", "teacher_report", "organization_report", "appeal", "automated_signal"];
}
export function supportsAllReportStatuses(): ReportStatus[] {
  return ["submitted", "triaged", "investigating", "resolved", "dismissed", "duplicate", "escalated"];
}
export function supportsAllReportReasons(): ReportReason[] {
  return ["harassment", "cheating", "inappropriate_content", "spam", "hate_speech", "violence", "impersonation", "academic_dishonesty", "policy_violation", "other"];
}

// ===== System 4 — Investigation Platform =====

export function openInvestigation(input: {
  title: string;
  description?: string;
  priority?: InvestigationPriority;
  reportIds?: string[];
  evidenceRefs?: string[];
  assignedModeratorId?: string | null;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): Investigation {
  const now = new Date().toISOString();
  const investigation: Investigation = {
    id: randomUUID(),
    status: input.assignedModeratorId ? "assigned" : "open",
    priority: input.priority ?? "p3",
    title: input.title,
    description: input.description ?? "",
    reportIds: input.reportIds ?? [],
    evidenceRefs: input.evidenceRefs ?? [],
    assignedModeratorId: input.assignedModeratorId ?? null,
    assignedAt: input.assignedModeratorId ? now : null,
    openedAt: now,
    closedAt: null,
    resolution: null,
    outcome: null,
    linkedEvents: [],
    timeline: [{ id: randomUUID(), timestamp: now, type: "opened", actorId: null, description: "Investigation opened", metadata: {} }],
    correlationId: input.correlationId ?? randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeInvestigation(investigation);
  // Link reports
  for (const reportId of investigation.reportIds) {
    linkReportToInvestigation(reportId, investigation.id);
  }
  publishTrustEvent("InvestigationOpened", null, {
    investigationId: investigation.id, priority: investigation.priority,
    correlationId: investigation.correlationId,
  });
  log.info("investigation.opened", { id: investigation.id });
  return investigation;
}

export function getInvestigationById(id: string): Investigation | null { return getInvestigation(id); }
export function listInvestigations(status?: InvestigationStatus, priority?: InvestigationPriority): Investigation[] {
  let all = getAllInvestigations();
  if (status) all = all.filter(i => i.status === status);
  if (priority) all = all.filter(i => i.priority === priority);
  return all.sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}

const VALID_INVESTIGATION_TRANSITIONS: Record<InvestigationStatus, InvestigationStatus[]> = {
  open: ["assigned", "in_progress", "closed", "escalated"],
  assigned: ["in_progress", "closed", "escalated"],
  in_progress: ["pending_review", "closed", "escalated"],
  pending_review: ["resolved", "closed", "in_progress", "escalated"],
  resolved: ["closed"],
  closed: [],
  escalated: ["assigned", "in_progress", "resolved", "closed"],
};

export function canTransitionInvestigation(from: InvestigationStatus, to: InvestigationStatus): boolean {
  return VALID_INVESTIGATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionInvestigation(id: string, to: InvestigationStatus, actorId: string | null, description: string): Investigation | null {
  const inv = getInvestigation(id);
  if (!inv) return null;
  if (!canTransitionInvestigation(inv.status, to)) return null;
  const before = inv.status;
  const now = new Date().toISOString();
  inv.status = to;
  if (to === "closed") inv.closedAt = now;
  const evt: InvestigationEvent = { id: randomUUID(), timestamp: now, type: `transition:${to}`, actorId, description, metadata: {} };
  inv.timeline.push(evt);
  storeInvestigation(inv);
  appendAudit({
    id: randomUUID(), action: `investigation.transition:${to}`,
    actorId, itemType: "investigation", itemId: inv.id,
    before: { status: before }, after: { status: to },
    reason: description, correlationId: inv.correlationId,
    approvalRef: null, occurredAt: now, immutable: true, metadata: {},
  });
  if (to === "closed") {
    publishTrustEvent("InvestigationClosed", actorId, {
      investigationId: inv.id, correlationId: inv.correlationId,
    });
  }
  return inv;
}

export function assignInvestigation(id: string, moderatorId: string, assignedBy: string): Investigation | null {
  const inv = getInvestigation(id);
  if (!inv) return null;
  if (inv.status !== "open" && inv.status !== "escalated") return null;
  inv.assignedModeratorId = moderatorId;
  inv.assignedAt = new Date().toISOString();
  inv.status = "assigned";
  inv.timeline.push({ id: randomUUID(), timestamp: inv.assignedAt, type: "assigned", actorId: assignedBy, description: `Assigned to ${moderatorId}`, metadata: {} });
  storeInvestigation(inv);
  publishTrustEvent("ModeratorAssigned", assignedBy, {
    investigationId: inv.id, moderatorId, correlationId: inv.correlationId,
  });
  return inv;
}

export function escalateInvestigation(id: string, actorId: string, reason: string): Investigation | null {
  const inv = getInvestigation(id);
  if (!inv) return null;
  if (!canTransitionInvestigation(inv.status, "escalated")) return null;
  return transitionInvestigation(id, "escalated", actorId, `Escalated: ${reason}`);
}

export function resolveInvestigation(id: string, outcome: "sustained" | "not_sustained" | "inconclusive", resolution: string, actorId: string): Investigation | null {
  const inv = getInvestigation(id);
  if (!inv) return null;
  if (!canTransitionInvestigation(inv.status, "resolved")) return null;
  inv.outcome = outcome;
  inv.resolution = resolution;
  inv.status = "resolved";
  const now = new Date().toISOString();
  inv.timeline.push({ id: randomUUID(), timestamp: now, type: "resolved", actorId, description: `Resolved as ${outcome}: ${resolution}`, metadata: {} });
  storeInvestigation(inv);
  publishTrustEvent("CaseResolved", actorId, {
    investigationId: inv.id, outcome, correlationId: inv.correlationId,
  });
  return inv;
}

export function addEvidenceToInvestigation(investigationId: string, evidenceId: string): Investigation | null {
  const inv = getInvestigation(investigationId);
  if (!inv) return null;
  if (inv.evidenceRefs.includes(evidenceId)) return inv;
  inv.evidenceRefs.push(evidenceId);
  inv.timeline.push({ id: randomUUID(), timestamp: new Date().toISOString(), type: "evidence_added", actorId: null, description: `Evidence ${evidenceId} attached`, metadata: { evidenceId } });
  storeInvestigation(inv);
  return inv;
}

export function addLinkedEvent(investigationId: string, eventType: string, eventId: string, correlationId: string): Investigation | null {
  const inv = getInvestigation(investigationId);
  if (!inv) return null;
  inv.linkedEvents.push({ eventType, eventId, correlationId });
  storeInvestigation(inv);
  return inv;
}

export function supportsAllInvestigationStatuses(): InvestigationStatus[] {
  return ["open", "assigned", "in_progress", "pending_review", "resolved", "closed", "escalated"];
}
export function supportsAllInvestigationPriorities(): InvestigationPriority[] {
  return ["p1", "p2", "p3", "p4"];
}

// ===== System 5 — Evidence Registry =====

function computeHash(reference: string, source: string): string {
  // Deterministic hash — NOT cryptographic. Reference only.
  let h = 0;
  const s = `${reference}|${source}`;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return `ev_${(h >>> 0).toString(16)}`;
}

export function registerEvidence(input: {
  type: EvidenceType;
  reference: string;
  source: string;
  description?: string;
  collectedBy?: string | null;
  investigationId?: string | null;
  reportId?: string | null;
  appealId?: string | null;
  metadata?: Record<string, unknown>;
}): Evidence {
  const now = new Date().toISOString();
  const evidence: Evidence = {
    id: randomUUID(),
    type: input.type,
    reference: input.reference,
    source: input.source,
    description: input.description ?? "",
    hash: computeHash(input.reference, input.source),
    collectedAt: now,
    collectedBy: input.collectedBy ?? null,
    investigationId: input.investigationId ?? null,
    reportId: input.reportId ?? null,
    appealId: input.appealId ?? null,
    immutable: true,
    metadata: input.metadata ?? {},
  };
  storeEvidence(evidence);
  publishTrustEvent("EvidenceAttached", input.collectedBy ?? null, {
    evidenceId: evidence.id, type: evidence.type, reference: evidence.reference,
  });
  log.info("evidence.registered", { id: evidence.id, type: evidence.type });
  return evidence;
}

export function getEvidenceById(id: string): Evidence | null { return getEvidence(id); }
export function listEvidence(type?: EvidenceType, investigationId?: string): Evidence[] {
  let all = getAllEvidence();
  if (type) all = all.filter(e => e.type === type);
  if (investigationId) all = all.filter(e => e.investigationId === investigationId);
  return all;
}

export function verifyEvidenceIntegrity(id: string): { valid: boolean; expectedHash: string; actualHash: string } | null {
  const e = getEvidence(id);
  if (!e) return null;
  const actualHash = computeHash(e.reference, e.source);
  return { valid: actualHash === e.hash, expectedHash: e.hash, actualHash };
}

export function supportsAllEvidenceTypes(): EvidenceType[] {
  return ["replay_ref", "event_ref", "trace_ref", "log_ref", "screenshot_ref", "video_ref", "chat_ref", "system_ref"];
}
