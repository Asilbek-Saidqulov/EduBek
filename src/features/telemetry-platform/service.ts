/** Telemetry Platform service — composes all 25 systems. Phase 6G.19. */
// Systems 1-5
export {
  registerService, getServiceById, listServices, touchService, deactivateService,
  supportsAllServiceCategories, supportsAllServiceCriticalities,
  defineMetric, getMetricDefinition, getMetricDefinitionByKey, listMetrics,
  recordMetric, getMetricAggregateForKey,
  incrementCounter, setGauge, recordTimer, supportsAllMetricTypes,
  log, logTrace, logDebug, logInfo, logWarn, logError, logFatal,
  listLogs, getLogsForCorrelation, getLogsForService, supportsAllLogLevels,
  startTrace, startSpan, finishSpan, addSpanAttribute, addSpanEvent,
  getTraceById, listTraces, getTraceSpans, supportsAllSpanKinds, supportsAllSpanStatuses,
  createCorrelationContext, getCorrelationContext, listCorrelations, deriveCorrelation,
} from "./core";

// Systems 6-10
export {
  recordHealthCheck, getLatestHealth, listHealthChecks, getPlatformHealth,
  supportsAllHealthStatuses,
  sendHeartbeat, getHeartbeatStatsForService, listHeartbeats, markHeartbeatMissed,
  registerDependency, getDependencyById, listDependencies,
  updateDependencyStatus, getDependencyGraph,
  supportsAllDependencyTypes, supportsAllDependencyStatuses,
  recordPerformanceSnapshot, listPerformanceSnapshots, getPerformanceStats,
  recordQueueMetric, listQueueMetrics, getQueueSummary, supportsAllQueueTypes,
} from "./monitoring";

// Systems 11-15
export {
  recordPublishedEvent, recordConsumedEvent, recordEventRetry, recordDeadLetter,
  listEventMonitorEntries, generateEventMonitorStats,
  recordFailure, getFailureClusterById, listFailureClusters,
  setRootCause, linkFailureClusters,
  registerError, getErrorById, getErrorByErrorCode, listErrors,
  recordErrorOccurrence, deactivateError,
  supportsAllErrorCategories, supportsAllErrorSeverities,
  createAlertRule, getAlertRuleById, listAlertRules, deactivateAlertRule,
  triggerAlert, getAlertById, listAlerts,
  acknowledgeAlert, resolveAlert, suppressAlert,
  supportsAllAlertConditions, supportsAllAlertSeverities, supportsAllAlertStatuses,
  openIncident, getIncidentById, listIncidents,
  canTransitionIncident, transitionIncident, addIncidentEvent,
  setIncidentRootCause, setIncidentResolution, assignIncidentOwner,
  supportsAllIncidentSeverities, supportsAllIncidentStatuses,
} from "./events-errors-alerts";

// Systems 16-20
export {
  recordCapacitySnapshot, listCapacitySnapshots,
  getCapacityUtilization, getPlatformCapacitySummary,
  recordProfileSample, listProfileSamples, getHotPaths, getSlowestMethods,
  takePlatformSnapshot, listPlatformSnapshots, getLatestSnapshot,
  runDiagnosticCheck, runDiagnosticReport, listDiagnosticReports,
  getLatestDiagnosticReportFor,
  supportsAllDiagnosticCheckTypes, supportsAllDiagnosticCheckStatuses,
  createSLO, getSLOById, listSLOs, updateSLOStatus,
  getSLOStatusForSLO, listSLOStatuses, getSLOSummary,
  supportsAllSLOTypes,
} from "./capacity-slo";

// Systems 21-24
export {
  generateDeveloperDiagnosticReport,
  generateOperationalDashboard,
  registerExportConfig, getExportConfigById, listExportConfigs,
  markExported, setExportEnabled, exportMetrics, supportsAllExportFormats,
  generateTelemetryDocumentation, generateMarkdownDocumentation, getTelemetryVersion,
  getDeveloperIntegration, getTelemetryStatus,
} from "./dashboard-export-docs";

// System 25
export {
  subscribeTelemetry, unsubscribeTelemetry, isTelemetrySubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishTelemetryEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";

// Repository reset
export { _resetRepositoryForTesting } from "./repository";

// Type re-exports
export type {
  ServiceCategory, ServiceCriticality, RegisteredService,
  MetricType, MetricDefinition, MetricSample, MetricAggregate,
  LogLevel, LogEntry,
  SpanKind, SpanStatus, TraceSpan, Trace,
  CorrelationContext,
  HealthStatus, HealthCheck,
  Heartbeat, HeartbeatStats,
  DependencyType, DependencyStatus, DependencyEdge,
  PerformanceSnapshot,
  QueueType, QueueMetrics,
  EventMonitorEntry, EventMonitorStats,
  FailureCluster,
  ErrorCategory, ErrorSeverity, RegisteredError,
  AlertCondition, AlertSeverity, AlertStatus, AlertRule, Alert,
  IncidentSeverity, IncidentStatus, IncidentEvent, Incident,
  CapacitySnapshot,
  ProfileSample,
  PlatformSnapshot,
  DiagnosticCheckType, DiagnosticCheckStatus, DiagnosticCheck, DiagnosticReport,
  SLOType, SLODefinition, SLOStatus,
  DeveloperDiagnosticReport, OperationalDashboard,
  ExportFormat, ExportConfig,
  TelemetryDocumentation, TelemetryEventType, TelemetryDeveloperIntegration,
} from "./types";
