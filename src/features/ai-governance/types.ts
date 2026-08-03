/**
 * EduBek — AI Governance types.
 *
 * Phase 6B.3: AI Governance, Safety, Compliance & Trust Platform.
 * 12 systems, all deterministic — no LLM calls for governance.
 * Governance produces recommendations, findings, approvals, and audit
 * records only — never automatic enforcement.
 */

// ===========================================================================
// SYSTEM 1 — AI Policy Engine
// ===========================================================================

export type PolicyScope = "platform" | "organization" | "department" | "user";

export interface AIPolicy {
  id: string;
  scope: PolicyScope;
  scopeId: string | null;
  name: string;
  description: string;
  rules: PolicyRule[];
  inheritedFrom: string | null;
  status: "active" | "draft" | "deprecated";
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRule {
  type: "allowed_models" | "blocked_models" | "max_context" | "max_tokens"
      | "cost_limit" | "feature_permissions" | "provider_rules" | "prompt_restrictions";
  value: unknown;
  enforced: boolean;
}

export interface PolicyEvaluationResult {
  policyId: string;
  compliant: boolean;
  violations: Array<{ rule: string; expected: string; actual: string; severity: "low" | "medium" | "high" }>;
  inheritedRules: number;
  effectiveRules: number;
}

export interface PolicyEngineReport {
  generatedAt: string;
  policies: AIPolicy[];
  totalPolicies: number;
  activePolicies: number;
  evaluations: PolicyEvaluationResult[];
}

// ===========================================================================
// SYSTEM 2 — Safety Engine
// ===========================================================================

export type SafetyKind =
  | "unsafe_prompt" | "prompt_injection" | "prompt_leakage"
  | "unsafe_output" | "harmful_instructions" | "policy_violation"
  | "unsafe_tool_usage" | "dangerous_automation";

export interface SafetyFinding {
  id: string;
  kind: SafetyKind;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  evidence: string;
  description: string;
  recommendation: string;
}

export interface SafetyReport {
  generatedAt: string;
  findings: SafetyFinding[];
  totalCount: number;
  criticalCount: number;
  overallSafetyScore: number; // 0..100
}

// ===========================================================================
// SYSTEM 3 — Privacy Engine
// ===========================================================================

export type PrivacyKind =
  | "pii" | "student_identifier" | "teacher_identifier"
  | "email" | "phone" | "government_id"
  | "api_key" | "token" | "secret_leakage";

export interface PrivacyFinding {
  id: string;
  kind: PrivacyKind;
  severity: "low" | "medium" | "high" | "critical";
  detectedText: string;
  maskedText: string;
  recommendation: "mask" | "redact" | "encrypt" | "review";
  description: string;
}

export interface PrivacyReport {
  generatedAt: string;
  findings: PrivacyFinding[];
  totalCount: number;
  criticalCount: number;
  privacyScore: number; // 0..100
  recommendations: string[];
}

// ===========================================================================
// SYSTEM 4 — Compliance Engine
// ===========================================================================

export type ComplianceFramework =
  | "gdpr" | "ferpa" | "coppa" | "iso_27001" | "soc2";

export interface ComplianceCheck {
  framework: ComplianceFramework;
  control: string;
  status: "compliant" | "non_compliant" | "partial" | "not_applicable";
  description: string;
  recommendation: string;
}

export interface ComplianceReport {
  generatedAt: string;
  organizationId: string | null;
  checks: ComplianceCheck[];
  complianceScore: number; // 0..100
  violations: number;
  missingControls: number;
  recommendations: string[];
}

// ===========================================================================
// SYSTEM 5 — AI Risk Engine
// ===========================================================================

export type RiskType =
  | "operational" | "financial" | "privacy" | "bias"
  | "reputation" | "security" | "legal" | "educational";

export interface RiskAssessment {
  id: string;
  type: RiskType;
  description: string;
  likelihood: number; // 0..1
  impact: number; // 0..1
  riskScore: number; // 0..100
  confidence: number; // 0..1
  mitigationPlan: string[];
}

export interface RiskReport {
  generatedAt: string;
  assessments: RiskAssessment[];
  overallRiskScore: number;
  criticalRisks: number;
  recommendations: string[];
}

// ===========================================================================
// SYSTEM 6 — Approval Workflows
// ===========================================================================

export type ApprovalType =
  | "new_prompt" | "new_model" | "provider_change"
  | "routing_policy" | "ai_agent" | "extension" | "automation";

export type ApprovalStatus = "draft" | "review" | "approved" | "rejected" | "deprecated" | "archived";

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  requestedBy: string;
  status: ApprovalStatus;
  reviewedBy: string | null;
  reviewNotes: string | null;
  riskAssessment: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface ApprovalWorkflowReport {
  generatedAt: string;
  requests: ApprovalRequest[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

// ===========================================================================
// SYSTEM 7 — Governance Audit
// ===========================================================================

export interface GovernanceAuditEntry {
  id: string;
  action: string;
  actorType: "user" | "system" | "api" | "automation";
  actorId: string | null;
  entityType: string;
  entityId: string | null;
  scope: string;
  details: Record<string, unknown>;
  occurredAt: string;
}

export interface GovernanceAuditReport {
  generatedAt: string;
  entries: GovernanceAuditEntry[];
  totalCount: number;
  byAction: Record<string, number>;
  byActorType: Record<string, number>;
}

// ===========================================================================
// SYSTEM 8 — Explainability
// ===========================================================================

export interface ExplainabilityReport {
  generatedAt: string;
  traceId: string;
  reasoning: string;
  confidence: number;
  evidence: Array<{ source: string; content: string; relevance: number }>;
  sources: Array<{ type: string; id: string; title: string }>;
  alternatives: Array<{ label: string; whyRejected: string }>;
  toolUsage: Array<{ tool: string; purpose: string; durationMs: number }>;
  retrieval: { query: string; results: number; precision: number; recall: number };
  verification: { status: string; checks: number; passed: number };
  qualityEvaluation: { score: number; metrics: number };
}

// ===========================================================================
// SYSTEM 9 — Access Governance
// ===========================================================================

export interface AccessPolicy {
  id: string;
  resource: string;
  resourceType: "provider" | "model" | "agent" | "feature" | "prompt_library" | "dataset" | "benchmark" | "experiment";
  allowedRoles: string[];
  allowedOrganizations: string[];
  temporaryGrants: Array<{ userId: string; expiresAt: string; grantedBy: string }>;
  inheritedFrom: string | null;
}

export interface AccessGovernanceReport {
  generatedAt: string;
  policies: AccessPolicy[];
  totalPolicies: number;
  temporaryGrants: number;
  expiringSoon: number;
}

// ===========================================================================
// SYSTEM 10 — Model Governance
// ===========================================================================

export type ModelLifecycleStatus =
  | "approved" | "experimental" | "deprecated" | "retired" | "under_review";

export interface ModelGovernanceEntry {
  id: string;
  provider: string;
  model: string;
  status: ModelLifecycleStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  qualityHistory: Array<{ date: string; score: number }>;
  latencyHistory: Array<{ date: string; latencyMs: number }>;
  costHistory: Array<{ date: string; costUsd: number }>;
  riskHistory: Array<{ date: string; riskScore: number }>;
  recommendation: "upgrade" | "rollback" | "retire" | "maintain" | null;
}

export interface ModelGovernanceReport {
  generatedAt: string;
  models: ModelGovernanceEntry[];
  totalModels: number;
  approvedCount: number;
  deprecatedCount: number;
  experimentalCount: number;
}

// ===========================================================================
// SYSTEM 11 — Governance Dashboard
// ===========================================================================

export interface GovernanceDashboard {
  generatedAt: string;
  complianceScore: number;
  policyCount: number;
  riskScore: number;
  safetyScore: number;
  privacyScore: number;
  auditCount: number;
  pendingApprovals: number;
  exceptions: number;
  providerStatus: Array<{ provider: string; status: string; models: number }>;
  modelInventory: Array<{ model: string; status: string; provider: string }>;
  organizationCompliance: Array<{ organization: string; score: number }>;
  aiMaturity: number; // 0..100
}

// ===========================================================================
// SYSTEM 12 — Governance Reports
// ===========================================================================

export interface GovernanceReport {
  id: string;
  type: "executive_summary" | "compliance" | "risk" | "audit"
      | "provider" | "policy" | "monthly_ai" | "quarterly_review";
  title: string;
  period: string;
  summary: string;
  sections: Array<{ title: string; content: string; metrics: Record<string, number> }>;
  generatedAt: string;
}

// ===========================================================================
// Shared
// ===========================================================================

export interface GovernanceRecommendation {
  id: string;
  category: "policy" | "safety" | "privacy" | "compliance" | "risk" | "approval" | "audit" | "access" | "model";
  title: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  effort: "low" | "medium" | "high";
  recommendation: string;
}
