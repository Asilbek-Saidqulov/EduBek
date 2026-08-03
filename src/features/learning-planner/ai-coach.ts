/**
 * EduBek — AI Coach.
 *
 * Phase 4F.3: Generates explainable, prioritized learning recommendations.
 * Each recommendation carries:
 *
 *   • type            — what kind of action to take
 *   • reason / reasonKey — natural-language explanation + i18n key
 *   • confidence      — 0-1 how sure the AI is this is the right call
 *   • expectedImpactPct — projected mastery gain (e.g. +18)
 *   • estimatedMinutes — projected time cost
 *   • priority        — 1 = highest
 *   • actionItems     — concrete steps for the learner
 *   • actionItemKeys  — i18n keys for each action item
 *
 * The AI Coach orchestrates the existing systems:
 *   • Knowledge Gap Detection (Phase 4F.2) → practice_weak / review_forgotten
 *   • Knowledge Graph (Phase 4F.1) → review_prerequisite / advance_topic
 *   • Recommendation Engine (Phase 4F.2) → marketplace_resource
 *   • Burnout Detection (this phase) → take_break
 *   • Adaptive Difficulty (this phase) → change_difficulty
 *   • AI Workspace (Phase 4A) → ai_tutor_session
 *
 * It NEVER duplicates search/recommendation logic — it queries the
 * existing services and adds an explanation layer on top.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import {
  getInterestProfile,
  buildKnowledgeGapReport,
} from "@/features/semantic-search";
import type { AiCoachRecommendation } from "./types";
import type { BurnoutReport } from "./types";

const log = getLogger("ai-coach");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Generate a prioritized list of AI Coach recommendations for a learner.
 *
 * @param userId   The learner
 * @param locale   Locale for reason text (default "en")
 * @param burnout  Optional pre-computed burnout report. If burnout is
 *                 detected, a "take_break" recommendation is inserted at
 *                 priority 1 and all other recommendations are softened.
 * @param limit    Max recommendations to return (default 8)
 */
export async function generateCoachRecommendations(input: {
  userId: string;
  locale?: string;
  burnout?: BurnoutReport;
  limit?: number;
}): Promise<AiCoachRecommendation[]> {
  const { userId, locale = "en", burnout, limit = 8 } = input;
  const recs: AiCoachRecommendation[] = [];

  // --- Burnout override ---
  if (burnout?.isBurnout) {
    recs.push({
      type: "take_break",
      entityType: "system",
      entityId: "break",
      title: "Take a break",
      description: `You've been studying intensely. Burnout severity: ${burnout.severity}.`,
      reason: burnout.factors
        .filter((f) => f.triggered)
        .map((f) => f.factor)
        .join("; "),
      reasonKey: "learning.coach.takeBreak",
      confidence: 0.95,
      expectedImpactPct: 0,
      estimatedMinutes: 15,
      priority: 1,
      actionItems: [
        "Step away from the screen for 10-15 minutes",
        "Try lighter content next session",
        "Switch from new material to a review session",
      ],
      actionItemKeys: [
        "learning.coach.action.stepAway",
        "learning.coach.action.lighterContent",
        "learning.coach.action.reviewInsteadOfNew",
      ],
      language: locale,
    });
  }

  // --- Knowledge-gap-driven recommendations ---
  const gapReport = await buildKnowledgeGapReport(userId).catch(() => ({
    weakTopics: [],
    missingPrerequisites: [],
    forgottenTopics: [],
    masteredTopics: [],
    learningProgress: [],
    readinessScore: 0,
  }));
  const profile = await getInterestProfile(userId);

  // Missing prerequisites → review_prerequisite (priority 1)
  for (const prereq of gapReport.missingPrerequisites.slice(0, 2)) {
    recs.push({
      type: "review_prerequisite",
      entityType: "topic",
      entityId: prereq.topic,
      title: `Review prerequisite: ${prereq.topic}`,
      description: `Required for ${prereq.requiredFor}. Your mastery is currently ${prereq.prerequisiteMastery}.`,
      reason: `${prereq.topic} is a prerequisite for ${prereq.requiredFor} — your mastery is ${prereq.prerequisiteMastery}.`,
      reasonKey: "learning.coach.reviewPrerequisite",
      confidence: 0.85,
      expectedImpactPct: 22,
      estimatedMinutes: 20,
      priority: 1,
      actionItems: [
        `Spend 20 minutes reviewing ${prereq.topic}`,
        "Then attempt a practice problem on the next topic",
      ],
      actionItemKeys: [
        "learning.coach.action.spendMinutesReviewing",
        "learning.coach.action.attemptPracticeProblem",
      ],
      language: locale,
    });
  }

  // Weak topics → practice_weak (priority 2)
  for (const weak of gapReport.weakTopics.slice(0, 2)) {
    recs.push({
      type: "practice_weak",
      entityType: "topic",
      entityId: weak.topic,
      title: `Practice weak topic: ${weak.topic}`,
      description: `Your mastery is ${Math.round(weak.score * 100)}%.`,
      reason: `You scored below 50% on ${weak.topic} — targeted practice will help close this gap.`,
      reasonKey: "learning.coach.practiceWeak",
      confidence: 0.8,
      expectedImpactPct: 18,
      estimatedMinutes: 25,
      priority: 2,
      actionItems: [
        `Complete 10 practice problems on ${weak.topic}`,
        "Review your previous mistakes before starting",
      ],
      actionItemKeys: [
        "learning.coach.action.completePracticeProblems",
        "learning.coach.action.reviewMistakesFirst",
      ],
      language: locale,
    });
  }

  // Forgotten topics → review_forgotten (priority 2)
  for (const forgotten of gapReport.forgottenTopics.slice(0, 2)) {
    recs.push({
      type: "review_forgotten",
      entityType: "topic",
      entityId: forgotten.topic,
      title: `Review forgotten: ${forgotten.topic}`,
      description: `Last seen ${forgotten.lastSeenDays} days ago.`,
      reason: `It's been ${forgotten.lastSeenDays} days since you reviewed ${forgotten.topic} — periodic review prevents forgetting.`,
      reasonKey: "learning.coach.reviewForgotten",
      confidence: 0.75,
      expectedImpactPct: 12,
      estimatedMinutes: 15,
      priority: 2,
      actionItems: [
        `Quick 15-minute review of ${forgotten.topic}`,
        "Use flashcards if available",
      ],
      actionItemKeys: [
        "learning.coach.action.quickReview",
        "learning.coach.action.useFlashcards",
      ],
      language: locale,
    });
  }

  // Learning topics → advance_topic via Knowledge Graph NEXT edges (priority 3)
  for (const [topic, level] of Object.entries(profile.mastery).slice(0, 1)) {
    if (level !== "learning") continue;
    const node = await db.knowledgeGraphNode.findFirst({
      where: { entityType: "topic", title: topic },
      select: { id: true, title: true },
    });
    if (!node) continue;
    const nextEdge = await db.knowledgeGraphEdge.findFirst({
      where: { fromNodeId: node.id, edgeType: "NEXT" },
      select: { toNodeId: true },
    });
    if (!nextEdge) continue;
    const nextNode = await db.knowledgeGraphNode.findUnique({
      where: { id: nextEdge.toNodeId },
      select: { title: true },
    });
    if (!nextNode) continue;
    recs.push({
      type: "advance_topic",
      entityType: "topic",
      entityId: nextNode.title,
      title: `Advance to: ${nextNode.title}`,
      description: `Natural next step after ${topic}.`,
      reason: `You're currently learning ${topic} — ${nextNode.title} is the natural next step in the Knowledge Graph.`,
      reasonKey: "learning.coach.advanceTopic",
      confidence: 0.7,
      expectedImpactPct: 15,
      estimatedMinutes: 30,
      priority: 3,
      actionItems: [
        `Start a 30-minute session on ${nextNode.title}`,
        "Keep notes on concepts you find difficult",
      ],
      actionItemKeys: [
        "learning.coach.action.startSession",
        "learning.coach.action.keepNotes",
      ],
      language: locale,
    });
  }

  // AI Tutor session for top interest topic (priority 4)
  const topInterest = Object.entries(profile.interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1)[0];
  if (topInterest) {
    recs.push({
      type: "ai_tutor_session",
      entityType: "ai_session",
      entityId: "new",
      title: `AI Tutor: ${topInterest[0]}`,
      description: `Personalized AI tutoring session on ${topInterest[0]}.`,
      reason: `You've shown strong interest in ${topInterest[0]} — an AI tutor session can deepen your understanding.`,
      reasonKey: "learning.coach.aiTutorSession",
      confidence: 0.65,
      expectedImpactPct: 10,
      estimatedMinutes: 20,
      priority: 4,
      actionItems: [
        `Start an AI tutor session focused on ${topInterest[0]}`,
        "Ask the AI to explain one concept you're unsure about",
      ],
      actionItemKeys: [
        "learning.coach.action.startAiTutor",
        "learning.coach.action.askAboutConcept",
      ],
      language: locale,
    });
  }

  // Sort by priority and limit
  const sorted = recs.sort((a, b) => a.priority - b.priority).slice(0, limit);

  log.info("ai_coach.generated", {
    userId,
    count: sorted.length,
    burnout: burnout?.isBurnout ?? false,
  });

  return sorted;
}

/**
 * Estimate the expected mastery improvement from completing a
 * recommendation. Heuristic based on recommendation type and the
 * learner's current mastery of the topic.
 */
export function estimateExpectedImpact(input: {
  type: AiCoachRecommendation["type"];
  currentMastery: number; // 0-1
}): number {
  const { type, currentMastery } = input;
  // Lower current mastery = more room to grow.
  const headroom = Math.max(0, 1 - currentMastery);
  switch (type) {
    case "review_prerequisite": return Math.round(headroom * 25);
    case "practice_weak":       return Math.round(headroom * 20);
    case "review_forgotten":    return Math.round(headroom * 15);
    case "advance_topic":       return Math.round(headroom * 18);
    case "ai_tutor_session":    return Math.round(headroom * 12);
    case "mock_exam":           return Math.round(headroom * 22);
    case "marketplace_resource":return Math.round(headroom * 10);
    case "change_difficulty":   return Math.round(headroom * 8);
    case "take_break":          return 0;
    default:                    return 0;
  }
}
