/**
 * EduBek — Live Quiz Replay service.
 *
 * Builds a complete event-sourced Replay of a Quiz Session by
 * re-reading the audit log for that Quiz Session. The Replay is
 * immutable after creation (only visibility can be changed).
 *
 * Authorization model:
 *   • getReplay / listMyReplays — Quiz Session participants (or anyone
 *     if visibility is public)
 *   • updateReplay (visibility) — Quiz Session host only
 *   • createReplay — internal API called by live-session.endSession
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  REPLAY_CREATED,
  type ReplayCreatedEvent,
} from "@/infra/event-bus/events";
import { db } from "@/lib/db";
import { getGameModeDisplayName } from "@/features/game-mode";
import * as repo from "./repository";
import type { ReplayDto, ReplayEvent, ReplayTimelineMarker, ReplayVisibility } from "./types";
import type { ListReplaysQuery, UpdateReplayBody } from "./schema";

const log = getLogger("replay-service");

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mapReplay(r: any): ReplayDto {
  const analytics = safeParse<Record<string, unknown>>(r.analyticsSummary, {});
  const timelineMarkers = (analytics.timelineMarkers as ReplayTimelineMarker[] | undefined) ?? [];
  return {
    id: r.id,
    sessionId: r.sessionId,
    events: safeParse<ReplayEvent[]>(r.events, []),
    finalSnapshot: safeParse(r.finalSnapshot, {}),
    durationMs: r.durationMs,
    visibility: r.visibility as ReplayVisibility,
    analyticsSummary: analytics,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    // Phase 4C.1: extract markers stashed in analyticsSummary
    timelineMarkers,
  };
}

// ---------------------------------------------------------------------------
// createReplay (internal API)
// ---------------------------------------------------------------------------

export async function createReplay(sessionId: string): Promise<ReplayDto> {
  const session = await db.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: { answers: true },
      },
      players: true,
      leaderboard: { orderBy: { roundNumber: "asc" } },
    },
  });
  if (!session) throw notFound("Session not found");

  // Build the event log from the session state.
  const events: ReplayEvent[] = [];
  events.push({
    type: "session_created",
    timestamp: session.createdAt.toISOString(),
    actorId: session.hostId,
    payload: {
      title: session.title,
      gameMode: session.gameMode,
      gameModeName: getGameModeDisplayName(session.gameMode),
      maxPlayers: session.maxPlayers,
      totalRounds: session.totalRounds,
    },
  });
  if (session.startedAt) {
    events.push({
      type: "session_started",
      timestamp: session.startedAt.toISOString(),
      actorId: session.hostId,
      payload: { playerCount: session.players.length },
    });
  }
  for (const p of session.players) {
    events.push({
      type: "player_joined",
      timestamp: p.joinedAt.toISOString(),
      actorId: p.userId,
      payload: {
        playerId: p.id,
        displayName: p.displayName,
        role: p.role,
      },
    });
  }
  for (const round of session.rounds) {
    events.push({
      type: "round_started",
      timestamp: round.startedAt.toISOString(),
      actorId: session.hostId,
      payload: {
        roundNumber: round.roundNumber,
        questionId: round.questionId,
        durationMs: round.questionDurationMs,
      },
    });
    for (const ans of round.answers) {
      events.push({
        type: "answer_submitted",
        timestamp: ans.submittedAt.toISOString(),
        actorId: session.players.find((p) => p.id === ans.playerId)?.userId,
        payload: {
          playerId: ans.playerId,
          roundId: ans.roundId,
          isCorrect: ans.isCorrect,
          responseMs: ans.responseMs,
          pointsAwarded: ans.pointsAwarded,
        },
      });
    }
    if (round.endedAt) {
      events.push({
        type: "round_finished",
        timestamp: round.endedAt.toISOString(),
        actorId: session.hostId,
        payload: {
          roundNumber: round.roundNumber,
          answerCount: round.answerCount,
          correctCount: round.correctCount,
        },
      });
    }
  }
  for (const lb of session.leaderboard) {
    events.push({
      type: "leaderboard_updated",
      timestamp: lb.generatedAt.toISOString(),
      actorId: undefined,
      payload: {
        roundNumber: lb.roundNumber,
        entries: safeParse(lb.entries, []),
      },
    });
  }
  if (session.finishedAt) {
    events.push({
      type: "session_finished",
      timestamp: session.finishedAt.toISOString(),
      actorId: session.hostId,
      payload: { durationMs: session.finishedAt.getTime() - session.startedAt!.getTime() },
    });
  }

  // Final snapshot
  const finalSnapshot = {
    session: {
      id: session.id,
      title: session.title,
      gameMode: session.gameMode,
      gameModeName: getGameModeDisplayName(session.gameMode),
      totalRounds: session.totalRounds,
      startedAt: session.startedAt?.toISOString(),
      finishedAt: session.finishedAt?.toISOString(),
    },
    players: session.players.map((p: any) => ({
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      role: p.role,
      score: p.score,
      accuracy: p.accuracy,
      correctCount: p.correctCount,
      wrongCount: p.wrongCount,
      longestStreak: p.longestStreak,
      avgResponseMs: p.avgResponseMs,
      finalRank: p.finalRank,
    })),
    rounds: session.rounds.map((r: any) => ({
      roundNumber: r.roundNumber,
      questionId: r.questionId,
      answerCount: r.answerCount,
      correctCount: r.correctCount,
    })),
  };

  // Analytics summary
  const totalAnswers = session.rounds.reduce((sum: number, r: any) => sum + r.answerCount, 0);
  const totalCorrect = session.rounds.reduce((sum: number, r: any) => sum + r.correctCount, 0);
  const analyticsSummary = {
    playerCount: session.players.length,
    totalAnswers,
    totalCorrect,
    accuracy: totalAnswers > 0 ? totalCorrect / totalAnswers : 0,
    averageScore: session.players.length > 0
      ? session.players.reduce((s: number, p: any) => s + p.score, 0) / session.players.length
      : 0,
    durationMs: session.startedAt && session.finishedAt
      ? session.finishedAt.getTime() - session.startedAt.getTime()
      : 0,
    gameMode: session.gameMode,
    gameModeName: getGameModeDisplayName(session.gameMode),
    perRoundAccuracy: session.rounds.map((r: any) => ({
      roundNumber: r.roundNumber,
      accuracy: r.answerCount > 0 ? r.correctCount / r.answerCount : 0,
    })),
  };

  const durationMs = session.startedAt && session.finishedAt
    ? session.finishedAt.getTime() - session.startedAt.getTime()
    : 0;

  // Phase 4C.1: compute timeline markers for replay scrubbing
  const timelineMarkers = computeTimelineMarkers(events, session.startedAt ?? session.createdAt);

  // Stash markers inside analyticsSummary (no schema migration needed)
  const analyticsWithMarkers = {
    ...analyticsSummary,
    timelineMarkers,
  };

  const replay = await repo.createReplay({
    sessionId,
    events: JSON.stringify(events),
    finalSnapshot: JSON.stringify(finalSnapshot),
    durationMs,
    visibility: "session_participants",
    analyticsSummary: JSON.stringify(analyticsWithMarkers),
  });

  eventBus.publish(
    buildEvent<ReplayCreatedEvent>({
      type: REPLAY_CREATED,
      actorId: session.hostId,
      replayId: replay.id,
      sessionId,
      durationMs,
      eventCount: events.length,
    }),
  );

  log.info("replay.created", { replayId: replay.id, sessionId, eventCount: events.length, markerCount: timelineMarkers.length });
  return mapReplay(replay);
}

// ---------------------------------------------------------------------------
// Phase 4C.1 — Timeline marker computation
// ---------------------------------------------------------------------------

/**
 * Walk the replay event log and emit timeline markers for notable moments.
 * The frontend uses these markers to render a scrub bar with jump-to
 * points, highlight important moments during playback, and skip ahead
 * to the "good parts" (winner reveal, perfect streaks, eliminations).
 */
function computeTimelineMarkers(events: ReplayEvent[], sessionStart: Date): ReplayTimelineMarker[] {
  const markers: ReplayTimelineMarker[] = [];
  const startMs = sessionStart.getTime();
  const offset = (iso: string) => Math.max(0, new Date(iso).getTime() - startMs);

  for (const e of events) {
    const off = offset(e.timestamp);
    switch (e.type) {
      case "session_started":
        markers.push({
          type: "session_start",
          offsetMs: off,
          timestamp: e.timestamp,
          label: "Quiz Session started",
          labelKey: "backend.replay.sessionStart",
        });
        break;
      case "session_finished":
        markers.push({
          type: "session_end",
          offsetMs: off,
          timestamp: e.timestamp,
          label: "Quiz Session ended",
          labelKey: "backend.replay.sessionEnd",
        });
        // If there's a winner, add a winner_crowned marker at the same time
        const winnerId = (e.payload as any).winnerPlayerId;
        if (winnerId) {
          markers.push({
            type: "winner_crowned",
            offsetMs: off,
            timestamp: e.timestamp,
            label: "Winner crowned",
            labelKey: "backend.replay.winnerCrowned",
            playerId: winnerId,
            metadata: { reason: (e.payload as any).reason ?? "highest_score" },
          });
        }
        break;
      case "round_started":
        markers.push({
          type: "round_start",
          offsetMs: off,
          timestamp: e.timestamp,
          label: `Round ${(e.payload as any).roundNumber} started`,
          labelKey: "backend.replay.roundStart",
          labelParams: { round: (e.payload as any).roundNumber },
          roundNumber: (e.payload as any).roundNumber,
        });
        break;
      case "round_finished":
        markers.push({
          type: "round_end",
          offsetMs: off,
          timestamp: e.timestamp,
          label: `Round ${(e.payload as any).roundNumber} ended`,
          labelKey: "backend.replay.roundEnd",
          labelParams: { round: (e.payload as any).roundNumber },
          roundNumber: (e.payload as any).roundNumber,
        });
        break;
      case "player_eliminated":
        markers.push({
          type: "elimination",
          offsetMs: off,
          timestamp: e.timestamp,
          label: `Participant eliminated (round ${(e.payload as any).roundNumber})`,
          labelKey: "backend.replay.elimination",
          labelParams: { round: (e.payload as any).roundNumber },
          roundNumber: (e.payload as any).roundNumber,
          playerId: (e.payload as any).playerId,
          metadata: { reason: (e.payload as any).reason },
        });
        break;
      case "answer_submitted":
        // Highlight perfect streaks (5+ correct in a row)
        const streak = (e.payload as any).streakAfter;
        if (typeof streak === "number" && streak >= 5 && streak % 5 === 0) {
          markers.push({
            type: "perfect_streak",
            offsetMs: off,
            timestamp: e.timestamp,
            label: `${streak}-correct streak!`,
            labelKey: "backend.replay.perfectStreak",
            labelParams: { streak },
            playerId: (e.payload as any).playerId,
            metadata: { streak },
          });
        }
        break;
      case "player_disconnected":
        markers.push({
          type: "disconnect",
          offsetMs: off,
          timestamp: e.timestamp,
          label: `Participant disconnected`,
          labelKey: "backend.replay.disconnect",
          playerId: (e.payload as any).playerId,
        });
        break;
      case "player_reconnected":
        markers.push({
          type: "reconnect",
          offsetMs: off,
          timestamp: e.timestamp,
          label: `Participant reconnected`,
          labelKey: "backend.replay.reconnect",
          playerId: (e.payload as any).playerId,
        });
        break;
      case "host_migrated":
      case "session_paused":
      case "session_resumed":
      case "countdown_paused":
      case "countdown_skipped":
      case "timer_extended":
      case "question_ended_early":
        markers.push({
          type: "host_action",
          offsetMs: off,
          timestamp: e.timestamp,
          label: `Host action: ${e.type.replace(/_/g, " ")}`,
          labelKey: "backend.replay.hostAction",
          labelParams: { action: e.type.replace(/_/g, " ") },
          actorId: e.actorId,
          metadata: e.payload,
        });
        break;
      case "leaderboard_updated":
        // Only mark if the top position changed (rank change > 0)
        const topChange = (e.payload as any).topRankChange;
        if (typeof topChange === "number" && Math.abs(topChange) > 0) {
          markers.push({
            type: "leaderboard_change",
            offsetMs: off,
            timestamp: e.timestamp,
            label: `Leaderboard lead changed`,
            labelKey: "backend.replay.leaderboardChange",
            roundNumber: (e.payload as any).roundNumber,
          });
        }
        break;
    }
  }
  return markers.sort((a, b) => a.offsetMs - b.offsetMs);
}

// ---------------------------------------------------------------------------
// getReplay
// ---------------------------------------------------------------------------

export async function getReplay(
  ctx: AuthContext,
  id: string,
): Promise<ReplayDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_JOIN) && !ctx.isSuperadmin) {
    throw forbidden("No permission to view replays");
  }
  const replay = await repo.findReplayById(id);
  if (!replay) throw notFound("Replay not found");
  // Visibility check
  if (replay.visibility === "session_participants") {
    // Must be a participant
    const player = await db.livePlayer.findFirst({
      where: { sessionId: replay.sessionId, userId: ctx.userId },
    });
    const session = await db.liveSession.findUnique({
      where: { id: replay.sessionId },
      select: { hostId: true },
    });
    if (!player && session?.hostId !== ctx.userId && !ctx.isSuperadmin) {
      throw forbidden("You do not have access to this replay");
    }
  } else if (replay.visibility === "classroom") {
    // Must be in the session's classroom
    const session = await db.liveSession.findUnique({
      where: { id: replay.sessionId },
      select: { classroomId: true, hostId: true },
    });
    if (!session) throw notFound("Session not found");
    if (session.hostId !== ctx.userId && !ctx.isSuperadmin) {
      if (!session.classroomId) throw forbidden("You do not have access");
      const membership = await db.classroomStudent.findUnique({
        where: {
          classroomId_studentId: {
            classroomId: session.classroomId,
            studentId: ctx.userId,
          },
        },
      });
      if (!membership) throw forbidden("You do not have access");
    }
  } else if (replay.visibility === "org") {
    const session = await db.liveSession.findUnique({
      where: { id: replay.sessionId },
      select: { orgId: true, hostId: true },
    });
    if (!session) throw notFound("Session not found");
    if (session.hostId !== ctx.userId && !ctx.isSuperadmin) {
      if (!session.orgId) throw forbidden("You do not have access");
      const membership = await db.organizationMembership.findFirst({
        where: { orgId: session.orgId, userId: ctx.userId, status: "active" },
      });
      if (!membership) throw forbidden("You do not have access");
    }
  }
  // public = anyone
  return mapReplay(replay);
}

// ---------------------------------------------------------------------------
// getReplayBySession
// ---------------------------------------------------------------------------

export async function getReplayBySession(
  ctx: AuthContext,
  sessionId: string,
): Promise<ReplayDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const replay = await repo.findReplayBySession(sessionId);
  if (!replay) throw notFound("No replay for this session");
  return getReplay(ctx, replay.id);
}

// ---------------------------------------------------------------------------
// listMyReplays
// ---------------------------------------------------------------------------

export async function listMyReplays(
  ctx: AuthContext,
  limit = 50,
): Promise<ReplayDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const replays = await repo.findReplaysByUser(ctx.userId, limit);
  return replays.map(mapReplay);
}

// ---------------------------------------------------------------------------
// updateReplay (visibility only)
// ---------------------------------------------------------------------------

export async function updateReplay(
  ctx: AuthContext,
  id: string,
  input: UpdateReplayBody,
): Promise<ReplayDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const replay = await repo.findReplayById(id);
  if (!replay) throw notFound("Replay not found");
  const session = await db.liveSession.findUnique({
    where: { id: replay.sessionId },
    select: { hostId: true },
  });
  if (!session) throw notFound("Session not found");
  if (session.hostId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the session host can update the replay");
  }
  const updated = await repo.updateReplay(id, {
    visibility: input.visibility,
  });
  return mapReplay(updated);
}

// ---------------------------------------------------------------------------
// listReplays (admin scope)
// ---------------------------------------------------------------------------

export async function listReplays(
  ctx: AuthContext,
  query: ListReplaysQuery,
): Promise<{ replays: ReplayDto[]; total: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_MANAGE) && !ctx.isSuperadmin) {
    // Non-admins: default to their own replays
    const replays = await repo.findReplaysByUser(ctx.userId, 100);
    return { replays: replays.map(mapReplay), total: replays.length };
  }
  let replays: any[];
  if (query.sessionId) {
    const r = await repo.findReplayBySession(query.sessionId);
    replays = r ? [r] : [];
  } else if (query.visibility) {
    replays = await repo.findReplaysByVisibility(query.visibility);
  } else {
    replays = await db.replay.findMany({
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
  }
  return { replays: replays.map(mapReplay), total: replays.length };
}
