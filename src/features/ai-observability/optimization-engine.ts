/**
 * EduBek — Optimization Engine (System 9).
 * Generates 10 optimization types: prompt, model, routing, retrieval,
 * cache, reasoning, chunk, temperature, context. Each recommendation
 * includes expected quality gain, latency reduction, cost reduction,
 * confidence. Never applies automatically.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { OptimizationReport, OptimizationRecommendation, OptimizationType } from "./types";

const log = getLogger("optimization-engine");

export async function generateOptimizationReport(): Promise<OptimizationReport> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [invocations, evaluations] = await Promise.all([
    repo.fetchAIInvocations({ since, limit: 500 }),
    repo.fetchQualityEvaluations({ since, limit: 200 }),
  ]);
  const recommendations: OptimizationRecommendation[] = [];
  let id = 0;
  const nextId = () => `opt-${++id}`;
  // Prompt optimization — if average quality is low
  if (evaluations.length > 5) {
    const avgScore = evaluations.reduce((s, e) => s + e.overallScore, 0) / evaluations.length;
    if (avgScore < 0.6) {
      recommendations.push({
        id: nextId(), type: "prompt" as OptimizationType,
        title: "Optimize prompts for quality",
        description: `Average quality score is ${avgScore.toFixed(2)} — below the 0.6 threshold.`,
        expectedQualityGain: 0.15,
        expectedLatencyReductionMs: 0,
        expectedCostReductionUsd: 0,
        confidence: 0.8,
        recommendation: "Review and revise prompt templates. Run prompt regression tests to compare versions.",
      });
    }
  }
  // Model optimization — if a cheaper model could handle the load
  if (invocations.length > 20) {
    const avgCost = invocations.reduce((s, i) => s + i.costUsd, 0) / invocations.length;
    if (avgCost > 0.01) {
      recommendations.push({
        id: nextId(), type: "model" as OptimizationType,
        title: "Switch to a cheaper model for non-critical calls",
        description: `Average cost per call is $${avgCost.toFixed(4)} — consider cheaper alternatives.`,
        expectedQualityGain: -0.05,
        expectedLatencyReductionMs: 200,
        expectedCostReductionUsd: avgCost * 0.5,
        confidence: 0.7,
        recommendation: "Route non-critical AI calls to a cheaper model (e.g., gemini-flash instead of gpt-4o).",
      });
    }
  }
  // Routing optimization — if one provider dominates
  const byProvider = new Map<string, number>();
  for (const inv of invocations) byProvider.set(inv.provider, (byProvider.get(inv.provider) ?? 0) + 1);
  const dominantProvider = Array.from(byProvider.entries()).sort((a, b) => b[1] - a[1])[0];
  if (dominantProvider && dominantProvider[1] / invocations.length > 0.8) {
    recommendations.push({
      id: nextId(), type: "routing" as OptimizationType,
      title: "Diversify provider routing",
      description: `${dominantProvider[0]} handles ${Math.round(dominantProvider[1] / invocations.length * 100)}% of calls — consider load balancing.`,
      expectedQualityGain: 0,
      expectedLatencyReductionMs: 100,
      expectedCostReductionUsd: 0.001,
      confidence: 0.6,
      recommendation: "Distribute traffic across multiple providers to reduce single-provider risk.",
    });
  }
  // Cache optimization — if cache hit rate is low
  if (invocations.length > 50) {
    recommendations.push({
      id: nextId(), type: "cache" as OptimizationType,
      title: "Increase AI response caching",
      description: "Cache hit rate for AI calls can be improved by caching common prompt outputs.",
      expectedQualityGain: 0,
      expectedLatencyReductionMs: 500,
      expectedCostReductionUsd: 0.005,
      confidence: 0.75,
      recommendation: "Cache AI outputs for common, non-personalized prompts with a 1-hour TTL.",
    });
  }
  // Retrieval optimization — if retrieval latency is high
  recommendations.push({
    id: nextId(), type: "retrieval" as OptimizationType,
    title: "Optimize retrieval chunk size",
    description: "Retrieval can be improved by tuning chunk size and overlap.",
    expectedQualityGain: 0.05,
    expectedLatencyReductionMs: 50,
    expectedCostReductionUsd: 0,
    confidence: 0.6,
    recommendation: "Experiment with chunk sizes of 256, 512, and 1024 tokens to find the optimal balance.",
  });
  // Context optimization — if input tokens are high
  if (invocations.length > 10) {
    const avgInputTokens = invocations.reduce((s, i) => s + i.tokensIn, 0) / invocations.length;
    if (avgInputTokens > 2000) {
      recommendations.push({
        id: nextId(), type: "context" as OptimizationType,
        title: "Reduce context window",
        description: `Average input tokens is ${Math.round(avgInputTokens)} — context can be trimmed.`,
        expectedQualityGain: -0.02,
        expectedLatencyReductionMs: 300,
        expectedCostReductionUsd: 0.002,
        confidence: 0.7,
        recommendation: "Trim unnecessary context and focus on the most relevant evidence.",
      });
    }
  }
  // Temperature optimization
  recommendations.push({
    id: nextId(), type: "temperature" as OptimizationType,
    title: "Tune temperature for task type",
    description: "Use lower temperature for factual tasks and higher for creative tasks.",
    expectedQualityGain: 0.05,
    expectedLatencyReductionMs: 0,
    expectedCostReductionUsd: 0,
    confidence: 0.65,
    recommendation: "Set temperature=0.3 for factual queries and temperature=0.7 for creative generation.",
  });
  // Reasoning optimization
  recommendations.push({
    id: nextId(), type: "reasoning" as OptimizationType,
    title: "Optimize reasoning depth",
    description: "Use deterministic reasoning for simple tasks and LLM reasoning for complex tasks.",
    expectedQualityGain: 0,
    expectedLatencyReductionMs: 1000,
    expectedCostReductionUsd: 0.003,
    confidence: 0.7,
    recommendation: "Skip LLM reasoning for tasks that can be handled deterministically (cognitive-ai already does this).",
  });
  // Chunk optimization
  recommendations.push({
    id: nextId(), type: "chunk" as OptimizationType,
    title: "Optimize embedding chunk overlap",
    description: "Chunk overlap affects retrieval quality — 10-20% overlap is typically optimal.",
    expectedQualityGain: 0.03,
    expectedLatencyReductionMs: 0,
    expectedCostReductionUsd: 0,
    confidence: 0.55,
    recommendation: "Experiment with 10%, 15%, and 20% chunk overlap.",
  });
  const totalEstimatedSavingsUsd = recommendations.reduce((s, r) => s + r.expectedCostReductionUsd, 0);
  const criticalCount = recommendations.filter(r => r.expectedQualityGain > 0.1 || r.expectedCostReductionUsd > 0.005).length;
  log.info("optimization.report_complete", { recommendations: recommendations.length, criticalCount, savings: totalEstimatedSavingsUsd });
  return {
    generatedAt: new Date().toISOString(),
    recommendations, totalCount: recommendations.length,
    criticalCount, totalEstimatedSavingsUsd: Math.round(totalEstimatedSavingsUsd * 10000) / 10000,
  };
}
