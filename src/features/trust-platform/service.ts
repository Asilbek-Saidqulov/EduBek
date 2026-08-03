/** Trust Platform service — composes all 20 systems. Phase 6G.20. */
// Systems 1-5
export {
  createRegistryEntry, getRegistryEntryById, listRegistryEntries,
  activateRegistryEntry, deprecateRegistryEntry, retireRegistryEntry,
  supportsAllEntityTypes, supportsAllRegistryStatuses,
  createPolicy, getPolicyById, getPolicyByReference, listPolicies,
  publishPolicyVersion, deactivatePolicy, addPolicyRule,
  supportsAllPolicyCategories, supportsAllPolicySeverities,
  submitReport, getReportById, listReports,
  canTransitionReport, transitionReport, linkReportToInvestigation,
  supportsAllReportTypes, supportsAllReportStatuses, supportsAllReportReasons,
  openInvestigation, getInvestigationById, listInvestigations,
  canTransitionInvestigation, transitionInvestigation,
  assignInvestigation, escalateInvestigation, resolveInvestigation,
  addEvidenceToInvestigation, addLinkedEvent,
  supportsAllInvestigationStatuses, supportsAllInvestigationPriorities,
  registerEvidence, getEvidenceById, listEvidence,
  verifyEvidenceIntegrity, supportsAllEvidenceTypes,
} from "./core";

// Systems 6-8
export {
  createSanction, getSanctionById, listSanctions,
  approveSanction, activateSanction, expireSanction, revokeSanction,
  markSanctionAppealed, supportsAllSanctionTypes, supportsAllSanctionStatuses,
  submitAppeal, getAppealById, listAppeals,
  canTransitionAppeal, assignAppeal, startAppealReview,
  decideAppeal, escalateAppeal, withdrawAppeal,
  supportsAllAppealStatuses,
  createTrustScoreRule, getTrustScoreRuleById, listTrustScoreRules,
  computeTrustScore, getTrustScoreForTarget, listTrustScores,
  supportsAllTrustScoreBands,
} from "./sanctions-appeals-trust";

// Systems 9-13
export {
  ingestSignal, getSignalById, listSignals,
  createInvestigationFromSignal, dismissSignal,
  supportsAllSignalTypes, supportsAllSignalStatuses,
  registerContentRecord, getContentRecordById, getContentRecordByReference,
  listContentRecords, classifyContent, removeContent, restoreContent,
  incrementContentReportCount,
  supportsAllContentClassifications, supportsAllContentStatuses,
  createComplianceRecord, getComplianceRecordById, listComplianceRecords,
  verifyCompliance, supportsAllComplianceDomains, supportsAllComplianceStatuses,
  assignModerator, getModeratorAssignmentById, listModeratorAssignments,
  completeAssignment, reassignAssignment, escalateAssignment, getModeratorQueue,
  supportsAllModeratorQueueTypes, supportsAllWorkflowPriorities,
  createModeratorRole, getModeratorRoleById, getModeratorRoleByReference,
  listModeratorRoles, assignModeratorRole, getModeratorRoleAssignmentById,
  listModeratorRoleAssignments, listActiveModeratorRoleAssignments,
  revokeModeratorRoleAssignment, getModeratorPermissions, moderatorHasPermission,
  supportsAllModeratorRoleTypes,
} from "./signals-compliance-rbac";

// Systems 14-17, 19-20
export {
  recordAuditEntry, listAuditEntries, listAuditForItem,
  getAuditEntryCount, verifyAuditIntegrity,
  generateTrustAnalytics,
  generateSafetyDashboard, generateComplianceDashboard,
  getDeveloperIntegration,
  generateTrustDocumentation, generateMarkdownDocumentation, getTrustVersion,
  getTrustStatus,
} from "./audit-analytics-docs";

// System 18
export {
  subscribeTrust, unsubscribeTrust, isTrustSubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishTrustEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";

// Repository reset
export { _resetRepositoryForTesting } from "./repository";

// Type re-exports
export type {
  ModerationEntityType, ModerationRegistryStatus, ModerationRegistryEntry,
  PolicyCategory, PolicySeverity, PolicyVersion, SafetyPolicy,
  ReportType, ReportStatus, ReportReason, Report,
  InvestigationStatus, InvestigationPriority, InvestigationEvent, Investigation,
  EvidenceType, Evidence,
  SanctionType, SanctionStatus, Sanction,
  AppealStatus, Appeal,
  TrustScoreRule, TrustScore, TrustScoreBand,
  SignalType, SignalStatus, SafetySignal,
  ContentClassification, ContentStatus, ContentModerationRecord,
  ComplianceDomain, ComplianceStatus, ComplianceRecord,
  ModeratorQueueType, WorkflowPriority, ModeratorAssignment,
  ModeratorRoleType, ModeratorRole, ModeratorRoleAssignment,
  ModerationAuditEntry,
  TrustAnalytics, SafetyDashboard, ComplianceDashboard,
  TrustEventType, TrustDeveloperIntegration, TrustDocumentation,
} from "./types";
