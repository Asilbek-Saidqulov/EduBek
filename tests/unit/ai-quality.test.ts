/**
 * EduBek — AI Quality tests.
 *
 * Phase 6B.1: Verifies all 10 systems — benchmark library, evaluation
 * engine, hallucination detector, citation validator, retrieval
 * evaluator, prompt regression, model comparator, quality scoring,
 * dataset manager, and leaderboard.
 */
import { describe, it, expect } from "vitest";
import {
  BUILTIN_BENCHMARKS, listBuiltinBenchmarks, getBenchmarkQuestion,
  listBenchmarkCategories, buildBenchmarkDataset, generateLibraryReport,
  evaluateExactMatch, evaluateContainsKeywords, evaluateSemanticSimilarity,
} from "@/features/ai-quality/benchmark-library";
import { evaluateOutput, evaluateBenchmarkSuite } from "@/features/ai-quality/evaluation-engine";
import { detectHallucinations } from "@/features/ai-quality/hallucination-detector";
import { validateCitations } from "@/features/ai-quality/citation-validator";
import { evaluateRetrieval } from "@/features/ai-quality/retrieval-evaluator";
import { generateRegressionReport } from "@/features/ai-quality/prompt-regression";
import { generateModelComparatorReport, MODEL_REGISTRY } from "@/features/ai-quality/model-comparator";
import { generateQualityScore } from "@/features/ai-quality/quality-scoring";
import { createDataset, getDataset, listDatasets, generateDatasetManagerReport, exportDataset, importDataset } from "@/features/ai-quality/dataset-manager";
import { generateLeaderboard } from "@/features/ai-quality/leaderboard";

// ===========================================================================
// Benchmark Library
// ===========================================================================

describe("AI Quality — Benchmark Library", () => {
  it("ships with built-in benchmarks", () => {
    expect(BUILTIN_BENCHMARKS.length).toBeGreaterThanOrEqual(16);
  });

  it("covers all 16+ categories", () => {
    const categories = listBenchmarkCategories();
    expect(categories.length).toBeGreaterThanOrEqual(15);
    expect(categories).toContain("mathematics");
    expect(categories).toContain("physics");
    expect(categories).toContain("chemistry");
    expect(categories).toContain("programming");
    expect(categories).toContain("curriculum_reasoning");
    expect(categories).toContain("lesson_planning");
    expect(categories).toContain("assessment_generation");
  });

  it("lists benchmarks by category", () => {
    const mathBenchmarks = listBuiltinBenchmarks("mathematics");
    expect(mathBenchmarks.length).toBeGreaterThan(0);
    expect(mathBenchmarks.every(b => b.category === "mathematics")).toBe(true);
  });

  it("retrieves a benchmark by id", () => {
    const q = getBenchmarkQuestion("bench-math-001");
    expect(q).not.toBeNull();
    expect(q?.question).toContain("2x");
  });

  it("every benchmark has required fields", () => {
    for (const b of BUILTIN_BENCHMARKS) {
      expect(b.id).toBeTruthy();
      expect(b.question).toBeTruthy();
      expect(b.expectedAnswer).toBeTruthy();
      expect(b.category).toBeTruthy();
      expect(b.difficulty).toMatch(/beginner|intermediate|advanced|expert/);
      expect(b.evaluationStrategy).toBeTruthy();
      expect(b.points).toBeGreaterThan(0);
    }
  });

  it("builds a dataset from a category", () => {
    const dataset = buildBenchmarkDataset("mathematics");
    expect(dataset.category).toBe("mathematics");
    expect(dataset.questions.length).toBeGreaterThan(0);
    expect(dataset.name).toContain("mathematics");
  });

  it("generates a library report", () => {
    const report = generateLibraryReport();
    expect(report.datasets.length).toBeGreaterThan(0);
    expect(report.totalQuestions).toBe(BUILTIN_BENCHMARKS.length);
  });

  it("evaluates exact match correctly", () => {
    expect(evaluateExactMatch("x = 4", "x = 4", [])).toBe(true);
    expect(evaluateExactMatch("4", "x = 4", ["4"])).toBe(true);
    expect(evaluateExactMatch("wrong", "x = 4", [])).toBe(false);
  });

  it("evaluates keyword containment correctly", () => {
    expect(evaluateContainsKeywords("F = ma", ["F = ma"])).toBe(true);
    expect(evaluateContainsKeywords("force = mass * acceleration", ["F = ma"])).toBe(false);
  });

  it("evaluates semantic similarity correctly", () => {
    expect(evaluateSemanticSimilarity("force equals mass times acceleration", "force equals mass times acceleration")).toBe(1);
    expect(evaluateSemanticSimilarity("completely different text", "force equals mass times acceleration")).toBeLessThan(0.5);
  });
});

// ===========================================================================
// Evaluation Engine
// ===========================================================================

describe("AI Quality — Evaluation Engine", () => {
  it("evaluates an AI output deterministically", async () => {
    const result = await evaluateOutput({
      benchmarkQuestionId: "bench-math-001",
      provider: "test",
      model: "test-model",
      aiOutput: "x = 4",
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("metrics");
    expect(result.metrics.length).toBe(11);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(1);
    expect(result.llmUsed).toBe(false);
    expect(result.evaluationCost).toBe(0);
  });

  it("computes all 11 metrics", async () => {
    const result = await evaluateOutput({
      benchmarkQuestionId: "bench-physics-001",
      provider: "test",
      model: "test-model",
      aiOutput: "Force equals mass times acceleration (F = ma) because Newton's second law states this relationship.",
    });
    const metricNames = result.metrics.map(m => m.name);
    expect(metricNames).toContain("correctness");
    expect(metricNames).toContain("completeness");
    expect(metricNames).toContain("reasoning_quality");
    expect(metricNames).toContain("curriculum_alignment");
    expect(metricNames).toContain("answer_structure");
    expect(metricNames).toContain("safety");
    expect(metricNames).toContain("grounding");
    expect(metricNames).toContain("readability");
    expect(metricNames).toContain("educational_usefulness");
    expect(metricNames).toContain("teacher_usefulness");
    expect(metricNames).toContain("student_usefulness");
  });

  it("never uses LLM for evaluation", async () => {
    const result = await evaluateOutput({
      benchmarkQuestionId: "bench-chem-001",
      provider: "test",
      model: "test-model",
      aiOutput: "H2O",
    });
    expect(result.llmUsed).toBe(false);
    expect(result.evaluationCost).toBe(0);
  });

  it("generates improvement suggestions for low scores", async () => {
    const result = await evaluateOutput({
      benchmarkQuestionId: "bench-math-001",
      provider: "test",
      model: "test-model",
      aiOutput: "I don't know",
    });
    expect(result.improvementSuggestions.length).toBeGreaterThan(0);
  });

  it("evaluates a benchmark suite", async () => {
    const report = await evaluateBenchmarkSuite({
      provider: "test",
      model: "test-model",
      category: "mathematics",
    });
    expect(report.results.length).toBeGreaterThan(0);
    expect(report.averageScore).toBeGreaterThanOrEqual(0);
    expect(report.totalEvaluated).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Hallucination Detector
// ===========================================================================

describe("AI Quality — Hallucination Detector", () => {
  it("detects no hallucinations in well-grounded output", async () => {
    const report = await detectHallucinations({
      aiOutput: "Water is H2O. It consists of two hydrogen atoms and one oxygen atom.",
      evidence: ["Water consists of two hydrogen atoms and one oxygen atom."],
    });
    expect(report.findings.length).toBeLessThan(3);
  });

  it("detects unsupported statistics", async () => {
    const report = await detectHallucinations({
      aiOutput: "Studies show that 95% of students prefer online learning. 10000 people were surveyed.",
      evidence: [],
    });
    expect(report.findings.some(f => f.kind === "unsupported_statistic" || f.kind === "unsupported_claim")).toBe(true);
  });

  it("detects invented facts (years)", async () => {
    const report = await detectHallucinations({
      aiOutput: "In 1492, Columbus discovered America. In 2025, a major breakthrough happened.",
      evidence: ["Columbus discovered America."],
      expectedAnswer: "1492",
    });
    // 2025 should be flagged as not in evidence
    expect(report.findings.some(f => f.kind === "invented_fact")).toBe(true);
  });

  it("detects invented citations", async () => {
    const report = await detectHallucinations({
      aiOutput: "According to Smith et al. (2023), the results were significant.",
      evidence: [],
    });
    expect(report.findings.some(f => f.kind === "invented_citation")).toBe(true);
  });

  it("classifies by severity", async () => {
    const report = await detectHallucinations({
      aiOutput: "Studies show 99% of facts are made up. Smith et al. (2099) confirmed this. In 2099, everything changed. 50000 cases were reported.",
      evidence: [],
    });
    expect(report.severityCounts).toHaveProperty("low");
    expect(report.severityCounts).toHaveProperty("medium");
    expect(report.severityCounts).toHaveProperty("high");
    expect(report.severityCounts).toHaveProperty("critical");
  });

  it("determines risk level", async () => {
    const cleanReport = await detectHallucinations({
      aiOutput: "Water boils at 100°C.",
      evidence: ["Water boils at 100 degrees Celsius at sea level."],
    });
    expect(cleanReport.riskLevel).toBe("low");
  });

  it("never rejects responses — only produces findings", async () => {
    const report = await detectHallucinations({
      aiOutput: "This is completely fabricated nonsense with fake data 99999%.",
      evidence: [],
    });
    expect(report).toHaveProperty("findings");
    expect(report).toHaveProperty("recommendation");
    expect(report).not.toHaveProperty("rejected");
  });
});

// ===========================================================================
// Citation Validator
// ===========================================================================

describe("AI Quality — Citation Validator", () => {
  it("validates citations in output", async () => {
    const report = await validateCitations({
      aiOutput: "According to https://example.com/facts, water is H2O.",
      evidence: ["https://example.com/facts"],
    });
    expect(report.totalCitations).toBeGreaterThan(0);
    expect(report.citationIntegrityScore).toBeGreaterThanOrEqual(0);
    expect(report.citationIntegrityScore).toBeLessThanOrEqual(1);
  });

  it("detects broken citations", async () => {
    const report = await validateCitations({
      aiOutput: "See https://broken-link.example.com/nonexistent for details.",
      evidence: [],
    });
    expect(report.brokenCitations).toBeGreaterThan(0);
  });

  it("detects missing citations", async () => {
    const report = await validateCitations({
      aiOutput: "Studies show that 80% of learning happens through practice.",
      evidence: [],
    });
    expect(report.missingCitations).toBeGreaterThan(0);
  });

  it("generates citation integrity score", async () => {
    const report = await validateCitations({
      aiOutput: "Water is H2O (https://example.com/water).",
      evidence: ["https://example.com/water"],
    });
    expect(report.citationIntegrityScore).toBeGreaterThan(0.5);
  });
});

// ===========================================================================
// Retrieval Evaluator
// ===========================================================================

describe("AI Quality — Retrieval Evaluator", () => {
  it("evaluates retrieval metrics", async () => {
    const report = await evaluateRetrieval({
      query: "What is photosynthesis?",
      retrievedEvidence: [
        { id: "1", content: "Photosynthesis is the process by which plants use sunlight to make food.", source: "biology", relevance: 0.9, confidence: 0.85 },
        { id: "2", content: "Plants need sunlight, water, and CO2.", source: "biology", relevance: 0.8, confidence: 0.8 },
      ],
      expectedEvidence: [
        { content: "Photosynthesis is the process", source: "biology" },
      ],
    });
    expect(report.metrics).toHaveProperty("precision");
    expect(report.metrics).toHaveProperty("recall");
    expect(report.metrics).toHaveProperty("relevance");
    expect(report.overallRetrievalScore).toBeGreaterThanOrEqual(0);
    expect(report.overallRetrievalScore).toBeLessThanOrEqual(1);
  });

  it("suggests improvements for low-quality retrieval", async () => {
    const report = await evaluateRetrieval({
      query: "test query",
      retrievedEvidence: [
        { id: "1", content: "short", source: "test", relevance: 0.1, confidence: 0.1 },
      ],
    });
    expect(report.suggestions.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Prompt Regression
// ===========================================================================

describe("AI Quality — Prompt Regression", () => {
  it("generates a regression report", async () => {
    const report = await generateRegressionReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("comparisons");
    expect(report).toHaveProperty("regressions");
    expect(report).toHaveProperty("improvements");
    expect(report).toHaveProperty("rollbackRecommendations");
  });
});

// ===========================================================================
// Model Comparator
// ===========================================================================

describe("AI Quality — Model Comparator", () => {
  it("has a model registry with 8+ providers", () => {
    expect(MODEL_REGISTRY.length).toBeGreaterThanOrEqual(8);
    const providers = MODEL_REGISTRY.map(m => m.provider);
    expect(providers).toContain("zai");
    expect(providers).toContain("openai");
    expect(providers).toContain("anthropic");
    expect(providers).toContain("gemini");
    expect(providers).toContain("deepseek");
    expect(providers).toContain("groq");
    expect(providers).toContain("mistral");
    expect(providers).toContain("local");
  });

  it("generates a model comparison report", async () => {
    const report = await generateModelComparatorReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("comparisons");
    expect(report).toHaveProperty("recommendationsByTask");
    expect(report.comparisons.length).toBeGreaterThan(0);
  });

  it("produces task-specific recommendations", async () => {
    const report = await generateModelComparatorReport();
    expect(report.recommendationsByTask.length).toBeGreaterThan(0);
    const tasks = report.recommendationsByTask.map(r => r.task);
    expect(tasks).toContain("Complex reasoning");
    expect(tasks).toContain("Real-time chat");
    expect(tasks).toContain("Bulk generation");
  });

  it("every model entry has required fields", async () => {
    const report = await generateModelComparatorReport();
    for (const m of report.comparisons) {
      expect(m.provider).toBeTruthy();
      expect(m.model).toBeTruthy();
      expect(m.qualityScore).toBeGreaterThanOrEqual(0);
      expect(m.latencyMs).toBeGreaterThan(0);
      expect(m.overallRank).toBeGreaterThan(0);
    }
  });
});

// ===========================================================================
// Quality Scoring
// ===========================================================================

describe("AI Quality — Quality Scoring", () => {
  it("generates a quality score with 9 dimensions", async () => {
    const report = await generateQualityScore({
      provider: "test",
      model: "test-model",
      accuracy: 0.85,
      hallucinationRate: 0.05,
      retrievalScore: 0.8,
      latencyMs: 800,
      costUsd: 0.002,
      educationalUsefulness: 0.75,
      reasoningScore: 0.8,
      citationIntegrity: 0.9,
      stabilityScore: 0.85,
    });
    expect(report.score.overall).toBeGreaterThan(0);
    expect(report.score.overall).toBeLessThanOrEqual(100);
    expect(report.score.dimensions.length).toBe(9);
    expect(report.score.grade).toMatch(/^[A-F][+-]?$/);
  });

  it("explains why the score was assigned", async () => {
    const report = await generateQualityScore({
      provider: "test",
      model: "test-model",
    });
    expect(report.score.explanation).toBeTruthy();
    expect(report.score.explanation).toContain("Score");
    for (const d of report.score.dimensions) {
      expect(d.explanation).toBeTruthy();
    }
  });

  it("identifies strengths and weaknesses", async () => {
    const report = await generateQualityScore({
      provider: "test",
      model: "test-model",
      accuracy: 0.95,
      hallucinationRate: 0.01,
      latencyMs: 200,
      costUsd: 0.0001,
      reasoningScore: 0.3, // weakness
    });
    expect(report.score.strengths.length).toBeGreaterThan(0);
    expect(report.score.weaknesses.length).toBeGreaterThan(0);
  });

  it("dimensions have weights summing to 1.0", async () => {
    const report = await generateQualityScore({
      provider: "test",
      model: "test-model",
    });
    const totalWeight = report.score.dimensions.reduce((s, d) => s + d.weight, 0);
    expect(Math.round(totalWeight * 100) / 100).toBe(1.0);
  });
});

// ===========================================================================
// Dataset Manager
// ===========================================================================

describe("AI Quality — Dataset Manager", () => {
  const testName = `test-dataset-${Date.now()}`;

  it("creates a dataset", async () => {
    const dataset = await createDataset({
      name: testName,
      description: "Test dataset",
      kind: "golden",
      category: "mathematics",
      owner: "test-user",
      curriculumAlignment: ["mathematics.algebra"],
      tags: ["test", "algebra"],
    });
    expect(dataset.id).toBeTruthy();
    expect(dataset.name).toBe(testName);
    expect(dataset.kind).toBe("golden");
  });

  it("retrieves a dataset by id", async () => {
    const created = await createDataset({
      name: `${testName}-get`,
      kind: "synthetic",
      category: "physics",
    });
    const fetched = await getDataset(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe(`${testName}-get`);
  });

  it("lists datasets", async () => {
    const datasets = await listDatasets();
    expect(datasets.length).toBeGreaterThan(0);
  });

  it("exports and imports datasets", () => {
    const dataset = {
      id: "test-export",
      name: "Export Test",
      description: "Test",
      kind: "curated" as const,
      category: "mathematics",
      owner: null,
      currentVersion: 1,
      versions: [],
      curriculumAlignment: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const exported = exportDataset(dataset);
    expect(exported).toContain("Export Test");
    const imported = importDataset(exported);
    expect(imported.name).toBe("Export Test");
  });

  it("generates a dataset manager report", async () => {
    const report = await generateDatasetManagerReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("datasets");
    expect(report).toHaveProperty("totalDatasets");
    expect(report).toHaveProperty("pendingApprovals");
  });
});

// ===========================================================================
// Leaderboard
// ===========================================================================

describe("AI Quality — Leaderboard", () => {
  it("generates a leaderboard report", async () => {
    const report = await generateLeaderboard();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("bestPrompts");
    expect(report).toHaveProperty("bestModels");
    expect(report).toHaveProperty("bestBenchmarkScores");
    expect(report).toHaveProperty("lowestHallucinationRates");
    expect(report).toHaveProperty("fastestInference");
    expect(report).toHaveProperty("lowestCost");
    expect(report).toHaveProperty("highestTeacherRatings");
    expect(report).toHaveProperty("highestStudentRatings");
    expect(report).toHaveProperty("highestCurriculumAlignment");
    expect(report).toHaveProperty("historicalTrends");
  });

  it("leaderboard entries have rank and score", async () => {
    const report = await generateLeaderboard();
    for (const entry of report.bestModels) {
      expect(entry.rank).toBeGreaterThan(0);
      expect(entry.score).toBeGreaterThanOrEqual(0);
      expect(entry.name).toBeTruthy();
      expect(entry.type).toBe("model");
    }
  });

  it("historical trends have data points", async () => {
    const report = await generateLeaderboard();
    expect(report.historicalTrends.length).toBeGreaterThan(0);
    for (const trend of report.historicalTrends) {
      expect(trend.metric).toBeTruthy();
      expect(Array.isArray(trend.dataPoints)).toBe(true);
    }
  });
});
