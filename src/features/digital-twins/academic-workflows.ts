/**
 * EduBek — Autonomous Academic Workflows.
 *
 * Phase 5A.1: Event-triggered multi-step automations that cascade
 * through the platform. Example:
 *
 *   Quiz Finished
 *     ↓
 *   Update mastery
 *     ↓
 *   Update digital twin
 *     ↓
 *   Recompute learning plan
 *     ↓
 *   Recommend review
 *     ↓
 *   Notify teacher if needed
 *     ↓
 *   Generate intervention
 *     ↓
 *   Schedule spaced repetition
 *     ↓
 *   Update institutional dashboard
 *
 * Each workflow is persisted to AcademicWorkflow for audit + resume.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { syncStudentTwin } from "./student-twin";
import { syncClassroomTwin } from "./classroom-twin";
import { execute as coordinatorExecute } from "@/features/education-os/coordinator";
import { generateCoachRecommendations } from "@/features/learning-planner";
import { recordAudit } from "@/features/platform-intelligence/audit";
import type { AcademicWorkflowDto, AcademicWorkflowStep, AcademicWorkflowTrigger } from "./types";

const log = getLogger("academic-workflows");

// ---------------------------------------------------------------------------
// Workflow definitions
// ---------------------------------------------------------------------------

const WORKFLOW_DEFINITIONS: Record<string, { trigger: string; steps: Array<{ agent: string; task: string }> }> = {
  post_quiz_cascade: {
    trigger: "quiz_finished",
    steps: [
      { agent: "student", task: "personalized_study" },
      { agent: "planner", task: "daily_agenda" },
      { agent: "notification", task: "student_notifications" },
      { agent: "assessment", task: "weak_topic_detection" },
    ],
  },
  at_risk_intervention: {
    trigger: "student_at_risk",
    steps: [
      { agent: "teacher", task: "intervention_suggestions" },
      { agent: "notification", task: "teacher_notifications" },
      { agent: "planner", task: "daily_agenda" },
    ],
  },
  curriculum_gap_response: {
    trigger: "curriculum_gap",
    steps: [
      { agent: "curriculum", task: "coverage_gaps" },
      { agent: "marketplace", task: "recommend_resources" },
      { agent: "teacher", task: "ai_resource_generation" },
      { agent: "notification", task: "organization_notifications" },
    ],
  },
  semester_prep: {
    trigger: "semester_start",
    steps: [
      { agent: "curriculum", task: "curriculum_alignment" },
      { agent: "teacher", task: "lesson_planning" },
      { agent: "analytics", task: "school_dashboard" },
    ],
  },
  exam_period_prep: {
    trigger: "exam_period_start",
    steps: [
      { agent: "assessment", task: "assessment_planning" },
      { agent: "student", task: "review_scheduling" },
      { agent: "notification", task: "student_notifications" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Main entry point: trigger a workflow
// ---------------------------------------------------------------------------

export async function triggerWorkflow(input: {
  trigger: AcademicWorkflowTrigger;
  scopeType?: string;
  scopeId?: string;
  triggerEntityId?: string;
  params?: Record<string, unknown>;
  locale?: string;
}): Promise<AcademicWorkflowDto> {
  const start = Date.now();
  const { trigger, scopeType, scopeId, triggerEntityId, params = {}, locale = "en" } = input;

  // Find the workflow definition for this trigger
  const def = Object.values(WORKFLOW_DEFINITIONS).find((d) => d.trigger === trigger);
  if (!def) {
    throw new Error(`No workflow defined for trigger: ${trigger}`);
  }

  log.info("workflow.triggered", { trigger, scopeType, scopeId, triggerEntityId });

  // Create the workflow row
  const workflowRow = await repo.createAcademicWorkflow({
    trigger,
    name: Object.keys(WORKFLOW_DEFINITIONS).find((k) => WORKFLOW_DEFINITIONS[k]!.trigger === trigger)!,
    scopeType,
    scopeId,
    status: "running",
    triggerEntityId,
    steps: JSON.stringify(def.steps.map((s, i) => ({
      step: i + 1,
      agent: s.agent,
      task: s.task,
      status: "pending",
    }))),
  });

  await repo.updateAcademicWorkflow(workflowRow.id, { startedAt: new Date() });

  // Execute steps sequentially
  const steps: AcademicWorkflowStep[] = def.steps.map((s, i) => ({
    step: i + 1,
    agent: s.agent,
    task: s.task,
    status: "pending" as const,
  }));

  for (const step of steps) {
    const stepStart = Date.now();
    step.status = "running";
    step.startedAt = new Date().toISOString();
    await updateSteps(workflowRow.id, steps);

    try {
      // Execute the step via the coordinator
      const execution = await coordinatorExecute({
        instruction: `Academic workflow step: ${step.task}`,
        task: {
          code: step.task,
          params: { ...params, ...(scopeType === "user" ? { userId: scopeId } : {}), ...(scopeType === "classroom" ? { classroomId: scopeId } : {}) },
          locale,
        },
        scopeType: (scopeType ?? "system") as any,
        scopeId: scopeId ?? "system",
        locale,
      });

      step.status = "completed";
      step.completedAt = new Date().toISOString();
      step.result = execution.unifiedResult;
    } catch (err) {
      step.status = "failed";
      step.completedAt = new Date().toISOString();
      step.error = (err as Error).message;
      log.error("workflow.step_failed", { trigger, step: step.step, error: (err as Error).message });
    }
    await updateSteps(workflowRow.id, steps);
  }

  // Update digital twins if applicable
  if (scopeType === "user" && scopeId) {
    await syncStudentTwin(scopeId).catch(() => undefined);
  }
  if (scopeType === "classroom" && scopeId) {
    await syncClassroomTwin(scopeId).catch(() => undefined);
  }

  // Record an audit event
  await recordAudit({
    actionType: "workflow_execution",
    actorType: "system",
    actorId: workflowRow.id,
    entityType: "workflow",
    entityId: workflowRow.id,
    affectedUserId: scopeType === "user" ? scopeId : undefined,
    scopeType: scopeType ?? "system",
    scopeId: scopeId ?? "system",
    reasoning: {
      inputs: { trigger, triggerEntityId },
      reasoning: `Academic workflow triggered by ${trigger}`,
      confidence: 0.85,
      affectedModules: ["digital-twins", "education-os"],
    },
    confidence: 0.85,
  }).catch(() => undefined);

  const executionMs = Date.now() - start;
  const status = steps.every((s) => s.status === "completed") ? "completed" : steps.some((s) => s.status === "completed") ? "completed" : "failed";

  await repo.updateAcademicWorkflow(workflowRow.id, {
    status,
    result: JSON.stringify(steps.reduce((acc: Record<string, unknown>, s) => {
      acc[`${s.agent}_${s.task}`] = s.result;
      return acc;
    }, {})),
    executionMs,
    completedAt: new Date(),
  });

  log.info("workflow.completed", { trigger, status, executionMs });

  const updated = await repo.findAcademicWorkflow(workflowRow.id);
  return mapWorkflow(updated!);
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function getWorkflow(id: string): Promise<AcademicWorkflowDto | null> {
  const row = await repo.findAcademicWorkflow(id);
  return row ? mapWorkflow(row) : null;
}

export async function listWorkflows(input: {
  trigger?: string;
  scopeType?: string;
  scopeId?: string;
  status?: string;
  limit?: number;
}): Promise<AcademicWorkflowDto[]> {
  const rows = await repo.findAcademicWorkflows(input);
  return rows.map(mapWorkflow);
}

export function listWorkflowTriggers(): string[] {
  return Object.values(WORKFLOW_DEFINITIONS).map((d) => d.trigger);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function updateSteps(workflowId: string, steps: AcademicWorkflowStep[]): Promise<void> {
  await repo.updateAcademicWorkflow(workflowId, { steps: JSON.stringify(steps) });
}

function mapWorkflow(row: any): AcademicWorkflowDto {
  return {
    id: row.id,
    trigger: row.trigger,
    name: row.name,
    scopeType: row.scopeType,
    scopeId: row.scopeId,
    steps: safeParseArray<AcademicWorkflowStep>(row.steps),
    status: row.status,
    result: safeParse(row.result),
    executionMs: row.executionMs,
    triggerEntityId: row.triggerEntityId,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
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
