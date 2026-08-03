/**
 * EduBek — Reliability Engineering types.
 *
 * Phase 6A.3: Failure scenario simulation, disaster recovery planning,
 * backup verification, graceful degradation analysis, chaos engineering,
 * high availability analysis, incident management, operational runbooks,
 * and a reliability dashboard.
 *
 * Every type is a *diagnostic* surface — this module produces
 * recommendations and plans, never automatic changes. All endpoints are
 * read-only.
 */

// ===========================================================================
// SYSTEM 1 — Failure Scenario Simulator
// ===========================================================================

export type FailureScenarioKind =
  | "database_unavailable" | "redis_unavailable" | "ai_provider_unavailable"
  | "webhook_failure" | "worker_crash" | "queue_overflow"
  | "disk_full" | "memory_exhaustion" | "network_partition"
  | "partial_infrastructure_outage" | "external_api_timeout" | "event_bus_failure";

export interface FailureScenario {
  kind: FailureScenarioKind;
  title: string;
  description: string;
  /** Whether this is a dry-run (default) or actual injection. */
  dryRun: boolean;
  /** Expected impact on the platform. */
  expectedImpact: FailureImpact;
  /** Systems that would be affected. */
  affectedSystems: string[];
  /** Estimated downtime (minutes) if no mitigation is in place. */
  estimatedDowntimeMinutes: number;
  /** Mitigations already in place. */
  existingMitigations: string[];
  /** Recommended additional mitigations. */
  recommendedMitigations: string[];
  /** Severity if unmitigated. */
  severity: "low" | "medium" | "high" | "critical";
}

export interface FailureImpact {
  userFacing: boolean;
  affectedUserPercent: number;
  dataLossRisk: "none" | "low" | "medium" | "high";
  readonlyFallback: boolean;
  degradationLevel: "none" | "minor" | "moderate" | "severe" | "total";
}

export interface FailureSimulationReport {
  generatedAt: string;
  scenarios: FailureScenario[];
  /** Summary counts. */
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    mitigated: number;
    unmitigated: number;
  };
  recommendations: ReliabilityRecommendation[];
}

// ===========================================================================
// SYSTEM 2 — Disaster Recovery Planner
// ===========================================================================

export interface DisasterRecoveryPlan {
  generatedAt: string;
  /** Recovery Time Objective (minutes) — target time to restore service. */
  rtoMinutes: number;
  /** Recovery Point Objective (minutes) — max acceptable data loss. */
  rpoMinutes: number;
  /** Current RTO estimate based on infrastructure. */
  estimatedRtoMinutes: number;
  /** Current RPO estimate based on backup frequency. */
  estimatedRpoMinutes: number;
  /** Whether RTO/RPO targets are met. */
  meetsTargets: boolean;
  /** Backup coverage analysis. */
  backupCoverage: BackupCoverageSummary;
  /** Critical services that must be restored first. */
  criticalServices: CriticalService[];
  /** Recovery order (sequential phases). */
  recoveryOrder: RecoveryPhase[];
  /** Restore dependencies. */
  restoreDependencies: Array<{ service: string; dependsOn: string[] }>;
  recommendations: ReliabilityRecommendation[];
}

export interface BackupCoverageSummary {
  totalAssets: number;
  backedUp: number;
  coveragePercent: number;
  gaps: string[];
}

export interface CriticalService {
  name: string;
  tier: "tier1_critical" | "tier2_important" | "tier3_normal";
  rtoMinutes: number;
  rpoMinutes: number;
  dependencies: string[];
}

export interface RecoveryPhase {
  phase: number;
  name: string;
  services: string[];
  estimatedDurationMinutes: number;
  description: string;
}

// ===========================================================================
// SYSTEM 3 — Backup Verification Engine
// ===========================================================================

export interface BackupVerificationReport {
  generatedAt: string;
  databaseBackups: BackupStatus;
  configurationBackups: BackupStatus;
  storageBackups: BackupStatus;
  knowledgeGraphSnapshots: BackupStatus;
  digitalTwinSnapshots: BackupStatus;
  eventStoreSnapshots: BackupStatus;
  aiMemorySnapshots: BackupStatus;
  marketplaceAssets: BackupStatus;
  overallCoverage: number;
  recommendations: ReliabilityRecommendation[];
}

export interface BackupStatus {
  assetType: string;
  exists: boolean;
  lastBackupAt: string | null;
  backupCount: number;
  estimatedSizeMb: number;
  verified: boolean;
  /** Whether backups are automated. */
  automated: boolean;
  /** Recommended backup frequency. */
  recommendedFrequency: string;
  recommendation: string;
}

// ===========================================================================
// SYSTEM 4 — Graceful Degradation Analyzer
// ===========================================================================

export interface GracefulDegradationReport {
  generatedAt: string;
  scenarios: DegradationScenario[];
  missingFallbacks: string[];
  recommendations: ReliabilityRecommendation[];
}

export interface DegradationScenario {
  subsystem: "ai" | "search" | "marketplace" | "knowledge_graph" | "cloud_workers" | "cache";
  fallbackBehavior: string;
  userImpact: "none" | "minor" | "moderate" | "severe";
  hasFallback: boolean;
  fallbackDescription: string;
  missingFallbacks: string[];
  recommendedImprovements: string[];
}

// ===========================================================================
// SYSTEM 5 — Chaos Engineering Planner
// ===========================================================================

export interface ChaosExperimentPlan {
  id: string;
  name: string;
  kind: ChaosExperimentKind;
  description: string;
  hypothesis: string;
  /** Steps to execute the experiment. */
  steps: Array<{ order: number; action: string; expectedOutcome: string }>;
  /** Blast radius — what could be affected. */
  blastRadius: string[];
  /** Rollback procedure. */
  rollbackProcedure: string;
  /** Safety checks before starting. */
  prerequisites: string[];
  /** Estimated duration (minutes). */
  estimatedDurationMinutes: number;
  /** Whether the experiment is safe to run in production. */
  productionSafe: boolean;
  /** Monitoring to watch during the experiment. */
  monitoring: string[];
}

export type ChaosExperimentKind =
  | "worker_restart" | "cache_loss" | "queue_delay" | "high_latency"
  | "provider_outage" | "database_failover" | "disk_saturation" | "cpu_spike";

export interface ChaosEngineeringReport {
  generatedAt: string;
  experiments: ChaosExperimentPlan[];
  recommendations: ReliabilityRecommendation[];
}

// ===========================================================================
// SYSTEM 6 — High Availability Analyzer
// ===========================================================================

export interface HighAvailabilityReport {
  generatedAt: string;
  singlePointsOfFailure: SinglePointOfFailure[];
  criticalDependencies: CriticalDependency[];
  failoverReadiness: FailoverReadiness;
  redundancy: RedundancyAnalysis;
  availabilityScore: number;
  recommendations: ReliabilityRecommendation[];
}

export interface SinglePointOfFailure {
  component: string;
  tier: "tier1_critical" | "tier2_important" | "tier3_normal";
  hasRedundancy: boolean;
  impactIfFailed: string;
  recommendation: string;
}

export interface CriticalDependency {
  dependency: string;
  dependentServices: number;
  failoverAvailable: boolean;
  recommendation: string;
}

export interface FailoverReadiness {
  database: boolean;
  cache: boolean;
  aiProviders: boolean;
  workers: boolean;
  overall: boolean;
  recommendation: string;
}

export interface RedundancyAnalysis {
  database: RedundancyStatus;
  cache: RedundancyStatus;
  aiProviders: RedundancyStatus;
  workers: RedundancyStatus;
  webServers: RedundancyStatus;
  recommendation: string;
}

export interface RedundancyStatus {
  redundant: boolean;
  replicaCount: number;
  recommendation: string;
}

// ===========================================================================
// SYSTEM 7 — Incident Management
// ===========================================================================

export interface IncidentReport {
  id: string;
  generatedAt: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  affectedSystems: string[];
  affectedUserPercent: number;
  probableRootCause: string;
  recommendedActions: Array<{ priority: number; action: string; estimatedTimeMinutes: number }>;
  rollbackSuggestions: string[];
  communicationChecklist: string[];
  resolutionTimeline: Array<{ phase: string; estimatedTimeMinutes: number; description: string }>;
  status: "detected" | "investigating" | "mitigating" | "resolved" | "postmortem";
}

export type IncidentSeverity = "sev1" | "sev2" | "sev3" | "sev4";

// ===========================================================================
// SYSTEM 8 — Operational Runbook Generator
// ===========================================================================

export interface OperationalRunbook {
  id: string;
  scenario: string;
  title: string;
  description: string;
  detection: RunbookSection;
  diagnosis: RunbookSection;
  mitigation: RunbookSection;
  verification: RunbookSection;
  recovery: RunbookSection;
  postmortemChecklist: string[];
  estimatedResolutionMinutes: number;
}

export interface RunbookSection {
  steps: Array<{ order: number; action: string; command?: string; expectedOutcome: string }>;
  tools: string[];
  estimatedTimeMinutes: number;
}

// ===========================================================================
// SYSTEM 9 — Reliability Dashboard
// ===========================================================================

export interface ReliabilityDashboard {
  generatedAt: string;
  availability: AvailabilityMetric;
  incidentCount24h: number;
  incidentCount30d: number;
  serviceHealth: Array<{ service: string; status: "healthy" | "degraded" | "down"; uptime24h: number }>;
  recoveryReadiness: number;
  backupReadiness: number;
  redundancyScore: number;
  rtoMinutes: number;
  rpoMinutes: number;
  meetsRtoRpo: boolean;
  criticalRisks: Array<{ risk: string; severity: "low" | "medium" | "high" | "critical"; recommendation: string }>;
  operationalRecommendations: ReliabilityRecommendation[];
  overallReliabilityScore: number;
  grade: string;
}

export interface AvailabilityMetric {
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  estimatedDowntimeMinutesPerYear: number;
  nines: string; // e.g., "99.9%", "99.99%"
}

// ===========================================================================
// Shared
// ===========================================================================

export interface ReliabilityRecommendation {
  id: string;
  category: "failure" | "disaster" | "backup" | "degradation" | "chaos" | "availability" | "incident" | "runbook";
  title: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  effort: "low" | "medium" | "high";
  recommendation: string;
}
