/** Data Platform service — composes all 24 systems. Phase 6G.25. */
export {
  createDataset, getDatasetById, listDatasets, activateDataset, archiveDataset,
  supportsAllDatasetCategories, supportsAllDatasetStatuses,
  createCatalogEntry, getCatalogEntryById, listCatalogEntries,
  createLakePartition, listLakePartitions, createLakeSnapshot, listLakeSnapshots,
  setLakeRetention, getLakeRetentionForDataset, supportsAllLakeFormats,
  createWarehouseObject, getWarehouseObjectById, listWarehouseObjects,
  recordWarehouseRefresh, getWarehouseRefreshHistory,
  supportsAllWarehouseObjectTypes, supportsAllWarehouseRefreshStatuses,
  createETLJob, getETLJobById, listETLJobs, runETLJob, supportsAllETLStatuses,
  createELTJob, getELTJobById, listELTJobs, runELTJob, supportsAllELTStatuses,
  createPipeline, getPipelineById, listPipelines, runPipeline, completePipelineRun, failPipelineRun,
  getPipelineRunById, listPipelineRuns, supportsAllPipelineStatuses,
  createSnapshot, getSnapshotById, listSnapshots, restoreSnapshot, expireSnapshot,
  supportsAllSnapshotTypes, supportsAllSnapshotStatuses,
} from "./core";
export {
  createFact, getFactById, listFacts, supportsAllFactGrains,
  createDimension, getDimensionById, listDimensions, supportsAllSCDTypes,
  createSemanticMetric, getSemanticMetricById, listSemanticMetrics,
  createKPI, getKPIById, listKPIs, calculateKPI, getKPIHistory, supportsAllKPICategories,
  createReport, getReportById, listReports, executeReport, completeReportExecution, failReportExecution,
  getReportExecutionById, listReportExecutions, supportsAllReportFormats, supportsAllReportStatuses,
  createDashboard, getDashboardById, listDashboards, publishDashboard, supportsAllWidgetTypes,
  createReportSchedule, getReportScheduleById, listReportSchedules, recordScheduleRun,
  createSubscription, getSubscriptionById, listSubscriptions, supportsAllScheduleTypes,
  createDataExport, getDataExportById, listDataExports, startDataExport, completeDataExport,
  supportsAllExportFormats, supportsAllExportStatuses,
} from "./analytics";
export {
  createLineageNode, getLineageNodeById, listLineageNodes, createLineageEdge, getLineageEdgeById,
  listLineageEdges, getLineageForNode, supportsAllLineageNodeTypes,
  createQualityRule, getQualityRuleById, listQualityRules, runQualityCheck, getQualityHistory,
  listQualityResults, supportsAllQualityDimensions, supportsAllQualityStatuses,
  createGovernancePolicy, getGovernancePolicyById, listGovernancePolicies,
  approveGovernancePolicy, rejectGovernancePolicy,
  supportsAllGovernanceClassifications, supportsAllGovernanceStatuses,
  generateBIAnalytics,
  getDeveloperIntegration, generateAdminDashboard,
} from "./governance";
export {
  generateDocumentation, generateMarkdownDocumentation, getDataPlatformVersion, getDataPlatformStatus,
} from "./documentation";
export {
  subscribeDataPlatform, unsubscribeDataPlatform, isDataPlatformSubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishDataEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";
export { _resetRepositoryForTesting } from "./repository";
export type {
  DatasetCategory, DatasetStatus, DatasetDefinition,
  CatalogEntry,
  LakePartition, LakeFormat, LakeSnapshotMeta, LakeRetentionPolicy,
  WarehouseObject, WarehouseObjectType, WarehouseRefreshLog, WarehouseRefreshStatus,
  ETLJob, ETLStatus, ELTJob, ELTStatus,
  Pipeline, PipelineStep, PipelineStatus, PipelineRun,
  SnapshotRecord, SnapshotType, SnapshotStatus,
  FactDefinition, FactGrain,
  DimensionDefinition, SCDType,
  SemanticMetric,
  KPIDefinition, KPIResult, KPICategory,
  ReportDefinition, ReportFormat, ReportStatus, ReportExecution,
  DashboardDefinition, DashboardWidget, WidgetType,
  ReportSchedule, ScheduleType, SubscriptionStatus, ReportSubscription,
  DataExport, ExportFormat, ExportStatus,
  LineageNode, LineageEdge, LineageNodeType,
  QualityRule, QualityDimension, QualityStatus, QualityResult,
  GovernancePolicy, GovernanceClassification, GovernanceStatus,
  BIAnalytics, DataEventType, DeveloperIntegration, AdminDashboard, DataPlatformDocumentation,
} from "./types";
