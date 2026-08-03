/** Systems 9-18, 20-22: Compensation, Human Tasks, Variables, Conditions, Parallel, Triggers, Templates, Versioning, Monitoring, APIs, Dashboard, Docs. */
import { randomUUID } from "node:crypto";
import type {
  CompensationStep, CompensationStatus,
  HumanTask, HumanTaskStatus, HumanTaskPriority,
  WorkflowVariable,
  WorkflowCondition, ConditionType,
  ParallelExecution, ParallelStatus,
  EventTriggerRecord, ManualTrigger,
  WorkflowTemplate, WorkflowVersion,
  WorkflowMonitoring, WorkflowExecutionStatus,
  WorkflowDashboard, WorkflowEventType,
  WorkflowApiEndpoint, WorkflowDocumentation,
  WorkflowDeveloperIntegration,
  WorkflowExecution,
} from "./types";
import {
  storeCompensation, getCompensation, getAllCompensations,
  storeHumanTask, getHumanTask, getAllHumanTasks,
  storeParallel, getParallel, getAllParallels,
  storeEventTrigger, getEventTrigger, getAllEventTriggers,
  storeManualTrigger, getManualTrigger, getAllManualTriggers,
  storeTemplate, getTemplate, getAllTemplates,
  storeVersion, getVersion, getAllVersions, getVersionsForWorkflow,
  getAllExecutions, getAllApprovals, getAllSchedules, getAllTimers,
  getAllStepExecutions, getAllDefinitions,
} from "./repository";
import { publishWorkflowEvent } from "./event-bus-bridge";
import { startExecution } from "./core";

// ===== System 9 — Compensation Manager =====
export function createCompensation(input: {
  executionId: string; originalStepId: string;
  compensationAction: string; order?: number;
}): CompensationStep {
  const c: CompensationStep = {
    id: randomUUID(), executionId: input.executionId,
    originalStepId: input.originalStepId, compensationAction: input.compensationAction,
    status: "pending", startedAt: null, completedAt: null, error: null,
    order: input.order ?? 0, metadata: {},
  };
  storeCompensation(c);
  return c;
}
export function getCompensationById(id: string) { return getCompensation(id); }
export function listCompensations(status?: CompensationStatus) {
  const all = getAllCompensations();
  return status ? all.filter(c => c.status === status) : all;
}
export function startCompensation(id: string) {
  const c = getCompensation(id); if (!c) return null;
  if (c.status !== "pending") return null;
  c.status = "in_progress"; c.startedAt = new Date().toISOString();
  storeCompensation(c); return c;
}
export function completeCompensation(id: string) {
  const c = getCompensation(id); if (!c) return null;
  if (c.status !== "in_progress") return null;
  c.status = "completed"; c.completedAt = new Date().toISOString();
  storeCompensation(c); return c;
}
export function failCompensation(id: string, error: string) {
  const c = getCompensation(id); if (!c) return null;
  if (c.status !== "in_progress") return null;
  c.status = "failed"; c.error = error;
  storeCompensation(c); return c;
}
export function supportsAllCompensationStatuses() { return ["pending", "in_progress", "completed", "failed", "skipped"]; }

// ===== System 10 — Human Tasks =====
export function createHumanTask(input: {
  executionId: string; stepId: string;
  title: string; description?: string;
  assigneeId?: string | null; candidateGroupIds?: string[];
  priority?: HumanTaskPriority; expiresAt?: string | null;
}): HumanTask {
  const t: HumanTask = {
    id: randomUUID(), executionId: input.executionId, stepId: input.stepId,
    title: input.title, description: input.description ?? "",
    assigneeId: input.assigneeId ?? null, candidateGroupIds: input.candidateGroupIds ?? [],
    priority: input.priority ?? "normal", status: "pending",
    claimedAt: null, completedAt: null, expiresAt: input.expiresAt ?? null,
    result: null, createdAt: new Date().toISOString(), metadata: {},
  };
  storeHumanTask(t);
  return t;
}
export function getHumanTaskById(id: string) { return getHumanTask(id); }
export function listHumanTasks(status?: HumanTaskStatus, assigneeId?: string) {
  let all = getAllHumanTasks();
  if (status) all = all.filter(t => t.status === status);
  if (assigneeId) all = all.filter(t => t.assigneeId === assigneeId);
  return all;
}
export function claimHumanTask(id: string, assigneeId: string) {
  const t = getHumanTask(id); if (!t) return null;
  if (t.status !== "pending") return null;
  t.status = "claimed"; t.assigneeId = assigneeId; t.claimedAt = new Date().toISOString();
  storeHumanTask(t); return t;
}
export function completeHumanTask(id: string, result?: Record<string, unknown>) {
  const t = getHumanTask(id); if (!t) return null;
  if (t.status !== "claimed") return null;
  t.status = "completed"; t.completedAt = new Date().toISOString(); t.result = result ?? null;
  storeHumanTask(t); return t;
}
export function cancelHumanTask(id: string) {
  const t = getHumanTask(id); if (!t) return null;
  if (t.status === "completed" || t.status === "cancelled") return null;
  t.status = "cancelled"; storeHumanTask(t); return t;
}
export function expireHumanTask(id: string) {
  const t = getHumanTask(id); if (!t) return null;
  if (t.status !== "pending" && t.status !== "claimed") return null;
  t.status = "expired"; storeHumanTask(t); return t;
}
export function supportsAllHumanTaskStatuses() { return ["pending", "claimed", "completed", "cancelled", "expired"]; }
export function supportsAllHumanTaskPriorities() { return ["low", "normal", "high", "urgent"]; }

// ===== System 11 — Workflow Variables =====
export function createVariable(input: {
  key: string; type?: WorkflowVariable["type"];
  defaultValue?: unknown; required?: boolean;
  description?: string; isSecret?: boolean;
}): WorkflowVariable {
  return {
    key: input.key, type: input.type ?? "string",
    defaultValue: input.defaultValue ?? null,
    required: input.required ?? false,
    description: input.description ?? "",
    isSecret: input.isSecret ?? false,
  };
}
export function supportsAllVariableTypes() { return ["string", "number", "boolean", "object", "array", "reference"]; }

// ===== System 12 — Conditions =====
export function createCondition(input: {
  type: ConditionType; expression: string;
  branches?: Array<{ label: string; targetStepId: string }>;
  defaultStepId?: string | null;
}): WorkflowCondition {
  return {
    id: randomUUID(), type: input.type, expression: input.expression,
    branches: input.branches ?? [], defaultStepId: input.defaultStepId ?? null,
  };
}
export function supportsAllConditionTypes() { return ["if", "switch", "branch", "rule"]; }

// ===== System 13 — Parallel Execution =====
export function createParallelExecution(input: {
  executionId: string; forkStepId: string; joinStepId: string;
  branches: Array<{ branchId: string; executionId: string }>;
  joinStrategy?: "all" | "any" | "n_of_m"; requiredCount?: number;
}): ParallelExecution {
  const p: ParallelExecution = {
    id: randomUUID(), executionId: input.executionId,
    forkStepId: input.forkStepId, joinStepId: input.joinStepId,
    branches: input.branches.map(b => ({ ...b, status: "pending" as ParallelStatus })),
    status: "running", joinStrategy: input.joinStrategy ?? "all",
    joinCount: 0, requiredCount: input.requiredCount ?? input.branches.length,
    createdAt: new Date().toISOString(), completedAt: null, metadata: {},
  };
  storeParallel(p);
  return p;
}
export function getParallelById(id: string) { return getParallel(id); }
export function listParallels(status?: ParallelStatus) {
  const all = getAllParallels();
  return status ? all.filter(p => p.status === status) : all;
}
export function completeBranch(id: string, branchId: string, success: boolean) {
  const p = getParallel(id); if (!p) return null;
  const branch = p.branches.find(b => b.branchId === branchId);
  if (!branch) return null;
  branch.status = success ? "completed" : "failed";
  if (success) p.joinCount += 1;
  if (p.joinStrategy === "all" && p.branches.every(b => b.status === "completed")) {
    p.status = "completed"; p.completedAt = new Date().toISOString();
  } else if (p.joinStrategy === "any" && p.joinCount >= 1) {
    p.status = "completed"; p.completedAt = new Date().toISOString();
  } else if (p.joinStrategy === "n_of_m" && p.joinCount >= p.requiredCount) {
    p.status = "completed"; p.completedAt = new Date().toISOString();
  }
  storeParallel(p); return p;
}
export function supportsAllParallelStatuses() { return ["pending", "running", "completed", "failed", "cancelled"]; }

// ===== System 14 — Event Triggers =====
export function recordEventTrigger(input: {
  workflowId: string; triggerId: string;
  sourceEventId: string; sourceEventType: string;
  payload?: Record<string, unknown>;
}): EventTriggerRecord {
  const t: EventTriggerRecord = {
    id: randomUUID(), workflowId: input.workflowId, triggerId: input.triggerId,
    sourceEventId: input.sourceEventId, sourceEventType: input.sourceEventType,
    executionId: null, processed: false, processedAt: null,
    receivedAt: new Date().toISOString(), payload: input.payload ?? {},
  };
  storeEventTrigger(t);
  return t;
}
export function getEventTriggerById(id: string) { return getEventTrigger(id); }
export function listEventTriggers(processed?: boolean) {
  const all = getAllEventTriggers();
  return processed === undefined ? all : all.filter(t => t.processed === processed);
}
export function markEventTriggerProcessed(id: string, executionId: string) {
  const t = getEventTrigger(id); if (!t) return null;
  t.processed = true; t.processedAt = new Date().toISOString(); t.executionId = executionId;
  storeEventTrigger(t); return t;
}

// ===== System 15 — Manual Triggers =====
export function triggerWorkflowManually(input: {
  workflowId: string; triggeredBy: string;
  triggerSource: "dashboard" | "cli" | "api";
  payload?: Record<string, unknown>;
}): ManualTrigger {
  const exec = startExecution({
    workflowId: input.workflowId, triggeredBy: input.triggeredBy,
    triggerType: "manual", triggerPayload: input.payload ?? {},
  });
  const mt: ManualTrigger = {
    id: randomUUID(), workflowId: input.workflowId,
    triggeredBy: input.triggeredBy, triggerSource: input.triggerSource,
    payload: input.payload ?? {}, executionId: exec.id,
    triggeredAt: new Date().toISOString(),
  };
  storeManualTrigger(mt);
  return mt;
}
export function getManualTriggerById(id: string) { return getManualTrigger(id); }
export function listManualTriggers() { return getAllManualTriggers(); }

// ===== System 16 — Workflow Templates =====
export function createTemplate(input: {
  key: string; name: string; description?: string;
  category: import("./types").WorkflowCategory;
  steps?: any[]; variables?: any[]; triggers?: any[];
  tags?: string[];
}): WorkflowTemplate {
  const now = new Date().toISOString();
  const t: WorkflowTemplate = {
    id: randomUUID(), key: input.key, name: input.name,
    description: input.description ?? "", category: input.category,
    steps: input.steps ?? [], variables: input.variables ?? [],
    triggers: input.triggers ?? [], tags: input.tags ?? [],
    createdAt: now, updatedAt: now, metadata: {},
  };
  storeTemplate(t);
  return t;
}
export function getTemplateById(id: string) { return getTemplate(id); }
export function listTemplates(category?: import("./types").WorkflowCategory) {
  const all = getAllTemplates();
  return category ? all.filter(t => t.category === category) : all;
}

// ===== System 17 — Workflow Versioning =====
export function publishVersion(input: {
  workflowId: string; definition: Record<string, unknown>;
  changeLog: string; publishedBy: string;
  migrationScript?: string | null;
}): WorkflowVersion {
  const existing = getVersionsForWorkflow(input.workflowId);
  const versionNum = existing.length + 1;
  for (const v of existing) v.active = false;
  const v: WorkflowVersion = {
    id: randomUUID(), workflowId: input.workflowId,
    version: versionNum, definition: input.definition,
    changeLog: input.changeLog, publishedBy: input.publishedBy,
    publishedAt: new Date().toISOString(), active: true,
    migrationScript: input.migrationScript ?? null, metadata: {},
  };
  storeVersion(v);
  publishWorkflowEvent("WorkflowVersionPublished", input.publishedBy, { workflowId: input.workflowId, version: versionNum });
  return v;
}
export function getVersionById(id: string) { return getVersion(id); }
export function listVersions(workflowId?: string) {
  return workflowId ? getVersionsForWorkflow(workflowId) : getAllVersions();
}
export function getActiveVersion(workflowId: string) {
  return getVersionsForWorkflow(workflowId).find(v => v.active) ?? null;
}

// ===== System 18 — Monitoring =====
export function generateMonitoring(): WorkflowMonitoring {
  const execs = getAllExecutions();
  const byStatus: Record<WorkflowExecutionStatus, number> = {
    pending: 0, running: 0, paused: 0, completed: 0, failed: 0,
    cancelled: 0, timed_out: 0, awaiting_approval: 0,
    awaiting_human_task: 0, retrying: 0, compensating: 0,
  };
  let totalDuration = 0; let completedCount = 0;
  const durations: number[] = [];
  for (const e of execs) {
    byStatus[e.status] += 1;
    if (e.completedAt && e.startedAt) {
      const d = new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime();
      totalDuration += d; completedCount += 1; durations.push(d);
    }
  }
  durations.sort((a, b) => a - b);
  const pct = (p: number) => durations.length > 0 ? durations[Math.min(durations.length - 1, Math.floor(durations.length * p))] : 0;
  const failed = byStatus.failed + byStatus.timed_out;
  return {
    totalExecutions: execs.length, byStatus,
    avgDurationMs: completedCount > 0 ? totalDuration / completedCount : 0,
    p50DurationMs: pct(0.5), p95DurationMs: pct(0.95), p99DurationMs: pct(0.99),
    failureRate: execs.length > 0 ? failed / execs.length : 0,
    retryRate: execs.length > 0 ? execs.filter(e => e.retryCount > 0).length / execs.length : 0,
    avgRetryCount: execs.length > 0 ? execs.reduce((s, e) => s + e.retryCount, 0) / execs.length : 0,
    activeExecutions: byStatus.running + byStatus.retrying,
    waitingApprovals: getAllApprovals().filter(a => a.status === "pending").length,
    waitingHumanTasks: getAllHumanTasks().filter(t => t.status === "pending" || t.status === "claimed").length,
    timedOut24h: 0, cancelled24h: 0,
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 20 — Public APIs =====
export function getPublicApiEndpoints(): WorkflowApiEndpoint[] {
  return [
    { path: "/api/workflows", method: "GET", description: "List workflows", authRequired: true, scope: "read" },
    { path: "/api/workflows", method: "POST", description: "Create workflow", authRequired: true, scope: "admin" },
    { path: "/api/workflows/executions", method: "GET", description: "List executions", authRequired: true, scope: "read" },
    { path: "/api/workflows/executions", method: "POST", description: "Start execution", authRequired: true, scope: "admin" },
    { path: "/api/workflows/executions", method: "PUT", description: "Control execution (pause/resume/cancel)", authRequired: true, scope: "admin" },
    { path: "/api/workflows/approvals", method: "GET", description: "List approvals", authRequired: true, scope: "read" },
    { path: "/api/workflows/approvals", method: "PUT", description: "Decide approval", authRequired: true, scope: "approver" },
    { path: "/api/workflows/schedules", method: "GET", description: "List schedules", authRequired: true, scope: "read" },
    { path: "/api/workflows/schedules", method: "POST", description: "Create schedule", authRequired: true, scope: "admin" },
    { path: "/api/workflows/timers", method: "GET", description: "List timers", authRequired: true, scope: "read" },
    { path: "/api/workflows/timers", method: "POST", description: "Schedule timer", authRequired: true, scope: "system" },
    { path: "/api/workflows/retries", method: "GET", description: "List retries", authRequired: true, scope: "read" },
    { path: "/api/workflows/human-tasks", method: "GET", description: "List human tasks", authRequired: true, scope: "read" },
    { path: "/api/workflows/human-tasks", method: "PUT", description: "Claim/complete human task", authRequired: true, scope: "user" },
    { path: "/api/workflows/templates", method: "GET", description: "List templates", authRequired: false, scope: "read" },
    { path: "/api/workflows/templates", method: "POST", description: "Create template", authRequired: true, scope: "admin" },
    { path: "/api/workflows/versions", method: "GET", description: "List versions", authRequired: true, scope: "read" },
    { path: "/api/workflows/versions", method: "POST", description: "Publish version", authRequired: true, scope: "admin" },
    { path: "/api/workflows/monitoring", method: "GET", description: "Monitoring metrics", authRequired: true, scope: "admin" },
    { path: "/api/workflows/dashboard", method: "GET", description: "Dashboard", authRequired: true, scope: "admin" },
    { path: "/api/workflows/developer", method: "GET", description: "Developer integration", authRequired: false, scope: "read" },
    { path: "/api/workflows/status", method: "GET", description: "Platform status", authRequired: false, scope: "read" },
  ];
}

// ===== System 21 — Dashboard =====
export function generateDashboard(): WorkflowDashboard {
  const execs = getAllExecutions();
  const approvals = getAllApprovals();
  const schedules = getAllSchedules();
  const timers = getAllTimers();
  const tasks = getAllHumanTasks();
  const day = 24 * 3600 * 1000;
  const now = Date.now();
  const recentExecs = execs.sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 10);
  const completed = execs.filter(e => e.status === "completed");
  const avgDuration = completed.length > 0
    ? completed.reduce((s, e) => s + (e.completedAt ? new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime() : 0), 0) / completed.length
    : 0;
  return {
    executions: {
      total: execs.length,
      running: execs.filter(e => e.status === "running" || e.status === "retrying").length,
      completed: execs.filter(e => e.status === "completed").length,
      failed: execs.filter(e => e.status === "failed" || e.status === "timed_out").length,
      awaiting: execs.filter(e => e.status === "awaiting_approval" || e.status === "awaiting_human_task").length,
    },
    recentExecutions: recentExecs.map(e => ({
      id: e.id, workflowName: e.workflowId, status: e.status,
      startedAt: e.startedAt,
      durationMs: e.completedAt ? new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime() : null,
    })),
    failures: {
      total24h: execs.filter(e => e.failedAt && now - new Date(e.failedAt).getTime() < day).length,
      topErrors: [],
    },
    approvals: {
      pending: approvals.filter(a => a.status === "pending").length,
      approved24h: approvals.filter(a => a.status === "approved" && a.decidedAt && now - new Date(a.decidedAt).getTime() < day).length,
      rejected24h: approvals.filter(a => a.status === "rejected" && a.decidedAt && now - new Date(a.decidedAt).getTime() < day).length,
    },
    schedules: {
      active: schedules.filter(s => s.status === "active").length,
      nextRun: schedules.filter(s => s.status === "active" && s.nextRunAt).sort((a, b) => (a.nextRunAt ?? "").localeCompare(b.nextRunAt ?? ""))[0]?.nextRunAt ?? null,
    },
    timers: {
      active: timers.filter(t => t.status === "scheduled").length,
      fired24h: timers.filter(t => t.status === "fired" && t.firedAt && now - new Date(t.firedAt).getTime() < day).length,
    },
    humanTasks: {
      pending: tasks.filter(t => t.status === "pending" || t.status === "claimed").length,
      completed24h: tasks.filter(t => t.status === "completed" && t.completedAt && now - new Date(t.completedAt).getTime() < day).length,
    },
    metrics: {
      avgDurationMs: avgDuration,
      successRate: execs.length > 0 ? completed.length / execs.length : 0,
      throughput24h: execs.filter(e => now - new Date(e.startedAt).getTime() < day).length,
    },
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 22 — Documentation =====
const SYSTEMS_META: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }> = [
  { id: 1, name: "Workflow Registry", description: "Workflow definitions, metadata, ownership, versions.", endpoints: ["/api/workflows"], events: [] },
  { id: 2, name: "Workflow Engine", description: "Execution, transitions, deterministic state.", endpoints: ["/api/workflows/executions"], events: ["WorkflowStarted", "WorkflowCompleted", "WorkflowFailed", "WorkflowCancelled", "WorkflowPaused", "WorkflowResumed", "WorkflowTimedOut", "WorkflowRetried"] },
  { id: 3, name: "State Machine Manager", description: "States, transitions, guards, validation.", endpoints: ["/api/workflows/state-machines"], events: [] },
  { id: 4, name: "Step Executor", description: "Workflow steps. Not business logic.", endpoints: ["/api/workflows/steps"], events: [] },
  { id: 5, name: "Approval Workflow", description: "Approvals, reviewers, escalation, rejection.", endpoints: ["/api/workflows/approvals"], events: ["ApprovalRequested", "ApprovalGranted", "ApprovalRejected"] },
  { id: 6, name: "Scheduled Workflows", description: "Cron, delayed execution, recurring jobs.", endpoints: ["/api/workflows/schedules"], events: [] },
  { id: 7, name: "Timers", description: "Timeout, expiration, reminders.", endpoints: ["/api/workflows/timers"], events: ["TimerScheduled", "TimerExpired"] },
  { id: 8, name: "Retry Engine", description: "Retries, backoff, dead-letter references.", endpoints: ["/api/workflows/retries"], events: ["WorkflowRetried"] },
  { id: 9, name: "Compensation Manager", description: "Saga pattern. Rollback support.", endpoints: ["/api/workflows/compensations"], events: [] },
  { id: 10, name: "Human Tasks", description: "Manual approval, review, confirmation.", endpoints: ["/api/workflows/human-tasks"], events: [] },
  { id: 11, name: "Workflow Variables", description: "Context, metadata, references. Never business ownership.", endpoints: [], events: [] },
  { id: 12, name: "Conditions", description: "If, switch, branch, rules.", endpoints: [], events: [] },
  { id: 13, name: "Parallel Execution", description: "Fork, join, synchronization.", endpoints: [], events: [] },
  { id: 14, name: "Event Triggers", description: "Starts workflow from Event Bus.", endpoints: ["/api/workflows/triggers"], events: [] },
  { id: 15, name: "Manual Triggers", description: "Dashboard, CLI, API.", endpoints: ["/api/workflows/trigger"], events: [] },
  { id: 16, name: "Workflow Templates", description: "Reusable blueprints.", endpoints: ["/api/workflows/templates"], events: [] },
  { id: 17, name: "Workflow Versioning", description: "Multiple versions. Migration support.", endpoints: ["/api/workflows/versions"], events: ["WorkflowVersionPublished", "WorkflowArchived"] },
  { id: 18, name: "Monitoring", description: "Execution, duration, failures, waiting, running, completed.", endpoints: ["/api/workflows/monitoring"], events: [] },
  { id: 19, name: "Event Bus Bridge", description: "Passive consumer/producer. Idempotent.", endpoints: [], events: [
    "WorkflowStarted", "WorkflowCompleted", "WorkflowFailed", "WorkflowCancelled", "WorkflowPaused", "WorkflowResumed",
    "WorkflowTimedOut", "WorkflowRetried", "ApprovalRequested", "ApprovalGranted", "ApprovalRejected",
    "TimerScheduled", "TimerExpired", "WorkflowVersionPublished", "WorkflowArchived",
  ] },
  { id: 20, name: "Public APIs", description: "Workflow management APIs.", endpoints: ["/api/workflows"], events: [] },
  { id: 21, name: "Dashboard", description: "Execution history, failures, metrics, visualization.", endpoints: ["/api/workflows/dashboard"], events: [] },
  { id: 22, name: "Documentation", description: "Workflow definitions, schemas, metadata, events.", endpoints: ["/api/workflows/documentation"], events: [] },
];

const EVENT_PAYLOADS: Record<WorkflowEventType, string[]> = {
  WorkflowStarted: ["executionId", "workflowId", "correlationId"],
  WorkflowCompleted: ["executionId", "correlationId"],
  WorkflowFailed: ["executionId", "error", "correlationId"],
  WorkflowCancelled: ["executionId", "reason"],
  WorkflowPaused: ["executionId"],
  WorkflowResumed: ["executionId"],
  WorkflowTimedOut: ["executionId"],
  WorkflowRetried: ["executionId", "attempt"],
  ApprovalRequested: ["approvalId", "executionId", "correlationId"],
  ApprovalGranted: ["approvalId", "correlationId"],
  ApprovalRejected: ["approvalId", "correlationId"],
  TimerScheduled: ["timerId", "type", "firesAt"],
  TimerExpired: ["timerId"],
  WorkflowVersionPublished: ["workflowId", "version"],
  WorkflowArchived: ["workflowId"],
};

const EVENT_DESCRIPTIONS: Record<WorkflowEventType, string> = {
  WorkflowStarted: "Emitted when a workflow execution starts.",
  WorkflowCompleted: "Emitted when a workflow execution completes successfully.",
  WorkflowFailed: "Emitted when a workflow execution fails.",
  WorkflowCancelled: "Emitted when a workflow execution is cancelled.",
  WorkflowPaused: "Emitted when a workflow execution is paused.",
  WorkflowResumed: "Emitted when a workflow execution is resumed.",
  WorkflowTimedOut: "Emitted when a workflow execution times out.",
  WorkflowRetried: "Emitted when a workflow execution is retried.",
  ApprovalRequested: "Emitted when an approval is requested.",
  ApprovalGranted: "Emitted when an approval is granted.",
  ApprovalRejected: "Emitted when an approval is rejected.",
  TimerScheduled: "Emitted when a timer is scheduled.",
  TimerExpired: "Emitted when a timer expires/fires.",
  WorkflowVersionPublished: "Emitted when a new workflow version is published.",
  WorkflowArchived: "Emitted when a workflow is archived.",
};

export function generateDocumentation(): WorkflowDocumentation {
  return {
    version: "1.0.0", generatedAt: new Date().toISOString(),
    systems: SYSTEMS_META,
    events: Object.keys(EVENT_PAYLOADS).map((type) => ({
      type: type as WorkflowEventType,
      payload: EVENT_PAYLOADS[type as WorkflowEventType],
      description: EVENT_DESCRIPTIONS[type as WorkflowEventType],
    })),
    ownership: {
      owns: ["Workflow Definitions", "Workflow Executions", "State Machines", "Step Execution", "Approvals", "Schedules", "Timers", "Retries", "Compensation", "Human Tasks", "Workflow Variables", "Conditions", "Parallel Execution", "Event Triggers", "Manual Triggers", "Templates", "Versioning", "Monitoring", "Dashboard", "Documentation"],
      doesNotOwn: ["Users", "Organizations", "Quizzes", "Inventory", "Marketplace", "Commerce", "AI", "Notifications", "Analytics", "Trust & Safety", "Identity", "Game Engine"],
    },
  };
}

export function generateMarkdownDocumentation(): string {
  const doc = generateDocumentation();
  let md = `# EduBek — Workflow Automation & Orchestration Platform\n\n**Version:** ${doc.version}\n**Generated:** ${doc.generatedAt}\n**Phase:** 6G.22\n\n## Overview\nThis platform is the SINGLE SOURCE OF TRUTH for every long-running workflow, business process, approvals, automation rules, scheduled jobs, state machines, retries, timers, and cross-platform orchestration. It owns only the workflow itself — never business data. It coordinates workflows through events.\n\n## Systems\n\n`;
  for (const s of doc.systems) {
    md += `### System ${s.id} — ${s.name}\n${s.description}\n\n`;
    if (s.endpoints.length > 0) { md += `**Endpoints:**\n`; for (const e of s.endpoints) md += `- \`${e}\`\n`; md += `\n`; }
    if (s.events.length > 0) { md += `**Events:**\n`; for (const e of s.events) md += `- \`${e}\`\n`; md += `\n`; }
  }
  md += `## Events\n\n`;
  for (const e of doc.events) { md += `### \`${e.type}\`\n${e.description}\n**Payload:**\n`; for (const p of e.payload) md += `- \`${p}\`\n`; md += `\n`; }
  md += `## Ownership\n\n### Owns\n`; for (const o of doc.ownership.owns) md += `- ${o}\n`;
  md += `\n### Does NOT Own\n`; for (const o of doc.ownership.doesNotOwn) md += `- ${o}\n`;
  return md;
}

export function getWorkflowVersion(): string { return "1.0.0"; }

export function getDeveloperIntegration(): WorkflowDeveloperIntegration {
  return {
    publicAPIs: getPublicApiEndpoints(),
    extensionHooks: [
      { id: "hook_workflow_started", name: "On Workflow Started", triggerEvent: "WorkflowStarted", description: "Triggered when a workflow execution starts" },
      { id: "hook_workflow_completed", name: "On Workflow Completed", triggerEvent: "WorkflowCompleted", description: "Triggered when a workflow completes" },
      { id: "hook_workflow_failed", name: "On Workflow Failed", triggerEvent: "WorkflowFailed", description: "Triggered when a workflow fails" },
      { id: "hook_approval_requested", name: "On Approval Requested", triggerEvent: "ApprovalRequested", description: "Triggered when approval is requested" },
      { id: "hook_approval_granted", name: "On Approval Granted", triggerEvent: "ApprovalGranted", description: "Triggered when approval is granted" },
      { id: "hook_timer_expired", name: "On Timer Expired", triggerEvent: "TimerExpired", description: "Triggered when a timer expires" },
      { id: "hook_version_published", name: "On Version Published", triggerEvent: "WorkflowVersionPublished", description: "Triggered when a new version is published" },
    ],
    sdkMetadata: { version: "1.0.0", language: "typescript", docsUrl: "/docs/workflow-automation", capabilities: ["workflows", "executions", "approvals", "schedules", "timers", "retries", "compensation", "human-tasks", "templates", "versioning", "monitoring", "dashboard"] },
    webhooks: [
      { id: "wh_workflow_started", event: "WorkflowStarted", description: "Fired when a workflow starts" },
      { id: "wh_workflow_completed", event: "WorkflowCompleted", description: "Fired when a workflow completes" },
      { id: "wh_workflow_failed", event: "WorkflowFailed", description: "Fired when a workflow fails" },
      { id: "wh_approval_requested", event: "ApprovalRequested", description: "Fired when approval is requested" },
      { id: "wh_timer_expired", event: "TimerExpired", description: "Fired when a timer expires" },
    ],
  };
}

export function getWorkflowStatus(): { operational: boolean; systems: number; bridgeSubscribed: boolean; updatedAt: string } {
  return { operational: true, systems: 22, bridgeSubscribed: false, updatedAt: new Date().toISOString() };
}
