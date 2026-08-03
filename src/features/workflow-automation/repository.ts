/** In-memory repository for Workflow Automation Platform. Phase 6G.22. */
import type {
  WorkflowDefinition, WorkflowExecution, StateMachine, StepExecution,
  ApprovalRequest, WorkflowSchedule, WorkflowTimer, RetryRecord,
  CompensationStep, HumanTask, ParallelExecution,
  EventTriggerRecord, ManualTrigger, WorkflowTemplate, WorkflowVersion,
} from "./types";

const definitions = new Map<string, WorkflowDefinition>();
const executions = new Map<string, WorkflowExecution>();
const stateMachines = new Map<string, StateMachine>();
const stepExecutions = new Map<string, StepExecution>();
const approvals = new Map<string, ApprovalRequest>();
const schedules = new Map<string, WorkflowSchedule>();
const timers = new Map<string, WorkflowTimer>();
const retries = new Map<string, RetryRecord>();
const compensations = new Map<string, CompensationStep>();
const humanTasks = new Map<string, HumanTask>();
const parallels = new Map<string, ParallelExecution>();
const eventTriggers = new Map<string, EventTriggerRecord>();
const manualTriggers = new Map<string, ManualTrigger>();
const templates = new Map<string, WorkflowTemplate>();
const versions = new Map<string, WorkflowVersion>();

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storeDefinition = (d: WorkflowDefinition) => definitions.set(d.id, d);
export const getDefinition = (id: string) => definitions.get(id) ?? null;
export const getDefinitionByKey = (key: string) => Array.from(definitions.values()).find(d => d.key === key) ?? null;
export const getAllDefinitions = () => Array.from(definitions.values());

export const storeExecution = (e: WorkflowExecution) => executions.set(e.id, e);
export const getExecution = (id: string) => executions.get(id) ?? null;
export const getAllExecutions = () => Array.from(executions.values());

export const storeStateMachine = (s: StateMachine) => stateMachines.set(s.id, s);
export const getStateMachine = (id: string) => stateMachines.get(id) ?? null;
export const getAllStateMachines = () => Array.from(stateMachines.values());

export const storeStepExecution = (s: StepExecution) => stepExecutions.set(s.id, s);
export const getStepExecution = (id: string) => stepExecutions.get(id) ?? null;
export const getAllStepExecutions = () => Array.from(stepExecutions.values());
export const getStepExecutionsForExecution = (execId: string) => Array.from(stepExecutions.values()).filter(s => s.executionId === execId);

export const storeApproval = (a: ApprovalRequest) => approvals.set(a.id, a);
export const getApproval = (id: string) => approvals.get(id) ?? null;
export const getAllApprovals = () => Array.from(approvals.values());
export const getApprovalsForExecution = (execId: string) => Array.from(approvals.values()).filter(a => a.executionId === execId);

export const storeSchedule = (s: WorkflowSchedule) => schedules.set(s.id, s);
export const getSchedule = (id: string) => schedules.get(id) ?? null;
export const getAllSchedules = () => Array.from(schedules.values());

export const storeTimer = (t: WorkflowTimer) => timers.set(t.id, t);
export const getTimer = (id: string) => timers.get(id) ?? null;
export const getAllTimers = () => Array.from(timers.values());

export const storeRetry = (r: RetryRecord) => retries.set(r.id, r);
export const getRetry = (id: string) => retries.get(id) ?? null;
export const getAllRetries = () => Array.from(retries.values());

export const storeCompensation = (c: CompensationStep) => compensations.set(c.id, c);
export const getCompensation = (id: string) => compensations.get(id) ?? null;
export const getAllCompensations = () => Array.from(compensations.values());

export const storeHumanTask = (t: HumanTask) => humanTasks.set(t.id, t);
export const getHumanTask = (id: string) => humanTasks.get(id) ?? null;
export const getAllHumanTasks = () => Array.from(humanTasks.values());

export const storeParallel = (p: ParallelExecution) => parallels.set(p.id, p);
export const getParallel = (id: string) => parallels.get(id) ?? null;
export const getAllParallels = () => Array.from(parallels.values());

export const storeEventTrigger = (t: EventTriggerRecord) => eventTriggers.set(t.id, t);
export const getEventTrigger = (id: string) => eventTriggers.get(id) ?? null;
export const getAllEventTriggers = () => Array.from(eventTriggers.values());

export const storeManualTrigger = (t: ManualTrigger) => manualTriggers.set(t.id, t);
export const getManualTrigger = (id: string) => manualTriggers.get(id) ?? null;
export const getAllManualTriggers = () => Array.from(manualTriggers.values());

export const storeTemplate = (t: WorkflowTemplate) => templates.set(t.id, t);
export const getTemplate = (id: string) => templates.get(id) ?? null;
export const getAllTemplates = () => Array.from(templates.values());

export const storeVersion = (v: WorkflowVersion) => versions.set(v.id, v);
export const getVersion = (id: string) => versions.get(id) ?? null;
export const getAllVersions = () => Array.from(versions.values());
export const getVersionsForWorkflow = (wfId: string) => Array.from(versions.values()).filter(v => v.workflowId === wfId);

export const fetchAgentWorkflows = async (_limit = 200) => getAllDefinitions();
export const fetchAutomationRules = async (_limit = 200) => [];
export const fetchAuditEvents = async (_limit = 200) => [];
export const fetchScheduledWorkflows = async (_limit = 200) => [];

export function _resetRepositoryForTesting() {
  definitions.clear(); executions.clear(); stateMachines.clear();
  stepExecutions.clear(); approvals.clear(); schedules.clear();
  timers.clear(); retries.clear(); compensations.clear();
  humanTasks.clear(); parallels.clear(); eventTriggers.clear();
  manualTriggers.clear(); templates.clear(); versions.clear();
}
