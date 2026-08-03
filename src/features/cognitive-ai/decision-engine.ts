/**
 * EduBek — Decision Engine (System 7).
 *
 * Before executing, the AI evaluates multiple possible solutions.
 * Example: "Need homework" → generate, marketplace, reuse previous,
 * adapt existing, teacher upload. Score each option by quality, cost,
 * teacher workload, student impact, and curriculum fit. Pick the best.
 *
 * Deterministic — no LLM call. Scoring is rule-based.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { DecisionOption, DecisionResult } from "./types";

const log = getLogger("cognitive-decision-engine");

// ===========================================================================
// Decision templates — known decision scenarios
// ===========================================================================

interface DecisionTemplate {
  id: string;
  title: string;
  generateOptions: () => DecisionOption[];
}

export const DECISION_TEMPLATES: DecisionTemplate[] = [
  {
    id: "homework_source",
    title: "How to source homework for a topic",
    generateOptions: () => [
      makeOption("generate", "Generate homework with AI", "ai-workspace", "Use AI to generate new homework questions", {
        quality: 75, cost: 80, teacherWorkload: 90, studentImpact: 70, curriculumFit: 80,
      }, 0.02, 5, ["AI-generated content may need review"]),
      makeOption("marketplace", "Buy from marketplace", "marketplace", "Purchase a homework pack from the marketplace", {
        quality: 80, cost: 50, teacherWorkload: 95, studentImpact: 75, curriculumFit: 70,
      }, 5, 2, ["Cost may add up over time", "Curriculum fit may vary"]),
      makeOption("reuse", "Reuse previous homework", "discovery", "Re-use a homework assignment from a previous semester", {
        quality: 70, cost: 100, teacherWorkload: 95, studentImpact: 60, curriculumFit: 85,
      }, 0, 1, ["Students who've seen it before won't benefit"]),
      makeOption("adapt", "Adapt existing homework", "ai-workspace", "Take an existing assignment and adapt it for current students", {
        quality: 78, cost: 85, teacherWorkload: 80, studentImpact: 75, curriculumFit: 85,
      }, 0.01, 4, ["Requires an existing assignment to adapt"]),
      makeOption("upload", "Teacher uploads homework", "resource", "Teacher creates and uploads the homework manually", {
        quality: 90, cost: 100, teacherWorkload: 20, studentImpact: 85, curriculumFit: 95,
      }, 0, 30, ["High teacher workload", "Time-consuming"]),
    ],
  },
  {
    id: "lesson_source",
    title: "How to source a lesson",
    generateOptions: () => [
      makeOption("generate", "Generate lesson with AI", "ai-workspace", "Use AI to generate a full lesson plan", {
        quality: 75, cost: 80, teacherWorkload: 90, studentImpact: 70, curriculumFit: 75,
      }, 0.02, 10, ["AI lessons may need pedagogical review"]),
      makeOption("marketplace", "Buy lesson from marketplace", "marketplace", "Purchase a vetted lesson from the marketplace", {
        quality: 85, cost: 50, teacherWorkload: 95, studentImpact: 80, curriculumFit: 75,
      }, 3, 2, ["May not perfectly match your curriculum"]),
      makeOption("reuse", "Reuse previous lesson", "discovery", "Re-use a lesson from a previous semester", {
        quality: 75, cost: 100, teacherWorkload: 95, studentImpact: 65, curriculumFit: 85,
      }, 0, 1, ["Content may be outdated"]),
      makeOption("collaborate", "Co-create with colleagues", "collaboration", "Collaborate with other teachers to create the lesson", {
        quality: 88, cost: 90, teacherWorkload: 50, studentImpact: 85, curriculumFit: 90,
      }, 0, 20, ["Requires coordination time"]),
      makeOption("upload", "Teacher creates lesson", "resource", "Teacher creates the lesson from scratch", {
        quality: 95, cost: 100, teacherWorkload: 15, studentImpact: 90, curriculumFit: 98,
      }, 0, 60, ["Very high teacher workload"]),
    ],
  },
  {
    id: "intervention_strategy",
    title: "How to intervene with at-risk student",
    generateOptions: () => [
      makeOption("mentorship", "Schedule 1:1 mentorship", "education-os", "Pair the student with a mentor for weekly sessions", {
        quality: 90, cost: 90, teacherWorkload: 50, studentImpact: 95, curriculumFit: 80,
      }, 0, 30, ["Requires mentor availability"]),
      makeOption("remediation", "Generate remediation plan", "learning-planner", "Use AI to generate a personalized remediation plan", {
        quality: 80, cost: 80, teacherWorkload: 85, studentImpact: 85, curriculumFit: 90,
      }, 0.01, 10, ["Student must be willing to follow the plan"]),
      makeOption("peer", "Peer tutoring", "collaboration", "Pair the student with a peer who has mastered the topic", {
        quality: 75, cost: 100, teacherWorkload: 90, studentImpact: 80, curriculumFit: 75,
      }, 0, 5, ["Requires a willing peer tutor"]),
      makeOption("resources", "Recommend additional resources", "discovery", "Suggest extra learning resources for self-study", {
        quality: 60, cost: 100, teacherWorkload: 95, studentImpact: 55, curriculumFit: 70,
      }, 0, 2, ["Self-study may not be enough for struggling students"]),
      makeOption("assessment", "Diagnostic assessment", "assessment-platform", "Run a diagnostic assessment to identify exact gaps", {
        quality: 85, cost: 95, teacherWorkload: 80, studentImpact: 75, curriculumFit: 85,
      }, 0, 15, ["Doesn't directly fix the problem — just diagnoses"]),
    ],
  },
];

// ===========================================================================
// Public API
// ===========================================================================

export async function evaluateDecision(input: {
  templateId: string;
  weights?: { quality?: number; cost?: number; teacherWorkload?: number; studentImpact?: number; curriculumFit?: number };
  userId?: string | null;
  organizationId?: string | null;
}): Promise<DecisionResult> {
  const template = DECISION_TEMPLATES.find(t => t.id === input.templateId);
  if (!template) throw new Error(`Unknown decision template: ${input.templateId}`);
  const options = template.generateOptions();
  const weights = {
    quality: input.weights?.quality ?? 0.25,
    cost: input.weights?.cost ?? 0.15,
    teacherWorkload: input.weights?.teacherWorkload ?? 0.2,
    studentImpact: input.weights?.studentImpact ?? 0.2,
    curriculumFit: input.weights?.curriculumFit ?? 0.2,
  };
  // Normalize weights
  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
  const normalized = {
    quality: weights.quality / totalWeight,
    cost: weights.cost / totalWeight,
    teacherWorkload: weights.teacherWorkload / totalWeight,
    studentImpact: weights.studentImpact / totalWeight,
    curriculumFit: weights.curriculumFit / totalWeight,
  };
  // Score each option
  for (const opt of options) {
    opt.overallScore = Math.round(
      opt.scores.quality * normalized.quality +
      opt.scores.cost * normalized.cost +
      opt.scores.teacherWorkload * normalized.teacherWorkload +
      opt.scores.studentImpact * normalized.studentImpact +
      opt.scores.curriculumFit * normalized.curriculumFit,
    );
  }
  options.sort((a, b) => b.overallScore - a.overallScore);
  const chosen = options[0];
  const rationale = `"${chosen.label}" scored highest (${chosen.overallScore}/100) based on weighted criteria: quality ${normalized.quality.toFixed(2)}, cost ${normalized.cost.toFixed(2)}, teacher workload ${normalized.teacherWorkload.toFixed(2)}, student impact ${normalized.studentImpact.toFixed(2)}, curriculum fit ${normalized.curriculumFit.toFixed(2)}.`;
  const confidence = options.length > 1
    ? Math.min(0.95, (chosen.overallScore - options[1].overallScore) / 100 + 0.5)
    : 0.7;

  // Persist the decision
  await repo.createDecision({
    title: template.title, options, chosenOptionId: chosen.id,
    rationale, confidence, userId: input.userId ?? null,
    organizationId: input.organizationId ?? null,
  });
  log.info("decision.evaluated", { templateId: input.templateId, chosen: chosen.id, confidence });
  return { options, chosenOptionId: chosen.id, rationale, confidence };
}

export function listDecisionTemplates(): Array<{ id: string; title: string }> {
  return DECISION_TEMPLATES.map(t => ({ id: t.id, title: t.title }));
}

export function getDecisionTemplate(id: string): DecisionTemplate | null {
  return DECISION_TEMPLATES.find(t => t.id === id) ?? null;
}

export async function listDecisions(limit = 20) {
  const rows = await repo.listDecisions(limit);
  return rows.map(r => ({
    id: r.id, title: r.title, options: repo.safeParse(r.options, []),
    chosenOptionId: r.chosenOptionId, rationale: r.rationale,
    confidence: r.confidence, createdAt: r.createdAt.toISOString(),
  }));
}

// ===========================================================================
// Helpers
// ===========================================================================

function makeOption(id: string, label: string, module: string, description: string, scores: DecisionOption["scores"], estimatedCost: number, estimatedDuration: number, risks: string[]): DecisionOption {
  return {
    id, label, module, description, scores, overallScore: 0,
    estimatedCost, estimatedDuration, risks,
  };
}
