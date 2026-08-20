/** Workflow Automation Platform service — composes all 22 systems. Phase 6G.22. */
// Systems 1-8
export {
  createWorkflow, getWorkflowById, getWorkflowByKey, listWorkflows,
  activateWorkflow, archiveWorkflow,
  supportsAllWorkflowCategories, supportsAllRegistryStatuses,
  startExecution, getExecutionById, listExecutions,
  pauseExecution, resumeExecution, completeExecution, failExecution,
  cancelExecution, timeoutExecution, retryExecution,
  supportsAllExecutionStatuses,
  createStateMachine, getStateMachineById, listStateMachines,
  transitionStateMachine, canTransition, isFinalState,
  createStep, startStepExecution, completeStepExecution, failStepExecution,
  skipStepExecution, getStepExecutionById, listStepExecutions,
  supportsAllStepTypes, supportsAllStepStatuses,
  createApproval, getApprovalById, listApprovals,
  decideApproval, escalateApproval, withdrawApproval, expireApproval,
  supportsAllApprovalStatuses, supportsAllApprovalStrategies,
  createSchedule, getScheduleById, listSchedules,
  pauseSchedule, resumeSchedule, recordScheduleRun, cancelSchedule,
  listDueSchedules, supportsAllScheduleTypes, supportsAllScheduleStatuses,
  scheduleTimer, getTimerById, listTimers,
  fireTimer, cancelTimer, listExpiredTimers,
  supportsAllTimerTypes, supportsAllTimerStatuses,
  createRetry, getRetryById, listRetries,
  recordRetryAttempt, deadLetterRetry, supportsAllRetryStatuses,
} from "./core";

// Systems 9-18, 20-22
export {
  createCompensation, getCompensationById, listCompensations,
  startCompensation, completeCompensation, failCompensation,
  supportsAllCompensationStatuses,
  createHumanTask, getHumanTaskById, listHumanTasks,
  claimHumanTask, completeHumanTask, cancelHumanTask, expireHumanTask,
  supportsAllHumanTaskStatuses, supportsAllHumanTaskPriorities,
  createVariable, supportsAllVariableTypes,
  createCondition, supportsAllConditionTypes,
  createParallelExecution, getParallelById, listParallels,
  completeBranch, supportsAllParallelStatuses,
  recordEventTrigger, getEventTriggerById, listEventTriggers,
  markEventTriggerProcessed,
  triggerWorkflowManually, getManualTriggerById, listManualTriggers,
  createTemplate, getTemplateById, listTemplates,
  publishVersion, getVersionById, listVersions, getActiveVersion,
  generateMonitoring,
  getPublicApiEndpoints, generateDashboard,
  generateDocumentation, generateMarkdownDocumentation, getWorkflowVersion,
  getDeveloperIntegration, getWorkflowStatus,
} from "./platform";

// System 19
export {
  subscribeWorkflow, unsubscribeWorkflow, isWorkflowSubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishWorkflowEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";

// Re-exports from actions-execution-scheduling.ts — action + scheduler reports
export {
  generateActionReport,
  generateSchedulerReport,
} from "./actions-execution-scheduling";

// Re-exports from builder-triggers-conditions.ts — builder + trigger reports
export {
  generateBuilderReport,
  generateTriggerReport,
} from "./builder-triggers-conditions";

// Re-exports from monitoring-templates-analytics-dashboard.ts — analytics report
export {
  generateAnalyticsReport,
} from "./monitoring-templates-analytics-dashboard";

export { _resetRepositoryForTesting } from "./repository";

export type {
  WorkflowCategory, WorkflowRegistryStatus, WorkflowDefinition,
  WorkflowExecutionStatus, WorkflowExecution, ExecutionTimelineEntry,
  StateMachine, StateDefinition, StateTransition,
  StepType, StepStatus, WorkflowStep, StepExecution,
  ApprovalStatus, ApprovalStrategy, ApprovalRequest,
  ScheduleType, ScheduleStatus, WorkflowSchedule,
  TimerType, TimerStatus, WorkflowTimer,
  RetryStatus, RetryRecord,
  CompensationStatus, CompensationStep,
  HumanTaskStatus, HumanTaskPriority, HumanTask,
  VariableType, WorkflowVariable,
  ConditionType, WorkflowCondition,
  ParallelStatus, ParallelBranch, ParallelExecution,
  TriggerType, WorkflowTrigger, EventTriggerRecord, ManualTrigger,
  WorkflowTemplate, WorkflowVersion,
  WorkflowMonitoring, WorkflowDashboard,
  WorkflowEventType, WorkflowApiEndpoint, WorkflowDocumentation, WorkflowDeveloperIntegration,
} from "./types";
