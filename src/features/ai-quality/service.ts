/**
 * EduBek — AI Quality service.
 *
 * Phase 6B.1: Composes every AI quality subsystem into a unified API
 * surface. Routes are thin wrappers around the functions exported here.
 */
import { generateLibraryReport, listBuiltinBenchmarks, getBenchmarkQuestion, listBenchmarkCategories, buildBenchmarkDataset } from "./benchmark-library";
import { evaluateOutput, evaluateBenchmarkSuite } from "./evaluation-engine";
import { detectHallucinations } from "./hallucination-detector";
import { validateCitations } from "./citation-validator";
import { evaluateRetrieval } from "./retrieval-evaluator";
import { runPromptRegression, generateRegressionReport } from "./prompt-regression";
import { generateModelComparatorReport, MODEL_REGISTRY } from "./model-comparator";
import { generateQualityScore } from "./quality-scoring";
import { createDataset, getDataset, listDatasets, approveDatasetVersion, addDatasetVersion, exportDataset, importDataset, generateDatasetManagerReport } from "./dataset-manager";
import { generateLeaderboard } from "./leaderboard";

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
};
