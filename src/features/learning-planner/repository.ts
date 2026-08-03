/**
 * EduBek — Learning Planner repository.
 *
 * Direct Prisma access for the 9 Phase 4F.3 models:
 *   LearningGoal, LearningPlan, LearningPlanItem, StudySession,
 *   ReviewSchedule, ReviewHistory, LearningMilestone,
 *   LearningVelocitySnapshot, LearningAnalyticsSnapshot.
 *
 * No business logic — pure data access. Functions return raw Prisma
 * rows; the service layer is responsible for mapping to DTOs.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function createGoal(input: {
  userId: string;
  title: string;
  description?: string;
  constraints?: string;
}) {
  return db.learningGoal.create({ data: input });
}

export async function findGoal(id: string) {
  return db.learningGoal.findUnique({ where: { id } });
}

export async function findGoalsByUser(userId: string, status?: string) {
  return db.learningGoal.findMany({
    where: { userId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateGoal(id: string, data: Record<string, unknown>) {
  return db.learningGoal.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export async function createPlan(input: {
  userId: string;
  goalId?: string;
  title: string;
  description?: string;
  metadata?: string;
  status?: string;
}) {
  return db.learningPlan.create({ data: input });
}

export async function findPlan(id: string) {
  return db.learningPlan.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function findPlansByUser(userId: string, status?: string) {
  return db.learningPlan.findMany({
    where: { userId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function findActivePlanForUser(userId: string) {
  return db.learningPlan.findFirst({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function updatePlan(id: string, data: Record<string, unknown>) {
  return db.learningPlan.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Plan Items
// ---------------------------------------------------------------------------

export async function createPlanItem(input: {
  planId: string;
  sortOrder: number;
  itemType: string;
  entityType: string;
  entityId: string;
  title: string;
  estimatedMinutes?: number;
  difficulty?: string;
  recommendation?: string;
}) {
  return db.learningPlanItem.create({ data: input });
}

export async function createPlanItemsBatch(
  inputs: Array<{
    planId: string;
    sortOrder: number;
    itemType: string;
    entityType: string;
    entityId: string;
    title: string;
    estimatedMinutes?: number;
    difficulty?: string;
    recommendation?: string;
  }>,
) {
  if (inputs.length === 0) return [];
  return db.$transaction(inputs.map((input) => db.learningPlanItem.create({ data: input })));
}

export async function findPlanItem(id: string) {
  return db.learningPlanItem.findUnique({ where: { id } });
}

export async function findPlanItems(planId: string) {
  return db.learningPlanItem.findMany({
    where: { planId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function findNextPendingPlanItem(planId: string) {
  return db.learningPlanItem.findFirst({
    where: { planId, status: "pending" },
    orderBy: { sortOrder: "asc" },
  });
}

export async function updatePlanItem(id: string, data: Record<string, unknown>) {
  return db.learningPlanItem.update({ where: { id }, data });
}

export async function countCompletedPlanItems(planId: string) {
  return db.learningPlanItem.count({ where: { planId, status: "completed" } });
}

export async function countTotalPlanItems(planId: string) {
  return db.learningPlanItem.count({ where: { planId } });
}

// ---------------------------------------------------------------------------
// Study Sessions
// ---------------------------------------------------------------------------

export async function createStudySession(input: {
  userId: string;
  planId?: string;
  planItemId?: string;
  learningSessionId?: string;
  sessionType?: string;
  durationMs?: number;
  accuracy?: number;
  difficulty?: string;
  mood?: number;
  energy?: number;
  focus?: number;
  metadata?: string;
  completedAt?: Date;
}) {
  return db.studySession.create({ data: input });
}

export async function findStudySessionsByUser(
  userId: string,
  options: { since?: Date; limit?: number } = {},
) {
  return db.studySession.findMany({
    where: {
      userId,
      ...(options.since ? { startedAt: { gte: options.since } } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: options.limit ?? 100,
  });
}

export async function findStudySessionsByPlan(planId: string, limit = 100) {
  return db.studySession.findMany({
    where: { planId },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Review Schedule (SM-2)
// ---------------------------------------------------------------------------

export async function findReviewSchedule(userId: string, entityType: string, entityId: string) {
  return db.reviewSchedule.findUnique({
    where: {
      userId_entityType_entityId: { userId, entityType, entityId },
    },
  });
}

export async function upsertReviewSchedule(input: {
  userId: string;
  entityType: string;
  entityId: string;
  easeFactor?: number;
  intervalDays?: number;
  repetitions?: number;
  nextReviewAt?: Date;
  lastReviewAt?: Date;
  forgettingScore?: number;
  metadata?: string;
}) {
  return db.reviewSchedule.upsert({
    where: {
      userId_entityType_entityId: {
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    },
    create: input,
    update: input,
  });
}

export async function findDueReviews(userId: string, asOf: Date = new Date(), limit = 50) {
  return db.reviewSchedule.findMany({
    where: { userId, nextReviewAt: { lte: asOf } },
    orderBy: { nextReviewAt: "asc" },
    take: limit,
  });
}

export async function findUpcomingReviews(userId: string, withinDays: number, limit = 50) {
  const from = new Date();
  const to = new Date(from.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return db.reviewSchedule.findMany({
    where: { userId, nextReviewAt: { gte: from, lte: to } },
    orderBy: { nextReviewAt: "asc" },
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Review History
// ---------------------------------------------------------------------------

export async function createReviewHistory(input: {
  userId: string;
  reviewScheduleId: string;
  quality: number;
  responseMs?: number;
  correct?: boolean;
  metadata?: string;
}) {
  return db.reviewHistory.create({ data: input });
}

export async function findReviewHistoryBySchedule(reviewScheduleId: string, limit = 20) {
  return db.reviewHistory.findMany({
    where: { reviewScheduleId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function findReviewHistoryByUser(userId: string, since?: Date, limit = 100) {
  return db.reviewHistory.findMany({
    where: {
      userId,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export async function createMilestone(input: {
  userId: string;
  type: string;
  title: string;
  description?: string;
  metadata?: string;
}) {
  return db.learningMilestone.create({ data: input });
}

export async function findMilestonesByUser(userId: string, limit = 100) {
  return db.learningMilestone.findMany({
    where: { userId },
    orderBy: { achievedAt: "desc" },
    take: limit,
  });
}

export async function findMilestonesSince(userId: string, since: Date, limit = 50) {
  return db.learningMilestone.findMany({
    where: { userId, achievedAt: { gte: since } },
    orderBy: { achievedAt: "desc" },
    take: limit,
  });
}

export async function hasMilestone(userId: string, type: string, metadataKey: string, metadataValue: string) {
  // SQLite JSON queries are limited; do a best-effort substring match on metadata.
  const rows = await db.learningMilestone.findMany({
    where: { userId, type },
    select: { metadata: true, id: true },
  });
  return rows.some((r) => {
    try {
      const meta = JSON.parse(r.metadata || "{}");
      return String(meta[metadataKey] ?? "") === metadataValue;
    } catch {
      return false;
    }
  });
}

export async function markMilestoneNotified(id: string) {
  return db.learningMilestone.update({
    where: { id },
    data: { notifiedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Velocity snapshots
// ---------------------------------------------------------------------------

export async function upsertVelocitySnapshot(input: {
  userId: string;
  weekStart: Date;
  conceptsLearned: number;
  minutesStudied: number;
  masteryGained: number;
  quizImprovement: number;
  consistency: number;
  dropOffProbability: number;
}) {
  return db.learningVelocitySnapshot.upsert({
    where: {
      userId_weekStart: { userId: input.userId, weekStart: input.weekStart },
    },
    create: input,
    update: input,
  });
}

export async function findVelocitySnapshots(userId: string, limit = 12) {
  return db.learningVelocitySnapshot.findMany({
    where: { userId },
    orderBy: { weekStart: "desc" },
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Analytics snapshots
// ---------------------------------------------------------------------------

export async function upsertAnalyticsSnapshot(input: {
  userId: string;
  day: Date;
  studyTimeMs?: number;
  reviewCount?: number;
  reviewSuccessRate?: number;
  masteryAvg?: number;
  difficultyAvg?: number;
  recommendationAcceptance?: number;
  aiUsageCount?: number;
  goalCompletionPct?: number;
  velocityScore?: number;
}) {
  return db.learningAnalyticsSnapshot.upsert({
    where: {
      userId_day: { userId: input.userId, day: input.day },
    },
    create: input,
    update: input,
  });
}

export async function findAnalyticsSnapshots(userId: string, from: Date, to: Date) {
  return db.learningAnalyticsSnapshot.findMany({
    where: { userId, day: { gte: from, lte: to } },
    orderBy: { day: "asc" },
  });
}
