/**
 * EduBek — Reliability service.
 *
 * Phase 6A.3: Composes every reliability analyzer into a unified API
 * surface. Routes are thin wrappers around the functions exported here.
 */
import { generateFailureReport } from "./failure-simulator";
import { generateDisasterRecoveryPlan } from "./disaster-recovery";
import { generateBackupReport } from "./backup-verifier";
import { generateDegradationReport } from "./degradation-analyzer";
import { generateChaosReport } from "./chaos-planner";
import { generateAvailabilityReport } from "./availability-analyzer";
import { generateIncidentReport, listRecentIncidents } from "./incident-manager";
import { generateAllRunbooks, generateRunbook } from "./runbook-generator";
import { generateReliabilityDashboard } from "./reliability-dashboard";

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
};
