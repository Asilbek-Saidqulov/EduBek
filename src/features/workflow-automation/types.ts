/**
 * EduBek — Workflow Automation & Orchestration Platform types.
 * Phase 6G.22: Single source of truth for long-running workflows, business processes,
 * approvals, automation rules, scheduled jobs, state machines, retries, timers, and
 * cross-platform orchestration. Owns only the workflow itself — never business data.
 */

// ===========================================================================
// System 1 — Workflow Registry
// ===========================================================================
export type WorkflowCategory =
  | "business" | "approval" | "automation" | "scheduled" | "saga"
  | "notification" | "lifecycle" | "integration" | "custom";
export type WorkflowRegistryStatus = "draft" | "active" | "deprecated" | "archived";

export interface WorkflowDefinition {
  id: string; key: string; name: string;
  category: WorkflowCategory;
  status: WorkflowRegistryStatus;
  description: string;
  ownerId: string;
  version: number;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  variables: WorkflowVariable[];
  conditions: WorkflowCondition[];
  parallelBranches: ParallelBranch[];
  createdAt: string; updatedAt: string;
  archivedAt: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 2 — Workflow Engine (execution instances)
// ===========================================================================
export type WorkflowExecutionStatus =
  | "pending" | "running" | "paused" | "completed" | "failed"
  | "cancelled" | "timed_out" | "awaiting_approval" | "awaiting_human_task"
  | "retrying" | "compensating";

export interface WorkflowExecution {
  id: string; workflowId: string; workflowVersion: number;
  status: WorkflowExecutionStatus;
  correlationId: string;
  triggeredBy: string;
  triggerType: "event" | "manual" | "scheduled" | "api";
  triggerPayload: Record<string, unknown>;
  variables: Record<string, unknown>;
  currentStepIndex: number;
  startedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  pausedAt: string | null;
  timeoutAt: string | null;
  retryCount: number;
  maxRetries: number;
  timeline: ExecutionTimelineEntry[];
  parentExecutionId: string | null;
  childExecutionIds: string[];
  compensationSteps: string[];
  metadata: Record<string, unknown>;
}

export interface ExecutionTimelineEntry {
  id: string; timestamp: string;
  type: string;
  stepIndex: number | null;
  actorId: string | null;
  description: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 3 — State Machine Manager
// ===========================================================================
export type StateMachineStatus = "active" | "inactive";

export interface StateDefinition {
  name: string;
  isInitial: boolean;
  isFinal: boolean;
  isAwaiting: boolean;
}

export interface StateTransition {
  from: string;
  to: string;
  event: string;
  guard: string | null;
  action: string | null;
}

export interface StateMachine {
  id: string; workflowId: string;
  states: StateDefinition[];
  transitions: StateTransition[];
  currentState: string;
  status: StateMachineStatus;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 4 — Step Executor
// ===========================================================================
export type StepType =
  | "task" | "approval" | "human_task" | "timer" | "condition"
  | "parallel_fork" | "parallel_join" | "compensation" | "event_publish" | "script";

export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped" | "cancelled";

export interface WorkflowStep {
  id: string; name: string;
  type: StepType;
  stepIndex: number;
  config: Record<string, unknown>;
  nextStepId: string | null;
  onFailure: "retry" | "skip" | "abort" | "compensate";
  retryConfig: { maxRetries: number; backoffMs: number } | null;
  timeoutMs: number | null;
}

export interface StepExecution {
  id: string; executionId: string;
  stepId: string;
  stepIndex: number;
  status: StepStatus;
  startedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  durationMs: number | null;
  attemptCount: number;
  result: Record<string, unknown> | null;
  error: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 5 — Approval Workflow
// ===========================================================================
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "escalated" | "withdrawn";
export type ApprovalStrategy = "any" | "all" | "majority" | "sequential";

export interface ApprovalRequest {
  id: string; executionId: string;
  stepId: string;
  approverIds: string[];
  strategy: ApprovalStrategy;
  status: ApprovalStatus;
  decisions: Array<{ approverId: string; decision: "approved" | "rejected"; timestamp: string; note: string }>;
  escalationApproverIds: string[];
  escalationAfterMs: number | null;
  escalationTriggeredAt: string | null;
  requestedAt: string;
  decidedAt: string | null;
  expiresAt: string | null;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 6 — Scheduled Workflows
// ===========================================================================
export type ScheduleType = "cron" | "fixed_rate" | "one_time";
export type ScheduleStatus = "active" | "paused" | "completed" | "failed" | "cancelled";

export interface WorkflowSchedule {
  id: string; workflowId: string;
  type: ScheduleType;
  cronExpression: string | null;
  fixedRateMinutes: number | null;
  scheduledAt: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  status: ScheduleStatus;
  runCount: number;
  maxRuns: number | null;
  payload: Record<string, unknown>;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 7 — Timers
// ===========================================================================
export type TimerType = "timeout" | "expiration" | "reminder" | "delay";
export type TimerStatus = "scheduled" | "fired" | "cancelled" | "expired";

export interface WorkflowTimer {
  id: string; executionId: string | null;
  type: TimerType;
  firesAt: string;
  status: TimerStatus;
  firedAt: string | null;
  cancelledAt: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 8 — Retry Engine
// ===========================================================================
export type RetryStatus = "pending" | "succeeded" | "exhausted" | "dead_lettered";

export interface RetryRecord {
  id: string; executionId: string;
  stepId: string;
  attemptNumber: number;
  maxAttempts: number;
  backoffMs: number;
  backoffStrategy: "fixed" | "exponential" | "linear";
  status: RetryStatus;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  error: string | null;
  deadLetterRef: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 9 — Compensation Manager
// ===========================================================================
export type CompensationStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";

export interface CompensationStep {
  id: string; executionId: string;
  originalStepId: string;
  compensationAction: string;
  status: CompensationStatus;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  order: number;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 10 — Human Tasks
// ===========================================================================
export type HumanTaskStatus = "pending" | "claimed" | "completed" | "cancelled" | "expired";
export type HumanTaskPriority = "low" | "normal" | "high" | "urgent";

export interface HumanTask {
  id: string; executionId: string;
  stepId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  candidateGroupIds: string[];
  priority: HumanTaskPriority;
  status: HumanTaskStatus;
  claimedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  result: Record<string, unknown> | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 11 — Workflow Variables
// ===========================================================================
export type VariableType = "string" | "number" | "boolean" | "object" | "array" | "reference";

export interface WorkflowVariable {
  key: string;
  type: VariableType;
  defaultValue: unknown;
  required: boolean;
  description: string;
  isSecret: boolean;
}

// ===========================================================================
// System 12 — Conditions
// ===========================================================================
export type ConditionType = "if" | "switch" | "branch" | "rule";

export interface WorkflowCondition {
  id: string;
  type: ConditionType;
  expression: string;
  branches: Array<{ label: string; targetStepId: string }>;
  defaultStepId: string | null;
}

// ===========================================================================
// System 13 — Parallel Execution
// ===========================================================================
export type ParallelStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface ParallelBranch {
  id: string;
  branchName: string;
  steps: string[];
  joinStepId: string;
}

export interface ParallelExecution {
  id: string; executionId: string;
  forkStepId: string;
  joinStepId: string;
  branches: Array<{ branchId: string; executionId: string; status: ParallelStatus }>;
  status: ParallelStatus;
  joinStrategy: "all" | "any" | "n_of_m";
  joinCount: number;
  requiredCount: number;
  createdAt: string;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 14 — Event Triggers
// ===========================================================================
export type TriggerType = "event" | "manual" | "scheduled" | "api" | "webhook";

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  eventType: string | null;
  filter: Record<string, unknown> | null;
  enabled: boolean;
}

export interface EventTriggerRecord {
  id: string; workflowId: string;
  triggerId: string;
  sourceEventId: string;
  sourceEventType: string;
  executionId: string | null;
  processed: boolean;
  processedAt: string | null;
  receivedAt: string;
  payload: Record<string, unknown>;
}

// ===========================================================================
// System 15 — Manual Triggers
// ===========================================================================
export interface ManualTrigger {
  id: string; workflowId: string;
  triggeredBy: string;
  triggerSource: "dashboard" | "cli" | "api";
  payload: Record<string, unknown>;
  executionId: string;
  triggeredAt: string;
}

// ===========================================================================
// System 16 — Workflow Templates
// ===========================================================================
export interface WorkflowTemplate {
  id: string; key: string; name: string;
  description: string;
  category: WorkflowCategory;
  steps: Array<Omit<WorkflowStep, "id">>;
  variables: WorkflowVariable[];
  triggers: Array<Omit<WorkflowTrigger, "id">>;
  tags: string[];
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 17 — Workflow Versioning
// ===========================================================================
export interface WorkflowVersion {
  id: string; workflowId: string;
  version: number;
  definition: Record<string, unknown>;
  changeLog: string;
  publishedBy: string;
  publishedAt: string;
  active: boolean;
  migrationScript: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 18 — Monitoring
// ===========================================================================
export interface WorkflowMonitoring {
  totalExecutions: number;
  byStatus: Record<WorkflowExecutionStatus, number>;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  failureRate: number;
  retryRate: number;
  avgRetryCount: number;
  activeExecutions: number;
  waitingApprovals: number;
  waitingHumanTasks: number;
  timedOut24h: number;
  cancelled24h: number;
  updatedAt: string;
}

// ===========================================================================
// System 19 — Event Bus Bridge
// ===========================================================================
export type WorkflowEventType =
  | "WorkflowStarted" | "WorkflowCompleted" | "WorkflowFailed"
  | "WorkflowCancelled" | "WorkflowPaused" | "WorkflowResumed"
  | "WorkflowTimedOut" | "WorkflowRetried"
  | "ApprovalRequested" | "ApprovalGranted" | "ApprovalRejected"
  | "TimerScheduled" | "TimerExpired"
  | "WorkflowVersionPublished" | "WorkflowArchived";

// ===========================================================================
// System 20 — Public APIs (metadata)
// ===========================================================================
export interface WorkflowApiEndpoint {
  path: string; method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  description: string; authRequired: boolean; scope: string;
}

// ===========================================================================
// System 21 — Dashboard
// ===========================================================================
export interface WorkflowDashboard {
  executions: { total: number; running: number; completed: number; failed: number; awaiting: number };
  recentExecutions: Array<{ id: string; workflowName: string; status: WorkflowExecutionStatus; startedAt: string; durationMs: number | null }>;
  failures: { total24h: number; topErrors: Array<{ error: string; count: number }> };
  approvals: { pending: number; approved24h: number; rejected24h: number };
  schedules: { active: number; nextRun: string | null };
  timers: { active: number; fired24h: number };
  humanTasks: { pending: number; completed24h: number };
  metrics: { avgDurationMs: number; successRate: number; throughput24h: number };
  updatedAt: string;
}

// ===========================================================================
// System 22 — Documentation
// ===========================================================================
export interface WorkflowDocumentation {
  version: string; generatedAt: string;
  systems: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }>;
  events: Array<{ type: WorkflowEventType; payload: string[]; description: string }>;
  ownership: { owns: string[]; doesNotOwn: string[] };
}

// ===========================================================================
// Developer Integration
// ===========================================================================
export interface WorkflowDeveloperIntegration {
  publicAPIs: WorkflowApiEndpoint[];
  extensionHooks: Array<{ id: string; name: string; triggerEvent: WorkflowEventType; description: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string; capabilities: string[] };
  webhooks: Array<{ id: string; event: WorkflowEventType; description: string }>;
}
