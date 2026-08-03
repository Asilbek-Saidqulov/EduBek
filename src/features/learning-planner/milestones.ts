/**
 * EduBek — Learning Milestones.
 *
 * Phase 4F.3: Auto-generates milestones based on learner activity.
 * Milestones are idempotent — calling `recordTopicMastered()` twice for
 * the same (userId, topic) does NOT create a duplicate.
 *
 * Milestone types:
 *   • topic_mastered        — learner reached "mastered" mastery on a topic
 *   • questions_completed   — learner answered N questions total (100, 500, 1000)
 *   • plan_finished         — learner completed a study plan
 *   • streak_reached        — learner hit a streak milestone (7, 30, 100)
 *   • readiness_reached     — learner's readiness score crossed a threshold
 *   • concept_learned       — learner learned a new concept (first activity on a topic)
 *
 * Each milestone creation fires a notification via the existing
 * NotificationService. Notifications are sent at most once per milestone
 * (tracked via `notifiedAt`).
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { notificationService } from "@/infra/notifications";
import * as repo from "./repository";
import type { LearningMilestoneDto, MilestoneType } from "./types";

const log = getLogger("milestones");

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const QUESTIONS_THRESHOLDS = [100, 500, 1000, 5000];
const STREAK_THRESHOLDS = [7, 30, 100, 365];
const READINESS_THRESHOLDS = [60, 80, 90, 100];

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapMilestone(m: any): LearningMilestoneDto {
  return {
    id: m.id,
    userId: m.userId,
    type: m.type as MilestoneType,
    title: m.title,
    description: m.description,
    metadata: safeParse(m.metadata, {}),
    achievedAt: m.achievedAt.toISOString(),
    notifiedAt: m.notifiedAt?.toISOString() ?? null,
  };
}

function safeParse(raw: string | null, fallback: any): any {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

// ---------------------------------------------------------------------------
// Recording functions (idempotent)
// ---------------------------------------------------------------------------

export async function recordTopicMastered(userId: string, topic: string): Promise<LearningMilestoneDto | null> {
  const already = await repo.hasMilestone(userId, "topic_mastered", "topic", topic);
  if (already) return null;
  const m = await repo.createMilestone({
    userId,
    type: "topic_mastered",
    title: `Mastered: ${topic}`,
    description: `Reached "mastered" mastery on ${topic}.`,
    metadata: JSON.stringify({ topic }),
  });
  await notifyMilestone(userId, m.id, "topic_mastered", {
    title: m.title,
    body: m.description ?? "",
  });
  return mapMilestone(m);
}

export async function recordQuestionsCompleted(userId: string, totalQuestions: number): Promise<LearningMilestoneDto | null> {
  for (const threshold of QUESTIONS_THRESHOLDS) {
    if (totalQuestions >= threshold) {
      const already = await repo.hasMilestone(userId, "questions_completed", "value", String(threshold));
      if (already) continue;
      const m = await repo.createMilestone({
        userId,
        type: "questions_completed",
        title: `Finished ${threshold} questions`,
        description: `You've completed ${threshold} questions in total.`,
        metadata: JSON.stringify({ value: totalQuestions, threshold }),
      });
      await notifyMilestone(userId, m.id, "questions_completed", {
        title: m.title,
        body: m.description ?? "",
      });
      return mapMilestone(m);
    }
  }
  return null;
}

export async function recordPlanFinished(userId: string, planId: string, planTitle: string): Promise<LearningMilestoneDto | null> {
  const already = await repo.hasMilestone(userId, "plan_finished", "planId", planId);
  if (already) return null;
  const m = await repo.createMilestone({
    userId,
    type: "plan_finished",
    title: `Finished plan: ${planTitle}`,
    description: `Completed study plan "${planTitle}".`,
    metadata: JSON.stringify({ planId }),
  });
  await notifyMilestone(userId, m.id, "plan_finished", {
    title: m.title,
    body: m.description ?? "",
  });
  return mapMilestone(m);
}

export async function recordStreakReached(userId: string, streakDays: number): Promise<LearningMilestoneDto | null> {
  for (const threshold of STREAK_THRESHOLDS) {
    if (streakDays >= threshold) {
      const already = await repo.hasMilestone(userId, "streak_reached", "value", String(threshold));
      if (already) continue;
      const m = await repo.createMilestone({
        userId,
        type: "streak_reached",
        title: `${threshold}-day streak!`,
        description: `You've studied every day for ${threshold} days.`,
        metadata: JSON.stringify({ value: streakDays, threshold }),
      });
      await notifyMilestone(userId, m.id, "streak_reached", {
        title: m.title,
        body: m.description ?? "",
      });
      return mapMilestone(m);
    }
  }
  return null;
}

export async function recordReadinessReached(userId: string, readiness: number): Promise<LearningMilestoneDto | null> {
  for (const threshold of READINESS_THRESHOLDS) {
    if (readiness >= threshold) {
      const already = await repo.hasMilestone(userId, "readiness_reached", "value", String(threshold));
      if (already) continue;
      const m = await repo.createMilestone({
        userId,
        type: "readiness_reached",
        title: `Readiness: ${threshold}%`,
        description: `Your learning readiness score reached ${threshold}%.`,
        metadata: JSON.stringify({ value: readiness, threshold }),
      });
      await notifyMilestone(userId, m.id, "readiness_reached", {
        title: m.title,
        body: m.description ?? "",
      });
      return mapMilestone(m);
    }
  }
  return null;
}

export async function recordConceptLearned(userId: string, topic: string): Promise<LearningMilestoneDto | null> {
  const already = await repo.hasMilestone(userId, "concept_learned", "topic", topic);
  if (already) return null;
  const m = await repo.createMilestone({
    userId,
    type: "concept_learned",
    title: `Learned: ${topic}`,
    description: `Started learning ${topic}.`,
    metadata: JSON.stringify({ topic }),
  });
  // concept_learned is a smaller milestone — no push notification.
  return mapMilestone(m);
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function listMilestones(userId: string, limit = 100): Promise<LearningMilestoneDto[]> {
  const rows = await repo.findMilestonesByUser(userId, limit);
  return rows.map(mapMilestone);
}

export async function listMilestonesSince(userId: string, since: Date): Promise<LearningMilestoneDto[]> {
  const rows = await repo.findMilestonesSince(userId, since, 50);
  return rows.map(mapMilestone);
}

// ---------------------------------------------------------------------------
// Notification helper
// ---------------------------------------------------------------------------

async function notifyMilestone(
  userId: string,
  milestoneId: string,
  type: MilestoneType,
  payload: { title: string; body: string },
): Promise<void> {
  try {
    await notificationService.send({
      userId,
      type: `learning.milestone.${type}`,
      title: payload.title,
      body: payload.body,
      data: { milestoneId, milestoneType: type },
    });
    await repo.markMilestoneNotified(milestoneId);
  } catch (err) {
    log.warn("milestone.notify_failed", {
      milestoneId,
      error: (err as Error).message,
    });
  }
}
