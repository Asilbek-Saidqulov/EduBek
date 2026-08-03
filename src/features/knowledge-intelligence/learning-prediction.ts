/**
 * EduBek — Learning Outcome Prediction.
 *
 * Phase 4F.5: Predicts learning outcomes for a (user, entity) pair:
 *
 *   • Predicted quiz score (0-1)
 *   • Predicted completion probability (0-1)
 *   • Predicted dropout probability (0-1)
 *   • Predicted mastery probability (0-1)
 *   • Predicted study time (minutes)
 *   • Intervention needed (boolean) + reason
 *
 * Predictions use a weighted blend of signals from prior phases:
 *
 *   • Accuracy (Phase 4F.3 study sessions)
 *   • Streak (Phase 4F.3 streak intelligence)
 *   • Mastery (Phase 4F.2 interest profile + Phase 4F.5 concept mastery)
 *   • Velocity (Phase 4F.3 weekly velocity)
 *   • Engagement (Phase 4F.4 classroom engagement rate)
 *   • Difficulty match (Phase 4F.3 adaptive difficulty)
 *
 * The predictor is deterministic for Phase 4F.5 — a heuristic model.
 * A future phase can plug in an LLM or ML model without changing the
 * DTO shape.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { getInterestProfile } from "@/features/semantic-search";
import { computeStreakIntelligence } from "@/features/learning-planner";
import type { LearningPredictionDto, PredictionSignals } from "./types";

const log = getLogger("learning-prediction");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function predictLearningOutcome(input: {
  userId: string;
  entityType: string; // 'quiz' | 'assessment' | 'resource' | 'plan'
  entityId: string;
}): Promise<LearningPredictionDto> {
  const { userId, entityType, entityId } = input;

  // Gather signals in parallel
  const [profile, streak, recentSessions, conceptMasteries] = await Promise.all([
    getInterestProfile(userId).catch(() => null),
    computeStreakIntelligence(userId).catch(() => ({
      dayStreak: 0, qualityStreak: 0, effectiveStreak: 0,
      masteryStreak: 0, reviewStreak: 0, longestStreak: 0,
    })),
    db.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 10,
      select: { accuracy: true, durationMs: true, sessionType: true, startedAt: true },
    }).catch(() => []),
    db.conceptMastery.findMany({
      where: { userId },
      select: { mastery: true, level: true },
      take: 100,
    }).catch(() => []),
  ]);

  // Compute composite signals
  const recentAccuracies = recentSessions
    .filter((s: any) => s.accuracy !== null)
    .map((s: any) => s.accuracy as number);
  const accuracy = recentAccuracies.length > 0
    ? recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length
    : 0.5;
  const streakSignal = Math.min(1, streak.dayStreak / 14); // 14-day streak = full signal

  const masteredCount = conceptMasteries.filter((m: any) => m.level === "mastered").length;
  const weakCount = conceptMasteries.filter((m: any) => m.level === "weak").length;
  const masterySignal = conceptMasteries.length > 0 ? masteredCount / conceptMasteries.length : 0.5;

  const recentSessionCount = recentSessions.length;
  const engagementSignal = Math.min(1, recentSessionCount / 10);

  // Velocity signal — average daily minutes over last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentMinutes = recentSessions
    .filter((s: any) => s.startedAt >= sevenDaysAgo)
    .reduce((sum: number, s: any) => sum + s.durationMs, 0) / 60_000;
  const velocitySignal = Math.min(1, recentMinutes / (7 * 45)); // 45 min/day = full signal

  const signals: PredictionSignals = {
    accuracy: round(accuracy, 3),
    streak: streak.dayStreak,
    mastery: round(masterySignal, 3),
    velocity: round(velocitySignal, 3),
    engagement: round(engagementSignal, 3),
    modelVersion: "edubek-predict-v1",
  };

  // --- Predicted quiz score ---
  // Blend: accuracy (0.5) + mastery (0.3) + streak (0.2)
  const predictedScore = clamp01(
    0.5 * accuracy + 0.3 * masterySignal + 0.2 * streakSignal,
  );

  // --- Predicted completion ---
  // Higher for engaged learners with good streaks
  const predictedCompletion = clamp01(
    0.4 * engagementSignal + 0.3 * streakSignal + 0.2 * velocitySignal + 0.1,
  );

  // --- Predicted dropout ---
  // Higher for low-engagement, low-streak learners
  const predictedDropout = clamp01(
    0.5 * (1 - engagementSignal) + 0.3 * (1 - streakSignal) + 0.2 * (1 - velocitySignal),
  );

  // --- Predicted mastery ---
  // Higher for learners with strong concept mastery on related concepts
  const predictedMastery = clamp01(
    0.4 * masterySignal + 0.3 * accuracy + 0.2 * streakSignal + 0.1 * velocitySignal,
  );

  // --- Predicted study time ---
  // Base 30 min + adjustments for difficulty (lower mastery → more time needed)
  const baseMinutes = entityType === "quiz" ? 15 : entityType === "assessment" ? 45 : 30;
  const masteryAdjustment = (1 - masterySignal) * 30; // up to +30 min for weak mastery
  const predictedStudyMinutes = Math.round(baseMinutes + masteryAdjustment);

  // --- Intervention needed? ---
  // Trigger if any of: low accuracy, high dropout, low mastery, weak concepts
  const lowAccuracy = accuracy < 0.5;
  const highDropout = predictedDropout > 0.6;
  const lowMastery = predictedMastery < 0.3;
  const manyWeak = weakCount >= 5;

  const interventionNeeded = lowAccuracy || highDropout || lowMastery || manyWeak;
  const interventionReasons: string[] = [];
  if (lowAccuracy) interventionReasons.push("Recent quiz accuracy below 50%");
  if (highDropout) interventionReasons.push("High dropout probability (>60%)");
  if (lowMastery) interventionReasons.push("Low predicted mastery (<30%)");
  if (manyWeak) interventionReasons.push(`${weakCount} weak concepts identified`);

  const interventionReason = interventionReasons.length > 0
    ? interventionReasons.join("; ")
    : null;

  // --- Confidence ---
  // Higher confidence when we have more data
  const confidence = clamp01(
    0.3 +
    (recentSessions.length > 0 ? 0.2 : 0) +
    (conceptMasteries.length > 0 ? 0.2 : 0) +
    (streak.dayStreak > 0 ? 0.15 : 0) +
    (profile?.mastery && Object.keys(profile.mastery).length > 0 ? 0.15 : 0),
  );

  // Persist
  const row = await repo.upsertLearningPrediction({
    userId,
    entityType,
    entityId,
    predictedScore,
    predictedCompletion,
    predictedDropout,
    predictedMastery,
    predictedStudyMinutes,
    interventionNeeded,
    interventionReason,
    metadata: JSON.stringify(signals),
    confidence,
  });

  log.info("prediction.computed", {
    userId, entityType, entityId,
    predictedScore: round(predictedScore, 2),
    predictedDropout: round(predictedDropout, 2),
    interventionNeeded,
  });

  return {
    id: row.id,
    userId,
    entityType,
    entityId,
    predictedScore,
    predictedCompletion,
    predictedDropout,
    predictedMastery,
    predictedStudyMinutes,
    interventionNeeded,
    interventionReason,
    metadata: signals,
    confidence,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getPrediction(userId: string, entityType: string, entityId: string): Promise<LearningPredictionDto | null> {
  const row = await repo.findLearningPrediction(userId, entityType, entityId);
  if (!row) {
    // Compute fresh
    return predictLearningOutcome({ userId, entityType, entityId });
  }
  return {
    id: row.id,
    userId: row.userId,
    entityType: row.entityType,
    entityId: row.entityId,
    predictedScore: row.predictedScore,
    predictedCompletion: row.predictedCompletion,
    predictedDropout: row.predictedDropout,
    predictedMastery: row.predictedMastery,
    predictedStudyMinutes: row.predictedStudyMinutes,
    interventionNeeded: row.interventionNeeded,
    interventionReason: row.interventionReason,
    metadata: safeParseRecord(row.metadata),
    confidence: row.confidence,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listPredictionsForUser(userId: string, limit = 50): Promise<LearningPredictionDto[]> {
  const rows = await repo.findLearningPredictionsForUser(userId, limit);
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    entityType: row.entityType,
    entityId: row.entityId,
    predictedScore: row.predictedScore,
    predictedCompletion: row.predictedCompletion,
    predictedDropout: row.predictedDropout,
    predictedMastery: row.predictedMastery,
    predictedStudyMinutes: row.predictedStudyMinutes,
    interventionNeeded: row.interventionNeeded,
    interventionReason: row.interventionReason,
    metadata: safeParseRecord(row.metadata),
    confidence: row.confidence,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
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

function safeParseRecord(raw: string | null): PredictionSignals {
  if (!raw) return {};
  try { return JSON.parse(raw) as PredictionSignals; } catch { return {}; }
}
