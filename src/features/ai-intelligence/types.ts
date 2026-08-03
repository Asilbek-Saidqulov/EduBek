/**
 * EduBek — AI Intelligence, Recommendation & Personalization Platform types.
 * Phase 6G.26: Single source of truth for AI-driven personalization and recommendation orchestration.
 * Owns ONLY: recommendation metadata, personalization profiles, feature vectors, inference orchestration,
 * prompt templates, model registry, evaluation metadata, experiment metadata, AI policies.
 * Never owns content generation, quizzes, users, organizations, search, analytics, commerce, gameplay, notifications.
 * All recommendations are advisory. Business platforms decide whether to use them.
 * Boundary with 6G.18 (AI Services): 6G.18 owns AI infrastructure/provider abstraction;
 * 6G.26 uses those services to produce recommendations, personalization, ranking, experiments, governance.
 */

// System 1 — AI Model Registry
export type ModelType = "llm" | "embedding" | "reranker" | "classifier" | "regression" | "custom";
export type ModelStatus = "registered" | "active" | "deprecated" | "retired";
export interface AIModel {
  id: string; key: string; name: string; type: ModelType;
  provider: string; version: string; status: ModelStatus;
  capabilities: string[]; contextWindow: number | null;
  registeredAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 2 — Prompt Registry
export type PromptStatus = "draft" | "active" | "deprecated";
export interface PromptTemplate {
  id: string; key: string; name: string;
  template: string; variables: string[];
  status: PromptStatus; version: number;
  modelKey: string | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 3 — Embedding Registry (metadata only)
export interface EmbeddingModelMeta {
  id: string; key: string; name: string; provider: string;
  dimensions: number; maxTokens: number;
  active: boolean; createdAt: string;
  metadata: Record<string, unknown>;
}

// System 4 — Feature Store Metadata
export type FeatureDataType = "numeric" | "categorical" | "text" | "embedding" | "temporal";
export interface FeatureDefinition {
  id: string; key: string; name: string; dataType: FeatureDataType;
  description: string; source: string;
  active: boolean; createdAt: string; updatedAt: string;
}
export interface FeatureVector {
  id: string; entityId: string; entityType: string;
  features: Record<string, unknown>;
  version: number; computedAt: string;
}

// System 5 — Recommendation Engine
export type RecommendationStatus = "generated" | "served" | "clicked" | "dismissed" | "expired";
export interface Recommendation {
  id: string; userId: string;
  entityType: string; entityId: string;
  score: number; reason: string;
  strategy: string; status: RecommendationStatus;
  generatedAt: string; servedAt: string | null;
  clickedAt: string | null; dismissedAt: string | null;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// System 6 — Personalization Engine
export type PersonalizationStatus = "active" | "opted_out" | "paused";
export interface PersonalizationProfile {
  id: string; userId: string;
  status: PersonalizationStatus;
  preferences: Record<string, unknown>;
  interests: string[]; difficulty: string | null;
  learningStyle: string | null;
  updatedAt: string; createdAt: string;
}

// System 7 — Ranking Profiles
export type RankingStrategy = "relevance" | "popularity" | "freshness" | "personalized" | "hybrid";
export interface RankingProfile {
  id: string; key: string; name: string;
  strategy: RankingStrategy;
  weights: Record<string, number>;
  active: boolean; version: number;
  createdAt: string; updatedAt: string;
}

// System 8 — Context Builder
export interface AIContext {
  id: string; userId: string;
  contextType: string;
  features: Record<string, unknown>;
  recommendations: string[];
  promptVariables: Record<string, unknown>;
  builtAt: string; expiresAt: string | null;
}

// System 9 — AI Experiment Platform
export type ExperimentStatus = "draft" | "running" | "completed" | "cancelled" | "failed";
export interface Experiment {
  id: string; key: string; name: string;
  hypothesis: string; modelKeys: string[];
  status: ExperimentStatus;
  startedAt: string | null; endedAt: string | null;
  metrics: Record<string, number>;
  correlationId: string;
  createdAt: string; updatedAt: string;
}

// System 10 — Model Evaluation
export type EvalStatus = "pending" | "running" | "completed" | "failed";
export interface EvaluationResult {
  id: string; modelKey: string; datasetRef: string;
  status: EvalStatus;
  metrics: Record<string, number>;
  startedAt: string; completedAt: string | null;
  notes: string | null;
  correlationId: string;
}

// System 11 — Prompt Versioning
export interface PromptVersion {
  id: string; promptId: string;
  version: number; template: string;
  changeLog: string; publishedBy: string;
  publishedAt: string; active: boolean;
}

// System 12 — Inference Routing
export type InferenceStatus = "pending" | "running" | "completed" | "failed" | "timeout";
export interface InferenceRequest {
  id: string; modelKey: string;
  promptKey: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: InferenceStatus;
  latencyMs: number | null; costEstimate: number | null;
  requestedAt: string; completedAt: string | null;
  error: string | null; correlationId: string;
  metadata: Record<string, unknown>;
}

// System 13 — AI Policy Engine
export type PolicyEnforcement = "allow" | "deny" | "review" | "log";
export interface AIPolicy {
  id: string; key: string; name: string;
  enforcement: PolicyEnforcement;
  conditions: Record<string, unknown>;
  active: boolean;
  createdAt: string; updatedAt: string;
}

// System 14 — Safety Guardrails
export type GuardrailSeverity = "low" | "medium" | "high" | "critical";
export type GuardrailAction = "warn" | "block" | "flag" | "log";
export interface GuardrailRule {
  id: string; key: string; name: string;
  severity: GuardrailSeverity; action: GuardrailAction;
  pattern: string; active: boolean;
  createdAt: string; updatedAt: string;
}
export interface GuardrailTrigger {
  id: string; ruleId: string;
  inferenceId: string | null;
  content: string; matchedPattern: string;
  action: GuardrailAction; triggeredAt: string;
  correlationId: string;
}

// System 15 — Human Review Queue
export type ReviewStatus = "pending" | "approved" | "rejected" | "escalated";
export interface ReviewItem {
  id: string; inferenceId: string | null;
  type: string; content: string;
  status: ReviewStatus;
  reviewerId: string | null; reviewedAt: string | null;
  reason: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// System 16 — Feedback Registry
export type FeedbackType = "thumbs_up" | "thumbs_down" | "rating" | "text" | "correction";
export interface AIFeedback {
  id: string; userId: string;
  inferenceId: string | null; recommendationId: string | null;
  type: FeedbackType; value: unknown;
  comment: string | null;
  createdAt: string; correlationId: string;
}

// System 17 — AI Analytics
export interface AIAnalytics {
  inferences: { total: number; completed: number; failed: number; avgLatencyMs: number };
  recommendations: { total: number; served: number; clicked: number; clickRate: number };
  experiments: { total: number; running: number; completed: number };
  guardrails: { totalTriggers: number; blocked: number; flagged: number };
  models: { total: number; active: number };
  updatedAt: string;
}

// System 18 — AI Cost Tracking
export interface CostRecord {
  id: string; modelKey: string;
  inferenceId: string | null;
  inputTokens: number; outputTokens: number;
  costUsd: number; currency: string;
  recordedAt: string; correlationId: string;
}
export interface CostSummary {
  totalCostUsd: number; byModel: Record<string, number>;
  totalInferences: number; avgCostPerInference: number;
  period: string;
}

// System 19 — AI Governance
export type GovernanceStatus = "pending" | "approved" | "rejected" | "review";
export interface AIGovernanceRecord {
  id: string; modelKey: string;
  purpose: string; riskLevel: "low" | "medium" | "high" | "critical";
  status: GovernanceStatus;
  approvedBy: string | null; approvedAt: string | null;
  complianceTags: string[];
  createdAt: string; updatedAt: string;
}

// System 20 — AI Dashboard
export interface AIDashboard {
  models: { total: number; active: number; deprecated: number };
  inferences: { total24h: number; avgLatencyMs: number; failureRate: number };
  recommendations: { total24h: number; clickRate: number };
  experiments: { running: number; completed24h: number };
  guardrails: { triggers24h: number; blocked24h: number };
  cost: { total24h: number; currency: string };
  governance: { pending: number; approved: number };
  updatedAt: string;
}

// System 21 — Event Bus Bridge
export type AIIntelligenceEventType =
  | "RecommendationGenerated" | "PersonalizationUpdated"
  | "PromptPublished" | "ModelRegistered"
  | "InferenceCompleted" | "InferenceFailed"
  | "ModelEvaluationCompleted" | "ExperimentCompleted"
  | "FeedbackRecorded" | "GuardrailTriggered";

// System 22 — Developer Integration
export interface AIDeveloperIntegration {
  publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean; scope: string }>;
  extensionHooks: Array<{ id: string; name: string; triggerEvent: AIIntelligenceEventType; description: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string; capabilities: string[] };
  webhooks: Array<{ id: string; event: AIIntelligenceEventType; description: string }>;
}

// System 23 — Administration API
export interface AIAdminStatus {
  operational: boolean; systems: number;
  bridgeSubscribed: boolean; updatedAt: string;
}

// System 24 — Documentation Generator
export interface AIDocumentation {
  version: string; generatedAt: string;
  systems: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }>;
  events: Array<{ type: AIIntelligenceEventType; payload: string[]; description: string }>;
  ownership: { owns: string[]; doesNotOwn: string[] };
}
