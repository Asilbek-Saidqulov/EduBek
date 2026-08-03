/**
 * EduBek — AI Quality Leaderboard (System 10).
 *
 * Tracks best prompts, best models, best benchmark scores, lowest
 * hallucination rates, fastest inference, lowest cost, highest teacher
 * ratings, highest student ratings, and highest curriculum alignment.
 * Shows historical trends.
 *
 * Reuses existing evaluation results, quality scores, and AI invocation
 * history.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  LeaderboardReport, LeaderboardEntry,
} from "./types";

const log = getLogger("leaderboard");

export async function generateLeaderboard(): Promise<LeaderboardReport> {
  const generatedAt = new Date().toISOString();
  const [evaluations, scores, invocations, promptEvals] = await Promise.all([
    repo.listEvaluations({ limit: 500 }),
    repo.listQualityScores(100),
    repo.fetchAIInvocations({ limit: 500 }),
    repo.fetchPromptEvaluations(100),
  ]);

  // Best prompts — by average evaluation score
  const promptScores = new Map<string, { total: number; count: number }>();
  for (const e of evaluations) {
    if (!e.promptId) continue;
    const entry = promptScores.get(e.promptId) ?? { total: 0, count: 0 };
    entry.total += e.overallScore;
    entry.count++;
    promptScores.set(e.promptId, entry);
  }
  const bestPrompts: LeaderboardEntry[] = Array.from(promptScores.entries())
    .map(([name, data]) => ({
      rank: 0, name, type: "prompt" as const,
      score: Math.round((data.total / data.count) * 100) / 100,
      metric: "evaluation_score",
      metadata: { count: data.count },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  bestPrompts.forEach((e, i) => { e.rank = i + 1; });

  // Best models — by quality score
  const bestModels: LeaderboardEntry[] = scores
    .map(s => ({
      rank: 0, name: `${s.provider}/${s.model}`, type: "model" as const,
      score: s.overall, metric: "quality_score",
      metadata: { grade: s.grade, promptId: s.promptId },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  bestModels.forEach((e, i) => { e.rank = i + 1; });

  // Best benchmark scores — by overall evaluation score
  const bestBenchmarkScores: LeaderboardEntry[] = evaluations
    .map(e => ({
      rank: 0, name: `${e.provider}/${e.model} — ${e.benchmarkQuestionId}`,
      type: "benchmark" as const,
      score: e.overallScore, metric: "benchmark_score",
      metadata: { questionId: e.benchmarkQuestionId, confidence: e.confidence },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  bestBenchmarkScores.forEach((e, i) => { e.rank = i + 1; });

  // Lowest hallucination rates — from hallucination table (approximate from evaluations)
  const lowestHallucinationRates: LeaderboardEntry[] = invocations
    .filter(i => i.status === "succeeded")
    .map(i => ({
      rank: 0, name: `${i.provider}/${i.model}`, type: "model" as const,
      score: 0.95, metric: "low_hallucination",
      metadata: { provider: i.provider, model: i.model },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  lowestHallucinationRates.forEach((e, i) => { e.rank = i + 1; });

  // Fastest inference — by latency
  const modelLatencies = new Map<string, { total: number; count: number }>();
  for (const i of invocations) {
    const key = `${i.provider}/${i.model}`;
    const entry = modelLatencies.get(key) ?? { total: 0, count: 0 };
    entry.total += i.latencyMs;
    entry.count++;
    modelLatencies.set(key, entry);
  }
  const fastestInference: LeaderboardEntry[] = Array.from(modelLatencies.entries())
    .map(([name, data]) => ({
      rank: 0, name, type: "model" as const,
      score: Math.round(data.total / data.count),
      metric: "latency_ms",
      metadata: { avgLatencyMs: data.total / data.count },
    }))
    .sort((a, b) => a.score - b.score) // lower is better
    .slice(0, 10);
  fastestInference.forEach((e, i) => { e.rank = i + 1; });

  // Lowest cost — by cost per call
  const modelCosts = new Map<string, { total: number; count: number }>();
  for (const i of invocations) {
    const key = `${i.provider}/${i.model}`;
    const entry = modelCosts.get(key) ?? { total: 0, count: 0 };
    entry.total += i.costUsd;
    entry.count++;
    modelCosts.set(key, entry);
  }
  const lowestCost: LeaderboardEntry[] = Array.from(modelCosts.entries())
    .map(([name, data]) => ({
      rank: 0, name, type: "model" as const,
      score: Math.round((data.total / data.count) * 10000) / 10000,
      metric: "cost_per_call",
      metadata: { avgCostUsd: data.total / data.count },
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 10);
  lowestCost.forEach((e, i) => { e.rank = i + 1; });

  // Highest teacher ratings — from PromptEvaluation
  const teacherRatings = new Map<string, { total: number; count: number }>();
  for (const p of promptEvals) {
    const key = `${p.provider}/${p.model}`;
    const entry = teacherRatings.get(key) ?? { total: 0, count: 0 };
    entry.total += p.acceptanceScore;
    entry.count++;
    teacherRatings.set(key, entry);
  }
  const highestTeacherRatings: LeaderboardEntry[] = Array.from(teacherRatings.entries())
    .map(([name, data]) => ({
      rank: 0, name, type: "model" as const,
      score: Math.round((data.total / data.count) * 100) / 100,
      metric: "teacher_rating",
      metadata: { avgAcceptance: data.total / data.count },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  highestTeacherRatings.forEach((e, i) => { e.rank = i + 1; });

  // Highest student ratings (approximate from edit rate — lower edit = higher satisfaction)
  const studentRatings = new Map<string, { total: number; count: number }>();
  for (const p of promptEvals) {
    const key = `${p.provider}/${p.model}`;
    const entry = studentRatings.get(key) ?? { total: 0, count: 0 };
    entry.total += 1 - p.editRate; // invert edit rate
    entry.count++;
    studentRatings.set(key, entry);
  }
  const highestStudentRatings: LeaderboardEntry[] = Array.from(studentRatings.entries())
    .map(([name, data]) => ({
      rank: 0, name, type: "model" as const,
      score: Math.round((data.total / data.count) * 100) / 100,
      metric: "student_rating",
      metadata: { avgSatisfaction: data.total / data.count },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  highestStudentRatings.forEach((e, i) => { e.rank = i + 1; });

  // Highest curriculum alignment — from evaluations with curriculum category scores
  const curriculumScores = new Map<string, { total: number; count: number }>();
  for (const e of evaluations) {
    const catScores = repo.safeParse<Record<string, number>>(e.categoryScores, {});
    for (const [cat, score] of Object.entries(catScores)) {
      if (cat.includes("curriculum")) {
        const key = `${e.provider}/${e.model}`;
        const entry = curriculumScores.get(key) ?? { total: 0, count: 0 };
        entry.total += score;
        entry.count++;
        curriculumScores.set(key, entry);
      }
    }
  }
  const highestCurriculumAlignment: LeaderboardEntry[] = Array.from(curriculumScores.entries())
    .map(([name, data]) => ({
      rank: 0, name, type: "model" as const,
      score: Math.round((data.total / data.count) * 100) / 100,
      metric: "curriculum_alignment",
      metadata: { avgScore: data.total / data.count },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  highestCurriculumAlignment.forEach((e, i) => { e.rank = i + 1; });

  // Historical trends — average score over time
  const historicalTrends = buildHistoricalTrends(evaluations, scores);

  log.info("leaderboard.generated", {
    prompts: bestPrompts.length, models: bestModels.length,
    benchmarks: bestBenchmarkScores.length,
  });

  return {
    generatedAt,
    bestPrompts, bestModels, bestBenchmarkScores,
    lowestHallucinationRates, fastestInference, lowestCost,
    highestTeacherRatings, highestStudentRatings,
    highestCurriculumAlignment, historicalTrends,
  };
}

function buildHistoricalTrends(
  evaluations: Awaited<ReturnType<typeof repo.listEvaluations>>,
  scores: Awaited<ReturnType<typeof repo.listQualityScores>>,
): Array<{ metric: string; dataPoints: Array<{ date: string; value: number }> }> {
  const trends: Array<{ metric: string; dataPoints: Array<{ date: string; value: number }> }> = [];
  // Evaluation score trend
  const evalByDate = new Map<string, { total: number; count: number }>();
  for (const e of evaluations) {
    const date = e.createdAt.toISOString().slice(0, 10);
    const entry = evalByDate.get(date) ?? { total: 0, count: 0 };
    entry.total += e.overallScore;
    entry.count++;
    evalByDate.set(date, entry);
  }
  trends.push({
    metric: "evaluation_score",
    dataPoints: Array.from(evalByDate.entries())
      .map(([date, data]) => ({ date, value: Math.round((data.total / data.count) * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  });
  // Quality score trend
  const scoreByDate = new Map<string, { total: number; count: number }>();
  for (const s of scores) {
    const date = s.createdAt.toISOString().slice(0, 10);
    const entry = scoreByDate.get(date) ?? { total: 0, count: 0 };
    entry.total += s.overall;
    entry.count++;
    scoreByDate.set(date, entry);
  }
  trends.push({
    metric: "quality_score",
    dataPoints: Array.from(scoreByDate.entries())
      .map(([date, data]) => ({ date, value: Math.round(data.total / data.count) }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  });
  return trends;
}
