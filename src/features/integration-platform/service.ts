/** Integration Platform service — composes all 20 systems. Phase 6G.23. */
export {
  registerConnector, getConnectorById, getConnectorByKeyStr, listConnectors,
  supportsAllConnectorTypes, supportsAllConnectorStatuses,
  canTransitionConnector, transitionConnector, installConnector, enableConnector,
  disableConnector, suspendConnector, upgradeConnector, removeConnector, getConnectorLifecycle,
  createAuthReference, getAuthReferenceById, listAuthRefs, deactivateAuthRef, supportsAllAuthRefTypes,
  createSyncJob, getSyncJobById, listSyncJobs, startSyncJob, completeSyncJob, failSyncJob,
  supportsAllSyncDirections, supportsAllSyncModes, supportsAllSyncStatuses,
  createImportJob, getImportJobById, listImportJobs, startImportJob, completeImportJob, failImportJob,
  supportsAllImportFormats, supportsAllImportStatuses,
  createExportJob, getExportJobById, listExportJobs, startExportJob, completeExportJob, failExportJob,
  supportsAllExportFormats, supportsAllExportStatuses,
  registerWebhook, getWebhookById, listWebhooks, pauseWebhook, revokeWebhook, recordWebhookDelivery,
  supportsAllWebhookDirections, supportsAllWebhookStatuses,
  registerExternalApi, getExternalApiById, listExternalApis,
  recordConnectorHealth, getHealthById, getHealthForConnectorId, listHealth,
  recordConnectorFailure, recordHeartbeat, supportsAllHealthStates,
  setConnectorRateLimit, getRateLimitById, getRateLimitForConnectorId, listRateLimits,
  checkRateLimit, recordRateLimitUsage, resetRateLimitWindow,
} from "./core";
export {
  createMapping, getMappingById, listMappings,
  detectConflict, getConflictById, listConflicts, resolveConflict, ignoreConflict,
  supportsAllConflictStrategies, supportsAllConflictStatuses,
  createSyncSchedule, getSyncScheduleById, listSyncSchedules, pauseSyncSchedule,
  resumeSyncSchedule, recordSyncScheduleRun, cancelSyncSchedule, listDueSyncSchedules,
  supportsAllScheduleTypes, supportsAllScheduleStatuses,
  generateIntegrationAnalytics,
  recordIntegrationAudit, listIntegrationAudit, getIntegrationAuditCount, verifyAuditIntegrity,
  generateIntegrationDashboard,
  getDeveloperIntegration,
  generateIntegrationDocumentation, generateMarkdownDocumentation, getIntegrationVersion, getIntegrationStatus,
} from "./platform";
export {
  subscribeIntegration, unsubscribeIntegration, isIntegrationSubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishIntegrationEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";
export { _resetRepositoryForTesting } from "./repository";
export { generateAPIGatewayReport, generateIntegrationRegistry, generateConnectorReport, generateWebhookReport } from "./core-systems";
export { generateMonitorReport, generateDeveloperPortal, generateEventBridgeReport, generateSecurityReport } from "./advanced-systems";
export { generateOAuthReport, generateApiKeyReport, generateTransformationReport, generateSyncReport, generateAutomationReport, generateTriggerReport } from "./management-systems";
export type {
  ConnectorType, ConnectorStatus, ConnectorDefinition,
  ConnectorLifecycleEvent, LifecycleAction,
  AuthRefType, AuthReference,
  SyncDirection, SyncMode, SyncStatus, SyncJob,
  ImportFormat, ImportStatus, ImportJob,
  ExportFormat, ExportStatus, ExportJob,
  WebhookDirection, WebhookStatus, IntegrationWebhook,
  ExternalApiDef,
  HealthState, ConnectorHealth,
  ConnectorRateLimit,
  DataMapping,
  ConflictStrategy, ConflictStatus, ConflictRecord,
  SyncScheduleType, SyncScheduleStatus, SyncSchedule,
  IntegrationAnalytics, AuditCategory, IntegrationAuditEntry,
  IntegrationDashboard, IntegrationEventType,
  IntegrationDeveloperIntegration, IntegrationDocumentation,
} from "./types";
