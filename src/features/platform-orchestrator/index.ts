/**
 * EduBek — Platform Orchestrator barrel export.
 *
 * Phase 5D.4: Unified Intelligence Integration, Autonomous Orchestration
 * & Production Readiness.
 *
 * This module wires every existing subsystem into a single cohesive
 * Education Operating System through:
 *   • Universal Event Integration (event-orchestrator)
 *   • Universal AI Workspace (ai-workspace + context-builder + prompt-registry + reasoning)
 *   • Global Context Builder (context-builder)
 *   • Cross-System Workflow Registry (workflow-registry)
 *   • Universal Dependency Graph (dependency-graph)
 *   • AI Prompt Registry (prompt-registry)
 *   • Universal Reasoning Pipeline (reasoning)
 *   • End-to-End Observability (observability)
 *   • Autonomous Self-Healing (self-healing)
 *   • Production Readiness (production)
 *   • Unified Admin Console API (dashboard)
 *   • Universal Documentation Generator (documentation)
 *
 * No new domain capabilities — every line here is an integration surface
 * that reuses services from earlier phases.
 */

// Service (single import surface for routes)
export {
  getStatus,
  initializeOrchestrator,
  buildAIContext,
  listWorkflows, getWorkflow, findWorkflowsForEvent,
  setWorkflowEnabled, workflowStats, registerWorkflow, validateWorkflow,
  getDependencyGraph, rebuildDependencyGraph, analyzeImpact,
  findNode, listNodesByKind, findPath, getGraphStats,
  listPrompts, getPrompt, getPromptVersion, listPromptVersions,
  createPromptVersion, rollbackPrompt, setPromptActive,
  assignExperiment, recordPromptEvaluation, renderPromptTemplate,
  resolvePrompt, promptRegistryStats,
  startEventOrchestrator, stopEventOrchestrator, registerActionHandler,
  listActionHandlers, executeWorkflow, listExecutions, getExecution,
  invokeAI, aiWorkspaceStats, estimateCost,
  recordAIInvocation, listAIInvocations,
  startSpan, finishSpan, addSpanLog, getTrace, listRecentTraces,
  getObservabilitySnapshot, withSpan, resolveTraceId,
  runDetectionCycle, getSelfHealingReport, setSelfHealingEnabled,
  isSelfHealingEnabled, approveHealingAction, executeHealingAction,
  isFeatureEnabled, setFeatureFlag, listFeatureFlags, getFeatureFlag,
  getCircuitBreakerState, recordCircuitBreakerSuccess, recordCircuitBreakerFailure,
  tripCircuitBreaker, withCircuitBreaker,
  checkRateLimit, listRateLimits,
  checkIdempotency, beginIdempotentOperation, completeIdempotentOperation,
  acquireLock, releaseLock, withLock,
  runHealthProbes, getChaosHooks, setChaosHookEnabled, getProductionReadiness,
  generateDocumentation, getAdminDashboard,
} from "./service";

// Types
export type {
  AIContext, CurriculumSnapshot, KnowledgeGraphSnapshot,
  LearningHistorySnapshot, DigitalTwinSnapshot, InterestProfileSnapshot,
  MasterySnapshot, RecommendationsSnapshot, PlannerSnapshot,
  MarketplaceSnapshot, CivilizationMemorySnapshot, PlatformIntelligenceSnapshot,
  ResearchSnapshot, GlobalIntelligenceSnapshot,
  WorkflowDefinition, WorkflowStep, WorkflowExecutionDto,
  DependencyNode, DependencyEdge, DependencyNodeKind, DependencyGraphDto, ImpactAnalysisDto,
  PromptDefinition, PromptVersionDto,
  ReasoningMetadata, AIInvocationDto,
  TraceSpan, TraceDto, SpanStatus, ObservabilitySnapshotDto,
  HealingAction, HealingActionKind, SelfHealingReportDto,
  FeatureFlagDto, CircuitBreakerDto, RateLimitDto, IdempotencyRecordDto, ProductionReadinessDto,
  DocSectionDto, DocumentationReportDto,
  AdminDashboardDto, OrchestratorStatusDto,
} from "./types";

// Subsystem exports (advanced use)
export { BUILTIN_WORKFLOWS } from "./workflow-registry";
export { BUILTIN_PROMPTS } from "./prompt-registry";
export { CHAOS_HOOKS } from "./production";
