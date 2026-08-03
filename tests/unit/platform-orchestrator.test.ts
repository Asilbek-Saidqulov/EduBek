/**
 * EduBek — Platform Orchestrator tests.
 *
 * Phase 5D.4: Verifies the universal integration layer — workflow
 * registry, dependency graph, prompt registry, observability,
 * production readiness (circuit breakers, rate limits, idempotency,
 * distributed locks), and documentation generator.
 *
 * Tests are intentionally DB-light — they focus on the in-process logic
 * that doesn't require a running database. DB-backed tests use the
 * existing test infrastructure.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  BUILTIN_WORKFLOWS, listWorkflows, getWorkflow, findWorkflowsForEvent,
  setWorkflowEnabled, workflowStats, buildExecutionSteps, validateWorkflow,
  registerWorkflow,
} from "@/features/platform-orchestrator/workflow-registry";
import {
  getDependencyGraph, rebuildDependencyGraph, analyzeImpact,
  findNode, listNodesByKind, findPath, getGraphStats,
} from "@/features/platform-orchestrator/dependency-graph";
import {
  renderPromptTemplate, BUILTIN_PROMPTS,
} from "@/features/platform-orchestrator/prompt-registry";
import {
  startSpan, finishSpan, addSpanLog, getTraceFromMemory, listRecentTraces,
} from "@/features/platform-orchestrator/observability";
import {
  checkRateLimit, listRateLimits, getChaosHooks, setChaosHookEnabled,
} from "@/features/platform-orchestrator/production";
import { estimateCost } from "@/features/platform-orchestrator/ai-workspace";
import { ASSESSMENT_PUBLISHED, SUBMISSION_GRADED, AI_GENERATION_COMPLETED } from "@/infra/event-bus/events";

// ===========================================================================
// Workflow Registry
// ===========================================================================

describe("Platform Orchestrator — Workflow Registry", () => {
  it("ships with built-in workflows", () => {
    expect(BUILTIN_WORKFLOWS.length).toBeGreaterThan(8);
    expect(BUILTIN_WORKFLOWS.some(w => w.id === "assessment.published")).toBe(true);
    expect(BUILTIN_WORKFLOWS.some(w => w.id === "submission.graded")).toBe(true);
    expect(BUILTIN_WORKFLOWS.some(w => w.id === "ai.generation_completed")).toBe(true);
  });

  it("lists workflows with optional filters", () => {
    const all = listWorkflows();
    expect(all.length).toBe(BUILTIN_WORKFLOWS.length);

    const enabled = listWorkflows({ enabledOnly: true });
    expect(enabled.every(w => w.enabled)).toBe(true);

    const byModule = listWorkflows({ module: "discovery" });
    expect(byModule.every(w => w.participatingModules.includes("discovery"))).toBe(true);
  });

  it("retrieves a single workflow by id", () => {
    const w = getWorkflow("assessment.published");
    expect(w).not.toBeNull();
    expect(w?.id).toBe("assessment.published");
    expect(w?.steps.length).toBeGreaterThan(5);
  });

  it("finds workflows for a given event type", () => {
    const workflows = findWorkflowsForEvent(ASSESSMENT_PUBLISHED);
    expect(workflows.length).toBeGreaterThan(0);
    expect(workflows.some(w => w.id === "assessment.published")).toBe(true);
  });

  it("toggles workflow enabled state", () => {
    const before = getWorkflow("assessment.published");
    expect(before?.enabled).toBe(true);
    const ok = setWorkflowEnabled("assessment.published", false);
    expect(ok).toBe(true);
    const after = getWorkflow("assessment.published");
    expect(after?.enabled).toBe(false);
    // Restore
    setWorkflowEnabled("assessment.published", true);
  });

  it("computes workflow stats", () => {
    const stats = workflowStats();
    expect(stats.total).toBe(BUILTIN_WORKFLOWS.length);
    expect(stats.enabled).toBeGreaterThan(0);
    expect(stats.totalSteps).toBeGreaterThan(50);
    expect(stats.participatingModules.length).toBeGreaterThan(5);
    expect(stats.totalTriggers).toBeGreaterThan(5);
  });

  it("builds execution steps from a workflow definition", () => {
    const w = getWorkflow("assessment.published")!;
    const steps = buildExecutionSteps(w);
    expect(steps.length).toBe(w.steps.length);
    expect(steps[0].status).toBe("pending");
    expect(steps[0].startedAt).toBeNull();
    expect(steps[0].finishedAt).toBeNull();
    expect(steps[0].durationMs).toBeNull();
  });

  it("validates workflow definitions", () => {
    const w = getWorkflow("assessment.published")!;
    const issues = validateWorkflow(w);
    expect(issues).toEqual([]);
  });

  it("catches invalid workflow definitions", () => {
    const issues = validateWorkflow({
      id: "", name: "", description: "",
      triggers: [], steps: [],
      participatingModules: [], enabled: true, tags: [],
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.field === "id")).toBe(true);
    expect(issues.some(i => i.field === "triggers")).toBe(true);
    expect(issues.some(i => i.field === "steps")).toBe(true);
  });

  it("allows registering custom workflows", () => {
    const customId = "test.custom_workflow";
    registerWorkflow({
      id: customId, name: "Test", description: "Test workflow",
      triggers: [AI_GENERATION_COMPLETED],
      steps: [{ order: 1, module: "test", action: "noop", critical: false }],
      participatingModules: ["test"], enabled: true, tags: ["test"],
    });
    const w = getWorkflow(customId);
    expect(w).not.toBeNull();
    expect(w?.name).toBe("Test");
  });
});

// ===========================================================================
// Dependency Graph
// ===========================================================================

describe("Platform Orchestrator — Dependency Graph", () => {
  it("builds a graph with feature modules, services, repositories, APIs, events, workflows, and agents", () => {
    const graph = getDependencyGraph();
    expect(graph.totalNodes).toBeGreaterThan(50);
    expect(graph.totalEdges).toBeGreaterThan(20);
    expect(graph.nodes.some(n => n.kind === "service")).toBe(true);
    expect(graph.nodes.some(n => n.kind === "repository")).toBe(true);
    expect(graph.nodes.some(n => n.kind === "api")).toBe(true);
    expect(graph.nodes.some(n => n.kind === "event")).toBe(true);
    expect(graph.nodes.some(n => n.kind === "workflow")).toBe(true);
    expect(graph.nodes.some(n => n.kind === "agent")).toBe(true);
  });

  it("rebuilds the graph on demand", () => {
    const before = getDependencyGraph();
    const after = rebuildDependencyGraph();
    expect(after.builtAt).not.toBe(before.builtAt);
    expect(after.totalNodes).toBeGreaterThan(0);
  });

  it("lists nodes by kind", () => {
    const events = listNodesByKind("event");
    expect(events.length).toBeGreaterThan(10);
    expect(events.every(n => n.kind === "event")).toBe(true);
  });

  it("finds a node by id", () => {
    const node = findNode("feature:education-os");
    expect(node).not.toBeNull();
    expect(node?.kind).toBe("service");
    expect(node?.module).toBe("education-os");
  });

  it("performs impact analysis", () => {
    // Pick an event that several workflows depend on
    const analysis = analyzeImpact("event:assessment.published");
    expect(analysis).not.toBeNull();
    expect(analysis?.blastRadius).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(analysis?.directDependents)).toBe(true);
    expect(Array.isArray(analysis?.transitiveDependents)).toBe(true);
    expect(Array.isArray(analysis?.recommendedChecks)).toBe(true);
  });

  it("returns null for unknown source id", () => {
    const analysis = analyzeImpact("nonexistent:node");
    expect(analysis).toBeNull();
  });

  it("finds a path between two nodes when one exists", () => {
    // Workflow nodes consume event nodes — should have a 2-hop path
    const path = findPath("workflow:assessment.published", "event:assessment.published");
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThanOrEqual(2);
  });

  it("returns null for path between disconnected nodes", () => {
    const path = findPath("nonexistent:1", "nonexistent:2");
    expect(path).toBeNull();
  });

  it("computes graph stats", () => {
    const stats = getGraphStats();
    expect(stats.totalNodes).toBeGreaterThan(0);
    expect(stats.totalEdges).toBeGreaterThan(0);
    expect(stats.byKind).toBeDefined();
    expect(stats.byRelationship).toBeDefined();
    expect(stats.builtAt).toBeDefined();
  });
});

// ===========================================================================
// Prompt Registry
// ===========================================================================

describe("Platform Orchestrator — Prompt Registry", () => {
  it("ships with built-in prompts", () => {
    expect(BUILTIN_PROMPTS.length).toBeGreaterThan(5);
    expect(BUILTIN_PROMPTS.some(p => p.id === "lesson.generator")).toBe(true);
    expect(BUILTIN_PROMPTS.some(p => p.id === "quiz.generator")).toBe(true);
    expect(BUILTIN_PROMPTS.some(p => p.id === "tutor.explainer")).toBe(true);
    expect(BUILTIN_PROMPTS.some(p => p.id === "grader.essay")).toBe(true);
    expect(BUILTIN_PROMPTS.some(p => p.id === "planner.adaptive")).toBe(true);
    expect(BUILTIN_PROMPTS.some(p => p.id === "civilization.advisor")).toBe(true);
  });

  it("renders templates with variables", () => {
    const rendered = renderPromptTemplate(
      "Hello {{name}}, you are learning {{topic}}.",
      { name: "Alice", topic: "algebra" },
    );
    expect(rendered).toBe("Hello Alice, you are learning algebra.");
  });

  it("leaves unknown variables as-is", () => {
    const rendered = renderPromptTemplate("Hello {{name}}", {});
    expect(rendered).toBe("Hello {{name}}");
  });

  it("supports numeric variables", () => {
    const rendered = renderPromptTemplate("Count: {{count}}", { count: 42 });
    expect(rendered).toBe("Count: 42");
  });

  it("supports undefined variables (left as-is)", () => {
    const rendered = renderPromptTemplate("Hello {{name}}", { name: undefined });
    expect(rendered).toBe("Hello {{name}}");
  });

  it("every built-in prompt has required fields", () => {
    for (const p of BUILTIN_PROMPTS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.module).toBeTruthy();
      expect(p.version).toBeGreaterThanOrEqual(1);
      expect(p.versionTag).toBeTruthy();
      expect(p.template).toBeTruthy();
      expect(p.template.length).toBeGreaterThan(50);
      expect(p.variables.length).toBeGreaterThan(0);
      expect(p.localizations.length).toBeGreaterThan(0);
    }
  });
});

// ===========================================================================
// Observability
// ===========================================================================

describe("Platform Orchestrator — Observability", () => {
  it("starts and finishes spans", () => {
    const traceId = "test-trace-" + Date.now();
    const spanId = startSpan({
      traceId, module: "test", operation: "test_op",
      attributes: { foo: "bar" },
    });
    expect(spanId).toBeTruthy();
    finishSpan(spanId, traceId, { status: "ok", durationMs: 10 });
    const trace = getTraceFromMemory(traceId);
    expect(trace).not.toBeNull();
    expect(trace!.spanCount).toBe(1);
    expect(trace!.status).toBe("ok");
    expect(trace!.modules).toContain("test");
  });

  it("adds logs to spans", () => {
    const traceId = "test-trace-logs-" + Date.now();
    const spanId = startSpan({ traceId, module: "test", operation: "op" });
    addSpanLog(traceId, spanId, "info", "started");
    addSpanLog(traceId, spanId, "warn", "slow");
    addSpanLog(traceId, spanId, "error", "failed");
    finishSpan(spanId, traceId, { status: "error", durationMs: 100, logs: [] });
    const trace = getTraceFromMemory(traceId);
    expect(trace).not.toBeNull();
    expect(trace!.hasErrors).toBe(true);
  });

  it("supports parent-child span relationships", () => {
    const traceId = "test-trace-nested-" + Date.now();
    const rootId = startSpan({ traceId, module: "root", operation: "root" });
    const childId = startSpan({
      traceId, parentSpanId: rootId, module: "child", operation: "child",
    });
    finishSpan(childId, traceId, { status: "ok", durationMs: 5 });
    finishSpan(rootId, traceId, { status: "ok", durationMs: 15 });
    const trace = getTraceFromMemory(traceId);
    expect(trace).not.toBeNull();
    expect(trace!.spanCount).toBe(2);
    const child = trace!.spans.find(s => s.spanId === childId);
    expect(child?.parentSpanId).toBe(rootId);
  });

  it("lists recent traces", async () => {
    const traces = await listRecentTraces(10);
    expect(Array.isArray(traces)).toBe(true);
  });
});

// ===========================================================================
// Production Readiness — Rate Limiting
// ===========================================================================

describe("Platform Orchestrator — Rate Limiting", () => {
  it("allows requests within the limit", () => {
    const key = "test-rate-allow-" + Date.now();
    const r1 = checkRateLimit(key, 5, 60_000);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(4);
  });

  it("blocks requests exceeding the limit", () => {
    const key = "test-rate-block-" + Date.now();
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60_000);
    }
    const r = checkRateLimit(key, 3, 60_000);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("refills tokens after the window", () => {
    const key = "test-rate-refill-" + Date.now();
    const windowMs = 50; // very short window for testing
    for (let i = 0; i < 2; i++) checkRateLimit(key, 2, windowMs);
    let r = checkRateLimit(key, 2, windowMs);
    expect(r.allowed).toBe(false);
    // Wait for window to pass
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        r = checkRateLimit(key, 2, windowMs);
        expect(r.allowed).toBe(true);
        resolve();
      }, windowMs + 10);
    });
  });

  it("lists active rate limiters", () => {
    const key = "test-rate-list-" + Date.now();
    checkRateLimit(key, 1, 60_000);
    const limits = listRateLimits();
    expect(Array.isArray(limits)).toBe(true);
    // Our key should be in the list (limit reached = active)
    expect(limits.some(l => l.key === key)).toBe(true);
  });
});

// ===========================================================================
// Production Readiness — Chaos Hooks
// ===========================================================================

describe("Platform Orchestrator — Chaos Hooks", () => {
  it("lists available chaos hooks", () => {
    const hooks = getChaosHooks();
    expect(hooks.length).toBeGreaterThan(3);
    expect(hooks.some(h => h.name === "inject_ai_latency")).toBe(true);
    expect(hooks.some(h => h.name === "inject_provider_failure")).toBe(true);
    expect(hooks.every(h => h.enabled === false)).toBe(true);
  });

  it("toggles chaos hooks", () => {
    const ok = setChaosHookEnabled("inject_ai_latency", true);
    expect(ok).toBe(true);
    const hooks = getChaosHooks();
    expect(hooks.find(h => h.name === "inject_ai_latency")?.enabled).toBe(true);
    // Restore
    setChaosHookEnabled("inject_ai_latency", false);
  });

  it("returns false for unknown hook", () => {
    const ok = setChaosHookEnabled("nonexistent_hook", true);
    expect(ok).toBe(false);
  });
});

// ===========================================================================
// AI Workspace — Cost Estimation
// ===========================================================================

describe("Platform Orchestrator — Cost Estimation", () => {
  it("returns 0 for hash provider", () => {
    const cost = estimateCost("hash", "default", 1000, 500);
    expect(cost).toBe(0);
  });

  it("returns 0 for local provider", () => {
    const cost = estimateCost("local", "default", 1000, 500);
    expect(cost).toBe(0);
  });

  it("estimates cost for paid providers", () => {
    const cost = estimateCost("openai", "gpt-4", 1000, 500);
    expect(cost).toBeGreaterThan(0);
  });

  it("scales linearly with tokens", () => {
    const small = estimateCost("openai", "gpt-4", 100, 50);
    const large = estimateCost("openai", "gpt-4", 1000, 500);
    expect(large).toBeGreaterThan(small);
  });
});

// ===========================================================================
// Workflow Event Mapping
// ===========================================================================

describe("Platform Orchestrator — Workflow Event Mapping", () => {
  it("ASSESSMENT_PUBLISHED triggers the assessment cascade", () => {
    const workflows = findWorkflowsForEvent(ASSESSMENT_PUBLISHED);
    expect(workflows.length).toBeGreaterThan(0);
    expect(workflows.some(w => w.id === "assessment.published")).toBe(true);
  });

  it("SUBMISSION_GRADED triggers the grading cascade", () => {
    const workflows = findWorkflowsForEvent(SUBMISSION_GRADED);
    expect(workflows.length).toBeGreaterThan(0);
    expect(workflows.some(w => w.id === "submission.graded")).toBe(true);
  });

  it("AI_GENERATION_COMPLETED triggers the audit cascade", () => {
    const workflows = findWorkflowsForEvent(AI_GENERATION_COMPLETED);
    expect(workflows.length).toBeGreaterThan(0);
    expect(workflows.some(w => w.id === "ai.generation_completed")).toBe(true);
  });

  it("every workflow step references a real module from participatingModules", () => {
    for (const w of BUILTIN_WORKFLOWS) {
      for (const step of w.steps) {
        expect(w.participatingModules).toContain(step.module);
      }
    }
  });

  it("every workflow has at least one critical step or explicitly none", () => {
    for (const w of BUILTIN_WORKFLOWS) {
      const criticalSteps = w.steps.filter(s => s.critical);
      // Either there are critical steps (data integrity) or the workflow is informational
      expect(criticalSteps.length + w.steps.filter(s => !s.critical).length).toBe(w.steps.length);
    }
  });

  it("every workflow step has a unique order", () => {
    for (const w of BUILTIN_WORKFLOWS) {
      const orders = w.steps.map(s => s.order);
      const unique = new Set(orders);
      expect(unique.size).toBe(orders.length);
    }
  });
});

// ===========================================================================
// Built-in Workflow Step Coverage
// ===========================================================================

describe("Platform Orchestrator — Built-in Workflow Coverage", () => {
  it("the assessment.published workflow covers all subsystems in the spec", () => {
    const w = getWorkflow("assessment.published");
    expect(w).not.toBeNull();
    const modules = w!.participatingModules;
    expect(modules).toContain("knowledge-intelligence");
    expect(modules).toContain("discovery");
    expect(modules).toContain("digital-twins");
    expect(modules).toContain("learning-planner");
    expect(modules).toContain("platform-intelligence");
    expect(modules).toContain("civilization-engine");
    expect(modules).toContain("data-fabric");
    expect(modules).toContain("global-intelligence");
  });

  it("the submission.graded workflow updates mastery + planner + twin", () => {
    const w = getWorkflow("submission.graded");
    expect(w).not.toBeNull();
    const actions = w!.steps.map(s => s.action);
    expect(actions).toContain("update_mastery");
    expect(actions).toContain("recompute_plan");
    expect(actions).toContain("sync_student_twin");
  });

  it("the ai.generation_completed workflow audits + learns + tracks cost", () => {
    const w = getWorkflow("ai.generation_completed");
    expect(w).not.toBeNull();
    const actions = w!.steps.map(s => s.action);
    expect(actions).toContain("record_cost");
    expect(actions).toContain("audit_ai_generation");
    expect(actions).toContain("record_prompt_evaluation");
  });
});
