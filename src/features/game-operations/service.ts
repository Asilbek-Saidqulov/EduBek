/** Game Operations Platform service — composes all 16 systems. */
export {
  createIncident, getIncidentById, listIncidents, transitionIncident, canTransitionIncident,
  escalateIncident, setRootCause, setResolution, setPostmortem, assignIncident, addTimelineEntry, getIncidentEscalations,
  createAlert, getAlertById, listAlerts, acknowledgeAlert, assignAlert, resolveAlert, escalateAlert,
  supportsAllSeverities, supportsAllIncidentSeverities, supportsAllIncidentStatuses, supportsAllIncidentPriorities,
} from "./incident-management";
export {
  createMaintenance, getMaintenanceById, listMaintenance, startMaintenance, completeMaintenance, cancelMaintenance, markNotificationSent,
  activateEmergency, getEmergencyById, listEmergencies, getActiveEmergencies, resolveEmergency, supportsAllEmergencyTypes, supportsAllMaintenanceTypes,
  recordAdminAction, listAdminActions, supportsAllAdminScopes,
  createAnnouncement, getAnnouncementById, listAnnouncements, publishAnnouncement, expireAnnouncement, supportsAllAnnouncementTypes, supportsAllAnnouncementAudiences,
} from "./maintenance-operations";
export {
  generateControlCenter, performIntervention, getInterventionsForMatch, supportsAllInterventionActions,
  createPlaybook, getPlaybookById, listPlaybooks, executePlaybook, deactivatePlaybook, supportsAllPlaybookCategories,
  recordServiceHealth, getServiceHealthRecord, listServiceHealth, supportsAllServiceNames,
  recordAudit, listAuditEntries,
  generateOpsDashboard, generateOpsAnalytics, getDeveloperIntegration, getStatus,
} from "./interventions-dashboard";
export {
  subscribeOps, unsubscribeOps, isOpsSubscribed, getBridgeProcessedCount, publishOpsEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";
export { _resetRepositoryForTesting } from "./repository";
