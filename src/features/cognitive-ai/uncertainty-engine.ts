/**
 * EduBek — Uncertainty Engine (System 8).
 *
 * Every AI answer estimates uncertainty. We never hallucinate certainty.
 * Tracks missing data, conflicting evidence, weak confidence, stale
 * information, insufficient history, and unknown curriculum.
 *
 * Deterministic — no LLM call. Confidence is computed from evidence
 * quality, evidence count, source diversity, and retrieval quality.
 */
import { getLogger } from "@/lib/logger";
import type {
  UncertaintyEstimate, UncertaintyKind, EvidenceItem,
} from "./types";

const log = getLogger("cognitive-uncertainty-engine");

// ===========================================================================
// Public API
// ===========================================================================

export function estimateUncertainty(input: {
  evidence: EvidenceItem[];
  sourcesQueried: number;
  sourcesWithResults: number;
  retrievalQuality: number;
  hasLLMOutput: boolean;
  contextMissing?: string[];
}): UncertaintyEstimate {
  const reasons: UncertaintyEstimate["reasons"] = [];
  const missingInformation: string[] = [];
  const suggestedNextQuestions: string[] = [];

  // 1. Insufficient evidence
  if (input.evidence.length < 3) {
    reasons.push({
      kind: "missing_data",
      description: `Only ${input.evidence.length} evidence item(s) found — recommend gathering more data`,
      severity: 0.7,
    });
    missingInformation.push("More evidence from diverse sources");
  }

  // 2. Conflicting evidence (evidence with contradicting relations reduces confidence)
  // We approximate by checking if confidence variance is high
  if (input.evidence.length > 1) {
    const confidences = input.evidence.map(e => e.confidence);
    const mean = confidences.reduce((s, c) => s + c, 0) / confidences.length;
    const variance = confidences.reduce((s, c) => s + (c - mean) ** 2, 0) / confidences.length;
    if (variance > 0.1) {
      reasons.push({
        kind: "conflicting_evidence",
        description: "Evidence has high confidence variance — sources disagree",
        severity: Math.min(1, variance * 2),
      });
      suggestedNextQuestions.push("Which source is most authoritative for this topic?");
    }
  }

  // 3. Low retrieval quality
  if (input.retrievalQuality < 0.5) {
    reasons.push({
      kind: "low_retrieval_quality",
      description: `Retrieval quality is ${(input.retrievalQuality * 100).toFixed(0)}% — results may not be relevant`,
      severity: 0.6,
    });
    missingInformation.push("Better-targeted search query");
    suggestedNextQuestions.push("Can you rephrase your question with more specific terms?");
  }

  // 4. Source diversity
  const uniqueSources = new Set(input.evidence.map(e => e.source));
  if (uniqueSources.size < 2 && input.evidence.length > 0) {
    reasons.push({
      kind: "weak_confidence",
      description: "All evidence comes from a single source — consider cross-referencing",
      severity: 0.5,
    });
    suggestedNextQuestions.push("Are there other perspectives on this topic?");
  }

  // 5. Stale information (evidence older than 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const staleCount = input.evidence.filter(e => new Date(e.timestamp).getTime() < thirtyDaysAgo).length;
  if (staleCount > 0 && input.evidence.length > 0) {
    reasons.push({
      kind: "stale_information",
      description: `${staleCount} of ${input.evidence.length} evidence item(s) are older than 30 days`,
      severity: 0.4,
    });
    missingInformation.push("Current data to verify the older findings");
  }

  // 6. Missing sources
  if (input.sourcesWithResults < input.sourcesQueried * 0.5) {
    reasons.push({
      kind: "insufficient_history",
      description: `Only ${input.sourcesWithResults} of ${input.sourcesQueried} queried sources returned results`,
      severity: 0.5,
    });
    missingInformation.push("Data from sources that returned no results");
  }

  // 7. Ambiguous intent (no LLM output and low evidence)
  if (!input.hasLLMOutput && input.evidence.length === 0) {
    reasons.push({
      kind: "ambiguous_intent",
      description: "No evidence found and no LLM reasoning applied — intent may be ambiguous",
      severity: 0.8,
    });
    suggestedNextQuestions.push("Could you clarify what you're trying to accomplish?");
  }

  // Context-missing reasons
  if (input.contextMissing) {
    for (const m of input.contextMissing) {
      missingInformation.push(m);
    }
  }

  // Compute overall confidence
  let confidence = 0.9; // start optimistic
  for (const r of reasons) {
    confidence -= r.severity * 0.15;
  }
  // Boost confidence if we have lots of high-quality evidence
  if (input.evidence.length >= 5 && input.retrievalQuality > 0.7) {
    confidence += 0.1;
  }
  confidence = Math.max(0.05, Math.min(0.95, confidence));

  if (suggestedNextQuestions.length === 0) {
    suggestedNextQuestions.push("Is there anything else you'd like to explore?");
  }

  log.debug("uncertainty.estimated", { confidence, reasons: reasons.length });
  return {
    confidence: Math.round(confidence * 100) / 100,
    reasons,
    missingInformation,
    suggestedNextQuestions,
  };
}

export function explainUncertainty(estimate: UncertaintyEstimate): string {
  if (estimate.confidence > 0.8) {
    return `High confidence (${(estimate.confidence * 100).toFixed(0)}%) — evidence is strong and consistent.`;
  }
  if (estimate.confidence > 0.5) {
    return `Moderate confidence (${(estimate.confidence * 100).toFixed(0)}%) — some uncertainty due to: ${estimate.reasons.map(r => r.description).join("; ")}`;
  }
  return `Low confidence (${(estimate.confidence * 100).toFixed(0)}%) — significant uncertainty. Missing: ${estimate.missingInformation.join(", ")}`;
}

export const UNCERTAINTY_KINDS: UncertaintyKind[] = [
  "missing_data", "conflicting_evidence", "weak_confidence",
  "stale_information", "insufficient_history", "unknown_curriculum",
  "ambiguous_intent", "low_retrieval_quality",
];
