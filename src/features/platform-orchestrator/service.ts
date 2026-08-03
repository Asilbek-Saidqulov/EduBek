/**
 * EduBek — Platform Orchestrator main service.
 *
 * Phase 5D.4: Composes every orchestrator subsystem into a unified API
 * surface. Routes are thin wrappers around the functions exported here.
 *
 * The service is intentionally a thin composition layer — every piece
 * of business logic lives in the dedicated subsystem file
 * (context-builder, workflow-registry, dependency-graph, etc.).
 */
import { getLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import { buildAIContext, type BuildContextInput } from "./context-builder";
import {
  listWorkflows, getWorkflow, findWorkflowsForEvent,
  setWorkflowEnabled, workflowStats, registerWorkflow,
  validateWorkflow,
} from "./workflow-registry";
import {
  getDependencyGraph, rebuildDependencyGraph, analyzeImpact,
  findNode, listNodesByKind, findPath, getGraphStats,
} from "./dependency-graph";
import {
  listPrompts, getPrompt, getPromptVersion, listPromptVersions,
  createPromptVersion, rollbackPrompt, setPromptActive,
  assignExperiment, recordPromptEvaluation, renderPromptTemplate,
  resolvePrompt, promptRegistryStats, type CreatePromptInput,
} from "./prompt-registry";
import {
  startEventOrchestrator, stopEventOrchestrator, registerActionHandler,
  listActionHandlers, executeWorkflow, listExecutions, getExecution,
} from "./event-orchestrator";
import { invokeAI, aiWorkspaceStats, estimateCost } from "./ai-workspace";
import { recordAIInvocation, listAIInvocations } from "./reasoning";
import {
  startSpan, finishSpan, addSpanLog, getTrace, listRecentTraces,
  getObservabilitySnapshot, withSpan, resolveTraceId,
} from "./observability";
import {
  runDetectionCycle, getSelfHealingReport, setSelfHealingEnabled,
  isSelfHealingEnabled, approveHealingAction, executeHealingAction,
} from "./self-healing";
import {
  isFeatureEnabled, setFeatureFlag, listFeatureFlags, getFeatureFlag,
  getCircuitBreakerState, recordCircuitBreakerSuccess, recordCircuitBreakerFailure,
  tripCircuitBreaker, withCircuitBreaker,
  checkRateLimit, listRateLimits,
  checkIdempotency, beginIdempotentOperation, completeIdempotentOperation,
  acquireLock, releaseLock, withLock,
  runHealthProbes, getChaosHooks, setChaosHookEnabled,
  getProductionReadiness,
} from "./production";
import { generateDocumentation } from "./documentation";
import { getAdminDashboard } from "./dashboard";
import type {
  AIContext, WorkflowDefinition, WorkflowExecutionDto,
  DependencyGraphDto, ImpactAnalysisDto, PromptDefinition, PromptVersionDto,
  ReasoningMetadata, AIInvocationDto, TraceDto, ObservabilitySnapshotDto,
  HealingAction, HealingActionKind, SelfHealingReportDto,
  FeatureFlagDto, CircuitBreakerDto, RateLimitDto, IdempotencyRecordDto,
  ProductionReadinessDto, DocumentationReportDto, AdminDashboardDto,
  OrchestratorStatusDto,
} from "./types";

const log = getLogger("platform-orchestrator");

// ===========================================================================
// Status
// ===========================================================================

const START_TIME = Date.now();
const VERSION = "5D.4.0";

export async function getStatus(): Promise<OrchestratorStatusDto> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since1h = new Date(Date.now() - 60 * 60 * 1000);
  const [workflowStatsResult, aiStats, healingReport, graphStats, promptStats, traceStats, workflowFailed24h, aiCount24h, aiLatency] = await Promise.all([
    Promise.resolve(workflowStats()),
    aiWorkspaceStats(),
    getSelfHealingReport(),
    Promise.resolve(getGraphStats()),
    promptRegistryStats(),
    db.orchestratorTraceSpan.count({ where: { finishedAt: null } }).catch(() => 0),
    db.orchestratorWorkflowExecution.count({ where: { status: "failed", startedAt: { gte: since24h } } }).catch(() => 0),
    db.orchestratorAIInvocation.count({ where: { createdAt: { gte: since24h } } }).catch(() => 0),
    db.orchestratorAIInvocation.aggregate({
      where: { createdAt: { gte: since1h } },
      _avg: { latencyMs: true },
    }).catch(() => ({ _avg: { latencyMs: 0 } })),
  ]);
  return {
    version: VERSION,
    uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
    eventBus: {
      subscribers: listActionHandlers().length,
      eventsToday: aiCount24h, // proxy
    },
    workflows: {
      total: workflowStatsResult.total,
      active: workflowStatsResult.enabled,
      failed24h: workflowFailed24h,
    },
    aiPipeline: {
      invocationsToday: aiStats.invocationsToday,
      averageLatencyMs: aiLatency._avg?.latencyMs ?? 0,
      successRate: aiStats.successRate,
    },
    selfHealing: {
      enabled: healingReport.enabled,
      actions24h: healingReport.actionsLast24h,
      successRate: healingReport.successRate,
    },
    dependencyGraph: {
      nodes: graphStats.totalNodes,
      edges: graphStats.totalEdges,
    },
    prompts: { total: promptStats.total, active: promptStats.active },
    traces: { active: traceStats, errorRate: 0 },
    generatedAt: new Date().toISOString(),
  };
}

// ===========================================================================
// Re-exports — keep the service as the single import surface for routes
// ===========================================================================

export {
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
};

// Type re-exports
export type {
  AIContext, WorkflowExecutionDto, DependencyGraphDto, ImpactAnalysisDto,
  PromptDefinition, PromptVersionDto, ReasoningMetadata, AIInvocationDto,
  TraceDto, ObservabilitySnapshotDto, HealingAction, HealingActionKind,
  SelfHealingReportDto, FeatureFlagDto, CircuitBreakerDto, RateLimitDto,
  IdempotencyRecordDto, ProductionReadinessDto, DocumentationReportDto,
  AdminDashboardDto, OrchestratorStatusDto,
};

export type { WorkflowDefinition } from "./types";
export type { BuildContextInput } from "./context-builder";
export type { CreatePromptInput } from "./prompt-registry";

// ===========================================================================
// Initialization
// ===========================================================================

let initialized = false;

export function initializeOrchestrator(): void {
  if (initialized) return;
  initialized = true;
  startEventOrchestrator();
  log.info("platform_orchestrator.initialized", { version: VERSION });
}

// Auto-initialize on first import in non-test environments
if (process.env.NODE_ENV !== "test" && typeof window === "undefined") {
  // Defer to next tick to avoid blocking module load
  setImmediate(() => {
    try { initializeOrchestrator(); } catch (err) {
      log.warn("orchestrator.init_failed", { error: (err as Error).message });
    }
  });
}
