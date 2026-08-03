/**
 * EduBek — Goal Engine (System 3).
 *
 * AI should understand goals. Every recommendation should support one
 * or more goals. The goal engine defines goal templates, ranks goals by
 * priority, detects conflicts, and tracks progress.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { CognitiveGoal, GoalKind } from "./types";

const log = getLogger("cognitive-goal-engine");

// ===========================================================================
// Goal templates — default goals for the platform
// ===========================================================================

export const GOAL_TEMPLATES: Array<{
  kind: GoalKind;
  title: string;
  description: string;
  defaultPriority: number;
  contributingModules: string[];
}> = [
  {
    kind: "increase_mastery",
    title: "Increase Student Mastery",
    description: "Raise the average mastery score across all concepts for active students.",
    defaultPriority: 80,
    contributingModules: ["knowledge-intelligence", "learning-planner", "assessment-platform"],
  },
  {
    kind: "reduce_dropout",
    title: "Reduce Dropout Rate",
    description: "Lower the percentage of students who disengage or leave the platform.",
    defaultPriority: 85,
    contributingModules: ["digital-twins", "platform-intelligence", "education-os"],
  },
  {
    kind: "improve_engagement",
    title: "Improve Student Engagement",
    description: "Increase daily active learning time, session frequency, and participation.",
    defaultPriority: 70,
    contributingModules: ["discovery", "learning-planner", "learning-studio"],
  },
  {
    kind: "prepare_sat",
    title: "Prepare Students for SAT",
    description: "Ensure students are ready for standardized college admissions tests.",
    defaultPriority: 60,
    contributingModules: ["assessment-platform", "learning-planner", "knowledge-intelligence"],
  },
  {
    kind: "finish_curriculum",
    title: "Finish Curriculum on Time",
    description: "Complete all curriculum standards by the end of the academic period.",
    defaultPriority: 75,
    contributingModules: ["knowledge-intelligence", "digital-twins", "civilization-engine"],
  },
  {
    kind: "prepare_exam",
    title: "Prepare Students for Final Exams",
    description: "Ensure students are ready for end-of-term or certification exams.",
    defaultPriority: 78,
    contributingModules: ["assessment-platform", "learning-planner", "discovery"],
  },
  {
    kind: "reduce_teacher_workload",
    title: "Reduce Teacher Workload",
    description: "Automate repetitive tasks so teachers can focus on high-value interactions.",
    defaultPriority: 65,
    contributingModules: ["ai-workspace", "assessment-platform", "education-os"],
  },
  {
    kind: "improve_revenue",
    title: "Improve Marketplace Revenue",
    description: "Grow creator earnings and platform marketplace revenue.",
    defaultPriority: 50,
    contributingModules: ["marketplace", "commerce", "creator-economy"],
  },
  {
    kind: "increase_research_output",
    title: "Increase Research Output",
    description: "Support more research projects, publications, and citations.",
    defaultPriority: 45,
    contributingModules: ["research-platform", "global-intelligence"],
  },
];

// Goal conflict map — mutually exclusive goals
export const GOAL_CONFLICTS: Record<GoalKind, GoalKind[]> = {
  increase_mastery: [],
  reduce_dropout: [],
  improve_engagement: [],
  prepare_sat: [],
  finish_curriculum: ["improve_engagement"], // rushing curriculum can hurt engagement
  prepare_exam: ["improve_engagement"], // exam pressure can hurt engagement
  reduce_teacher_workload: [],
  improve_revenue: [],
  increase_research_output: [],
  custom: [],
};

// ===========================================================================
// Public API
// ===========================================================================

export async function createGoal(input: {
  kind: GoalKind;
  title: string;
  description?: string;
  target?: { metric: string; baseline: number; target: number; current: number; unit: string };
  priority?: number;
  contributingModules?: string[];
}): Promise<CognitiveGoal> {
  const conflicts = GOAL_CONFLICTS[input.kind] ?? [];
  const row = await repo.createGoal({
    kind: input.kind, title: input.title, description: input.description,
    target: input.target, priority: input.priority ?? 50,
    conflictsWith: conflicts, contributingModules: input.contributingModules ?? [],
  });
  log.info("goal.created", { id: row.id, kind: input.kind });
  return mapGoal(row);
}

export async function listGoals(status?: string): Promise<CognitiveGoal[]> {
  const rows = await repo.listGoals(status);
  return rows.map(mapGoal);
}

export async function getGoal(id: string): Promise<CognitiveGoal | null> {
  const row = await repo.findGoal(id);
  return row ? mapGoal(row) : null;
}

export async function updateGoalProgress(id: string, progress: number): Promise<CognitiveGoal | null> {
  const row = await repo.updateGoal(id, {
    progress: Math.max(0, Math.min(100, progress)),
    status: progress >= 100 ? "achieved" : "active",
  });
  return row ? mapGoal(row) : null;
}

export async function updateGoalTarget(id: string, target: { metric: string; baseline: number; target: number; current: number; unit: string }): Promise<CognitiveGoal | null> {
  const row = await repo.updateGoal(id, { target });
  return row ? mapGoal(row) : null;
}

export async function rankGoalsForContext(input: {
  roles: string[];
  activeGoals: CognitiveGoal[];
  intent?: string;
}): Promise<CognitiveGoal[]> {
  const { roles, activeGoals, intent } = input;
  const isTeacher = roles.some(r => r.toLowerCase().includes("teacher"));
  const isStudent = roles.some(r => r.toLowerCase().includes("student"));
  const isAdmin = roles.some(r => r.toLowerCase().includes("admin"));
  return [...activeGoals].sort((a, b) => {
    // Intent-based boost
    let aBoost = 0, bBoost = 0;
    if (intent) {
      if (intent.includes("exam") || intent.includes("assessment")) {
        if (a.kind === "prepare_exam") aBoost += 20;
        if (b.kind === "prepare_exam") bBoost += 20;
      }
      if (intent.includes("mastery")) {
        if (a.kind === "increase_mastery") aBoost += 20;
        if (b.kind === "increase_mastery") bBoost += 20;
      }
    }
    // Role-based boost
    if (isTeacher) {
      if (a.kind === "reduce_teacher_workload") aBoost += 10;
      if (b.kind === "reduce_teacher_workload") bBoost += 10;
    }
    if (isStudent) {
      if (a.kind === "improve_engagement") aBoost += 10;
      if (b.kind === "improve_engagement") bBoost += 10;
    }
    if (isAdmin) {
      if (a.kind === "reduce_dropout") aBoost += 10;
      if (b.kind === "reduce_dropout") bBoost += 10;
    }
    return (b.priority + bBoost) - (a.priority + aBoost);
  });
}

export function getGoalTemplate(kind: GoalKind) {
  return GOAL_TEMPLATES.find(t => t.kind === kind) ?? null;
}

export function listGoalTemplates() {
  return GOAL_TEMPLATES;
}

// ===========================================================================
// Helpers
// ===========================================================================

function mapGoal(row: Awaited<ReturnType<typeof repo.createGoal>>): CognitiveGoal {
  return {
    id: row.id,
    kind: row.kind as GoalKind,
    title: row.title,
    description: row.description,
    target: repo.safeParse(row.target, { metric: "", baseline: 0, target: 0, current: 0, unit: "" }),
    priority: row.priority,
    conflictsWith: repo.safeParse(row.conflictsWith, []),
    contributingModules: repo.safeParse(row.contributingModules, []),
    progress: row.progress,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
