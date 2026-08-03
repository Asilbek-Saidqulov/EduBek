/**
 * EduBek — Reflection Engine (System 10).
 *
 * After every important AI action, generate an internal reflection.
 * Questions asked:
 *   • Was my recommendation useful?
 *   • Could another workflow be better?
 *   • Was evidence sufficient?
 *   • Was confidence too high?
 *   • Should memory be updated?
 *
 * Reflections are stored and reused later. The reflection is
 * deterministic — it scores the action against evidence quality,
 * confidence calibration, and tool usage.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { ReflectionEntry, EvidenceItem } from "./types";

const log = getLogger("cognitive-reflection-engine");

// ===========================================================================
// Public API
// ===========================================================================

export async function reflectOnAction(input: {
  actionType: string;
  traceId: string;
  evidence: EvidenceItem[];
  confidence: number;
  modulesUsed: string[];
  llmInvoked: boolean;
  estimatedCost: number;
  userFollowedRecommendation?: boolean;
  outcome?: "success" | "partial" | "failure" | "unknown";
}): Promise<ReflectionEntry> {
  const reflections: Array<{ question: string; answer: string; score: number }> = [];

  // Q1: Was my recommendation useful?
  const usefulness = assessUsefulness(input);
  reflections.push({
    question: "Was my recommendation useful?",
    answer: usefulness.answer,
    score: usefulness.score,
  });

  // Q2: Could another workflow be better?
  const workflow = assessWorkflow(input);
  reflections.push({
    question: "Could another workflow be better?",
    answer: workflow.answer,
    score: workflow.score,
  });

  // Q3: Was evidence sufficient?
  const evidenceAssessment = assessEvidence(input);
  reflections.push({
    question: "Was evidence sufficient?",
    answer: evidenceAssessment.answer,
    score: evidenceAssessment.score,
  });

  // Q4: Was confidence too high?
  const confidence = assessConfidence(input);
  reflections.push({
    question: "Was confidence too high?",
    answer: confidence.answer,
    score: confidence.score,
  });

  // Q5: Should memory be updated?
  const memoryUpdate = assessMemoryUpdate(input);
  reflections.push({
    question: "Should memory be updated?",
    answer: memoryUpdate.answer,
    score: memoryUpdate.score,
  });

  const overallScore = reflections.reduce((s, r) => s + r.score, 0) / reflections.length;
  const lessons = deriveLessons(input, reflections);
  const memoryUpdateRecommended = memoryUpdate.score < 0.5;

  const row = await repo.createReflection({
    actionType: input.actionType, traceId: input.traceId,
    reflections, overallScore, lessons, memoryUpdateRecommended,
  });
  log.info("reflection.recorded", { id: row.id, actionType: input.actionType, overallScore });
  return {
    id: row.id,
    actionType: row.actionType,
    traceId: row.traceId,
    reflections,
    overallScore,
    lessons,
    memoryUpdateRecommended,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listReflections(limit = 20): Promise<ReflectionEntry[]> {
  const rows = await repo.listReflections(limit);
  return rows.map(r => ({
    id: r.id, actionType: r.actionType, traceId: r.traceId,
    reflections: repo.safeParse(r.reflections, []),
    overallScore: r.overallScore,
    lessons: repo.safeParse(r.lessons, []),
    memoryUpdateRecommended: r.memoryUpdateRecommended,
    createdAt: r.createdAt.toISOString(),
  }));
}

// ===========================================================================
// Assessment helpers — deterministic scoring
// ===========================================================================

function assessUsefulness(input: { outcome?: string; userFollowedRecommendation?: boolean }): { answer: string; score: number } {
  if (input.outcome === "success") {
    return { answer: "Yes — outcome was successful", score: 0.9 };
  }
  if (input.outcome === "partial") {
    return { answer: "Partially — outcome was only partially successful", score: 0.6 };
  }
  if (input.outcome === "failure") {
    return { answer: "No — outcome failed. Should reconsider approach", score: 0.2 };
  }
  if (input.userFollowedRecommendation) {
    return { answer: "Likely yes — user followed the recommendation", score: 0.7 };
  }
  return { answer: "Unknown — no outcome data available", score: 0.5 };
}

function assessWorkflow(input: { modulesUsed: string[]; llmInvoked: boolean; estimatedCost: number }): { answer: string; score: number } {
  // Score by efficiency — fewer modules + lower cost = better
  const moduleCount = input.modulesUsed.length;
  let score = 0.8;
  if (moduleCount > 8) score -= 0.2;
  if (input.estimatedCost > 0.05) score -= 0.2;
  if (input.llmInvoked && input.estimatedCost < 0.01) score += 0.1;
  const answer = moduleCount > 8
    ? "May have used too many modules — consider a more focused approach"
    : "Workflow seems appropriately scoped";
  return { answer, score: Math.max(0.1, Math.min(1, score)) };
}

function assessEvidence(input: { evidence: EvidenceItem[] }): { answer: string; score: number } {
  const count = input.evidence.length;
  if (count >= 5) {
    return { answer: "Yes — evidence was sufficient", score: 0.9 };
  }
  if (count >= 2) {
    return { answer: "Moderate — could use more evidence", score: 0.6 };
  }
  if (count === 1) {
    return { answer: "Limited — only one piece of evidence", score: 0.4 };
  }
  return { answer: "No — no evidence was used", score: 0.2 };
}

function assessConfidence(input: { confidence: number; evidence: EvidenceItem[]; outcome?: string }): { answer: string; score: number } {
  // Check calibration — was confidence aligned with outcome?
  const expectedConfidence = input.evidence.length === 0 ? 0.3 : Math.min(0.9, 0.3 + input.evidence.length * 0.1);
  const diff = Math.abs(input.confidence - expectedConfidence);
  if (diff > 0.3) {
    return {
      answer: `Confidence was ${input.confidence > expectedConfidence ? "too high" : "too low"} — expected ~${expectedConfidence.toFixed(1)}`,
      score: 0.4,
    };
  }
  if (input.outcome === "failure" && input.confidence > 0.7) {
    return { answer: "Confidence was too high given the failure outcome", score: 0.3 };
  }
  return { answer: "Confidence was appropriately calibrated", score: 0.85 };
}

function assessMemoryUpdate(input: { outcome?: string; evidence: EvidenceItem[] }): { answer: string; score: number } {
  if (input.outcome === "success" && input.evidence.length > 0) {
    return {
      answer: "Yes — this successful action should be recorded in episodic memory for future retrieval",
      score: 0.3, // low score = update recommended
    };
  }
  if (input.outcome === "failure") {
    return {
      answer: "Yes — record this failure to avoid repeating the same approach",
      score: 0.2,
    };
  }
  return { answer: "No update needed for this action", score: 0.8 };
}

function deriveLessons(input: { outcome?: string; modulesUsed: string[]; llmInvoked: boolean; estimatedCost: number; evidence: EvidenceItem[] }, reflections: Array<{ question: string; answer: string; score: number }>): string[] {
  const lessons: string[] = [];
  if (input.evidence.length < 3) {
    lessons.push("Gather more evidence before making recommendations");
  }
  if (input.estimatedCost > 0.05) {
    lessons.push("Look for cheaper alternatives — current cost is high");
  }
  if (input.modulesUsed.length > 8) {
    lessons.push("Reduce module count — too many modules add latency");
  }
  if (input.outcome === "failure") {
    lessons.push("This approach failed — try a different workflow next time");
  }
  const lowScoringReflections = reflections.filter(r => r.score < 0.5);
  for (const r of lowScoringReflections) {
    lessons.push(`Improve: ${r.question} — ${r.answer}`);
  }
  return lessons;
}

// ===========================================================================
// Meta-cognition (System 15) — self-assessment
// ===========================================================================

export function assessMetaCognition(history: ReflectionEntry[]): {
  issues: Array<{ kind: "overconfidence" | "repetition" | "looping" | "contradiction" | "tool_misuse" | "expensive_reasoning" | "low_value_ai_call"; severity: number; description: string; recommendation: string }>;
  selfScore: number;
  adjustmentRecommended: boolean;
  adjustments: string[];
} {
  const issues: Array<{ kind: "overconfidence" | "repetition" | "looping" | "contradiction" | "tool_misuse" | "expensive_reasoning" | "low_value_ai_call"; severity: number; description: string; recommendation: string }> = [];
  const adjustments: string[] = [];

  // Overconfidence: many reflections with low confidence-assessment scores
  const confidenceIssues = history.filter(r => r.reflections.find(rf => rf.question === "Was confidence too high?" && rf.score < 0.5));
  if (confidenceIssues.length > 3) {
    issues.push({
      kind: "overconfidence", severity: 0.7,
      description: `${confidenceIssues.length} recent reflections show overconfidence`,
      recommendation: "Lower confidence estimates for similar queries",
    });
    adjustments.push("Apply a 0.1 confidence penalty to similar queries");
  }

  // Repetition: same action type with same lessons
  const recentActionTypes = history.slice(0, 10).map(r => r.actionType);
  const actionCounts = new Map<string, number>();
  for (const a of recentActionTypes) actionCounts.set(a, (actionCounts.get(a) ?? 0) + 1);
  for (const [action, count] of actionCounts) {
    if (count > 3) {
      issues.push({
        kind: "repetition", severity: 0.5,
        description: `Action "${action}" repeated ${count} times recently`,
        recommendation: "Consider caching results for this action type",
      });
      adjustments.push(`Cache results for action type: ${action}`);
    }
  }

  // Low-value AI calls: many reflections with high cost but low usefulness
  // (approximated by low overall score)
  const lowValue = history.filter(r => r.overallScore < 0.4);
  if (lowValue.length > 2) {
    issues.push({
      kind: "low_value_ai_call", severity: 0.6,
      description: `${lowValue.length} recent actions had low overall value`,
      recommendation: "Skip AI calls for queries with insufficient evidence",
    });
    adjustments.push("Add an evidence-count threshold before invoking AI");
  }

  const selfScore = issues.length === 0 ? 0.9 : Math.max(0.2, 0.9 - issues.length * 0.15);
  const adjustmentRecommended = adjustments.length > 0;
  return { issues, selfScore, adjustmentRecommended, adjustments };
}
