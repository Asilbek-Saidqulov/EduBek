/**
 * EduBek — Workflow Engine.
 *
 * Phase 4F.6: Multi-step orchestrated agent executions. Each workflow
 * is a reusable, ordered sequence of agent tasks. Supported workflows:
 *
 *   • generate_lesson     — Teacher → Curriculum → Marketplace → Assessment → Planner
 *   • create_quiz         — Curriculum → Assessment
 *   • create_homework     — Teacher → Assessment → Planner
 *   • intervention        — Teacher → Assessment → Notification
 *   • curriculum_alignment — Curriculum → Analytics
 *   • student_support     — Student → Planner → Notification
 *   • marketplace_compare — Marketplace → Analytics
 *   • full_teaching_cycle — Generate Lesson → Analyze Curriculum → Search Marketplace → Generate Quiz → Create Homework → Schedule Review → Notify Students
 *
 * Workflows persist their progress (steps + status) to the AgentWorkflow
 * table so they can be inspected / resumed if interrupted.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { execute as coordinatorExecute } from "./coordinator";
import { storeMemory } from "./memory";
import type {
  AgentType,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowStep,
  WorkflowType,
} from "./types";

const log = getLogger("workflow-engine");

// ---------------------------------------------------------------------------
// Built-in workflow definitions
// ---------------------------------------------------------------------------

const WORKFLOW_DEFINITIONS: Record<WorkflowType, WorkflowDefinition> = {
  generate_lesson: {
    type: "generate_lesson",
    name: "Generate Lesson",
    description: "Generate a complete lesson plan with curriculum alignment, marketplace recommendations, assessments, and daily agenda.",
    steps: [
      { agent: "teacher", task: "lesson_planning" },
      { agent: "curriculum", task: "curriculum_alignment" },
      { agent: "marketplace", task: "recommend_resources" },
      { agent: "assessment", task: "question_generation" },
      { agent: "planner", task: "daily_agenda" },
    ],
  },
  create_quiz: {
    type: "create_quiz",
    name: "Create Quiz",
    description: "Generate a quiz aligned with curriculum standards.",
    steps: [
      { agent: "curriculum", task: "curriculum_alignment" },
      { agent: "assessment", task: "question_generation" },
    ],
  },
  create_homework: {
    type: "create_homework",
    name: "Create Homework",
    description: "Plan + create homework assignments with assessments and a daily agenda.",
    steps: [
      { agent: "teacher", task: "assignment_planning" },
      { agent: "assessment", task: "question_generation" },
      { agent: "planner", task: "daily_agenda" },
    ],
  },
  intervention: {
    type: "intervention",
    name: "Intervention Workflow",
    description: "Generate interventions for at-risk students and notify the teacher.",
    steps: [
      { agent: "teacher", task: "intervention_suggestions" },
      { agent: "assessment", task: "weak_topic_detection" },
      { agent: "notification", task: "teacher_notifications" },
    ],
  },
  curriculum_alignment: {
    type: "curriculum_alignment",
    name: "Curriculum Alignment",
    description: "Analyze curriculum alignment and generate a dashboard.",
    steps: [
      { agent: "curriculum", task: "coverage_gaps" },
      { agent: "analytics", task: "school_dashboard" },
    ],
  },
  student_support: {
    type: "student_support",
    name: "Student Support",
    description: "Provide end-to-end student support: personalized study + plan + notifications.",
    steps: [
      { agent: "student", task: "personalized_study" },
      { agent: "planner", task: "daily_agenda" },
      { agent: "notification", task: "student_notifications" },
    ],
  },
  marketplace_compare: {
    type: "marketplace_compare",
    name: "Marketplace Compare",
    description: "Compare generate-vs-buy options and produce analytics.",
    steps: [
      { agent: "marketplace", task: "compare_generate_vs_buy" },
      { agent: "analytics", task: "school_dashboard" },
    ],
  },
  full_teaching_cycle: {
    type: "full_teaching_cycle",
    name: "Full Teaching Cycle",
    description: "End-to-end teaching cycle: generate lesson → analyze curriculum → search marketplace → generate quiz → create homework → schedule review → notify students.",
    steps: [
      { agent: "teacher", task: "lesson_planning" },
      { agent: "curriculum", task: "curriculum_alignment" },
      { agent: "marketplace", task: "recommend_resources" },
      { agent: "assessment", task: "question_generation" },
      { agent: "teacher", task: "assignment_planning" },
      { agent: "planner", task: "daily_agenda" },
      { agent: "notification", task: "teacher_notifications" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function listWorkflowTypes(): WorkflowType[] {
  return Object.keys(WORKFLOW_DEFINITIONS) as WorkflowType[];
}

export function getWorkflowDefinition(type: WorkflowType): WorkflowDefinition | null {
  return WORKFLOW_DEFINITIONS[type] ?? null;
}

export async function executeWorkflow(input: {
  type: WorkflowType;
  initiatedBy: string;
  scopeType: "user" | "classroom" | "organization" | "system";
  scopeId: string;
  params?: Record<string, unknown>;
  locale?: string;
}): Promise<WorkflowExecution> {
  const start = Date.now();
  const def = WORKFLOW_DEFINITIONS[input.type];
  if (!def) throw new Error(`Unknown workflow type: ${input.type}`);

  log.info("workflow.started", { type: input.type, initiatedBy: input.initiatedBy });

  // Create the workflow row
  const workflowRow = await repo.createWorkflow({
    type: input.type,
    initiatedBy: input.initiatedBy,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    status: "running",
    participatingAgents: JSON.stringify(Array.from(new Set(def.steps.map((s) => s.agent)))),
    steps: JSON.stringify(def.steps.map((s, i) => ({
      id: `step-${i + 1}`,
      agent: s.agent,
      task: s.task,
      status: "pending",
    }))),
  });

  await repo.updateWorkflow(workflowRow.id, { startedAt: new Date() });

  // Execute each step sequentially (workflows have ordered dependencies)
  const steps: WorkflowStep[] = def.steps.map((s, i) => ({
    id: `step-${i + 1}`,
    agent: s.agent,
    task: s.task,
    status: "pending" as const,
  }));

  for (const step of steps) {
    const stepStart = Date.now();
    step.status = "running";
    step.startedAt = new Date().toISOString();
    await updateWorkflowSteps(workflowRow.id, steps);

    try {
      // Execute the step via the coordinator (single-agent task)
      const execution = await coordinatorExecute({
        instruction: `Workflow step: ${step.task} for ${input.scopeType}:${input.scopeId}`,
        task: {
          code: step.task,
          params: { ...input.params, ...(input.scopeType === "user" ? { userId: input.scopeId } : {}), ...(input.scopeType === "classroom" ? { classroomId: input.scopeId } : {}), ...(input.scopeType === "organization" ? { organizationId: input.scopeId } : {}) },
          locale: input.locale ?? "en",
        },
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        locale: input.locale,
        workflowId: workflowRow.id,
      });

      step.status = "completed";
      step.completedAt = new Date().toISOString();
      step.result = execution.unifiedResult;
    } catch (err) {
      step.status = "failed";
      step.completedAt = new Date().toISOString();
      step.error = (err as Error).message;
      log.error("workflow.step_failed", { type: input.type, step: step.id, error: (err as Error).message });
      // Continue with remaining steps (best-effort) rather than aborting the whole workflow
    }
    await updateWorkflowSteps(workflowRow.id, steps);
  }

  // Build the final result
  const result = steps.reduce((acc: Record<string, unknown>, step) => {
    acc[`${step.agent}_${step.task}`] = step.result;
    return acc;
  }, {});

  const executionMs = Date.now() - start;
  const status = steps.every((s) => s.status === "completed") ? "completed" : steps.some((s) => s.status === "completed") ? "completed" : "failed";

  await repo.updateWorkflow(workflowRow.id, {
    status,
    result: JSON.stringify(result),
    executionMs,
    completedAt: new Date(),
  });

  // Store a memory entry
  await storeMemory({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    type: "workflow",
    summary: `Workflow ${input.type} ${status} in ${executionMs}ms`,
    payload: { workflowId: workflowRow.id, type: input.type, status, stepCount: steps.length },
    importance: 0.8,
    workflowId: workflowRow.id,
  });

  log.info("workflow.completed", { type: input.type, status, executionMs });

  const updated = await repo.findWorkflow(workflowRow.id);
  return mapWorkflow(updated!);
}

export async function getWorkflow(id: string): Promise<WorkflowExecution | null> {
  const row = await repo.findWorkflow(id);
  return row ? mapWorkflow(row) : null;
}

export async function listWorkflows(input: {
  initiatedBy?: string;
  scopeType?: string;
  scopeId?: string;
  type?: string;
  status?: string;
  limit?: number;
}): Promise<WorkflowExecution[]> {
  const rows = await repo.findWorkflows(input);
  return rows.map(mapWorkflow);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function updateWorkflowSteps(workflowId: string, steps: WorkflowStep[]): Promise<void> {
  await repo.updateWorkflow(workflowId, { steps: JSON.stringify(steps) });
}

function mapWorkflow(row: any): WorkflowExecution {
  return {
    id: row.id,
    type: row.type as WorkflowType,
    initiatedBy: row.initiatedBy,
    scopeType: row.scopeType,
    scopeId: row.scopeId,
    status: row.status,
    steps: safeParseArray<WorkflowStep>(row.steps),
    result: safeParse(row.result, null),
    participatingAgents: safeParseArray<AgentType>(row.participatingAgents),
    executionMs: row.executionMs,
    error: row.error,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
