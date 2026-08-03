/**
 * EduBek — Platform Orchestrator types.
 *
 * Phase 5D.4: Unified Intelligence Integration, Autonomous Orchestration
 * & Production Readiness. This module wires every existing subsystem into
 * a single cohesive Education Operating System through declarative
 * workflows, a unified AI pipeline, global context building, end-to-end
 * observability, autonomous self-healing, and a production-readiness
 * layer.
 *
 * No new domain capabilities are introduced — every type here describes
 * an *integration* surface that reuses services from earlier phases.
 */
import type { DomainEventType } from "@/infra/event-bus/events";

// ===========================================================================
// 1. Universal AI Context
// ===========================================================================

/** Aggregated context for any AI request — consumed by all agents. */
export interface AIContext {
  /** Request ID for tracing. */
  traceId: string;
  /** Auth snapshot (no secrets). */
  user: {
    id: string;
    email?: string;
    locale?: string;
    roles: string[];
    permissions: string[];
  } | null;
  organizationId: string | null;
  /** Optional scope hints callers can pass. */
  scope: {
    classroomId?: string;
    courseId?: string;
    assessmentId?: string;
    studentId?: string;
    teacherId?: string;
  };
  /** Aggregated subsystem snapshots. Each is a slim summary — never the full DB. */
  curriculum?: CurriculumSnapshot;
  knowledgeGraph?: KnowledgeGraphSnapshot;
  learningHistory?: LearningHistorySnapshot;
  digitalTwin?: DigitalTwinSnapshot;
  interestProfile?: InterestProfileSnapshot;
  mastery?: MasterySnapshot;
  recommendations?: RecommendationsSnapshot;
  planner?: PlannerSnapshot;
  marketplace?: MarketplaceSnapshot;
  civilizationMemory?: CivilizationMemorySnapshot;
  platformIntelligence?: PlatformIntelligenceSnapshot;
  research?: ResearchSnapshot;
  globalIntelligence?: GlobalIntelligenceSnapshot;
  /** Final, free-form hints added by the caller. */
  hints: Record<string, unknown>;
  /** When the context was assembled. */
  assembledAt: string;
}

export interface CurriculumSnapshot {
  conceptsCovered: number;
  frameworksAligned: string[];
  coveragePercent: number;
  pendingTopics: string[];
}

export interface KnowledgeGraphSnapshot {
  totalNodes: number;
  totalEdges: number;
  weakTopics: Array<{ topic: string; score: number }>;
  prerequisiteGaps: string[];
}

export interface LearningHistorySnapshot {
  recentSessions: number;
  averageScore: number;
  timeSpentMinutes: number;
  lastActive: string | null;
}

export interface DigitalTwinSnapshot {
  twinType: "student" | "teacher" | "classroom" | "institution" | null;
  twinId: string | null;
  stateSummary: Record<string, unknown>;
  predictions: Array<{ kind: string; value: number; confidence: number }>;
}

export interface InterestProfileSnapshot {
  topInterests: Array<{ tag: string; weight: number }>;
  preferredFormats: string[];
  preferredDifficulty: string;
}

export interface MasterySnapshot {
  overallMastery: number;
  masteredTopics: string[];
  developingTopics: string[];
  strugglingTopics: string[];
}

export interface RecommendationsSnapshot {
  personalized: Array<{ id: string; title: string; score: number; reason: string }>;
  nextSteps: Array<{ id: string; title: string; type: string }>;
}

export interface PlannerSnapshot {
  activeGoals: number;
  overdueTasks: number;
  streakDays: number;
  burnoutRisk: number;
  nextMilestone: { title: string; date: string } | null;
}

export interface MarketplaceSnapshot {
  relevantApps: number;
  installedApps: number;
  trendingTopics: string[];
}

export interface CivilizationMemorySnapshot {
  totalMemories: number;
  recentDecisions: number;
  activePolicies: number;
  strategicHorizon: string | null;
}

export interface PlatformIntelligenceSnapshot {
  healthStatus: "healthy" | "degraded" | "critical" | "unknown";
  activeExperiments: number;
  recentInsights: number;
  optimizationScore: number;
}

export interface ResearchSnapshot {
  activeProjects: number;
  recentPublications: number;
  pendingReviews: number;
}

export interface GlobalIntelligenceSnapshot {
  networkParticipation: number;
  foundationModelsAvailable: number;
  globalBenchmarks: number;
  collectiveInsights: number;
}

// ===========================================================================
// 2. Workflow Registry
// ===========================================================================

/** A declarative description of a cross-system workflow. */
export interface WorkflowDefinition {
  /** Stable unique id, e.g. "quiz.published". */
  id: string;
  /** Human label. */
  name: string;
  /** One-line description. */
  description: string;
  /** Triggering event type(s). */
  triggers: DomainEventType[];
  /** Ordered steps that should fire when the trigger fires. */
  steps: WorkflowStep[];
  /** Modules that participate. */
  participatingModules: string[];
  /** Whether the workflow is enabled. */
  enabled: boolean;
  /** Tags for filtering. */
  tags: string[];
  /** SLA in ms — used by observability. */
  slaMs?: number;
}

export interface WorkflowStep {
  /** Step position. */
  order: number;
  /** Module that owns this step. */
  module: string;
  /** Action label, e.g. "index_embeddings". */
  action: string;
  /** Whether this step is critical (failure stops the workflow). */
  critical: boolean;
  /** Retry policy override. */
  retry?: { attempts: number; backoffMs: number };
}

export interface WorkflowExecutionDto {
  id: string;
  workflowId: string;
  triggerEvent: string;
  triggerPayload: Record<string, unknown>;
  status: "running" | "completed" | "failed" | "partial";
  steps: Array<{
    order: number;
    module: string;
    action: string;
    status: "pending" | "running" | "completed" | "failed" | "skipped";
    startedAt: string | null;
    finishedAt: string | null;
    durationMs: number | null;
    error: string | null;
  }>;
  traceId: string;
  startedAt: string;
  finishedAt: string | null;
  totalDurationMs: number | null;
}

// ===========================================================================
// 3. Dependency Graph
// ===========================================================================

export type DependencyNodeKind =
  | "api"
  | "service"
  | "repository"
  | "event"
  | "agent"
  | "workflow"
  | "extension"
  | "knowledge_node"
  | "cloud_job"
  | "cron_job"
  | "webhook"
  | "feature";

export interface DependencyNode {
  id: string;
  kind: DependencyNodeKind;
  label: string;
  module: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface DependencyEdge {
  from: string;
  to: string;
  /** How the source depends on the target. */
  relationship: "calls" | "publishes" | "consumes" | "triggers" | "extends" | "depends_on" | "indexes" | "notifies";
  weight: number;
}

export interface DependencyGraphDto {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  /** Total nodes for quick health checks. */
  totalNodes: number;
  totalEdges: number;
  /** When the graph was last rebuilt. */
  builtAt: string;
}

export interface ImpactAnalysisDto {
  /** Node that changed. */
  sourceId: string;
  /** Direct dependents (downstream). */
  directDependents: DependencyNode[];
  /** Transitive dependents (BFS expansion). */
  transitiveDependents: DependencyNode[];
  /** Estimated blast radius (count of affected nodes). */
  blastRadius: number;
  /** Critical path — nodes whose failure would block this change. */
  criticalPath: DependencyNode[];
  /** Recommended checks before deploying. */
  recommendedChecks: string[];
}

// ===========================================================================
// 4. Prompt Registry
// ===========================================================================

export interface PromptDefinition {
  /** Stable id, e.g. "lesson.generator". */
  id: string;
  /** Display name. */
  name: string;
  /** Purpose / use case. */
  description: string;
  /** Module that owns this prompt. */
  module: string;
  /** Current version. */
  version: number;
  /** Semantic version tag. */
  versionTag: string;
  /** The template body — mustache-style {{var}} placeholders. */
  template: string;
  /** Variables expected by the template. */
  variables: Array<{ name: string; required: boolean; description: string }>;
  /** Default provider override (optional). */
  providerOverride?: string;
  /** Default model override (optional). */
  modelOverride?: string;
  /** Localization keys per locale. */
  localizations: Array<{ locale: string; templateKey: string }>;
  /** Whether the prompt is active. */
  active: boolean;
  /** Experiment assignment (optional). */
  experimentId?: string;
  /** Evaluation scores aggregated over recent runs. */
  evaluation?: {
    sampleSize: number;
    averageScore: number;
    confidence: number;
  };
  /** Audit metadata. */
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface PromptVersionDto {
  promptId: string;
  version: number;
  versionTag: string;
  template: string;
  createdAt: string;
  createdBy: string | null;
  notes: string | null;
}

// ===========================================================================
// 5. Reasoning Pipeline
// ===========================================================================

export interface ReasoningMetadata {
  /** Confidence score 0..1. */
  confidence: number;
  /** Chain-of-thought explanation. */
  reasoning: string;
  /** Evidence cited in the response. */
  evidence: Array<{ source: string; snippet: string; relevance: number }>;
  /** Knowledge-graph or document sources. */
  sources: Array<{ type: string; id: string; title: string; url?: string }>;
  /** Modules that contributed to the response. */
  affectedModules: string[];
  /** Estimated cost in USD. */
  cost: number;
  /** Latency in ms. */
  latencyMs: number;
  /** AI provider used. */
  provider: string;
  /** Model used. */
  model: string;
  /** Tokens consumed (input, output). */
  tokens: { input: number; output: number };
  /** Memory items retrieved and used. */
  memoryUsed: Array<{ kind: string; id: string; relevance: number }>;
  /** Recommendations surfaced as a side effect. */
  recommendations: Array<{ id: string; reason: string; score: number }>;
  /** Follow-up actions suggested. */
  followUpActions: Array<{ action: string; rationale: string; priority: number }>;
  /** Trace ID linking to observability. */
  traceId: string;
}

export interface AIInvocationDto {
  id: string;
  traceId: string;
  promptId: string | null;
  promptVersion: number | null;
  provider: string;
  model: string;
  input: { prompt: string; contextSnapshot: AIContext };
  output: { response: string; reasoning: ReasoningMetadata };
  status: "succeeded" | "failed" | "partial";
  createdAt: string;
}

// ===========================================================================
// 6. Observability (distributed tracing)
// ===========================================================================

export type SpanStatus = "ok" | "error" | "timeout" | "skipped";

export interface TraceSpan {
  /** Span id (uuid or counter). */
  spanId: string;
  /** Parent span id (null = root). */
  parentSpanId: string | null;
  /** Trace id (shared across the whole request). */
  traceId: string;
  /** Module that produced the span. */
  module: string;
  /** Operation name. */
  operation: string;
  /** Span status. */
  status: SpanStatus;
  /** Start time (ISO). */
  startedAt: string;
  /** End time (ISO). */
  finishedAt: string | null;
  /** Duration in ms. */
  durationMs: number | null;
  /** Arbitrary metadata. */
  attributes: Record<string, unknown>;
  /** Logs (events within the span). */
  logs: Array<{ ts: string; level: "info" | "warn" | "error"; message: string }>;
}

export interface TraceDto {
  traceId: string;
  rootOperation: string;
  spans: TraceSpan[];
  totalDurationMs: number | null;
  status: SpanStatus;
  startedAt: string;
  finishedAt: string | null;
  /** Cross-module touchpoints. */
  modules: string[];
  /** Total spans. */
  spanCount: number;
  /** Whether any span failed. */
  hasErrors: boolean;
}

export interface ObservabilitySnapshotDto {
  activeTraces: number;
  recentTraces: TraceDto[];
  errorRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  /** Modules with the most errors in the last hour. */
  topErrorModules: Array<{ module: string; count: number }>;
  /** Modules with the slowest p95 latency. */
  slowestModules: Array<{ module: string; p95Ms: number }>;
  /** Throughput (events/sec) over the last minute. */
  throughput: number;
  /** When the snapshot was generated. */
  generatedAt: string;
}

// ===========================================================================
// 7. Self-Healing
// ===========================================================================

export type HealingActionKind =
  | "retry"
  | "reroute_provider"
  | "rebuild_index"
  | "refresh_cache"
  | "restart_workflow"
  | "recompute_recommendations"
  | "repair_graph_consistency"
  | "repair_read_model"
  | "repair_embeddings"
  | "repair_projection"
  | "circuit_breaker_trip"
  | "scale_workers";

export interface HealingAction {
  id: string;
  kind: HealingActionKind;
  module: string;
  trigger: { type: string; details: Record<string, unknown> };
  status: "proposed" | "approved" | "executing" | "succeeded" | "failed" | "skipped";
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  result: { success: boolean; message: string; details: Record<string, unknown> };
  /** Whether the action was automatically executed or required approval. */
  autoExecuted: boolean;
}

export interface SelfHealingReportDto {
  /** Issues currently detected. */
  detectedIssues: Array<{
    id: string;
    module: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    detectedAt: string;
    autoHealable: boolean;
  }>;
  /** Actions taken recently. */
  recentActions: HealingAction[];
  /** Health snapshot per module. */
  moduleHealth: Array<{ module: string; status: "healthy" | "degraded" | "critical"; lastCheck: string }>;
  /** Whether self-healing is enabled globally. */
  enabled: boolean;
  /** Total actions in the last 24h. */
  actionsLast24h: number;
  /** Success rate of healing actions (0..1). */
  successRate: number;
}

// ===========================================================================
// 8. Production Readiness
// ===========================================================================

export interface FeatureFlagDto {
  key: string;
  description: string;
  enabled: boolean;
  /** Rollout percentage 0..100. */
  rollout: number;
  /** Cohort filter (optional). */
  cohorts: string[];
  /** When the flag was last updated. */
  updatedAt: string;
}

export interface CircuitBreakerDto {
  name: string;
  module: string;
  state: "closed" | "open" | "half_open";
  failureCount: number;
  failureThreshold: number;
  lastFailureAt: string | null;
  resetAt: string | null;
  successCount: number;
}

export interface RateLimitDto {
  key: string;
  module: string;
  limit: number;
  windowMs: number;
  current: number;
  remaining: number;
  resetAt: string;
}

export interface IdempotencyRecordDto {
  key: string;
  status: "pending" | "completed" | "failed";
  responseHash: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface ProductionReadinessDto {
  featureFlags: FeatureFlagDto[];
  circuitBreakers: CircuitBreakerDto[];
  rateLimits: RateLimitDto[];
  idempotencyKeys: number;
  /** Background retry queue depth. */
  retryQueueDepth: number;
  /** Distributed locks currently held. */
  activeLocks: number;
  /** Health probes per subsystem. */
  healthProbes: Array<{ subsystem: string; healthy: boolean; latencyMs: number; lastCheck: string }>;
  /** Chaos testing hooks available. */
  chaosHooks: Array<{ name: string; description: string; enabled: boolean }>;
}

// ===========================================================================
// 9. Documentation Generator
// ===========================================================================

export interface DocSectionDto {
  /** Section id (used for deep links). */
  id: string;
  /** Section title. */
  title: string;
  /** Section kind (controls rendering). */
  kind: "architecture" | "api" | "workflow" | "event" | "knowledge_graph" | "dependency" | "prompt" | "agent" | "extension" | "database" | "integration" | "localization" | "coverage";
  /** Markdown content. */
  content: string;
  /** Optional diagram (Mermaid / ASCII). */
  diagram?: string;
  /** Optional metadata. */
  metadata?: Record<string, unknown>;
}

export interface DocumentationReportDto {
  generatedAt: string;
  totalSections: number;
  sections: DocSectionDto[];
  /** Coverage metrics. */
  coverage: {
    apiRoutes: number;
    documentedApiRoutes: number;
    events: number;
    documentedEvents: number;
    prompts: number;
    documentedPrompts: number;
    agents: number;
    documentedAgents: number;
  };
  /** Localization report. */
  localization: {
    locales: string[];
    totalKeys: number;
    missingKeys: Record<string, number>;
  };
}

// ===========================================================================
// 10. Unified Admin Dashboard
// ===========================================================================

export interface AdminDashboardDto {
  generatedAt: string;
  overallStatus: "operational" | "degraded" | "partial_outage" | "major_outage";
  subsystems: Array<{
    name: string;
    status: "healthy" | "degraded" | "critical" | "unknown";
    healthScore: number;
    metrics: Record<string, number | string>;
    lastIncident: string | null;
  }>;
  alerts: Array<{
    id: string;
    severity: "info" | "warning" | "error" | "critical";
    title: string;
    description: string;
    module: string;
    createdAt: string;
    acknowledged: boolean;
  }>;
  costs: {
    today: number;
    monthToDate: number;
    forecast: number;
    currency: string;
    breakdown: Array<{ category: string; amount: number; percent: number }>;
  };
  workers: {
    active: number;
    idle: number;
    failed: number;
    queues: Array<{ name: string; depth: number; processing: number; throughputPerMin: number }>;
  };
  usage: {
    activeUsers: number;
    requestsPerMin: number;
    aiCallsToday: number;
    storageUsedGb: number;
  };
  /** Top-level KPIs for the platform. */
  kpis: Array<{ name: string; value: number; unit: string; trend: number; target: number | null }>;
}

// ===========================================================================
// 11. Orchestrator Status (lightweight summary)
// ===========================================================================

export interface OrchestratorStatusDto {
  version: string;
  uptimeSeconds: number;
  eventBus: { subscribers: number; eventsToday: number };
  workflows: { total: number; active: number; failed24h: number };
  aiPipeline: { invocationsToday: number; averageLatencyMs: number; successRate: number };
  selfHealing: { enabled: boolean; actions24h: number; successRate: number };
  dependencyGraph: { nodes: number; edges: number };
  prompts: { total: number; active: number };
  traces: { active: number; errorRate: number };
  generatedAt: string;
}
