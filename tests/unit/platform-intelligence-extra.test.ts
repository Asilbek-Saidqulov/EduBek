/**
 * EduBek — Phase 4F.7 Platform Intelligence — additional tests.
 *
 * Targets 170+ total tests across the suite. These cover edge cases
 * + additional modules (optimization parameters, forecasting scenarios,
 * health subsystems, audit helpers, analytics aggregators).
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
} from "@/features/education-os/events";
import {
  listRegisteredAgents,
  getAgentDefinition,
} from "@/features/education-os/coordinator";
import {
  listWorkflowTypes,
  getWorkflowDefinition,
} from "@/features/education-os/workflow";
import {
  runForecast,
  listForecasts,
} from "@/features/platform-intelligence/forecasting";
import {
  checkSubsystem,
} from "@/features/platform-intelligence/health";
import {
  recordAudit,
  listAuditEvents,
  auditRecommendation,
  auditAutomationTrigger,
} from "@/features/platform-intelligence/audit";
import {
  computeCurriculumIntelligence,
  computeMarketplaceIntelligence,
  generatePlatformInsights,
} from "@/features/platform-intelligence/analytics";

const TEST_USER = `test-4f7-extra-${Date.now()}`;

// ---------------------------------------------------------------------------
// Forecasting — additional scenarios
// ---------------------------------------------------------------------------

describe("Forecasting — additional scenarios", () => {
  it("forecasts resource decay", async () => {
    const forecast = await runForecast({ type: "resource_decay", horizon: "90d" });
    expect(forecast.forecastType).toBe("resource_decay");
    expect(forecast.confidence).toBeGreaterThan(0);
  });

  it("forecasts teacher workload", async () => {
    const forecast = await runForecast({ type: "teacher_workload", horizon: "7d" });
    expect(forecast.forecastType).toBe("teacher_workload");
  });

  it("forecasts curriculum gaps", async () => {
    const forecast = await runForecast({ type: "curriculum_gaps", horizon: "30d" });
    expect(forecast.forecastType).toBe("curriculum_gaps");
  });

  it("forecasts search trends", async () => {
    const forecast = await runForecast({ type: "search_trends", horizon: "7d" });
    expect(forecast.forecastType).toBe("search_trends");
  });

  it("forecasts topic popularity", async () => {
    const forecast = await runForecast({ type: "topic_popularity", horizon: "30d" });
    expect(forecast.forecastType).toBe("topic_popularity");
  });

  it("forecasts AI credit usage", async () => {
    const forecast = await runForecast({ type: "ai_credit_usage", horizon: "30d" });
    expect(forecast.forecastType).toBe("ai_credit_usage");
  });

  it("forecasts resource popularity", async () => {
    const forecast = await runForecast({ type: "resource_popularity", horizon: "30d" });
    expect(forecast.forecastType).toBe("resource_popularity");
  });

  it("lists forecasts with type filter", async () => {
    const forecasts = await listForecasts({ type: "dropout", limit: 5 });
    expect(Array.isArray(forecasts)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Health — individual subsystem checks
// ---------------------------------------------------------------------------

describe("Health — individual subsystems", () => {
  const subsystems = [
    "discovery", "search", "recommendations", "ai", "marketplace",
    "knowledge_graph", "education_os", "learning_planner", "localization",
    "automation", "knowledge_intelligence", "collaboration",
  ] as const;

  for (const subsystem of subsystems) {
    it(`checks ${subsystem} subsystem`, async () => {
      const snapshot = await checkSubsystem(subsystem);
      expect(snapshot.subsystem).toBe(subsystem);
      expect(["healthy", "degraded", "down", "unknown"]).toContain(snapshot.status);
      expect(typeof snapshot.score).toBe("number");
      expect(snapshot.score).toBeGreaterThanOrEqual(0);
      expect(snapshot.score).toBeLessThanOrEqual(1);
    });
  }
});

// ---------------------------------------------------------------------------
// Audit — convenience helpers
// ---------------------------------------------------------------------------

describe("Audit — convenience helpers", () => {
  it("auditRecommendation creates an audit event", async () => {
    await auditRecommendation({
      userId: TEST_USER,
      entityType: "resource",
      entityId: `test-entity-audit-${Date.now()}`,
      strategy: "for_you",
      reasoning: "User showed interest in similar resources",
      confidence: 0.8,
      affectedModules: ["semantic-search", "discovery"],
    });

    const events = await listAuditEvents({
      actionType: "recommendation",
      affectedUserId: TEST_USER,
      limit: 5,
    });
    expect(events.length).toBeGreaterThan(0);
  });

  it("auditAutomationTrigger creates an audit event", async () => {
    await auditAutomationTrigger({
      ruleId: `test-rule-${Date.now()}`,
      ruleName: "Test automation",
      eventType: "QuizCompleted",
      reasoning: "Triggered because quiz score was below threshold",
      confidence: 0.85,
    });

    const events = await listAuditEvents({
      actionType: "automation_trigger",
      limit: 5,
    });
    expect(events.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Analytics — curriculum + marketplace intelligence
// ---------------------------------------------------------------------------

describe("Analytics — curriculum + marketplace intelligence", () => {
  it("computes curriculum intelligence with all required fields", async () => {
    const intelligence = await computeCurriculumIntelligence({});
    expect(intelligence).toBeTruthy();
    expect(Array.isArray(intelligence.missingStandards)).toBe(true);
    expect(Array.isArray(intelligence.overrepresentedStandards)).toBe(true);
    expect(Array.isArray(intelligence.underrepresentedConcepts)).toBe(true);
    expect(typeof intelligence.curriculumDrift).toBe("number");
    expect(intelligence.curriculumDrift).toBeGreaterThanOrEqual(0);
    expect(intelligence.curriculumDrift).toBeLessThanOrEqual(1);
    expect(Array.isArray(intelligence.teacherDemand)).toBe(true);
    expect(Array.isArray(intelligence.studentDemand)).toBe(true);
    expect(Array.isArray(intelligence.aiDemand)).toBe(true);
  });

  it("computes marketplace intelligence with all required fields", async () => {
    const intelligence = await computeMarketplaceIntelligence();
    expect(intelligence).toBeTruthy();
    expect(Array.isArray(intelligence.bestSellers)).toBe(true);
    expect(Array.isArray(intelligence.refundRisks)).toBe(true);
    expect(typeof intelligence.buyerSatisfaction).toBe("number");
  });

  it("generates platform insights without errors", async () => {
    const insights = await generatePlatformInsights();
    expect(Array.isArray(insights)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Education OS — re-verification (ensures prior phases still work)
// ---------------------------------------------------------------------------

describe("Education OS — re-verification", () => {
  it("still registers all 9 agents", () => {
    const agents = listRegisteredAgents();
    expect(agents).toHaveLength(9);
  });

  it("still lists all 8 workflow types", () => {
    const types = listWorkflowTypes();
    expect(types).toHaveLength(8);
  });

  it("full_teaching_cycle still has 7 steps", () => {
    const def = getWorkflowDefinition("full_teaching_cycle");
    expect(def!.steps).toHaveLength(7);
  });

  it("includes all 8 Education OS event types", () => {
    expect(EDUCATION_OS_EVENT_TYPES).toHaveLength(8);
  });

  it("isEducationOsEventType validates correctly", () => {
    expect(isEducationOsEventType("ResourceCreated")).toBe(true);
    expect(isEducationOsEventType("Nonexistent")).toBe(false);
  });

  it("includes 5 built-in automation policy templates", () => {
    expect(POLICY_TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });

  it("evaluates conditions with == operator", () => {
    expect(evaluateConditions({ status: { "==": "active" } }, { status: "active" })).toBe(true);
  });

  it("getAgentDefinition returns null for unknown agent", () => {
    expect(getAgentDefinition("nonexistent" as any)).toBeNull();
  });

  it("getPolicyTemplate returns null for unknown policy", () => {
    expect(getPolicyTemplate("nonexistent")).toBeNull();
  });
});
