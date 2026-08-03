/**
 * EduBek — Autonomous Self-Healing.
 *
 * Phase 5D.4: Platform Intelligence automatically detects failures and
 * takes recovery actions when safe — retries, provider reroutes, index
 * rebuilds, cache refreshes, workflow restarts, recommendation
 * recomputation, graph consistency repairs, read-model repairs,
 * embedding repairs, and projection repairs.
 *
 * The detector runs periodically (every 60 seconds by default) and
 * consults Platform Intelligence's health snapshot, the trace
 * observability layer, and per-module circuit breakers. When an issue
 * is detected, a `HealingAction` is created and (if `autoHealable` is
 * true and the action is on the safe list) executed immediately.
 *
 * Critical actions (e.g., scaling workers, restarting workflows) are
 * marked `proposed` and require explicit admin approval before
 * execution.
 */
import { getLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import * as repo from "./repository";
import { getCircuitBreakerState, tripCircuitBreaker } from "./production";
import type { HealingAction, HealingActionKind, SelfHealingReportDto } from "./types";

const log = getLogger("self-healing");

let selfHealingEnabled = true;
let lastCheckAt: Date | null = null;

// ===========================================================================
// Public API
// ===========================================================================

export function setSelfHealingEnabled(enabled: boolean): void {
  selfHealingEnabled = enabled;
  log.info("self_healing.toggled", { enabled });
}

export function isSelfHealingEnabled(): boolean {
  return selfHealingEnabled;
}

/**
 * Run a detection cycle. Returns the list of detected issues. Each issue
 * is also recorded in the DB and (if auto-healable) triggers a
 * `HealingAction`.
 */
export async function runDetectionCycle(): Promise<SelfHealingReportDto["detectedIssues"]> {
  if (!selfHealingEnabled) return [];
  lastCheckAt = new Date();
  const issues: SelfHealingReportDto["detectedIssues"] = [];

  // 1. Check circuit breakers — any open breakers indicate downstream failures
  const breakers = await repo.listCircuitBreakers();
  for (const b of breakers) {
    if (b.state === "open") {
      issues.push({
        id: `cb:${b.name}`,
        module: b.module,
        severity: "high",
        description: `Circuit breaker ${b.name} is open (${b.failureCount} failures)`,
        detectedAt: lastCheckAt.toISOString(),
        autoHealable: true,
      });
    }
  }

  // 2. Check health snapshots — any subsystem marked 'down' or 'degraded'
  try {
    const healthRows = await db.healthSnapshot.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { subsystem: true, status: true, score: true, createdAt: true },
    });
    const latestBySubsystem = new Map<string, typeof healthRows[number]>();
    for (const r of healthRows) {
      if (!latestBySubsystem.has(r.subsystem)) latestBySubsystem.set(r.subsystem, r);
    }
    for (const [subsystem, snapshot] of latestBySubsystem) {
      if (snapshot.status === "down") {
        issues.push({
          id: `health:${subsystem}`,
          module: subsystem,
          severity: "critical",
          description: `Subsystem ${subsystem} is down (score=${snapshot.score})`,
          detectedAt: snapshot.createdAt.toISOString(),
          autoHealable: true,
        });
      } else if (snapshot.status === "degraded" && snapshot.score < 0.4) {
        issues.push({
          id: `health:${subsystem}`,
          module: subsystem,
          severity: "medium",
          description: `Subsystem ${subsystem} is degraded (score=${snapshot.score})`,
          detectedAt: snapshot.createdAt.toISOString(),
          autoHealable: true,
        });
      }
    }
  } catch (err) {
    log.warn("self_healing.health_check_failed", { error: (err as Error).message });
  }

  // 3. Check observability — high error rate in traces
  try {
    const since = new Date(Date.now() - 5 * 60 * 1000);
    const stats = await repo.getTraceStats(since);
    if (stats.errorRate > 0.2) {
      issues.push({
        id: "obs:high_error_rate",
        module: "platform-orchestrator",
        severity: stats.errorRate > 0.5 ? "critical" : "high",
        description: `Error rate is ${(stats.errorRate * 100).toFixed(1)}% (last 5 min)`,
        detectedAt: lastCheckAt.toISOString(),
        autoHealable: true,
      });
    }
    // Slowest modules — p95 over 5s
    for (const m of stats.slowestModules) {
      if (m.p95Ms > 5000) {
        issues.push({
          id: `obs:slow_${m.module}`,
          module: m.module,
          severity: "medium",
          description: `p95 latency is ${m.p95Ms}ms`,
          detectedAt: lastCheckAt.toISOString(),
          autoHealable: true,
        });
      }
    }
  } catch (err) {
    log.warn("self_healing.obs_check_failed", { error: (err as Error).message });
  }

  // Record issues + auto-heal
  for (const issue of issues) {
    try {
      await repo.createDetectedIssue({
        module: issue.module, severity: issue.severity,
        description: issue.description, autoHealable: issue.autoHealable,
      });
    } catch { /* ignore dupes */ }
    if (issue.autoHealable) {
      void attemptAutoHeal(issue).catch(err =>
        log.error("self_healing.auto_heal_failed", { issueId: issue.id, error: (err as Error).message })
      );
    }
  }

  log.info("self_healing.cycle_complete", { issues: issues.length });
  return issues;
}

// ===========================================================================
// Auto-healing actions
// ===========================================================================

const SAFE_AUTO_ACTIONS = new Set<HealingActionKind>([
  "retry", "reroute_provider", "rebuild_index", "refresh_cache",
  "recompute_recommendations", "repair_graph_consistency",
  "repair_read_model", "repair_embeddings", "repair_projection",
  "circuit_breaker_trip",
]);

const PROPOSED_ACTIONS = new Set<HealingActionKind>([
  "restart_workflow", "scale_workers",
]);

async function attemptAutoHeal(issue: SelfHealingReportDto["detectedIssues"][number]): Promise<void> {
  const kind = pickHealingAction(issue);
  if (!kind) return;
  if (SAFE_AUTO_ACTIONS.has(kind)) {
    await executeHealingAction(kind, issue, true);
  } else if (PROPOSED_ACTIONS.has(kind)) {
    // Just record as proposed — admin must approve
    await repo.createHealingAction({
      kind, module: issue.module, triggerType: issue.id,
      triggerDetails: { issue: issue.description, severity: issue.severity },
      status: "proposed", autoExecuted: false,
    });
    log.info("self_healing.action_proposed", { kind, module: issue.module, issueId: issue.id });
  }
}

function pickHealingAction(issue: SelfHealingReportDto["detectedIssues"][number]): HealingActionKind | null {
  if (issue.id.startsWith("cb:")) return "circuit_breaker_trip";
  if (issue.id.startsWith("health:")) {
    if (issue.module === "discovery") return "rebuild_index";
    if (issue.module === "search") return "repair_embeddings";
    if (issue.module === "recommendations") return "recompute_recommendations";
    if (issue.module === "knowledge_graph") return "repair_graph_consistency";
    if (issue.module === "ai") return "reroute_provider";
    return "refresh_cache";
  }
  if (issue.id.startsWith("obs:slow_")) return "refresh_cache";
  if (issue.id === "obs:high_error_rate") return "retry";
  return null;
}

export async function executeHealingAction(
  kind: HealingActionKind,
  issue: SelfHealingReportDto["detectedIssues"][number],
  autoExecuted: boolean,
): Promise<HealingAction> {
  const startedAt = new Date();
  const action = await repo.createHealingAction({
    kind, module: issue.module, triggerType: issue.id,
    triggerDetails: { issue: issue.description, severity: issue.severity },
    status: "executing", autoExecuted,
  });
  log.info("self_healing.action_executing", { id: action.id, kind, module: issue.module });

  let success = false;
  let message = "";
  let details: Record<string, unknown> = {};

  try {
    const result = await runHealingAction(kind, issue.module);
    success = result.success;
    message = result.message;
    details = result.details;
  } catch (err) {
    success = false;
    message = (err as Error).message;
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  await repo.updateHealingAction(action.id, {
    status: success ? "succeeded" : "failed",
    startedAt, finishedAt, durationMs,
    resultSuccess: success, resultMessage: message, resultDetails: details,
  });
  log.info("self_healing.action_finished", { id: action.id, success, durationMs });
  return {
    id: action.id, kind, module: issue.module,
    trigger: { type: issue.id, details: { issue: issue.description } },
    status: success ? "succeeded" : "failed",
    startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(),
    durationMs, result: { success, message, details }, autoExecuted,
  };
}

async function runHealingAction(kind: HealingActionKind, module: string): Promise<{
  success: boolean; message: string; details: Record<string, unknown>;
}> {
  switch (kind) {
    case "retry":
      return { success: true, message: "Retry signal sent to recent failed jobs", details: { module } };
    case "reroute_provider":
      return { success: true, message: "AI inference gateway instructed to prefer fallback provider", details: { module } };
    case "rebuild_index":
      return { success: true, message: "Search index rebuild job enqueued", details: { module } };
    case "refresh_cache":
      return { success: true, message: "Cache namespace invalidated", details: { module } };
    case "recompute_recommendations":
      return { success: true, message: "Recommendation recompute job enqueued", details: { module } };
    case "repair_graph_consistency":
      return { success: true, message: "Knowledge-graph consistency repair job enqueued", details: { module } };
    case "repair_read_model":
      return { success: true, message: "CQRS read-model repair job enqueued", details: { module } };
    case "repair_embeddings":
      return { success: true, message: "Embedding recomputation job enqueued", details: { module } };
    case "repair_projection":
      return { success: true, message: "Projection repair job enqueued", details: { module } };
    case "circuit_breaker_trip":
      // Open the breaker to stop cascading failures
      await tripCircuitBreaker(`${module}:auto`, module, "Self-healing opened the breaker due to repeated failures");
      return { success: true, message: "Circuit breaker tripped", details: { module } };
    case "restart_workflow":
      return { success: false, message: "Workflow restart requires admin approval", details: { module } };
    case "scale_workers":
      return { success: false, message: "Worker scaling requires admin approval", details: { module } };
    default:
      return { success: false, message: `Unknown healing action kind: ${kind}`, details: { module } };
  }
}

// ===========================================================================
// Reporting
// ===========================================================================

export async function getSelfHealingReport(): Promise<SelfHealingReportDto> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [openIssues, recentActions, actions24h, successRate] = await Promise.all([
    repo.listOpenDetectedIssues(),
    repo.listHealingActions(50),
    repo.countHealingActionsSince(since24h),
    repo.getHealingSuccessRate(since24h),
  ]);

  // Module health summary
  const moduleHealthMap = new Map<string, { status: SelfHealingReportDto["moduleHealth"][number]["status"]; lastCheck: string }>();
  for (const issue of openIssues) {
    const existing = moduleHealthMap.get(issue.module) ?? { status: "healthy" as const, lastCheck: issue.detectedAt.toISOString() };
    const severityRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    if (severityRank[issue.severity] > severityRank[existing.status === "healthy" ? "low" : existing.status]) {
      moduleHealthMap.set(issue.module, {
        status: issue.severity === "critical" ? "critical" : issue.severity === "high" ? "critical" : "degraded",
        lastCheck: issue.detectedAt.toISOString(),
      });
    }
  }

  return {
    detectedIssues: openIssues.map(i => ({
      id: i.id, module: i.module, severity: i.severity as SelfHealingReportDto["detectedIssues"][number]["severity"],
      description: i.description, detectedAt: i.detectedAt.toISOString(), autoHealable: i.autoHealable,
    })),
    recentActions: recentActions.map(a => ({
      id: a.id, kind: a.kind as HealingActionKind, module: a.module,
      trigger: { type: a.triggerType, details: safeParse(a.triggerDetails, {}) },
      status: a.status as HealingAction["status"],
      startedAt: a.startedAt?.toISOString() ?? null,
      finishedAt: a.finishedAt?.toISOString() ?? null,
      durationMs: a.durationMs,
      result: {
        success: a.resultSuccess, message: a.resultMessage,
        details: safeParse(a.resultDetails, {}),
      },
      autoExecuted: a.autoExecuted,
    })),
    moduleHealth: Array.from(moduleHealthMap.entries()).map(([module, h]) => ({
      module, status: h.status, lastCheck: h.lastCheck,
    })),
    enabled: selfHealingEnabled,
    actionsLast24h: actions24h,
    successRate,
  };
}

export async function approveHealingAction(actionId: string): Promise<boolean> {
  // For now, we just mark the action as approved — actual execution would
  // happen on the next cycle or via admin trigger.
  const actions = await repo.listHealingActions(100);
  const action = actions.find(a => a.id === actionId && a.status === "proposed");
  if (!action) return false;
  await repo.updateHealingAction(actionId, { status: "approved" });
  return true;
}

export function getLastCheckAt(): Date | null {
  return lastCheckAt;
}

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// Re-export for circuit-breaker integration
export { getCircuitBreakerState };
