/**
 * EduBek — Product Intelligence tests.
 *
 * Phase 5D.5: Verifies the experience orchestration layer — journey
 * engine, workspace manager, attention engine, assistant routing,
 * smart actions, adaptive UI, intent engine, product memory,
 * notification intelligence, and analytics.
 *
 * Tests are DB-light — they focus on in-process logic that doesn't
 * require a running database. DB-backed tests use the existing test
 * infrastructure.
 */
import { describe, it, expect } from "vitest";
import {
  JOURNEY_TEMPLATES, listJourneyTemplates, getJourneyTemplate,
  computeJourneySuggestions,
} from "@/features/product-intelligence/journey-engine";
import {
  routeAssistant, AGENT_METADATA, listAgents,
} from "@/features/product-intelligence/assistant-orchestrator";
import {
  detectIntent, listIntents,
} from "@/features/product-intelligence/intent-engine";
import {
  computeAdaptiveInterface,
} from "@/features/product-intelligence/adaptive-ui";
import {
  MEMORY_KEYS, setMemory, getMemory, deleteMemory, getMemoryReport,
  addFavoriteView, removeFavoriteView, hideWidget, showWidget,
  setDashboardLayout, setPreferredAIStyle, recordVisitedPage,
} from "@/features/product-intelligence/product-memory";
import {
  summarizeTitle, summarizeBody, computePriority, computeBatchPriority,
  shouldDelayBatch,
} from "@/features/product-intelligence/notification-intelligence";
import type { UnifiedProductContext } from "@/features/product-intelligence/types";
import { db } from "@/lib/db";

// ===========================================================================
// Journey Engine
// ===========================================================================

describe("Product Intelligence — Journey Engine", () => {
  it("ships with 8 journey templates", () => {
    expect(JOURNEY_TEMPLATES.length).toBe(8);
    expect(JOURNEY_TEMPLATES.some(t => t.kind === "teacher_lesson_creation")).toBe(true);
    expect(JOURNEY_TEMPLATES.some(t => t.kind === "teacher_exam_preparation")).toBe(true);
    expect(JOURNEY_TEMPLATES.some(t => t.kind === "student_studying")).toBe(true);
    expect(JOURNEY_TEMPLATES.some(t => t.kind === "organization_analytics")).toBe(true);
    expect(JOURNEY_TEMPLATES.some(t => t.kind === "marketplace_publishing")).toBe(true);
    expect(JOURNEY_TEMPLATES.some(t => t.kind === "research")).toBe(true);
    expect(JOURNEY_TEMPLATES.some(t => t.kind === "certification")).toBe(true);
  });

  it("lists journey templates", () => {
    const templates = listJourneyTemplates();
    expect(templates.length).toBe(8);
    expect(templates[0]).toHaveProperty("kind");
    expect(templates[0]).toHaveProperty("title");
    expect(templates[0]).toHaveProperty("stepCount");
  });

  it("retrieves a template by kind", () => {
    const t = getJourneyTemplate("teacher_lesson_creation");
    expect(t).not.toBeNull();
    expect(t?.title).toBe("Create a Lesson");
    expect(t?.steps.length).toBeGreaterThan(3);
  });

  it("returns null for unknown journey kind", () => {
    const t = getJourneyTemplate("nonexistent" as never);
    expect(t).toBeNull();
  });

  it("every template has at least 3 steps with unique order", () => {
    for (const t of JOURNEY_TEMPLATES) {
      expect(t.steps.length).toBeGreaterThanOrEqual(3);
      const orders = t.steps.map(s => s.index);
      const unique = new Set(orders);
      expect(unique.size).toBe(orders.length);
    }
  });

  it("every step references a real module", () => {
    for (const t of JOURNEY_TEMPLATES) {
      for (const s of t.steps) {
        expect(s.module).toBeTruthy();
      }
    }
  });

  it("computes suggestions from journey state", () => {
    const suggestions = computeJourneySuggestions({
      kind: "teacher_lesson_creation",
      title: "Test",
      completionPercent: 60,
      estimatedRemainingMinutes: 20,
      currentStepIndex: 2,
      steps: [
        { index: 0, label: "Step 0", status: "completed", module: "test", aiAssisted: false },
        { index: 1, label: "Step 1", status: "completed", module: "test", aiAssisted: false },
        { index: 2, label: "Step 2", status: "in_progress", module: "test", aiAssisted: true, actionUrl: "/test" },
        { index: 3, label: "Step 3", status: "pending", module: "test", aiAssisted: false },
      ],
      suggestions: [],
      blockedSteps: [{ stepIndex: 3, reason: "Missing prerequisite" }],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(suggestions.length).toBeGreaterThan(0);
    // Should include a suggestion about resolving blocked steps (priority 90)
    expect(suggestions.some(s => s.priority === 90)).toBe(true);
    // Should include a suggestion about AI assistance (current step is aiAssisted)
    expect(suggestions.some(s => s.priority === 80)).toBe(true);
  });
});

// ===========================================================================
// Assistant Orchestrator
// ===========================================================================

describe("Product Intelligence — Assistant Orchestrator", () => {
  it("has 8 agents", () => {
    const agents = Object.keys(AGENT_METADATA);
    expect(agents.length).toBe(8);
    expect(agents).toContain("teacher");
    expect(agents).toContain("student");
    expect(agents).toContain("research");
    expect(agents).toContain("assessment");
    expect(agents).toContain("curriculum");
    expect(agents).toContain("organization");
    expect(agents).toContain("marketplace");
    expect(agents).toContain("planner");
  });

  it("lists agents", () => {
    const agents = listAgents();
    expect(agents.length).toBe(8);
    expect(agents[0]).toHaveProperty("kind");
    expect(agents[0]).toHaveProperty("label");
    expect(agents[0]).toHaveProperty("description");
  });

  it("routes lesson-related query to teacher agent", async () => {
    const routing = await routeAssistant("I need to create a lesson for tomorrow");
    expect(routing.primaryAgent).toBe("teacher");
    expect(routing.confidence).toBeGreaterThan(0);
    expect(routing.requiredSubsystems).toContain("knowledge-intelligence");
  });

  it("routes research query to research agent", async () => {
    const routing = await routeAssistant("Help me with my research paper");
    expect(routing.primaryAgent).toBe("research");
    expect(routing.requiredSubsystems).toContain("research-platform");
  });

  it("routes marketplace query to marketplace agent", async () => {
    const routing = await routeAssistant("I want to sell my quiz on the marketplace");
    expect(routing.primaryAgent).toBe("marketplace");
  });

  it("routes assessment query to assessment agent", async () => {
    const routing = await routeAssistant("Create an exam for my students");
    expect(routing.primaryAgent).toBe("assessment");
  });

  it("defaults to student agent for vague queries", async () => {
    const routing = await routeAssistant("hello");
    expect(routing.primaryAgent).toBe("student");
    expect(routing.confidence).toBeLessThan(0.5);
  });

  it("every agent has keywords and required subsystems", () => {
    for (const [kind, meta] of Object.entries(AGENT_METADATA)) {
      expect(meta.keywords.length).toBeGreaterThan(0);
      expect(meta.requiredSubsystems.length).toBeGreaterThan(0);
      expect(meta.label).toBeTruthy();
      expect(meta.description).toBeTruthy();
    }
  });
});

// ===========================================================================
// Intent Engine
// ===========================================================================

describe("Product Intelligence — Intent Engine", () => {
  it("lists known intents", () => {
    const intents = listIntents();
    expect(intents.length).toBeGreaterThanOrEqual(8);
    expect(intents.some(i => i.intent === "create_lesson")).toBe(true);
    expect(intents.some(i => i.intent === "create_exam")).toBe(true);
    expect(intents.some(i => i.intent === "study")).toBe(true);
    expect(intents.some(i => i.intent === "grade")).toBe(true);
    expect(intents.some(i => i.intent === "research")).toBe(true);
    expect(intents.some(i => i.intent === "certify")).toBe(true);
  });

  it("detects 'create lesson' intent", async () => {
    const intent = await detectIntent({ userId: "test-user", query: "I need tomorrow's lesson" });
    expect(intent.intent).toBe("create_lesson");
    expect(intent.detected).toBe(true);
    expect(intent.confidence).toBeGreaterThan(0.3);
    expect(intent.requiredAgents).toContain("teacher");
    expect(intent.requiredSystems).toContain("ai-workspace");
  });

  it("detects 'create exam' intent", async () => {
    const intent = await detectIntent({ userId: "test-user", query: "Create an exam for my class" });
    expect(intent.intent).toBe("create_exam");
    expect(intent.detected).toBe(true);
  });

  it("detects 'study' intent", async () => {
    const intent = await detectIntent({ userId: "test-user", query: "I want to study and review" });
    expect(intent.intent).toBe("study");
    expect(intent.detected).toBe(true);
  });

  it("falls back to ask_ai intent for unknown queries", async () => {
    const intent = await detectIntent({ userId: "test-user", query: "zzz unknown query zzz" });
    expect(intent.detected).toBe(false);
    expect(intent.confidence).toBeLessThan(0.5);
  });

  it("every intent has recommended actions", async () => {
    const intents = listIntents();
    for (const i of intents) {
      // detectIntent returns the recommendedActions for each intent
      const detected = await detectIntent({ userId: "test", query: i.label });
      if (detected.detected) {
        expect(detected.recommendedActions.length).toBeGreaterThan(0);
      }
    }
  });
});

// ===========================================================================
// Adaptive UI
// ===========================================================================

describe("Product Intelligence — Adaptive Interface", () => {
  function makeContext(overrides: Partial<UnifiedProductContext> = {}): UnifiedProductContext {
    return {
      traceId: "test-trace",
      user: { id: "test-user", roles: ["student"], isSuperadmin: false },
      organization: null,
      classroom: null,
      permissions: {
        canCreate: false, canGrade: false, canPublish: false,
        canManageOrg: false, canViewAnalytics: false, canUseAI: true, total: 1,
      },
      curriculum: { conceptsCovered: 0, frameworksAligned: [], coveragePercent: 0, pendingTopics: [] },
      learningGoals: { activeGoals: 0, completedGoals: 0, overdueTasks: 0, nextMilestone: null },
      activeAssignments: { asStudent: 0, asTeacher: 0, nextDue: null },
      recommendations: { personalized: [], nextSteps: [] },
      aiHistory: { sessionsToday: 0, totalSessions: 0, lastPrompt: null, lastInvocationAt: null },
      digitalTwin: { twinType: null, twinId: null, topPredictions: [], lastSyncedAt: null },
      planner: { activeGoals: 0, streakDays: 0, burnoutRisk: 0, completionRate: 0, nextMilestone: null },
      currentWorkflow: null,
      openDrafts: [],
      notifications: { unread: 0, highPriority: 0, latest: [] },
      productMemory: {
        favoriteViews: [], hiddenWidgets: [], dashboardLayout: {},
        preferredAIStyle: "balanced", lastVisitedPages: [],
      },
      assembledAt: new Date().toISOString(),
      ...overrides,
    };
  }

  it("computes adaptive interface for a student", () => {
    const ctx = makeContext();
    const ui = computeAdaptiveInterface(ctx);
    expect(ui.recommendedWidgets.length).toBeGreaterThan(0);
    expect(ui.dashboardOrder.length).toBeGreaterThan(0);
    expect(ui.quickActions.length).toBeGreaterThan(0);
    expect(ui.rationale).toContain("student role");
  });

  it("computes adaptive interface for a teacher", () => {
    const ctx = makeContext({
      user: { id: "test-teacher", roles: ["teacher"], isSuperadmin: false },
      permissions: {
        canCreate: true, canGrade: true, canPublish: true,
        canManageOrg: false, canViewAnalytics: true, canUseAI: true, total: 5,
      },
    });
    const ui = computeAdaptiveInterface(ctx);
    expect(ui.recommendedWidgets.some(w => w.id === "grading_queue")).toBe(true);
    expect(ui.recommendedWidgets.some(w => w.id === "at_risk_students")).toBe(true);
    expect(ui.quickActions.some(a => a.id === "new_lesson")).toBe(true);
  });

  it("promotes urgent notifications to important cards", () => {
    const ctx = makeContext({
      notifications: { unread: 5, highPriority: 2, latest: [] },
    });
    const ui = computeAdaptiveInterface(ctx);
    expect(ui.importantCards.some(c => c.id === "urgent_notifications_card")).toBe(true);
  });

  it("shows burnout warning card when burnout risk is high", () => {
    const ctx = makeContext({
      planner: { activeGoals: 3, streakDays: 30, burnoutRisk: 0.8, completionRate: 0.7, nextMilestone: null },
    });
    const ui = computeAdaptiveInterface(ctx);
    expect(ui.importantCards.some(c => c.id === "burnout_warning_card")).toBe(true);
  });

  it("respects hidden widgets from product memory", () => {
    const ctx = makeContext({
      productMemory: {
        favoriteViews: [], hiddenWidgets: ["streak"], dashboardLayout: {},
        preferredAIStyle: "balanced", lastVisitedPages: [],
      },
    });
    const ui = computeAdaptiveInterface(ctx);
    expect(ui.recommendedWidgets.find(w => w.id === "streak")).toBeUndefined();
  });

  it("applies saved dashboard layout from memory", () => {
    const ctx = makeContext({
      productMemory: {
        favoriteViews: [], hiddenWidgets: [],
        dashboardLayout: { order: ["custom_widget", "learning_plan"] },
        preferredAIStyle: "balanced", lastVisitedPages: [],
      },
    });
    const ui = computeAdaptiveInterface(ctx);
    expect(ui.dashboardOrder[0]).toBe("custom_widget");
  });
});

// ===========================================================================
// Product Memory (DB-backed)
// ===========================================================================

describe("Product Intelligence — Product Memory", () => {
  const testUserId = "test-memory-user-" + Date.now();

  it("sets and gets a memory entry", async () => {
    await setMemory(testUserId, "test_key", { foo: "bar" }, "preference");
    const value = await getMemory(testUserId, "test_key", null);
    expect(value).toEqual({ foo: "bar" });
  });

  it("returns fallback for missing key", async () => {
    const value = await getMemory(testUserId, "nonexistent_key", "fallback");
    expect(value).toBe("fallback");
  });

  it("deletes a memory entry", async () => {
    await setMemory(testUserId, "delete_me", "value", "preference");
    await deleteMemory(testUserId, "delete_me");
    const value = await getMemory(testUserId, "delete_me", "default");
    expect(value).toBe("default");
  });

  it("manages favorite views", async () => {
    await addFavoriteView(testUserId, "view1");
    await addFavoriteView(testUserId, "view2");
    const report = await getMemoryReport(testUserId);
    expect(report.favoriteViews).toContain("view1");
    expect(report.favoriteViews).toContain("view2");
    await removeFavoriteView(testUserId, "view1");
    const report2 = await getMemoryReport(testUserId);
    expect(report2.favoriteViews).not.toContain("view1");
    expect(report2.favoriteViews).toContain("view2");
  });

  it("manages hidden widgets", async () => {
    await hideWidget(testUserId, "widget1");
    const report = await getMemoryReport(testUserId);
    expect(report.hiddenWidgets).toContain("widget1");
    await showWidget(testUserId, "widget1");
    const report2 = await getMemoryReport(testUserId);
    expect(report2.hiddenWidgets).not.toContain("widget1");
  });

  it("sets dashboard layout", async () => {
    await setDashboardLayout(testUserId, { order: ["widget1", "widget2"] });
    const report = await getMemoryReport(testUserId);
    expect(report.dashboardLayout.order).toEqual(["widget1", "widget2"]);
  });

  it("sets preferred AI style", async () => {
    await setPreferredAIStyle(testUserId, "concise");
    const report = await getMemoryReport(testUserId);
    expect(report.preferredAIStyle).toBe("concise");
  });

  it("records visited pages with deduplication and cap", async () => {
    for (let i = 0; i < 25; i++) {
      await recordVisitedPage(testUserId, `/page/${i}`);
    }
    await recordVisitedPage(testUserId, "/page/0"); // duplicate
    const report = await getMemoryReport(testUserId);
    expect(report.lastVisitedPages.length).toBeLessThanOrEqual(20);
    expect(report.lastVisitedPages[0]).toBe("/page/0"); // most recent
    // Only one occurrence of /page/0
    expect(report.lastVisitedPages.filter(p => p === "/page/0").length).toBe(1);
  });

  it("exposes well-known memory keys", () => {
    expect(MEMORY_KEYS.favoriteViews).toBe("favorite_views");
    expect(MEMORY_KEYS.hiddenWidgets).toBe("hidden_widgets");
    expect(MEMORY_KEYS.dashboardLayout).toBe("dashboard_layout");
    expect(MEMORY_KEYS.preferredAIStyle).toBe("preferred_ai_style");
    expect(MEMORY_KEYS.lastVisitedPages).toBe("last_visited_pages");
  });
});

// ===========================================================================
// Notification Intelligence
// ===========================================================================

describe("Product Intelligence — Notification Intelligence", () => {
  it("summarizes titles by type", () => {
    expect(summarizeTitle("assessment_submitted", 1)).toBe("1 New submissions");
    expect(summarizeTitle("review", 5)).toBe("5 New reviews");
    expect(summarizeTitle("purchase", 3)).toBe("3 New purchases");
    expect(summarizeTitle("unknown_type", 2)).toBe("2 Notifications");
  });

  it("summarizes body with count", () => {
    const group = [
      { id: "1", type: "review", title: "T1", body: "Body 1", createdAt: new Date() },
      { id: "2", type: "review", title: "T2", body: "Body 2", createdAt: new Date() },
    ];
    const summary = summarizeBody(group);
    expect(summary).toContain("Body");
    expect(summary).toContain("+1 more");
  });

  it("computes priority by type", () => {
    expect(computePriority("assessment_submitted")).toBe(85);
    expect(computePriority("grading_required")).toBe(85);
    expect(computePriority("review")).toBe(60);
    expect(computePriority("unknown_type")).toBe(40);
  });

  it("boosts priority for larger batches", () => {
    const base = computePriority("review");
    const batched = computeBatchPriority("review", 6);
    expect(batched).toBeGreaterThan(base);
    expect(batched).toBeLessThanOrEqual(100);
  });

  it("delays low-priority batches of 3+", () => {
    expect(shouldDelayBatch("system", [
      { id: "1", type: "system", title: "T", body: "B", createdAt: new Date() },
      { id: "2", type: "system", title: "T", body: "B", createdAt: new Date() },
      { id: "3", type: "system", title: "T", body: "B", createdAt: new Date() },
    ])).toBe(true);
    expect(shouldDelayBatch("alert", [
      { id: "1", type: "alert", title: "T", body: "B", createdAt: new Date() },
    ])).toBe(false);
  });
});

// ===========================================================================
// Workspace Manager (DB-backed)
// ===========================================================================

describe("Product Intelligence — Workspace Manager", () => {
  const testUserId = "test-workspace-user-" + Date.now();

  it("creates and retrieves a workspace", async () => {
    const { createWorkspace, getWorkspace } = await import("@/features/product-intelligence/workspace-manager");
    const ws = await createWorkspace({
      userId: testUserId, kind: "lesson", title: "Test Workspace",
      draft: { topic: "algebra" },
    });
    expect(ws.id).toBeTruthy();
    expect(ws.kind).toBe("lesson");
    expect(ws.active).toBe(true);
    const fetched = await getWorkspace(ws.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe("Test Workspace");
  });

  it("saves and restores drafts", async () => {
    const { createWorkspace, saveDraft, getWorkspace } = await import("@/features/product-intelligence/workspace-manager");
    const ws = await createWorkspace({
      userId: testUserId, kind: "lesson", title: "Draft Test",
    });
    await saveDraft(ws.id, { topic: "geometry", sections: ["intro", "examples"] });
    const fetched = await getWorkspace(ws.id);
    expect(fetched?.draft).toEqual({ topic: "geometry", sections: ["intro", "examples"] });
    expect(fetched?.autosavedAt).not.toBeNull();
  });

  it("adds and closes tabs", async () => {
    const { createWorkspace, addTab, closeTab, getWorkspace } = await import("@/features/product-intelligence/workspace-manager");
    const ws = await createWorkspace({
      userId: testUserId, kind: "lesson", title: "Tabs Test",
    });
    const updated = await addTab(ws.id, { label: "Tab 1", kind: "resource", dirty: false });
    expect(updated?.tabs.length).toBe(1);
    expect(updated?.tabs[0].label).toBe("Tab 1");
    const updated2 = await addTab(ws.id, { label: "Tab 2", kind: "ai_session", dirty: true });
    expect(updated2?.tabs.length).toBe(2);
    const updated3 = await closeTab(ws.id, updated2!.tabs[0].id);
    expect(updated3?.tabs.length).toBe(1);
    expect(updated3?.tabs[0].label).toBe("Tab 2");
  });

  it("pushes and pops undo entries", async () => {
    const { createWorkspace, pushUndo, popUndo, getWorkspace } = await import("@/features/product-intelligence/workspace-manager");
    const ws = await createWorkspace({
      userId: testUserId, kind: "lesson", title: "Undo Test",
    });
    await pushUndo(ws.id, {
      action: "delete_section",
      undoToken: "restore_section",
      beforeState: { sectionId: "s1" },
    });
    const { entry, workspace } = await popUndo(ws.id);
    expect(entry).not.toBeNull();
    expect(entry?.action).toBe("delete_section");
    expect(workspace?.undoStack.length).toBe(0);
  });
});

// ===========================================================================
// Cross-Module Navigation (DB-backed)
// ===========================================================================

describe("Product Intelligence — Cross-Module Navigation", () => {
  it("builds a navigation graph for an unknown entity", async () => {
    const { buildNavigationGraph } = await import("@/features/product-intelligence/cross-module-navigation");
    const graph = await buildNavigationGraph("unknown_type", "unknown_id");
    expect(graph.root).toEqual({ type: "unknown_type", id: "unknown_id", title: "unknown_id" });
    expect(graph.totalRelations).toBeGreaterThanOrEqual(0);
  });
});
