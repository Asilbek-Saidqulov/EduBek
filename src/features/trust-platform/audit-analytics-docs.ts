/** Systems 14, 15, 16, 17, 19, 20 — Audit, Analytics, Dashboards, Developer Integration, Documentation. */
import { randomUUID } from "node:crypto";
import type {
  ModerationAuditEntry,
  TrustAnalytics,
  SafetyDashboard,
  ComplianceDashboard,
  TrustDeveloperIntegration,
  TrustDocumentation, TrustEventType,
  ReportStatus, ReportReason,
  SanctionType,
  SignalType,
  ComplianceDomain,
  ModeratorQueueType,
} from "./types";
import {
  appendAudit, getAllAuditEntries, getAuditForItem,
  getAllReports, getAllInvestigations, getAllSanctions, getAllAppeals,
  getAllSignals, getAllComplianceRecords,
  getAllModeratorAssignments, getAllModeratorRoleAssignments,
  getAllPolicies, getAllContentRecords,
} from "./repository";

// ===== System 14 — Audit Platform =====

export function recordAuditEntry(input: {
  action: string;
  actorId: string | null;
  itemType: string;
  itemId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason: string;
  correlationId?: string;
  approvalRef?: string | null;
  metadata?: Record<string, unknown>;
}): ModerationAuditEntry {
  const entry: ModerationAuditEntry = {
    id: randomUUID(),
    action: input.action,
    actorId: input.actorId,
    itemType: input.itemType,
    itemId: input.itemId,
    before: input.before ?? {},
    after: input.after ?? {},
    reason: input.reason,
    correlationId: input.correlationId ?? randomUUID(),
    approvalRef: input.approvalRef ?? null,
    occurredAt: new Date().toISOString(),
    immutable: true,
    metadata: input.metadata ?? {},
  };
  appendAudit(entry);
  return entry;
}

export function listAuditEntries(limit = 100, offset = 0, itemType?: string, itemId?: string): ModerationAuditEntry[] {
  let entries = getAllAuditEntries();
  if (itemType) entries = entries.filter(e => e.itemType === itemType);
  if (itemId) entries = entries.filter(e => e.itemId === itemId);
  return entries.slice(offset, offset + limit);
}

export function listAuditForItem(itemType: string, itemId: string): ModerationAuditEntry[] {
  return getAuditForItem(itemType, itemId);
}

export function getAuditEntryCount(): number {
  return getAllAuditEntries().length;
}

export function verifyAuditIntegrity(): { valid: boolean; totalEntries: number; immutableCount: number } {
  const entries = getAllAuditEntries();
  const immutableCount = entries.filter(e => e.immutable === true).length;
  return { valid: immutableCount === entries.length, totalEntries: entries.length, immutableCount };
}

// ===== System 15 — Trust Analytics =====

export function generateTrustAnalytics(): TrustAnalytics {
  const reports = getAllReports();
  const investigations = getAllInvestigations();
  const sanctions = getAllSanctions();
  const appeals = getAllAppeals();
  const signals = getAllSignals();
  const compliance = getAllComplianceRecords();

  // Reports
  const reportByStatus: Record<ReportStatus, number> = {
    submitted: 0, triaged: 0, investigating: 0, resolved: 0,
    dismissed: 0, duplicate: 0, escalated: 0,
  };
  const reportByReason: Record<ReportReason, number> = {
    harassment: 0, cheating: 0, inappropriate_content: 0, spam: 0,
    hate_speech: 0, violence: 0, impersonation: 0,
    academic_dishonesty: 0, policy_violation: 0, other: 0,
  };
  for (const r of reports) {
    reportByStatus[r.status] += 1;
    reportByReason[r.reason] += 1;
  }
  const resolvedReports = reports.filter(r => r.status === "resolved");
  const resolutionRate = reports.length > 0 ? resolvedReports.length / reports.length : 0;
  const avgResolutionTimeMs = resolvedReports.length > 0
    ? resolvedReports.reduce((s, r) => s + (r.resolvedAt ? new Date(r.resolvedAt).getTime() - new Date(r.submittedAt).getTime() : 0), 0) / resolvedReports.length
    : 0;

  // Investigations
  const openInvestigations = investigations.filter(i => i.status !== "closed" && i.status !== "resolved");
  const closedInvestigations = investigations.filter(i => i.status === "closed");
  const avgCloseTimeMs = closedInvestigations.length > 0
    ? closedInvestigations.reduce((s, i) => s + (i.closedAt ? new Date(i.closedAt).getTime() - new Date(i.openedAt).getTime() : 0), 0) / closedInvestigations.length
    : 0;
  const byOutcome: Record<string, number> = { sustained: 0, not_sustained: 0, inconclusive: 0 };
  for (const inv of investigations) {
    if (inv.outcome) byOutcome[inv.outcome] = (byOutcome[inv.outcome] ?? 0) + 1;
  }

  // Sanctions
  const sanctionByType: Record<SanctionType, number> = {
    warning: 0, temporary_restriction: 0, temporary_suspension: 0,
    organization_restriction: 0, feature_restriction: 0, permanent_ban: 0,
  };
  for (const s of sanctions) sanctionByType[s.type] += 1;
  const activeSanctions = sanctions.filter(s => s.status === "active").length;
  const appealRate = sanctions.length > 0 ? sanctions.filter(s => s.status === "appealed").length / sanctions.length : 0;

  // Appeals
  const approvedAppeals = appeals.filter(a => a.status === "approved").length;
  const rejectedAppeals = appeals.filter(a => a.status === "rejected").length;
  const approvalRate = appeals.length > 0 ? approvedAppeals / appeals.length : 0;
  const falsePositiveRate = sanctions.length > 0 ? approvedAppeals / sanctions.length : 0;

  // Signals
  const signalByType: Record<SignalType, number> = {
    AntiCheatFinding: 0, PlayerReported: 0, ContentReported: 0,
    SuspiciousActivity: 0, PolicyViolation: 0,
  };
  for (const s of signals) signalByType[s.type] += 1;
  const investigationCreatedRate = signals.length > 0 ? signals.filter(s => s.status === "investigation_created").length / signals.length : 0;

  // Compliance
  const byDomain: Record<ComplianceDomain, number> = {
    academic: 0, organization: 0, minor_protection: 0,
    regional: 0, retention: 0, consent: 0,
  };
  for (const c of compliance) byDomain[c.domain] += 1;

  // Moderation
  const activeModeratorIds = new Set(getAllModeratorRoleAssignments().filter(a => !a.revokedAt).map(a => a.moderatorId)).size;
  const activeAssignments = getAllModeratorAssignments().filter(a => a.status === "active").length;

  return {
    reports: { total: reports.length, byStatus: reportByStatus, byReason: reportByReason, resolutionRate, avgResolutionTimeMs },
    investigations: { total: investigations.length, open: openInvestigations.length, closed: closedInvestigations.length, avgCloseTimeMs, byOutcome },
    sanctions: { total: sanctions.length, active: activeSanctions, byType: sanctionByType, appealRate },
    appeals: { total: appeals.length, approved: approvedAppeals, rejected: rejectedAppeals, approvalRate, falsePositiveRate },
    signals: { total: signals.length, byType: signalByType, investigationCreatedRate },
    compliance: { total: compliance.length, compliant: compliance.filter(c => c.status === "compliant").length, nonCompliant: compliance.filter(c => c.status === "non_compliant").length, byDomain },
    moderation: { activeModerators: activeModeratorIds, avgResponseTimeMs: avgResolutionTimeMs, caseload: activeAssignments },
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 16 — Safety Dashboard =====

export function generateSafetyDashboard(): SafetyDashboard {
  const reports = getAllReports();
  const investigations = getAllInvestigations();
  const appeals = getAllAppeals();
  const sanctions = getAllSanctions();
  const assignments = getAllModeratorAssignments();
  const policies = getAllPolicies();
  const day = 24 * 3600 * 1000;
  const now = Date.now();
  const recentReports = reports.filter(r => now - new Date(r.submittedAt).getTime() < day).length;
  // Reports trend (last 7 days)
  const reportsTrend: Array<{ date: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = now - i * day;
    const dayEnd = now - (i - 1) * day;
    const count = reports.filter(r => {
      const t = new Date(r.submittedAt).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
    reportsTrend.push({ date: new Date(dayStart).toISOString().slice(0, 10), count });
  }
  // Queue health
  const queueTypes: ModeratorQueueType[] = ["reports", "investigations", "appeals", "evidence_review", "escalations"];
  const queueHealth = queueTypes.map(qt => {
    const items = assignments.filter(a => a.queueType === qt && a.status === "active");
    const oldest = items.sort((a, b) => a.assignedAt.localeCompare(b.assignedAt))[0];
    return { queueType: qt, size: items.length, oldestAgeMs: oldest ? now - new Date(oldest.assignedAt).getTime() : 0 };
  });
  // Policy health
  const policyHealth = policies.map(p => {
    const violationCount = reports.filter(r => r.policyKey === p.key).length;
    const enforced = sanctions.filter(s => s.policyKey === p.key).length;
    return { policyKey: p.key, violations: violationCount, enforcementRate: violationCount > 0 ? enforced / violationCount : 0 };
  });
  // Top reported targets
  const targetCounts = new Map<string, number>();
  for (const r of reports) targetCounts.set(r.reportedId, (targetCounts.get(r.reportedId) ?? 0) + 1);
  const topReportedTargets = Array.from(targetCounts.entries())
    .map(([targetId, count]) => ({ targetId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return {
    openCases: investigations.filter(i => i.status !== "closed" && i.status !== "resolved").length,
    openInvestigations: investigations.filter(i => i.status !== "closed" && i.status !== "resolved").length,
    pendingAppeals: appeals.filter(a => a.status !== "approved" && a.status !== "rejected" && a.status !== "withdrawn").length,
    activeSanctions: sanctions.filter(s => s.status === "active").length,
    recentReports,
    reportsTrend,
    queueHealth,
    policyHealth,
    topReportedTargets,
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 17 — Compliance Dashboard =====

export function generateComplianceDashboard(): ComplianceDashboard {
  const compliance = getAllComplianceRecords();
  const byDomain: Record<ComplianceDomain, { total: number; compliant: number; nonCompliant: number }> = {
    academic: { total: 0, compliant: 0, nonCompliant: 0 },
    organization: { total: 0, compliant: 0, nonCompliant: 0 },
    minor_protection: { total: 0, compliant: 0, nonCompliant: 0 },
    regional: { total: 0, compliant: 0, nonCompliant: 0 },
    retention: { total: 0, compliant: 0, nonCompliant: 0 },
    consent: { total: 0, compliant: 0, nonCompliant: 0 },
  };
  for (const c of compliance) {
    byDomain[c.domain].total += 1;
    if (c.status === "compliant") byDomain[c.domain].compliant += 1;
    if (c.status === "non_compliant") byDomain[c.domain].nonCompliant += 1;
  }
  const totalCompliant = compliance.filter(c => c.status === "compliant").length;
  const totalNonCompliant = compliance.filter(c => c.status === "non_compliant").length;
  const overallStatus: "compliant" | "warning" | "non_compliant" =
    totalNonCompliant > 0 ? "non_compliant" : compliance.some(c => c.status === "warning") ? "warning" : "compliant";
  const retentionItems = compliance.filter(c => c.retentionUntil).length;
  const expiringRetentions = compliance.filter(c => c.retentionUntil && new Date(c.retentionUntil).getTime() < Date.now() + 7 * 24 * 3600 * 1000).length;
  const consentReferences = compliance.filter(c => c.consentRef).length;
  const auditReadiness = compliance.length > 0 ? totalCompliant / compliance.length : 1;
  return {
    overallStatus,
    byDomain,
    byRegion: [],
    byOrganization: [],
    retentionItems,
    expiringRetentions,
    consentReferences,
    auditReadiness,
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 19 — Developer Integration =====

export function getDeveloperIntegration(): TrustDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/trust/reports", method: "GET", description: "List reports", authRequired: true, scope: "moderator" },
      { path: "/api/trust/reports", method: "POST", description: "Submit report", authRequired: true, scope: "user" },
      { path: "/api/trust/investigations", method: "GET", description: "List investigations", authRequired: true, scope: "moderator" },
      { path: "/api/trust/investigations", method: "POST", description: "Open investigation", authRequired: true, scope: "moderator" },
      { path: "/api/trust/investigations", method: "PUT", description: "Transition investigation", authRequired: true, scope: "moderator" },
      { path: "/api/trust/evidence", method: "GET", description: "List evidence", authRequired: true, scope: "moderator" },
      { path: "/api/trust/evidence", method: "POST", description: "Register evidence", authRequired: true, scope: "moderator" },
      { path: "/api/trust/sanctions", method: "GET", description: "List sanctions", authRequired: true, scope: "moderator" },
      { path: "/api/trust/sanctions", method: "POST", description: "Create sanction", authRequired: true, scope: "moderator" },
      { path: "/api/trust/sanctions", method: "PUT", description: "Approve/revoke sanction", authRequired: true, scope: "moderator" },
      { path: "/api/trust/appeals", method: "GET", description: "List appeals", authRequired: true, scope: "moderator" },
      { path: "/api/trust/appeals", method: "POST", description: "Submit appeal", authRequired: true, scope: "user" },
      { path: "/api/trust/appeals", method: "PUT", description: "Decide appeal", authRequired: true, scope: "appeal_reviewer" },
      { path: "/api/trust/policies", method: "GET", description: "List policies", authRequired: false, scope: "read" },
      { path: "/api/trust/policies", method: "POST", description: "Create policy", authRequired: true, scope: "admin" },
      { path: "/api/trust/moderators", method: "GET", description: "List moderator assignments", authRequired: true, scope: "admin" },
      { path: "/api/trust/moderators", method: "POST", description: "Assign moderator", authRequired: true, scope: "admin" },
      { path: "/api/trust/compliance", method: "GET", description: "List compliance records", authRequired: true, scope: "compliance_officer" },
      { path: "/api/trust/compliance", method: "POST", description: "Create compliance record", authRequired: true, scope: "compliance_officer" },
      { path: "/api/trust/trust-score", method: "GET", description: "Get trust score", authRequired: true, scope: "moderator" },
      { path: "/api/trust/trust-score", method: "POST", description: "Compute trust score", authRequired: true, scope: "system" },
      { path: "/api/trust/signals", method: "GET", description: "List safety signals", authRequired: true, scope: "moderator" },
      { path: "/api/trust/signals", method: "POST", description: "Ingest signal", authRequired: true, scope: "system" },
      { path: "/api/trust/content", method: "GET", description: "List content records", authRequired: true, scope: "moderator" },
      { path: "/api/trust/content", method: "POST", description: "Register content record", authRequired: true, scope: "system" },
      { path: "/api/trust/audit", method: "GET", description: "List audit entries", authRequired: true, scope: "admin" },
      { path: "/api/trust/analytics", method: "GET", description: "Trust analytics", authRequired: true, scope: "admin" },
      { path: "/api/trust/dashboard", method: "GET", description: "Safety dashboard", authRequired: true, scope: "admin" },
      { path: "/api/trust/compliance-dashboard", method: "GET", description: "Compliance dashboard", authRequired: true, scope: "admin" },
      { path: "/api/trust/developer", method: "GET", description: "Developer integration metadata", authRequired: false, scope: "read" },
      { path: "/api/trust/status", method: "GET", description: "Platform status", authRequired: false, scope: "read" },
    ],
    extensionHooks: [
      { id: "hook_report_submitted", name: "On Report Submitted", triggerEvent: "ReportSubmitted", description: "Triggered when a report is submitted" },
      { id: "hook_investigation_opened", name: "On Investigation Opened", triggerEvent: "InvestigationOpened", description: "Triggered when an investigation is opened" },
      { id: "hook_investigation_closed", name: "On Investigation Closed", triggerEvent: "InvestigationClosed", description: "Triggered when an investigation is closed" },
      { id: "hook_sanction_issued", name: "On Sanction Issued", triggerEvent: "SanctionIssued", description: "Triggered when a sanction is issued" },
      { id: "hook_sanction_revoked", name: "On Sanction Revoked", triggerEvent: "SanctionRevoked", description: "Triggered when a sanction is revoked" },
      { id: "hook_appeal_submitted", name: "On Appeal Submitted", triggerEvent: "AppealSubmitted", description: "Triggered when an appeal is submitted" },
      { id: "hook_appeal_approved", name: "On Appeal Approved", triggerEvent: "AppealApproved", description: "Triggered when an appeal is approved" },
      { id: "hook_appeal_rejected", name: "On Appeal Rejected", triggerEvent: "AppealRejected", description: "Triggered when an appeal is rejected" },
      { id: "hook_policy_violation", name: "On Policy Violation", triggerEvent: "PolicyViolationRecorded", description: "Triggered when a policy violation is recorded" },
      { id: "hook_compliance_violation", name: "On Compliance Violation", triggerEvent: "ComplianceViolationDetected", description: "Triggered when a compliance violation is detected" },
      { id: "hook_moderator_assigned", name: "On Moderator Assigned", triggerEvent: "ModeratorAssigned", description: "Triggered when a moderator is assigned" },
      { id: "hook_case_resolved", name: "On Case Resolved", triggerEvent: "CaseResolved", description: "Triggered when a case is resolved" },
      { id: "hook_trust_score_updated", name: "On Trust Score Updated", triggerEvent: "TrustScoreUpdated", description: "Triggered when a trust score is updated" },
      { id: "hook_signal_processed", name: "On Signal Processed", triggerEvent: "SignalProcessed", description: "Triggered when a signal is processed" },
      { id: "hook_content_removed", name: "On Content Removed", triggerEvent: "ContentRemoved", description: "Triggered when content is removed" },
    ],
    sdkMetadata: {
      version: "1.0.0", language: "typescript",
      docsUrl: "/docs/trust-platform",
      capabilities: ["reports", "investigations", "evidence", "sanctions", "appeals", "policies", "moderators", "compliance", "trust-score", "signals", "content", "audit", "analytics", "dashboard"],
    },
    webhooks: [
      { id: "wh_report_submitted", event: "ReportSubmitted", description: "Fired when a report is submitted" },
      { id: "wh_investigation_opened", event: "InvestigationOpened", description: "Fired when an investigation is opened" },
      { id: "wh_sanction_issued", event: "SanctionIssued", description: "Fired when a sanction is issued" },
      { id: "wh_sanction_revoked", event: "SanctionRevoked", description: "Fired when a sanction is revoked" },
      { id: "wh_appeal_submitted", event: "AppealSubmitted", description: "Fired when an appeal is submitted" },
      { id: "wh_appeal_approved", event: "AppealApproved", description: "Fired when an appeal is approved" },
      { id: "wh_appeal_rejected", event: "AppealRejected", description: "Fired when an appeal is rejected" },
      { id: "wh_compliance_violation", event: "ComplianceViolationDetected", description: "Fired when a compliance violation is detected" },
      { id: "wh_case_resolved", event: "CaseResolved", description: "Fired when a case is resolved" },
      { id: "wh_trust_score_updated", event: "TrustScoreUpdated", description: "Fired when a trust score is updated" },
    ],
    moderationSchemas: [
      { name: "Report", fields: ["id", "type", "status", "reason", "reporterId", "reportedId", "description"] },
      { name: "Investigation", fields: ["id", "status", "priority", "title", "assignedModeratorId", "evidenceRefs"] },
      { name: "Sanction", fields: ["id", "type", "status", "targetId", "reason", "startsAt", "endsAt"] },
      { name: "Appeal", fields: ["id", "sanctionId", "status", "appellantId", "reason", "decision"] },
      { name: "Evidence", fields: ["id", "type", "reference", "hash", "collectedAt"] },
      { name: "SafetyPolicy", fields: ["id", "key", "category", "severity", "rules", "active"] },
      { name: "ComplianceRecord", fields: ["id", "domain", "status", "targetId", "requirementKey"] },
    ],
  };
}

// ===== System 20 — Documentation Generator =====

const SYSTEMS_META: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }> = [
  { id: 1, name: "Moderation Registry", description: "Central registry for every moderation entity. Versioned. Lifecycle managed.", endpoints: ["/api/trust/registry"], events: [] },
  { id: 2, name: "Safety Policy Registry", description: "Community rules, academic policies, tournament rules, organization policies, regional policies. Version history.", endpoints: ["/api/trust/policies"], events: [] },
  { id: 3, name: "Reporting Platform", description: "Player reports, teacher reports, organization reports, appeals, evidence references, duplicate detection.", endpoints: ["/api/trust/reports"], events: ["ReportSubmitted"] },
  { id: 4, name: "Investigation Platform", description: "Case creation, assignments, evidence references, timeline, linked events, resolution workflow.", endpoints: ["/api/trust/investigations"], events: ["InvestigationOpened", "InvestigationClosed", "CaseResolved"] },
  { id: 5, name: "Evidence Registry", description: "Immutable evidence references. Replay, event, trace, log references. No payload duplication.", endpoints: ["/api/trust/evidence"], events: ["EvidenceAttached"] },
  { id: 6, name: "Sanction Platform", description: "Warning, restriction, suspension, organization restriction, feature restriction, permanent ban metadata. Manual approval required. Never automatic.", endpoints: ["/api/trust/sanctions"], events: ["SanctionIssued", "SanctionRevoked"] },
  { id: 7, name: "Appeal Platform", description: "Appeal creation, assignment, review, decision, history, evidence, audit.", endpoints: ["/api/trust/appeals"], events: ["AppealSubmitted", "AppealApproved", "AppealRejected"] },
  { id: 8, name: "Trust Score Platform", description: "Risk metadata only. No gameplay effects. No matchmaking effects. No ranking effects. Rule-based. Deterministic.", endpoints: ["/api/trust/trust-score"], events: ["TrustScoreUpdated"] },
  { id: 9, name: "Safety Signals", description: "Consumes AntiCheatFinding, PlayerReported, ContentReported, SuspiciousActivity, PolicyViolation. Creates investigation candidates only.", endpoints: ["/api/trust/signals"], events: ["SignalProcessed"] },
  { id: 10, name: "Content Moderation Metadata", description: "References only. Never stores content. Classification, ownership, status, review workflow.", endpoints: ["/api/trust/content"], events: ["ContentRemoved", "ContentRestored"] },
  { id: 11, name: "Compliance Platform", description: "Academic compliance, organization compliance, minor protection, regional compliance, retention metadata, consent references.", endpoints: ["/api/trust/compliance"], events: ["ComplianceViolationDetected"] },
  { id: 12, name: "Moderator Workflow", description: "Assignments, queues, escalation, priority, review states.", endpoints: ["/api/trust/moderators"], events: ["ModeratorAssigned", "ModeratorEscalated"] },
  { id: 13, name: "Moderator RBAC", description: "Moderator roles, reviewer roles, appeal reviewer, organization moderator, global moderator, permission templates.", endpoints: ["/api/trust/moderators"], events: [] },
  { id: 14, name: "Audit Platform", description: "Immutable moderation audit. Every decision, every appeal, every sanction. Correlation IDs.", endpoints: ["/api/trust/audit"], events: [] },
  { id: 15, name: "Trust Analytics", description: "Moderation volume, resolution time, appeal rate, false-positive tracking, policy statistics. No gameplay analytics.", endpoints: ["/api/trust/analytics"], events: [] },
  { id: 16, name: "Safety Dashboard", description: "Open cases, appeals, sanctions, reports, investigations, policy health.", endpoints: ["/api/trust/dashboard"], events: [] },
  { id: 17, name: "Compliance Dashboard", description: "Regional compliance, organization compliance, retention, consent, audit readiness.", endpoints: ["/api/trust/compliance-dashboard"], events: [] },
  { id: 18, name: "Event Bus Bridge", description: "Passive consumer. Passive producer. Consumes platform events. Produces trust-owned events only. Idempotent.", endpoints: [], events: [
    "ReportSubmitted", "InvestigationOpened", "InvestigationClosed", "EvidenceAttached",
    "SanctionIssued", "SanctionRevoked", "AppealSubmitted", "AppealApproved", "AppealRejected",
    "PolicyViolationRecorded", "ComplianceViolationDetected", "ModeratorAssigned", "ModeratorEscalated",
    "CaseResolved", "TrustScoreUpdated", "SignalProcessed", "ContentRemoved", "ContentRestored",
  ] },
  { id: 19, name: "Developer Integration", description: "Public APIs, SDK metadata, extension hooks, webhook metadata, moderation schemas.", endpoints: ["/api/trust/developer"], events: [] },
  { id: 20, name: "Documentation Generator", description: "Deterministic Markdown + JSON. Generated automatically. No LLM.", endpoints: [], events: [] },
];

const EVENT_PAYLOADS: Record<TrustEventType, string[]> = {
  ReportSubmitted: ["reportId", "reason", "reportedId", "correlationId"],
  InvestigationOpened: ["investigationId", "priority", "correlationId"],
  InvestigationClosed: ["investigationId", "correlationId"],
  EvidenceAttached: ["evidenceId", "type", "reference"],
  SanctionIssued: ["sanctionId", "type", "targetId", "correlationId"],
  SanctionRevoked: ["sanctionId", "reason", "correlationId"],
  AppealSubmitted: ["appealId", "sanctionId", "correlationId"],
  AppealApproved: ["appealId", "sanctionId", "correlationId"],
  AppealRejected: ["appealId", "sanctionId", "correlationId"],
  PolicyViolationRecorded: ["policyKey", "targetId"],
  ComplianceViolationDetected: ["complianceId", "domain", "targetId"],
  ModeratorAssigned: ["moderatorId", "itemType", "itemId", "correlationId"],
  ModeratorEscalated: ["assignmentId", "reason", "correlationId"],
  CaseResolved: ["investigationId", "outcome", "correlationId"],
  TrustScoreUpdated: ["targetId", "score", "band"],
  SignalProcessed: ["signalId", "investigationId", "correlationId"],
  ContentRemoved: ["contentRef", "reason"],
  ContentRestored: ["contentRef", "reason"],
};

const EVENT_DESCRIPTIONS: Record<TrustEventType, string> = {
  ReportSubmitted: "Emitted when a report is submitted.",
  InvestigationOpened: "Emitted when an investigation is opened.",
  InvestigationClosed: "Emitted when an investigation is closed.",
  EvidenceAttached: "Emitted when evidence is attached to an investigation.",
  SanctionIssued: "Emitted when a sanction is issued (after manual approval).",
  SanctionRevoked: "Emitted when a sanction is revoked.",
  AppealSubmitted: "Emitted when an appeal is submitted.",
  AppealApproved: "Emitted when an appeal is approved (sanction revoked).",
  AppealRejected: "Emitted when an appeal is rejected.",
  PolicyViolationRecorded: "Emitted when a policy violation is recorded.",
  ComplianceViolationDetected: "Emitted when a compliance violation is detected.",
  ModeratorAssigned: "Emitted when a moderator is assigned to an item.",
  ModeratorEscalated: "Emitted when a moderator escalates an assignment.",
  CaseResolved: "Emitted when an investigation case is resolved.",
  TrustScoreUpdated: "Emitted when a trust score is updated.",
  SignalProcessed: "Emitted when a safety signal is processed.",
  ContentRemoved: "Emitted when content is removed.",
  ContentRestored: "Emitted when content is restored.",
};

export function generateTrustDocumentation(): TrustDocumentation {
  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    systems: SYSTEMS_META,
    events: Object.keys(EVENT_PAYLOADS).map((type) => ({
      type: type as TrustEventType,
      payload: EVENT_PAYLOADS[type as TrustEventType],
      description: EVENT_DESCRIPTIONS[type as TrustEventType],
    })),
    ownership: {
      owns: [
        "Reports", "Investigations", "Appeals", "Sanctions",
        "Trust Policies", "Safety Policies", "Compliance Metadata",
        "Evidence References", "Moderator Workflow", "Moderator RBAC",
        "Trust Analytics", "Moderation Dashboard", "Compliance Dashboard",
        "Trust Events", "Developer Metadata", "Documentation",
      ],
      doesNotOwn: [
        "Gameplay", "Anti-cheat detection", "Scoring", "Progression",
        "XP", "Achievements", "Inventory", "Commerce", "Marketplace",
        "Notifications", "Identity", "Sessions", "Competitive Rankings",
        "Replay Storage", "Player Statistics", "Business Analytics",
        "Content Storage", "Social Graph", "Broadcast", "AI",
      ],
    },
  };
}

export function generateMarkdownDocumentation(): string {
  const doc = generateTrustDocumentation();
  let md = `# EduBek — Trust, Safety, Moderation & Compliance Platform\n\n`;
  md += `**Version:** ${doc.version}  \n`;
  md += `**Generated:** ${doc.generatedAt}  \n`;
  md += `**Phase:** 6G.20\n\n`;
  md += `## Overview\n\n`;
  md += `This platform is the SINGLE SOURCE OF TRUTH for every moderation workflow, investigation, safety policy, reports, sanctions, appeals, compliance workflow, audit evidence, and trust operations across EduBek. `;
  md += `It is a passive Event Bus consumer + producer. It NEVER performs automatic bans. `;
  md += `All cross-module communication happens exclusively through the Event Bus.\n\n`;
  md += `## Systems\n\n`;
  for (const s of doc.systems) {
    md += `### System ${s.id} — ${s.name}\n\n${s.description}\n\n`;
    if (s.endpoints.length > 0) {
      md += `**Endpoints:**\n`;
      for (const e of s.endpoints) md += `- \`${e}\`\n`;
      md += `\n`;
    }
    if (s.events.length > 0) {
      md += `**Events:**\n`;
      for (const e of s.events) md += `- \`${e}\`\n`;
      md += `\n`;
    }
  }
  md += `## Events\n\n`;
  for (const e of doc.events) {
    md += `### \`${e.type}\`\n\n${e.description}\n\n`;
    md += `**Payload:**\n`;
    for (const p of e.payload) md += `- \`${p}\`\n`;
    md += `\n`;
  }
  md += `## Ownership\n\n### Owns\n\n`;
  for (const o of doc.ownership.owns) md += `- ${o}\n`;
  md += `\n### Does NOT Own\n\n`;
  for (const o of doc.ownership.doesNotOwn) md += `- ${o}\n`;
  return md;
}

export function getTrustVersion(): string { return "1.0.0"; }

export function getTrustStatus(): { operational: boolean; systems: number; bridgeSubscribed: boolean; updatedAt: string } {
  return {
    operational: true, systems: 20,
    bridgeSubscribed: false,
    updatedAt: new Date().toISOString(),
  };
}
