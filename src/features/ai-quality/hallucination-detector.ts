/**
 * EduBek — Hallucination Detector (System 3).
 *
 * Detects unsupported claims, invented facts, invented citations,
 * contradictions, missing evidence, and unsupported statistics.
 * Classifies by severity: low, medium, high, critical.
 *
 * Deterministic — never invokes an LLM. Only produces findings, never
 * automatically rejects responses.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  HallucinationReport, HallucinationFinding, HallucinationKind,
  HallucinationSeverity,
} from "./types";

const log = getLogger("hallucination-detector");

// ===========================================================================
// Public API
// ===========================================================================

export async function detectHallucinations(input: {
  aiOutput: string;
  evidence?: string[];
  expectedAnswer?: string;
  evaluationId?: string | null;
}): Promise<HallucinationReport> {
  const { aiOutput, evidence = [], expectedAnswer, evaluationId = null } = input;
  const findings: HallucinationFinding[] = [];

  // 1. Detect unsupported claims (claims not grounded in evidence)
  findings.push(...detectUnsupportedClaims(aiOutput, evidence));

  // 2. Detect invented facts (numbers, dates, names not in evidence)
  findings.push(...detectInventedFacts(aiOutput, evidence, expectedAnswer));

  // 3. Detect invented citations (fake-looking references)
  findings.push(...detectInventedCitations(aiOutput));

  // 4. Detect contradictions (conflicting statements within the output)
  findings.push(...detectContradictions(aiOutput));

  // 5. Detect missing evidence (output makes claims without any evidence)
  findings.push(...detectMissingEvidence(aiOutput, evidence));

  // 6. Detect unsupported statistics (numbers without sources)
  findings.push(...detectUnsupportedStatistics(aiOutput, evidence));

  // Persist findings
  for (const f of findings) {
    await repo.createHallucination({
      evaluationId, kind: f.kind, severity: f.severity,
      description: f.description, flaggedText: f.flaggedText,
      rationale: f.rationale, suggestedCorrection: f.suggestedCorrection,
    }).catch(() => { /* best-effort */ });
  }

  const severityCounts = countBySeverity(findings);
  const wordCount = aiOutput.split(/\s+/).length;
  const hallucinationRate = wordCount > 0 ? findings.length / (wordCount / 1000) : 0;
  const riskLevel = determineRiskLevel(findings);
  const recommendation = generateRecommendation(findings, riskLevel);

  log.info("hallucination.detect_complete", {
    findings: findings.length, riskLevel, rate: hallucinationRate,
  });

  return {
    generatedAt: new Date().toISOString(),
    findings,
    totalCount: findings.length,
    severityCounts,
    hallucinationRate: Math.round(hallucinationRate * 100) / 100,
    riskLevel,
    recommendation,
  };
}

// ===========================================================================
// Detectors — all deterministic
// ===========================================================================

function detectUnsupportedClaims(output: string, evidence: string[]): HallucinationFinding[] {
  const findings: HallucinationFinding[] = [];
  if (evidence.length === 0) return findings;
  // Check for claims that use hedging language without evidence backing
  const claimPatterns = [
    /(?:studies show|research indicates|experts say|it is known that)\s+([^.]+)/gi,
    /(?:according to|based on)\s+([^.]+)/gi,
  ];
  const evidenceLower = evidence.join(" ").toLowerCase();
  for (const pattern of claimPatterns) {
    const matches = output.matchAll(pattern);
    for (const m of matches) {
      const claim = m[1]?.trim() ?? "";
      const claimWords = claim.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const supported = claimWords.some(w => evidenceLower.includes(w));
      if (!supported && claim.length > 10) {
        findings.push({
          id: randomUUID(),
          kind: "unsupported_claim",
          severity: "medium",
          description: `Claim "${claim.slice(0, 80)}..." is not supported by provided evidence.`,
          flaggedText: m[0],
          rationale: "The claim uses authoritative language but the content is not found in the provided evidence.",
          suggestedCorrection: "Add a citation or remove the claim if no evidence supports it.",
        });
      }
    }
  }
  return findings;
}

function detectInventedFacts(output: string, evidence: string[], expectedAnswer?: string): HallucinationFinding[] {
  const findings: HallucinationFinding[] = [];
  // Detect specific numbers that don't appear in evidence or expected answer
  const numberPattern = /\b(\d{4})\b/g; // years
  const evidenceText = (evidence.join(" ") + " " + (expectedAnswer ?? "")).toLowerCase();
  const matches = output.matchAll(numberPattern);
  for (const m of matches) {
    const year = m[1];
    if (!evidenceText.includes(year)) {
      findings.push({
        id: randomUUID(),
        kind: "invented_fact",
        severity: "high",
        description: `Year "${year}" is not mentioned in the evidence or expected answer.`,
        flaggedText: year,
        rationale: "Specific dates/years that don't appear in source material may be invented.",
        suggestedCorrection: `Verify the year "${year}" against a reliable source.`,
      });
    }
  }
  // Detect percentages not in evidence
  const percentPattern = /(\d+(?:\.\d+)?)\s*%/g;
  for (const m of output.matchAll(percentPattern)) {
    const pct = m[1];
    if (!evidenceText.includes(pct)) {
      findings.push({
        id: randomUUID(),
        kind: "invented_fact",
        severity: "medium",
        description: `Percentage "${pct}%" is not found in the evidence.`,
        flaggedText: m[0],
        rationale: "Statistics that don't appear in source material may be invented.",
        suggestedCorrection: `Verify the percentage "${pct}%" or remove it.`,
      });
    }
  }
  return findings;
}

function detectInventedCitations(output: string): HallucinationFinding[] {
  const findings: HallucinationFinding[] = [];
  // Detect citation patterns that look fake
  const citationPatterns = [
    /(?:Smith|Jones|Brown|Wilson|Taylor)\s+et\s+al\.?\s*\((\d{4})\)/gi, // common fake author names
    /(?:et al\.?|cf\.|op\. cit\.)\s*\((\d{4})\)/gi,
  ];
  for (const pattern of citationPatterns) {
    const matches = output.matchAll(pattern);
    for (const m of matches) {
      findings.push({
        id: randomUUID(),
        kind: "invented_citation",
        severity: "high",
        description: `Citation "${m[0]}" may be fabricated — common fake citation pattern.`,
        flaggedText: m[0],
        rationale: "Citations with generic author names and no title/journal may be invented by the AI.",
        suggestedCorrection: "Verify the citation exists, or remove it if fabricated.",
      });
    }
  }
  return findings;
}

function detectContradictions(output: string): HallucinationFinding[] {
  const findings: HallucinationFinding[] = [];
  // Detect simple contradictions: "X is true" ... "X is not true"
  const sentences = output.split(/[.!?]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 10);
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      const a = sentences[i];
      const b = sentences[j];
      // Check if one sentence negates the other
      if (a.includes(" not ") && b.includes(a.replace(" not ", " "))) {
        findings.push({
          id: randomUUID(),
          kind: "contradiction",
          severity: "high",
          description: `Contradiction detected between: "${a.slice(0, 60)}..." and "${b.slice(0, 60)}..."`,
          flaggedText: `${a} / ${b}`,
          rationale: "The output contradicts itself — one statement negates the other.",
          suggestedCorrection: "Resolve the contradiction by clarifying which statement is correct.",
        });
      }
    }
  }
  return findings;
}

function detectMissingEvidence(output: string, evidence: string[]): HallucinationFinding[] {
  const findings: HallucinationFinding[] = [];
  // If the output makes factual claims but no evidence is provided
  if (evidence.length === 0 && output.length > 50) {
    const hasClaims = /(?:is|are|was|were|has|have|had)\s+/i.test(output);
    if (hasClaims) {
      findings.push({
        id: randomUUID(),
        kind: "missing_evidence",
        severity: "low",
        description: "The output makes factual claims but no evidence was provided for verification.",
        flaggedText: output.slice(0, 100),
        rationale: "Without evidence, factual claims cannot be verified for accuracy.",
        suggestedCorrection: "Provide evidence to support factual claims, or mark them as opinions.",
      });
    }
  }
  return findings;
}

function detectUnsupportedStatistics(output: string, evidence: string[]): HallucinationFinding[] {
  const findings: HallucinationFinding[] = [];
  // Detect statistics (numbers with context words) without evidence
  const statPattern = /(\d+(?:,\d{3})*(?:\.\d+)?)\s+(?:people|students|users|percent|cases|deaths|instances)/gi;
  const evidenceLower = evidence.join(" ").toLowerCase();
  for (const m of output.matchAll(statPattern)) {
    const num = m[1].replace(/[,.]/g, "");
    if (!evidenceLower.includes(m[1])) {
      findings.push({
        id: randomUUID(),
        kind: "unsupported_statistic",
        severity: "medium",
        description: `Statistic "${m[0]}" is not found in the provided evidence.`,
        flaggedText: m[0],
        rationale: "Statistics without source attribution may be fabricated.",
        suggestedCorrection: `Cite the source for "${m[0]}" or remove it.`,
      });
    }
  }
  return findings;
}

// ===========================================================================
// Helpers
// ===========================================================================

function countBySeverity(findings: HallucinationFinding[]): Record<HallucinationSeverity, number> {
  const counts: Record<HallucinationSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const f of findings) counts[f.severity]++;
  return counts;
}

function determineRiskLevel(findings: HallucinationFinding[]): "low" | "medium" | "high" | "critical" {
  if (findings.some(f => f.severity === "critical")) return "critical";
  if (findings.filter(f => f.severity === "high").length >= 2) return "high";
  if (findings.some(f => f.severity === "high")) return "medium";
  if (findings.length > 3) return "medium";
  return "low";
}

function generateRecommendation(findings: HallucinationFinding[], riskLevel: "low" | "medium" | "high" | "critical"): string {
  if (riskLevel === "critical") {
    return "Critical hallucination risk — do not deliver without human review.";
  }
  if (riskLevel === "high") {
    return "High hallucination risk — review flagged claims before delivering to users.";
  }
  if (riskLevel === "medium") {
    return "Moderate hallucination risk — verify flagged claims when possible.";
  }
  return "Low hallucination risk — output appears well-grounded.";
}
