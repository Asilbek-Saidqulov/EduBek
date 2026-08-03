/** EduBek — Phase 5D.3 Civilization Engine tests. */
import { describe, it, expect } from "vitest";
import {
  recordMemory, searchMemory, listMemories,
  analyzeDecision, listDecisions, updateDecisionStatus,
  generateStrategicPlan, listStrategicPlans, activatePlan,
  generateAdvisorRecommendations, listAdvisorRecommendations, acknowledgeRecommendation,
  createPolicy, listPolicies, approvePolicy,
  createGoal, listGoals, updateGoalProgress,
  recordTimelineEvent, listTimelineEvents, replayTimeline,
  createKnowledgeEntry, searchKnowledge, listKnowledgeEntries,
  runSimulation, listSimulations,
  generateWisdom, listWisdomInsights,
  getDashboard,
} from "@/features/civilization-engine";

const TEST_ORG = `test-org-5d3-${Date.now()}`;
const TEST_USER = `test-user-5d3-${Date.now()}`;

// ---------------------------------------------------------------------------
// 1. Institutional Long-Term Intelligence
// ---------------------------------------------------------------------------

describe("Institutional Long-Term Intelligence", () => {
  it("records + searches + lists memories", async () => {
    const memory = await recordMemory({
      organizationId: TEST_ORG, type: "curriculum_evolution",
      title: `Curriculum Change ${Date.now()}`, description: "Updated physics curriculum to include quantum mechanics",
      period: "2024-2025", importance: 0.8,
      payload: { change: "added_quantum", impact: "positive" },
    });
    expect(memory.id).toBeTruthy();
    expect(memory.type).toBe("curriculum_evolution");

    const searchResults = await searchMemory(TEST_ORG, "curriculum");
    expect(searchResults.length).toBeGreaterThan(0);

    const list = await listMemories({ organizationId: TEST_ORG, type: "curriculum_evolution" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Educational Decision Intelligence
// ---------------------------------------------------------------------------

describe("Educational Decision Intelligence", () => {
  it("analyzes a decision with impact estimates", async () => {
    const decision = await analyzeDecision({
      organizationId: TEST_ORG, title: `Reduce Physics Hours ${Date.now()}`,
      type: "reduce_hours", parameters: { subject: "physics", reduction: 2 },
    });
    expect(decision.id).toBeTruthy();
    expect(decision.status).toBe("pending");
    expect(decision.impactEstimates).toHaveProperty("learningImpact");
    expect(decision.impactEstimates).toHaveProperty("teacherWorkload");
    expect(decision.reasoning).toBeTruthy();
    expect(decision.evidence.length).toBeGreaterThan(0);

    const updated = await updateDecisionStatus(decision.id, "approved");
    expect(updated.status).toBe("approved");

    const list = await listDecisions({ organizationId: TEST_ORG });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Institutional Strategy Engine
// ---------------------------------------------------------------------------

describe("Institutional Strategy Engine", () => {
  it("generates a 5-year strategic plan with goals + KPIs + risks", async () => {
    const plan = await generateStrategicPlan({
      organizationId: TEST_ORG, title: `5-Year Vision ${Date.now()}`,
      horizon: "5_year", createdBy: TEST_USER,
    });
    expect(plan.id).toBeTruthy();
    expect(plan.horizon).toBe("5_year");
    expect(plan.goals.length).toBeGreaterThan(0);
    expect(plan.milestones.length).toBe(5);
    expect(plan.kpis.length).toBeGreaterThan(0);
    expect(plan.resources.length).toBeGreaterThan(0);
    expect(plan.risks.length).toBeGreaterThan(0);
    expect(plan.narrative).toBeTruthy();
    expect(plan.confidence).toBeGreaterThan(0);

    const activated = await activatePlan(plan.id);
    expect(activated.status).toBe("active");

    const list = await listStrategicPlans({ organizationId: TEST_ORG, horizon: "5_year" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Autonomous Educational Advisor
// ---------------------------------------------------------------------------

describe("Autonomous Educational Advisor", () => {
  it("generates + lists + acknowledges recommendations", async () => {
    const recs = await generateAdvisorRecommendations({ organizationId: TEST_ORG, limit: 5 });
    expect(Array.isArray(recs)).toBe(true);

    const list = await listAdvisorRecommendations({ organizationId: TEST_ORG });
    expect(list.length).toBeGreaterThanOrEqual(0);

    if (list.length > 0) {
      const acked = await acknowledgeRecommendation(list[0]!.id);
      expect(acked.status).toBe("acknowledged");
      expect(acked.acknowledgedAt).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Educational Policy Engine
// ---------------------------------------------------------------------------

describe("Educational Policy Engine", () => {
  it("creates + lists + approves a policy", async () => {
    const policy = await createPolicy({
      organizationId: TEST_ORG, type: "ai_usage",
      name: `AI Usage Policy ${Date.now()}`, description: "Guidelines for AI tool usage in classrooms",
      rules: [{ id: "r1", condition: "student_uses_ai", action: "require_citation", parameters: {} }],
      ownerId: TEST_USER,
    });
    expect(policy.id).toBeTruthy();
    expect(policy.status).toBe("draft");
    expect(policy.aiAnalysis).toHaveProperty("complianceScore");
    expect(policy.version).toBe(1);

    const approved = await approvePolicy(policy.id, TEST_USER, "Approved by admin");
    expect(approved.status).toBe("active");
    expect(approved.approvals.length).toBe(1);
    expect(approved.effectiveFrom).toBeTruthy();

    const list = await listPolicies({ organizationId: TEST_ORG, type: "ai_usage" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Institutional Goal Tracking
// ---------------------------------------------------------------------------

describe("Institutional Goal Tracking", () => {
  it("creates + updates progress + achieves a goal", async () => {
    const goal = await createGoal({
      organizationId: TEST_ORG, title: `Increase Mastery ${Date.now()}`,
      type: "mastery",
      target: { metric: "avg_mastery", baseline: 0.6, target: 0.85, current: 0.6, unit: "percent" },
      kpis: [{ name: "mastery", value: 0.6, target: 0.85, trend: "up" }],
    });
    expect(goal.id).toBeTruthy();
    expect(goal.progress).toBe(0); // (0.6 - 0.6) / (0.85 - 0.6) = 0

    const updated = await updateGoalProgress(goal.id, 0.7, "Progressing steadily");
    expect(updated.progress).toBeCloseTo(40, 0); // (0.7 - 0.6) / (0.85 - 0.6) * 100 = 40
    expect(updated.status).toBe("active");

    const achieved = await updateGoalProgress(goal.id, 0.85);
    expect(achieved.status).toBe("achieved");
    expect(achieved.progress).toBe(100);
    expect(achieved.achievedAt).toBeTruthy();

    const list = await listGoals({ organizationId: TEST_ORG, type: "mastery" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Civilization Timeline
// ---------------------------------------------------------------------------

describe("Civilization Timeline", () => {
  it("records + lists + replays timeline events", async () => {
    const event = await recordTimelineEvent({
      organizationId: TEST_ORG, type: "curriculum_updated",
      title: `Physics Curriculum Updated ${Date.now()}`, description: "Added quantum mechanics module",
      severity: "important",
    });
    expect(event.id).toBeTruthy();
    expect(event.severity).toBe("important");

    const list = await listTimelineEvents({ organizationId: TEST_ORG });
    expect(list.length).toBeGreaterThan(0);

    const replay = await replayTimeline(TEST_ORG);
    expect(replay.length).toBeGreaterThan(0);
    // Should be sorted chronologically
    for (let i = 1; i < replay.length; i++) {
      expect(new Date(replay[i]!.occurredAt).getTime()).toBeGreaterThanOrEqual(new Date(replay[i - 1]!.occurredAt).getTime());
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Organizational Knowledge Base
// ---------------------------------------------------------------------------

describe("Organizational Knowledge Base", () => {
  it("creates + searches + lists knowledge entries", async () => {
    const entry = await createKnowledgeEntry({
      organizationId: TEST_ORG, type: "best_practice",
      title: `Spaced Repetition ${Date.now()}`, description: "Using spaced repetition improves retention by 23%",
      content: "Implement spaced repetition by reviewing material at increasing intervals...",
      tags: ["retention", "study_technique"], subject: "education",
      effectiveness: 0.85,
    });
    expect(entry.id).toBeTruthy();
    expect(entry.effectiveness).toBe(0.85);

    const searchResults = await searchKnowledge("spaced repetition");
    expect(searchResults.length).toBeGreaterThan(0);

    const list = await listKnowledgeEntries({ organizationId: TEST_ORG, type: "best_practice" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 9. AI Institutional Simulation
// ---------------------------------------------------------------------------

describe("AI Institutional Simulation", () => {
  it("runs a next_semester simulation with predictions", async () => {
    const sim = await runSimulation({
      organizationId: TEST_ORG, type: "next_semester",
      title: `Next Semester Forecast ${Date.now()}`, createdBy: TEST_USER,
    });
    expect(sim.id).toBeTruthy();
    expect(sim.predictions.length).toBeGreaterThan(0);
    expect(sim.scenarios.length).toBe(3); // optimistic, baseline, conservative
    expect(sim.resourceProjections.length).toBeGreaterThan(0);
    expect(sim.summary).toBeTruthy();
    expect(sim.confidence).toBeGreaterThan(0);

    const list = await listSimulations({ organizationId: TEST_ORG });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 10. Institutional Wisdom Engine
// ---------------------------------------------------------------------------

describe("Institutional Wisdom Engine", () => {
  it("generates a wisdom insight with multi-source evidence", async () => {
    const wisdom = await generateWisdom({
      organizationId: TEST_ORG, type: "prescriptive", subject: "student_retention",
    });
    expect(wisdom.id).toBeTruthy();
    expect(wisdom.narrative).toBeTruthy();
    expect(wisdom.narrative.length).toBeGreaterThan(100); // Should be a rich narrative
    expect(wisdom.historicalEvidence.length).toBeGreaterThan(0);
    expect(wisdom.benchmarkEvidence.length).toBeGreaterThan(0);
    expect(wisdom.globalEvidence.length).toBeGreaterThan(0);
    expect(wisdom.institutionEvidence.length).toBeGreaterThan(0);
    expect(wisdom.recommendations.length).toBeGreaterThan(0);
    expect(wisdom.confidence).toBeGreaterThan(0);

    const list = await listWisdomInsights({ organizationId: TEST_ORG });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Civilization Dashboard
// ---------------------------------------------------------------------------

describe("Civilization Dashboard", () => {
  it("returns comprehensive dashboard with all metrics", async () => {
    const dashboard = await getDashboard(TEST_ORG);
    expect(dashboard.organizationId).toBe(TEST_ORG);
    expect(dashboard.totalMemories).toBeGreaterThanOrEqual(0);
    expect(dashboard.activeGoals).toBeGreaterThanOrEqual(0);
    expect(dashboard.achievedGoals).toBeGreaterThanOrEqual(0);
    expect(dashboard.pendingDecisions).toBeGreaterThanOrEqual(0);
    expect(dashboard.activePolicies).toBeGreaterThanOrEqual(0);
    expect(dashboard.pendingRecommendations).toBeGreaterThanOrEqual(0);
    expect(dashboard.timelineEvents).toBeGreaterThanOrEqual(0);
    expect(dashboard.knowledgeEntries).toBeGreaterThanOrEqual(0);
    expect(dashboard.activeSimulations).toBeGreaterThanOrEqual(0);
    expect(dashboard.wisdomInsights).toBeGreaterThanOrEqual(0);
    expect(dashboard.strategicPlans).toBeGreaterThanOrEqual(0);
    expect(dashboard.goalProgressAvg).toBeGreaterThanOrEqual(0);
    expect(dashboard.generatedAt).toBeTruthy();
  });
});
