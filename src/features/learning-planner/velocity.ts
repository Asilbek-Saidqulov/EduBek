/**
 * EduBek — Learning Velocity, Burnout Detection, and Streak Intelligence.
 *
 * Phase 4F.3: Computes weekly velocity metrics, detects learner burnout,
 * and tracks multiple streak dimensions (day / quality / effective /
 * mastery / review).
 *
 * Velocity is computed by aggregating StudySession rows for the trailing
 * 7 days and persisting a LearningVelocitySnapshot. Burnout detection
 * evaluates five factors and returns a severity level.
 *
 * Streak intelligence extends the existing single-day streak (from the
 * Progress feature) with quality-aware and review-aware variants.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  BurnoutReport,
  LearningVelocityDto,
  StreakIntelligence,
} from "./types";

const log = getLogger("velocity");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// Velocity
// ---------------------------------------------------------------------------

/**
 * Compute and persist the velocity snapshot for the current ISO week.
 *
 * Returns the DTO. Safe to call repeatedly — upserts on (userId, weekStart).
 */
export async function computeWeeklyVelocity(userId: string): Promise<LearningVelocityDto> {
  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart.getTime() + 7 * MS_PER_DAY);

  // Pull all study sessions for the trailing 7 days.
  const sessions = await db.studySession.findMany({
    where: {
      userId,
      startedAt: { gte: weekStart, lt: weekEnd },
    },
    select: {
      durationMs: true,
      accuracy: true,
      sessionType: true,
      startedAt: true,
      metadata: true,
    },
  });

  // Aggregate metrics
  const minutesStudied = sessions.reduce((sum, s) => sum + s.durationMs, 0) / 60_000;
  const conceptsLearned = sessions.filter((s) => s.sessionType === "study").length;
  const quizSessions = sessions.filter((s) => s.sessionType === "quiz" || s.sessionType === "practice");
  const masteryGained = quizSessions.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) / Math.max(1, quizSessions.length);

  // Quiz improvement: compare first-half avg vs second-half avg accuracy.
  const sortedByTime = [...quizSessions].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
  );
  const half = Math.floor(sortedByTime.length / 2);
  const firstHalf = sortedByTime.slice(0, half);
  const secondHalf = sortedByTime.slice(half);
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, x) => s + (x.accuracy ?? 0), 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, x) => s + (x.accuracy ?? 0), 0) / secondHalf.length : 0;
  const quizImprovement = secondAvg - firstAvg;

  // Consistency: fraction of days (out of 7) with at least one session.
  const studiedDays = new Set<string>();
  for (const s of sessions) {
    studiedDays.add(startOfDay(s.startedAt).toISOString());
  }
  const consistency = studiedDays.size / 7;

  // Drop-off probability: heuristic. Higher when consistency is low and
  // mastery gain is low. Bounded to [0, 1].
  const dropOffProbability = clamp01(
    0.5 * (1 - consistency) + 0.3 * (1 - clamp01(masteryGained)) + 0.2 * (sessions.length === 0 ? 1 : 0),
  );

  // Per-day minutes for the trailing 7 days.
  const dailyMinutes: Array<{ day: string; minutes: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(weekEnd.getTime() - (i + 1) * MS_PER_DAY);
    const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);
    const dayMinutes = sessions
      .filter((s) => s.startedAt >= dayStart && s.startedAt < dayEnd)
      .reduce((sum, s) => sum + s.durationMs, 0) / 60_000;
    dailyMinutes.push({
      day: dayStart.toISOString().slice(0, 10),
      minutes: Math.round(dayMinutes),
    });
  }

  // Persist snapshot
  await repo.upsertVelocitySnapshot({
    userId,
    weekStart,
    conceptsLearned,
    minutesStudied: Math.round(minutesStudied),
    masteryGained: round(masteryGained, 4),
    quizImprovement: round(quizImprovement, 4),
    consistency: round(consistency, 4),
    dropOffProbability: round(dropOffProbability, 4),
  });

  log.info("velocity.computed", {
    userId,
    minutes: Math.round(minutesStudied),
    consistency,
    dropOffProbability,
  });

  return {
    userId,
    weekStart: weekStart.toISOString(),
    conceptsLearned,
    minutesStudied: Math.round(minutesStudied),
    masteryGained: round(masteryGained, 4),
    quizImprovement: round(quizImprovement, 4),
    consistency: round(consistency, 4),
    dropOffProbability: round(dropOffProbability, 4),
    dailyMinutes,
  };
}

/**
 * Fetch historical velocity snapshots for trend analysis.
 */
export async function getVelocityHistory(userId: string, weeks = 12): Promise<LearningVelocityDto[]> {
  const rows = await repo.findVelocitySnapshots(userId, weeks);
  return rows.map((r: any) => ({
    userId: r.userId,
    weekStart: r.weekStart.toISOString(),
    conceptsLearned: r.conceptsLearned,
    minutesStudied: r.minutesStudied,
    masteryGained: r.masteryGained,
    quizImprovement: r.quizImprovement,
    consistency: r.consistency,
    dropOffProbability: r.dropOffProbability,
    dailyMinutes: [],
  }));
}

// ---------------------------------------------------------------------------
// Burnout Detection
// ---------------------------------------------------------------------------

export async function detectBurnout(userId: string): Promise<BurnoutReport> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - MS_PER_DAY);
  const weekAgo = new Date(now.getTime() - 7 * MS_PER_DAY);

  // Sessions in last 24h
  const recentSessions = await db.studySession.findMany({
    where: { userId, startedAt: { gte: dayAgo } },
    select: { durationMs: true, accuracy: true, startedAt: true, sessionType: true },
  });

  // Sessions in last 7 days
  const weekSessions = await db.studySession.findMany({
    where: { userId, startedAt: { gte: weekAgo } },
    select: { durationMs: true, accuracy: true, startedAt: true, sessionType: true },
  });

  // Factor 1: too many sessions in 24h (>6 = triggered)
  const sessionCount24h = recentSessions.length;
  const sessionThreshold = 6;
  const f1Triggered = sessionCount24h > sessionThreshold;

  // Factor 2: long total session time in 24h (>240 min = triggered)
  const totalMinutes24h = recentSessions.reduce((s, x) => s + x.durationMs, 0) / 60_000;
  const longThreshold = 240;
  const f2Triggered = totalMinutes24h > longThreshold;

  // Factor 3: low performance — avg accuracy below 0.5 over last 5 sessions
  const last5 = [...weekSessions].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()).slice(0, 5);
  const avgAccuracy = last5.length > 0 ? last5.reduce((s, x) => s + (x.accuracy ?? 0), 0) / last5.length : 0;
  const lowPerformanceThreshold = 0.5;
  const f3Triggered = avgAccuracy < lowPerformanceThreshold && last5.length >= 3;

  // Factor 4: decreasing accuracy — last 3 sessions worse than previous 3
  const last6 = [...weekSessions].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()).slice(0, 6);
  const recent3 = last6.slice(0, 3);
  const prior3 = last6.slice(3, 6);
  const recentAvg = recent3.length > 0 ? recent3.reduce((s, x) => s + (x.accuracy ?? 0), 0) / recent3.length : 0;
  const priorAvg = prior3.length > 0 ? prior3.reduce((s, x) => s + (x.accuracy ?? 0), 0) / prior3.length : 0;
  const decrease = priorAvg - recentAvg;
  const f4Triggered = decrease > 0.15 && prior3.length >= 2;

  // Factor 5: any single session over 90 minutes (fatigue)
  const longSessionThreshold = 90 * 60_000; // 90 min in ms
  const f5Triggered = recentSessions.some((s) => s.durationMs > longSessionThreshold);

  const factors = [
    { factor: "Too many sessions in 24h", factorKey: "learning.burnout.factor.sessionCount", value: sessionCount24h, threshold: sessionThreshold, triggered: f1Triggered },
    { factor: "Long total study time in 24h", factorKey: "learning.burnout.factor.longTime", value: Math.round(totalMinutes24h), threshold: longThreshold, triggered: f2Triggered },
    { factor: "Low recent performance", factorKey: "learning.burnout.factor.lowPerformance", value: round(avgAccuracy, 2), threshold: lowPerformanceThreshold, triggered: f3Triggered },
    { factor: "Decreasing accuracy", factorKey: "learning.burnout.factor.decreasingAccuracy", value: round(decrease, 2), threshold: 0.15, triggered: f4Triggered },
    { factor: "Long single session", factorKey: "learning.burnout.factor.longSession", value: recentSessions.some((s) => s.durationMs > longSessionThreshold) ? 1 : 0, threshold: 1, triggered: f5Triggered },
  ];

  const triggeredCount = factors.filter((f) => f.triggered).length;
  let severity: BurnoutReport["severity"] = "none";
  let isBurnout = false;
  if (triggeredCount >= 4) {
    severity = "severe";
    isBurnout = true;
  } else if (triggeredCount >= 3) {
    severity = "moderate";
    isBurnout = true;
  } else if (triggeredCount >= 2) {
    severity = "mild";
    isBurnout = false;
  }

  const recommendations: BurnoutReport["recommendations"] = [];
  if (isBurnout) {
    recommendations.push({
      text: "Take a 15-minute break before continuing.",
      textKey: "learning.burnout.rec.takeBreak",
    });
    recommendations.push({
      text: "Switch to lighter content or a review session.",
      textKey: "learning.burnout.rec.lighterContent",
    });
    recommendations.push({
      text: "Avoid starting new material today.",
      textKey: "learning.burnout.rec.noNewMaterial",
    });
  } else if (severity === "mild") {
    recommendations.push({
      text: "Consider a short break or review session.",
      textKey: "learning.burnout.rec.shortBreak",
    });
  }

  return {
    isBurnout,
    severity,
    factors,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// Streak Intelligence
// ---------------------------------------------------------------------------

/**
 * Compute multi-dimensional streak intelligence.
 *
 *   • dayStreak       — consecutive days with any study session
 *   • qualityStreak   — consecutive sessions with accuracy ≥ 0.7
 *   • effectiveStreak — consecutive days with ≥ 15 minutes of study
 *   • masteryStreak   — consecutive sessions that increased mastery
 *   • reviewStreak    — consecutive days with at least one completed review
 *   • longestStreak   — longest historical dayStreak (from Progress feature)
 */
export async function computeStreakIntelligence(userId: string): Promise<StreakIntelligence> {
  // Get sessions from the last 60 days for streak analysis.
  const sixtyDaysAgo = new Date(Date.now() - 60 * MS_PER_DAY);
  const sessions = await db.studySession.findMany({
    where: { userId, startedAt: { gte: sixtyDaysAgo } },
    select: { startedAt: true, accuracy: true, durationMs: true, sessionType: true, metadata: true },
    orderBy: { startedAt: "desc" },
  });

  // --- Day streak ---
  const studiedDays = new Set<string>();
  for (const s of sessions) {
    studiedDays.add(startOfDay(s.startedAt).toISOString());
  }
  const dayStreak = computeDayStreakFromSet(studiedDays);

  // --- Quality streak (consecutive sessions with accuracy ≥ 0.7) ---
  let qualityStreak = 0;
  for (const s of sessions) {
    if (s.accuracy !== null && s.accuracy >= 0.7) {
      qualityStreak += 1;
    } else if (s.accuracy !== null) {
      break;
    }
  }

  // --- Effective streak (consecutive days with ≥ 15 min of study) ---
  const dayToMinutes = new Map<string, number>();
  for (const s of sessions) {
    const day = startOfDay(s.startedAt).toISOString();
    dayToMinutes.set(day, (dayToMinutes.get(day) ?? 0) + s.durationMs / 60_000);
  }
  let effectiveStreak = 0;
  let cursor = startOfDay();
  while (true) {
    const key = cursor.toISOString();
    if ((dayToMinutes.get(key) ?? 0) >= 15) {
      effectiveStreak += 1;
      cursor = new Date(cursor.getTime() - MS_PER_DAY);
    } else {
      // Allow today to be incomplete without breaking the streak.
      if (cursor.toISOString() === startOfDay().toISOString()) {
        cursor = new Date(cursor.getTime() - MS_PER_DAY);
        continue;
      }
      break;
    }
  }

  // --- Mastery streak (consecutive sessions that increased mastery) ---
  // We approximate by counting consecutive sessions where accuracy > 0.6.
  let masteryStreak = 0;
  for (const s of sessions) {
    if (s.accuracy !== null && s.accuracy > 0.6) {
      masteryStreak += 1;
    } else if (s.accuracy !== null) {
      break;
    }
  }

  // --- Review streak (consecutive days with at least one completed review) ---
  const reviewDays = new Set<string>();
  const reviewSessions = sessions.filter((s) => s.sessionType === "review");
  for (const s of reviewSessions) {
    reviewDays.add(startOfDay(s.startedAt).toISOString());
  }
  const reviewStreak = computeDayStreakFromSet(reviewDays);

  // --- Longest streak (from Progress feature if available, else 0) ---
  let longestStreak = dayStreak;
  try {
    const { getLearningStreak } = await import("@/features/progress");
    // Build a minimal AuthContext to satisfy the signature.
    const { buildContext } = await import("@/features/rbac");
    const ctx = buildContext({
      userId,
      email: undefined,
      locale: undefined,
      platformRoles: [],
    });
    const progress = await getLearningStreak(ctx);
    if (progress?.longestStreak) {
      longestStreak = Math.max(longestStreak, progress.longestStreak);
    }
  } catch {
    // Progress feature not available — fall back to current streak.
  }

  return {
    dayStreak,
    qualityStreak,
    effectiveStreak,
    masteryStreak,
    reviewStreak,
    longestStreak,
  };
}

function computeDayStreakFromSet(studiedDays: Set<string>): number {
  if (studiedDays.size === 0) return 0;
  let streak = 0;
  let cursor = startOfDay();
  // Allow today to be incomplete (no study yet today shouldn't break the streak).
  if (!studiedDays.has(cursor.toISOString())) {
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }
  while (studiedDays.has(cursor.toISOString())) {
    streak += 1;
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }
  return streak;
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
