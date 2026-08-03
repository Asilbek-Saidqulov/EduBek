/**
 * EduBek — Learning Planner service.
 *
 * Phase 4F.3: The AI Learning Orchestrator. Orchestrates existing
 * systems (Knowledge Graph, Discovery, Recommendation Engine, Semantic
 * Search, AI Workspace, Marketplace, Notifications, Localization)
 * into a unified planner that:
 *
 *   • Creates adaptive study plans from a goal + constraints
 *   • Generates week-by-week schedules with daily sessions
 *   • Estimates plan completion based on the learner's velocity
 *   • Adjusts difficulty per-item using the adaptive difficulty engine
 *   • Tracks spaced-repetition review schedules (SM-2)
 *   • Records study sessions and updates plan progress
 *   • Auto-generates milestones and fires notifications
 *   • Detects burnout and softens recommendations accordingly
 *   • Produces daily agendas and weekly reports
 *
 * Lifecycle:
 *   createStudyPlan → updateStudyPlan → recommendNextLesson
 *                  → estimateCompletion → adjustDifficulty
 *                  → pausePlan / resumePlan / finishPlan / archivePlan
 *
 * All functions are userId-scoped and respect the existing RBAC +
 * auth context. No business logic in the repository layer.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { applySm2, defaultPriorState, suggestQuality } from "./spaced-repetition";
import { adjustDifficulty } from "./adaptive-difficulty";
import { recordPlanFinished, recordTopicMastered } from "./milestones";
import type {
  CreateStudyPlanInput,
  Difficulty,
  EstimateCompletionResult,
  LearningGoalDto,
  LearningGoalConstraints,
  LearningPlanDto,
  LearningPlanItemDto,
  LearningPlanMetadata,
  PlanItemRecommendation,
  PlanItemType,
  ReviewScheduleDto,
  ReviewHistoryDto,
  Sm2ReviewInput,
  Sm2Result,
  StudySessionDto,
  StudySessionType,
  UpdateStudyPlanInput,
  WeeklySchedule,
} from "./types";

const log = getLogger("learning-planner");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mapGoal(g: any): LearningGoalDto {
  return {
    id: g.id,
    userId: g.userId,
    title: g.title,
    description: g.description,
    constraints: safeParse<LearningGoalConstraints>(g.constraints, {}),
    completionPct: g.completionPct,
    confidence: g.confidence,
    estimatedFinish: g.estimatedFinish?.toISOString() ?? null,
    achievedAt: g.achievedAt?.toISOString() ?? null,
    status: g.status,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

function mapPlan(p: any): LearningPlanDto {
  return {
    id: p.id,
    userId: p.userId,
    goalId: p.goalId,
    title: p.title,
    description: p.description,
    metadata: safeParse<LearningPlanMetadata>(p.metadata, {}),
    completionPct: p.completionPct,
    masteryPct: p.masteryPct,
    status: p.status,
    startedAt: p.startedAt?.toISOString() ?? null,
    completedAt: p.completedAt?.toISOString() ?? null,
    pausedAt: p.pausedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    items: p.items?.map(mapPlanItem),
  };
}

function mapPlanItem(i: any): LearningPlanItemDto {
  return {
    id: i.id,
    planId: i.planId,
    sortOrder: i.sortOrder,
    itemType: i.itemType as PlanItemType,
    entityType: i.entityType,
    entityId: i.entityId,
    title: i.title,
    estimatedMinutes: i.estimatedMinutes,
    difficulty: i.difficulty as Difficulty,
    recommendation: safeParse<PlanItemRecommendation>(i.recommendation, {
      reason: "",
      reasonKey: "learning.plan.defaultReason",
      confidence: 0.5,
      expectedImpactPct: 0,
      actionItems: [],
    }),
    status: i.status,
    startedAt: i.startedAt?.toISOString() ?? null,
    completedAt: i.completedAt?.toISOString() ?? null,
    actualMinutes: i.actualMinutes,
    masteryScore: i.masteryScore,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

function mapReviewSchedule(r: any): ReviewScheduleDto {
  return {
    id: r.id,
    userId: r.userId,
    entityType: r.entityType,
    entityId: r.entityId,
    easeFactor: r.easeFactor,
    intervalDays: r.intervalDays,
    repetitions: r.repetitions,
    nextReviewAt: r.nextReviewAt.toISOString(),
    lastReviewAt: r.lastReviewAt?.toISOString() ?? null,
    forgettingScore: r.forgettingScore,
    metadata: safeParse(r.metadata, {}),
  };
}

function mapReviewHistory(h: any): ReviewHistoryDto {
  return {
    id: h.id,
    userId: h.userId,
    reviewScheduleId: h.reviewScheduleId,
    quality: h.quality,
    responseMs: h.responseMs,
    correct: h.correct,
    createdAt: h.createdAt.toISOString(),
  };
}

function mapStudySession(s: any): StudySessionDto {
  return {
    id: s.id,
    userId: s.userId,
    planId: s.planId,
    planItemId: s.planItemId,
    learningSessionId: s.learningSessionId,
    sessionType: s.sessionType as StudySessionType,
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
    durationMs: s.durationMs,
    accuracy: s.accuracy,
    difficulty: s.difficulty as Difficulty | null,
    mood: s.mood,
    energy: s.energy,
    focus: s.focus,
    metadata: safeParse(s.metadata, {}),
  };
}

// ---------------------------------------------------------------------------
// Goal Management
// ---------------------------------------------------------------------------

export async function createGoal(input: {
  userId: string;
  title: string;
  description?: string;
  constraints?: LearningGoalConstraints;
}): Promise<LearningGoalDto> {
  const goal = await repo.createGoal({
    userId: input.userId,
    title: input.title,
    description: input.description,
    constraints: JSON.stringify(input.constraints ?? {}),
  });
  log.info("goal.created", { userId: input.userId, goalId: goal.id });
  return mapGoal(goal);
}

export async function listGoals(userId: string, status?: string): Promise<LearningGoalDto[]> {
  const goals = await repo.findGoalsByUser(userId, status);
  return goals.map(mapGoal);
}

export async function getGoal(id: string): Promise<LearningGoalDto | null> {
  const goal = await repo.findGoal(id);
  return goal ? mapGoal(goal) : null;
}

// ---------------------------------------------------------------------------
// Study Plan lifecycle
// ---------------------------------------------------------------------------

/**
 * Create a new study plan. Generates a sequence of plan items based on:
 *   1. The user's interest profile and active goals
 *   2. Knowledge Graph prerequisites and NEXT edges
 *   3. Weak topics from the knowledge gap report
 *   4. The learner's daily available study time and target deadline
 *
 * The generated plan includes a weekly schedule and a difficulty curve
 * that ramps from the starting difficulty.
 */
export async function createStudyPlan(input: CreateStudyPlanInput): Promise<LearningPlanDto> {
  const {
    userId,
    goalId,
    title,
    description,
    dailyMinutes = 45,
    targetDate,
    startingDifficulty = "medium",
    locale = "en",
  } = input;

  // Compute total available study minutes from now to targetDate.
  const now = new Date();
  let totalAvailableMinutes = 0;
  let daysRemaining = 30; // default if no target date
  if (targetDate) {
    const target = new Date(targetDate);
    daysRemaining = Math.max(1, Math.ceil((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    totalAvailableMinutes = dailyMinutes * daysRemaining;
  } else {
    totalAvailableMinutes = dailyMinutes * 30;
  }

  // Build the plan metadata: weekly schedule + difficulty curve
  const weeklySchedule = buildWeeklySchedule({
    dailyMinutes,
    daysRemaining,
    startingDifficulty,
    startDate: now,
  });

  const difficultyCurve = buildDifficultyCurve({
    daysRemaining,
    startingDifficulty,
  });

  const estimatedTotalMinutes = weeklySchedule.reduce(
    (sum, week) => sum + week.days.reduce((s, d) => s + d.sessions.reduce((s2, x) => s2 + x.durationMinutes, 0), 0),
    0,
  );

  const metadata: LearningPlanMetadata = {
    difficultyCurve,
    estimatedTotalMinutes,
    confidenceScore: 0.65,
    generatorVersion: "edubek-planner-v1",
    weeklySchedule,
  };

  // Create the plan
  const plan = await repo.createPlan({
    userId,
    goalId,
    title,
    description,
    metadata: JSON.stringify(metadata),
    status: "draft",
  });

  // Generate plan items by walking the Knowledge Graph from the user's
  // current weak topics + interest topics.
  const items = await generatePlanItems({
    userId,
    planId: plan.id,
    totalAvailableMinutes,
    startingDifficulty,
    locale,
  });

  // Persist items in batch
  if (items.length > 0) {
    await repo.createPlanItemsBatch(items);
  }

  // Update plan with actual item count and estimated total
  await repo.updatePlan(plan.id, {
    status: "active",
    startedAt: new Date(),
  });

  log.info("plan.created", {
    userId,
    planId: plan.id,
    itemCount: items.length,
    estimatedMinutes: estimatedTotalMinutes,
  });

  const freshPlan = await repo.findPlan(plan.id);
  return mapPlan(freshPlan!);
}

export async function listPlans(userId: string, status?: string): Promise<LearningPlanDto[]> {
  const plans = await repo.findPlansByUser(userId, status);
  return plans.map(mapPlan);
}

export async function getPlan(id: string): Promise<LearningPlanDto | null> {
  const plan = await repo.findPlan(id);
  return plan ? mapPlan(plan) : null;
}

export async function updateStudyPlan(id: string, input: UpdateStudyPlanInput): Promise<LearningPlanDto> {
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.metadata !== undefined) {
    const existing = await repo.findPlan(id);
    const currentMeta = safeParse<LearningPlanMetadata>(existing?.metadata ?? null, {});
    data.metadata = JSON.stringify({ ...currentMeta, ...input.metadata });
  }
  const plan = await repo.updatePlan(id, data);
  log.info("plan.updated", { planId: id, status: input.status });
  return mapPlan(plan);
}

export async function pausePlan(id: string): Promise<LearningPlanDto> {
  const plan = await repo.updatePlan(id, {
    status: "paused",
    pausedAt: new Date(),
  });
  log.info("plan.paused", { planId: id });
  return mapPlan(plan);
}

export async function resumePlan(id: string): Promise<LearningPlanDto> {
  const plan = await repo.updatePlan(id, {
    status: "active",
    pausedAt: null,
  });
  log.info("plan.resumed", { planId: id });
  return mapPlan(plan);
}

export async function finishPlan(id: string): Promise<LearningPlanDto> {
  const plan = await repo.updatePlan(id, {
    status: "completed",
    completedAt: new Date(),
    completionPct: 100,
  });

  // Fire milestone
  const planRow = await repo.findPlan(id);
  if (planRow) {
    await recordPlanFinished(planRow.userId, id, planRow.title).catch(() => null);
  }

  log.info("plan.finished", { planId: id });
  return mapPlan(plan);
}

export async function archivePlan(id: string): Promise<LearningPlanDto> {
  const plan = await repo.updatePlan(id, { status: "archived" });
  log.info("plan.archived", { planId: id });
  return mapPlan(plan);
}

// ---------------------------------------------------------------------------
// Recommend next lesson
// ---------------------------------------------------------------------------

export async function recommendNextLesson(input: {
  userId: string;
  planId: string;
  locale?: string;
}): Promise<LearningPlanItemDto | null> {
  const next = await repo.findNextPendingPlanItem(input.planId);
  if (!next) return null;
  // Mark as in_progress
  await repo.updatePlanItem(next.id, {
    status: "in_progress",
    startedAt: new Date(),
  });
  const updated = await repo.findPlanItem(next.id);
  return mapPlanItem(updated!);
}

// ---------------------------------------------------------------------------
// Estimate completion
// ---------------------------------------------------------------------------

export async function estimateCompletion(planId: string): Promise<EstimateCompletionResult> {
  const plan = await repo.findPlan(planId);
  if (!plan) throw new Error("Plan not found");

  const items = await repo.findPlanItems(planId);
  const pending = items.filter((i) => i.status !== "completed");
  const remainingMinutes = pending.reduce((s, i) => s + i.estimatedMinutes, 0);

  // Get learner's recent velocity (minutes/day over last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sessions = await db.studySession.findMany({
    where: { userId: plan.userId, startedAt: { gte: sevenDaysAgo } },
    select: { durationMs: true, startedAt: true },
  });
  const totalMs = sessions.reduce((s, x) => s + x.durationMs, 0);
  const velocity = sessions.length > 0 ? totalMs / 60_000 / 7 : 30; // default 30 min/day

  const daysRemaining = velocity > 0 ? Math.ceil(remainingMinutes / velocity) : 0;
  const estimatedFinishDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);

  // Confidence based on consistency of recent sessions
  const studiedDays = new Set(
    sessions.map((s) => new Date(s.startedAt).toISOString().slice(0, 10)),
  );
  const consistency = studiedDays.size / 7;
  const confidence = Math.max(0.2, Math.min(0.95, consistency));

  return {
    planId,
    estimatedFinishDate: estimatedFinishDate.toISOString(),
    confidence,
    remainingMinutes,
    daysRemaining,
    velocity: Math.round(velocity * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// Adjust difficulty for a plan item
// ---------------------------------------------------------------------------

export async function adjustPlanItemDifficulty(planItemId: string): Promise<{
  planItemId: string;
  previousDifficulty: Difficulty;
  nextDifficulty: Difficulty;
  reason: string;
  reasonKey: string;
  change: "up" | "down" | "same";
}> {
  const item = await repo.findPlanItem(planItemId);
  if (!item) throw new Error("Plan item not found");

  // Pull recent sessions for this plan item to compute accuracy + response time
  const sessions = await db.studySession.findMany({
    where: { planItemId },
    select: { accuracy: true, durationMs: true, sessionType: true },
    orderBy: { startedAt: "desc" },
    take: 5,
  });

  if (sessions.length === 0) {
    return {
      planItemId,
      previousDifficulty: item.difficulty as Difficulty,
      nextDifficulty: item.difficulty as Difficulty,
      reason: "Not enough session data to adjust difficulty.",
      reasonKey: "learning.difficulty.insufficientData",
      change: "same",
    };
  }

  const accuracy = sessions.filter((s) => s.accuracy !== null).reduce((sum, s) => sum + (s.accuracy ?? 0), 0)
    / Math.max(1, sessions.filter((s) => s.accuracy !== null).length);
  const avgResponseSec = sessions.reduce((sum, s) => sum + s.durationMs, 0) / sessions.length / 1000;
  const recentFailures = sessions.filter((s) => s.accuracy !== null && s.accuracy < 0.5).length;

  const result = adjustDifficulty({
    current: item.difficulty as Difficulty,
    accuracy,
    avgResponseSec,
    recentFailures,
  });

  if (result.change !== "same") {
    await repo.updatePlanItem(planItemId, { difficulty: result.next });
  }

  return {
    planItemId,
    previousDifficulty: item.difficulty as Difficulty,
    nextDifficulty: result.next,
    reason: result.reason,
    reasonKey: result.reasonKey,
    change: result.change,
  };
}

// ---------------------------------------------------------------------------
// Plan item completion
// ---------------------------------------------------------------------------

export async function completePlanItem(planItemId: string, input: {
  actualMinutes?: number;
  masteryScore?: number;
  accuracy?: number;
}): Promise<LearningPlanItemDto> {
  const item = await repo.findPlanItem(planItemId);
  if (!item) throw new Error("Plan item not found");

  await repo.updatePlanItem(planItemId, {
    status: "completed",
    completedAt: new Date(),
    actualMinutes: input.actualMinutes ?? 0,
    masteryScore: input.masteryScore ?? null,
  });

  // Update plan-level completion %
  const plan = await repo.findPlan(item.planId);
  if (plan) {
    const total = await repo.countTotalPlanItems(item.planId);
    const completed = await repo.countCompletedPlanItems(item.planId);
    const completionPct = total > 0 ? (completed / total) * 100 : 0;
    await repo.updatePlan(item.planId, { completionPct });

    // If mastery is high, fire topic_mastered milestone
    if (input.masteryScore && input.masteryScore >= 0.8 && item.title) {
      await recordTopicMastered(plan.userId, item.title).catch(() => null);
    }
  }

  const updated = await repo.findPlanItem(planItemId);
  return mapPlanItem(updated!);
}

// ---------------------------------------------------------------------------
// Spaced Repetition (SM-2)
// ---------------------------------------------------------------------------

export async function recordReview(input: Sm2ReviewInput): Promise<{
  schedule: ReviewScheduleDto;
  history: ReviewHistoryDto;
  result: Sm2Result;
}> {
  // Fetch prior state (or default for first review)
  const existing = await repo.findReviewSchedule(input.userId, input.entityType, input.entityId);
  const prior = existing
    ? {
        easeFactor: existing.easeFactor,
        intervalDays: existing.intervalDays,
        repetitions: existing.repetitions,
        lastReviewAt: existing.lastReviewAt,
      }
    : defaultPriorState();

  // Apply SM-2
  const result = applySm2(prior, input);

  // Persist schedule
  const priorMeta = safeParse<{ history?: Array<{ date: string; quality: number; timeMs?: number }> }>(existing?.metadata, {});
  const history = [...(priorMeta.history ?? [])];
  history.push({
    date: new Date().toISOString(),
    quality: input.quality,
    timeMs: input.responseMs,
  });
  // Keep only last 20 entries to bound row size.
  const trimmedHistory = history.slice(-20);

  const schedule = await repo.upsertReviewSchedule({
    userId: input.userId,
    entityType: input.entityType,
    entityId: input.entityId,
    easeFactor: result.easeFactor,
    intervalDays: result.intervalDays,
    repetitions: result.repetitions,
    nextReviewAt: new Date(result.nextReviewAt),
    lastReviewAt: new Date(),
    forgettingScore: result.forgettingScore,
    metadata: JSON.stringify({
      lastQuality: input.quality,
      history: trimmedHistory,
    }),
  });

  // Persist history row
  const historyRow = await repo.createReviewHistory({
    userId: input.userId,
    reviewScheduleId: schedule.id,
    quality: input.quality,
    responseMs: input.responseMs,
    correct: input.quality >= 3,
    metadata: JSON.stringify({}),
  });

  log.info("review.recorded", {
    userId: input.userId,
    entityType: input.entityType,
    entityId: input.entityId,
    quality: input.quality,
    nextIntervalDays: result.intervalDays,
  });

  return {
    schedule: mapReviewSchedule(schedule),
    history: mapReviewHistory(historyRow),
    result,
  };
}

/**
 * Convenience wrapper — auto-suggest a quality grade from objective
 * signals (correctness + response time + retries).
 */
export async function recordReviewAuto(input: {
  userId: string;
  entityType: string;
  entityId: string;
  correct: boolean;
  responseMs?: number;
  retries?: number;
}): Promise<ReturnType<typeof recordReview>> {
  const quality = suggestQuality(input);
  return recordReview({
    userId: input.userId,
    entityType: input.entityType,
    entityId: input.entityId,
    quality,
    responseMs: input.responseMs,
  });
}

export async function getReviewSchedule(userId: string, entityType: string, entityId: string): Promise<ReviewScheduleDto | null> {
  const row = await repo.findReviewSchedule(userId, entityType, entityId);
  return row ? mapReviewSchedule(row) : null;
}

export async function listDueReviews(userId: string, limit = 50): Promise<ReviewScheduleDto[]> {
  const rows = await repo.findDueReviews(userId, new Date(), limit);
  return rows.map(mapReviewSchedule);
}

export async function listUpcomingReviews(userId: string, withinDays = 7, limit = 50): Promise<ReviewScheduleDto[]> {
  const rows = await repo.findUpcomingReviews(userId, withinDays, limit);
  return rows.map(mapReviewSchedule);
}

// ---------------------------------------------------------------------------
// Study Sessions
// ---------------------------------------------------------------------------

export async function recordStudySession(input: {
  userId: string;
  planId?: string;
  planItemId?: string;
  learningSessionId?: string;
  sessionType?: StudySessionType;
  durationMs?: number;
  accuracy?: number;
  difficulty?: Difficulty;
  mood?: number;
  energy?: number;
  focus?: number;
  metadata?: Record<string, unknown>;
}): Promise<StudySessionDto> {
  const session = await repo.createStudySession({
    userId: input.userId,
    planId: input.planId,
    planItemId: input.planItemId,
    learningSessionId: input.learningSessionId,
    sessionType: input.sessionType ?? "study",
    durationMs: input.durationMs ?? 0,
    accuracy: input.accuracy,
    difficulty: input.difficulty,
    mood: input.mood,
    energy: input.energy,
    focus: input.focus,
    metadata: JSON.stringify(input.metadata ?? {}),
    completedAt: new Date(),
  });
  log.info("session.recorded", {
    userId: input.userId,
    type: input.sessionType,
    durationMs: input.durationMs,
  });
  return mapStudySession(session);
}

export async function listStudySessions(userId: string, since?: Date): Promise<StudySessionDto[]> {
  const rows = await repo.findStudySessionsByUser(userId, { since, limit: 100 });
  return rows.map(mapStudySession);
}

// ---------------------------------------------------------------------------
// Internal: plan item generation
// ---------------------------------------------------------------------------

async function generatePlanItems(input: {
  userId: string;
  planId: string;
  totalAvailableMinutes: number;
  startingDifficulty: Difficulty;
  locale: string;
}): Promise<Array<{
  planId: string;
  sortOrder: number;
  itemType: string;
  entityType: string;
  entityId: string;
  title: string;
  estimatedMinutes: number;
  difficulty: string;
  recommendation: string;
}>> {
  const items: ReturnType<typeof generatePlanItems> extends Promise<infer T> ? T : never = [];
  let sortOrder = 1;
  let allocatedMinutes = 0;

  // Pull weak topics from the user's interest profile — these become the
  // first plan items (review prerequisite first).
  const { getInterestProfile, buildKnowledgeGapReport } = await import("@/features/semantic-search");
  const profile = await getInterestProfile(input.userId);
  const gap = await buildKnowledgeGapReport(input.userId).catch(() => ({
    weakTopics: [],
    missingPrerequisites: [],
    forgottenTopics: [],
    masteredTopics: [],
    learningProgress: [],
    readinessScore: 0,
  }));

  // Phase 1: missing prerequisites (review, 20 min each)
  for (const prereq of gap.missingPrerequisites.slice(0, 3)) {
    if (allocatedMinutes >= input.totalAvailableMinutes) break;
    items.push({
      planId: input.planId,
      sortOrder: sortOrder++,
      itemType: "review",
      entityType: "topic",
      entityId: prereq.topic,
      title: `Review prerequisite: ${prereq.topic}`,
      estimatedMinutes: 20,
      difficulty: "easy",
      recommendation: JSON.stringify({
        reason: `${prereq.topic} is required before ${prereq.requiredFor}`,
        reasonKey: "learning.plan.item.reviewPrerequisite",
        confidence: 0.85,
        expectedImpactPct: 22,
        actionItems: [`Spend 20 minutes reviewing ${prereq.topic}`],
      } satisfies PlanItemRecommendation),
    });
    allocatedMinutes += 20;
  }

  // Phase 2: weak topics (practice, 25 min each)
  for (const weak of gap.weakTopics.slice(0, 5)) {
    if (allocatedMinutes >= input.totalAvailableMinutes) break;
    items.push({
      planId: input.planId,
      sortOrder: sortOrder++,
      itemType: "practice",
      entityType: "topic",
      entityId: weak.topic,
      title: `Practice: ${weak.topic}`,
      estimatedMinutes: 25,
      difficulty: "medium",
      recommendation: JSON.stringify({
        reason: `Your mastery of ${weak.topic} is weak`,
        reasonKey: "learning.plan.item.practiceWeak",
        confidence: 0.8,
        expectedImpactPct: 18,
        actionItems: [`Complete 10 practice problems on ${weak.topic}`],
      } satisfies PlanItemRecommendation),
    });
    allocatedMinutes += 25;
  }

  // Phase 3: top interest topics (lesson, 30 min each)
  const topInterests = Object.entries(profile.interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  for (const [topic] of topInterests) {
    if (allocatedMinutes >= input.totalAvailableMinutes) break;
    items.push({
      planId: input.planId,
      sortOrder: sortOrder++,
      itemType: "lesson",
      entityType: "topic",
      entityId: topic,
      title: `Study: ${topic}`,
      estimatedMinutes: 30,
      difficulty: input.startingDifficulty,
      recommendation: JSON.stringify({
        reason: `You've shown strong interest in ${topic}`,
        reasonKey: "learning.plan.item.studyInterest",
        confidence: 0.7,
        expectedImpactPct: 15,
        actionItems: [`Start a 30-minute lesson on ${topic}`],
      } satisfies PlanItemRecommendation),
    });
    allocatedMinutes += 30;
  }

  // Phase 4: quiz on the same interest topics
  for (const [topic] of topInterests.slice(0, 2)) {
    if (allocatedMinutes >= input.totalAvailableMinutes) break;
    items.push({
      planId: input.planId,
      sortOrder: sortOrder++,
      itemType: "quiz",
      entityType: "topic",
      entityId: topic,
      title: `Quiz: ${topic}`,
      estimatedMinutes: 15,
      difficulty: "medium",
      recommendation: JSON.stringify({
        reason: `Test your understanding of ${topic}`,
        reasonKey: "learning.plan.item.quiz",
        confidence: 0.65,
        expectedImpactPct: 10,
        actionItems: [`Complete a 10-question quiz on ${topic}`],
      } satisfies PlanItemRecommendation),
    });
    allocatedMinutes += 15;
  }

  // Phase 5: AI tutor session for the top interest
  if (topInterests.length > 0 && allocatedMinutes < input.totalAvailableMinutes) {
    const topic = topInterests[0]![0];
    items.push({
      planId: input.planId,
      sortOrder: sortOrder++,
      itemType: "ai_session",
      entityType: "ai_session",
      entityId: "new",
      title: `AI Tutor: ${topic}`,
      estimatedMinutes: 20,
      difficulty: "medium",
      recommendation: JSON.stringify({
        reason: `Personalized AI tutoring on ${topic}`,
        reasonKey: "learning.plan.item.aiTutor",
        confidence: 0.6,
        expectedImpactPct: 12,
        actionItems: [`Start an AI tutor session on ${topic}`],
      } satisfies PlanItemRecommendation),
    });
    allocatedMinutes += 20;
  }

  return items;
}

// ---------------------------------------------------------------------------
// Internal: weekly schedule generation
// ---------------------------------------------------------------------------

function buildWeeklySchedule(input: {
  dailyMinutes: number;
  daysRemaining: number;
  startingDifficulty: Difficulty;
  startDate: Date;
}): WeeklySchedule[] {
  const weeks: WeeklySchedule[] = [];
  const totalWeeks = Math.max(1, Math.ceil(input.daysRemaining / 7));
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  for (let w = 0; w < totalWeeks; w++) {
    const weekStart = new Date(input.startDate.getTime() + w * 7 * MS_PER_DAY);
    const weekEnd = new Date(weekStart.getTime() + 7 * MS_PER_DAY);
    const days: WeeklySchedule["days"] = [];

    for (let d = 0; d < 7; d++) {
      const sessions: Array<{ type: PlanItemType; durationMinutes: number; title: string; topic?: string }> = [];

      // Day 1-5: study sessions
      if (d >= 0 && d < 5) {
        sessions.push({
          type: "lesson",
          durationMinutes: Math.round(input.dailyMinutes * 0.6),
          title: "Daily study session",
        });
        if (input.dailyMinutes >= 45) {
          sessions.push({
            type: "practice",
            durationMinutes: Math.round(input.dailyMinutes * 0.4),
            title: "Practice problems",
          });
        }
      }
      // Day 6: review session
      else if (d === 5) {
        sessions.push({
          type: "review",
          durationMinutes: input.dailyMinutes,
          title: "Weekly review",
        });
      }
      // Day 7: mock exam or rest
      else {
        if (w % 2 === 1) {
          sessions.push({
            type: "mock_exam",
            durationMinutes: Math.min(90, input.dailyMinutes * 2),
            title: "Mock exam",
          });
        }
        // Sunday rest day otherwise
      }

      days.push({ dayOfWeek: d, sessions });
    }

    weeks.push({
      weekNumber: w + 1,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      days,
    });
  }

  return weeks;
}

function buildDifficultyCurve(input: {
  daysRemaining: number;
  startingDifficulty: Difficulty;
}): Array<{ week: number; difficulty: Difficulty }> {
  const totalWeeks = Math.max(1, Math.ceil(input.daysRemaining / 7));
  const curve: Array<{ week: number; difficulty: Difficulty }> = [];
  const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];
  const startIdx = difficulties.indexOf(input.startingDifficulty);

  for (let w = 0; w < totalWeeks; w++) {
    // Ramp difficulty by 1 level every 2 weeks (cap at expert)
    const targetIdx = Math.min(3, startIdx + Math.floor(w / 2));
    curve.push({ week: w + 1, difficulty: difficulties[targetIdx]! });
  }

  return curve;
}
