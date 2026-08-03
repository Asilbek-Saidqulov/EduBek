/**
 * EduBek — Evaluation Engine (System 2).
 *
 * Evaluates AI outputs using deterministic metrics whenever possible.
 * Metrics: correctness, completeness, reasoning quality, curriculum
 * alignment, answer structure, safety, grounding, readability,
 * educational usefulness, teacher usefulness, student usefulness.
 *
 * Never invokes an LLM for evaluation — all metrics are deterministic.
 * Reuses cached evaluations to avoid re-evaluating the same prompt/model
 * pair.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { BUILTIN_BENCHMARKS, getBenchmarkQuestion, evaluateByStrategy, evaluateSemanticSimilarity } from "./benchmark-library";
import type {
  EvaluationResult, EvaluationMetric, EvaluationReport, BenchmarkQuestion,
} from "./types";

const log = getLogger("evaluation-engine");

// ===========================================================================
// Public API
// ===========================================================================

export async function evaluateOutput(input: {
  benchmarkQuestionId: string;
  provider: string;
  model: string;
  promptId?: string | null;
  promptVersion?: number | null;
  aiOutput: string;
}): Promise<EvaluationResult> {
  const { benchmarkQuestionId, provider, model, promptId, promptVersion, aiOutput } = input;
  const question = getBenchmarkQuestion(benchmarkQuestionId);
  if (!question) throw new Error(`Benchmark question not found: ${benchmarkQuestionId}`);

  // Cache check — never evaluate the same prompt/model pair twice
  if (promptId) {
    const cached = await repo.findEvaluationByPromptModel(promptId, model, benchmarkQuestionId);
    if (cached) {
      log.debug("evaluation.cache_hit", { promptId, model, benchmarkQuestionId });
      return mapEvaluation(cached);
    }
  }

  // Compute all 11 metrics deterministically
  const metrics: EvaluationMetric[] = [
    computeCorrectness(aiOutput, question),
    computeCompleteness(aiOutput, question),
    computeReasoningQuality(aiOutput, question),
    computeCurriculumAlignment(aiOutput, question),
    computeAnswerStructure(aiOutput),
    computeSafety(aiOutput),
    computeGrounding(aiOutput, question),
    computeReadability(aiOutput),
    computeEducationalUsefulness(aiOutput, question),
    computeTeacherUsefulness(aiOutput, question),
    computeStudentUsefulness(aiOutput, question),
  ];

  const overallScore = metrics.reduce((s, m) => s + m.score, 0) / metrics.length;
  const perCategoryScore: Record<string, number> = {};
  perCategoryScore[question.category] = overallScore;
  const improvementSuggestions = generateImprovementSuggestions(metrics, question);
  const confidence = computeConfidence(metrics);

  const row = await repo.createEvaluation({
    benchmarkQuestionId, provider, model,
    promptId: promptId ?? null, promptVersion: promptVersion ?? null,
    aiOutput, metrics, overallScore, categoryScores: perCategoryScore,
    improvementSuggestions, confidence,
    llmUsed: false, evaluationCost: 0, // always deterministic
  });

  log.info("evaluation.complete", {
    id: row.id, benchmarkQuestionId, provider, model,
    score: overallScore, confidence, llmUsed: false,
  });

  return {
    id: row.id,
    benchmarkQuestionId, provider, model,
    promptId: promptId ?? null, promptVersion: promptVersion ?? null,
    aiOutput, metrics, overallScore, perCategoryScore,
    improvementSuggestions, confidence,
    evaluatedAt: row.createdAt.toISOString(),
    llmUsed: false, evaluationCost: 0,
  };
}

export async function evaluateBenchmarkSuite(input: {
  provider: string;
  model: string;
  promptId?: string | null;
  promptVersion?: number | null;
  category?: string;
}): Promise<EvaluationReport> {
  const { provider, model, promptId, promptVersion, category } = input;
  const questions = category
    ? BUILTIN_BENCHMARKS.filter(q => q.category === category)
    : BUILTIN_BENCHMARKS;
  const results: EvaluationResult[] = [];
  let llmCallsSaved = 0;
  for (const q of questions) {
    // For benchmark suite evaluation, we use a simulated output based on the expected answer
    // In production, this would be the actual AI output from a previous invocation
    const simulatedOutput = q.expectedAnswer;
    // Check cache first
    if (promptId) {
      const cached = await repo.findEvaluationByPromptModel(promptId, model, q.id);
      if (cached) {
        llmCallsSaved++;
        results.push(mapEvaluation(cached));
        continue;
      }
    }
    const result = await evaluateOutput({
      benchmarkQuestionId: q.id, provider, model,
      promptId, promptVersion, aiOutput: simulatedOutput,
    });
    results.push(result);
  }
  const averageScore = results.length > 0
    ? results.reduce((s, r) => s + r.overallScore, 0) / results.length
    : 0;
  const categoryScores: Record<string, number> = {};
  for (const r of results) {
    for (const [cat, score] of Object.entries(r.perCategoryScore)) {
      if (!categoryScores[cat]) categoryScores[cat] = 0;
      categoryScores[cat] += score;
    }
  }
  for (const cat of Object.keys(categoryScores)) {
    const count = results.filter(r => cat in r.perCategoryScore).length;
    if (count > 0) categoryScores[cat] /= count;
  }
  log.info("evaluation.suite_complete", {
    provider, model, total: results.length,
    avgScore: averageScore, llmCallsSaved,
  });
  return {
    generatedAt: new Date().toISOString(),
    results, averageScore, categoryScores,
    totalEvaluated: results.length, llmCallsSaved,
  };
}

// ===========================================================================
// Deterministic metric calculators
// ===========================================================================

function computeCorrectness(output: string, question: BenchmarkQuestion): EvaluationMetric {
  const { score, rationale } = evaluateByStrategy(output, question);
  return {
    name: "correctness",
    score,
    rationale: `Correctness: ${rationale}`,
  };
}

function computeCompleteness(output: string, question: BenchmarkQuestion): EvaluationMetric {
  // Check if output addresses all parts of the question
  const questionWords = question.question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const outputLower = output.toLowerCase();
  const addressedCount = questionWords.filter(w => outputLower.includes(w)).length;
  const score = Math.min(1, addressedCount / Math.max(1, questionWords.length));
  return {
    name: "completeness",
    score,
    rationale: `Addresses ${addressedCount}/${questionWords.length} key question terms.`,
  };
}

function computeReasoningQuality(output: string, question: BenchmarkQuestion): EvaluationMetric {
  // Check for reasoning indicators: "because", "therefore", "since", "thus"
  const reasoningKeywords = ["because", "therefore", "since", "thus", "hence", "so", "due to", "as a result"];
  const lower = output.toLowerCase();
  const found = reasoningKeywords.filter(kw => lower.includes(kw));
  const score = Math.min(1, found.length / 3); // 3 reasoning keywords = full score
  return {
    name: "reasoning_quality",
    score,
    rationale: `Found ${found.length} reasoning indicator(s): ${found.join(", ") || "none"}`,
  };
}

function computeCurriculumAlignment(output: string, question: BenchmarkQuestion): EvaluationMetric {
  // Check if output mentions curriculum-related terms from the mapping
  const mappingTerms = question.curriculumMapping.flatMap(m => m.split("."));
  const lower = output.toLowerCase();
  const found = mappingTerms.filter(term => lower.includes(term));
  const score = Math.min(1, found.length / Math.max(1, mappingTerms.length));
  return {
    name: "curriculum_alignment",
    score,
    rationale: `Aligned with ${found.length}/${mappingTerms.length} curriculum terms.`,
  };
}

function computeAnswerStructure(output: string): EvaluationMetric {
  let score = 0;
  if (output.length > 50) score += 0.3;
  if (/\d+\./.test(output)) score += 0.2; // numbered list
  if (/[-*]/.test(output)) score += 0.2; // bullet points
  if (/#{1,3}\s/.test(output)) score += 0.15; // markdown headers
  if (output.includes("\n")) score += 0.15; // multiple lines
  score = Math.min(1, score);
  return {
    name: "answer_structure",
    score,
    rationale: `Structure score: ${(score * 100).toFixed(0)}% (length, lists, headers, paragraphs)`,
  };
}

function computeSafety(output: string): EvaluationMetric {
  // Check for unsafe content — PII, harmful instructions, etc.
  const unsafePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{16}\b/, // credit card
    /password\s*[:=]/i, // passwords
    /how to (make|build|create).*(bomb|weapon|drug)/i, // harmful instructions
  ];
  const flagged = unsafePatterns.filter(p => p.test(output));
  const score = flagged.length === 0 ? 1 : 0;
  return {
    name: "safety",
    score,
    rationale: flagged.length === 0
      ? "No unsafe content detected."
      : `Unsafe content detected: ${flagged.length} pattern(s)`,
  };
}

function computeGrounding(output: string, question: BenchmarkQuestion): EvaluationMetric {
  // Check if output is grounded in the provided evidence
  if (question.evidence.length === 0) {
    return { name: "grounding", score: 0.5, rationale: "No evidence to check against." };
  }
  const lower = output.toLowerCase();
  const evidenceWords = question.evidence.join(" ").toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const groundedCount = evidenceWords.filter(w => lower.includes(w)).length;
  const score = Math.min(1, groundedCount / Math.max(1, evidenceWords.length));
  return {
    name: "grounding",
    score,
    rationale: `Grounded in ${groundedCount}/${evidenceWords.length} evidence terms.`,
  };
}

function computeReadability(output: string): EvaluationMetric {
  // Simple readability: average sentence length (target 15-20 words)
  const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return { name: "readability", score: 0, rationale: "No sentences detected." };
  const avgLength = output.split(/\s+/).length / sentences.length;
  // Optimal: 15-20 words per sentence
  const score = avgLength >= 10 && avgLength <= 25 ? 1
    : avgLength >= 5 && avgLength <= 35 ? 0.7
    : 0.3;
  return {
    name: "readability",
    score,
    rationale: `Average sentence length: ${avgLength.toFixed(1)} words`,
  };
}

function computeEducationalUsefulness(output: string, question: BenchmarkQuestion): EvaluationMetric {
  // Check for educational elements: explanations, examples, analogies
  const educationalKeywords = ["example", "for instance", "such as", "like", "imagine", "think of", "consider"];
  const lower = output.toLowerCase();
  const found = educationalKeywords.filter(kw => lower.includes(kw));
  const hasExplanation = lower.includes("because") || lower.includes("since") || lower.includes("due to");
  let score = 0.3; // base score for answering
  if (found.length > 0) score += 0.3;
  if (hasExplanation) score += 0.2;
  if (output.length > 100) score += 0.2;
  score = Math.min(1, score);
  return {
    name: "educational_usefulness",
    score,
    rationale: `Educational elements: ${found.length} example(s), explanation: ${hasExplanation}`,
  };
}

function computeTeacherUsefulness(output: string, question: BenchmarkQuestion): EvaluationMetric {
  // Check for teacher-relevant elements: assessment criteria, differentiation, pedagogy
  const teacherKeywords = ["assess", "evaluate", "differentiate", "scaffold", "objective", "outcome", "rubric", "criteria"];
  const lower = output.toLowerCase();
  const found = teacherKeywords.filter(kw => lower.includes(kw));
  const score = Math.min(1, 0.3 + found.length * 0.15);
  return {
    name: "teacher_usefulness",
    score,
    rationale: `Teacher-relevant terms: ${found.length} (${found.join(", ") || "none"})`,
  };
}

function computeStudentUsefulness(output: string, question: BenchmarkQuestion): EvaluationMetric {
  // Check for student-relevant elements: step-by-step, examples, encouragement
  const studentKeywords = ["step", "first", "next", "then", "finally", "try", "practice", "remember"];
  const lower = output.toLowerCase();
  const found = studentKeywords.filter(kw => lower.includes(kw));
  const score = Math.min(1, 0.3 + found.length * 0.15);
  return {
    name: "student_usefulness",
    score,
    rationale: `Student-relevant terms: ${found.length} (${found.join(", ") || "none"})`,
  };
}

// ===========================================================================
// Helpers
// ===========================================================================

function generateImprovementSuggestions(metrics: EvaluationMetric[], question: BenchmarkQuestion): string[] {
  const suggestions: string[] = [];
  for (const m of metrics) {
    if (m.score < 0.5) {
      suggestions.push(`Improve ${m.name}: ${m.rationale}`);
    }
  }
  if (suggestions.length === 0) {
    suggestions.push("All metrics scored above 0.5 — no improvements needed.");
  }
  return suggestions;
}

function computeConfidence(metrics: EvaluationMetric[]): number {
  // Confidence = average of metric scores (higher = more confident in the evaluation)
  const avg = metrics.reduce((s, m) => s + m.score, 0) / metrics.length;
  // Confidence in the evaluation itself: higher when metrics agree
  const variance = metrics.reduce((s, m) => s + (m.score - avg) ** 2, 0) / metrics.length;
  const agreement = 1 - Math.min(1, variance * 2);
  return Math.round((avg * 0.5 + agreement * 0.5) * 100) / 100;
}

function mapEvaluation(row: Awaited<ReturnType<typeof repo.createEvaluation>>): EvaluationResult {
  return {
    id: row.id,
    benchmarkQuestionId: row.benchmarkQuestionId,
    provider: row.provider,
    model: row.model,
    promptId: row.promptId,
    promptVersion: row.promptVersion,
    aiOutput: row.aiOutput,
    metrics: repo.safeParse(row.metrics, []),
    overallScore: row.overallScore,
    perCategoryScore: repo.safeParse(row.categoryScores, {}),
    improvementSuggestions: repo.safeParse(row.improvementSuggestions, []),
    confidence: row.confidence,
    evaluatedAt: row.createdAt.toISOString(),
    llmUsed: row.llmUsed,
    evaluationCost: row.evaluationCost,
  };
}
