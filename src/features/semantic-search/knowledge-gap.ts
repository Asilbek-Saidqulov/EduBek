/**
 * EduBek — Knowledge Gap Detection.
 *
 * Phase 4F.2: Identifies a learner's weak topics, missing prerequisites,
 * forgotten topics, mastered topics, current learning progress, and
 * overall readiness score.
 *
 * Inputs:
 *   - UserInterestProfile (mastery map + behavioral signals)
 *   - KnowledgeGraph edges (PREREQUISITE / NEXT) to find missing prereqs
 *   - Recent activity timestamps to detect "forgotten" topics
 *   - Assessment scores to detect weak topics
 *
 * Output: a single KnowledgeGapReport used by:
 *   - /api/discovery/weak-topics
 *   - /api/discovery/next-step (practice_weak recommendations)
 *   - getPersonalizedFeed() weak_topics section
 *   - ranking engine (masteryScore + prerequisiteScore signals)
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import type {
  KnowledgeGapReport,
  MasteryLevel,
  UserInterestProfileDto,
} from "./types";
import { getInterestProfile } from "./service";

const log = getLogger("knowledge-gap");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MASTERY_SCORE: Record<MasteryLevel, number> = {
  mastered: 0.95,
  learning: 0.55,
  weak: 0.25,
  forgotten: 0.4,
  never: 0.0,
};

const FORGOTTEN_THRESHOLD_DAYS = 30; // topics not seen in 30+ days become "forgotten"
const READINESS_MIN_MASTERY = 0.6; // average mastery required to advance

// ---------------------------------------------------------------------------
// Detect missing prerequisites
// ---------------------------------------------------------------------------

/**
 * For each topic the user is currently learning or has weak mastery of,
 * look up the Knowledge Graph for PREREQUISITE edges leading into it.
 * If any prerequisite topic is NOT in the user's mastery map (or marked
 * "weak" / "never"), it's flagged as missing.
 */
export async function detectMissingPrerequisites(
  profile: UserInterestProfileDto,
): Promise<KnowledgeGapReport["missingPrerequisites"]> {
  const result: KnowledgeGapReport["missingPrerequisites"] = [];

  // Look up graph nodes for each topic the user has any mastery entry on.
  const topicsToCheck = Object.keys(profile.mastery);
  if (topicsToCheck.length === 0) return result;

  // Find graph nodes matching these topics (by title).
  const nodes = await db.knowledgeGraphNode.findMany({
    where: {
      entityType: "topic",
      title: { in: topicsToCheck },
    },
    select: { id: true, title: true },
  });

  for (const node of nodes) {
    // Find prerequisite edges: edges of type PREREQUISITE where this node
    // is the destination (i.e. another node is a prerequisite FOR this one).
    const prereqEdges = await db.knowledgeGraphEdge.findMany({
      where: {
        toNodeId: node.id,
        edgeType: "PREREQUISITE",
      },
      select: { fromNodeId: true, weight: true },
    });

    if (prereqEdges.length === 0) continue;

    const prereqNodes = await db.knowledgeGraphNode.findMany({
      where: { id: { in: prereqEdges.map((e) => e.fromNodeId) } },
      select: { id: true, title: true },
    });

    for (const prereq of prereqNodes) {
      const prereqMastery = profile.mastery[prereq.title];
      if (!prereqMastery || prereqMastery === "weak" || prereqMastery === "never") {
        result.push({
          topic: prereq.title,
          requiredFor: node.title,
          prerequisiteMastery: prereqMastery ?? "never",
        });
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Detect forgotten topics
// ---------------------------------------------------------------------------

/**
 * Topics the user previously engaged with (mastery entries exist) but
 * has not had any behavioral signal activity on in FORGOTTEN_THRESHOLD_DAYS.
 *
 * We approximate "last seen" by the most recent SearchSession or
 * assessment attempt touching that topic. For Phase 4F.2 this is a
 * best-effort heuristic; a future phase could add explicit
 * `LastTopicInteractionAt` tracking.
 */
export async function detectForgottenTopics(
  profile: UserInterestProfileDto,
): Promise<KnowledgeGapReport["forgottenTopics"]> {
  const result: KnowledgeGapReport["forgottenTopics"] = [];
  const now = Date.now();

  // For each mastered/learning topic, check if user has searched for it recently.
  for (const [topic, level] of Object.entries(profile.mastery)) {
    if (level === "never" || level === "weak") continue;

    const recentSessions = await db.searchSession.findFirst({
      where: {
        query: { contains: topic },
        createdAt: { gte: new Date(now - FORGOTTEN_THRESHOLD_DAYS * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (!recentSessions) {
      const lastEver = await db.searchSession.findFirst({
        where: { query: { contains: topic } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      const daysSince = lastEver
        ? Math.floor((now - lastEver.createdAt.getTime()) / (24 * 60 * 60 * 1000))
        : FORGOTTEN_THRESHOLD_DAYS + 1;

      if (daysSince >= FORGOTTEN_THRESHOLD_DAYS) {
        result.push({
          topic,
          lastSeenDays: daysSince,
          previousMastery: level,
        });
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Build full KnowledgeGapReport
// ---------------------------------------------------------------------------

export async function buildKnowledgeGapReport(
  userId: string,
): Promise<KnowledgeGapReport> {
  const profile = await getInterestProfile(userId);

  // Weak topics
  const weakTopics = Object.entries(profile.mastery)
    .filter(([, level]) => level === "weak")
    .map(([topic]) => ({
      topic,
      mastery: "weak" as MasteryLevel,
      score: MASTERY_SCORE.weak,
    }));

  // Mastered topics
  const masteredTopics = Object.entries(profile.mastery)
    .filter(([, level]) => level === "mastered")
    .map(([topic]) => ({
      topic,
      score: MASTERY_SCORE.mastered,
    }));

  // Learning progress
  const learningProgress = Object.entries(profile.mastery)
    .filter(([, level]) => level === "learning")
    .map(([topic]) => {
      const affinity = profile.topicAffinity[topic] ?? 0.5;
      return {
        topic,
        progress: Math.round(affinity * 100),
        lastActivityDays: 0, // best-effort — would need explicit tracking
      };
    });

  // Missing prerequisites
  const missingPrerequisites = await detectMissingPrerequisites(profile);

  // Forgotten topics
  const forgottenTopics = await detectForgottenTopics(profile);

  // Readiness score: average mastery across all topics with mastery entries,
  // minus penalty for each missing prerequisite and forgotten topic.
  const masteryValues = Object.values(profile.mastery).map((l) => MASTERY_SCORE[l] ?? 0);
  const avgMastery = masteryValues.length > 0
    ? masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length
    : 0;
  const prereqPenalty = Math.min(0.3, missingPrerequisites.length * 0.05);
  const forgottenPenalty = Math.min(0.2, forgottenTopics.length * 0.05);
  const readinessScore = Math.max(
    0,
    Math.min(100, Math.round((avgMastery - prereqPenalty - forgottenPenalty) * 100)),
  );

  log.info("knowledge_gap.built", {
    userId,
    weak: weakTopics.length,
    mastered: masteredTopics.length,
    missingPrereqs: missingPrerequisites.length,
    forgotten: forgottenTopics.length,
    readiness: readinessScore,
  });

  return {
    weakTopics,
    missingPrerequisites,
    forgottenTopics,
    masteredTopics,
    learningProgress,
    readinessScore,
  };
}
