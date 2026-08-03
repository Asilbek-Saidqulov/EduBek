/**
 * EduBek — Reliability barrel export.
 *
 * Phase 6A.3: Reliability Engineering, Disaster Recovery & Operational
 * Resilience.
 *
 * 9 systems:
 *   1. Failure Scenario Simulator (failure-simulator)
 *   2. Disaster Recovery Planner (disaster-recovery)
 *   3. Backup Verification Engine (backup-verifier)
 *   4. Graceful Degradation Analyzer (degradation-analyzer)
 *   5. Chaos Engineering Planner (chaos-planner)
 *   6. High Availability Analyzer (availability-analyzer)
 *   7. Incident Management (incident-manager)
 *   8. Operational Runbook Generator (runbook-generator)
 *   9. Reliability Dashboard (reliability-dashboard)
 *
 * All endpoints are READ-ONLY diagnostics. This module produces
 * recommendations and plans, never automatic changes. It reuses every
 * existing subsystem (Platform Orchestrator, Cloud Infrastructure,
 * Production Audit, Data Fabric, Education OS, Platform Intelligence,
 * Observability) without duplicating monitoring.
 */

export {
  generateFailureReport,
  generateDisasterRecoveryPlan,
  generateBackupReport,
  generateDegradationReport,
  generateChaosReport,
  generateAvailabilityReport,
  generateIncidentReport, listRecentIncidents,
  generateAllRunbooks, generateRunbook,
  generateReliabilityDashboard,
} from "./service";

export type {
  FailureScenarioKind, FailureScenario, FailureImpact, FailureSimulationReport,
  DisasterRecoveryPlan, BackupCoverageSummary, CriticalService, RecoveryPhase,
  BackupVerificationReport, BackupStatus,
  GracefulDegradationReport, DegradationScenario,
  ChaosExperimentKind, ChaosExperimentPlan, ChaosEngineeringReport,
  HighAvailabilityReport, SinglePointOfFailure, CriticalDependency,
  FailoverReadiness, RedundancyAnalysis, RedundancyStatus,
  IncidentReport, IncidentSeverity,
  OperationalRunbook, RunbookSection,
  ReliabilityDashboard, AvailabilityMetric,
  ReliabilityRecommendation,
} from "./types";
