/**
 * EduBek — Platform Intelligence barrel export.
 *
 * Phase 4F.7: Self-Improving AI, Continuous Learning & Platform
 * Intelligence. Transforms every platform event into feedback signals
 * that progressively improve recommendations, search ranking, AI
 * prompts, curriculum mappings, and operational parameters.
 *
 * Everything is additive — no breaking changes to prior phases.
 */
// Main service
export {
  getOverview,
  recordFeedbackEvent,
  listFeedback,
  getRecommendationLearning,
  getSearchLearning,
  getPromptLearning,
  recordPromptEval,
  getLearningSignals,
  createPlatformExperiment,
  listPlatformExperiments,
  getPlatformExperiment,
  startExperiment,
  pauseExperiment,
  assignExperimentVariant,
  getExperimentVariant,
  getExperimentResultsDto,
  finalizePlatformExperiment,
  runOptimizationCycle,
  listOptimizationSnapshots,
  runPlatformForecast,
  listPlatformForecasts,
  getHealth,
  listAuditLog,
  getCurriculumIntelligence,
  getMarketplaceIntelligence,
  getOrganizationIntelligence,
  getPlatformInsights,
  acknowledgePlatformInsight,
  runMonitoring,
  recompute,
} from "./service";

// Feedback (advanced use)
export { recordFeedback, recordFeedbackBatch } from "./feedback";

// Learning (advanced use)
export {
  computeRecommendationLearning,
  computeSearchLearning,
  computePromptLearning,
} from "./learning";

// Experimentation (advanced use)
export {
  createExperiment,
  assignVariant,
  finalizeExperiment,
} from "./experimentation";

// Optimization (advanced use)
export { runOptimizations } from "./optimization";

// Forecasting (advanced use)
export { runForecast } from "./forecasting";

// Health (advanced use)
export { checkAllSubsystems, checkSubsystem } from "./health";

// Audit (advanced use)
export {
  recordAudit,
  auditRecommendation,
  auditAiGeneration,
  auditWorkflowExecution,
  auditAutomationTrigger,
  auditOptimizationApplied,
} from "./audit";

// Analytics (advanced use)
export {
  computeCurriculumIntelligence,
  computeMarketplaceIntelligence,
  computeOrganizationIntelligence,
  generatePlatformInsights,
} from "./analytics";

// Monitoring (advanced use)
export { runMonitoringCycle, ALERT_THRESHOLDS } from "./monitoring";

// Types
export type {
  FeedbackEventType,
  FeedbackOutcome,
  FeedbackEventDto,
  RecordFeedbackInput,
  LearningSignalType,
  LearningSignalDto,
  RecommendationOutcomeType,
  RecommendationOutcomeDto,
  RecommendationLearningDto,
  SearchOutcomeDto,
  SearchLearningDto,
  PromptEvaluationDto,
  PromptLearningDto,
  ExperimentType,
  ExperimentStatus,
  ExperimentVariant,
  PlatformExperimentDto,
  ExperimentAssignmentDto,
  ExperimentResultDto,
  OptimizationParameter,
  OptimizationSnapshotDto,
  ForecastType,
  ForecastSnapshotDto,
  HealthSubsystem,
  HealthStatus,
  HealthSnapshotDto,
  PlatformHealthDto,
  AuditActionType,
  AuditEventDto,
  InsightCategory,
  InsightSeverity,
  PlatformInsightDto,
  CurriculumIntelligenceDto,
  MarketplaceIntelligenceDto,
  OrganizationIntelligenceDto,
  PlatformOverviewDto,
} from "./types";
