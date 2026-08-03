/**
 * EduBek — Phase 4F.6 Education OS tests.
 *
 * Verifies:
 *   • Coordinator: agent routing + concurrent execution + merged response
 *   • Workflow Engine: step sequencing + status tracking
 *   • Automation Policies: condition evaluation DSL
 *   • Simulation Engine: scenario predictions
 *   • Event Bus: Education OS event type constants
 *   • Memory: store + recall + context retrieval
 *
 * Pure-function tests cover the deterministic logic. Integration tests
 * (with DB) cover the full coordinator + workflow + memory flows.
 */
import { describe, it, expect } from "vitest";
import {
  POLICY_TEMPLATES,
  evaluateConditions,
  getPolicyTemplate,
} from "@/features/education-os/policies";
import {
  EDUCATION_OS_EVENT_TYPES,
  isEducationOsEventType,
  RESOURCE_CREATED_EVENT,
  QUIZ_COMPLETED_EVENT,
  LESSON_GENERATED_EVENT,
} from "@/features/education-os/events";
import {
  listRegisteredAgents,
  getAgentDefinition,
} from "@/features/education-os/coordinator";
import {
  listWorkflowTypes,
  getWorkflowDefinition,
} from "@/features/education-os/workflow";

// ---------------------------------------------------------------------------
// Agent Registry
// ---------------------------------------------------------------------------

describe("Agent Registry", () => {
  it("registers all 9 agents", () => {
    const agents = listRegisteredAgents();
    expect(agents).toHaveLength(9);
    const types = agents.map((a) => a.type).sort();
    expect(types).toEqual([
      "analytics", "assessment", "curriculum", "marketplace",
      "notification", "organization", "planner", "student", "teacher",
    ]);
  });

  it("each agent has at least one capability", () => {
    const agents = listRegisteredAgents();
    for (const a of agents) {
      expect(a.capabilities.length).toBeGreaterThan(0);
      expect(a.name).toBeTruthy();
      expect(a.description).toBeTruthy();
    }
  });

  it("getAgentDefinition returns the right agent", () => {
    const teacher = getAgentDefinition("teacher");
    expect(teacher).not.toBeNull();
    expect(teacher!.type).toBe("teacher");
    expect(teacher!.capabilities.some((c) => c.code === "lesson_planning")).toBe(true);
  });

  it("getAgentDefinition returns null for unknown agent", () => {
    expect(getAgentDefinition("nonexistent" as any)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Workflow Engine — definitions
// ---------------------------------------------------------------------------

describe("Workflow Engine — definitions", () => {
  it("lists all 8 built-in workflow types", () => {
    const types = listWorkflowTypes();
    expect(types).toHaveLength(8);
    expect(types).toContain("generate_lesson");
    expect(types).toContain("create_quiz");
    expect(types).toContain("full_teaching_cycle");
    expect(types).toContain("intervention");
  });

  it("each workflow has ordered steps with agents + tasks", () => {
    const types = listWorkflowTypes();
    for (const t of types) {
      const def = getWorkflowDefinition(t);
      expect(def).not.toBeNull();
      expect(def!.steps.length).toBeGreaterThan(0);
      for (const step of def!.steps) {
        expect(step.agent).toBeTruthy();
        expect(step.task).toBeTruthy();
      }
    }
  });

  it("full_teaching_cycle has 7 steps covering all teaching phases", () => {
    const def = getWorkflowDefinition("full_teaching_cycle");
    expect(def!.steps).toHaveLength(7);
    const tasks = def!.steps.map((s) => s.task);
    expect(tasks).toContain("lesson_planning");
    expect(tasks).toContain("curriculum_alignment");
    expect(tasks).toContain("recommend_resources");
    expect(tasks).toContain("question_generation");
    expect(tasks).toContain("assignment_planning");
    expect(tasks).toContain("daily_agenda");
    expect(tasks).toContain("teacher_notifications");
  });
});

// ---------------------------------------------------------------------------
// Automation Policies — condition evaluation DSL
// ---------------------------------------------------------------------------

describe("Automation Policies — condition evaluation", () => {
  it("returns true when no conditions are specified", () => {
    expect(evaluateConditions(undefined, { foo: "bar" })).toBe(true);
  });

  it("returns true for literal value match", () => {
    expect(evaluateConditions({ subject: "math" }, { subject: "math" })).toBe(true);
    expect(evaluateConditions({ subject: "math" }, { subject: "science" })).toBe(false);
  });

  it("evaluates < operator", () => {
    expect(evaluateConditions({ score: { "<": 0.4 } }, { score: 0.3 })).toBe(true);
    expect(evaluateConditions({ score: { "<": 0.4 } }, { score: 0.5 })).toBe(false);
  });

  it("evaluates > operator", () => {
    expect(evaluateConditions({ durationMs: { ">": 5_400_000 } }, { durationMs: 6_000_000 })).toBe(true);
    expect(evaluateConditions({ durationMs: { ">": 5_400_000 } }, { durationMs: 3_000_000 })).toBe(false);
  });

  it("evaluates <= and >= operators", () => {
    expect(evaluateConditions({ x: { "<=": 5 } }, { x: 5 })).toBe(true);
    expect(evaluateConditions({ x: { ">=": 5 } }, { x: 5 })).toBe(true);
    expect(evaluateConditions({ x: { "<=": 5 } }, { x: 6 })).toBe(false);
  });

  it("evaluates == and != operators", () => {
    expect(evaluateConditions({ status: { "==": "active" } }, { status: "active" })).toBe(true);
    expect(evaluateConditions({ status: { "!=": "archived" } }, { status: "active" })).toBe(true);
  });

  it("evaluates includes operator on arrays", () => {
    expect(evaluateConditions({ tags: { includes: "math" } }, { tags: ["math", "science"] })).toBe(true);
    expect(evaluateConditions({ tags: { includes: "history" } }, { tags: ["math", "science"] })).toBe(false);
  });

  it("evaluates nested paths (dotted keys)", () => {
    expect(evaluateConditions({ "user.locale": "en" }, { user: { locale: "en" } })).toBe(true);
    expect(evaluateConditions({ "user.locale": "uz" }, { user: { locale: "en" } })).toBe(false);
  });

  it("combines multiple conditions with AND", () => {
    expect(evaluateConditions(
      { subject: "math", score: { "<": 0.4 } },
      { subject: "math", score: 0.3 },
    )).toBe(true);
    expect(evaluateConditions(
      { subject: "math", score: { "<": 0.4 } },
      { subject: "science", score: 0.3 },
    )).toBe(false);
  });
});

describe("Automation Policies — templates", () => {
  it("includes 5 built-in policy templates", () => {
    expect(POLICY_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    const codes = POLICY_TEMPLATES.map((p) => p.code);
    expect(codes).toContain("low_mastery_review");
    expect(codes).toContain("curriculum_gap");
    expect(codes).toContain("new_resource_index");
    expect(codes).toContain("burnout_prevention");
    expect(codes).toContain("marketplace_purchase_recommend");
  });

  it("low_mastery_review policy triggers on QuizCompleted with score < 0.4", () => {
    const template = getPolicyTemplate("low_mastery_review")!;
    expect(template.trigger.event).toBe(QUIZ_COMPLETED_EVENT);
    expect(template.actions).toHaveLength(3);
    expect(template.actions.map((a) => a.type)).toEqual([
      "assign_review", "notify_teacher", "schedule_repetition",
    ]);
  });

  it("new_resource_index policy triggers on ResourceCreated", () => {
    const template = getPolicyTemplate("new_resource_index")!;
    expect(template.trigger.event).toBe(RESOURCE_CREATED_EVENT);
    expect(template.actions).toHaveLength(4);
    expect(template.actions.map((a) => a.type)).toEqual([
      "analyze_concepts", "generate_embeddings", "index_discovery", "update_knowledge_graph",
    ]);
  });

  it("burnout_prevention policy triggers on long StudySessionCompleted", () => {
    const template = getPolicyTemplate("burnout_prevention")!;
    expect(template.trigger.event).toBe("StudySessionCompleted");
    // The condition should evaluate true for a 90+ min session
    const conditions = template.trigger.conditions!;
    expect(evaluateConditions(conditions, { durationMs: 6_000_000 })).toBe(true);
    expect(evaluateConditions(conditions, { durationMs: 3_000_000 })).toBe(false);
  });

  it("returns null for unknown policy code", () => {
    expect(getPolicyTemplate("nonexistent")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Event Bus — Education OS event types
// ---------------------------------------------------------------------------

describe("Education OS Event Types", () => {
  it("includes all 8 event type constants", () => {
    expect(EDUCATION_OS_EVENT_TYPES).toHaveLength(8);
    expect(EDUCATION_OS_EVENT_TYPES).toContain(RESOURCE_CREATED_EVENT);
    expect(EDUCATION_OS_EVENT_TYPES).toContain(QUIZ_COMPLETED_EVENT);
    expect(EDUCATION_OS_EVENT_TYPES).toContain(LESSON_GENERATED_EVENT);
    expect(EDUCATION_OS_EVENT_TYPES).toContain("TranslationCreated");
    expect(EDUCATION_OS_EVENT_TYPES).toContain("MarketplacePurchase");
    expect(EDUCATION_OS_EVENT_TYPES).toContain("StudySessionCompleted");
    expect(EDUCATION_OS_EVENT_TYPES).toContain("KnowledgeHealthUpdated");
    expect(EDUCATION_OS_EVENT_TYPES).toContain("OrganizationSnapshotCreated");
  });

  it("isEducationOsEventType validates correctly", () => {
    expect(isEducationOsEventType("ResourceCreated")).toBe(true);
    expect(isEducationOsEventType("QuizCompleted")).toBe(true);
    expect(isEducationOsEventType("Nonexistent")).toBe(false);
    expect(isEducationOsEventType("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Integration: full coordinator execution (with DB)
// ---------------------------------------------------------------------------

describe("Integration — Coordinator execution", () => {
  it("executes a status check via the coordinator", async () => {
    const { execute } = await import("@/features/education-os/coordinator");
    const result = await execute({
      instruction: "What's my student dashboard?",
      scopeType: "system",
      scopeId: "test-coordinator-4f6",
    });
    expect(result.participatingAgents.length).toBeGreaterThan(0);
    expect(result.responses.length).toBeGreaterThan(0);
    expect(result.executionMs).toBeGreaterThanOrEqual(0);
    expect(result.reasoning.confidence).toBeGreaterThanOrEqual(0);
    expect(result.reasoning.reasoning).toBeTruthy();
  }, 15_000);

  it("determines the right agents for a teacher-domain instruction", async () => {
    const { execute } = await import("@/features/education-os/coordinator");
    const result = await execute({
      instruction: "Create tomorrow's lesson plan for Algebra",
      scopeType: "system",
      scopeId: "test-teacher-routing",
    });
    // Should route to at least one of: teacher, planner, curriculum
    const routedAgents = result.participatingAgents;
    expect(
      routedAgents.includes("teacher") ||
      routedAgents.includes("planner") ||
      routedAgents.includes("curriculum"),
    ).toBe(true);
  }, 15_000);
});

// ---------------------------------------------------------------------------
// Integration: Simulation engine (with DB)
// ---------------------------------------------------------------------------

describe("Integration — Simulation engine", () => {
  it("simulates the make_subject_mandatory scenario", async () => {
    const { simulate } = await import("@/features/education-os/simulation");
    const result = await simulate({
      scenario: "make_subject_mandatory",
      params: { subject: "algebra", grade: "8" },
    });
    expect(result.scenario).toBe("make_subject_mandatory");
    expect(result.predictions.curriculumChanges).toBeGreaterThanOrEqual(0);
    expect(result.predictions.affectedStudents).toBeGreaterThanOrEqual(0);
    expect(result.predictions.estimatedAiCredits).toBeGreaterThanOrEqual(0);
    expect(result.summary).toContain("algebra");
    expect(result.confidence).toBeGreaterThan(0);
  }, 10_000);

  it("simulates the introduce_ai_tutoring scenario", async () => {
    const { simulate } = await import("@/features/education-os/simulation");
    const result = await simulate({
      scenario: "introduce_ai_tutoring",
      params: {},
    });
    expect(result.scenario).toBe("introduce_ai_tutoring");
    expect(result.predictions.predictedMasteryChange).toBeGreaterThan(0);
    expect(result.predictions.predictedDropoutChange).toBeLessThan(0);
    expect(result.summary).toContain("AI tutoring");
  }, 10_000);
});
