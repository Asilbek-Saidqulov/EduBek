/**
 * EduBek — AI Quality repository.
 *
 * Thin Prisma-only layer. All business logic lives in the dedicated
 * subsystem files.
 */
import { db } from "@/lib/db";

// ===========================================================================
// Benchmarks
// ===========================================================================

export async function createBenchmark(input: {
  name: string; description?: string; category: string;
  questions?: unknown[]; version?: number;
}) {
  return db.aIQualityBenchmark.create({
    data: {
      name: input.name, description: input.description ?? "",
      category: input.category,
      questions: JSON.stringify(input.questions ?? []),
      version: input.version ?? 1,
    },
  });
}

export async function findBenchmark(id: string) {
  return db.aIQualityBenchmark.findUnique({ where: { id } });
}

export async function listBenchmarks(category?: string) {
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  return db.aIQualityBenchmark.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
}

// ===========================================================================
// Evaluations
// ===========================================================================

export async function createEvaluation(input: {
  benchmarkQuestionId: string; provider: string; model: string;
  promptId?: string | null; promptVersion?: number | null; aiOutput: string;
  metrics?: unknown[]; overallScore?: number; categoryScores?: unknown;
  improvementSuggestions?: string[]; confidence?: number;
  llmUsed?: boolean; evaluationCost?: number;
}) {
  return db.aIQualityEvaluation.create({
    data: {
      benchmarkQuestionId: input.benchmarkQuestionId,
      provider: input.provider, model: input.model,
      promptId: input.promptId ?? null, promptVersion: input.promptVersion ?? null,
      aiOutput: input.aiOutput,
      metrics: JSON.stringify(input.metrics ?? []),
      overallScore: input.overallScore ?? 0,
      categoryScores: JSON.stringify(input.categoryScores ?? {}),
      improvementSuggestions: JSON.stringify(input.improvementSuggestions ?? []),
      confidence: input.confidence ?? 0.5,
      llmUsed: input.llmUsed ?? false,
      evaluationCost: input.evaluationCost ?? 0,
    },
  });
}

export async function listEvaluations(opts: { provider?: string; model?: string; promptId?: string; limit?: number } = {}) {
  const where: Record<string, unknown> = {};
  if (opts.provider) where.provider = opts.provider;
  if (opts.model) where.model = opts.model;
  if (opts.promptId) where.promptId = opts.promptId;
  return db.aIQualityEvaluation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 100,
  });
}

export async function findEvaluationByPromptModel(promptId: string, model: string, benchmarkQuestionId: string) {
  // Cache lookup — never evaluate the same prompt/model pair twice
  return db.aIQualityEvaluation.findFirst({
    where: { promptId, model, benchmarkQuestionId },
    orderBy: { createdAt: "desc" },
  });
}

// ===========================================================================
// Hallucinations
// ===========================================================================

export async function createHallucination(input: {
  evaluationId?: string | null; kind: string; severity: string;
  description: string; flaggedText: string; rationale: string;
  suggestedCorrection?: string | null;
}) {
  return db.aIQualityHallucination.create({
    data: {
      evaluationId: input.evaluationId ?? null,
      kind: input.kind, severity: input.severity,
      description: input.description, flaggedText: input.flaggedText,
      rationale: input.rationale,
      suggestedCorrection: input.suggestedCorrection ?? null,
    },
  });
}

export async function listHallucinations(limit = 50) {
  return db.aIQualityHallucination.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ===========================================================================
// Citation checks
// ===========================================================================

export async function createCitationCheck(input: {
  evaluationId?: string | null; citation: string;
  sourceExists?: boolean; sourceReachable?: boolean;
  matchesClaim?: boolean; isDuplicate?: boolean;
  isBroken?: boolean; details?: string;
}) {
  return db.aIQualityCitationCheck.create({
    data: {
      evaluationId: input.evaluationId ?? null,
      citation: input.citation,
      sourceExists: input.sourceExists ?? false,
      sourceReachable: input.sourceReachable ?? false,
      matchesClaim: input.matchesClaim ?? false,
      isDuplicate: input.isDuplicate ?? false,
      isBroken: input.isBroken ?? false,
      details: input.details ?? "",
    },
  });
}

export async function listCitationChecks(limit = 50) {
  return db.aIQualityCitationCheck.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ===========================================================================
// Datasets
// ===========================================================================

export async function createDataset(input: {
  name: string; description?: string; kind?: string; category: string;
  owner?: string | null; curriculumAlignment?: string[]; tags?: string[];
}) {
  return db.aIQualityDataset.create({
    data: {
      name: input.name, description: input.description ?? "",
      kind: input.kind ?? "curated", category: input.category,
      owner: input.owner ?? null,
      curriculumAlignment: JSON.stringify(input.curriculumAlignment ?? []),
      tags: JSON.stringify(input.tags ?? []),
    },
  });
}

export async function findDataset(id: string) {
  return db.aIQualityDataset.findUnique({ where: { id } });
}

export async function listDatasets(category?: string) {
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  return db.aIQualityDataset.findMany({ where, orderBy: { updatedAt: "desc" }, take: 100 });
}

export async function updateDataset(id: string, input: {
  currentVersion?: number; versions?: unknown[]; tags?: string[];
}) {
  const data: Record<string, unknown> = {};
  if (input.currentVersion !== undefined) data.currentVersion = input.currentVersion;
  if (input.versions !== undefined) data.versions = JSON.stringify(input.versions);
  if (input.tags !== undefined) data.tags = JSON.stringify(input.tags);
  return db.aIQualityDataset.update({ where: { id }, data });
}

// ===========================================================================
// Quality scores
// ===========================================================================

export async function createQualityScore(input: {
  provider: string; model: string; promptId?: string | null;
  overall?: number; dimensions?: unknown[]; explanation?: string; grade?: string;
}) {
  return db.aIQualityScore.create({
    data: {
      provider: input.provider, model: input.model,
      promptId: input.promptId ?? null,
      overall: input.overall ?? 0,
      dimensions: JSON.stringify(input.dimensions ?? []),
      explanation: input.explanation ?? "",
      grade: input.grade ?? "F",
    },
  });
}

export async function listQualityScores(limit = 50) {
  return db.aIQualityScore.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ===========================================================================
// Leaderboard
// ===========================================================================

export async function createLeaderboardEntry(input: {
  name: string; type: string; score?: number; metric: string; metadata?: unknown;
}) {
  return db.aIQualityLeaderboard.create({
    data: {
      name: input.name, type: input.type,
      score: input.score ?? 0, metric: input.metric,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}

export async function listLeaderboardEntries(opts: { type?: string; metric?: string; limit?: number } = {}) {
  const where: Record<string, unknown> = {};
  if (opts.type) where.type = opts.type;
  if (opts.metric) where.metric = opts.metric;
  return db.aIQualityLeaderboard.findMany({
    where,
    orderBy: { score: "desc" },
    take: opts.limit ?? 50,
  });
}

// ===========================================================================
// Reuse existing AI invocation history (Platform Orchestrator)
// ===========================================================================

export async function fetchAIInvocations(opts: { provider?: string; limit?: number; since?: Date } = {}) {
  const where: Record<string, unknown> = {};
  if (opts.provider) where.provider = opts.provider;
  if (opts.since) where.createdAt = { gte: opts.since };
  return db.orchestratorAIInvocation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 100,
    select: {
      id: true, provider: true, model: true, status: true,
      tokensIn: true, tokensOut: true, costUsd: true, latencyMs: true,
      promptId: true, promptVersion: true, createdAt: true,
    },
  }).catch(() => []);
}

// ===========================================================================
// Reuse existing PromptEvaluation (Platform Intelligence)
// ===========================================================================

export async function fetchPromptEvaluations(limit = 100) {
  return db.promptEvaluation.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, promptTemplateId: true, promptVersion: true,
      provider: true, model: true,
      acceptanceScore: true, regenerationRate: true, editRate: true,
      userRating: true, costCredits: true, latencyMs: true, locale: true,
      createdAt: true,
    },
  }).catch(() => []);
}

// ===========================================================================
// Helpers
// ===========================================================================

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
