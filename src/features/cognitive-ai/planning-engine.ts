/**
 * EduBek — Planning Engine (System 2).
 *
 * Long-horizon planning. The AI plans several steps ahead before
 * answering. Example: "Create next month's Algebra plan" produces a
 * PlanningGraph with nodes for lessons, assignments, reviews,
 * assessments, revision, weak topics, marketplace resources, twin
 * updates, and recommendations.
 *
 * Plans are deterministic — no LLM call required for plan generation.
 * LLM is only used when the user explicitly asks for natural-language
 * plan narration.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { PlanningGraph, PlanNode, GoalKind } from "./types";

const log = getLogger("cognitive-planning-engine");

// ===========================================================================
// Built-in plan templates — deterministic plan generators
// ===========================================================================

interface PlanTemplate {
  id: string;
  objective: string;
  supportedGoals: GoalKind[];
  build: () => { nodes: PlanNode[]; dependencies: Array<{ from: string; to: string; type: "requires" | "informs" | "enables" }> };
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "monthly_curriculum_plan",
    objective: "Create next month's curriculum plan",
    supportedGoals: ["finish_curriculum", "increase_mastery"],
    build: () => ({
      nodes: [
        makeNode("assess_coverage", "Assess current curriculum coverage", "knowledge-intelligence", "assess_coverage", { cost: 0, duration: 5, confidence: 0.9, requiresLLM: false, inputs: ["classroom_id"], outputs: ["coverage_gaps", "weak_topics"] }),
        makeNode("identify_weak_topics", "Identify predicted weak topics", "knowledge-intelligence", "predict_weak_topics", { cost: 0, duration: 5, confidence: 0.75, requiresLLM: false, inputs: ["coverage_gaps"], outputs: ["weak_topics"] }),
        makeNode("plan_week1_lessons", "Plan Week 1 lessons", "learning-planner", "generate_lessons", { cost: 0, duration: 15, confidence: 0.8, requiresLLM: false, inputs: ["weak_topics"], outputs: ["lesson_plan_w1"] }),
        makeNode("plan_assignments", "Plan assignments for each week", "assessment-platform", "generate_assignments", { cost: 0, duration: 10, confidence: 0.85, requiresLLM: false, inputs: ["lesson_plan_w1"], outputs: ["assignments"] }),
        makeNode("plan_reviews", "Schedule spaced-repetition reviews", "learning-planner", "schedule_reviews", { cost: 0, duration: 5, confidence: 0.9, requiresLLM: false, inputs: ["assignments"], outputs: ["review_schedule"] }),
        makeNode("plan_assessments", "Plan formative + summative assessments", "assessment-platform", "generate_assessments", { cost: 0, duration: 15, confidence: 0.8, requiresLLM: false, inputs: ["review_schedule"], outputs: ["assessment_plan"] }),
        makeNode("plan_revision", "Schedule revision sessions", "learning-planner", "schedule_revision", { cost: 0, duration: 5, confidence: 0.85, requiresLLM: false, inputs: ["assessment_plan"], outputs: ["revision_plan"] }),
        makeNode("find_marketplace_resources", "Find marketplace resources for weak topics", "marketplace", "search_resources", { cost: 0, duration: 5, confidence: 0.7, requiresLLM: false, inputs: ["weak_topics"], outputs: ["marketplace_resources"] }),
        makeNode("update_digital_twin", "Update classroom digital twin with plan", "digital-twins", "sync_classroom_twin", { cost: 0, duration: 3, confidence: 0.9, requiresLLM: false, inputs: ["lesson_plan_w1", "assignments", "assessment_plan"], outputs: ["twin_updated"] }),
        makeNode("generate_recommendations", "Generate personalized recommendations", "discovery", "refresh_recommendations", { cost: 0, duration: 5, confidence: 0.85, requiresLLM: false, inputs: ["twin_updated"], outputs: ["recommendations"] }),
      ],
      dependencies: [
        { from: "assess_coverage", to: "identify_weak_topics", type: "requires" },
        { from: "identify_weak_topics", to: "plan_week1_lessons", type: "requires" },
        { from: "identify_weak_topics", to: "find_marketplace_resources", type: "informs" },
        { from: "plan_week1_lessons", to: "plan_assignments", type: "requires" },
        { from: "plan_assignments", to: "plan_reviews", type: "requires" },
        { from: "plan_reviews", to: "plan_assessments", type: "requires" },
        { from: "plan_assessments", to: "plan_revision", type: "requires" },
        { from: "plan_week1_lessons", to: "update_digital_twin", type: "enables" },
        { from: "plan_assignments", to: "update_digital_twin", type: "enables" },
        { from: "plan_assessments", to: "update_digital_twin", type: "enables" },
        { from: "update_digital_twin", to: "generate_recommendations", type: "requires" },
      ],
    }),
  },
  {
    id: "exam_preparation_plan",
    objective: "Prepare students for final exam",
    supportedGoals: ["prepare_exam", "increase_mastery"],
    build: () => ({
      nodes: [
        makeNode("analyze_past_performance", "Analyze past assessment performance", "assessment-platform", "analyze_performance", { cost: 0, duration: 5, confidence: 0.9, requiresLLM: false, inputs: ["student_ids"], outputs: ["performance_analysis"] }),
        makeNode("identify_weak_areas", "Identify weak areas per student", "knowledge-intelligence", "identify_weak_areas", { cost: 0, duration: 5, confidence: 0.85, requiresLLM: false, inputs: ["performance_analysis"], outputs: ["weak_areas"] }),
        makeNode("generate_practice_questions", "Generate targeted practice questions", "assessment-platform", "generate_practice", { cost: 0, duration: 10, confidence: 0.8, requiresLLM: true, inputs: ["weak_areas"], outputs: ["practice_questions"] }),
        makeNode("schedule_practice_sessions", "Schedule practice sessions", "learning-planner", "schedule_sessions", { cost: 0, duration: 5, confidence: 0.9, requiresLLM: false, inputs: ["practice_questions"], outputs: ["practice_schedule"] }),
        makeNode("generate_study_guide", "Generate study guide for weak areas", "ai-workspace", "generate_study_guide", { cost: 0.01, duration: 15, confidence: 0.75, requiresLLM: true, inputs: ["weak_areas"], outputs: ["study_guide"] }),
        makeNode("schedule_review", "Schedule pre-exam review session", "digital-twins", "schedule_review", { cost: 0, duration: 3, confidence: 0.9, requiresLLM: false, inputs: ["practice_schedule"], outputs: ["review_session"] }),
        makeNode("notify_students", "Notify students of study plan", "education-os", "notify", { cost: 0, duration: 2, confidence: 0.95, requiresLLM: false, inputs: ["study_guide", "practice_schedule", "review_session"], outputs: ["notifications_sent"] }),
      ],
      dependencies: [
        { from: "analyze_past_performance", to: "identify_weak_areas", type: "requires" },
        { from: "identify_weak_areas", to: "generate_practice_questions", type: "requires" },
        { from: "identify_weak_areas", to: "generate_study_guide", type: "requires" },
        { from: "generate_practice_questions", to: "schedule_practice_sessions", type: "requires" },
        { from: "schedule_practice_sessions", to: "schedule_review", type: "requires" },
        { from: "generate_study_guide", to: "notify_students", type: "enables" },
        { from: "schedule_practice_sessions", to: "notify_students", type: "enables" },
        { from: "schedule_review", to: "notify_students", type: "enables" },
      ],
    }),
  },
  {
    id: "dropout_intervention_plan",
    objective: "Intervene with at-risk students",
    supportedGoals: ["reduce_dropout", "improve_engagement"],
    build: () => ({
      nodes: [
        makeNode("identify_at_risk", "Identify at-risk students via twin", "digital-twins", "identify_at_risk", { cost: 0, duration: 5, confidence: 0.85, requiresLLM: false, inputs: ["classroom_id"], outputs: ["at_risk_students"] }),
        makeNode("analyze_root_causes", "Analyze root causes per student", "platform-intelligence", "analyze_causes", { cost: 0, duration: 10, confidence: 0.7, requiresLLM: true, inputs: ["at_risk_students"], outputs: ["root_causes"] }),
        makeNode("generate_intervention", "Generate personalized intervention plans", "ai-workspace", "generate_intervention", { cost: 0.02, duration: 15, confidence: 0.7, requiresLLM: true, inputs: ["root_causes"], outputs: ["intervention_plans"] }),
        makeNode("schedule_mentorship", "Schedule mentorship sessions", "education-os", "schedule_mentorship", { cost: 0, duration: 5, confidence: 0.9, requiresLLM: false, inputs: ["intervention_plans"], outputs: ["mentorship_schedule"] }),
        makeNode("notify_teachers", "Notify teachers of intervention plans", "education-os", "notify_teachers", { cost: 0, duration: 2, confidence: 0.95, requiresLLM: false, inputs: ["intervention_plans", "mentorship_schedule"], outputs: ["teachers_notified"] }),
        makeNode("track_outcomes", "Track intervention outcomes", "platform-intelligence", "track_outcomes", { cost: 0, duration: 5, confidence: 0.8, requiresLLM: false, inputs: ["intervention_plans"], outputs: ["outcome_tracking"] }),
      ],
      dependencies: [
        { from: "identify_at_risk", to: "analyze_root_causes", type: "requires" },
        { from: "analyze_root_causes", to: "generate_intervention", type: "requires" },
        { from: "generate_intervention", to: "schedule_mentorship", type: "requires" },
        { from: "generate_intervention", to: "notify_teachers", type: "enables" },
        { from: "schedule_mentorship", to: "notify_teachers", type: "enables" },
        { from: "generate_intervention", to: "track_outcomes", type: "informs" },
      ],
    }),
  },
];

// ===========================================================================
// Public API
// ===========================================================================

export async function createPlan(input: {
  objective: string;
  nodes: PlanNode[];
  dependencies: PlanningGraph["dependencies"];
  supportedGoals?: GoalKind[];
  createdBy?: string | null;
}): Promise<PlanningGraph> {
  const executionOrder = topologicalSort(input.nodes, input.dependencies);
  const estimatedCost = input.nodes.reduce((s, n) => s + n.estimatedCost, 0);
  const estimatedDuration = input.nodes.reduce((s, n) => s + n.estimatedDuration, 0);
  const confidence = input.nodes.length > 0
    ? input.nodes.reduce((s, n) => s + n.confidence, 0) / input.nodes.length
    : 0;
  const row = await repo.createPlan({
    objective: input.objective,
    nodes: input.nodes,
    dependencies: input.dependencies,
    executionOrder,
    estimatedCost: Math.round(estimatedCost * 10000) / 10000,
    estimatedDuration,
    confidence: Math.round(confidence * 100) / 100,
    supportedGoals: input.supportedGoals ?? [],
    createdBy: input.createdBy ?? null,
  });
  log.info("plan.created", { id: row.id, objective: input.objective, nodes: input.nodes.length });
  return mapPlan(row);
}

export async function getPlan(id: string): Promise<PlanningGraph | null> {
  const row = await repo.findPlan(id);
  return row ? mapPlan(row) : null;
}

export async function listPlans(limit = 20): Promise<PlanningGraph[]> {
  const rows = await repo.listPlans(limit);
  return rows.map(mapPlan);
}

export async function generatePlanFromTemplate(templateId: string, createdBy?: string): Promise<PlanningGraph | null> {
  const template = PLAN_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;
  const { nodes, dependencies } = template.build();
  return createPlan({
    objective: template.objective,
    nodes, dependencies, supportedGoals: template.supportedGoals, createdBy,
  });
}

export function listPlanTemplates(): Array<{ id: string; objective: string; supportedGoals: GoalKind[] }> {
  return PLAN_TEMPLATES.map(t => ({ id: t.id, objective: t.objective, supportedGoals: t.supportedGoals }));
}

/** Pick the best plan template for a given objective string. Deterministic. */
export function pickPlanTemplate(objective: string): string | null {
  const obj = objective.toLowerCase();
  if (obj.includes("month") || obj.includes("curriculum") || obj.includes("algebra")) {
    return "monthly_curriculum_plan";
  }
  if (obj.includes("exam") || obj.includes("final") || obj.includes("test")) {
    return "exam_preparation_plan";
  }
  if (obj.includes("dropout") || obj.includes("at-risk") || obj.includes("intervention")) {
    return "dropout_intervention_plan";
  }
  return null;
}

// ===========================================================================
// Helpers
// ===========================================================================

function makeNode(id: string, label: string, module: string, action: string, opts: {
  cost: number; duration: number; confidence: number; requiresLLM: boolean;
  inputs: string[]; outputs: string[];
}): PlanNode {
  return {
    id, label, module, action,
    estimatedCost: opts.cost, estimatedDuration: opts.duration,
    confidence: opts.confidence, requiresLLM: opts.requiresLLM,
    inputs: opts.inputs, outputs: opts.outputs, status: "pending",
  };
}

/** Topological sort via Kahn's algorithm. Deterministic. */
export function topologicalSort(nodes: PlanNode[], dependencies: PlanningGraph["dependencies"]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const dep of dependencies) {
    adj.get(dep.from)?.push(dep.to);
    inDegree.set(dep.to, (inDegree.get(dep.to) ?? 0) + 1);
  }
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }
  const result: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    result.push(id);
    for (const next of adj.get(id) ?? []) {
      const newDeg = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, newDeg);
      if (newDeg === 0) queue.push(next);
    }
  }
  // If there's a cycle, append remaining nodes (best-effort)
  if (result.length < nodes.length) {
    for (const n of nodes) {
      if (!result.includes(n.id)) result.push(n.id);
    }
  }
  return result;
}

function mapPlan(row: Awaited<ReturnType<typeof repo.createPlan>>): PlanningGraph {
  return {
    id: row.id,
    objective: row.objective,
    nodes: repo.safeParse<PlanNode[]>(row.nodes, []),
    dependencies: repo.safeParse(row.dependencies, []),
    executionOrder: repo.safeParse<string[]>(row.executionOrder, []),
    estimatedCost: row.estimatedCost,
    estimatedDuration: row.estimatedDuration,
    confidence: row.confidence,
    supportedGoals: repo.safeParse(row.supportedGoals, []),
    createdAt: row.createdAt.toISOString(),
  };
}
