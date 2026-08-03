/**
 * EduBek — Team Learning Challenges service.
 *
 * Phase 4F.4: Organizations / classrooms / study groups can create
 * challenges (weekly / monthly / tournament / season / department)
 * that track progress toward a target metric
 * (xp / questions_correct / topics_mastered / streak_days / study_minutes).
 *
 * Participation can be individual or team-based (group). Leaderboards
 * rank participants by progress.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { notificationService } from "@/infra/notifications";
import * as repo from "./repository";
import type {
  ChallengeLeaderboardEntry,
  ChallengeParticipationDto,
  LearningChallengeDto,
} from "./types";

const log = getLogger("challenges");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapChallenge(c: any, participantCount?: number, myProgress?: number, myRank?: number): LearningChallengeDto {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    type: c.type,
    metric: c.metric,
    targetValue: c.targetValue,
    organizationId: c.organizationId,
    classroomId: c.classroomId,
    groupId: c.groupId,
    department: c.department,
    rewardType: c.rewardType,
    rewardValue: c.rewardValue,
    secondRewardType: c.secondRewardType,
    secondRewardValue: c.secondRewardValue,
    startsAt: c.startsAt.toISOString(),
    endsAt: c.endsAt.toISOString(),
    status: c.status,
    participantCount,
    myProgress,
    myRank,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function mapParticipation(p: any): ChallengeParticipationDto {
  return {
    id: p.id,
    challengeId: p.challengeId,
    userId: p.userId,
    groupId: p.groupId,
    progress: p.progress,
    completed: p.completed,
    completedAt: p.completedAt?.toISOString() ?? null,
    rank: p.rank,
    rewardGranted: p.rewardGranted,
    rewardGrantedAt: p.rewardGrantedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createChallenge(input: {
  title: string;
  description?: string;
  type: "weekly" | "monthly" | "tournament" | "season" | "department";
  metric: "xp" | "questions_correct" | "topics_mastered" | "streak_days" | "study_minutes";
  targetValue: number;
  organizationId?: string;
  classroomId?: string;
  groupId?: string;
  department?: string;
  rewardType?: "xp" | "badge" | "certificate" | "marketplace_reward" | "org_points";
  rewardValue?: number;
  secondRewardType?: "xp" | "badge" | "certificate" | "marketplace_reward" | "org_points";
  secondRewardValue?: number;
  startsAt: Date;
  endsAt: Date;
}): Promise<LearningChallengeDto> {
  if (input.endsAt <= input.startsAt) {
    throw new Error("End date must be after start date");
  }
  const challenge = await repo.createChallenge({
    title: input.title,
    description: input.description,
    type: input.type,
    metric: input.metric,
    targetValue: input.targetValue,
    organizationId: input.organizationId,
    classroomId: input.classroomId,
    groupId: input.groupId,
    department: input.department,
    rewardType: input.rewardType ?? "xp",
    rewardValue: input.rewardValue ?? 100,
    secondRewardType: input.secondRewardType,
    secondRewardValue: input.secondRewardValue,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  });
  log.info("challenge.created", { challengeId: challenge.id, type: input.type });
  return mapChallenge(challenge, 0);
}

export async function getChallenge(id: string, userId?: string): Promise<LearningChallengeDto | null> {
  const challenge = await repo.findChallenge(id);
  if (!challenge) return null;

  const leaderboard = await repo.findChallengeLeaderboard(id, 1000);
  const participantCount = leaderboard.length;
  let myProgress: number | undefined;
  let myRank: number | undefined;
  if (userId) {
    const myEntry = leaderboard.find((e) => e.userId === userId);
    if (myEntry) {
      myProgress = myEntry.progress;
      myRank = leaderboard.indexOf(myEntry) + 1;
    }
  }
  return mapChallenge(challenge, participantCount, myProgress, myRank);
}

export async function listChallenges(input: {
  organizationId?: string;
  classroomId?: string;
  groupId?: string;
  type?: string;
  status?: string;
  limit?: number;
}): Promise<LearningChallengeDto[]> {
  const challenges = await repo.findChallenges(input);
  const result: LearningChallengeDto[] = [];
  for (const c of challenges) {
    const participantCount = await db.challengeParticipation.count({ where: { challengeId: c.id } });
    result.push(mapChallenge(c, participantCount));
  }
  return result;
}

export async function updateChallenge(id: string, input: {
  title?: string;
  description?: string;
  status?: "active" | "completed" | "cancelled";
}): Promise<LearningChallengeDto> {
  const challenge = await repo.updateChallenge(id, input);
  return mapChallenge(challenge);
}

// ---------------------------------------------------------------------------
// Participation
// ---------------------------------------------------------------------------

export async function joinChallenge(challengeId: string, userId?: string, groupId?: string): Promise<ChallengeParticipationDto> {
  const challenge = await repo.findChallenge(challengeId);
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "active") throw new Error("Challenge is not active");
  if (Date.now() < challenge.startsAt.getTime()) throw new Error("Challenge hasn't started yet");
  if (Date.now() > challenge.endsAt.getTime()) throw new Error("Challenge has ended");

  const participation = await repo.upsertChallengeParticipation({
    challengeId,
    userId,
    groupId,
    progress: 0,
  });
  log.info("challenge.joined", { challengeId, userId, groupId });
  return mapParticipation(participation);
}

export async function updateProgress(input: {
  challengeId: string;
  userId?: string;
  groupId?: string;
  progressDelta?: number;
  progressAbsolute?: number;
}): Promise<ChallengeParticipationDto> {
  const challenge = await repo.findChallenge(input.challengeId);
  if (!challenge) throw new Error("Challenge not found");

  const existing = input.userId
    ? await repo.findChallengeParticipation(input.challengeId, input.userId)
    : input.groupId
      ? await repo.findGroupChallengeParticipation(input.challengeId, input.groupId)
      : null;
  if (!existing) {
    // Auto-join if not already a participant
    await joinChallenge(input.challengeId, input.userId, input.groupId);
  }

  const newProgress = input.progressAbsolute !== undefined
    ? input.progressAbsolute
    : (existing?.progress ?? 0) + (input.progressDelta ?? 0);

  const completed = newProgress >= challenge.targetValue;
  const completedAt = completed && !existing?.completed ? new Date() : existing?.completedAt;

  const updated = await repo.upsertChallengeParticipation({
    challengeId: input.challengeId,
    userId: input.userId,
    groupId: input.groupId,
    progress: newProgress,
    completed,
    completedAt: completedAt ?? undefined,
  });

  // Notify on completion
  if (completed && !existing?.completed && input.userId) {
    await notificationService.send({
      userId: input.userId,
      type: "challenge.completed",
      title: `Challenge completed: ${challenge.title}`,
      body: `You completed "${challenge.title}" with ${newProgress} ${challenge.metric}!`,
      data: { challengeId: challenge.id, rewardType: challenge.rewardType, rewardValue: challenge.rewardValue },
    }).catch(() => undefined);
  }

  log.info("challenge.progress_updated", {
    challengeId: input.challengeId,
    userId: input.userId,
    groupId: input.groupId,
    progress: newProgress,
    completed,
  });

  return mapParticipation(updated);
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export async function getChallengeLeaderboard(challengeId: string, limit = 50): Promise<ChallengeLeaderboardEntry[]> {
  const entries = await repo.findChallengeLeaderboard(challengeId, limit);
  const userIds = entries.filter((e) => e.userId).map((e) => e.userId!);
  const groupIds = entries.filter((e) => e.groupId).map((e) => e.groupId!);

  const [users, groups] = await Promise.all([
    userIds.length > 0
      ? db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, username: true, avatarUrl: true } })
      : Promise.resolve([]),
    groupIds.length > 0
      ? db.studyGroup.findMany({ where: { id: { in: groupIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);

  return entries.map((entry, idx) => {
    const user = entry.userId ? users.find((u) => u.id === entry.userId) : null;
    const group = entry.groupId ? groups.find((g) => g.id === entry.groupId) : null;
    return {
      userId: entry.userId,
      groupId: entry.groupId,
      displayName: user?.name ?? user?.username ?? group?.name ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      progress: entry.progress,
      rank: idx + 1,
      completed: entry.completed,
    };
  });
}

// ---------------------------------------------------------------------------
// Finalize + reward
// ---------------------------------------------------------------------------

/**
 * Finalize a challenge: compute final ranks for all participants and
 * mark the challenge as completed. Should be called after the end date.
 */
export async function finalizeChallenge(challengeId: string): Promise<void> {
  const challenge = await repo.findChallenge(challengeId);
  if (!challenge) throw new Error("Challenge not found");

  const entries = await repo.findChallengeLeaderboard(challengeId, 10000);

  // Assign ranks based on progress (1-indexed)
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    await repo.upsertChallengeParticipation({
      challengeId,
      userId: entry.userId ?? undefined,
      groupId: entry.groupId ?? undefined,
      rank: i + 1,
    });
  }

  await repo.updateChallenge(challengeId, { status: "completed" });
  log.info("challenge.finalized", { challengeId, participantCount: entries.length });
}
