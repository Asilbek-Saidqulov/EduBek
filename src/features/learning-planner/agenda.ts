/**
 * EduBek — Daily Learning Agenda.
 *
 * Phase 4F.3: Generates today's prioritized learning agenda by combining:
 *
 *   1. Due spaced-repetition reviews (highest priority — memory decays)
 *   2. Next pending plan item from the learner's active study plan
 *   3. AI Coach recommendations (weak topics, prerequisites, AI tutor)
 *   4. Burnout-aware pacing — when burnout is detected, lighter items
 *      float to the top and a take_break item is inserted.
 *
 * Performance target: < 30ms per call (cached). The agenda is cached
 * for 5 minutes via the existing RecommendationCache (Phase 4F.2) —
 * repeated calls within that window hit the cache.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { generateCoachRecommendations } from "./ai-coach";
import { detectBurnout } from "./velocity";
import { findFreshRecommendationCache, upsertRecommendationCache } from "@/features/semantic-search/repository";
import type { DailyAgenda, DailyAgendaItem } from "./types";

const log = getLogger("agenda");
const AGENDA_TTL_SECONDS = 300; // 5 minutes

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function getDailyAgenda(userId: string, locale = "en"): Promise<DailyAgenda> {
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `agenda:${today}`;

  // Check cache
  try {
    const cached = await findFreshRecommendationCache(userId, cacheKey, locale);
    if (cached) {
      const parsed = JSON.parse(cached.recommendations) as DailyAgenda;
      if (parsed.items && parsed.items.length >= 0) {
        return parsed;
      }
    }
  } catch {
    // Fall through to recompute.
  }

  // Compute fresh
  const agenda = await computeDailyAgenda(userId, locale, today);

  // Cache
  try {
    await upsertRecommendationCache({
      userId,
      strategy: cacheKey,
      locale,
      recommendations: JSON.stringify(agenda),
      expiresAt: new Date(Date.now() + AGENDA_TTL_SECONDS * 1000),
    });
  } catch (err) {
    log.warn("agenda.cache_failed", { error: (err as Error).message });
  }

  return agenda;
}

// ---------------------------------------------------------------------------
// Aggregator
// ---------------------------------------------------------------------------

async function computeDailyAgenda(userId: string, locale: string, today: string): Promise<DailyAgenda> {
  const items: DailyAgendaItem[] = [];
  const now = new Date();

  // 1. Burnout detection — affects priority ordering
  const burnout = await detectBurnout(userId).catch(() => null);

  // 2. Due reviews (highest priority)
  const dueReviews = await repo.findDueReviews(userId, now, 20);
  for (const review of dueReviews.slice(0, 5)) {
    items.push({
      itemType: "review",
      entityType: review.entityType,
      entityId: review.entityId,
      title: `Review: ${review.entityType}/${review.entityId}`,
      estimatedMinutes: 5,
      difficulty: "medium",
      reason: "Spaced-repetition review due now",
      reasonKey: "learning.agenda.reviewDue",
      priority: burnout?.isBurnout ? 3 : 1,
    });
  }

  // 3. Next pending plan item
  const activePlan = await repo.findActivePlanForUser(userId);
  if (activePlan) {
    const nextItem = await repo.findNextPendingPlanItem(activePlan.id);
    if (nextItem) {
      items.push({
        itemType: nextItem.itemType as any,
        entityType: nextItem.entityType,
        entityId: nextItem.entityId,
        title: nextItem.title,
        estimatedMinutes: nextItem.estimatedMinutes,
        difficulty: nextItem.difficulty as any,
        reason: "Next item in your study plan",
        reasonKey: "learning.agenda.nextPlanItem",
        priority: burnout?.isBurnout ? 4 : 2,
        planItemId: nextItem.id,
        planId: activePlan.id,
      });
    }
  }

  // 4. AI Coach recommendations
  const coachRecs = await generateCoachRecommendations({
    userId,
    locale,
    burnout: burnout ?? undefined,
    limit: 5,
  });
  for (const rec of coachRecs) {
    // Map coach recommendation types to agenda item types.
    let itemType: DailyAgendaItem["itemType"] = "practice";
    if (rec.type === "ai_tutor_session") itemType = "ai_session";
    else if (rec.type === "review_prerequisite" || rec.type === "review_forgotten") itemType = "review";
    else if (rec.type === "mock_exam") itemType = "mock_exam";
    else if (rec.type === "marketplace_resource") itemType = "marketplace";

    items.push({
      itemType,
      entityType: rec.entityType,
      entityId: rec.entityId,
      title: rec.title,
      estimatedMinutes: rec.estimatedMinutes,
      difficulty: "medium",
      reason: rec.reason,
      reasonKey: rec.reasonKey,
      priority: rec.priority + 2, // Coach recs are lower priority than due reviews / plan items
    });
  }

  // Sort by priority
  items.sort((a, b) => a.priority - b.priority);

  // Compute remaining study time from today's sessions
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const todaySessions = await db.studySession.findMany({
    where: { userId, startedAt: { gte: startOfDay } },
    select: { durationMs: true },
  });
  const studiedMs = todaySessions.reduce((s, x) => s + x.durationMs, 0);
  const studiedMin = studiedMs / 60_000;

  // Get user's daily goal (default 45 min)
  const goal = await db.learningGoal.findFirst({
    where: { userId, status: "active" },
    select: { constraints: true },
  });
  let dailyGoalMin = 45;
  if (goal) {
    try {
      const constraints = JSON.parse(goal.constraints || "{}");
      if (constraints.dailyMinutes) dailyGoalMin = constraints.dailyMinutes;
    } catch {
      // Use default
    }
  }
  const studyMinutesRemaining = Math.max(0, dailyGoalMin - studiedMin);

  // Energy estimate: average of recent session energy values
  const recentEnergy = await db.studySession.findMany({
    where: { userId, energy: { not: null } },
    select: { energy: true },
    orderBy: { startedAt: "desc" },
    take: 5,
  });
  const energyEstimate = recentEnergy.length > 0
    ? Math.round(recentEnergy.reduce((s, x) => s + (x.energy ?? 3), 0) / recentEnergy.length)
    : 3;

  // Completion %
  const completionPct = dailyGoalMin > 0 ? Math.min(100, Math.round((studiedMin / dailyGoalMin) * 100)) : 0;

  const totalEstimatedMinutes = items.reduce((s, x) => s + x.estimatedMinutes, 0);

  return {
    userId,
    date: today,
    items,
    reviewsDue: dueReviews.length,
    studyMinutesRemaining: Math.round(studyMinutesRemaining),
    completionPct,
    energyEstimate,
    totalEstimatedMinutes,
  };
}
