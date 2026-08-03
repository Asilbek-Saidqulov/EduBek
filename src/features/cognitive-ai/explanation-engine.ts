/**
 * EduBek — Explanation Engine (System 12).
 *
 * Every AI response includes structured reasoning metadata:
 *   • reasoning (natural language)
 *   • confidence
 *   • evidence
 *   • modules_used
 *   • goals_supported
 *   • cost
 *   • estimated_time_saved
 *   • alternative_options
 *   • why_this_choice
 *
 * No black box. Deterministic — no LLM call.
 */
import { getLogger } from "@/lib/logger";
import type {
  Explanation, EvidenceItem, CognitiveGoal, DecisionResult,
} from "./types";

const log = getLogger("cognitive-explanation-engine");

// ===========================================================================
// Public API
// ===========================================================================

export function buildExplanation(input: {
  reasoning: string;
  confidence: number;
  evidence: EvidenceItem[];
  modulesUsed: string[];
  goalsSupported: CognitiveGoal[];
  estimatedCost: number;
  estimatedTimeSavedMinutes: number;
  decision?: DecisionResult | null;
  alternatives?: Array<{ label: string; whyRejected: string }>;
}): Explanation {
  const whyThisChoice = computeWhyThisChoice(input);
  const alternativeOptions = input.alternatives ?? (input.decision ? input.decision.options
    .filter(o => o.id !== input.decision!.chosenOptionId)
    .slice(0, 3)
    .map(o => ({
      label: o.label,
      whyRejected: `Scored ${o.overallScore}/100 vs. chosen option's ${input.decision!.options.find(x => x.id === input.decision!.chosenOptionId)?.overallScore ?? 0}/100`,
    })) : []);
  log.debug("explanation.built", {
    confidence: input.confidence, evidence: input.evidence.length,
    modules: input.modulesUsed.length, alternatives: alternativeOptions.length,
  });
  return {
    reasoning: input.reasoning,
    confidence: input.confidence,
    evidence: input.evidence,
    modulesUsed: input.modulesUsed,
    goalsSupported: input.goalsSupported.map(g => g.title),
    cost: input.estimatedCost,
    estimatedTimeSavedMinutes: input.estimatedTimeSavedMinutes,
    alternativeOptions,
    whyThisChoice,
  };
}

export function summarizeExplanation(explanation: Explanation): string {
  const parts: string[] = [];
  parts.push(explanation.reasoning);
  parts.push(`Confidence: ${(explanation.confidence * 100).toFixed(0)}%`);
  if (explanation.evidence.length > 0) {
    parts.push(`Evidence: ${explanation.evidence.length} item(s) from ${new Set(explanation.evidence.map(e => e.source)).size} source(s)`);
  }
  parts.push(`Modules used: ${explanation.modulesUsed.join(", ")}`);
  if (explanation.goalsSupported.length > 0) {
    parts.push(`Supports goals: ${explanation.goalsSupported.join(", ")}`);
  }
  if (explanation.cost > 0) {
    parts.push(`Cost: $${explanation.cost.toFixed(4)}`);
  }
  if (explanation.estimatedTimeSavedMinutes > 0) {
    parts.push(`Estimated time saved: ${explanation.estimatedTimeSavedMinutes} min`);
  }
  if (explanation.alternativeOptions.length > 0) {
    parts.push(`Alternatives considered: ${explanation.alternativeOptions.map(a => a.label).join(", ")}`);
  }
  parts.push(`Why this choice: ${explanation.whyThisChoice}`);
  return parts.join(". ");
}

// ===========================================================================
// Helpers
// ===========================================================================

function computeWhyThisChoice(input: {
  confidence: number;
  evidence: EvidenceItem[];
  modulesUsed: string[];
  goalsSupported: CognitiveGoal[];
  decision?: DecisionResult | null;
}): string {
  const reasons: string[] = [];
  if (input.decision) {
    const chosen = input.decision.options.find(o => o.id === input.decision!.chosenOptionId);
    if (chosen) {
      reasons.push(`"${chosen.label}" had the highest weighted score (${chosen.overallScore}/100)`);
    }
  }
  if (input.evidence.length >= 3) {
    reasons.push(`${input.evidence.length} pieces of evidence support this answer`);
  }
  if (input.goalsSupported.length > 0) {
    reasons.push(`aligns with ${input.goalsSupported.length} active goal(s)`);
  }
  if (input.confidence > 0.7) {
    reasons.push("evidence quality is high");
  }
  if (reasons.length === 0) {
    return "This was the best available option given the current context";
  }
  return reasons.join(", ");
}
