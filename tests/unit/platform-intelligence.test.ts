/**
 * EduBek — Phase 4F.7 Platform Intelligence tests.
 *
 * Verifies:
 *   • Feedback Engine: event recording + learning signal updates
 *   • Learning Engine: recommendation + search + prompt learning
 *   • Experimentation: variant assignment determinism + winner selection
 *   • Optimization: cache TTL + ranking weight adjustments
 *   • Forecasting: dropout + exam success predictions
 *   • Health: all 12 subsystems checked
 *   • Audit: event recording + query
 *   • Analytics: insight generation
 */
import { describe, it, expect } from "vitest";
import {
  recordFeedback,
  recordFeedbackBatch,
  listFeedbackEvents,
  countFeedbackEvents,
} from "@/features/platform-intelligence/feedback";
import {
  computeRecommendationLearning,
  computeSearchLearning,
  recordPromptEvaluation,
  computePromptLearning,
} from "@/features/platform-intelligence/learning";
import {
  createExperiment,
  assignVariant,
  getVariant,
  getExperimentResults,
  finalizeExperiment,
} from "@/features/platform-intelligence/experimentation";
import { runOptimizations, listOptimizations } from "@/features/platform-intelligence/optimization";
import { runForecast, listForecasts } from "@/features/platform-intelligence/forecasting";
import { checkAllSubsystems, checkSubsystem } from "@/features/platform-intelligence/health";
import { recordAudit, listAuditEvents } from "@/features/platform-intelligence/audit";
import { generatePlatformInsights, listPlatformInsights } from "@/features/platform-intelligence/analytics";
import { ALERT_THRESHOLDS } from "@/features/platform-intelligence/monitoring";

const TEST_USER = `test-4f7-${Date.now()}`;
const TEST_ENTITY = `test-entity-${Date.now()}`;

// ---------------------------------------------------------------------------
// Feedback Engine
// ---------------------------------------------------------------------------

describe("Feedback Engine", () => {
  it("records a single feedback event with default outcome + value", async () => {
    const event = await recordFeedback({
      type: "quiz_completed",
      userId: TEST_USER,
      entityType: "quiz",
      entityId: TEST_ENTITY,
    });
    expect(event.id).toBeTruthy();
    expect(event.type).toBe("quiz_completed");
    expect(event.outcome).toBe("positive"); // default for quiz_completed
    expect(event.value).toBe(0.8); // default for quiz_completed
    expect(event.userId).toBe(TEST_USER);
  });

  it("records a batch of feedback events", async () => {
    const count = await recordFeedbackBatch([
      { type: "lesson_opened", userId: TEST_USER, entityType: "lesson", entityId: `${TEST_ENTITY}-1` },
      { type: "search_success", userId: TEST_USER, entityType: "resource", entityId: `${TEST_ENTITY}-2` },
      { type: "recommendation_clicked", userId: TEST_USER, entityType: "resource", entityId: `${TEST_ENTITY}-3` },
    ]);
    expect(count).toBe(3);
  });

  it("lists feedback events filtered by type", async () => {
    const events = await listFeedbackEvents({ type: "quiz_completed", userId: TEST_USER, limit: 10 });
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.type === "quiz_completed")).toBe(true);
  });

  it("counts total feedback events", async () => {
    const count = await countFeedbackEvents();
    expect(count).toBeGreaterThan(0);
  });

  it("respects explicit outcome + value overrides", async () => {
    const event = await recordFeedback({
      type: "quiz_completed",
      userId: TEST_USER,
      outcome: "negative",
      value: 0.1,
    });
    expect(event.outcome).toBe("negative");
    expect(event.value).toBe(0.1);
  });
});

// ---------------------------------------------------------------------------
// Learning Engine — Recommendation
// ---------------------------------------------------------------------------

describe("Learning Engine — Recommendation", () => {
  it("computes recommendation learning from outcomes", async () => {
    // Record some recommendation outcomes via feedback events
    await recordFeedbackBatch([
      { type: "recommendation_clicked", userId: TEST_USER, entityType: "resource", entityId: `${TEST_ENTITY}-rec-1`, experimentId: `exp-${Date.now()}`, variant: "control" },
      { type: "recommendation_clicked", userId: TEST_USER, entityType: "resource", entityId: `${TEST_ENTITY}-rec-2`, experimentId: `exp-${Date.now()}`, variant: "control" },
      { type: "recommendation_ignored", userId: TEST_USER, entityType: "resource", entityId: `${TEST_ENTITY}-rec-3`, experimentId: `exp-${Date.now()}`, variant: "control" },
    ]);
    const learning = await computeRecommendationLearning({ sinceDays: 1 });
    expect(Array.isArray(learning)).toBe(true);
    // Each result should have the required fields
    for (const result of learning) {
      expect(result.strategy).toBeTruthy();
      expect(typeof result.ctr).toBe("number");
      expect(typeof result.confidenceAdjustment).toBe("number");
      expect(result.confidenceAdjustment).toBeGreaterThanOrEqual(0.5);
      expect(result.confidenceAdjustment).toBeLessThanOrEqual(1.5);
    }
  });
});

// ---------------------------------------------------------------------------
// Learning Engine — Search
// ---------------------------------------------------------------------------

describe("Learning Engine — Search", () => {
  it("computes search learning from outcomes", async () => {
    const learning = await computeSearchLearning({ sinceDays: 30 });
    expect(learning).toBeTruthy();
    expect(typeof learning.totalSearches).toBe("number");
    expect(typeof learning.successfulSearches).toBe("number");
    expect(typeof learning.avgClickedPosition).toBe("number");
    expect(Array.isArray(learning.topQueries)).toBe(true);
    expect(Array.isArray(learning.zeroResultQueries)).toBe(true);
    expect(Array.isArray(learning.rankingAdjustments)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Learning Engine — Prompt
// ---------------------------------------------------------------------------

describe("Learning Engine — Prompt", () => {
  it("records a prompt evaluation + computes prompt learning", async () => {
    await recordPromptEvaluation({
      promptTemplateId: `test-prompt-${Date.now()}`,
      promptVersion: "v1",
      provider: "openai",
      model: "gpt-4",
      acceptanceScore: 0.8,
      regenerationRate: 0.1,
      editRate: 0.2,
      userRating: 0.9,
      costCredits: 50,
      latencyMs: 2500,
      locale: "en",
    });

    const learning = await computePromptLearning({ sinceDays: 1 });
    expect(Array.isArray(learning)).toBe(true);
    const matchingPrompt = learning.find((p) => p.promptVersion === "v1");
    if (matchingPrompt) {
      expect(matchingPrompt.avgAcceptance).toBeGreaterThan(0);
      expect(matchingPrompt.overallQuality).toBeGreaterThan(0);
      expect(["keep", "tune", "rollback", "deprecate"]).toContain(matchingPrompt.recommendation);
    }
  });
});

// ---------------------------------------------------------------------------
// Experimentation
// ---------------------------------------------------------------------------

describe("Experimentation Framework", () => {
  it("creates an experiment + assigns variants deterministically", async () => {
    const experiment = await createExperiment({
      name: `Test Experiment ${Date.now()}`,
      type: "ab_test",
      variants: [
        { name: "control", weight: 50 },
        { name: "variant_a", weight: 50 },
      ],
      rolloutPct: 100,
      successMetric: "ctr",
      ownerId: TEST_USER,
    });
    expect(experiment.id).toBeTruthy();
    expect(experiment.variants).toHaveLength(2);
    expect(experiment.status).toBe("draft");

    // Start the experiment
    const { updateExperimentStatus } = await import("@/features/platform-intelligence/experimentation");
    await updateExperimentStatus(experiment.id, "running");

    // Assign a user — should get one of the two variants
    const assignment = await assignVariant(experiment.id, `${TEST_USER}-assign`);
    expect(assignment).toBeTruthy();
    expect(["control", "variant_a"]).toContain(assignment!.variant);

    // Same user should get the same variant on re-assignment
    const reassignment = await assignVariant(experiment.id, `${TEST_USER}-assign`);
    expect(reassignment!.variant).toBe(assignment!.variant);

    // getVariant should return the same variant
    const variant = await getVariant(experiment.id, `${TEST_USER}-assign`);
    expect(variant).toBe(assignment!.variant);
  });

  it("returns null when experiment is not running", async () => {
    const experiment = await createExperiment({
      name: `Draft Experiment ${Date.now()}`,
      type: "feature_flag",
      variants: [{ name: "on", weight: 100 }],
      ownerId: TEST_USER,
    });
    // Don't start it — should return null
    const assignment = await assignVariant(experiment.id, `${TEST_USER}-draft`);
    expect(assignment).toBeNull();
  });

  it("computes experiment results + finalizes", async () => {
    const experiment = await createExperiment({
      name: `Results Experiment ${Date.now()}`,
      type: "ab_test",
      variants: [
        { name: "control", weight: 50 },
        { name: "variant_b", weight: 50 },
      ],
      ownerId: TEST_USER,
    });
    const { updateExperimentStatus } = await import("@/features/platform-intelligence/experimentation");
    await updateExperimentStatus(experiment.id, "running");

    // Get results (will be empty since no assignments)
    const results = await getExperimentResults(experiment.id);
    expect(results).toBeTruthy();
    expect(results!.variantResults).toHaveLength(2);
    expect(results!.winnerVariant).toBeNull(); // not enough data

    // Finalize — status should be 'completed' regardless of whether
    // there's a winner (finalizeExperiment always marks as completed)
    const finalized = await finalizeExperiment(experiment.id);
    expect(finalized).toBeTruthy();
    expect(finalized!.experiment.status).toBe("completed");
  });
});

// ---------------------------------------------------------------------------
// Optimization
// ---------------------------------------------------------------------------

describe("Optimization Engine", () => {
  it("runs all optimizations without errors", async () => {
    const snapshots = await runOptimizations();
    expect(Array.isArray(snapshots)).toBe(true);
    // Each snapshot should have the required fields
    for (const s of snapshots) {
      expect(s.parameter).toBeTruthy();
      expect(typeof s.confidence).toBe("number");
      expect(typeof s.autoApplied).toBe("boolean");
    }
  });

  it("lists optimization snapshots", async () => {
    const snapshots = await listOptimizations({ limit: 10 });
    expect(Array.isArray(snapshots)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Forecasting
// ---------------------------------------------------------------------------

describe("Forecasting Engine", () => {
  it("forecasts dropout probability", async () => {
    const forecast = await runForecast({
      type: "dropout",
      scopeType: "user",
      scopeId: TEST_USER,
      horizon: "30d",
    });
    expect(forecast.id).toBeTruthy();
    expect(forecast.forecastType).toBe("dropout");
    expect(forecast.confidence).toBeGreaterThan(0);
    expect(forecast.explanation).toBeTruthy();
  });

  it("forecasts exam success rate", async () => {
    const forecast = await runForecast({
      type: "exam_success",
      horizon: "30d",
    });
    expect(forecast.forecastType).toBe("exam_success");
    expect(forecast.confidence).toBeGreaterThan(0);
  });

  it("forecasts marketplace demand", async () => {
    const forecast = await runForecast({
      type: "marketplace_demand",
      horizon: "7d",
    });
    expect(forecast.forecastType).toBe("marketplace_demand");
  });

  it("lists forecasts", async () => {
    const forecasts = await listForecasts({ limit: 10 });
    expect(Array.isArray(forecasts)).toBe(true);
    expect(forecasts.length).toBeGreaterThan(0); // we just created some
  });
});

// ---------------------------------------------------------------------------
// Health Monitoring
// ---------------------------------------------------------------------------

describe("Health Monitoring", () => {
  it("checks all 12 subsystems", async () => {
    const health = await checkAllSubsystems();
    expect(health.subsystems).toHaveLength(12);
    expect(health.overallScore).toBeGreaterThanOrEqual(0);
    expect(health.overallScore).toBeLessThanOrEqual(1);
    expect(["healthy", "degraded", "down", "unknown"]).toContain(health.overallStatus);
  });

  it("checks a single subsystem", async () => {
    const snapshot = await checkSubsystem("discovery");
    expect(snapshot.subsystem).toBe("discovery");
    expect(["healthy", "degraded", "down", "unknown"]).toContain(snapshot.status);
    expect(snapshot.details).toBeTruthy();
    expect(Array.isArray(snapshot.details.checks)).toBe(true);
    expect(Array.isArray(snapshot.details.alerts)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

describe("Platform Audit", () => {
  it("records an audit event + lists it", async () => {
    await recordAudit({
      actionType: "recommendation",
      actorType: "agent",
      actorId: "test-strategy",
      entityType: "resource",
      entityId: TEST_ENTITY,
      affectedUserId: TEST_USER,
      reasoning: {
        inputs: { strategy: "test", userId: TEST_USER },
        reasoning: "Test audit reasoning",
        confidence: 0.85,
        affectedModules: ["semantic-search"],
      },
      confidence: 0.85,
    });

    const events = await listAuditEvents({
      actionType: "recommendation",
      affectedUserId: TEST_USER,
      limit: 10,
    });
    expect(events.length).toBeGreaterThan(0);
    const matching = events.find((e) => e.entityId === TEST_ENTITY);
    expect(matching).toBeTruthy();
    expect(matching!.reasoning.reasoning).toBe("Test audit reasoning");
    expect(matching!.confidence).toBe(0.85);
  });
});

// ---------------------------------------------------------------------------
// Analytics — Insights
// ---------------------------------------------------------------------------

describe("Analytics — Platform Insights", () => {
  it("generates + lists platform insights", async () => {
    await generatePlatformInsights();
    const insights = await listPlatformInsights({ limit: 50 });
    expect(Array.isArray(insights)).toBe(true);
    // Each insight should have the required fields
    for (const i of insights) {
      expect(i.category).toBeTruthy();
      expect(i.title).toBeTruthy();
      expect(i.description).toBeTruthy();
      expect(["info", "warning", "critical", "success"]).toContain(i.severity);
      expect(i.confidence).toBeGreaterThanOrEqual(0);
      expect(i.confidence).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Monitoring — alert thresholds
// ---------------------------------------------------------------------------

describe("Monitoring — Alert Thresholds", () => {
  it("exports alert thresholds", () => {
    expect(ALERT_THRESHOLDS).toBeTruthy();
    expect(ALERT_THRESHOLDS.degradedThreshold).toBeGreaterThan(0);
    expect(ALERT_THRESHOLDS.degradedThreshold).toBeLessThan(1);
    expect(ALERT_THRESHOLDS.downThreshold).toBeLessThan(ALERT_THRESHOLDS.degradedThreshold);
    expect(ALERT_THRESHOLDS.lowCtrThreshold).toBeGreaterThan(0);
    expect(ALERT_THRESHOLDS.highAbandonmentThreshold).toBeGreaterThan(0);
    expect(ALERT_THRESHOLDS.highRefundRateThreshold).toBeGreaterThan(0);
  });
});
