/**
 * EduBek — AI Observability barrel export.
 * Phase 6B.2: AI Control Tower — observe, measure, analyze, experiment,
 * and optimize every AI interaction.
 *
 * 12 systems, all deterministic — no LLM calls for analytics.
 * Reuses OrchestratorAIInvocation, OrchestratorTraceSpan,
 * AIQualityEvaluation, PromptEvaluation, PlatformExperiment,
 * CostSnapshot, InfraMetric.
 */

export {
  generateTracingReport,
  generateLatencyReport,
  generateTokenReport,
  generateCostReport,
  generateRoutingReport,
  createExperiment, getExperiment, listExperiments, completeExperiment, generateExperimentReport,
  generateDriftReport,
  generateAnomalyReport,
  generateOptimizationReport,
  generateForecastReport,
  generateDashboard,
  generateAlerts, listAlerts, acknowledgeAlert, resolveAlert,
} from "./service";

export type {
  AIRequestTrace, RequestTracingReport,
  LatencyAnalyticsReport, LatencyStats,
  TokenAnalyticsReport, TokenStats,
  CostAnalyticsReport,
  RoutingAnalyticsReport,
  ExperimentType, AIExperiment, ExperimentResults, ExperimentEngineReport,
  DriftType, DriftFinding, DriftMonitorReport,
  AnomalyKind, AnomalyDetection, AnomalyReport,
  OptimizationType, OptimizationRecommendation, OptimizationReport,
  ForecastReport,
  ControlTowerDashboard,
  AlertKind, AlertSeverity, AIAlert, AlertManagerReport,
} from "./types";
