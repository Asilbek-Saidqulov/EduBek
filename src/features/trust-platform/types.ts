/**
 * EduBek — Trust, Safety, Moderation & Compliance Platform types.
 * Phase 6G.20: Single source of truth for moderation, investigations, safety,
 * compliance, sanctions, appeals, and trust operations.
 *
 * Owns ONLY trust & safety. Never owns gameplay, anti-cheat detection, scoring,
 * matchmaking, progression, XP, achievements, inventory, commerce, notifications,
 * identity, analytics, social relationships, broadcasts, AI. Never performs automatic bans.
 *
 * All cross-module communication happens exclusively through the Event Bus.
 */

// ===========================================================================
// System 1 — Moderation Registry
// ===========================================================================
export type ModerationEntityType =
  | "report" | "investigation" | "evidence" | "sanction"
  | "appeal" | "policy" | "case" | "signal";

export type ModerationRegistryStatus = "active" | "draft" | "deprecated" | "retired";

export interface ModerationRegistryEntry {
  id: string; type: ModerationEntityType;
  key: string; name: string;
  status: ModerationRegistryStatus;
  version: number;
  createdAt: string; updatedAt: string;
  deprecatedAt: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 2 — Safety Policy Registry
// ===========================================================================
export type PolicyCategory =
  | "community" | "academic" | "tournament" | "organization" | "regional";

export type PolicySeverity = "info" | "minor" | "major" | "critical";

export interface PolicyVersion {
  version: string;
  content: string;
  publishedAt: string;
  publishedBy: string;
  active: boolean;
}

export interface SafetyPolicy {
  id: string; key: string; name: string;
  category: PolicyCategory;
  severity: PolicySeverity;
  description: string;
  rules: string[];
  region: string | null;
  organizationId: string | null;
  versions: PolicyVersion[];
  active: boolean;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 3 — Reporting Platform
// ===========================================================================
export type ReportType =
  | "player_report" | "teacher_report" | "organization_report"
  | "appeal" | "automated_signal";

export type ReportStatus =
  | "submitted" | "triaged" | "investigating" | "resolved"
  | "dismissed" | "duplicate" | "escalated";

export type ReportReason =
  | "harassment" | "cheating" | "inappropriate_content" | "spam"
  | "hate_speech" | "violence" | "impersonation" | "academic_dishonesty"
  | "policy_violation" | "other";

export interface Report {
  id: string; type: ReportType;
  status: ReportStatus;
  reason: ReportReason;
  reporterId: string | null;
  reportedId: string;
  reportedContentType: string | null;
  reportedContentRef: string | null;
  description: string;
  policyKey: string | null;
  investigationId: string | null;
  duplicateOfId: string | null;
  priority: number;
  submittedAt: string;
  triagedAt: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  evidenceRefs: string[];
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 4 — Investigation Platform
// ===========================================================================
export type InvestigationStatus =
  | "open" | "assigned" | "in_progress" | "pending_review"
  | "resolved" | "closed" | "escalated";

export type InvestigationPriority = "p1" | "p2" | "p3" | "p4";

export interface InvestigationEvent {
  id: string; timestamp: string;
  type: string;
  actorId: string | null;
  description: string;
  metadata: Record<string, unknown>;
}

export interface Investigation {
  id: string;
  status: InvestigationStatus;
  priority: InvestigationPriority;
  title: string;
  description: string;
  reportIds: string[];
  evidenceRefs: string[];
  assignedModeratorId: string | null;
  assignedAt: string | null;
  openedAt: string;
  closedAt: string | null;
  resolution: string | null;
  outcome: "sustained" | "not_sustained" | "inconclusive" | null;
  linkedEvents: Array<{ eventType: string; eventId: string; correlationId: string }>;
  timeline: InvestigationEvent[];
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 5 — Evidence Registry
// ===========================================================================
export type EvidenceType =
  | "replay_ref" | "event_ref" | "trace_ref" | "log_ref"
  | "screenshot_ref" | "video_ref" | "chat_ref" | "system_ref";

export interface Evidence {
  id: string;
  type: EvidenceType;
  reference: string;
  source: string;
  description: string;
  hash: string;
  collectedAt: string;
  collectedBy: string | null;
  investigationId: string | null;
  reportId: string | null;
  appealId: string | null;
  immutable: true;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 6 — Sanction Platform
// ===========================================================================
export type SanctionType =
  | "warning" | "temporary_restriction" | "temporary_suspension"
  | "organization_restriction" | "feature_restriction" | "permanent_ban";

export type SanctionStatus = "pending_approval" | "approved" | "active" | "expired" | "revoked" | "appealed";

export interface Sanction {
  id: string;
  type: SanctionType;
  status: SanctionStatus;
  targetId: string;
  targetType: "user" | "organization" | "service_account";
  reason: string;
  policyKey: string | null;
  investigationId: string | null;
  issuedBy: string | null;
  issuedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  startsAt: string;
  endsAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  features: string[];
  manualApprovalRequired: boolean;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 7 — Appeal Platform
// ===========================================================================
export type AppealStatus =
  | "submitted" | "assigned" | "under_review" | "approved"
  | "rejected" | "escalated" | "withdrawn";

export interface Appeal {
  id: string;
  sanctionId: string;
  status: AppealStatus;
  appellantId: string;
  reason: string;
  evidenceRefs: string[];
  submittedAt: string;
  assignedReviewerId: string | null;
  assignedAt: string | null;
  reviewedAt: string | null;
  decision: "approved" | "rejected" | "escalated" | null;
  decisionReason: string | null;
  decidedBy: string | null;
  history: Array<{ id: string; timestamp: string; action: string; actorId: string | null; note: string }>;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 8 — Trust Score Platform
// ===========================================================================
export type TrustScoreBand = "trusted" | "neutral" | "at_risk" | "high_risk";

export interface TrustScoreRule {
  id: string; key: string;
  description: string;
  signalType: string;
  weight: number;
  active: boolean;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface TrustScore {
  id: string;
  targetId: string;
  score: number; // 0-100, higher is more trustworthy
  band: TrustScoreBand;
  factors: Array<{ ruleKey: string; weight: number; contribution: number; timestamp: string }>;
  computedAt: string;
  version: number;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 9 — Safety Signals
// ===========================================================================
export type SignalType =
  | "AntiCheatFinding" | "PlayerReported" | "ContentReported"
  | "SuspiciousActivity" | "PolicyViolation";

export type SignalStatus = "new" | "investigation_created" | "dismissed" | "duplicate";

export interface SafetySignal {
  id: string;
  type: SignalType;
  sourceEventId: string;
  targetId: string;
  severity: PolicySeverity;
  description: string;
  status: SignalStatus;
  investigationId: string | null;
  duplicateOfId: string | null;
  receivedAt: string;
  processedAt: string | null;
  correlationId: string;
  payload: Record<string, unknown>;
}

// ===========================================================================
// System 10 — Content Moderation Metadata
// ===========================================================================
export type ContentClassification =
  | "safe" | "borderline" | "inappropriate" | "harmful" | "illegal";

export type ContentStatus = "pending" | "under_review" | "approved" | "removed" | "restored";

export interface ContentModerationRecord {
  id: string;
  contentRef: string; // reference only — never stores content
  contentType: string;
  classification: ContentClassification;
  status: ContentStatus;
  owner: string | null;
  reportedCount: number;
  reviewedBy: string | null;
  reviewedAt: string | null;
  decision: string | null;
  policyKey: string | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 11 — Compliance Platform
// ===========================================================================
export type ComplianceDomain =
  | "academic" | "organization" | "minor_protection" | "regional" | "retention" | "consent";

export type ComplianceStatus = "compliant" | "warning" | "non_compliant" | "unknown";

export interface ComplianceRecord {
  id: string;
  domain: ComplianceDomain;
  status: ComplianceStatus;
  targetId: string;
  targetType: "user" | "organization" | "service";
  requirementKey: string;
  description: string;
  evidenceRefs: string[];
  consentRef: string | null;
  retentionUntil: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 12 — Moderator Workflow
// ===========================================================================
export type ModeratorQueueType =
  | "reports" | "investigations" | "appeals" | "evidence_review" | "escalations";

export type WorkflowPriority = "low" | "normal" | "high" | "urgent";

export interface ModeratorAssignment {
  id: string;
  moderatorId: string;
  itemType: "report" | "investigation" | "appeal" | "evidence";
  itemId: string;
  queueType: ModeratorQueueType;
  priority: WorkflowPriority;
  assignedBy: string;
  assignedAt: string;
  dueAt: string | null;
  completedAt: string | null;
  status: "active" | "completed" | "reassigned" | "expired";
  correlationId: string;
  metadata: Record<string, unknown>;
}

export interface ModeratorQueue {
  type: ModeratorQueueType;
  items: ModeratorAssignment[];
  size: number;
  oldestItemAge: number;
}

// ===========================================================================
// System 13 — Moderator RBAC
// ===========================================================================
export type ModeratorRoleType =
  | "moderator" | "reviewer" | "appeal_reviewer"
  | "organization_moderator" | "global_moderator" | "compliance_officer";

export interface ModeratorRole {
  id: string; key: string;
  type: ModeratorRoleType;
  name: string;
  description: string;
  permissions: string[];
  scope: "global" | "organization" | "regional";
  scopeId: string | null;
  active: boolean;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface ModeratorRoleAssignment {
  id: string;
  moderatorId: string;
  roleKey: string;
  scope: "global" | "organization" | "regional";
  scopeId: string | null;
  assignedBy: string;
  assignedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 14 — Audit Platform
// ===========================================================================
export interface ModerationAuditEntry {
  id: string;
  action: string;
  actorId: string | null;
  itemType: string;
  itemId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason: string;
  correlationId: string;
  approvalRef: string | null;
  occurredAt: string;
  immutable: true;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 15 — Trust Analytics
// ===========================================================================
export interface TrustAnalytics {
  reports: {
    total: number;
    byStatus: Record<ReportStatus, number>;
    byReason: Record<ReportReason, number>;
    resolutionRate: number;
    avgResolutionTimeMs: number;
  };
  investigations: {
    total: number;
    open: number;
    closed: number;
    avgCloseTimeMs: number;
    byOutcome: Record<string, number>;
  };
  sanctions: {
    total: number;
    active: number;
    byType: Record<SanctionType, number>;
    appealRate: number;
  };
  appeals: {
    total: number;
    approved: number;
    rejected: number;
    approvalRate: number;
    falsePositiveRate: number;
  };
  signals: {
    total: number;
    byType: Record<SignalType, number>;
    investigationCreatedRate: number;
  };
  compliance: {
    total: number;
    compliant: number;
    nonCompliant: number;
    byDomain: Record<ComplianceDomain, number>;
  };
  moderation: {
    activeModerators: number;
    avgResponseTimeMs: number;
    caseload: number;
  };
  updatedAt: string;
}

// ===========================================================================
// System 16 — Safety Dashboard
// ===========================================================================
export interface SafetyDashboard {
  openCases: number;
  openInvestigations: number;
  pendingAppeals: number;
  activeSanctions: number;
  recentReports: number;
  reportsTrend: Array<{ date: string; count: number }>;
  queueHealth: Array<{ queueType: ModeratorQueueType; size: number; oldestAgeMs: number }>;
  policyHealth: Array<{ policyKey: string; violations: number; enforcementRate: number }>;
  topReportedTargets: Array<{ targetId: string; count: number }>;
  updatedAt: string;
}

// ===========================================================================
// System 17 — Compliance Dashboard
// ===========================================================================
export interface ComplianceDashboard {
  overallStatus: "compliant" | "warning" | "non_compliant";
  byDomain: Record<ComplianceDomain, { total: number; compliant: number; nonCompliant: number }>;
  byRegion: Array<{ region: string; compliant: number; nonCompliant: number }>;
  byOrganization: Array<{ organizationId: string; compliant: number; nonCompliant: number }>;
  retentionItems: number;
  expiringRetentions: number;
  consentReferences: number;
  auditReadiness: number;
  updatedAt: string;
}

// ===========================================================================
// System 18 — Event Bus Bridge
// ===========================================================================
export type TrustEventType =
  | "ReportSubmitted" | "InvestigationOpened" | "InvestigationClosed"
  | "EvidenceAttached" | "SanctionIssued" | "SanctionRevoked"
  | "AppealSubmitted" | "AppealApproved" | "AppealRejected"
  | "PolicyViolationRecorded" | "ComplianceViolationDetected"
  | "ModeratorAssigned" | "ModeratorEscalated"
  | "CaseResolved" | "TrustScoreUpdated"
  | "SignalProcessed" | "ContentRemoved" | "ContentRestored";

// ===========================================================================
// System 19 — Developer Integration
// ===========================================================================
export interface TrustDeveloperIntegration {
  publicAPIs: Array<{
    path: string; method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    description: string; authRequired: boolean; scope: string;
  }>;
  extensionHooks: Array<{
    id: string; name: string; triggerEvent: TrustEventType;
    description: string;
  }>;
  sdkMetadata: {
    version: string; language: string; docsUrl: string;
    capabilities: string[];
  };
  webhooks: Array<{
    id: string; event: TrustEventType; description: string;
  }>;
  moderationSchemas: Array<{ name: string; fields: string[] }>;
}

// ===========================================================================
// System 20 — Documentation Generator
// ===========================================================================
export interface TrustDocumentation {
  version: string; generatedAt: string;
  systems: Array<{
    id: number; name: string; description: string;
    endpoints: string[]; events: string[];
  }>;
  events: Array<{
    type: TrustEventType; payload: string[]; description: string;
  }>;
  ownership: {
    owns: string[]; doesNotOwn: string[];
  };
}
