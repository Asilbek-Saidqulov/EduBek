/**
 * GET /api/learning/analytics — Learning analytics dashboard data
 *
 * Returns aggregated analytics including:
 *   • Total study time, retention, mastery avg, difficulty trend
 *   • Review success rate, recommendation acceptance, AI usage
 *   • Goal completion %, velocity score
 *   • Burnout report, streak intelligence
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { db } from "@/lib/db";
import {
  detectBurnout,
  computeStreakIntelligence,
  computeWeeklyVelocity,
} from "@/features/learning-planner";
import { z } from "zod";

const schema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const { days } = schema.parse(params);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Pull study sessions for the time range
  const sessions = await db.studySession.findMany({
    where: { userId: ctx.userId, startedAt: { gte: since, lte: now } },
    select: {
      durationMs: true,
      accuracy: true,
      difficulty: true,
      sessionType: true,
      startedAt: true,
      metadata: true,
    },
    orderBy: { startedAt: "asc" },
  });

  // Pull review history
  const reviews = await db.reviewHistory.findMany({
    where: { userId: ctx.userId, createdAt: { gte: since } },
    select: { quality: true, correct: true, createdAt: true },
  });

  // Compute aggregates
  const totalStudyTimeMs = sessions.reduce((s, x) => s + x.durationMs, 0);
  const quizSessions = sessions.filter((s) => s.sessionType === "quiz" || s.sessionType === "practice");
  const masteryAvg = quizSessions.length > 0
    ? quizSessions.reduce((s, x) => s + (x.accuracy ?? 0), 0) / quizSessions.length
    : 0;
  const reviewSuccessRate = reviews.length > 0
    ? reviews.filter((r) => r.correct).length / reviews.length
    : 0;

  // Retention rate = 1 - avg forgetting score across all review schedules
  const reviewSchedules = await db.reviewSchedule.findMany({
    where: { userId: ctx.userId },
    select: { forgettingScore: true },
  });
  const retentionRate = reviewSchedules.length > 0
    ? 1 - reviewSchedules.reduce((s, x) => s + x.forgettingScore, 0) / reviewSchedules.length
    : 1;

  // Difficulty trend — average per day
  const dayToDifficulty = new Map<string, number[]>();
  for (const s of sessions) {
    if (!s.difficulty) continue;
    const day = s.startedAt.toISOString().slice(0, 10);
    const num = s.difficulty === "easy" ? 1 : s.difficulty === "medium" ? 2 : s.difficulty === "hard" ? 3 : 4;
    if (!dayToDifficulty.has(day)) dayToDifficulty.set(day, []);
    dayToDifficulty.get(day)!.push(num);
  }
  const difficultyTrend = Array.from(dayToDifficulty.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, nums]) => ({
      day,
      difficulty: nums.reduce((s, x) => s + x, 0) / nums.length,
    }));

  const aiUsageCount = sessions.filter((s) => s.sessionType === "ai_tutor").length;

  // Goal completion %
  const activeGoals = await db.learningGoal.findMany({
    where: { userId: ctx.userId, status: "active" },
    select: { completionPct: true },
  });
  const goalCompletionPct = activeGoals.length > 0
    ? activeGoals.reduce((s, g) => s + g.completionPct, 0) / activeGoals.length
    : 0;

  // Recommendation acceptance — count events from semantic-search
  let recommendationAcceptance = 0;
  try {
    const recEvents = await db.searchSession.findMany({
      where: {
        userId: ctx.userId,
        query: { startsWith: "__rec:" },
        createdAt: { gte: since },
      },
      select: { query: true },
    });
    const impressions = recEvents.filter((e) => e.query === "__rec:impression").length;
    const clicks = recEvents.filter((e) => e.query === "__rec:click" || e.query === "__rec:open").length;
    recommendationAcceptance = impressions > 0 ? clicks / impressions : 0;
  } catch {
    // Fall back to 0 if SearchSession table is not queryable.
  }

  // Burnout + streak + velocity
  const burnout = await detectBurnout(ctx.userId);
  const streak = await computeStreakIntelligence(ctx.userId);
  const velocity = await computeWeeklyVelocity(ctx.userId);

  // Velocity score — composite from consistency and mastery gain
  const velocityScore = (velocity.consistency * 0.5) + (Math.min(1, velocity.masteryGained) * 0.5);

  // Persist a daily analytics snapshot for fast subsequent queries
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await db.learningAnalyticsSnapshot.upsert({
      where: { userId_day: { userId: ctx.userId, day: today } },
      create: {
        userId: ctx.userId,
        day: today,
        studyTimeMs: totalStudyTimeMs,
        reviewCount: reviews.length,
        reviewSuccessRate,
        masteryAvg,
        difficultyAvg: difficultyTrend.length > 0
          ? difficultyTrend[difficultyTrend.length - 1]!.difficulty
          : 0,
        recommendationAcceptance,
        aiUsageCount,
        goalCompletionPct,
        velocityScore,
      },
      update: {
        studyTimeMs: totalStudyTimeMs,
        reviewCount: reviews.length,
        reviewSuccessRate,
        masteryAvg,
        difficultyAvg: difficultyTrend.length > 0
          ? difficultyTrend[difficultyTrend.length - 1]!.difficulty
          : 0,
        recommendationAcceptance,
        aiUsageCount,
        goalCompletionPct,
        velocityScore,
      },
    });
  } catch {
    // Best-effort snapshot persistence.
  }

  return NextResponse.json({
    userId: ctx.userId,
    range: { from: since.toISOString(), to: now.toISOString() },
    totalStudyTimeMs,
    retentionRate,
    masteryAvg,
    difficultyTrend,
    reviewSuccessRate,
    recommendationAcceptance,
    aiUsageCount,
    goalCompletionPct,
    velocityScore,
    burnout,
    streak,
    velocity,
  });
});
