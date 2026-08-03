/**
 * EduBek — AI Observability types.
 *
 * Phase 6B.2: AI Control Tower that observes, measures, analyzes,
 * experiments, and optimizes every AI interaction. 12 systems, all
 * deterministic — no LLM calls for analytics.
 */

// ===========================================================================
// SYSTEM 1 — Request Tracing
// ===========================================================================

export interface AIRequestTrace {
  traceId: string;
  requestId: string;
  userId: string | null;
  organizationId: string | null;
  feature: string | null;
  promptId: string | null;
  promptVersion: number | null;
  model: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  retries: number;
  cacheHit: boolean;
  toolCalls: number;
  reasoningDurationMs: number;
  retrievalDurationMs: number;
  totalExecutionMs: number;
  status: string;
  startedAt: string;
  completedAt: string;
}

export interface RequestTracingReport {
  generatedAt: string;
  totalTraces: number;
  traces: AIRequestTrace[];
  summary: {
    successRate: number;
    avgLatencyMs: number;
    avgCostUsd: number;
    avgTokensIn: number;
    avgTokensOut: number;
    cacheHitRate: number;
    avgRetries: number;
    avgToolCalls: number;
    avgReasoningMs: number;
    avgRetrievalMs: number;
  };
}

// ===========================================================================
// SYSTEM 2 — Latency Analytics
// ===========================================================================

export interface LatencyAnalyticsReport {
  generatedAt: string;
  overall: LatencyStats;
  byProvider: Array<{ provider: string; stats: LatencyStats }>;
  byModel: Array<{ model: string; stats: LatencyStats }>;
  byFeature: Array<{ feature: string; stats: LatencyStats }>;
  byEndpoint: Array<{ endpoint: string; stats: LatencyStats }>;
  byOrganization: Array<{ organization: string; stats: LatencyStats }>;
  slowPrompts: Array<{ promptId: string; avgLatencyMs: number; sampleCount: number }>;
  slowRetrieval: Array<{ traceId: string; retrievalMs: number }>;
  slowReasoning: Array<{ traceId: string; reasoningMs: number }>;
  slowProviders: Array<{ provider: string; avgLatencyMs: number }>;
  optimizationSuggestions: string[];
}

export interface LatencyStats {
  count: number;
  avgMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
}

// ===========================================================================
// SYSTEM 3 — Token Analytics
// ===========================================================================

export interface TokenAnalyticsReport {
  generatedAt: string;
  overall: TokenStats;
  byFeature: Array<{ feature: string; stats: TokenStats }>;
  byProvider: Array<{ provider: string; stats: TokenStats }>;
  byModel: Array<{ model: string; stats: TokenStats }>;
  byOrganization: Array<{ organization: string; stats: TokenStats }>;
  byUserRole: Array<{ role: string; stats: TokenStats }>;
  recommendations: string[];
}

export interface TokenStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalContextTokens: number;
  totalRetrievalTokens: number;
  totalReasoningTokens: number;
  totalCachedTokens: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  totalTokens: number;
}

// ===========================================================================
// SYSTEM 4 — Cost Analytics
// ===========================================================================

export interface CostAnalyticsReport {
  generatedAt: string;
  today: number;
  weekToDate: number;
  monthToDate: number;
  forecast: number;
  byProvider: Array<{ provider: string; cost: number; percent: number }>;
  byOrganization: Array<{ organization: string; cost: number; percent: number }>;
  byFeature: Array<{ feature: string; cost: number; percent: number }>;
  byModel: Array<{ model: string; cost: number; percent: number }>;
  byPrompt: Array<{ promptId: string; cost: number; calls: number }>;
  recommendations: string[];
}

// ===========================================================================
// SYSTEM 5 — Routing Analytics
// ===========================================================================

export interface RoutingAnalyticsReport {
  generatedAt: string;
  providerDistribution: Array<{ provider: string; selectionCount: number; selectionPercent: number }>;
  fallbackFrequency: number;
  providerReliability: Array<{ provider: string; successRate: number; failureRate: number; timeoutRate: number; retryRate: number }>;
  routingConfidence: number;
  modelUtilization: Array<{ model: string; callCount: number; percent: number }>;
  recommendations: string[];
}

// ===========================================================================
// SYSTEM 6 — Experiment Engine
// ===========================================================================

export type ExperimentType =
  | "prompt" | "model" | "temperature" | "context"
  | "retrieval" | "routing" | "chunk_size" | "reasoning_strategy";

export interface AIExperiment {
  id: string;
  name: string;
  type: ExperimentType;
  description: string;
  variants: Array<{ name: string; config: Record<string, unknown>; weight: number }>;
  status: "draft" | "running" | "paused" | "completed" | "cancelled";
  successMetric: string;
  startsAt: string | null;
  endsAt: string | null;
  results: ExperimentResults | null;
  winnerVariant: string | null;
  winnerConfidence: number;
}

export interface ExperimentResults {
  variants: Array<{
    name: string;
    sampleSize: number;
    qualityScore: number;
    avgLatencyMs: number;
    avgCostUsd: number;
    hallucinationRate: number;
    teacherRating: number;
    studentRating: number;
  }>;
  isSignificant: boolean;
  significanceLevel: number;
}

export interface ExperimentEngineReport {
  generatedAt: string;
  experiments: AIExperiment[];
  totalExperiments: number;
  runningCount: number;
  completedCount: number;
  recommendations: string[];
}

// ===========================================================================
// SYSTEM 7 — Drift Monitor
// ===========================================================================

export type DriftType =
  | "prompt_drift" | "quality_drift" | "cost_drift" | "latency_drift"
  | "hallucination_drift" | "retrieval_drift" | "provider_drift" | "curriculum_drift";

export interface DriftFinding {
  id: string;
  type: DriftType;
  description: string;
  baseline: number;
  current: number;
  delta: number;
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: string;
}

export interface DriftMonitorReport {
  generatedAt: string;
  findings: DriftFinding[];
  totalDrifts: number;
  criticalDrifts: number;
  recommendations: string[];
}

// ===========================================================================
// SYSTEM 8 — Anomaly Detection
// ===========================================================================

export type AnomalyKind =
  | "latency_spike" | "cost_spike" | "token_spike" | "provider_instability"
  | "quality_degradation" | "cache_failure" | "retrieval_failure"
  | "tool_failure" | "reasoning_failure";

export interface AnomalyDetection {
  id: string;
  kind: AnomalyKind;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  description: string;
  rootCauseHypothesis: string;
  affectedSystems: string[];
  recommendedActions: string[];
  detectedAt: string;
}

export interface AnomalyReport {
  generatedAt: string;
  anomalies: AnomalyDetection[];
  totalCount: number;
  criticalCount: number;
}

// ===========================================================================
// SYSTEM 9 — Optimization Engine
// ===========================================================================

export type OptimizationType =
  | "prompt" | "model" | "routing" | "retrieval" | "cache"
  | "reasoning" | "chunk" | "temperature" | "context";

export interface OptimizationRecommendation {
  id: string;
  type: OptimizationType;
  title: string;
  description: string;
  expectedQualityGain: number;
  expectedLatencyReductionMs: number;
  expectedCostReductionUsd: number;
  confidence: number;
  recommendation: string;
}

export interface OptimizationReport {
  generatedAt: string;
  recommendations: OptimizationRecommendation[];
  totalCount: number;
  criticalCount: number;
  totalEstimatedSavingsUsd: number;
}

// ===========================================================================
// SYSTEM 10 — Forecasting
// ===========================================================================

export interface ForecastReport {
  generatedAt: string;
  forecasts: Array<{
    metric: string;
    currentValue: number;
    forecastedValue: number;
    unit: string;
    confidence: number;
    trend: "increasing" | "stable" | "decreasing";
    seasonality: "none" | "daily" | "weekly" | "monthly";
    risk: "low" | "medium" | "high";
    dataPoints: Array<{ date: string; value: number }>;
  }>;
}

// ===========================================================================
// SYSTEM 11 — AI Control Tower Dashboard
// ===========================================================================

export interface ControlTowerDashboard {
  generatedAt: string;
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  totalTokens: number;
  providers: Array<{ provider: string; requestCount: number; percent: number }>;
  models: Array<{ model: string; requestCount: number; percent: number }>;
  experiments: { running: number; completed: number; total: number };
  alerts: { critical: number; warning: number; info: number; resolved: number };
  driftCount: number;
  forecasts: Array<{ metric: string; trend: string; risk: string }>;
  optimizationOpportunities: number;
  qualityTrend: Array<{ date: string; score: number }>;
  cacheHitRate: number;
  routingDistribution: Array<{ provider: string; percent: number }>;
}

// ===========================================================================
// SYSTEM 12 — Alert Manager
// ===========================================================================

export type AlertKind =
  | "provider_outage" | "quality_degradation" | "latency_spike"
  | "cost_anomaly" | "hallucination_increase" | "routing_instability"
  | "prompt_regression" | "experiment_completion" | "drift_detection";

export type AlertSeverity = "info" | "warning" | "critical" | "resolved";

export interface AIAlert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedSystems: string[];
  recommendedActions: string[];
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

export interface AlertManagerReport {
  generatedAt: string;
  alerts: AIAlert[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  resolvedCount: number;
}
