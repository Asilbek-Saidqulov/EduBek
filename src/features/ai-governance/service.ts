/**
 * EduBek — AI Governance service.
 * Phase 6B.3: Composes every governance subsystem into a unified API.
 */
import { createPolicy, listPolicies, evaluateCompliance, generatePolicyReport } from "./policy-engine";
import { evaluateSafety, generateSafetyReport } from "./safety-engine";
import { evaluatePrivacy } from "./privacy-engine";
import { generateComplianceReport } from "./compliance-engine";
import { generateRiskReport } from "./risk-engine";
import { createApproval, reviewApproval, listApprovals, generateApprovalReport } from "./approval-workflows";
import { recordAudit, generateAuditReport, searchAudit } from "./audit-engine";
import { generateExplainabilityReport } from "./explainability";
import { generateAccessReport, checkAccess } from "./access-governance";
import { generateModelGovernanceReport, approveModel, deprecateModel, recommendModelAction } from "./model-governance";
import { generateGovernanceDashboard } from "./governance-dashboard";
import { generateReport } from "./governance-reports";

export {
  createPolicy, listPolicies, evaluateCompliance, generatePolicyReport,
  evaluateSafety, generateSafetyReport,
  evaluatePrivacy,
  generateComplianceReport,
  generateRiskReport,
  createApproval, reviewApproval, listApprovals, generateApprovalReport,
  recordAudit, generateAuditReport, searchAudit,
  generateExplainabilityReport,
  generateAccessReport, checkAccess,
  generateModelGovernanceReport, approveModel, deprecateModel, recommendModelAction,
  generateGovernanceDashboard,
  generateReport,
};
