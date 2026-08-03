/**
 * EduBek — AI Quality Scoring (System 8).
 *
 * Generates one quality score (0..100) from 9 dimensions: accuracy,
 * hallucination risk, retrieval quality, latency, cost, educational
 * usefulness, reasoning, citation quality, and stability.
 *
 * Deterministic — explains exactly why the score was assigned.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { QualityScore, QualityScoreReport } from "./types";

const log = getLogger("quality-scoring");

const DIMENSION_WEIGHTS = {
  accuracy: 0.18,
  hallucinationRisk: 0.15,
  retrievalQuality: 0.12,
  latency: 0.08,
  cost: 0.07,
  educationalUsefulness: 0.15,
  reasoning: 0.10,
  citationQuality: 0.10,
  stability: 0.05,
} as const;

export async function generateQualityScore(input: {
  provider: string;
  model: string;
  promptId?: string | null;
  accuracy?: number;
  hallucinationRate?: number;
  retrievalScore?: number;
  latencyMs?: number;
  costUsd?: number;
  educationalUsefulness?: number;
  reasoningScore?: number;
  citationIntegrity?: number;
  stabilityScore?: number;
}): Promise<QualityScoreReport> {
  const { provider, model, promptId } = input;
  const dimensions: QualityScore["dimensions"] = [
    {
      name: "Accuracy",
      score: toScore(input.accuracy ?? 0.7),
      weight: DIMENSION_WEIGHTS.accuracy,
      weightedScore: 0,
      explanation: `Accuracy: ${(input.accuracy ?? 0.7).toFixed(2)} — based on benchmark evaluation scores.`,
    },
    {
      name: "Hallucination Risk",
      score: toScore(1 - (input.hallucinationRate ?? 0.1)),
      weight: DIMENSION_WEIGHTS.hallucinationRisk,
      weightedScore: 0,
      explanation: `Hallucination rate: ${((input.hallucinationRate ?? 0.1) * 100).toFixed(1)}% — inverted for scoring (lower hallucination = higher score).`,
    },
    {
      name: "Retrieval Quality",
      score: toScore(input.retrievalScore ?? 0.7),
      weight: DIMENSION_WEIGHTS.retrievalQuality,
      weightedScore: 0,
      explanation: `Retrieval quality: ${(input.retrievalScore ?? 0.7).toFixed(2)} — precision × recall × relevance.`,
    },
    {
      name: "Latency",
      score: latencyToScore(input.latencyMs ?? 1000),
      weight: DIMENSION_WEIGHTS.latency,
      weightedScore: 0,
      explanation: `Latency: ${input.latencyMs ?? 1000}ms — lower is better (<500ms = 100, >5000ms = 20).`,
    },
    {
      name: "Cost",
      score: costToScore(input.costUsd ?? 0.01),
      weight: DIMENSION_WEIGHTS.cost,
      weightedScore: 0,
      explanation: `Cost: $${(input.costUsd ?? 0.01).toFixed(4)} per call — lower is better (<$0.001 = 100, >$0.05 = 20).`,
    },
    {
      name: "Educational Usefulness",
      score: toScore(input.educationalUsefulness ?? 0.7),
      weight: DIMENSION_WEIGHTS.educationalUsefulness,
      weightedScore: 0,
      explanation: `Educational usefulness: ${(input.educationalUsefulness ?? 0.7).toFixed(2)} — presence of explanations, examples, analogies.`,
    },
    {
      name: "Reasoning",
      score: toScore(input.reasoningScore ?? 0.7),
      weight: DIMENSION_WEIGHTS.reasoning,
      weightedScore: 0,
      explanation: `Reasoning score: ${(input.reasoningScore ?? 0.7).toFixed(2)} — presence of reasoning indicators (because, therefore, etc.).`,
    },
    {
      name: "Citation Quality",
      score: toScore(input.citationIntegrity ?? 0.8),
      weight: DIMENSION_WEIGHTS.citationQuality,
      weightedScore: 0,
      explanation: `Citation integrity: ${(input.citationIntegrity ?? 0.8).toFixed(2)} — fraction of valid citations.`,
    },
    {
      name: "Stability",
      score: toScore(input.stabilityScore ?? 0.8),
      weight: DIMENSION_WEIGHTS.stability,
      weightedScore: 0,
      explanation: `Stability: ${(input.stabilityScore ?? 0.8).toFixed(2)} — consistency of outputs across runs.`,
    },
  ];
  for (const d of dimensions) d.weightedScore = d.score * d.weight;
  const overall = Math.round(dimensions.reduce((s, d) => s + d.weightedScore, 0));
  const grade = scoreToGrade(overall);
  const strengths = dimensions.filter(d => d.score >= 75).map(d => `${d.name}: ${d.score}/100`);
  const weaknesses = dimensions.filter(d => d.score < 50).map(d => `${d.name}: ${d.score}/100`);
  const recommendations: string[] = [];
  for (const d of dimensions) {
    if (d.score < 50) recommendations.push(`Improve ${d.name} — currently ${d.score}/100.`);
  }
  if (recommendations.length === 0) recommendations.push("All dimensions are healthy — no improvements needed.");
  const explanation = `Score ${overall}/100 (grade ${grade}). Weighted average of ${dimensions.length} dimensions. ${strengths.length} strength(s), ${weaknesses.length} weakness(es).`;
  const score: QualityScore = {
    overall, dimensions, explanation, grade,
    strengths, weaknesses, recommendations,
  };
  // Persist
  await repo.createQualityScore({
    provider, model, promptId: promptId ?? null,
    overall, dimensions, explanation, grade,
  }).catch(() => { /* best-effort */ });
  log.info("quality.score_complete", { provider, model, overall, grade });
  return {
    generatedAt: new Date().toISOString(),
    provider, model, promptId: promptId ?? null,
    score,
  };
}

function toScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function latencyToScore(ms: number): number {
  if (ms < 500) return 100;
  if (ms < 1000) return 85;
  if (ms < 2000) return 70;
  if (ms < 5000) return 50;
  return 20;
}

function costToScore(usd: number): number {
  if (usd < 0.001) return 100;
  if (usd < 0.005) return 85;
  if (usd < 0.01) return 70;
  if (usd < 0.05) return 50;
  return 20;
}

function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D";
  return "F";
}
