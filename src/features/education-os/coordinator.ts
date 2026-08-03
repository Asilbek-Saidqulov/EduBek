/**
 * EduBek — Agent Coordinator.
 *
 * Phase 4F.6: The Coordinator is the brain of the multi-agent system.
 * Responsibilities:
 *
 *   1. Receive a task (natural-language instruction or structured task).
 *   2. Determine which agents are required (based on task code + capabilities).
 *   3. Run independent agents concurrently; sequence dependent ones.
 *   4. Merge results into a unified response.
 *   5. Return the unified response with reasoning metadata.
 *
 * Example:
 *   User: "Create tomorrow's lesson"
 *   Coordinator:
 *     → TeacherAgent (lesson_planning)
 *     → CurriculumAgent (curriculum_alignment)
 *     → MarketplaceAgent (recommend_resources)
 *     → AssessmentAgent (question_generation)
 *     → PlannerAgent (daily_agenda)
 *     → Final merged response
 *
 * Adding a new agent:
 *   1. Implement the Agent interface (execute function + definition).
 *   2. Register it in the AGENT_REGISTRY below.
 *   3. Done. The coordinator picks it up automatically.
 */
import { getLogger } from "@/lib/logger";
import { executeTeacherTask, TEACHER_AGENT_DEFINITION } from "./teacher-agent";
import { executeStudentTask, STUDENT_AGENT_DEFINITION } from "./student-agent";
import { executeCurriculumTask, CURRICULUM_AGENT_DEFINITION } from "./curriculum-agent";
import { executeAssessmentTask, ASSESSMENT_AGENT_DEFINITION } from "./assessment-agent";
import { executeOrganizationTask, ORGANIZATION_AGENT_DEFINITION } from "./organization-agent";
import { executeMarketplaceTask, MARKETPLACE_AGENT_DEFINITION } from "./marketplace-agent";
import { executePlannerTask, PLANNER_AGENT_DEFINITION } from "./planner-agent";
import { executeNotificationTask, NOTIFICATION_AGENT_DEFINITION } from "./notification-agent";
import { executeAnalyticsTask, ANALYTICS_AGENT_DEFINITION } from "./analytics-agent";
import { storeMemory, recallContext } from "./memory";
import * as repo from "./repository";
import type {
  AgentDefinition,
  AgentResponse,
  AgentTask,
  AgentType,
  CoordinatorExecution,
} from "./types";

const log = getLogger("coordinator");

// ---------------------------------------------------------------------------
// Agent registry — the single source of truth for which agents exist.
// Adding a new agent is a one-line change here.
// ---------------------------------------------------------------------------

interface AgentRegistryEntry {
  definition: AgentDefinition;
  execute: (task: AgentTask) => Promise<AgentResponse>;
}

const AGENT_REGISTRY: Record<AgentType, AgentRegistryEntry> = {
  teacher: { definition: TEACHER_AGENT_DEFINITION, execute: executeTeacherTask },
  student: { definition: STUDENT_AGENT_DEFINITION, execute: executeStudentTask },
  curriculum: { definition: CURRICULUM_AGENT_DEFINITION, execute: executeCurriculumTask },
  assessment: { definition: ASSESSMENT_AGENT_DEFINITION, execute: executeAssessmentTask },
  organization: { definition: ORGANIZATION_AGENT_DEFINITION, execute: executeOrganizationTask },
  marketplace: { definition: MARKETPLACE_AGENT_DEFINITION, execute: executeMarketplaceTask },
  planner: { definition: PLANNER_AGENT_DEFINITION, execute: executePlannerTask },
  notification: { definition: NOTIFICATION_AGENT_DEFINITION, execute: executeNotificationTask },
  analytics: { definition: ANALYTICS_AGENT_DEFINITION, execute: executeAnalyticsTask },
};

export function listRegisteredAgents(): AgentDefinition[] {
  return Object.values(AGENT_REGISTRY).map((entry) => entry.definition);
}

export function getAgentDefinition(type: AgentType): AgentDefinition | null {
  return AGENT_REGISTRY[type]?.definition ?? null;
}

// ---------------------------------------------------------------------------
// Task → Agent routing
// ---------------------------------------------------------------------------

/**
 * Map a task code to the agent that owns it.
 * Each task code is namespaced by its agent prefix.
 */
function routeTaskToAgent(taskCode: string): AgentType | null {
  for (const [agentType, entry] of Object.entries(AGENT_REGISTRY) as Array<[AgentType, AgentRegistryEntry]>) {
    const capabilities = entry.definition.capabilities;
    if (capabilities.some((c) => c.code === taskCode)) {
      return agentType;
    }
  }
  return null;
}

/**
 * Determine which agents are needed for a natural-language instruction.
 * Uses keyword matching against agent capabilities.
 */
function determineAgentsForInstruction(instruction: string): AgentType[] {
  const lower = instruction.toLowerCase();
  const agents: AgentType[] = [];

  if (/(lesson|teach|classroom|student.*struggl|assignment|homework)/.test(lower)) {
    agents.push("teacher");
  }
  if (/(study|learn|review|practice|my\s+next|motivat|burnout|streak)/.test(lower)) {
    agents.push("student");
  }
  if (/(curriculum|standard|coverage|prerequisite|align|gap)/.test(lower)) {
    agents.push("curriculum");
  }
  if (/(quiz|assessment|test|question|mastery|predict|score)/.test(lower)) {
    agents.push("assessment");
  }
  if (/(organization|school|department|teacher.*performance|institutional)/.test(lower)) {
    agents.push("organization");
  }
  if (/(marketplace|buy|sell|monetiz|purchase|resource.*available)/.test(lower)) {
    agents.push("marketplace");
  }
  if (/(plan|schedule|agenda|weekly|daily|long.term)/.test(lower)) {
    agents.push("planner");
  }
  if (/(notif|alert|remind|warn|inform)/.test(lower)) {
    agents.push("notification");
  }
  if (/(dashboard|analytics|report|executive|summary|kpi|metric)/.test(lower)) {
    agents.push("analytics");
  }

  // Fallback: if no agents matched, route to student (the most general-purpose)
  if (agents.length === 0) agents.push("student");

  return agents;
}

// ---------------------------------------------------------------------------
// Main coordinator entry point
// ---------------------------------------------------------------------------

export async function execute(input: {
  instruction: string;
  task?: AgentTask;
  scopeType?: "user" | "classroom" | "organization" | "system";
  scopeId?: string;
  locale?: string;
  workflowId?: string;
}): Promise<CoordinatorExecution> {
  const start = Date.now();
  const { instruction, task, scopeType = "system", scopeId = "coordinator", locale = "en", workflowId } = input;

  log.info("coordinator.execute_started", { instruction: instruction.slice(0, 100), scopeType, scopeId });

  // Determine participating agents
  const participatingAgents: AgentType[] = task
    ? (routeTaskToAgent(task.code) ? [routeTaskToAgent(task.code)!] : determineAgentsForInstruction(instruction))
    : determineAgentsForInstruction(instruction);

  // Recall context from shared memory
  const context = await recallContext({ scopeType: scopeType as any, scopeId }).catch(() => ({
    conversations: [], goals: [], recentActions: [], context: [],
  }));

  // Build the task to execute (one per agent)
  const tasks: Array<{ agent: AgentType; task: AgentTask }> = participatingAgents.map((agent) => ({
    agent,
    task: task ?? {
      code: inferDefaultTaskCode(agent),
      instruction,
      params: extractParamsFromInstruction(instruction, agent, scopeType, scopeId),
      locale,
    },
  }));

  // Create execution log
  const executionLog = await repo.createExecutionLog({
    agentType: "coordinator",
    task: instruction.slice(0, 200),
    input: JSON.stringify({ participatingAgents, scopeType, scopeId }),
    status: "running",
    scopeType,
    scopeId,
    workflowId,
  }).catch(() => null);

  // Execute agents concurrently (they're independent — no inter-agent deps for single-shot)
  const responses: AgentResponse[] = await Promise.all(
    tasks.map(async ({ agent, task }) => {
      try {
        return await AGENT_REGISTRY[agent].execute(task);
      } catch (err) {
        log.error("coordinator.agent_failed", { agent, error: (err as Error).message });
        return {
          agentType: agent,
          task: task.code,
          result: null,
          reasoning: { confidence: 0, reasoning: `Agent failed: ${(err as Error).message}`, sources: [], affectedModules: [], recommendedNextActions: [] },
          executionMs: 0,
          status: "failed" as const,
          error: (err as Error).message,
        };
      }
    }),
  );

  // Merge responses into a unified result
  const unifiedResult = mergeResponses(responses);

  // Build reasoning metadata for the whole execution
  const reasoning = {
    confidence: responses.length > 0
      ? responses.reduce((s, r) => s + r.reasoning.confidence, 0) / responses.length
      : 0.3,
    reasoning: `Coordinator executed ${responses.length} agent(s) (${participatingAgents.join(", ")}) to fulfill: "${instruction}". ${responses.filter((r) => r.status === "completed").length} succeeded, ${responses.filter((r) => r.status === "failed").length} failed.`,
    reasoningKey: "educationOs.coordinator.reasoning",
    sources: responses.flatMap((r) => r.reasoning.sources).slice(0, 10),
    affectedModules: Array.from(new Set(responses.flatMap((r) => r.reasoning.affectedModules))),
    recommendedNextActions: responses
      .flatMap((r) => r.reasoning.recommendedNextActions)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5),
  };

  // Store a memory entry for this execution
  let memoryUpdated = false;
  try {
    await storeMemory({
      scopeType: scopeType as any,
      scopeId,
      type: "conversation",
      summary: `Coordinator execution: ${instruction.slice(0, 200)}`,
      payload: {
        participatingAgents,
        responses: responses.map((r) => ({ agent: r.agentType, task: r.task, status: r.status })),
        unifiedResultKeys: Object.keys(unifiedResult as any ?? {}),
      },
      importance: 0.7,
      agentType: undefined,
      workflowId,
    });
    memoryUpdated = true;
  } catch (err) {
    log.warn("coordinator.memory_store_failed", { error: (err as Error).message });
  }

  // Update the execution log
  if (executionLog) {
    await repo.updateExecutionLog(executionLog.id, {
      status: "completed",
      output: JSON.stringify(unifiedResult),
      confidence: reasoning.confidence,
      reasoning: reasoning.reasoning,
      sources: JSON.stringify(reasoning.sources),
      affectedModules: JSON.stringify(reasoning.affectedModules),
      executionMs: Date.now() - start,
    }).catch(() => undefined);
  }

  const executionMs = Date.now() - start;
  log.info("coordinator.execute_completed", {
    instruction: instruction.slice(0, 100),
    participatingAgents,
    executionMs,
    memoryUpdated,
  });

  return {
    instruction,
    participatingAgents,
    responses,
    unifiedResult,
    reasoning,
    executionMs,
    memoryUpdated,
    workflowId,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferDefaultTaskCode(agent: AgentType): string {
  // Pick the first capability of the agent as the default
  const definition = AGENT_REGISTRY[agent].definition;
  return definition.capabilities[0]?.code ?? "default";
}

function extractParamsFromInstruction(
  instruction: string,
  agent: AgentType,
  scopeType: string,
  scopeId: string,
): Record<string, unknown> {
  // Best-effort param extraction — for Phase 4F.6 we use the scope as
  // the primary param. A future LLM-enhanced version would parse the
  // instruction more precisely.
  const params: Record<string, unknown> = {};
  if (scopeType === "user") params.userId = scopeId;
  if (scopeType === "classroom") params.classroomId = scopeId;
  if (scopeType === "organization") params.organizationId = scopeId;
  if (agent === "teacher") params.teacherId = scopeId;
  return params;
}

function mergeResponses(responses: AgentResponse[]): unknown {
  if (responses.length === 0) return null;
  if (responses.length === 1) return responses[0]!.result;

  // Merge: keyed by agent type
  const merged: Record<string, unknown> = {};
  for (const r of responses) {
    merged[r.agentType] = r.result;
  }
  return merged;
}
