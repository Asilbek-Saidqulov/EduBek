/**
 * EduBek — AI Curriculum Assistant.
 *
 * Phase 4F.5: Natural-language Q&A about curriculum coverage. Teachers
 * ask questions like:
 *
 *   "Do I fully cover Grade 8 Algebra?"
 *   "What's missing before Quadratic Equations?"
 *   "Generate lessons for missing standards."
 *
 * The assistant parses the question, queries the Knowledge Intelligence
 * layer (coverage, gaps, concepts, prerequisites), and returns a
 * structured answer with:
 *
 *   • Natural-language answer text
 *   • Evidence (standards / resources / concepts / gaps backing the answer)
 *   • Follow-up suggestions
 *   • Confidence score
 *
 * For Phase 4F.5 the answer generation is deterministic — a rule-based
 * natural language generator. A future phase can plug in an LLM via
 * the AI Workspace without changing the DTO shape.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { computeCoverage, listKnowledgeGaps } from "./coverage-analysis";
import { discoverPrerequisites } from "./prerequisite-discovery";
import type { CurriculumAnswerDto } from "./types";

const log = getLogger("ai-curriculum-assistant");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function answerCurriculumQuestion(input: {
  question: string;
  scopeType: "classroom" | "organization" | "framework";
  scopeId: string;
  frameworkId?: string;
  locale?: string;
}): Promise<CurriculumAnswerDto> {
  const { question, scopeType, scopeId, locale = "en" } = input;
  const lower = question.toLowerCase();

  // Parse the question into one of several intent patterns
  let answer: string;
  let answerKey: string;
  let evidence: CurriculumAnswerDto["evidence"] = [];
  const followUps: string[] = [];
  let confidence = 0.5;

  if (/(?:do i|do we|am i).*(?:cover|covering|fully cover)/.test(lower) ||
      /coverage/.test(lower)) {
    // Intent: coverage question
    ({ answer, answerKey, evidence, confidence } = await answerCoverageQuestion(input));
    followUps.push("What's missing before the next unit?");
    followUps.push("Show me uncovered standards");
    followUps.push("Which resources are duplicated?");
  } else if (/(?:missing|what's missing|what is missing|gap)/.test(lower)) {
    // Intent: gap question
    ({ answer, answerKey, evidence, confidence } = await answerGapQuestion(input));
    followUps.push("Generate lessons for missing standards");
    followUps.push("What prerequisites are missing?");
    followUps.push("Show me the coverage map");
  } else if (/(?:prerequisite|before)/.test(lower)) {
    // Intent: prerequisite question
    ({ answer, answerKey, evidence, confidence } = await answerPrerequisiteQuestion(input));
    followUps.push("What should I teach after this?");
    followUps.push("Show me resources for this prerequisite");
  } else if (/(?:generate|create|make).*(?:lesson|resource|material)/.test(lower)) {
    // Intent: generate request
    ({ answer, answerKey, evidence, confidence } = await answerGenerateRequest(input));
    followUps.push("Map these lessons to standards");
    followUps.push("Add practice problems");
  } else if (/(?:duplicate|similar|redundant)/.test(lower)) {
    // Intent: duplicates question
    ({ answer, answerKey, evidence, confidence } = await answerDuplicateQuestion(input));
    followUps.push("Which one should I keep?");
    followUps.push("Merge duplicates");
  } else {
    // Fallback
    answer = `I can help with: coverage questions, gap analysis, prerequisite discovery, lesson generation, and duplicate detection. Please ask about a specific aspect of your curriculum.`;
    answerKey = "knowledge.assistant.fallback";
    confidence = 0.3;
    followUps.push(
      "Do I fully cover Grade 8 Algebra?",
      "What's missing before Quadratic Equations?",
      "Are there any duplicate lessons?",
    );
  }

  log.info("assistant.answered", {
    question: question.slice(0, 100),
    answerKey,
    evidenceCount: evidence.length,
    confidence,
  });

  return {
    question,
    answer,
    evidence,
    followUps,
    confidence,
    answerKey,
    locale,
  };
}

// ---------------------------------------------------------------------------
// Intent handlers
// ---------------------------------------------------------------------------

async function answerCoverageQuestion(input: {
  scopeType: "classroom" | "organization" | "framework";
  scopeId: string;
  frameworkId?: string;
}): Promise<{ answer: string; answerKey: string; evidence: CurriculumAnswerDto["evidence"]; confidence: number }> {
  if (!input.frameworkId) {
    return {
      answer: "Please specify a curriculum framework to analyze coverage against.",
      answerKey: "knowledge.assistant.noFramework",
      evidence: [],
      confidence: 0.4,
    };
  }

  const coverage = await computeCoverage({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    frameworkId: input.frameworkId,
  });

  const pct = Math.round(coverage.coveragePct);
  const isFullyCovered = pct >= 90;

  const answer = isFullyCovered
    ? `You cover ${pct}% of the standards in this framework — excellent coverage! ${coverage.uncoveredStandards} standard${coverage.uncoveredStandards === 1 ? "" : "s"} remain${coverage.uncoveredStandards === 1 ? "" : "s"} uncovered.`
    : `You cover ${pct}% of the standards in this framework. ${coverage.uncoveredStandards} standards are still uncovered. Consider generating lessons for the missing areas.`;

  // Fetch the uncovered standards for evidence
  const uncoveredStandards = await db.curriculumStandard.findMany({
    where: { id: { in: coverage.details.uncoveredStandardIds.slice(0, 5) } },
    select: { id: true, code: true, title: true },
  });

  const evidence: CurriculumAnswerDto["evidence"] = uncoveredStandards.map((s) => ({
    type: "standard" as const,
    id: s.id,
    title: `${s.code}: ${s.title}`,
    relevance: 1.0,
  }));

  return {
    answer,
    answerKey: isFullyCovered ? "knowledge.assistant.coverageFull" : "knowledge.assistant.coveragePartial",
    evidence,
    confidence: 0.85,
  };
}

async function answerGapQuestion(input: {
  scopeType: "classroom" | "organization" | "framework";
  scopeId: string;
}): Promise<{ answer: string; answerKey: string; evidence: CurriculumAnswerDto["evidence"]; confidence: number }> {
  const gaps = await listKnowledgeGaps({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    status: "open",
    limit: 10,
  });

  if (gaps.length === 0) {
    return {
      answer: "No knowledge gaps detected — your curriculum coverage is comprehensive.",
      answerKey: "knowledge.assistant.noGaps",
      evidence: [],
      confidence: 0.85,
    };
  }

  const uncoveredCount = gaps.filter((g) => g.type === "uncovered_standard").length;
  const answer = `I found ${gaps.length} knowledge gap${gaps.length === 1 ? "" : "s"}: ${uncoveredCount} uncovered standard${uncoveredCount === 1 ? "" : "s"}, plus ${gaps.length - uncoveredCount} other gap${gaps.length - uncoveredCount === 1 ? "" : "s"}. The most urgent gap is: "${gaps[0]!.description}"`;

  const evidence: CurriculumAnswerDto["evidence"] = gaps.slice(0, 5).map((g) => ({
    type: "gap" as const,
    id: g.id,
    title: g.description,
    relevance: 0.9,
  }));

  return {
    answer,
    answerKey: "knowledge.assistant.gapsFound",
    evidence,
    confidence: 0.8,
  };
}

async function answerPrerequisiteQuestion(input: {
  question: string;
  scopeType: "classroom" | "organization" | "framework";
  scopeId: string;
}): Promise<{ answer: string; answerKey: string; evidence: CurriculumAnswerDto["evidence"]; confidence: number }> {
  // Try to find a concept mentioned in the question
  const conceptMatch = await findConceptInQuestion(input.question);
  if (!conceptMatch) {
    return {
      answer: "Which concept would you like me to check prerequisites for? Please mention a specific topic (e.g. 'quadratic equations').",
      answerKey: "knowledge.assistant.noConceptMentioned",
      evidence: [],
      confidence: 0.4,
    };
  }

  const prerequisites = await discoverPrerequisites(conceptMatch.id, 5);
  if (prerequisites.length === 0) {
    return {
      answer: `No prerequisites discovered for "${conceptMatch.name}" yet. As more resources are analyzed, prerequisites will be auto-discovered.`,
      answerKey: "knowledge.assistant.noPrerequisites",
      evidence: [{
        type: "concept" as const,
        id: conceptMatch.id,
        title: conceptMatch.name,
        relevance: 1.0,
      }],
      confidence: 0.6,
    };
  }

  const prerecIds = prerequisites.filter((p) => p.type === "prerequisite").map((p) => p.fromConceptId);
  const prerecConcepts = await db.concept.findMany({
    where: { id: { in: prerecIds } },
    select: { id: true, name: true },
  });

  const prerecNames = prerecConcepts.map((c) => c.name);
  const answer = `Before studying "${conceptMatch.name}", students should master: ${prerecNames.join(", ")}. These prerequisites were auto-discovered from ${prerequisites.length} relationship${prerequisites.length === 1 ? "" : "s"} in the Knowledge Graph.`;

  const evidence: CurriculumAnswerDto["evidence"] = prerecConcepts.map((c) => ({
    type: "concept" as const,
    id: c.id,
    title: c.name,
    relevance: 0.85,
  }));

  return {
    answer,
    answerKey: "knowledge.assistant.prerequisitesFound",
    evidence,
    confidence: 0.75,
  };
}

async function answerGenerateRequest(input: {
  question: string;
  scopeType: "classroom" | "organization" | "framework";
  scopeId: string;
}): Promise<{ answer: string; answerKey: string; evidence: CurriculumAnswerDto["evidence"]; confidence: number }> {
  const gaps = await listKnowledgeGaps({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    status: "open",
    type: "uncovered_standard",
    limit: 5,
  });

  if (gaps.length === 0) {
    return {
      answer: "All standards are covered — no new lessons needed. Consider generating enrichment material for advanced students instead.",
      answerKey: "knowledge.assistant.noGenerateNeeded",
      evidence: [],
      confidence: 0.85,
    };
  }

  const answer = `I can generate ${gaps.length} lesson${gaps.length === 1 ? "" : "s"} for the uncovered standards. The first lesson would cover: "${gaps[0]!.description}". Use the AI Workspace to create the actual lesson content — I've identified the standards to target.`;

  const evidence: CurriculumAnswerDto["evidence"] = gaps.map((g) => ({
    type: "gap" as const,
    id: g.id,
    title: g.description,
    relevance: 1.0,
  }));

  return {
    answer,
    answerKey: "knowledge.assistant.generateReady",
    evidence,
    confidence: 0.7,
  };
}

async function answerDuplicateQuestion(input: {
  scopeType: "classroom" | "organization" | "framework";
  scopeId: string;
}): Promise<{ answer: string; answerKey: string; evidence: CurriculumAnswerDto["evidence"]; confidence: number }> {
  const gaps = await listKnowledgeGaps({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    status: "open",
    type: "duplicate_lesson",
    limit: 10,
  });

  if (gaps.length === 0) {
    return {
      answer: "No duplicate lessons detected — your content is well-differentiated.",
      answerKey: "knowledge.assistant.noDuplicates",
      evidence: [],
      confidence: 0.85,
    };
  }

  const answer = `I found ${gaps.length} duplicate lesson${gaps.length === 1 ? "" : "s"}. Consider merging or removing redundant content to reduce learner confusion.`;

  const evidence: CurriculumAnswerDto["evidence"] = gaps.slice(0, 5).map((g) => ({
    type: "gap" as const,
    id: g.id,
    title: g.description,
    relevance: 0.8,
  }));

  return {
    answer,
    answerKey: "knowledge.assistant.duplicatesFound",
    evidence,
    confidence: 0.8,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function findConceptInQuestion(question: string): Promise<{ id: string; name: string } | null> {
  const lower = question.toLowerCase();
  // Search concepts by name
  const concepts = await db.concept.findMany({
    where: {
      OR: [
        { name: { contains: lower.split(/\s+/).find((w) => w.length > 4) ?? "" } },
      ],
    },
    take: 1,
    select: { id: true, name: true },
  }).catch(() => []);

  if (concepts.length > 0) return concepts[0]!;

  // Try aliases
  const aliasMatch = await db.conceptAlias.findFirst({
    where: { alias: { contains: lower.split(/\s+/).find((w) => w.length > 4) ?? "" } },
    include: { concept: { select: { id: true, name: true } } },
  }).catch(() => null);

  return aliasMatch?.concept ?? null;
}
