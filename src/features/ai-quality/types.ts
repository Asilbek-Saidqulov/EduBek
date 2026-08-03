/**
 * EduBek — AI Quality types.
 *
 * Phase 6B.1: AI evaluation, benchmarking, hallucination detection,
 * citation validation, retrieval evaluation, prompt regression testing,
 * model comparison, quality scoring, dataset management, and a
 * leaderboard.
 *
 * Every type is a *diagnostic* surface — this module produces
 * evaluations and recommendations, never automatic changes. All
 * endpoints are read-only.
 */

// ===========================================================================
// SYSTEM 1 — Benchmark Library
// ===========================================================================

export type BenchmarkCategory =
  | "mathematics" | "physics" | "chemistry" | "biology" | "programming"
  | "languages" | "history" | "economics" | "medical"
  | "curriculum_reasoning" | "lesson_planning" | "assessment_generation"
  | "knowledge_graph" | "search" | "marketplace" | "general";

export type EvaluationStrategy =
  | "exact_match" | "contains_keywords" | "semantic_similarity"
  | "rubric_scored" | "human_review" | "automated_heuristic";

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

export interface BenchmarkQuestion {
  id: string;
  category: BenchmarkCategory;
  question: string;
  expectedAnswer: string;
  acceptableAlternatives: string[];
  evidence: string[];
  difficulty: Difficulty;
  curriculumMapping: string[];
  tags: string[];
  evaluationStrategy: EvaluationStrategy;
  /** Points value for scoring (1-10). */
  points: number;
}

export interface BenchmarkDataset {
  id: string;
  name: string;
  description: string;
  category: BenchmarkCategory;
  questions: BenchmarkQuestion[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BenchmarkLibraryReport {
  generatedAt: string;
  datasets: BenchmarkDataset[];
  totalQuestions: number;
  categoriesCovered: BenchmarkCategory[];
  categoryCounts: Record<string, number>;
}

// ===========================================================================
// SYSTEM 2 — Evaluation Engine
// ===========================================================================

export interface EvaluationMetric {
  name: string;
  score: number; // 0..1
  rationale: string;
}

export interface EvaluationResult {
  id: string;
  benchmarkQuestionId: string;
  provider: string;
  model: string;
  promptId: string | null;
  promptVersion: number | null;
  aiOutput: string;
  metrics: EvaluationMetric[];
  overallScore: number; // 0..1
  perCategoryScore: Record<string, number>;
  improvementSuggestions: string[];
  confidence: number; // 0..1
  evaluatedAt: string;
  /** Whether LLM was used for evaluation (should be false for deterministic). */
  llmUsed: boolean;
  /** Cost of evaluation in USD (should be 0 for deterministic). */
  evaluationCost: number;
}

export interface EvaluationReport {
  generatedAt: string;
  results: EvaluationResult[];
  averageScore: number;
  categoryScores: Record<string, number>;
  totalEvaluated: number;
  llmCallsSaved: number;
}

// ===========================================================================
// SYSTEM 3 — Hallucination Detector
// ===========================================================================

export type HallucinationSeverity = "low" | "medium" | "high" | "critical";

export type HallucinationKind =
  | "unsupported_claim" | "invented_fact" | "invented_citation"
  | "contradiction" | "missing_evidence" | "unsupported_statistic";

export interface HallucinationFinding {
  id: string;
  kind: HallucinationKind;
  severity: HallucinationSeverity;
  description: string;
  /** The specific text in the AI output that triggered the finding. */
  flaggedText: string;
  /** Why this was flagged. */
  rationale: string;
  /** Suggested correction (if any). */
  suggestedCorrection: string | null;
}

export interface HallucinationReport {
  generatedAt: string;
  findings: HallucinationFinding[];
  totalCount: number;
  severityCounts: Record<HallucinationSeverity, number>;
  hallucinationRate: number; // 0..1 — findings per 1000 words
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendation: string;
}

// ===========================================================================
// SYSTEM 4 — Citation Validator
// ===========================================================================

export interface CitationCheck {
  citation: string;
  sourceExists: boolean;
  sourceReachable: boolean;
  matchesClaim: boolean;
  isDuplicate: boolean;
  isBroken: boolean;
  details: string;
}

export interface CitationValidationReport {
  generatedAt: string;
  totalCitations: number;
  checks: CitationCheck[];
  validCitations: number;
  brokenCitations: number;
  duplicateCitations: number;
  missingCitations: number;
  citationIntegrityScore: number; // 0..1
  recommendation: string;
}

// ===========================================================================
// SYSTEM 5 — Retrieval Evaluator
// ===========================================================================

export interface RetrievalMetrics {
  precision: number; // 0..1
  recall: number; // 0..1
  relevance: number; // 0..1
  evidenceOverlap: number; // 0..1
  rankingQuality: number; // 0..1
  chunkUsefulness: number; // 0..1
  embeddingEffectiveness: number; // 0..1
  missingKnowledge: string[];
}

export interface RetrievalEvaluationReport {
  generatedAt: string;
  query: string;
  metrics: RetrievalMetrics;
  suggestions: Array<{ parameter: string; currentValue: string; suggestedValue: string; reason: string }>;
  overallRetrievalScore: number; // 0..1
}

// ===========================================================================
// SYSTEM 6 — Prompt Regression Testing
// ===========================================================================

export interface PromptVersionComparison {
  promptId: string;
  oldVersion: number;
  newVersion: number;
  scoreDelta: number;
  latencyDeltaMs: number;
  tokenDelta: number;
  costDeltaUsd: number;
  hallucinationDelta: number;
  status: "improvement" | "regression" | "neutral";
  recommendation: string;
}

export interface PromptRegressionReport {
  generatedAt: string;
  comparisons: PromptVersionComparison[];
  regressions: PromptVersionComparison[];
  improvements: PromptVersionComparison[];
  rollbackRecommendations: Array<{ promptId: string; fromVersion: number; toVersion: number; reason: string }>;
}

// ===========================================================================
// SYSTEM 7 — Model Comparator
// ===========================================================================

export interface ModelComparison {
  provider: string;
  model: string;
  qualityScore: number;
  latencyMs: number;
  tokenUsage: number;
  costPerCall: number;
  hallucinationRate: number;
  reasoningScore: number;
  curriculumAccuracy: number;
  teacherPreference: number;
  studentPreference: number;
  overallRank: number;
}

export interface ModelComparatorReport {
  generatedAt: string;
  comparisons: ModelComparison[];
  recommendationsByTask: Array<{ task: string; recommendedModel: string; reason: string }>;
  bestOverall: ModelComparison | null;
}

// ===========================================================================
// SYSTEM 8 — AI Quality Scoring
// ===========================================================================

export interface QualityScore {
  overall: number; // 0..100
  dimensions: Array<{
    name: string;
    score: number; // 0..100
    weight: number;
    weightedScore: number;
    explanation: string;
  }>;
  explanation: string;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface QualityScoreReport {
  generatedAt: string;
  provider: string;
  model: string;
  promptId: string | null;
  score: QualityScore;
}

// ===========================================================================
// SYSTEM 9 — Dataset Manager
// ===========================================================================

export type DatasetKind = "golden" | "synthetic" | "community" | "curated";

export interface DatasetVersion {
  version: number;
  createdAt: string;
  createdBy: string | null;
  approved: boolean;
  approvedBy: string | null;
  questionCount: number;
  notes: string;
}

export interface ManagedDataset {
  id: string;
  name: string;
  description: string;
  kind: DatasetKind;
  category: BenchmarkCategory;
  owner: string | null;
  currentVersion: number;
  versions: DatasetVersion[];
  curriculumAlignment: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DatasetManagerReport {
  generatedAt: string;
  datasets: ManagedDataset[];
  totalDatasets: number;
  totalQuestions: number;
  pendingApprovals: number;
}

// ===========================================================================
// SYSTEM 10 — AI Quality Leaderboard
// ===========================================================================

export interface LeaderboardEntry {
  rank: number;
  name: string;
  type: "prompt" | "model" | "benchmark";
  score: number;
  metric: string;
  metadata: Record<string, unknown>;
}

export interface LeaderboardReport {
  generatedAt: string;
  bestPrompts: LeaderboardEntry[];
  bestModels: LeaderboardEntry[];
  bestBenchmarkScores: LeaderboardEntry[];
  lowestHallucinationRates: LeaderboardEntry[];
  fastestInference: LeaderboardEntry[];
  lowestCost: LeaderboardEntry[];
  highestTeacherRatings: LeaderboardEntry[];
  highestStudentRatings: LeaderboardEntry[];
  highestCurriculumAlignment: LeaderboardEntry[];
  historicalTrends: Array<{
    metric: string;
    dataPoints: Array<{ date: string; value: number }>;
  }>;
}

// ===========================================================================
// Shared
// ===========================================================================

export interface AIQualityRecommendation {
  id: string;
  category: "benchmark" | "evaluation" | "hallucination" | "citation" | "retrieval" | "regression" | "model" | "scoring" | "dataset" | "leaderboard";
  title: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  effort: "low" | "medium" | "high";
  recommendation: string;
}
