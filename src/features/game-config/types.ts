/**
 * EduBek — Game Configuration, Feature Flags & Live Balancing Platform types.
 * Phase 6G.14: Single source of truth for all game configurations.
 * Never owns gameplay, scoring, matchmaking, progression, or economy.
 * Safely distributes approved configurations to existing game systems.
 */

// System 1 — Configuration Registry
export type GameModeId = "classic_quiz" | "treasure_heist" | "empire_builder" | "quiz_royale" | "battle_royale" | "cross_platform";
export interface GameConfig {
  id: string; gameMode: GameModeId; name: string; version: string;
  status: ConfigVersionStatus; data: Record<string, unknown>;
  description: string; createdBy: string; createdAt: string; updatedAt: string;
}

// System 2 — Configuration Versioning
export type ConfigVersionStatus = "draft" | "testing" | "approved" | "live" | "deprecated" | "archived";
export interface ConfigVersion {
  id: string; configId: string; version: string; status: ConfigVersionStatus;
  parentVersion: string | null; changelog: string; createdBy: string;
  createdAt: string; approvedBy: string | null; approvedAt: string | null;
  isRollbackTarget: boolean; diff: ConfigDiff | null;
}
export interface ConfigDiff { added: string[]; removed: string[]; modified: string[]; }

// System 3 — Live Configuration Loader
export interface LoadedConfig {
  configId: string; version: string; loadedAt: string; source: "cache" | "snapshot" | "fallback";
  data: Record<string, unknown>; valid: boolean;
}
export interface ConfigCache { configId: string; version: string; cachedAt: string; data: Record<string, unknown>; }

// System 4 — Feature Flag Platform
export type FlagRolloutType =
  | "boolean" | "percentage" | "organization" | "school" | "teacher"
  | "player" | "tournament" | "region" | "environment" | "emergency_disable";
export interface FeatureFlag {
  id: string; name: string; description: string; rolloutType: FlagRolloutType;
  enabled: boolean; percentage: number; targetIds: string[];
  prerequisites: string[]; dependencies: string[];
  environment: EnvironmentType; createdAt: string; updatedAt: string;
}
export interface FlagEvaluation {
  flagId: string; userId: string | null; enabled: boolean; reason: string;
  evaluatedAt: string;
}

// System 5 — Balancing Profiles
export type ProfileType = "casual" | "classroom" | "tournament" | "olympiad" | "practice" | "demo" | "custom";
export interface BalancingProfile {
  id: string; name: string; type: ProfileType; gameMode: GameModeId;
  configOverrides: Record<string, unknown>; active: boolean;
  createdBy: string; createdAt: string; updatedAt: string;
}

// System 6 — Environment Configuration
export type EnvironmentType = "development" | "testing" | "qa" | "staging" | "production" | "sandbox" | "local";
export interface EnvironmentConfig {
  id: string; environment: EnvironmentType; configs: Record<string, unknown>;
  overrides: Record<string, unknown>; active: boolean; updatedAt: string;
}

// System 7 — Rollout Engine
export type RolloutStrategy = "canary" | "percentage" | "organization" | "country" | "region" | "gradual" | "instant" | "scheduled";
export type RolloutStatus = "pending" | "in_progress" | "completed" | "rolled_back" | "cancelled";
export interface Rollout {
  id: string; configId: string; version: string; strategy: RolloutStrategy;
  status: RolloutStatus; percentage: number; targetIds: string[];
  scheduledAt: string | null; startedAt: string | null; completedAt: string | null;
  rolledBackAt: string | null; rolledBackBy: string | null;
  createdBy: string; createdAt: string;
}

// System 8 — Configuration Validation
export type ValidationIssueKind = "missing_value" | "invalid_range" | "broken_dependency" | "circular_reference" | "unknown_config" | "deprecated_config" | "ownership_violation";
export interface ValidationFinding {
  id: string; configId: string; version: string; kind: ValidationIssueKind;
  field: string; severity: "error" | "warning" | "info"; message: string; timestamp: string;
}
export interface ValidationResult {
  configId: string; version: string; valid: boolean; findings: ValidationFinding[]; validatedAt: string;
}

// System 9 — Configuration Comparison
export interface ConfigComparison {
  configId: string; versionA: string; versionB: string;
  diffs: Array<{ path: string; valueA: unknown; valueB: unknown; change: "added" | "removed" | "modified" }>;
  compatible: boolean; impactLevel: "none" | "low" | "medium" | "high" | "breaking";
  dependencyImpact: string[];
}

// System 10 — Experiment Platform
export type ExperimentType = "ab" | "multivariate" | "shadow" | "simulation" | "dry_run";
export type ExperimentStatus = "draft" | "running" | "paused" | "completed" | "cancelled";
export interface Experiment {
  id: string; name: string; description: string; type: ExperimentType;
  status: ExperimentStatus; configA: Record<string, unknown>; configB: Record<string, unknown>;
  startDate: string; endDate: string; autoApply: false;
  results: ExperimentResult | null; createdBy: string; createdAt: string;
}
export interface ExperimentResult {
  metricA: number; metricB: number; difference: number; winner: "A" | "B" | "tie";
  confidence: number; completedAt: string;
}

// System 11 — Recommendation Integration
export interface ConfigRecommendation {
  id: string; source: string; configId: string | null; gameMode: GameModeId | "all";
  title: string; description: string; currentValue: unknown; suggestedValue: unknown;
  autoApplied: false; acknowledged: boolean; receivedAt: string;
}

// System 12 — Approval Workflow
export type ApprovalStatus = "draft" | "review" | "testing" | "approval" | "deployment" | "rollback" | "archive";
export interface ApprovalWorkflow {
  id: string; configId: string; version: string; status: ApprovalStatus;
  submittedBy: string; reviewedBy: string | null; reviewNote: string | null;
  history: ApprovalHistoryEntry[]; createdAt: string; updatedAt: string;
}
export interface ApprovalHistoryEntry {
  id: string; fromStatus: ApprovalStatus; toStatus: ApprovalStatus;
  actorId: string; note: string; timestamp: string;
}

// System 13 — Deployment History
export interface DeploymentRecord {
  id: string; configId: string; version: string; deployedBy: string;
  deployedAt: string; reason: string; approvalId: string | null;
  rolledBack: boolean; rolledBackAt: string | null; impact: string;
}

// System 14 — Rollback Platform
export interface RollbackRecord {
  id: string; configId: string; fromVersion: string; toVersion: string;
  rolledBackBy: string; rolledBackAt: string; reason: string;
  automatic: false; scheduled: boolean;
}

// System 15 — Configuration Dashboard
export interface ConfigDashboard {
  currentVersions: Array<{ gameMode: GameModeId; version: string; status: ConfigVersionStatus }>;
  activeFlags: number; activeRollouts: number; activeExperiments: number;
  validationIssues: number; pendingApprovals: number; recommendations: number;
  health: "healthy" | "warning" | "critical"; updatedAt: string;
}

// System 17 — Developer Integration
export interface ConfigDeveloperIntegration {
  publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean }>;
  extensionHooks: Array<{ id: string; name: string; triggerEvent: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string };
}

// System 16 — Event Bus Bridge
export type ConfigEventType = "ConfigurationPublished" | "ConfigurationRolledBack" | "FeatureFlagChanged" | "ExperimentStarted" | "ExperimentFinished";
