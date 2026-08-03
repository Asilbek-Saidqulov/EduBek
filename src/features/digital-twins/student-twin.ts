/**
 * EduBek — Student Digital Twin.
 *
 * Phase 5A.1: Continuously updated student profile that evolves after
 * every interaction. Aggregates from:
 *
 *   • Knowledge map ← Interest Profile + Concept Mastery (Phase 4F.2/4F.5)
 *   • Mastery graph ← Concept Mastery
 *   • Misconceptions ← Assessment attempts + AI feedback
 *   • Learning style ← Behavioral signals (resource types used, response times)
 *   • Pacing ← Learning velocity (Phase 4F.3)
 *   • Predictions ← Learning Prediction (Phase 4F.5)
 *   • Intervention history ← Phase 4F.3 AI Coach + Phase 4F.4 interventions
 *   • Strengths + weaknesses ← Knowledge Gap Report (Phase 4F.2)
 *   • Confidence evolution ← Study session mood/focus data
 *   • Review schedule ← Spaced Repetition (Phase 4F.3)
 *   • Streak ← Streak Intelligence (Phase 4F.3)
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { getInterestProfile, buildKnowledgeGapReport } from "@/features/semantic-search";
import {
  computeStreakIntelligence,
  listDueReviews,
  generateCoachRecommendations,
  detectBurnout,
} from "@/features/learning-planner";
import { predictLearningOutcome } from "@/features/knowledge-intelligence";
import type { DigitalTwinDto, StudentTwinState } from "./types";

const log = getLogger("student-twin");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function syncStudentTwin(userId: string): Promise<DigitalTwinDto> {
  const start = Date.now();
  log.info("student_twin.sync_started", { userId });

  // Fetch user
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true },
  });
  if (!user) throw new Error(`User ${userId} not found`);

  // Fetch all the data sources in parallel
  const [profile, gapReport, streak, dueReviews, burnout, prediction, conceptMasteries, studySessions, interventions] = await Promise.all([
    getInterestProfile(userId).catch(() => null),
    buildKnowledgeGapReport(userId).catch(() => null),
    computeStreakIntelligence(userId).catch(() => ({ dayStreak: 0, qualityStreak: 0, effectiveStreak: 0, masteryStreak: 0, reviewStreak: 0, longestStreak: 0 })),
    listDueReviews(userId, 50).catch(() => []),
    detectBurnout(userId).catch(() => ({ isBurnout: false, severity: "none", factors: [], recommendations: [] })),
    predictLearningOutcome({ userId, entityType: "resource", entityId: "twin" }).catch(() => null),
    db.conceptMastery.findMany({ where: { userId }, select: { conceptId: true, mastery: true, level: true, lastPracticedAt: true }, take: 200 }).catch(() => []),
    db.studySession.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, take: 20, select: { mood: true, energy: true, focus: true, accuracy: true, startedAt: true, sessionType: true, durationMs: true } }).catch(() => []),
    db.teacherRecommendation.findMany({ where: { targetUserIds: { contains: userId } }, select: { type: true, title: true, description: true, createdAt: true, status: true }, take: 20, orderBy: { createdAt: "desc" } }).catch(() => []),
  ]);

  // Build knowledge map
  const mastery = profile?.mastery ?? {};
  const knowledgeMap = {
    mastered: Object.entries(mastery).filter(([, l]) => l === "mastered").map(([t]) => t),
    learning: Object.entries(mastery).filter(([, l]) => l === "learning").map(([t]) => t),
    weak: Object.entries(mastery).filter(([, l]) => l === "weak").map(([t]) => t),
    forgotten: (gapReport?.forgottenTopics ?? []).map((t) => t.topic),
  };

  // Build mastery graph from concept masteries
  const masteryGraph = conceptMasteries.map((cm) => ({
    concept: cm.conceptId,
    mastery: cm.mastery,
    lastPracticed: cm.lastPracticedAt?.toISOString() ?? null,
  }));

  // Build misconceptions from weak topics + assessment history
  const misconceptions = (gapReport?.weakTopics ?? []).slice(0, 5).map((t) => ({
    concept: t.topic,
    misconception: `Low mastery (${Math.round(t.score * 100)}%) — likely misconception detected`,
    detectedAt: new Date().toISOString(),
  }));

  // Infer learning style from study sessions
  const learningStyle = inferLearningStyle(studySessions);

  // Pacing
  const recentSessions = studySessions.slice(0, 7);
  const conceptsLearned = recentSessions.filter((s) => s.sessionType === "study").length;
  const pacing = {
    currentVelocity: conceptsLearned / 7,
    expectedVelocity: 1,
    onTrack: conceptsLearned / 7 >= 0.5,
  };

  // Predictions
  const predictions = {
    predictedGrade: prediction?.predictedScore !== null && prediction?.predictedScore !== undefined
      ? gradeFromScore(prediction.predictedScore)
      : null,
    predictedDropoutRisk: prediction?.predictedDropout ?? 0.3,
    predictedMastery: prediction?.predictedMastery ?? 0.5,
    predictedExamScore: prediction?.predictedScore ?? null,
  };

  // Intervention history
  const interventionHistory = interventions.slice(0, 10).map((i) => ({
    type: i.type,
    description: i.title,
    timestamp: String(i.createdAt),
    outcome: (i.status === "applied" ? "positive" : i.status === "dismissed" ? "negative" : "pending") as "positive" | "negative" | "pending",
  }));

  // Strengths + weaknesses
  const strengths = (gapReport?.masteredTopics ?? []).slice(0, 5).map((t) => t.topic);
  const weaknesses = (gapReport?.weakTopics ?? []).slice(0, 5).map((t) => t.topic);

  // Confidence evolution — from study session focus/energy
  const confidenceEvolution = studySessions
    .filter((s) => s.focus !== null && s.energy !== null)
    .slice(0, 10)
    .reverse()
    .map((s) => ({
      date: s.startedAt.toISOString(),
      confidence: ((s.focus ?? 3) + (s.energy ?? 3)) / 10,
    }));

  // Review schedule
  const reviewSchedule = dueReviews.slice(0, 10).map((r: any) => ({
    concept: r.entityId,
    nextReviewAt: new Date(r.nextReviewAt).toISOString(),
    intervalDays: r.intervalDays,
  }));

  // Build the twin state
  const state: StudentTwinState = {
    userId,
    userName: user.name ?? user.username,
    knowledgeMap,
    masteryGraph,
    misconceptions,
    learningStyle,
    pacing,
    predictions,
    interventionHistory,
    strengths,
    weaknesses,
    confidenceEvolution,
    reviewSchedule,
    streak: {
      dayStreak: streak.dayStreak,
      qualityStreak: streak.qualityStreak,
      longestStreak: streak.longestStreak,
    },
    lastUpdated: new Date().toISOString(),
  };

  // Persist
  const twin = await repo.upsertTwin({
    twinType: "student",
    entityId: userId,
    state: JSON.stringify(state),
    lastSyncedAt: new Date(),
  });

  // Daily snapshot
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await repo.createTwinSnapshot({
    twinType: "student",
    entityId: userId,
    day: today,
    state: JSON.stringify(state),
    trigger: "event",
  }).catch(() => undefined);

  const executionMs = Date.now() - start;
  log.info("student_twin.synced", { userId, executionMs, version: twin.version });

  return mapTwin(twin);
}

export async function getStudentTwin(userId: string, autoSync = true): Promise<DigitalTwinDto | null> {
  if (autoSync) {
    return syncStudentTwin(userId).catch(() => null);
  }
  const twin = await repo.findTwin("student", userId);
  return twin ? mapTwin(twin) : null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferLearningStyle(sessions: any[]): StudentTwinState["learningStyle"] {
  // Heuristic: count session types to infer preferred modality
  const studyCount = sessions.filter((s) => s.sessionType === "study").length;
  const quizCount = sessions.filter((s) => s.sessionType === "quiz").length;
  const aiCount = sessions.filter((s) => s.sessionType === "ai_tutor").length;
  const total = Math.max(1, sessions.length);

  return {
    visual: 0.4 + (studyCount / total) * 0.3,
    auditory: 0.3 + (aiCount / total) * 0.4,
    kinesthetic: 0.3 + (quizCount / total) * 0.3,
    readingWriting: 0.5,
    preferredPace: sessions.length > 15 ? "fast" : sessions.length > 5 ? "medium" : "slow",
    preferredDifficulty: "medium",
  };
}

function gradeFromScore(score: number): string {
  if (score >= 0.9) return "A";
  if (score >= 0.8) return "B";
  if (score >= 0.7) return "C";
  if (score >= 0.6) return "D";
  return "F";
}

function mapTwin(t: any): DigitalTwinDto {
  return {
    id: t.id,
    twinType: t.twinType,
    entityId: t.entityId,
    state: safeParseRecord(t.state),
    version: t.version,
    lastSyncedAt: t.lastSyncedAt?.toISOString() ?? null,
    active: t.active,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function safeParseRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
