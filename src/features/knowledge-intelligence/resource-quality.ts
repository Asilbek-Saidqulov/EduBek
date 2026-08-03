/**
 * EduBek — Intelligent Resource Quality Analysis.
 *
 * Phase 4F.5: Automatically scores educational resources on 8 quality
 * dimensions:
 *
 *   • Clarity — readability, structure, headings
 *   • Depth — comprehensiveness, coverage of subtopics
 *   • Accuracy — factual correctness (heuristic: presence of citations)
 *   • Difficulty — computed difficulty from Phase 4F.5 concept extraction
 *   • Engagement — interactive elements, examples, visuals
 *   • Curriculum alignment — fraction of resource mapped to standards
 *   • Assessment quality — for quizzes: question variety, distractor quality
 *   • Accessibility — alt text, language simplicity, structure
 *
 * Each dimension is 0-1. The overall score is a weighted average.
 *
 * The analyzer is deterministic for Phase 4F.5 — a rule-based pipeline.
 * A future phase can plug in an LLM via the AI Workspace without
 * changing the DTO shape.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { extractConcepts } from "./concept-extraction";
import type { ResourceQualityAnalysis, ResourceQualityDto } from "./types";

const log = getLogger("resource-quality");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function analyzeResourceQuality(input: {
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  subject?: string;
}): Promise<ResourceQualityDto> {
  const { entityType, entityId, title, content, subject } = input;

  // Extract concepts (reuses Phase 4F.5 concept extractor)
  const extracted = extractConcepts({ content, subject, title });

  // --- Clarity ---
  const clarity = scoreClarity(content);

  // --- Depth ---
  const depth = scoreDepth(content, extracted.concepts.length);

  // --- Accuracy ---
  const accuracy = scoreAccuracy(content);

  // --- Difficulty ---
  const difficulty = extracted.difficulty;

  // --- Engagement ---
  const engagement = scoreEngagement(content);

  // --- Curriculum alignment ---
  const curriculumAlignment = await scoreCurriculumAlignment(entityType, entityId);

  // --- Assessment quality ---
  const assessmentQuality = scoreAssessmentQuality(content);

  // --- Accessibility ---
  const accessibility = scoreAccessibility(content);

  // --- Overall (weighted average) ---
  const overall = (
    clarity * 0.2 +
    depth * 0.15 +
    accuracy * 0.15 +
    engagement * 0.15 +
    curriculumAlignment * 0.15 +
    assessmentQuality * 0.1 +
    accessibility * 0.1
  );

  // --- Strengths + weaknesses + suggestions ---
  const analysis = generateAnalysis({
    clarity, depth, accuracy, difficulty, engagement,
    curriculumAlignment, assessmentQuality, accessibility,
    conceptCount: extracted.concepts.length,
    formulaCount: extracted.attributes.formulas?.length ?? 0,
  });

  // --- AI confidence ---
  const aiConfidence = computeQualityConfidence(content);

  // Persist
  const row = await repo.upsertResourceQuality({
    entityType,
    entityId,
    overall: round(overall, 3),
    clarity: round(clarity, 3),
    depth: round(depth, 3),
    accuracy: round(accuracy, 3),
    difficulty: round(difficulty, 3),
    engagement: round(engagement, 3),
    curriculumAlignment: round(curriculumAlignment, 3),
    assessmentQuality: round(assessmentQuality, 3),
    accessibility: round(accessibility, 3),
    aiConfidence: round(aiConfidence, 3),
    analysis: JSON.stringify(analysis),
    model: "edubek-quality-v1",
  });

  log.info("quality.analyzed", {
    entityType, entityId,
    overall: round(overall, 2),
    strengths: analysis.strengths.length,
    weaknesses: analysis.weaknesses.length,
  });

  return {
    id: row.id,
    entityType,
    entityId,
    overall: round(overall, 3),
    clarity: round(clarity, 3),
    depth: round(depth, 3),
    accuracy: round(accuracy, 3),
    difficulty: round(difficulty, 3),
    engagement: round(engagement, 3),
    curriculumAlignment: round(curriculumAlignment, 3),
    assessmentQuality: round(assessmentQuality, 3),
    accessibility: round(accessibility, 3),
    aiConfidence: round(aiConfidence, 3),
    analysis,
    model: row.model,
    analyzedAt: row.analyzedAt.toISOString(),
  };
}

export async function getResourceQuality(entityType: string, entityId: string): Promise<ResourceQualityDto | null> {
  const row = await repo.findResourceQuality(entityType, entityId);
  if (!row) return null;
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    overall: row.overall,
    clarity: row.clarity,
    depth: row.depth,
    accuracy: row.accuracy,
    difficulty: row.difficulty,
    engagement: row.engagement,
    curriculumAlignment: row.curriculumAlignment,
    assessmentQuality: row.assessmentQuality,
    accessibility: row.accessibility,
    aiConfidence: row.aiConfidence,
    analysis: safeParseAnalysis(row.analysis),
    model: row.model,
    analyzedAt: row.analyzedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Sub-scorers
// ---------------------------------------------------------------------------

function scoreClarity(content: string): number {
  let score = 0.4;
  // Headings improve clarity
  const headingCount = (content.match(/^#{1,6}\s/gm) ?? []).length;
  score += Math.min(0.3, headingCount * 0.05);
  // Short paragraphs improve clarity
  const paragraphs = content.split(/\n\n+/);
  const avgParagraphLength = paragraphs.reduce((s, p) => s + p.length, 0) / Math.max(1, paragraphs.length);
  if (avgParagraphLength < 500) score += 0.15;
  else if (avgParagraphLength > 2000) score -= 0.1;
  // Bullet points / numbered lists improve clarity
  if (/^[-*]\s/m.test(content)) score += 0.1;
  if (/^\d+\.\s/m.test(content)) score += 0.05;
  return clamp01(score);
}

function scoreDepth(content: string, conceptCount: number): number {
  let score = 0.3;
  // More concepts = deeper
  score += Math.min(0.4, conceptCount * 0.05);
  // Word count
  const wordCount = content.trim().split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount > 500) score += 0.15;
  if (wordCount > 2000) score += 0.15;
  return clamp01(score);
}

function scoreAccuracy(content: string): number {
  let score = 0.5;
  // Citations / references improve accuracy
  if (/\[(\d+)\]/.test(content)) score += 0.2; // academic citation style
  if (/(?:source|reference|citation|according to)/i.test(content)) score += 0.15;
  // "Approximately" / "roughly" hedging is OK; absolute claims without evidence are risky
  if (/\b(?:always|never|everyone|no one|all)\b/i.test(content)) score -= 0.1;
  return clamp01(score);
}

function scoreEngagement(content: string): number {
  let score = 0.3;
  // Examples
  if (/(?:example|for example|e\.g\.)/i.test(content)) score += 0.2;
  // Code blocks
  if (/```/.test(content)) score += 0.15;
  // Images / diagrams
  if (/!\[/.test(content)) score += 0.15;
  // Interactive prompts ("Try this", "Practice")
  if (/(?:try this|practice|exercise|your turn)/i.test(content)) score += 0.1;
  // Questions to the reader
  const questionCount = (content.match(/\?\s/g) ?? []).length;
  score += Math.min(0.1, questionCount * 0.02);
  return clamp01(score);
}

async function scoreCurriculumAlignment(entityType: string, entityId: string): Promise<number> {
  // Count curriculum mappings for this entity
  const mappingCount = await db.curriculumMapping.count({
    where: { entityType, entityId },
  }).catch(() => 0);
  if (mappingCount === 0) return 0.1;
  if (mappingCount >= 5) return 1;
  return 0.1 + (mappingCount / 5) * 0.9;
}

function scoreAssessmentQuality(content: string): number {
  // For non-quiz content, score based on practice problem presence
  let score = 0.4;
  if (/(?:problem|exercise|practice|question)/i.test(content)) score += 0.2;
  if (/(?:answer|solution|explanation)/i.test(content)) score += 0.2;
  if (/(?:multiple choice|true\/false|fill in|short answer)/i.test(content)) score += 0.15;
  return clamp01(score);
}

function scoreAccessibility(content: string): number {
  let score = 0.4;
  // Alt text on images
  const images = content.match(/!\[([^\]]*)\]/g) ?? [];
  const imagesWithAlt = images.filter((img) => {
    const alt = img.match(/!\[([^\]]*)\]/)?.[1] ?? "";
    return alt.length > 3;
  });
  if (images.length > 0) {
    score += 0.2 * (imagesWithAlt.length / images.length);
  }
  // Simple language — short sentences
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((s, x) => s + x.split(/\s+/).length, 0) / Math.max(1, sentences.length);
  if (avgSentenceLength < 20) score += 0.2;
  else if (avgSentenceLength > 35) score -= 0.1;
  // Heading structure
  if (/^#{1,6}\s/m.test(content)) score += 0.15;
  return clamp01(score);
}

// ---------------------------------------------------------------------------
// Analysis (strengths / weaknesses / suggestions)
// ---------------------------------------------------------------------------

function generateAnalysis(scores: {
  clarity: number; depth: number; accuracy: number; difficulty: number;
  engagement: number; curriculumAlignment: number; assessmentQuality: number;
  accessibility: number; conceptCount: number; formulaCount: number;
}): ResourceQualityAnalysis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (scores.clarity >= 0.7) strengths.push("Well-structured with clear headings");
  else if (scores.clarity < 0.4) {
    weaknesses.push("Structure could be clearer");
    suggestions.push("Add headings to break up long sections");
  }

  if (scores.depth >= 0.7) strengths.push(`Comprehensive coverage (${scores.conceptCount} concepts)`);
  else if (scores.depth < 0.4) {
    weaknesses.push("Content may be too shallow");
    suggestions.push("Expand coverage with additional subtopics and examples");
  }

  if (scores.accuracy >= 0.7) strengths.push("Includes citations and references");
  else if (scores.accuracy < 0.4) {
    weaknesses.push("Lacks sources or citations");
    suggestions.push("Add citations to improve credibility");
  }

  if (scores.engagement >= 0.7) strengths.push("Engaging with examples and interactive elements");
  else if (scores.engagement < 0.4) {
    weaknesses.push("Limited interactive elements");
    suggestions.push("Add examples, code blocks, or practice problems");
  }

  if (scores.curriculumAlignment >= 0.7) strengths.push("Strongly aligned to curriculum standards");
  else if (scores.curriculumAlignment < 0.4) {
    weaknesses.push("Limited curriculum alignment");
    suggestions.push("Map this resource to curriculum standards using the AI Curriculum Assistant");
  }

  if (scores.assessmentQuality >= 0.7) strengths.push("Includes practice problems with solutions");
  else if (scores.assessmentQuality < 0.4) {
    weaknesses.push("Limited assessment opportunities");
    suggestions.push("Add practice problems and worked solutions");
  }

  if (scores.accessibility >= 0.7) strengths.push("Accessible with alt text and clear language");
  else if (scores.accessibility < 0.4) {
    weaknesses.push("Accessibility could be improved");
    suggestions.push("Add alt text to images and use simpler sentence structure");
  }

  return { strengths, weaknesses, suggestions };
}

function computeQualityConfidence(content: string): number {
  let confidence = 0.4;
  if (content.length > 1000) confidence += 0.2;
  if (content.length > 5000) confidence += 0.15;
  if (/^#{1,6}\s/m.test(content)) confidence += 0.1; // has structure
  if (content.split(/\s+/).length > 200) confidence += 0.1;
  return Math.min(0.95, confidence);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

function safeParseAnalysis(raw: string | null): ResourceQualityAnalysis {
  if (!raw) return { strengths: [], weaknesses: [], suggestions: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch {
    return { strengths: [], weaknesses: [], suggestions: [] };
  }
}
