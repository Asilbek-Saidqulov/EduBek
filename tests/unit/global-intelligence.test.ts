/** EduBek — Phase 5D.2 Global Intelligence Network tests. */
import { describe, it, expect } from "vitest";
import {
  registerFoundationModel, deployFoundationModel, listFoundationModels,
  createEquivalence, listEquivalences, findEquivalentStandards,
  discoverPattern, listPatterns,
  generateSyntheticDataset, listSyntheticDatasets,
  recordBenchmark, listBenchmarks,
  reason, getReasoningChain, listReasoningChains,
  recordEvolution, listEvolutions,
  captureObservatory, getLatestObservatory, listObservatories,
  callFoundationApi, listApiCalls,
  publishInsight, listInsights,
  createAlignment, listAlignments,
  joinNetwork, listParticipations,
} from "@/features/global-intelligence";

const TEST_ORG = `test-org-5d2-${Date.now()}`;

// ---------------------------------------------------------------------------
// Educational Foundation Models
// ---------------------------------------------------------------------------

describe("Educational Foundation Models", () => {
  it("registers + deploys + lists a foundation model", async () => {
    const model = await registerFoundationModel({
      domain: "mathematics", name: `EduBek Math Model ${Date.now()}`,
      capabilities: ["curriculum_reasoning", "misconception_detection", "explanation_generation"],
      languages: ["en", "uz", "ru"],
    });
    expect(model.id).toBeTruthy();
    expect(model.status).toBe("training");
    expect(model.capabilities.length).toBe(3);

    const deployed = await deployFoundationModel(model.id, { accuracy: 0.92, f1: 0.89 });
    expect(deployed.status).toBe("deployed");
    expect(deployed.metrics).toHaveProperty("accuracy", 0.92);

    const list = await listFoundationModels({ domain: "mathematics" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Global Curriculum Graph — Equivalences
// ---------------------------------------------------------------------------

describe("Global Curriculum Graph", () => {
  it("creates + lists + finds equivalent standards", async () => {
    const ts = Date.now();
    const eq = await createEquivalence({
      sourceFramework: "cambridge", sourceStandardId: `std-${ts}-1`, sourceStandardCode: "8.A.1",
      targetFramework: "ib", targetStandardId: `std-${ts}-2`, targetStandardCode: "IB-8.1",
      equivalenceScore: 0.85, equivalenceType: "equivalent",
      aiValidated: true,
    });
    expect(eq.id).toBeTruthy();
    expect(eq.equivalenceScore).toBe(0.85);

    const list = await listEquivalences({ sourceFramework: "cambridge" });
    expect(list.length).toBeGreaterThan(0);

    const equivalents = await findEquivalentStandards("cambridge", "8.A.1");
    expect(equivalents.length).toBeGreaterThan(0);
    expect(equivalents[0]!.targetFramework).toBe("ib");
  });
});

// ---------------------------------------------------------------------------
// Educational Pattern Mining
// ---------------------------------------------------------------------------

describe("Educational Pattern Mining", () => {
  it("discovers + lists patterns", async () => {
    const pattern = await discoverPattern({
      type: "common_misconception", title: `Misconception: Division by Zero ${Date.now()}`,
      description: "Students often think division by zero equals zero",
      subject: "mathematics",
      pattern: { concept: "division", misconception: "x/0 = 0", frequency: 0.35, effectiveness: 0.7 },
      source: { institutionCount: 15, studentCount: 500, region: "global" },
      confidence: 0.82,
    });
    expect(pattern.id).toBeTruthy();
    expect(pattern.verification).toBe("unverified");

    const list = await listPatterns({ type: "common_misconception" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Synthetic Educational Data Engine
// ---------------------------------------------------------------------------

describe("Synthetic Educational Data Engine", () => {
  it("generates a synthetic dataset with schema-based records", async () => {
    const ds = await generateSyntheticDataset({
      name: `Test Synthetic ${Date.now()}`, purpose: "ai_training",
      domain: "mathematics",
      schema: [{ name: "student_id", type: "string" }, { name: "score", type: "number" }],
      recordCount: 50, privacyLevel: "fully_synthetic",
    });
    expect(ds.id).toBeTruthy();
    expect(ds.recordCount).toBe(50);
    expect(ds.data.length).toBe(50);
    expect(ds.data[0]!).toHaveProperty("student_id");
    expect(ds.data[0]!).toHaveProperty("score");

    const list = await listSyntheticDatasets({ purpose: "ai_training" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Global Benchmark Repository
// ---------------------------------------------------------------------------

describe("Global Benchmark Repository", () => {
  it("records + lists benchmarks", async () => {
    const bm = await recordBenchmark({
      metric: "mastery", scope: "by_subject", scopeValue: "mathematics",
      period: "monthly", periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      statistics: { median: 0.65, mean: 0.62, percentile90: 0.85, sampleSize: 1000 },
      participantCount: 50,
    });
    expect(bm.id).toBeTruthy();
    expect(bm.statistics.median).toBe(0.65);

    const list = await listBenchmarks({ metric: "mastery" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Educational Reasoning Engine
// ---------------------------------------------------------------------------

describe("Educational Reasoning Engine", () => {
  it("produces a reasoning chain with evidence + alternatives", async () => {
    const chain = await reason({
      query: "Why do students struggle with fractions?",
      domain: "mathematics",
    });
    expect(chain.id).toBeTruthy();
    expect(chain.steps.length).toBeGreaterThan(0);
    expect(chain.conclusion).toBeTruthy();
    expect(chain.evidence.length).toBeGreaterThan(0);
    expect(chain.curriculumRefs.length).toBeGreaterThan(0);
    expect(chain.prerequisiteAnalysis.length).toBeGreaterThan(0);
    expect(chain.alternatives.length).toBeGreaterThan(0);
    expect(chain.confidence).toBeGreaterThan(0);

    const retrieved = await getReasoningChain(chain.id);
    expect(retrieved).toBeTruthy();

    const list = await listReasoningChains({ domain: "mathematics" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Knowledge Evolution Engine
// ---------------------------------------------------------------------------

describe("Knowledge Evolution Engine", () => {
  it("records + lists knowledge evolution events", async () => {
    const evo = await recordEvolution({
      type: "concept", entity: "photosynthesis",
      change: "Updated understanding of light-dependent reactions",
      beforeState: { description: "Old model" },
      afterState: { description: "New model with updated protein pathways" },
      reason: "New research published",
      impact: { affectedEntities: ["biology"], severity: "medium" },
      source: "research_finding",
    });
    expect(evo.id).toBeTruthy();
    expect(evo.type).toBe("concept");

    const list = await listEvolutions({ type: "concept" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Global Educational Observatory
// ---------------------------------------------------------------------------

describe("Global Educational Observatory", () => {
  it("captures + retrieves observatory snapshots", async () => {
    const obs = await captureObservatory({
      emergingSkills: [{ skill: "AI Ethics", growthRate: 0.45, demandLevel: "high" }],
      curriculumTrends: [{ subject: "computer_science", direction: "up", adoptionRate: 0.3 }],
      aiAdoption: { institutionsUsingAI: 150, aiSessionsPerDay: 5000 },
      teachingMethods: [{ method: "flipped_classroom", popularity: 0.6, effectiveness: 0.75 }],
      subjectPopularity: [{ subject: "mathematics", rank: 1, trend: "stable" }],
    });
    expect(obs.id).toBeTruthy();
    expect(obs.emergingSkills.length).toBe(1);
    expect(obs.aiSummary).toBeTruthy();

    const latest = await getLatestObservatory();
    expect(latest).toBeTruthy();

    const list = await listObservatories({ limit: 5 });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Foundation API
// ---------------------------------------------------------------------------

describe("Foundation API", () => {
  it("makes + lists API calls", async () => {
    const call = await callFoundationApi({
      endpoint: "curriculum_reasoning", callerId: "test-caller",
      input: { query: "What are prerequisites for calculus?" },
    });
    expect(call.id).toBeTruthy();
    expect(call.status).toBe("completed");
    expect(call.latencyMs).toBeGreaterThanOrEqual(0);
    expect(call.costCredits).toBeGreaterThan(0);

    const list = await listApiCalls({ endpoint: "curriculum_reasoning" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Collective Insights
// ---------------------------------------------------------------------------

describe("Collective Insights", () => {
  it("publishes + lists collective insights", async () => {
    const insight = await publishInsight({
      type: "best_practice", title: `Spaced Repetition Effectiveness ${Date.now()}`,
      description: "Schools using spaced repetition see 23% improvement in retention",
      domain: "education",
      evidence: [{ source: "network_aggregation", data: { schools: 20, students: 5000 }, confidence: 0.85 }],
      source: { institutionCount: 20, dataPoints: 5000, regions: ["global"] },
      confidence: 0.82,
      applicability: { institutionTypes: ["k12", "university"], subjects: ["all"] },
    });
    expect(insight.id).toBeTruthy();
    expect(insight.status).toBe("active");

    const list = await listInsights({ type: "best_practice" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Multilingual Alignment
// ---------------------------------------------------------------------------

describe("Multilingual Alignment", () => {
  it("creates + lists multilingual alignments", async () => {
    const ts = Date.now();
    const alignment = await createAlignment({
      sourceTerm: `photosynthesis-${ts}`, sourceLanguage: "en",
      targetTerm: `fotosintez-${ts}`, targetLanguage: "uz",
      confidence: 0.95, context: "biology", aiValidated: true,
    });
    expect(alignment.id).toBeTruthy();
    expect(alignment.confidence).toBe(0.95);

    const list = await listAlignments({ sourceLanguage: "en", targetLanguage: "uz" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Network Participation
// ---------------------------------------------------------------------------

describe("Network Participation", () => {
  it("joins + lists network participation", async () => {
    const participation = await joinNetwork({
      organizationId: TEST_ORG, level: "contributor",
      contributions: ["patterns", "benchmarks"],
      privacySettings: { anonymizationLevel: "aggregated", sharePatterns: true },
    });
    expect(participation.id).toBeTruthy();
    expect(participation.level).toBe("contributor");
    expect(participation.status).toBe("active");
    expect(participation.contributions).toContain("patterns");

    // Join again (upsert)
    const updated = await joinNetwork({
      organizationId: TEST_ORG, level: "leader",
      contributions: ["patterns", "benchmarks", "models"],
    });
    expect(updated.level).toBe("leader");

    const list = await listParticipations({ level: "leader" });
    expect(list.length).toBeGreaterThan(0);
  });
});
