/**
 * EduBek — Platform Intelligence types.
 *
 * Phase 4F.7: Self-Improving AI, Continuous Learning & Platform
 * Intelligence. Transforms every platform event into feedback signals
 * that progressively improve recommendations, search ranking, AI
 * prompts, curriculum mappings, and operational parameters.
 *
 * All DTOs are JSON-serializable + carry messageKey / params for i18n.
 */

// ---------------------------------------------------------------------------
// Feedback Events
// ---------------------------------------------------------------------------

export type FeedbackEventType =
  | "quiz_completed"
  | "lesson_opened"
  | "resource_abandoned"
  | "recommendation_clicked"
  | "recommendation_ignored"
  | "recommendation_dismissed"
  | "search_success"
  | "search_failure"
  | "ai_generation_accepted"
  | "ai_generation_regenerated"
  | "marketplace_purchase"
  | "marketplace_refund"
  | "course_completed"
  | "certificate_earned"
  | "discussion_solved"
  | "teacher_edited_ai_output"
  | "student_corrected_answer";

export type FeedbackOutcome = "positive" | "negative" | "neutral";

export interface FeedbackEventDto {
  id: string;
  type: FeedbackEventType;
  userId: string | null;
  scopeType: string | null;
  scopeId: string | null;
  entityType: string | null;
  entityId: string | null;
  payload: Record<string, unknown>;
  outcome: FeedbackOutcome;
  value: number;
  experimentId: string | null;
  variant: string | null;
  occurredAt: string;
}

export interface RecordFeedbackInput {
  type: FeedbackEventType;
  userId?: string;
  scopeType?: string;
  scopeId?: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  outcome?: FeedbackOutcome;
  value?: number;
  experimentId?: string;
  variant?: string;
}

// ---------------------------------------------------------------------------
// Learning Signals
// ---------------------------------------------------------------------------

export type LearningSignalType =
  | "recommendation"
  | "search_result"
  | "prompt"
  | "resource"
  | "quiz"
  | "lesson";

export interface LearningSignalDto {
  id: string;
  signalType: LearningSignalType;
  entityType: string;
  entityId: string;
  secondaryEntityType: string | null;
  secondaryEntityId: string | null;
  impressions: number;
  clicks: number;
  completions: number;
  dismissals: number;
  ignores: number;
  ctr: number;
  satisfaction: number;
  recentOutcomes: FeedbackOutcome[];
  lastComputedAt: string | null;
}

// ---------------------------------------------------------------------------
// Recommendation Outcomes
// ---------------------------------------------------------------------------

export type RecommendationOutcomeType =
  | "impression"
  | "click"
  | "open"
  | "complete"
  | "ignore"
  | "dismiss"
  | "helpful"
  | "not_helpful";

export interface RecommendationOutcomeDto {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  strategy: string;
  position: number;
  outcome: RecommendationOutcomeType;
  timeSpentMs: number | null;
  confidence: number | null;
  experimentId: string | null;
  variant: string | null;
  occurredAt: string;
}

export interface RecommendationLearningDto {
  strategy: string;
  totalImpressions: number;
  totalClicks: number;
  totalCompletions: number;
  totalDismissals: number;
  ctr: number;
  satisfaction: number;
  /** Adjusted confidence multiplier (0.5-1.5) — applied to future recs. */
  confidenceAdjustment: number;
  /** Per-position CTR breakdown. */
  positionCtr: Array<{ position: number; ctr: number }>;
}

// ---------------------------------------------------------------------------
// Search Outcomes
// ---------------------------------------------------------------------------

export interface SearchOutcomeDto {
  id: string;
  userId: string | null;
  query: string;
  resultCount: number;
  clickedPosition: number | null;
  clickedEntityId: string | null;
  clickedEntityType: string | null;
  reformulated: boolean;
  abandoned: boolean;
  timeSpentMs: number | null;
  outcome: "success" | "failure" | "partial" | "neutral";
  experimentId: string | null;
  variant: string | null;
  occurredAt: string;
}

export interface SearchLearningDto {
  totalSearches: number;
  successfulSearches: number;
  failedSearches: number;
  abandonedSearches: number;
  reformulatedSearches: number;
  avgClickedPosition: number;
  topQueries: Array<{ query: string; count: number; ctr: number }>;
  zeroResultQueries: Array<{ query: string; count: number }>;
  /** Suggested ranking weight adjustments. */
  rankingAdjustments: Array<{ signal: string; currentWeight: number; suggestedWeight: number; reason: string }>;
}

// ---------------------------------------------------------------------------
// Prompt Evaluation
// ---------------------------------------------------------------------------

export interface PromptEvaluationDto {
  id: string;
  promptTemplateId: string | null;
  promptVersion: string | null;
  provider: string;
  model: string;
  generationId: string | null;
  acceptanceScore: number;
  regenerationRate: number;
  editRate: number;
  userRating: number | null;
  costCredits: number;
  latencyMs: number;
  locale: string;
  overallQuality: number;
  occurredAt: string;
}

export interface PromptLearningDto {
  promptTemplateId: string;
  promptVersion: string | null;
  totalGenerations: number;
  avgAcceptance: number;
  avgRegenerationRate: number;
  avgEditRate: number;
  avgUserRating: number;
  avgCostCredits: number;
  avgLatencyMs: number;
  overallQuality: number;
  /** Whether this prompt is drifting (declining quality). */
  isDrifting: boolean;
  /** Recommended action: 'keep' | 'tune' | 'rollback' | 'deprecate'. */
  recommendation: "keep" | "tune" | "rollback" | "deprecate";
}

// ---------------------------------------------------------------------------
// Experiments
// ---------------------------------------------------------------------------

export type ExperimentType =
  | "ab_test"
  | "ranking"
  | "prompt"
  | "recommendation"
  | "search"
  | "marketplace"
  | "planner"
  | "feature_flag";

export type ExperimentStatus = "draft" | "running" | "paused" | "completed" | "cancelled";

export interface ExperimentVariant {
  name: string;
  weight: number;
}

export interface PlatformExperimentDto {
  id: string;
  name: string;
  description: string | null;
  type: ExperimentType;
  variants: ExperimentVariant[];
  rolloutPct: number;
  successMetric: string;
  status: ExperimentStatus;
  winnerVariant: string | null;
  winnerConfidence: number | null;
  startsAt: string | null;
  endsAt: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentAssignmentDto {
  id: string;
  experimentId: string;
  userId: string;
  variant: string;
  assignedAt: string;
  firstOutcome: string | null;
  firstOutcomeAt: string | null;
}

export interface ExperimentResultDto {
  experiment: PlatformExperimentDto;
  variantResults: Array<{
    variant: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
    confidence: number;
  }>;
  winnerVariant: string | null;
  winnerConfidence: number;
  isStatisticallySignificant: boolean;
}

// ---------------------------------------------------------------------------
// Optimization
// ---------------------------------------------------------------------------

export type OptimizationParameter =
  | "cache_ttl"
  | "ranking_weights"
  | "recommendation_weights"
  | "embedding_freshness"
  | "graph_density"
  | "search_aliases"
  | "curriculum_mappings"
  | "automation_thresholds"
  | "planner_intervals"
  | "notification_timing";

export interface OptimizationSnapshotDto {
  id: string;
  parameter: OptimizationParameter;
  previousValue: unknown;
  newValue: unknown;
  metric: string;
  improvementPct: number | null;
  confidence: number;
  autoApplied: boolean;
  appliedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Forecasting
// ---------------------------------------------------------------------------

export type ForecastType =
  | "dropout"
  | "exam_success"
  | "resource_popularity"
  | "marketplace_demand"
  | "teacher_workload"
  | "ai_credit_usage"
  | "resource_decay"
  | "curriculum_gaps"
  | "search_trends"
  | "topic_popularity";

export interface ForecastSnapshotDto {
  id: string;
  forecastType: ForecastType;
  scopeType: string | null;
  scopeId: string | null;
  predictedValue: number | null;
  horizon: string | null;
  confidence: number;
  metadata: Record<string, unknown>;
  explanation: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export type HealthSubsystem =
  | "discovery"
  | "search"
  | "recommendations"
  | "ai"
  | "marketplace"
  | "knowledge_graph"
  | "education_os"
  | "learning_planner"
  | "localization"
  | "automation"
  | "knowledge_intelligence"
  | "collaboration";

export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

export interface HealthSnapshotDto {
  id: string;
  subsystem: HealthSubsystem;
  status: HealthStatus;
  score: number;
  details: {
    metrics: Record<string, number>;
    checks: Array<{ name: string; passed: boolean; message: string }>;
    alerts: Array<{ severity: string; message: string }>;
  };
  responseMs: number | null;
  checkedAt: string;
}

export interface PlatformHealthDto {
  overallStatus: HealthStatus;
  overallScore: number;
  subsystems: HealthSnapshotDto[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export type AuditActionType =
  | "recommendation"
  | "ai_generation"
  | "workflow_execution"
  | "automation_trigger"
  | "student_flagged"
  | "teacher_notified"
  | "optimization_applied"
  | "experiment_assignment";

export interface AuditEventDto {
  id: string;
  actionType: AuditActionType;
  actorType: string;
  actorId: string | null;
  entityType: string | null;
  entityId: string | null;
  affectedUserId: string | null;
  scopeType: string | null;
  scopeId: string | null;
  reasoning: {
    inputs?: Record<string, unknown>;
    reasoning?: string;
    confidence?: number;
    affectedModules?: string[];
  };
  confidence: number | null;
  outcome: "success" | "failure" | "pending";
  occurredAt: string;
}

// ---------------------------------------------------------------------------
// Platform Insights
// ---------------------------------------------------------------------------

export type InsightCategory =
  | "curriculum"
  | "marketplace"
  | "organization"
  | "recommendation"
  | "search"
  | "ai"
  | "learning"
  | "forecast"
  | "optimization";

export type InsightSeverity = "info" | "warning" | "critical" | "success";

export interface PlatformInsightDto {
  id: string;
  category: InsightCategory;
  type: string;
  title: string;
  description: string;
  titleKey: string | null;
  descriptionKey: string | null;
  evidence: {
    evidence?: Array<{ type: string; id: string; title: string; relevance: number }>;
    metrics?: Record<string, number>;
    recommendations?: string[];
  };
  confidence: number;
  severity: InsightSeverity;
  scopeType: string | null;
  scopeId: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Curriculum / Marketplace / Organization Intelligence
// ---------------------------------------------------------------------------

export interface CurriculumIntelligenceDto {
  missingStandards: Array<{ standardId: string; code: string; title: string; demand: number }>;
  overrepresentedStandards: Array<{ standardId: string; code: string; resourceCount: number }>;
  underrepresentedConcepts: Array<{ conceptId: string; name: string; resourceCount: number }>;
  curriculumDrift: number;
  teacherDemand: Array<{ subject: string; demand: number }>;
  studentDemand: Array<{ subject: string; demand: number }>;
  aiDemand: Array<{ subject: string; demand: number }>;
}

export interface MarketplaceIntelligenceDto {
  bestSellers: Array<{ listingId: string; title: string; sales: number; revenue: number }>;
  seasonality: Array<{ month: string; salesMultiplier: number }>;
  pricingTrends: Array<{ subject: string; avgPrice: number; trend: "up" | "down" | "flat" }>;
  refundRisks: Array<{ listingId: string; title: string; refundRate: number; risk: "low" | "medium" | "high" }>;
  emergingSubjects: Array<{ subject: string; growthRate: number }>;
  underservedCategories: Array<{ category: string; demand: number; supply: number; gap: number }>;
  creatorQuality: Array<{ creatorId: string; avgRating: number; totalSales: number }>;
  buyerSatisfaction: number;
}

export interface OrganizationIntelligenceDto {
  organizationId: string;
  trends: {
    learningVelocity: Array<{ week: string; value: number }>;
    teacherGrowth: Array<{ week: string; value: number }>;
    resourceQuality: Array<{ week: string; value: number }>;
    aiAdoption: Array<{ week: string; value: number }>;
    curriculumCompletion: Array<{ week: string; value: number }>;
  };
  departmentComparison: Array<{ department: string; mastery: number; engagement: number }>;
  schoolComparison: Array<{ schoolId: string; name: string; mastery: number; engagement: number }>;
  districtComparison: Array<{ districtId: string; name: string; mastery: number; engagement: number }>;
}

// ---------------------------------------------------------------------------
// Platform Overview
// ---------------------------------------------------------------------------

export interface PlatformOverviewDto {
  status: "operational" | "degraded" | "down";
  overallHealth: number;
  totalFeedbackEvents: number;
  totalLearningSignals: number;
  totalExperiments: number;
  activeExperiments: number;
  totalInsights: number;
  unacknowledgedInsights: number;
  totalAuditEvents: number;
  totalOptimizations: number;
  totalForecasts: number;
  subsystems: Array<{ name: string; status: HealthStatus; score: number }>;
  generatedAt: string;
}
