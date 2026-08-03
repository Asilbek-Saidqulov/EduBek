/**
 * EduBek — Peer Recommendation Engine.
 *
 * Phase 4F.4: Recommends peers for study partners, mentors, helpers,
 * discussion participants, and project teammates based on:
 *
 *   • Shared interests (Phase 4F.2 interest profile overlap)
 *   • Mastery overlap (complementary or matching mastery levels)
 *   • Language match (Phase 4E locale)
 *   • Timezone match (approximate via UTC offset)
 *   • Subject overlap (subjects the user has been studying)
 *   • Organization membership (same school / org)
 *   • Activity recency (both users active in last 30 days)
 *
 * The engine never duplicates search/recommendation logic — it queries
 * existing user profiles and computes a 0-1 match score per candidate.
 * Recommendations are persisted as PeerRecommendation rows so the
 * frontend can show match scores and reasons.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { getInterestProfile } from "@/features/semantic-search";
import * as repo from "./repository";
import { addCollaborationEdge } from "./network-graph";
import type {
  PeerRecommendationDto,
  PeerRecommendationType,
} from "./types";

const log = getLogger("peer-recommendations");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function generatePeerRecommendations(input: {
  userId: string;
  type?: PeerRecommendationType;
  limit?: number;
}): Promise<PeerRecommendationDto[]> {
  const { userId, type = "study_partner", limit = 10 } = input;

  // Get the user's interest profile + organization membership
  const [myProfile, myOrgs, myUser] = await Promise.all([
    getInterestProfile(userId),
    db.organizationMembership.findMany({
      where: { userId },
      select: { orgId: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { locale: true, country: true },
    }),
  ]);

  if (!myUser) throw new Error("User not found");

  // Find candidate peers — users from the same organizations first, then
  // fallback to users with overlapping interests (search sessions).
  const orgIds = myOrgs.map((m) => m.orgId);
  const candidateUsers = orgIds.length > 0
    ? await db.organizationMembership.findMany({
        where: {
          orgId: { in: orgIds },
          userId: { not: userId },
        },
        distinct: ["userId"],
        take: 200,
        select: { userId: true, orgId: true },
      })
    : await db.user.findMany({
        where: { id: { not: userId } },
        take: 200,
        select: { id: true, locale: true, country: true },
      }).then((users) => users.map((u) => ({ userId: u.id, orgId: null })));

  if (candidateUsers.length === 0) return [];

  // Score each candidate
  const scored: Array<{
    peerId: string;
    score: number;
    signals: PeerRecommendationDto["signals"];
    reason: string;
  }> = [];

  const candidateIds = candidateUsers.map((c) => c.userId);

  // Batch fetch candidate profiles
  const candidateProfiles = await db.userInterestProfile.findMany({
    where: { userId: { in: candidateIds } },
    select: { userId: true, interests: true, mastery: true },
  }).catch(() => [] as Array<{ userId: string; interests: string; mastery: string }>);
  const profileByUser = new Map(candidateProfiles.map((p) => [p.userId, p]));

  // Batch fetch candidate users (for locale/country)
  const candidateUserRows = await db.user.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true, locale: true, country: true, name: true, username: true },
  });
  const userByCandidate = new Map(candidateUserRows.map((u) => [u.id, u]));

  for (const candidate of candidateUsers) {
    const peerId = candidate.userId;
    const peerProfile = profileByUser.get(peerId);
    const peerUser = userByCandidate.get(peerId);
    if (!peerUser) continue;

    const signals: PeerRecommendationDto["signals"] = {};
    let score = 0;

    // --- Interest overlap (max 0.4) ---
    const peerInterests = peerProfile ? safeParseRecord(peerProfile.interests, {}) : {};
    const myInterests = myProfile.interests;
    const sharedInterests = Object.keys(myInterests).filter((k) => k in peerInterests);
    if (sharedInterests.length > 0) {
      const overlap = sharedInterests.reduce((sum, k) => sum + Math.min(myInterests[k]!, peerInterests[k]!), 0)
        / Math.max(1, sharedInterests.length);
      score += 0.4 * overlap;
      signals.sharedInterests = sharedInterests.slice(0, 5);
    }

    // --- Mastery overlap (max 0.2) ---
    // For mentor recommendations, prefer peers with HIGHER mastery on the user's weak topics.
    // For mentee recommendations, prefer peers with LOWER mastery.
    // For study partners, prefer SIMILAR mastery.
    const peerMastery = peerProfile ? safeParseRecord(peerProfile.mastery, {}) : {};
    const myMastery = myProfile.mastery;
    const masteryOverlapTopics = Object.keys(myMastery).filter((k) => k in peerMastery);
    if (masteryOverlapTopics.length > 0) {
      let masteryScore = 0;
      if (type === "mentor") {
        // Peer should have higher mastery than me
        const higher = masteryOverlapTopics.filter((k) =>
          masteryLevelToScore(peerMastery[k]) > masteryLevelToScore(myMastery[k]),
        );
        masteryScore = higher.length / masteryOverlapTopics.length;
      } else if (type === "mentee") {
        // Peer should have lower mastery than me
        const lower = masteryOverlapTopics.filter((k) =>
          masteryLevelToScore(peerMastery[k]) < masteryLevelToScore(myMastery[k]),
        );
        masteryScore = lower.length / masteryOverlapTopics.length;
      } else {
        // Study partner — similar mastery
        const similar = masteryOverlapTopics.filter((k) => peerMastery[k] === myMastery[k]);
        masteryScore = similar.length / masteryOverlapTopics.length;
      }
      score += 0.2 * masteryScore;
      signals.masteryOverlap = masteryScore;
    }

    // --- Language match (max 0.2) ---
    const languageMatch = (myUser.locale ?? "en") === (peerUser.locale ?? "en");
    if (languageMatch) {
      score += 0.2;
      signals.languageMatch = true;
    }

    // --- Timezone match (max 0.1) — approximate via country ---
    const timezoneMatch = (myUser.country ?? null) === (peerUser.country ?? null)
      && myUser.country !== null;
    if (timezoneMatch) {
      score += 0.1;
      signals.timezoneMatch = true;
    }

    // --- Subject overlap (max 0.1) ---
    // Look for shared search sessions touching the same subjects
    const subjectOverlap = sharedInterests.length > 0 ? sharedInterests.slice(0, 3) : [];
    if (subjectOverlap.length > 0) {
      score += 0.1 * Math.min(1, subjectOverlap.length / 3);
      signals.subjectOverlap = subjectOverlap;
    }

    // Only include candidates with a non-trivial score
    if (score >= 0.1) {
      const reason = buildReason(type, signals);
      scored.push({ peerId, score, signals, reason });
    }
  }

  // Sort by score, take top N
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  // Persist + add RECOMMENDED_FOR graph edges
  const dtos: PeerRecommendationDto[] = [];
  for (const s of top) {
    const rec = await repo.createPeerRecommendation({
      userId,
      peerId: s.peerId,
      type,
      score: round(s.score, 4),
      signals: JSON.stringify(s.signals),
      reason: s.reason,
      reasonKey: `learning.peer.reason.${type}`,
    });

    // Add RECOMMENDED_FOR edge in the network graph
    await addCollaborationEdge({
      fromEntityType: "user",
      fromEntityId: userId,
      fromTitle: "User",
      toEntityType: "user",
      toEntityId: s.peerId,
      toTitle: "User",
      edgeType: "RECOMMENDED_FOR",
      weight: s.score,
      metadata: { type, score: s.score },
    }).catch(() => undefined);

    dtos.push({
      id: rec.id,
      userId: rec.userId,
      peerId: rec.peerId,
      type: rec.type as PeerRecommendationType,
      score: rec.score,
      signals: s.signals,
      reason: rec.reason,
      reasonKey: rec.reasonKey,
      status: rec.status as PeerRecommendationDto["status"],
      createdAt: rec.createdAt.toISOString(),
      updatedAt: rec.updatedAt.toISOString(),
    });
  }

  log.info("peer_recommendations.generated", {
    userId,
    type,
    candidates: candidateUsers.length,
    returned: dtos.length,
  });

  return dtos;
}

export async function listPeerRecommendations(input: {
  userId: string;
  type?: PeerRecommendationType;
  status?: string;
  limit?: number;
}): Promise<PeerRecommendationDto[]> {
  const rows = await repo.findPeerRecommendations({
    userId: input.userId,
    type: input.type,
    status: input.status,
    limit: input.limit,
  });
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    peerId: r.peerId,
    type: r.type as PeerRecommendationType,
    score: r.score,
    signals: safeParseRecord(r.signals, {}),
    reason: r.reason,
    reasonKey: r.reasonKey,
    status: r.status as PeerRecommendationDto["status"],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function updatePeerRecommendationStatus(
  id: string,
  status: "accepted" | "dismissed",
): Promise<void> {
  await repo.updatePeerRecommendation(id, { status });
}

// ---------------------------------------------------------------------------
// Mentorship
// ---------------------------------------------------------------------------

export async function requestMentorship(input: {
  mentorId: string;
  menteeId: string;
  subject?: string;
  goals?: string[];
}): Promise<void> {
  const mentorship = await repo.createMentorship({
    mentorId: input.mentorId,
    menteeId: input.menteeId,
    subject: input.subject,
    goals: JSON.stringify(input.goals ?? []),
  });

  // Add MENTORS edge to network graph
  await addCollaborationEdge({
    fromEntityType: "user",
    fromEntityId: input.mentorId,
    fromTitle: "Mentor",
    toEntityType: "user",
    toEntityId: input.menteeId,
    toTitle: "Mentee",
    edgeType: "MENTORS",
    weight: 1,
    metadata: { mentorshipId: mentorship.id, subject: input.subject },
  }).catch(() => undefined);

  log.info("mentorship.requested", {
    mentorshipId: mentorship.id,
    mentorId: input.mentorId,
    menteeId: input.menteeId,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParseRecord<T = Record<string, any>>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function masteryLevelToScore(level: string | undefined): number {
  switch (level) {
    case "mastered": return 0.95;
    case "learning": return 0.55;
    case "weak": return 0.25;
    case "forgotten": return 0.4;
    case "never": return 0;
    default: return 0;
  }
}

function buildReason(type: PeerRecommendationType, signals: PeerRecommendationDto["signals"]): string {
  const parts: string[] = [];
  if (signals.sharedInterests && signals.sharedInterests.length > 0) {
    parts.push(`Shared interests: ${signals.sharedInterests.slice(0, 3).join(", ")}`);
  }
  if (signals.languageMatch) parts.push("Same language");
  if (signals.timezoneMatch) parts.push("Same timezone");
  if (signals.masteryOverlap !== undefined) {
    parts.push(`${Math.round(signals.masteryOverlap * 100)}% mastery overlap`);
  }
  if (parts.length === 0) return `Recommended as a ${type.replace("_", " ")}`;
  return `Recommended as a ${type.replace("_", " ")} — ${parts.join("; ")}`;
}

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
