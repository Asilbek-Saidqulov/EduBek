/**
 * EduBek — Platform Intelligence main service.
 *
 * Phase 4F.7: Public-facing service that composes the Feedback Engine,
 * Learning Engine, Experimentation Framework, Optimization Engine,
 * Forecasting, Health Monitoring, Audit, and Analytics aggregators
 * into a unified API surface.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { recordFeedback, listFeedbackEvents, countFeedbackEvents } from "./feedback";
import {
  computeRecommendationLearning,
  computeSearchLearning,
  computePromptLearning,
  recordPromptEvaluation,
  listLearningSignals,
} from "./learning";
import {
  createExperiment,
  getExperiment,
  listExperiments,
  updateExperimentStatus,
  assignVariant,
  getVariant,
  getExperimentResults,
  finalizeExperiment,
} from "./experimentation";
import { runOptimizations, listOptimizations } from "./optimization";
import { runForecast, listForecasts } from "./forecasting";
import { checkAllSubsystems, getLatestHealth } from "./health";
import { recordAudit, listAuditEvents, countAuditEvents } from "./audit";
import {
  computeCurriculumIntelligence,
  computeMarketplaceIntelligence,
  computeOrganizationIntelligence,
  generatePlatformInsights,
  listPlatformInsights,
  acknowledgeInsight,
} from "./analytics";
import { runMonitoringCycle } from "./monitoring";
import type {
  FeedbackEventDto,
  RecordFeedbackInput,
  RecommendationLearningDto,
  SearchLearningDto,
  PromptLearningDto,
  PlatformExperimentDto,
  ExperimentResultDto,
  OptimizationSnapshotDto,
  ForecastSnapshotDto,
  ForecastType,
  PlatformHealthDto,
  AuditEventDto,
  AuditActionType,
  CurriculumIntelligenceDto,
  MarketplaceIntelligenceDto,
  OrganizationIntelligenceDto,
  PlatformInsightDto,
  InsightCategory,
  InsightSeverity,
  PlatformOverviewDto,
  ExperimentType,
  ExperimentStatus,
  LearningSignalDto,
  LearningSignalType,
} from "./types";

const log = getLogger("platform-intelligence");

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export async function getOverview(): Promise<PlatformOverviewDto> {
  const [
    totalFeedbackEvents,
    totalLearningSignals,
    totalExperiments,
    activeExperiments,
    totalInsights,
    unacknowledgedInsights,
    totalAuditEvents,
    totalOptimizations,
    totalForecasts,
    health,
  ] = await Promise.all([
    countFeedbackEvents(),
    repo.countLearningSignals(),
    repo.countExperiments(),
    repo.countExperiments("running"),
    repo.countInsights(),
    repo.countInsights(true),
    countAuditEvents(),
    repo.countOptimizations(),
    repo.countForecasts(),
    getLatestHealth().catch(() => null),
  ]);

  return {
    status: (health?.overallStatus === "healthy" ? "operational" : health?.overallStatus === "unknown" ? "operational" : health?.overallStatus) as "operational" | "degraded" | "down",
    overallHealth: health?.overallScore ?? 0,
    totalFeedbackEvents,
    totalLearningSignals,
    totalExperiments,
    activeExperiments,
    totalInsights,
    unacknowledgedInsights,
    totalAuditEvents,
    totalOptimizations,
    totalForecasts,
    subsystems: health?.subsystems.map((s) => ({ name: s.subsystem, status: s.status, score: s.score })) ?? [],
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export async function recordFeedbackEvent(input: RecordFeedbackInput): Promise<FeedbackEventDto> {
  return recordFeedback(input);
}

export async function listFeedback(input: {
  type?: any;
  userId?: string;
  scopeType?: string;
  scopeId?: string;
  entityType?: string;
  entityId?: string;
  outcome?: any;
  experimentId?: string;
  sinceDays?: number;
  limit?: number;
}): Promise<FeedbackEventDto[]> {
  return listFeedbackEvents(input);
}

// ---------------------------------------------------------------------------
// Learning
// ---------------------------------------------------------------------------

export async function getRecommendationLearning(input: { sinceDays?: number }): Promise<RecommendationLearningDto[]> {
  return computeRecommendationLearning(input);
}

export async function getSearchLearning(input: { sinceDays?: number }): Promise<SearchLearningDto> {
  return computeSearchLearning(input);
}

export async function getPromptLearning(input: { sinceDays?: number }): Promise<PromptLearningDto[]> {
  return computePromptLearning(input);
}

export async function recordPromptEval(input: {
  promptTemplateId?: string;
  promptVersion?: string;
  provider: string;
  model: string;
  generationId?: string;
  acceptanceScore?: number;
  regenerationRate?: number;
  editRate?: number;
  userRating?: number;
  costCredits?: number;
  latencyMs?: number;
  locale?: string;
}): Promise<void> {
  return recordPromptEvaluation(input);
}

export async function getLearningSignals(input: {
  signalType?: LearningSignalType;
  entityType?: string;
  limit?: number;
}): Promise<LearningSignalDto[]> {
  return listLearningSignals(input);
}

// ---------------------------------------------------------------------------
// Experiments
// ---------------------------------------------------------------------------

export async function createPlatformExperiment(input: {
  name: string;
  description?: string;
  type: ExperimentType;
  variants: Array<{ name: string; weight: number }>;
  rolloutPct?: number;
  successMetric?: string;
  ownerId: string;
  startsAt?: Date;
  endsAt?: Date;
}): Promise<PlatformExperimentDto> {
  return createExperiment(input);
}

export async function listPlatformExperiments(input: {
  type?: ExperimentType;
  status?: ExperimentStatus;
  ownerId?: string;
  limit?: number;
}): Promise<PlatformExperimentDto[]> {
  return listExperiments(input);
}

export async function getPlatformExperiment(id: string): Promise<PlatformExperimentDto | null> {
  return getExperiment(id);
}

export async function startExperiment(id: string): Promise<PlatformExperimentDto> {
  return updateExperimentStatus(id, "running");
}

export async function pauseExperiment(id: string): Promise<PlatformExperimentDto> {
  return updateExperimentStatus(id, "paused");
}

export async function assignExperimentVariant(experimentId: string, userId: string) {
  return assignVariant(experimentId, userId);
}

export async function getExperimentVariant(experimentId: string, userId: string): Promise<string | null> {
  return getVariant(experimentId, userId);
}

export async function getExperimentResultsDto(id: string): Promise<ExperimentResultDto | null> {
  return getExperimentResults(id);
}

export async function finalizePlatformExperiment(id: string): Promise<ExperimentResultDto | null> {
  return finalizeExperiment(id);
}

// ---------------------------------------------------------------------------
// Optimization
// ---------------------------------------------------------------------------

export async function runOptimizationCycle(): Promise<OptimizationSnapshotDto[]> {
  return runOptimizations();
}

export async function listOptimizationSnapshots(input: {
  parameter?: any;
  autoApplied?: boolean;
  limit?: number;
}): Promise<OptimizationSnapshotDto[]> {
  return listOptimizations(input);
}

// ---------------------------------------------------------------------------
// Forecasting
// ---------------------------------------------------------------------------

export async function runPlatformForecast(input: {
  type: ForecastType;
  scopeType?: string;
  scopeId?: string;
  horizon?: "7d" | "30d" | "90d" | "1y";
}): Promise<ForecastSnapshotDto> {
  return runForecast(input);
}

export async function listPlatformForecasts(input: {
  type?: ForecastType;
  scopeType?: string;
  scopeId?: string;
  limit?: number;
}): Promise<ForecastSnapshotDto[]> {
  return listForecasts(input);
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function getHealth(refresh = false): Promise<PlatformHealthDto> {
  if (refresh) return checkAllSubsystems();
  return getLatestHealth();
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export async function listAuditLog(input: {
  actionType?: AuditActionType;
  actorType?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  affectedUserId?: string;
  scopeType?: string;
  scopeId?: string;
  outcome?: string;
  sinceDays?: number;
  limit?: number;
}): Promise<AuditEventDto[]> {
  return listAuditEvents(input);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getCurriculumIntelligence(input: { frameworkId?: string }): Promise<CurriculumIntelligenceDto> {
  return computeCurriculumIntelligence(input);
}

export async function getMarketplaceIntelligence(): Promise<MarketplaceIntelligenceDto> {
  return computeMarketplaceIntelligence();
}

export async function getOrganizationIntelligence(input: { organizationId: string }): Promise<OrganizationIntelligenceDto> {
  return computeOrganizationIntelligence(input);
}

export async function getPlatformInsights(input: {
  category?: InsightCategory;
  severity?: InsightSeverity;
  unacknowledgedOnly?: boolean;
  limit?: number;
}): Promise<PlatformInsightDto[]> {
  return listPlatformInsights(input);
}

export async function acknowledgePlatformInsight(id: string): Promise<void> {
  return acknowledgeInsight(id);
}

// ---------------------------------------------------------------------------
// Monitoring
// ---------------------------------------------------------------------------

export async function runMonitoring(): Promise<{ health: PlatformHealthDto; alertsTriggered: number }> {
  return runMonitoringCycle();
}

// ---------------------------------------------------------------------------
// Recompute (full recompute of all aggregates)
// ---------------------------------------------------------------------------

export async function recompute(): Promise<{
  insights: PlatformInsightDto[];
  optimizations: OptimizationSnapshotDto[];
}> {
  log.info("recompute.started");

  const [insights, optimizations] = await Promise.all([
    generatePlatformInsights().catch(() => []),
    runOptimizations().catch(() => []),
  ]);

  log.info("recompute.completed", {
    insights: insights.length,
    optimizations: optimizations.length,
  });

  return { insights, optimizations };
}
