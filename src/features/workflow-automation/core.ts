/** Systems 1-8: Registry, Engine, State Machine, Step Executor, Approvals, Scheduling, Timers, Retry. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeDefinition, getDefinition, getDefinitionByKey, getAllDefinitions,
  storeExecution, getExecution, getAllExecutions,
  storeStateMachine, getStateMachine, getAllStateMachines,
  storeStepExecution, getStepExecution, getStepExecutionsForExecution, getAllStepExecutions,
  storeApproval, getApproval, getAllApprovals, getApprovalsForExecution,
  storeSchedule, getSchedule, getAllSchedules,
  storeTimer, getTimer, getAllTimers,
  storeRetry, getRetry, getAllRetries,
} from "./repository";
import type {
  WorkflowDefinition, WorkflowCategory, WorkflowRegistryStatus,
  WorkflowExecution, WorkflowExecutionStatus, ExecutionTimelineEntry,
  StateMachine, StateDefinition, StateTransition,
  WorkflowStep, StepType, StepStatus, StepExecution,
  ApprovalRequest, ApprovalStatus, ApprovalStrategy,
  WorkflowSchedule, ScheduleType, ScheduleStatus,
  WorkflowTimer, TimerType, TimerStatus,
  RetryRecord, RetryStatus,
} from "./types";
import { publishWorkflowEvent } from "./event-bus-bridge";

const log = getLogger("workflow.core");

// ===== System 1 — Workflow Registry =====
export function createWorkflow(input: {
  key: string; name: string; category: WorkflowCategory;
  description?: string; ownerId: string;
  steps?: WorkflowStep[]; triggers?: any[]; variables?: any[];
  conditions?: any[]; parallelBranches?: any[];
  metadata?: Record<string, unknown>;
}): WorkflowDefinition {
  if (getDefinitionByKey(input.key)) throw new Error(`Workflow key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const wf: WorkflowDefinition = {
    id: randomUUID(), key: input.key, name: input.name,
    category: input.category, status: "draft",
    description: input.description ?? "", ownerId: input.ownerId, version: 1,
    steps: input.steps ?? [], triggers: input.triggers ?? [], variables: input.variables ?? [],
    conditions: input.conditions ?? [], parallelBranches: input.parallelBranches ?? [],
    createdAt: now, updatedAt: now, archivedAt: null, metadata: input.metadata ?? {},
  };
  storeDefinition(wf);
  return wf;
}
export function getWorkflowById(id: string) { return getDefinition(id); }
export function getWorkflowByKey(key: string) { return getDefinitionByKey(key); }
export function listWorkflows(category?: WorkflowCategory, status?: WorkflowRegistryStatus) {
  let all = getAllDefinitions();
  if (category) all = all.filter(w => w.category === category);
  if (status) all = all.filter(w => w.status === status);
  return all;
}
export function activateWorkflow(id: string) {
  const w = getDefinition(id); if (!w) return null;
  w.status = "active"; w.updatedAt = new Date().toISOString(); w.version += 1;
  storeDefinition(w); return w;
}
export function archiveWorkflow(id: string) {
  const w = getDefinition(id); if (!w) return null;
  w.status = "archived"; w.updatedAt = new Date().toISOString(); w.archivedAt = w.updatedAt;
  storeDefinition(w);
  publishWorkflowEvent("WorkflowArchived", null, { workflowId: id });
  return w;
}
export function supportsAllWorkflowCategories() { return ["business", "approval", "automation", "scheduled", "saga", "notification", "lifecycle", "integration", "custom"]; }
export function supportsAllRegistryStatuses() { return ["draft", "active", "deprecated", "archived"]; }

// ===== System 2 — Workflow Engine =====
export function startExecution(input: {
  workflowId: string; triggeredBy: string;
  triggerType: "event" | "manual" | "scheduled" | "api";
  triggerPayload?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  parentExecutionId?: string | null;
  timeoutMs?: number | null;
  maxRetries?: number;
}): WorkflowExecution {
  const wf = getDefinition(input.workflowId);
  if (!wf) throw new Error(`Workflow not found: ${input.workflowId}`);
  if (wf.status !== "active") throw new Error(`Workflow is not active: ${input.workflowId}`);
  const now = new Date().toISOString();
  const exec: WorkflowExecution = {
    id: randomUUID(), workflowId: input.workflowId, workflowVersion: wf.version,
    status: "running", correlationId: randomUUID(),
    triggeredBy: input.triggeredBy, triggerType: input.triggerType,
    triggerPayload: input.triggerPayload ?? {},
    variables: input.variables ?? {},
    currentStepIndex: 0, startedAt: now,
    completedAt: null, failedAt: null, cancelledAt: null, pausedAt: null,
    timeoutAt: input.timeoutMs ? new Date(Date.now() + input.timeoutMs).toISOString() : null,
    retryCount: 0, maxRetries: input.maxRetries ?? 3,
    timeline: [{ id: randomUUID(), timestamp: now, type: "started", stepIndex: null, actorId: input.triggeredBy, description: "Workflow execution started", metadata: {} }],
    parentExecutionId: input.parentExecutionId ?? null,
    childExecutionIds: [], compensationSteps: [],
    metadata: {},
  };
  storeExecution(exec);
  publishWorkflowEvent("WorkflowStarted", input.triggeredBy, { executionId: exec.id, workflowId: input.workflowId, correlationId: exec.correlationId });
  log.info("execution.started", { id: exec.id, workflowId: input.workflowId });
  return exec;
}
export function getExecutionById(id: string) { return getExecution(id); }
export function listExecutions(status?: WorkflowExecutionStatus, workflowId?: string) {
  let all = getAllExecutions();
  if (status) all = all.filter(e => e.status === status);
  if (workflowId) all = all.filter(e => e.workflowId === workflowId);
  return all.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
export function pauseExecution(id: string, actorId: string) {
  const e = getExecution(id); if (!e) return null;
  if (e.status !== "running" && e.status !== "retrying") return null;
  const before = e.status;
  e.status = "paused"; e.pausedAt = new Date().toISOString();
  addTimelineEntry(e, "paused", null, actorId, "Execution paused");
  storeExecution(e);
  publishWorkflowEvent("WorkflowPaused", actorId, { executionId: id });
  return e;
}
export function resumeExecution(id: string, actorId: string) {
  const e = getExecution(id); if (!e) return null;
  if (e.status !== "paused") return null;
  e.status = "running"; e.pausedAt = null;
  addTimelineEntry(e, "resumed", null, actorId, "Execution resumed");
  storeExecution(e);
  publishWorkflowEvent("WorkflowResumed", actorId, { executionId: id });
  return e;
}
export function completeExecution(id: string) {
  const e = getExecution(id); if (!e) return null;
  if (e.status === "completed" || e.status === "cancelled") return null;
  e.status = "completed"; e.completedAt = new Date().toISOString();
  addTimelineEntry(e, "completed", null, null, "Execution completed");
  storeExecution(e);
  publishWorkflowEvent("WorkflowCompleted", null, { executionId: id, correlationId: e.correlationId });
  return e;
}
export function failExecution(id: string, error: string) {
  const e = getExecution(id); if (!e) return null;
  if (e.status === "completed" || e.status === "failed") return null;
  e.status = "failed"; e.failedAt = new Date().toISOString();
  addTimelineEntry(e, "failed", null, null, `Execution failed: ${error}`);
  storeExecution(e);
  publishWorkflowEvent("WorkflowFailed", null, { executionId: id, error, correlationId: e.correlationId });
  return e;
}
export function cancelExecution(id: string, actorId: string, reason: string) {
  const e = getExecution(id); if (!e) return null;
  if (e.status === "completed" || e.status === "cancelled") return null;
  e.status = "cancelled"; e.cancelledAt = new Date().toISOString();
  addTimelineEntry(e, "cancelled", null, actorId, `Execution cancelled: ${reason}`);
  storeExecution(e);
  publishWorkflowEvent("WorkflowCancelled", actorId, { executionId: id, reason });
  return e;
}
export function timeoutExecution(id: string) {
  const e = getExecution(id); if (!e) return null;
  if (e.status !== "running" && e.status !== "retrying") return null;
  e.status = "timed_out"; e.failedAt = new Date().toISOString();
  addTimelineEntry(e, "timed_out", null, null, "Execution timed out");
  storeExecution(e);
  publishWorkflowEvent("WorkflowTimedOut", null, { executionId: id });
  return e;
}
export function retryExecution(id: string) {
  const e = getExecution(id); if (!e) return null;
  if (e.status !== "failed" && e.status !== "timed_out") return null;
  e.retryCount += 1;
  if (e.retryCount > e.maxRetries) return null;
  e.status = "retrying"; e.failedAt = null;
  addTimelineEntry(e, "retrying", null, null, `Retry attempt ${e.retryCount}`);
  storeExecution(e);
  publishWorkflowEvent("WorkflowRetried", null, { executionId: id, attempt: e.retryCount });
  return e;
}
function addTimelineEntry(e: WorkflowExecution, type: string, stepIndex: number | null, actorId: string | null, description: string) {
  e.timeline.push({ id: randomUUID(), timestamp: new Date().toISOString(), type, stepIndex, actorId, description, metadata: {} });
}
export function supportsAllExecutionStatuses() { return ["pending", "running", "paused", "completed", "failed", "cancelled", "timed_out", "awaiting_approval", "awaiting_human_task", "retrying", "compensating"]; }

// ===== System 3 — State Machine Manager =====
export function createStateMachine(input: {
  workflowId: string;
  states: StateDefinition[];
  transitions: StateTransition[];
}): StateMachine {
  const sm: StateMachine = {
    id: randomUUID(), workflowId: input.workflowId,
    states: input.states, transitions: input.transitions,
    currentState: input.states.find(s => s.isInitial)?.name ?? "initial",
    status: "active",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    metadata: {},
  };
  storeStateMachine(sm);
  return sm;
}
export function getStateMachineById(id: string) { return getStateMachine(id); }
export function listStateMachines() { return getAllStateMachines(); }
export function transitionStateMachine(id: string, event: string): StateMachine | null {
  const sm = getStateMachine(id); if (!sm) return null;
  const t = sm.transitions.find(t => t.from === sm.currentState && t.event === event);
  if (!t) return null;
  sm.currentState = t.to;
  sm.updatedAt = new Date().toISOString();
  storeStateMachine(sm);
  return sm;
}
export function canTransition(sm: StateMachine, event: string): boolean {
  return sm.transitions.some(t => t.from === sm.currentState && t.event === event);
}
export function isFinalState(sm: StateMachine): boolean {
  return sm.states.find(s => s.name === sm.currentState)?.isFinal ?? false;
}

// ===== System 4 — Step Executor =====
export function createStep(input: {
  name: string; type: StepType; stepIndex: number;
  config?: Record<string, unknown>; nextStepId?: string | null;
  onFailure?: "retry" | "skip" | "abort" | "compensate";
  retryConfig?: { maxRetries: number; backoffMs: number } | null;
  timeoutMs?: number | null;
}): WorkflowStep {
  return {
    id: randomUUID(), name: input.name, type: input.type, stepIndex: input.stepIndex,
    config: input.config ?? {}, nextStepId: input.nextStepId ?? null,
    onFailure: input.onFailure ?? "abort",
    retryConfig: input.retryConfig ?? null, timeoutMs: input.timeoutMs ?? null,
  };
}
export function startStepExecution(input: {
  executionId: string; stepId: string; stepIndex: number;
}): StepExecution {
  const se: StepExecution = {
    id: randomUUID(), executionId: input.executionId, stepId: input.stepId,
    stepIndex: input.stepIndex, status: "running",
    startedAt: new Date().toISOString(), completedAt: null, failedAt: null,
    durationMs: null, attemptCount: 1, result: null, error: null, metadata: {},
  };
  storeStepExecution(se);
  return se;
}
export function completeStepExecution(id: string, result?: Record<string, unknown>) {
  const s = getStepExecution(id); if (!s) return null;
  if (s.status !== "running") return null;
  s.status = "completed"; s.completedAt = new Date().toISOString();
  s.durationMs = new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime();
  s.result = result ?? null;
  storeStepExecution(s);
  return s;
}
export function failStepExecution(id: string, error: string) {
  const s = getStepExecution(id); if (!s) return null;
  if (s.status !== "running") return null;
  s.status = "failed"; s.failedAt = new Date().toISOString();
  s.durationMs = new Date(s.failedAt).getTime() - new Date(s.startedAt).getTime();
  s.error = error;
  storeStepExecution(s);
  return s;
}
export function skipStepExecution(id: string) {
  const s = getStepExecution(id); if (!s) return null;
  s.status = "skipped"; storeStepExecution(s); return s;
}
export function getStepExecutionById(id: string) { return getStepExecution(id); }
export function listStepExecutions(execId?: string) {
  return execId ? getStepExecutionsForExecution(execId) : getAllStepExecutions();
}
export function supportsAllStepTypes() { return ["task", "approval", "human_task", "timer", "condition", "parallel_fork", "parallel_join", "compensation", "event_publish", "script"]; }
export function supportsAllStepStatuses() { return ["pending", "running", "completed", "failed", "skipped", "cancelled"]; }

// ===== System 5 — Approval Workflow =====
export function createApproval(input: {
  executionId: string; stepId: string;
  approverIds: string[]; strategy?: ApprovalStrategy;
  escalationApproverIds?: string[]; escalationAfterMs?: number | null;
  expiresAt?: string | null; metadata?: Record<string, unknown>;
}): ApprovalRequest {
  const now = new Date().toISOString();
  const approval: ApprovalRequest = {
    id: randomUUID(), executionId: input.executionId, stepId: input.stepId,
    approverIds: input.approverIds, strategy: input.strategy ?? "any",
    status: "pending", decisions: [],
    escalationApproverIds: input.escalationApproverIds ?? [],
    escalationAfterMs: input.escalationAfterMs ?? null,
    escalationTriggeredAt: null,
    requestedAt: now, decidedAt: null, expiresAt: input.expiresAt ?? null,
    correlationId: randomUUID(), metadata: input.metadata ?? {},
  };
  storeApproval(approval);
  publishWorkflowEvent("ApprovalRequested", null, { approvalId: approval.id, executionId: input.executionId, correlationId: approval.correlationId });
  return approval;
}
export function getApprovalById(id: string) { return getApproval(id); }
export function listApprovals(status?: ApprovalStatus, execId?: string) {
  let all = execId ? getApprovalsForExecution(execId) : getAllApprovals();
  if (status) all = all.filter(a => a.status === status);
  return all;
}
export function decideApproval(id: string, approverId: string, decision: "approved" | "rejected", note: string) {
  const a = getApproval(id); if (!a) return null;
  if (a.status !== "pending") return null;
  if (!a.approverIds.includes(approverId) && !a.escalationApproverIds.includes(approverId)) return null;
  a.decisions.push({ approverId, decision, timestamp: new Date().toISOString(), note });
  const approved = a.decisions.filter(d => d.decision === "approved").length;
  const rejected = a.decisions.filter(d => d.decision === "rejected").length;
  if (a.strategy === "any") {
    a.status = decision; a.decidedAt = new Date().toISOString();
  } else if (a.strategy === "all") {
    if (rejected > 0) { a.status = "rejected"; a.decidedAt = new Date().toISOString(); }
    else if (approved === a.approverIds.length) { a.status = "approved"; a.decidedAt = new Date().toISOString(); }
  } else if (a.strategy === "majority") {
    const majority = Math.floor(a.approverIds.length / 2) + 1;
    if (approved >= majority) { a.status = "approved"; a.decidedAt = new Date().toISOString(); }
    else if (rejected >= majority) { a.status = "rejected"; a.decidedAt = new Date().toISOString(); }
  } else if (a.strategy === "sequential") {
    const currentIdx = a.decisions.length - 1;
    if (decision === "rejected") { a.status = "rejected"; a.decidedAt = new Date().toISOString(); }
    else if (currentIdx === a.approverIds.length - 1) { a.status = "approved"; a.decidedAt = new Date().toISOString(); }
  }
  storeApproval(a);
  if (a.status === "approved") publishWorkflowEvent("ApprovalGranted", approverId, { approvalId: a.id, correlationId: a.correlationId });
  if (a.status === "rejected") publishWorkflowEvent("ApprovalRejected", approverId, { approvalId: a.id, correlationId: a.correlationId });
  return a;
}
export function escalateApproval(id: string): ApprovalRequest | null {
  const a = getApproval(id); if (!a) return null;
  if (a.status !== "pending") return null;
  a.status = "escalated"; a.escalationTriggeredAt = new Date().toISOString();
  storeApproval(a); return a;
}
export function withdrawApproval(id: string): ApprovalRequest | null {
  const a = getApproval(id); if (!a) return null;
  if (a.status !== "pending" && a.status !== "escalated") return null;
  a.status = "withdrawn"; storeApproval(a); return a;
}
export function expireApproval(id: string): ApprovalRequest | null {
  const a = getApproval(id); if (!a) return null;
  if (a.status !== "pending") return null;
  a.status = "expired"; storeApproval(a); return a;
}
export function supportsAllApprovalStatuses() { return ["pending", "approved", "rejected", "expired", "escalated", "withdrawn"]; }
export function supportsAllApprovalStrategies() { return ["any", "all", "majority", "sequential"]; }

// ===== System 6 — Scheduled Workflows =====
export function createSchedule(input: {
  workflowId: string; type: ScheduleType;
  cronExpression?: string | null; fixedRateMinutes?: number | null;
  scheduledAt?: string; maxRuns?: number | null;
  payload?: Record<string, unknown>; metadata?: Record<string, unknown>;
}): WorkflowSchedule {
  const now = new Date().toISOString();
  let nextRunAt: string | null = now;
  if (input.type === "one_time") nextRunAt = input.scheduledAt ?? now;
  else if (input.type === "fixed_rate") nextRunAt = new Date(Date.now() + (input.fixedRateMinutes ?? 60) * 60 * 1000).toISOString();
  const sched: WorkflowSchedule = {
    id: randomUUID(), workflowId: input.workflowId,
    type: input.type, cronExpression: input.cronExpression ?? null,
    fixedRateMinutes: input.fixedRateMinutes ?? null,
    scheduledAt: input.scheduledAt ?? now, nextRunAt,
    lastRunAt: null, status: "active", runCount: 0,
    maxRuns: input.maxRuns ?? null, payload: input.payload ?? {},
    createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storeSchedule(sched);
  return sched;
}
export function getScheduleById(id: string) { return getSchedule(id); }
export function listSchedules(status?: ScheduleStatus) {
  const all = getAllSchedules();
  return status ? all.filter(s => s.status === status) : all;
}
export function pauseSchedule(id: string) {
  const s = getSchedule(id); if (!s) return null;
  if (s.status !== "active") return null;
  s.status = "paused"; s.updatedAt = new Date().toISOString(); storeSchedule(s); return s;
}
export function resumeSchedule(id: string) {
  const s = getSchedule(id); if (!s) return null;
  if (s.status !== "paused") return null;
  s.status = "active"; s.updatedAt = new Date().toISOString(); storeSchedule(s); return s;
}
export function recordScheduleRun(id: string) {
  const s = getSchedule(id); if (!s) return null;
  if (s.status !== "active") return null;
  s.runCount += 1; s.lastRunAt = new Date().toISOString();
  if (s.maxRuns !== null && s.runCount >= s.maxRuns) s.status = "completed";
  if (s.type === "fixed_rate" && s.fixedRateMinutes) s.nextRunAt = new Date(Date.now() + s.fixedRateMinutes * 60 * 1000).toISOString();
  if (s.type === "one_time") s.status = "completed";
  s.updatedAt = s.lastRunAt; storeSchedule(s); return s;
}
export function cancelSchedule(id: string) {
  const s = getSchedule(id); if (!s) return null;
  if (s.status === "completed" || s.status === "cancelled") return null;
  s.status = "cancelled"; s.updatedAt = new Date().toISOString(); storeSchedule(s); return s;
}
export function listDueSchedules(now: number = Date.now()) {
  return getAllSchedules().filter(s =>
    s.status === "active" && s.nextRunAt && new Date(s.nextRunAt).getTime() <= now
  );
}
export function supportsAllScheduleTypes() { return ["cron", "fixed_rate", "one_time"]; }
export function supportsAllScheduleStatuses() { return ["active", "paused", "completed", "failed", "cancelled"]; }

// ===== System 7 — Timers =====
export function scheduleTimer(input: {
  executionId?: string | null; type: TimerType;
  firesAt: string; payload?: Record<string, unknown>;
}): WorkflowTimer {
  const timer: WorkflowTimer = {
    id: randomUUID(), executionId: input.executionId ?? null,
    type: input.type, firesAt: input.firesAt, status: "scheduled",
    firedAt: null, cancelledAt: null, payload: input.payload ?? {},
    createdAt: new Date().toISOString(), metadata: {},
  };
  storeTimer(timer);
  publishWorkflowEvent("TimerScheduled", null, { timerId: timer.id, type: timer.type, firesAt: timer.firesAt });
  return timer;
}
export function getTimerById(id: string) { return getTimer(id); }
export function listTimers(status?: TimerStatus) {
  const all = getAllTimers();
  return status ? all.filter(t => t.status === status) : all;
}
export function fireTimer(id: string): WorkflowTimer | null {
  const t = getTimer(id); if (!t) return null;
  if (t.status !== "scheduled") return null;
  t.status = "fired"; t.firedAt = new Date().toISOString();
  storeTimer(t);
  publishWorkflowEvent("TimerExpired", null, { timerId: t.id });
  return t;
}
export function cancelTimer(id: string): WorkflowTimer | null {
  const t = getTimer(id); if (!t) return null;
  if (t.status !== "scheduled") return null;
  t.status = "cancelled"; t.cancelledAt = new Date().toISOString();
  storeTimer(t); return t;
}
export function listExpiredTimers(now: number = Date.now()) {
  return getAllTimers().filter(t => t.status === "scheduled" && new Date(t.firesAt).getTime() <= now);
}
export function supportsAllTimerTypes() { return ["timeout", "expiration", "reminder", "delay"]; }
export function supportsAllTimerStatuses() { return ["scheduled", "fired", "cancelled", "expired"]; }

// ===== System 8 — Retry Engine =====
export function createRetry(input: {
  executionId: string; stepId: string;
  maxAttempts?: number; backoffMs?: number;
  backoffStrategy?: "fixed" | "exponential" | "linear";
  error?: string | null;
}): RetryRecord {
  const r: RetryRecord = {
    id: randomUUID(), executionId: input.executionId, stepId: input.stepId,
    attemptNumber: 0, maxAttempts: input.maxAttempts ?? 3,
    backoffMs: input.backoffMs ?? 1000,
    backoffStrategy: input.backoffStrategy ?? "exponential",
    status: "pending", lastAttemptAt: null, nextAttemptAt: new Date().toISOString(),
    error: input.error ?? null, deadLetterRef: null,
    createdAt: new Date().toISOString(), metadata: {},
  };
  storeRetry(r);
  return r;
}
export function getRetryById(id: string) { return getRetry(id); }
export function listRetries(status?: RetryStatus) {
  const all = getAllRetries();
  return status ? all.filter(r => r.status === status) : all;
}
export function recordRetryAttempt(id: string, success: boolean, error?: string): RetryRecord | null {
  const r = getRetry(id); if (!r) return null;
  if (r.status !== "pending") return null;
  r.attemptNumber += 1;
  r.lastAttemptAt = new Date().toISOString();
  if (success) {
    r.status = "succeeded";
  } else {
    r.error = error ?? r.error;
    if (r.attemptNumber >= r.maxAttempts) {
      r.status = "exhausted";
      r.deadLetterRef = `dlq_${r.id}`;
    } else {
      let backoff = r.backoffMs;
      if (r.backoffStrategy === "exponential") backoff = r.backoffMs * Math.pow(2, r.attemptNumber);
      else if (r.backoffStrategy === "linear") backoff = r.backoffMs * r.attemptNumber;
      r.nextAttemptAt = new Date(Date.now() + backoff).toISOString();
    }
  }
  storeRetry(r);
  return r;
}
export function deadLetterRetry(id: string): RetryRecord | null {
  const r = getRetry(id); if (!r) return null;
  if (r.status !== "exhausted") return null;
  r.status = "dead_lettered"; storeRetry(r); return r;
}
export function supportsAllRetryStatuses() { return ["pending", "succeeded", "exhausted", "dead_lettered"]; }
