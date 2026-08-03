/**
 * EduBek — Cognitive AI tests.
 *
 * Phase 5D.6: Verifies the cognitive AI layer — memory systems,
 * planning, goal engine, reasoning, knowledge retrieval, tool
 * selection, decision engine, uncertainty, verification, reflection,
 * explanation, conversation state, learning loop, and meta-cognition.
 *
 * Tests are DB-light — they focus on in-process deterministic logic.
 * DB-backed tests use the existing test infrastructure.
 */
import { describe, it, expect } from "vitest";
import {
  GOAL_TEMPLATES, GOAL_CONFLICTS, getGoalTemplate, listGoalTemplates,
} from "@/features/cognitive-ai/goal-engine";
import {
  PLAN_TEMPLATES, pickPlanTemplate, listPlanTemplates, topologicalSort,
} from "@/features/cognitive-ai/planning-engine";
import {
  TOOL_CATALOG, listTools, getTool, selectTools,
} from "@/features/cognitive-ai/tool-selection";
import {
  DECISION_TEMPLATES, listDecisionTemplates, getDecisionTemplate,
} from "@/features/cognitive-ai/decision-engine";
import {
  estimateUncertainty, explainUncertainty, UNCERTAINTY_KINDS,
} from "@/features/cognitive-ai/uncertainty-engine";
import { buildExplanation, summarizeExplanation } from "@/features/cognitive-ai/explanation-engine";
import { assessMetaCognition } from "@/features/cognitive-ai/reflection-engine";
import {
  getParameters, setParameter, cacheReasoning, getCachedReasoning, clearReasoningCache, getCacheSize,
} from "@/features/cognitive-ai/learning-loop";
import { BUILTIN_KNOWLEDGE } from "@/features/cognitive-ai/semantic-memory";
import { THINKING_FRAMEWORKS } from "@/features/cognitive-ai/reasoning-engine";
import type { EvidenceItem, ReflectionEntry, CognitiveGoal, DecisionResult } from "@/features/cognitive-ai/types";

// ===========================================================================
// Goal Engine
// ===========================================================================

describe("Cognitive AI — Goal Engine", () => {
  it("ships with 9 goal templates", () => {
    expect(GOAL_TEMPLATES.length).toBe(9);
    expect(GOAL_TEMPLATES.some(t => t.kind === "increase_mastery")).toBe(true);
    expect(GOAL_TEMPLATES.some(t => t.kind === "reduce_dropout")).toBe(true);
    expect(GOAL_TEMPLATES.some(t => t.kind === "prepare_exam")).toBe(true);
    expect(GOAL_TEMPLATES.some(t => t.kind === "reduce_teacher_workload")).toBe(true);
  });

  it("lists goal templates", () => {
    const templates = listGoalTemplates();
    expect(templates.length).toBe(9);
    expect(templates[0]).toHaveProperty("kind");
    expect(templates[0]).toHaveProperty("title");
  });

  it("retrieves a template by kind", () => {
    const t = getGoalTemplate("increase_mastery");
    expect(t).not.toBeNull();
    expect(t?.title).toBe("Increase Student Mastery");
  });

  it("defines conflicts between goals", () => {
    expect(GOAL_CONFLICTS.finish_curriculum).toContain("improve_engagement");
    expect(GOAL_CONFLICTS.prepare_exam).toContain("improve_engagement");
    expect(GOAL_CONFLICTS.increase_mastery).toEqual([]);
  });

  it("every template has contributing modules", () => {
    for (const t of GOAL_TEMPLATES) {
      expect(t.contributingModules.length).toBeGreaterThan(0);
    }
  });
});

// ===========================================================================
// Planning Engine
// ===========================================================================

describe("Cognitive AI — Planning Engine", () => {
  it("ships with 3 plan templates", () => {
    expect(PLAN_TEMPLATES.length).toBe(3);
    expect(PLAN_TEMPLATES.some(t => t.id === "monthly_curriculum_plan")).toBe(true);
    expect(PLAN_TEMPLATES.some(t => t.id === "exam_preparation_plan")).toBe(true);
    expect(PLAN_TEMPLATES.some(t => t.id === "dropout_intervention_plan")).toBe(true);
  });

  it("lists plan templates", () => {
    const templates = listPlanTemplates();
    expect(templates.length).toBe(3);
    expect(templates[0]).toHaveProperty("id");
    expect(templates[0]).toHaveProperty("objective");
  });

  it("picks a template based on objective keywords", () => {
    expect(pickPlanTemplate("Create next month's Algebra plan")).toBe("monthly_curriculum_plan");
    expect(pickPlanTemplate("Prepare students for final exam")).toBe("exam_preparation_plan");
    expect(pickPlanTemplate("Intervene with at-risk students")).toBe("dropout_intervention_plan");
    expect(pickPlanTemplate("random unrelated query")).toBeNull();
  });

  it("every template has supported goals", () => {
    for (const t of PLAN_TEMPLATES) {
      expect(t.supportedGoals.length).toBeGreaterThan(0);
    }
  });

  it("topologically sorts nodes by dependencies", () => {
    const nodes = [
      { id: "a", label: "A", module: "test", action: "a", estimatedCost: 0, estimatedDuration: 5, confidence: 0.9, requiresLLM: false, inputs: [], outputs: [], status: "pending" as const },
      { id: "b", label: "B", module: "test", action: "b", estimatedCost: 0, estimatedDuration: 5, confidence: 0.9, requiresLLM: false, inputs: [], outputs: [], status: "pending" as const },
      { id: "c", label: "C", module: "test", action: "c", estimatedCost: 0, estimatedDuration: 5, confidence: 0.9, requiresLLM: false, inputs: [], outputs: [], status: "pending" as const },
    ];
    const deps = [
      { from: "a", to: "b", type: "requires" as const },
      { from: "b", to: "c", type: "requires" as const },
    ];
    const order = topologicalSort(nodes, deps);
    expect(order).toEqual(["a", "b", "c"]);
  });

  it("handles cycles gracefully in topological sort", () => {
    const nodes = [
      { id: "a", label: "A", module: "test", action: "a", estimatedCost: 0, estimatedDuration: 5, confidence: 0.9, requiresLLM: false, inputs: [], outputs: [], status: "pending" as const },
      { id: "b", label: "B", module: "test", action: "b", estimatedCost: 0, estimatedDuration: 5, confidence: 0.9, requiresLLM: false, inputs: [], outputs: [], status: "pending" as const },
    ];
    const deps = [
      { from: "a", to: "b", type: "requires" as const },
      { from: "b", to: "a", type: "requires" as const }, // cycle
    ];
    const order = topologicalSort(nodes, deps);
    expect(order.length).toBe(2); // both nodes included
  });
});

// ===========================================================================
// Tool Selection
// ===========================================================================

describe("Cognitive AI — Tool Selection", () => {
  it("ships with a comprehensive tool catalog", () => {
    expect(TOOL_CATALOG.length).toBeGreaterThanOrEqual(20);
    // Check all major modules are represented
    const modules = new Set(TOOL_CATALOG.map(t => t.module));
    expect(modules).toContain("knowledge-intelligence");
    expect(modules).toContain("assessment-platform");
    expect(modules).toContain("learning-planner");
    expect(modules).toContain("discovery");
    expect(modules).toContain("digital-twins");
    expect(modules).toContain("marketplace");
    expect(modules).toContain("ai-workspace");
    expect(modules).toContain("education-os");
    expect(modules).toContain("civilization-engine");
    expect(modules).toContain("platform-intelligence");
  });

  it("lists tools optionally filtered by module", () => {
    const all = listTools();
    expect(all.length).toBe(TOOL_CATALOG.length);
    const filtered = listTools("assessment-platform");
    expect(filtered.every(t => t.module === "assessment-platform")).toBe(true);
  });

  it("retrieves a tool by id", () => {
    const tool = getTool("assessment_platform.build_assessment");
    expect(tool).not.toBeNull();
    expect(tool?.module).toBe("assessment-platform");
  });

  it("selects tools for exam intent", () => {
    const result = selectTools({
      intent: "create_exam",
      query: "Create an exam",
      availablePermissions: ["content.create"],
    });
    expect(result.selected.length).toBeGreaterThan(0);
    // Assessment platform tools should be selected
    expect(result.selected.some(s => s.tool.module === "assessment-platform")).toBe(true);
  });

  it("selects tools for lesson intent", () => {
    const result = selectTools({
      intent: "create_lesson",
      query: "Create a lesson",
      availablePermissions: ["ai.use", "content.create"],
    });
    expect(result.selected.length).toBeGreaterThan(0);
  });

  it("respects permission filters", () => {
    const result = selectTools({
      intent: "create_exam",
      query: "Create an exam",
      availablePermissions: [], // no permissions
    });
    // Tools requiring permissions should be in rejected
    expect(result.rejected.some(r => r.reason === "Missing required permission")).toBe(true);
  });

  it("every tool has required fields", () => {
    for (const t of TOOL_CATALOG) {
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.module).toBeTruthy();
      expect(t.capability).toBeTruthy();
      expect(t.inputs.length).toBeGreaterThan(0);
      expect(t.outputs.length).toBeGreaterThan(0);
      expect(t.estimatedDuration).toBeGreaterThan(0);
    }
  });
});

// ===========================================================================
// Decision Engine
// ===========================================================================

describe("Cognitive AI — Decision Engine", () => {
  it("ships with 3 decision templates", () => {
    expect(DECISION_TEMPLATES.length).toBe(3);
    expect(DECISION_TEMPLATES.some(t => t.id === "homework_source")).toBe(true);
    expect(DECISION_TEMPLATES.some(t => t.id === "lesson_source")).toBe(true);
    expect(DECISION_TEMPLATES.some(t => t.id === "intervention_strategy")).toBe(true);
  });

  it("lists decision templates", () => {
    const templates = listDecisionTemplates();
    expect(templates.length).toBe(3);
  });

  it("retrieves a template by id", () => {
    const t = getDecisionTemplate("homework_source");
    expect(t).not.toBeNull();
    expect(t?.title).toContain("homework");
  });

  it("every decision template has at least 3 options", () => {
    for (const t of DECISION_TEMPLATES) {
      const options = t.generateOptions();
      expect(options.length).toBeGreaterThanOrEqual(3);
      // Every option has all required score dimensions
      for (const o of options) {
        expect(o.scores).toHaveProperty("quality");
        expect(o.scores).toHaveProperty("cost");
        expect(o.scores).toHaveProperty("teacherWorkload");
        expect(o.scores).toHaveProperty("studentImpact");
        expect(o.scores).toHaveProperty("curriculumFit");
      }
    }
  });
});

// ===========================================================================
// Uncertainty Engine
// ===========================================================================

describe("Cognitive AI — Uncertainty Engine", () => {
  it("estimates high confidence with strong evidence", () => {
    const evidence: EvidenceItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: `e${i}`, source: `source${i}`, type: "fact",
      content: `Evidence ${i}`, relevance: 0.8, confidence: 0.85,
      timestamp: new Date().toISOString(),
    }));
    const estimate = estimateUncertainty({
      evidence, sourcesQueried: 10, sourcesWithResults: 5,
      retrievalQuality: 0.8, hasLLMOutput: true,
    });
    expect(estimate.confidence).toBeGreaterThan(0.5);
    expect(estimate.reasons.length).toBeLessThan(3);
  });

  it("estimates low confidence with no evidence", () => {
    const estimate = estimateUncertainty({
      evidence: [], sourcesQueried: 10, sourcesWithResults: 0,
      retrievalQuality: 0, hasLLMOutput: false,
    });
    // With no evidence, no sources, no LLM output, confidence should be quite low
    expect(estimate.confidence).toBeLessThan(0.6);
    expect(estimate.reasons.length).toBeGreaterThan(0);
    expect(estimate.missingInformation.length).toBeGreaterThan(0);
    expect(estimate.suggestedNextQuestions.length).toBeGreaterThan(0);
  });

  it("detects conflicting evidence", () => {
    const evidence: EvidenceItem[] = [
      { id: "e1", source: "s1", type: "fact", content: "A", relevance: 0.8, confidence: 0.9, timestamp: new Date().toISOString() },
      { id: "e2", source: "s2", type: "fact", content: "B", relevance: 0.8, confidence: 0.2, timestamp: new Date().toISOString() },
    ];
    const estimate = estimateUncertainty({
      evidence, sourcesQueried: 5, sourcesWithResults: 2,
      retrievalQuality: 0.7, hasLLMOutput: true,
    });
    expect(estimate.reasons.some(r => r.kind === "conflicting_evidence")).toBe(true);
  });

  it("detects stale information", () => {
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago
    const evidence: EvidenceItem[] = [
      { id: "e1", source: "s1", type: "fact", content: "Old", relevance: 0.8, confidence: 0.8, timestamp: oldDate },
    ];
    const estimate = estimateUncertainty({
      evidence, sourcesQueried: 5, sourcesWithResults: 1,
      retrievalQuality: 0.7, hasLLMOutput: true,
    });
    expect(estimate.reasons.some(r => r.kind === "stale_information")).toBe(true);
  });

  it("explains uncertainty in natural language", () => {
    const estimate = estimateUncertainty({
      evidence: [], sourcesQueried: 5, sourcesWithResults: 0,
      retrievalQuality: 0, hasLLMOutput: false,
    });
    const explanation = explainUncertainty(estimate);
    // Should mention confidence level (low or moderate)
    expect(explanation).toMatch(/(Low|Moderate) confidence/);
    expect(explanation).toContain("uncertainty");
  });

  it("exposes all uncertainty kinds", () => {
    expect(UNCERTAINTY_KINDS.length).toBe(8);
    expect(UNCERTAINTY_KINDS).toContain("missing_data");
    expect(UNCERTAINTY_KINDS).toContain("conflicting_evidence");
  });
});

// ===========================================================================
// Explanation Engine
// ===========================================================================

describe("Cognitive AI — Explanation Engine", () => {
  function makeGoal(overrides: Partial<CognitiveGoal> = {}): CognitiveGoal {
    return {
      id: "g1", kind: "increase_mastery", title: "Increase Mastery",
      description: "Test goal", target: { metric: "mastery", baseline: 0, target: 100, current: 50, unit: "%" },
      priority: 80, conflictsWith: [], contributingModules: ["knowledge-intelligence"],
      progress: 50, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  it("builds an explanation with all required fields", () => {
    const evidence: EvidenceItem[] = [
      { id: "e1", source: "kg", type: "fact", content: "Fact 1", relevance: 0.8, confidence: 0.9, timestamp: new Date().toISOString() },
    ];
    const explanation = buildExplanation({
      reasoning: "Test reasoning",
      confidence: 0.85,
      evidence,
      modulesUsed: ["knowledge-intelligence", "assessment-platform"],
      goalsSupported: [makeGoal()],
      estimatedCost: 0.01,
      estimatedTimeSavedMinutes: 10,
    });
    expect(explanation.reasoning).toBe("Test reasoning");
    expect(explanation.confidence).toBe(0.85);
    expect(explanation.evidence.length).toBe(1);
    expect(explanation.modulesUsed.length).toBe(2);
    expect(explanation.goalsSupported).toContain("Increase Mastery");
    expect(explanation.cost).toBe(0.01);
    expect(explanation.estimatedTimeSavedMinutes).toBe(10);
    expect(explanation.whyThisChoice).toBeTruthy();
  });

  it("includes alternatives from decision result", () => {
    const decision: DecisionResult = {
      options: [
        { id: "a", label: "Option A", module: "test", description: "A", scores: { quality: 80, cost: 70, teacherWorkload: 90, studentImpact: 75, curriculumFit: 85 }, overallScore: 80, estimatedCost: 0, estimatedDuration: 5, risks: [] },
        { id: "b", label: "Option B", module: "test", description: "B", scores: { quality: 70, cost: 60, teacherWorkload: 80, studentImpact: 70, curriculumFit: 75 }, overallScore: 70, estimatedCost: 0, estimatedDuration: 5, risks: [] },
      ],
      chosenOptionId: "a", rationale: "A scored higher", confidence: 0.8,
    };
    const explanation = buildExplanation({
      reasoning: "Test", confidence: 0.8, evidence: [],
      modulesUsed: [], goalsSupported: [],
      estimatedCost: 0, estimatedTimeSavedMinutes: 0,
      decision,
    });
    expect(explanation.alternativeOptions.length).toBe(1);
    expect(explanation.alternativeOptions[0].label).toBe("Option B");
  });

  it("summarizes explanation as text", () => {
    const explanation = buildExplanation({
      reasoning: "Test reasoning",
      confidence: 0.75,
      evidence: [{ id: "e1", source: "kg", type: "fact", content: "Fact", relevance: 0.8, confidence: 0.9, timestamp: new Date().toISOString() }],
      modulesUsed: ["test"],
      goalsSupported: [],
      estimatedCost: 0.01,
      estimatedTimeSavedMinutes: 5,
    });
    const summary = summarizeExplanation(explanation);
    expect(summary).toContain("Test reasoning");
    expect(summary).toContain("75%");
  });
});

// ===========================================================================
// Learning Loop
// ===========================================================================

describe("Cognitive AI — Learning Loop", () => {
  it("exposes adjustable parameters", () => {
    const params = getParameters();
    expect(params).toHaveProperty("evidenceCountThreshold");
    expect(params).toHaveProperty("expensiveReasoningThreshold");
    expect(params).toHaveProperty("moduleCountThreshold");
    expect(params).toHaveProperty("highQualityEvidenceBoost");
  });

  it("allows parameter updates", () => {
    const original = getParameters().evidenceCountThreshold;
    setParameter("evidenceCountThreshold", 5);
    expect(getParameters().evidenceCountThreshold).toBe(5);
    // Restore
    setParameter("evidenceCountThreshold", original);
  });

  it("caches and retrieves reasoning", () => {
    clearReasoningCache();
    cacheReasoning("test-key", { answer: "cached" });
    const cached = getCachedReasoning<{ answer: string }>("test-key");
    expect(cached).toEqual({ answer: "cached" });
    expect(getCacheSize()).toBe(1);
    clearReasoningCache();
    expect(getCacheSize()).toBe(0);
  });

  it("returns null for missing cache key", () => {
    clearReasoningCache();
    const cached = getCachedReasoning("nonexistent");
    expect(cached).toBeNull();
  });
});

// ===========================================================================
// Meta-Cognition (Reflection Engine)
// ===========================================================================

describe("Cognitive AI — Meta-Cognition", () => {
  it("assesses empty history as healthy", () => {
    const assessment = assessMetaCognition([]);
    expect(assessment.issues.length).toBe(0);
    expect(assessment.selfScore).toBeGreaterThan(0.8);
    expect(assessment.adjustmentRecommended).toBe(false);
  });

  it("detects overconfidence pattern", () => {
    const reflections: ReflectionEntry[] = Array.from({ length: 5 }, (_, i) => ({
      id: `r${i}`, actionType: "reasoning", traceId: `t${i}`,
      reflections: [
        { question: "Was confidence too high?", answer: "Yes", score: 0.3 },
      ],
      overallScore: 0.5, lessons: [], memoryUpdateRecommended: false,
      createdAt: new Date().toISOString(),
    }));
    const assessment = assessMetaCognition(reflections);
    expect(assessment.issues.some(i => i.kind === "overconfidence")).toBe(true);
    expect(assessment.adjustmentRecommended).toBe(true);
  });

  it("detects repetition pattern", () => {
    const reflections: ReflectionEntry[] = Array.from({ length: 5 }, (_, i) => ({
      id: `r${i}`, actionType: "create_lesson", traceId: `t${i}`,
      reflections: [], overallScore: 0.7, lessons: [], memoryUpdateRecommended: false,
      createdAt: new Date().toISOString(),
    }));
    const assessment = assessMetaCognition(reflections);
    expect(assessment.issues.some(i => i.kind === "repetition")).toBe(true);
  });
});

// ===========================================================================
// Semantic Memory — Built-in Knowledge
// ===========================================================================

describe("Cognitive AI — Semantic Memory Seeds", () => {
  it("ships with built-in knowledge", () => {
    expect(BUILTIN_KNOWLEDGE.length).toBeGreaterThanOrEqual(8);
  });

  it("every knowledge entry has required fields", () => {
    for (const k of BUILTIN_KNOWLEDGE) {
      expect(k.domain).toBeTruthy();
      expect(k.kind).toBeTruthy();
      expect(k.statement).toBeTruthy();
      expect(k.source).toBeTruthy();
      expect(k.confidence).toBeGreaterThan(0);
      expect(k.confidence).toBeLessThanOrEqual(1);
      expect(k.tags.length).toBeGreaterThan(0);
    }
  });

  it("covers multiple domains", () => {
    const domains = new Set(BUILTIN_KNOWLEDGE.map(k => k.domain));
    expect(domains.size).toBeGreaterThanOrEqual(3);
    expect(domains).toContain("teaching");
    expect(domains).toContain("curriculum");
    expect(domains).toContain("assessment");
  });
});

// ===========================================================================
// Thinking Frameworks (System 14)
// ===========================================================================

describe("Cognitive AI — Thinking Frameworks", () => {
  it("defines 8 frameworks", () => {
    expect(Object.keys(THINKING_FRAMEWORKS).length).toBe(8);
    expect(THINKING_FRAMEWORKS.teaching).toBeDefined();
    expect(THINKING_FRAMEWORKS.assessment).toBeDefined();
    expect(THINKING_FRAMEWORKS.planning).toBeDefined();
    expect(THINKING_FRAMEWORKS.curriculum).toBeDefined();
    expect(THINKING_FRAMEWORKS.research).toBeDefined();
    expect(THINKING_FRAMEWORKS.student_support).toBeDefined();
    expect(THINKING_FRAMEWORKS.institution).toBeDefined();
    expect(THINKING_FRAMEWORKS.marketplace).toBeDefined();
  });

  it("every framework has weighted stages", () => {
    for (const f of Object.values(THINKING_FRAMEWORKS)) {
      expect(f.stages.length).toBeGreaterThan(0);
      const totalWeight = f.stages.reduce((s, st) => s + st.weight, 0);
      expect(totalWeight).toBeGreaterThan(0);
      expect(totalWeight).toBeLessThanOrEqual(1.5); // weights roughly sum to 1
    }
  });

  it("every framework has default goals and preferred tools", () => {
    for (const f of Object.values(THINKING_FRAMEWORKS)) {
      expect(f.defaultGoals.length).toBeGreaterThan(0);
      expect(f.preferredTools.length).toBeGreaterThan(0);
      expect(f.description).toBeTruthy();
    }
  });
});

// ===========================================================================
// Working Memory (DB-backed)
// ===========================================================================

describe("Cognitive AI — Working Memory", () => {
  const testUserId = "test-cog-wm-" + Date.now();

  it("sets and gets working memory entries", async () => {
    const { setWorkingMemory, getWorkingMemory } = await import("@/features/cognitive-ai/working-memory");
    await setWorkingMemory({
      scopeType: "session", scopeId: testUserId, kind: "current_task",
      payload: { task: "test task" },
    });
    const entries = await getWorkingMemory("session", testUserId);
    expect(entries.length).toBeGreaterThan(0);
    const taskEntry = entries.find(e => e.kind === "current_task");
    expect(taskEntry).toBeDefined();
    expect((taskEntry!.payload as { task: string }).task).toBe("test task");
  });

  it("sets and gets current task via convenience method", async () => {
    const { setCurrentTask, getCurrentTask } = await import("@/features/cognitive-ai/working-memory");
    await setCurrentTask(testUserId, "preparing exam");
    const task = await getCurrentTask(testUserId);
    expect(task).toBe("preparing exam");
  });

  it("expires entries automatically", async () => {
    const { setWorkingMemory, getWorkingMemory } = await import("@/features/cognitive-ai/working-memory");
    await setWorkingMemory({
      scopeType: "session", scopeId: testUserId, kind: "transient_facts",
      payload: { fact: "short-lived" }, ttlMs: 1, // 1ms — expires almost immediately
    });
    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 10));
    const entries = await getWorkingMemory("session", testUserId);
    const expired = entries.find(e => e.kind === "transient_facts");
    expect(expired).toBeUndefined();
  });
});

// ===========================================================================
// Conversation State (DB-backed)
// ===========================================================================

describe("Cognitive AI — Conversation State", () => {
  const testUserId = "test-cog-conv-" + Date.now();

  it("starts and retrieves a conversation", async () => {
    const { startConversation, getActiveConversation } = await import("@/features/cognitive-ai/conversation-state");
    await startConversation(testUserId, "Plan next month's lessons");
    const conv = await getActiveConversation(testUserId);
    expect(conv).not.toBeNull();
    expect(conv?.objective).toBe("Plan next month's lessons");
  });

  it("updates conversation state", async () => {
    const { startConversation, getActiveConversation, addEntity, addAssumption } = await import("@/features/cognitive-ai/conversation-state");
    await startConversation(testUserId, "Test conversation");
    const conv = await getActiveConversation(testUserId);
    if (!conv) throw new Error("No active conversation");
    await addEntity(conv.id, { type: "classroom", id: "c1", label: "Algebra Class" });
    await addAssumption(conv.id, "Student has basic algebra knowledge");
    const updated = await getActiveConversation(testUserId);
    expect(updated?.entities.length).toBe(1);
    expect(updated?.assumptions.length).toBe(1);
  });

  it("ends a conversation", async () => {
    const { startConversation, endConversation, getActiveConversation } = await import("@/features/cognitive-ai/conversation-state");
    await startConversation(testUserId, "To be ended");
    const conv = await getActiveConversation(testUserId);
    if (!conv) throw new Error("No active conversation");
    await endConversation(conv.id);
    const after = await getActiveConversation(testUserId);
    expect(after).toBeNull(); // ended conversation is not "active"
  });
});
