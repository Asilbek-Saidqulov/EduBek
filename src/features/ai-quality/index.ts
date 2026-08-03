/**
 * EduBek — AI Quality barrel export.
 *
 * Phase 6B.1: AI Evaluation, Benchmarking & Quality Assurance Platform.
 *
 * 10 systems:
 *   1. Benchmark Library (benchmark-library)
 *   2. Evaluation Engine (evaluation-engine)
 *   3. Hallucination Detector (hallucination-detector)
 *   4. Citation Validator (citation-validator)
 *   5. Retrieval Evaluator (retrieval-evaluator)
 *   6. Prompt Regression Testing (prompt-regression)
 *   7. Model Comparator (model-comparator)
 *   8. AI Quality Scoring (quality-scoring)
 *   9. Dataset Manager (dataset-manager)
 *  10. AI Quality Leaderboard (leaderboard)
 *
 * All endpoints are READ-ONLY diagnostics. This module produces
 * evaluations and recommendations, never automatic changes. It reuses
 * Platform Orchestrator, Cognitive AI, Platform Intelligence, Global
 * Intelligence, Data Fabric, and Cloud Infrastructure without
 * duplicating functionality.
 *
 * Prefer deterministic algorithms over LLM calls. Cache benchmark
 * results. Never evaluate the same prompt/model pair twice.
 */

export {
  generateLibraryReport, listBuiltinBenchmarks, getBenchmarkQuestion, listBenchmarkCategories, buildBenchmarkDataset,
  evaluateOutput, evaluateBenchmarkSuite,
  detectHallucinations,
  validateCitations,
  evaluateRetrieval,
  runPromptRegression, generateRegressionReport,
  generateModelComparatorReport, MODEL_REGISTRY,
  generateQualityScore,
  createDataset, getDataset, listDatasets, approveDatasetVersion, addDatasetVersion, exportDataset, importDataset, generateDatasetManagerReport,
  generateLeaderboard,
} from "./service";

export type {
  BenchmarkCategory, EvaluationStrategy, Difficulty,
  BenchmarkQuestion, BenchmarkDataset, BenchmarkLibraryReport,
  EvaluationMetric, EvaluationResult, EvaluationReport,
  HallucinationSeverity, HallucinationKind, HallucinationFinding, HallucinationReport,
  CitationCheck, CitationValidationReport,
  RetrievalMetrics, RetrievalEvaluationReport,
  PromptVersionComparison, PromptRegressionReport,
  ModelComparison, ModelComparatorReport,
  QualityScore, QualityScoreReport,
  DatasetKind, DatasetVersion, ManagedDataset, DatasetManagerReport,
  LeaderboardEntry, LeaderboardReport,
  AIQualityRecommendation,
} from "./types";
