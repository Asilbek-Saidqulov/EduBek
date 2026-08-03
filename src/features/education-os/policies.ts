/**
 * EduBek — Automation Policies.
 *
 * Phase 4F.6: A small DSL for trigger-based automations. A policy is:
 *
 *   trigger: { event: 'QuizCompleted', conditions: { score: { '<': 0.4 } } }
 *   actions: [
 *     { type: 'assign_review', params: { ... } },
 *     { type: 'notify_teacher', params: { ... } },
 *     { type: 'schedule_repetition', params: { ... } },
 *   ]
 *
 * Built-in policy templates cover common scenarios:
 *
 *   • low_mastery_review   — IF mastery < 40% THEN assign review + notify teacher + schedule repetition
 *   • curriculum_gap       — IF curriculum gap detected THEN recommend resources + generate lesson + notify admin
 *   • new_resource_index   — IF new resource published THEN analyze concepts + generate embeddings + index discovery + update knowledge graph
 *
 * The Automation Engine (automation.ts) evaluates triggers and runs actions.
 */
import type { AutomationAction, AutomationTrigger } from "./types";

// ---------------------------------------------------------------------------
// Built-in policy templates
// ---------------------------------------------------------------------------

export interface PolicyTemplate {
  code: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    code: "low_mastery_review",
    name: "Low Mastery → Review",
    description: "When a student's mastery drops below 40%, automatically assign a review, notify the teacher, and schedule spaced repetition.",
    trigger: {
      event: "QuizCompleted",
      conditions: { score: { "<": 0.4 } },
    },
    actions: [
      { type: "assign_review", params: { source: "weak_topic" } },
      { type: "notify_teacher", params: { reason: "low_mastery" } },
      { type: "schedule_repetition", params: { intervalDays: 1 } },
    ],
  },
  {
    code: "curriculum_gap",
    name: "Curriculum Gap → Generate + Recommend",
    description: "When a curriculum gap is detected, automatically recommend resources, generate a lesson, and notify the admin.",
    trigger: {
      event: "KnowledgeHealthUpdated",
      conditions: { coverageScore: { "<": 0.7 } },
    },
    actions: [
      { type: "recommend_resources", params: { source: "uncovered_standard" } },
      { type: "generate_lesson", params: { source: "gap" } },
      { type: "notify_admin", params: { reason: "curriculum_gap" } },
    ],
  },
  {
    code: "new_resource_index",
    name: "New Resource → Index + Analyze",
    description: "When a new resource is published, automatically analyze concepts, generate embeddings, index it in discovery, and update the knowledge graph.",
    trigger: {
      event: "ResourceCreated",
    },
    actions: [
      { type: "analyze_concepts", params: {} },
      { type: "generate_embeddings", params: {} },
      { type: "index_discovery", params: {} },
      { type: "update_knowledge_graph", params: {} },
    ],
  },
  {
    code: "burnout_prevention",
    name: "Burnout Detection → Lighter Content",
    description: "When a student shows burnout signals, switch to lighter content and notify them to take a break.",
    trigger: {
      event: "StudySessionCompleted",
      conditions: { durationMs: { ">": 5_400_000 } }, // > 90 min session
    },
    actions: [
      { type: "assign_review", params: { source: "burnout", difficulty: "easy" } },
      { type: "notify_student", params: { reason: "burnout" } },
    ],
  },
  {
    code: "marketplace_purchase_recommend",
    name: "Purchase → Recommend Similar",
    description: "When a user purchases a marketplace resource, recommend similar resources they might like.",
    trigger: {
      event: "MarketplacePurchase",
    },
    actions: [
      { type: "recommend_similar_resources", params: {} },
    ],
  },
];

// ---------------------------------------------------------------------------
// Condition evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a trigger's conditions against an event payload.
 * Conditions are an object where keys map to event-payload keys and
 * values are either:
 *   • A literal value (compared with ===)
 *   • An object like { "<": 0.4 }, { ">": 100 }, { "includes": "math" }
 */
export function evaluateConditions(
  conditions: Record<string, unknown> | undefined,
  payload: Record<string, unknown>,
): boolean {
  if (!conditions) return true; // no conditions = always trigger

  for (const [key, expected] of Object.entries(conditions)) {
    const actual = getPath(payload, key);

    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      // Operator-based comparison: { "<": 0.4 }
      const ops = expected as Record<string, unknown>;
      let matched = true;
      for (const [op, opValue] of Object.entries(ops)) {
        if (!compareOperator(actual, op, opValue)) {
          matched = false;
          break;
        }
      }
      if (!matched) return false;
    } else {
      // Literal comparison
      if (actual !== expected) return false;
    }
  }
  return true;
}

function compareOperator(actual: unknown, op: string, expected: unknown): boolean {
  switch (op) {
    case "<": return (actual as number) < (expected as number);
    case "<=": return (actual as number) <= (expected as number);
    case ">": return (actual as number) > (expected as number);
    case ">=": return (actual as number) >= (expected as number);
    case "==": return actual === expected;
    case "!=": return actual !== expected;
    case "includes": return Array.isArray(actual) ? actual.includes(expected) : String(actual).includes(String(expected));
    case "startsWith": return String(actual).startsWith(String(expected));
    case "endsWith": return String(actual).endsWith(String(expected));
    default: return false;
  }
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

// ---------------------------------------------------------------------------
// Get a policy template by code
// ---------------------------------------------------------------------------

export function getPolicyTemplate(code: string): PolicyTemplate | null {
  return POLICY_TEMPLATES.find((p) => p.code === code) ?? null;
}
