/**
 * EduBek — Education OS main service.
 *
 * Phase 4F.6: Public-facing service functions that compose the
 * Coordinator, Workflow Engine, Automation Engine, Simulation Engine,
 * and Shared Memory into a unified API surface.
 *
 * Every function is a thin orchestrator — heavy lifting lives in
 * the sub-modules.
 */
import { getLogger } from "@/lib/logger";
import { execute as coordinatorExecute, listRegisteredAgents, getAgentDefinition } from "./coordinator";
import {
  executeWorkflow,
  getWorkflow,
  listWorkflows,
  listWorkflowTypes,
  getWorkflowDefinition,
} from "./workflow";
import {
  ensureAutomationRegistered,
  seedBuiltinPolicies,
  listAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  deleteAutomation,
} from "./automation";
import {
  simulate,
  getSimulation,
  listSimulations,
} from "./simulation";
import {
  storeMemory,
  recallMemory,
  recallContext,
  getMemory,
  deleteMemory,
  countMemories,
  pruneExpiredMemories,
} from "./memory";
import * as repo from "./repository";
import type {
  AgentDefinition,
  AgentMemoryDto,
  AgentTask,
  AgentType,
  AutomationRuleDto,
  CoordinatorExecution,
  CreateAutomationInput,
  CreateMemoryInput,
  EducationOsRecommendation,
  EducationOsStatus,
  SimulationInput,
  SimulationResultDto,
  WorkflowExecution,
  WorkflowType,
} from "./types";

const log = getLogger("education-os");

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export async function getStatus(): Promise<EducationOsStatus> {
  const agents = listRegisteredAgents();
  const [workflowCount, automationCount, memoryCount] = await Promise.all([
    repo.countWorkflows().catch(() => 0),
    import("./repository").then((m) => m.countEnabledAutomations()).catch(() => 0),
    countMemories().catch(() => 0),
  ]);

  return {
    status: "operational",
    registeredAgents: agents.map((a) => a.type),
    agentCount: agents.length,
    workflowsExecuted: workflowCount,
    automationsEnabled: automationCount,
    memoryEntries: memoryCount,
    uptime: process.uptime ? `${Math.round(process.uptime())}s` : "unknown",
    version: "edubek-education-os-v1",
  };
}

// ---------------------------------------------------------------------------
// Execute (single-shot coordinator execution)
// ---------------------------------------------------------------------------

export async function execute(input: {
  instruction: string;
  task?: AgentTask;
  scopeType?: "user" | "classroom" | "organization" | "system";
  scopeId?: string;
  locale?: string;
}): Promise<CoordinatorExecution> {
  // Ensure automations are registered (idempotent)
  ensureAutomationRegistered();
  return coordinatorExecute(input);
}

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

export async function runWorkflow(input: {
  type: WorkflowType;
  initiatedBy: string;
  scopeType: "user" | "classroom" | "organization" | "system";
  scopeId: string;
  params?: Record<string, unknown>;
  locale?: string;
}): Promise<WorkflowExecution> {
  return executeWorkflow(input);
}

export async function getWorkflowExecution(id: string): Promise<WorkflowExecution | null> {
  return getWorkflow(id);
}

export async function listWorkflowExecutions(input: {
  initiatedBy?: string;
  scopeType?: string;
  scopeId?: string;
  type?: string;
  status?: string;
  limit?: number;
}): Promise<WorkflowExecution[]> {
  return listWorkflows(input);
}

export function listAllWorkflowTypes(): WorkflowType[] {
  return listWorkflowTypes();
}

export function getWorkflowTypeDef(type: WorkflowType) {
  return getWorkflowDefinition(type);
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export function listAgents(): AgentDefinition[] {
  return listRegisteredAgents();
}

export function getAgent(type: AgentType): AgentDefinition | null {
  return getAgentDefinition(type);
}

// ---------------------------------------------------------------------------
// Agent chat (natural-language conversation with an agent)
// ---------------------------------------------------------------------------

export async function chatWithAgent(input: {
  agentType: AgentType;
  message: string;
  scopeType?: "user" | "classroom" | "organization" | "system";
  scopeId?: string;
  locale?: string;
}): Promise<CoordinatorExecution> {
  // Store the user's message in memory
  await storeMemory({
    scopeType: input.scopeType ?? "system",
    scopeId: input.scopeId ?? "chat",
    type: "conversation",
    summary: `User: ${input.message}`,
    payload: { role: "user", agent: input.agentType, message: input.message },
    importance: 0.7,
  }).catch(() => undefined);

  // Execute via the coordinator with the specified agent
  const execution = await coordinatorExecute({
    instruction: input.message,
    scopeType: input.scopeType ?? "system",
    scopeId: input.scopeId ?? "chat",
    locale: input.locale ?? "en",
  });

  // Store the agent's response in memory
  await storeMemory({
    scopeType: input.scopeType ?? "system",
    scopeId: input.scopeId ?? "chat",
    type: "conversation",
    summary: `Agent (${input.agentType}): ${execution.reasoning.reasoning.slice(0, 200)}`,
    payload: { role: "agent", agent: input.agentType, response: execution.unifiedResult },
    importance: 0.7,
    agentType: input.agentType,
  }).catch(() => undefined);

  return execution;
}

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

export async function storeAgentMemory(input: CreateMemoryInput): Promise<AgentMemoryDto> {
  return storeMemory(input);
}

export async function recallAgentMemory(input: {
  scopeType: "user" | "classroom" | "organization" | "system";
  scopeId: string;
  type?: any;
  agentType?: AgentType;
  limit?: number;
}): Promise<AgentMemoryDto[]> {
  return recallMemory(input);
}

export async function getAgentMemory(id: string): Promise<AgentMemoryDto | null> {
  return getMemory(id);
}

export async function deleteAgentMemory(id: string): Promise<void> {
  return deleteMemory(id);
}

export async function pruneMemory(): Promise<number> {
  return pruneExpiredMemories();
}

// ---------------------------------------------------------------------------
// Automations
// ---------------------------------------------------------------------------

export async function listAutomationRules(input: {
  ownerId?: string;
  scopeType?: string;
  scopeId?: string;
  enabled?: boolean;
  limit?: number;
}): Promise<AutomationRuleDto[]> {
  return listAutomations(input);
}

export async function getAutomationRule(id: string): Promise<AutomationRuleDto | null> {
  return getAutomation(id);
}

export async function createAutomationRule(input: CreateAutomationInput & { ownerId: string }): Promise<AutomationRuleDto> {
  ensureAutomationRegistered();
  return createAutomation(input);
}

export async function updateAutomationRule(id: string, input: Partial<{
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationRuleDto["trigger"];
  actions: AutomationRuleDto["actions"];
  maxPerHour: number;
}>): Promise<AutomationRuleDto | null> {
  return updateAutomation(id, input);
}

export async function deleteAutomationRule(id: string): Promise<void> {
  return deleteAutomation(id);
}

export async function seedBuiltinAutomationPolicies(ownerId: string, scopeType: "user" | "classroom" | "organization" | "system" = "system", scopeId: string = "system"): Promise<void> {
  ensureAutomationRegistered();
  return seedBuiltinPolicies(ownerId, scopeType, scopeId);
}

// ---------------------------------------------------------------------------
// Simulations
// ---------------------------------------------------------------------------

export async function runSimulation(input: SimulationInput): Promise<SimulationResultDto> {
  return simulate(input);
}

export async function getSimulationResult(id: string): Promise<SimulationResultDto | null> {
  return getSimulation(id);
}

export async function listSimulationResults(input: { scenario?: string; limit?: number }): Promise<SimulationResultDto[]> {
  return listSimulations(input);
}

// ---------------------------------------------------------------------------
// Recommendations (top recommendations across all agents)
// ---------------------------------------------------------------------------

export async function getRecommendations(input: {
  scopeType: "user" | "classroom" | "organization" | "system";
  scopeId: string;
  limit?: number;
  locale?: string;
}): Promise<EducationOsRecommendation[]> {
  const recommendations: EducationOsRecommendation[] = [];

  // Run a coordinator execution that asks each agent for its top recommendation
  const execution = await coordinatorExecute({
    instruction: "What should I do next?",
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    locale: input.locale ?? "en",
  });

  // Convert agent responses into EducationOsRecommendation entries
  for (const response of execution.responses) {
    if (response.status !== "completed") continue;
    const nextActions = response.reasoning.recommendedNextActions.slice(0, 1);
    for (const action of nextActions) {
      recommendations.push({
        id: `${response.agentType}-${action.code}-${Date.now()}`,
        agentType: response.agentType,
        type: action.code,
        title: action.description,
        description: response.reasoning.reasoning,
        reasonKey: response.reasoning.reasoningKey ?? "educationOs.recommendation.default",
        confidence: response.reasoning.confidence,
        priority: action.priority,
        actionItems: [action.description],
        actionItemKeys: [action.descriptionKey ?? "educationOs.recommendation.action"],
        estimatedImpactPct: Math.round(response.reasoning.confidence * 15),
      });
    }
  }

  // Sort by priority + confidence
  recommendations.sort((a, b) => a.priority - b.priority || b.confidence - a.confidence);
  return recommendations.slice(0, input.limit ?? 10);
}

// ---------------------------------------------------------------------------
// Analytics (executive dashboard summary)
// ---------------------------------------------------------------------------

export async function getAnalyticsSummary(input: {
  organizationId?: string;
  level?: "teacher" | "department" | "school" | "district";
  scopeId?: string;
  locale?: string;
}): Promise<{
  level: string;
  summary: string;
  metrics: Record<string, number>;
  recommendations: EducationOsRecommendation[];
}> {
  const { executeAnalyticsTask } = await import("./analytics-agent");
  const level = input.level ?? "school";
  const scopeId = input.scopeId ?? input.organizationId ?? "system";

  const response = await executeAnalyticsTask({
    code: `${level}_dashboard` as any,
    params: input.organizationId
      ? { organizationId: input.organizationId }
      : { teacherId: scopeId },
    locale: input.locale ?? "en",
  });

  const dashboard = response.result as any;
  const metrics: Record<string, number> = dashboard
    ? {
        curriculumCompletion: dashboard.curriculumCompletion ?? 0,
        knowledgeHealth: dashboard.knowledgeHealth ?? 0,
        teacherEffectiveness: dashboard.teacherEffectiveness ?? 0,
        studentEngagement: dashboard.studentEngagement ?? 0,
        dropoutRisk: dashboard.dropoutRisk ?? 0,
        marketplaceAdoption: dashboard.marketplaceAdoption ?? 0,
        aiUsage: dashboard.aiUsage ?? 0,
        certificationProgress: dashboard.certificationProgress ?? 0,
        learningVelocity: dashboard.learningVelocity ?? 0,
      }
    : {};

  return {
    level,
    summary: dashboard?.aiSummary ?? "No analytics available.",
    metrics,
    recommendations: [],
  };
}
