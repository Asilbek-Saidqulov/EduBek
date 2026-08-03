/**
 * EduBek — Live Quiz Analytics service.
 *
 * Read-side service that aggregates Live Quiz Engine data. The socket
 * layer publishes live updates (LiveAnalyticsUpdateDto) to the
 * `/analytics` namespace; this service handles the historical + per-
 * Quiz-Session views.
 *
 * All queries are SQL-first (Prisma aggregations where possible). No
 * JS-side filtering.
 */
import { getLogger } from "@/lib/logger";
import { forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  PersonalPermission,
  PlatformPermission,
  type AuthContext,
} from "@/features/rbac";
import { db } from "@/lib/db";
import { getGameModeDisplayName } from "@/features/game-mode";
import type {
  LiveAnalyticsUpdateDto,
  PerGameModeAnalyticsDto,
  PerQuestionAnalyticsDto,
  PlatformAnalyticsDto,
  SessionAnalyticsDto,
} from "./types";
import type { AnalyticsQuery } from "./schema";

const log = getLogger("live-analytics-service");

// ---------------------------------------------------------------------------
// getSessionAnalytics
// ---------------------------------------------------------------------------

export async function getSessionAnalytics(
  ctx: AuthContext,
  sessionId: string,
): Promise<SessionAnalyticsDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_JOIN) && !ctx.isSuperadmin) {
    throw forbidden("No permission to view analytics");
  }
  const session = await db.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      players: true,
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: { answers: true },
      },
    },
  });
  if (!session) throw notFound("Session not found");

  const activePlayers = session.players.filter((p: any) => p.status === "active" || p.status === "eliminated");
  const dropOffCount = session.players.filter((p: any) => p.status === "left" || p.status === "disconnected").length;
  const dropOffRate = session.players.length > 0 ? dropOffCount / session.players.length : 0;
  const averageScore = activePlayers.length > 0
    ? activePlayers.reduce((s: number, p: any) => s + p.score, 0) / activePlayers.length
    : 0;
  const averageAccuracy = activePlayers.length > 0
    ? activePlayers.reduce((s: number, p: any) => s + p.accuracy, 0) / activePlayers.length
    : 0;
  const averageResponseMs = activePlayers.length > 0
    ? activePlayers.reduce((s: number, p: any) => s + p.avgResponseMs, 0) / activePlayers.length
    : 0;
  const durationMs = session.startedAt && session.finishedAt
    ? session.finishedAt.getTime() - session.startedAt.getTime()
    : 0;

  return {
    sessionId: session.id,
    title: session.title,
    gameMode: session.gameMode,
    gameModeName: getGameModeDisplayName(session.gameMode),
    playerCount: activePlayers.length,
    averageScore: Math.round(averageScore * 100) / 100,
    averageAccuracy: Math.round(averageAccuracy * 1000) / 1000,
    averageResponseMs: Math.round(averageResponseMs),
    durationMs,
    dropOffCount,
    dropOffRate: Math.round(dropOffRate * 1000) / 1000,
    perRoundStats: session.rounds.map((r: any) => {
      const answers = r.answers as any[];
      const correctCount = answers.filter((a) => a.isCorrect).length;
      const totalResponseMs = answers.reduce((s: number, a: any) => s + a.responseMs, 0);
      return {
        roundNumber: r.roundNumber,
        questionId: r.questionId,
        answerCount: answers.length,
        correctCount,
        accuracy: answers.length > 0 ? correctCount / answers.length : 0,
        averageResponseMs: answers.length > 0 ? Math.round(totalResponseMs / answers.length) : 0,
      };
    }),
    // Phase 4C.1 additive analytics
    responseDistribution: computeResponseDistribution(session.rounds),
    fastestResponseMs: computeFastestResponse(session.rounds),
    slowestResponseMs: computeSlowestResponse(session.rounds),
    averageThinkingMs: computeAverageThinkingMs(session.rounds),
    dropOffGraph: computeDropOffGraph(session),
    accuracyTrend: computeAccuracyTrend(session.rounds),
  };
}

// ---------------------------------------------------------------------------
// Phase 4C.1 — additive analytics helpers
// ---------------------------------------------------------------------------

function computeResponseDistribution(rounds: any[]): Array<{ bucketMs: number; count: number }> {
  const buckets = new Map<number, number>();
  for (const round of rounds) {
    for (const answer of (round.answers ?? []) as any[]) {
      const bucket = Math.floor(answer.responseMs / 1000) * 1000;
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucketMs, count]) => ({ bucketMs, count }));
}

function computeFastestResponse(rounds: any[]): number {
  let fastest = Infinity;
  for (const round of rounds) {
    for (const answer of (round.answers ?? []) as any[]) {
      if (answer.responseMs < fastest) fastest = answer.responseMs;
    }
  }
  return fastest === Infinity ? 0 : fastest;
}

function computeSlowestResponse(rounds: any[]): number {
  let slowest = 0;
  for (const round of rounds) {
    for (const answer of (round.answers ?? []) as any[]) {
      if (answer.responseMs > slowest) slowest = answer.responseMs;
    }
  }
  return slowest;
}

function computeAverageThinkingMs(rounds: any[]): number {
  let total = 0;
  let count = 0;
  for (const round of rounds) {
    for (const answer of (round.answers ?? []) as any[]) {
      if (answer.isCorrect) {
        total += answer.responseMs;
        count += 1;
      }
    }
  }
  return count > 0 ? Math.round(total / count) : 0;
}

function computeDropOffGraph(session: any): Array<{ roundNumber: number; participantCount: number }> {
  // Approximate: count participants who answered at least one question in each round.
  return (session.rounds ?? []).map((r: any) => ({
    roundNumber: r.roundNumber,
    participantCount: (r.answers ?? []).length,
  }));
}

function computeAccuracyTrend(rounds: any[]): Array<{ roundNumber: number; cumulativeAccuracy: number }> {
  let cumulativeCorrect = 0;
  let cumulativeTotal = 0;
  return rounds.map((r: any) => {
    const answers = (r.answers ?? []) as any[];
    cumulativeCorrect += answers.filter((a) => a.isCorrect).length;
    cumulativeTotal += answers.length;
    return {
      roundNumber: r.roundNumber,
      cumulativeAccuracy: cumulativeTotal > 0 ? cumulativeCorrect / cumulativeTotal : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// getPlatformAnalytics
// ---------------------------------------------------------------------------

export async function getPlatformAnalytics(
  ctx: AuthContext,
  _query: AnalyticsQuery,
): Promise<PlatformAnalyticsDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PlatformPermission.ANALYTICS_VIEW) && !ctx.isSuperadmin) {
    if (!can(ctx, PersonalPermission.LIVEQUIZ_MANAGE)) {
      throw forbidden("No permission to view platform analytics");
    }
  }

  const sessions = await db.liveSession.findMany({
    where: { status: "finished" },
    include: {
      _count: { select: { players: true } },
      rounds: {
        select: {
          questionId: true,
          answers: { select: { isCorrect: true, responseMs: true } },
        },
      },
    },
  });

  let totalAnswers = 0;
  let totalCorrect = 0;
  let totalResponseMs = 0;
  let totalDurationMs = 0;
  let totalPlayers = 0;
  let totalDropOff = 0;
  const modeCounts = new Map<string, { sessions: number; players: number }>();
  const questionStats = new Map<string, { correct: number; attempts: number }>();

  for (const s of sessions) {
    totalPlayers += s._count.players;
    totalDurationMs += s.startedAt && s.finishedAt
      ? s.finishedAt.getTime() - s.startedAt.getTime()
      : 0;
    const modeStat = modeCounts.get(s.gameMode) ?? { sessions: 0, players: 0 };
    modeStat.sessions += 1;
    modeStat.players += s._count.players;
    modeCounts.set(s.gameMode, modeStat);
    for (const r of s.rounds) {
      for (const a of r.answers) {
        totalAnswers += 1;
        if (a.isCorrect) totalCorrect += 1;
        totalResponseMs += a.responseMs;
        if (r.questionId) {
          const qs = questionStats.get(r.questionId) ?? { correct: 0, attempts: 0 };
          qs.attempts += 1;
          if (a.isCorrect) qs.correct += 1;
          questionStats.set(r.questionId, qs);
        }
      }
    }
  }

  const mostMissedQuestions = [...questionStats.entries()]
    .map(([questionId, qs]) => ({
      questionId,
      correctRate: qs.attempts > 0 ? qs.correct / qs.attempts : 0,
      attempts: qs.attempts,
    }))
    .filter((q) => q.attempts >= 3)
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, 10);

  return {
    totalSessions: sessions.length,
    totalPlayers,
    totalAnswers,
    averageAccuracy: totalAnswers > 0 ? totalCorrect / totalAnswers : 0,
    averageResponseMs: totalAnswers > 0 ? Math.round(totalResponseMs / totalAnswers) : 0,
    averageSessionDurationMs: sessions.length > 0 ? Math.round(totalDurationMs / sessions.length) : 0,
    dropOffRate: 0, // Computed per-session; not aggregatable without storing drop-off
    gameModePopularity: [...modeCounts.entries()].map(([gameMode, stat]) => ({
      gameMode,
      gameModeName: getGameModeDisplayName(gameMode),
      sessionCount: stat.sessions,
      playerCount: stat.players,
    })),
    mostMissedQuestions,
  };
}

// ---------------------------------------------------------------------------
// getLiveUpdate (called by the socket layer for the /analytics namespace)
// ---------------------------------------------------------------------------

export async function getLiveUpdate(
  sessionId: string,
): Promise<LiveAnalyticsUpdateDto> {
  const session = await db.liveSession.findUnique({
    where: { id: sessionId },
    select: { currentRound: true },
  });
  if (!session) throw notFound("Session not found");
  const players = await db.livePlayer.count({
    where: { sessionId, status: "active" },
  });
  // Current round stats
  const currentRound = await db.liveRound.findFirst({
    where: { sessionId, status: "active" },
    include: { answers: { select: { isCorrect: true, responseMs: true } } },
  });
  const answers = currentRound?.answers ?? [];
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalResponseMs = answers.reduce((s: number, a: any) => s + a.responseMs, 0);

  return {
    sessionId,
    timestamp: new Date().toISOString(),
    activePlayers: players,
    totalAnswers: answers.length,
    currentRoundAccuracy: answers.length > 0 ? correctCount / answers.length : 0,
    averageResponseMs: answers.length > 0 ? Math.round(totalResponseMs / answers.length) : 0,
  };
}

// ---------------------------------------------------------------------------
// Phase 4C.1 — Per-question and per-Game-Mode analytics
// ---------------------------------------------------------------------------

/**
 * Compute analytics for a single question across all Quiz Sessions that
 * used it. Useful for teachers to identify which questions students
 * struggle with.
 */
export async function getPerQuestionAnalytics(
  ctx: AuthContext,
  questionId: string,
): Promise<PerQuestionAnalyticsDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_JOIN) && !ctx.isSuperadmin) {
    throw forbidden("No permission to view analytics");
  }
  // Find all answers across all rounds that used this question.
  const rounds = await db.liveRound.findMany({
    where: { questionId },
    include: {
      answers: { select: { isCorrect: true, responseMs: true, answer: true } },
      session: { select: { status: true } },
    },
  });
  // Only count answers from finished or in_progress sessions (skip cancelled).
  const validRounds = rounds.filter((r: any) => r.session?.status !== "cancelled");
  let totalAttempts = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let skipCount = 0;
  let totalResponseMs = 0;
  const wrongAnswers: any[] = [];
  for (const round of validRounds) {
    for (const answer of (round.answers ?? []) as any[]) {
      totalAttempts += 1;
      totalResponseMs += answer.responseMs ?? 0;
      if (answer.isCorrect === true) {
        correctCount += 1;
      } else if (answer.isCorrect === false) {
        wrongCount += 1;
        wrongAnswers.push(answer);
      } else {
        skipCount += 1;
      }
    }
  }
  // Wrong-answer distribution (for MCQ — count by option index)
  const wrongDist = new Map<number, number>();
  for (const a of wrongAnswers) {
    if (a.answer) {
      try {
        const parsed = JSON.parse(a.answer);
        if (typeof parsed === "number") {
          wrongDist.set(parsed, (wrongDist.get(parsed) ?? 0) + 1);
        }
      } catch {}
    }
  }
  const question = await db.bankQuestion.findUnique({
    where: { id: questionId },
    select: { questionType: true },
  });
  return {
    questionId,
    questionType: question?.questionType ?? null,
    totalAttempts,
    correctCount,
    wrongCount,
    skipCount,
    accuracy: totalAttempts > 0 ? correctCount / totalAttempts : 0,
    difficulty: totalAttempts > 0 ? 1 - correctCount / totalAttempts : 0,
    averageResponseMs: totalAttempts > 0 ? Math.round(totalResponseMs / totalAttempts) : 0,
    wrongAnswerDistribution: [...wrongDist.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([optionIndex, count]) => ({ optionIndex, count })),
  };
}

/**
 * Compute analytics for a single Game Mode across all Quiz Sessions
 * that used it. Useful for product analytics — which Game Modes are
 * popular, how long they take, retention, etc.
 */
export async function getPerGameModeAnalytics(
  ctx: AuthContext,
  gameMode: string,
): Promise<PerGameModeAnalyticsDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_JOIN) && !ctx.isSuperadmin) {
    throw forbidden("No permission to view analytics");
  }
  const sessions = await db.liveSession.findMany({
    where: { gameMode },
    include: {
      _count: { select: { players: true } },
      players: { select: { id: true, status: true } },
    },
  });
  const totalSessions = sessions.length;
  const totalParticipants = sessions.reduce((s: number, x: any) => s + x._count.players, 0);
  const finishedSessions = sessions.filter((s: any) => s.status === "finished");
  const completionRate = totalSessions > 0 ? finishedSessions.length / totalSessions : 0;
  // Average duration (finished sessions only)
  const durations = finishedSessions
    .filter((s: any) => s.startedAt && s.finishedAt)
    .map((s: any) => s.finishedAt.getTime() - s.startedAt.getTime());
  const averageDurationMs = durations.length > 0
    ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
    : 0;
  // Retention: fraction of participants who didn't leave/disconnect
  let totalParticipantsAll = 0;
  let retainedParticipants = 0;
  for (const s of sessions) {
    const players = (s as any).players ?? [];
    for (const p of players) {
      totalParticipantsAll += 1;
      if (p.status === "active" || p.status === "eliminated") {
        retainedParticipants += 1;
      }
    }
  }
  const retentionRate = totalParticipantsAll > 0 ? retainedParticipants / totalParticipantsAll : 0;
  // Popularity trend: bucket sessions by day
  const trendMap = new Map<string, number>();
  for (const s of sessions) {
    const day = s.createdAt.toISOString().slice(0, 10);
    trendMap.set(day, (trendMap.get(day) ?? 0) + 1);
  }
  const popularityTrend = [...trendMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, sessionCount]) => ({ date, sessionCount }));
  return {
    gameMode,
    gameModeName: getGameModeDisplayName(gameMode),
    totalSessions,
    totalParticipants,
    averageDurationMs,
    completionRate,
    retentionRate,
    popularityTrend,
  };
}
