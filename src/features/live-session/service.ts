/**
 * EduBek — Live Quiz Engine core (Quiz Session service).
 *
 * Live Quiz is the feature; a Quiz Session is one running instance. This
 * service is the single source of truth for Quiz Session state and the
 * engine that drives rounds, answers, leaderboards, and rewards.
 *
 * Responsibilities:
 *   • Quiz Session lifecycle (create → lobby → countdown → in_progress → finished)
 *   • Participant join / leave / reconnect / kick
 *   • Host migration when the host disconnects
 *   • Round lifecycle (start round → accept answers → finish round)
 *   • Delegates all Game-Mode-specific rules to the loaded GameModeStrategy
 *
 * The service is the single source of truth for Quiz Session state. The
 * Socket.IO layer is a transport — it receives client events, calls
 * service methods, and broadcasts the resulting state changes. No
 * scoring or game logic lives in the socket layer.
 *
 * Authorization model:
 *   • createSession — PersonalPermission.LIVEQUIZ_HOST
 *   • joinSession / leaveSession / submitAnswer — PersonalPermission.LIVEQUIZ_JOIN
 *   • startSession / endSession / pauseSession / resumeSession / kickPlayer / nextRound — host or co-host
 *   • spectate — PersonalPermission.LIVEQUIZ_SPECTATE
 *   • listSessions — any authenticated user (filtered by visibility)
 *
 * Events published (see events.ts):
 *   LIVE_SESSION_CREATED/STARTED/PAUSED/RESUMED/FINISHED/CANCELLED
 *   PLAYER_JOINED/LEFT/ELIMINATED/RECONNECTED
 *   HOST_MIGRATED
 *   ROUND_STARTED/FINISHED
 *   ANSWER_SUBMITTED
 *   LEADERBOARD_UPDATED
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  canInOrg,
  isOrgMember,
  PersonalPermission,
  OrgPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  ANSWER_SUBMITTED,
  COUNTDOWN_PAUSED,
  COUNTDOWN_SKIPPED,
  HOST_MIGRATED,
  LEADERBOARD_UPDATED,
  LIVE_SESSION_CANCELLED,
  LIVE_SESSION_CREATED,
  LIVE_SESSION_FINISHED,
  LIVE_SESSION_PAUSED,
  LIVE_SESSION_RESUMED,
  LIVE_SESSION_STARTED,
  PLAYER_ELIMINATED,
  PLAYER_JOINED,
  PLAYER_LEFT,
  PLAYER_MUTE_TOGGLED,
  PLAYER_READY,
  PLAYER_RECONNECTED,
  QUESTION_ENDED_EARLY,
  ROUND_FINISHED,
  ROUND_STARTED,
  SESSION_STATE_SYNCED,
  TIMER_EXTENDED,
  type AnswerSubmittedEvent,
  type CountdownPausedEvent,
  type CountdownSkippedEvent,
  type HostMigratedEvent,
  type LeaderboardUpdatedEvent,
  type LiveSessionCancelledEvent,
  type LiveSessionCreatedEvent,
  type LiveSessionFinishedEvent,
  type LiveSessionPausedEvent,
  type LiveSessionResumedEvent,
  type LiveSessionStartedEvent,
  type PlayerEliminatedEvent,
  type PlayerJoinedEvent,
  type PlayerLeftEvent,
  type PlayerMuteToggledEvent,
  type PlayerReadyEvent,
  type PlayerReconnectedEvent,
  type QuestionEndedEarlyEvent,
  type RoundFinishedEvent,
  type RoundStartedEvent,
  type SessionStateSyncedEvent,
  type TimerExtendedEvent,
} from "@/infra/event-bus/events";
import { db } from "@/lib/db";
import { gradeResponse } from "@/features/assessment/auto-grader";
import { getGameMode, getGameModeDisplayName, DEFAULT_GAME_MODE_CONFIG, type GameModeConfig, type LeaderboardEntry, type PlayerModeState, type RoundResult } from "@/features/game-mode";
import * as lobbyService from "@/features/lobby/service";
import * as leaderboardService from "@/features/leaderboard/service";
import * as rewardService from "@/features/reward/service";
import * as replayService from "@/features/replay/service";
import * as repo from "./repository";
import type {
  LiveAnswerDto,
  LivePlayerDto,
  LivePlayerRole,
  LivePlayerStatus,
  LiveRoundDto,
  LiveSessionDto,
  LiveSessionStatus,
  LiveSessionVisibility,
  LiveSessionWithPlayersDto,
} from "./types";
import type {
  CreateSessionBody,
  JoinSessionBody,
  ListSessionsQuery,
  StartSessionBody,
  SubmitAnswerBody,
  UpdateSessionBody,
} from "./schema";

const log = getLogger("live-session-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mapSession(s: any): LiveSessionDto {
  return {
    id: s.id,
    code: s.code,
    hostId: s.hostId,
    coHostIds: safeParse<string[]>(s.coHostIds, []),
    orgId: s.orgId,
    classroomId: s.classroomId,
    resourceId: s.resourceId,
    assessmentId: s.assessmentId,
    gameMode: s.gameMode,
    gameModeName: getGameModeDisplayName(s.gameMode),
    config: safeParse(s.config, {}),
    title: s.title,
    description: s.description,
    status: s.status as LiveSessionStatus,
    visibility: s.visibility as LiveSessionVisibility,
    maxPlayers: s.maxPlayers,
    currentRound: s.currentRound,
    totalRounds: s.totalRounds,
    leaderboardSnapshot: safeParse(s.leaderboardSnapshot, {}),
    startedAt: s.startedAt ? s.startedAt.toISOString() : null,
    finishedAt: s.finishedAt ? s.finishedAt.toISOString() : null,
    currentHostSocketId: s.currentHostSocketId,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function mapPlayer(p: any): LivePlayerDto {
  return {
    id: p.id,
    sessionId: p.sessionId,
    userId: p.userId,
    displayName: p.displayName,
    role: p.role as LivePlayerRole,
    status: p.status as LivePlayerStatus,
    state: safeParse(p.state, {}),
    score: p.score,
    accuracy: p.accuracy,
    correctCount: p.correctCount,
    wrongCount: p.wrongCount,
    currentStreak: p.currentStreak,
    longestStreak: p.longestStreak,
    avgResponseMs: p.avgResponseMs,
    answeredCount: p.answeredCount,
    finalRank: p.finalRank,
    socketId: p.socketId,
    lastSeenAt: p.lastSeenAt.toISOString(),
    disconnectedAt: p.disconnectedAt ? p.disconnectedAt.toISOString() : null,
    joinedAt: p.joinedAt.toISOString(),
    leftAt: p.leftAt ? p.leftAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function mapRound(r: any): LiveRoundDto {
  return {
    id: r.id,
    sessionId: r.sessionId,
    roundNumber: r.roundNumber,
    questionId: r.questionId,
    questionSnapshot: safeParse(r.questionSnapshot, null),
    startedAt: r.startedAt.toISOString(),
    endedAt: r.endedAt ? r.endedAt.toISOString() : null,
    questionDurationMs: r.questionDurationMs,
    answerLockAt: r.answerLockAt ? r.answerLockAt.toISOString() : null,
    revealAt: r.revealAt ? r.revealAt.toISOString() : null,
    answerCount: r.answerCount,
    correctCount: r.correctCount,
    resultsSnapshot: safeParse(r.resultsSnapshot, {}),
    status: r.status as LiveRoundDto["status"],
  };
}

function mapAnswer(a: any): LiveAnswerDto {
  return {
    id: a.id,
    roundId: a.roundId,
    playerId: a.playerId,
    answer: a.answer ? safeParse(a.answer, null) : null,
    isCorrect: a.isCorrect,
    responseMs: a.responseMs,
    pointsAwarded: a.pointsAwarded,
    metadata: a.metadata ? safeParse(a.metadata, null) : null,
    submittedAt: a.submittedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

function isHost(ctx: AuthContext, s: { hostId: string; coHostIds?: string[] }): boolean {
  if (ctx.isSuperadmin) return true;
  if (s.hostId === ctx.userId) return true;
  if (s.coHostIds?.includes(ctx.userId ?? "")) return true;
  return false;
}

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

export async function createSession(
  ctx: AuthContext,
  input: CreateSessionBody,
): Promise<LiveSessionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_HOST)) {
    throw forbidden("No permission to host live quizzes");
  }
  if (input.orgId) {
    if (!isOrgMember(ctx, input.orgId) && !ctx.isSuperadmin) {
      throw forbidden("You are not a member of this organization");
    }
    if (!ctx.isSuperadmin && !canInOrg(ctx, input.orgId, OrgPermission.ORG_LIVEQUIZ_MANAGE)) {
      throw forbidden("No org permission to manage live quizzes");
    }
  }
  if (input.classroomId) {
    const classroom = await db.classroom.findUnique({
      where: { id: input.classroomId },
      select: { teacherId: true },
    });
    if (!classroom) throw notFound("Classroom not found");
    if (classroom.teacherId !== ctx.userId && !ctx.isSuperadmin) {
      throw forbidden("Only the classroom teacher can launch live quizzes in this classroom");
    }
  }

  // Merge user config with defaults
  const config: GameModeConfig = {
    ...DEFAULT_GAME_MODE_CONFIG,
    ...(input.config as Partial<GameModeConfig> | undefined),
  };
  // Battle mode overrides totalRounds to 5
  const strategy = getGameMode(input.gameMode);
  const initialPlayerState = strategy.createSession({ userId: ctx.userId, displayName: "" }, config);
  // Force battle mode to 5 rounds
  if (input.gameMode === "battle") {
    config.totalRounds = 5;
  }

  const session = await repo.createSession({
    hostId: ctx.userId,
    orgId: input.orgId,
    classroomId: input.classroomId,
    resourceId: input.resourceId,
    assessmentId: input.assessmentId,
    gameMode: input.gameMode,
    config: JSON.stringify(config),
    title: input.title,
    description: input.description,
    visibility: input.visibility,
    maxPlayers: input.maxPlayers,
    totalRounds: config.totalRounds,
  });

  // Create the lobby
  await lobbyService.createLobbyForSession({
    sessionId: session.id,
    password: input.password,
    visibility: input.visibility,
    maxPlayers: input.maxPlayers,
    settings: { gameMode: input.gameMode, config, questionIds: input.questionIds ?? [] },
  });

  // The host is also the first player (with role 'host')
  const hostPlayer = await repo.createPlayer({
    sessionId: session.id,
    userId: ctx.userId,
    displayName: (await db.user.findUnique({ where: { id: ctx.userId }, select: { name: true, email: true } }))?.name ?? "Host",
    role: "host",
    state: JSON.stringify(initialPlayerState),
  });
  void hostPlayer;

  eventBus.publish(
    buildEvent<LiveSessionCreatedEvent>({
      type: LIVE_SESSION_CREATED,
      actorId: ctx.userId,
      sessionId: session.id,
      code: session.code,
      hostId: session.hostId,
      gameMode: session.gameMode,
      classroomId: session.classroomId,
      orgId: session.orgId,
    }),
  );

  log.info("live_session.created", { sessionId: session.id, gameMode: session.gameMode });

  return mapSession(session);
}

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

export async function getSession(
  ctx: AuthContext,
  id: string,
): Promise<LiveSessionWithPlayersDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionWithPlayers(id);
  if (!session) throw notFound("Live session not found");

  // Visibility check
  const isPlayer = session.players.some((p: any) => p.userId === ctx.userId);
  const isHostOrCoHost = isHost(ctx, session as any);
  if (!isPlayer && !isHostOrCoHost) {
    if (session.visibility === "private") {
      throw forbidden("You do not have access to this session");
    }
    if (session.visibility === "classroom" && session.classroomId) {
      // Must be in the classroom
      const membership = await db.classroomStudent.findUnique({
        where: {
          classroomId_studentId: {
            classroomId: session.classroomId,
            studentId: ctx.userId,
          },
        },
      });
      if (!membership && !ctx.isSuperadmin) {
        throw forbidden("You do not have access to this session");
      }
    } else if (session.visibility === "org" && session.orgId) {
      if (!isOrgMember(ctx, session.orgId) && !ctx.isSuperadmin) {
        throw forbidden("You do not have access to this session");
      }
    }
  }

  const activeRound = await repo.findCurrentRound(id);
  return {
    ...mapSession(session),
    players: (session.players as any[]).map(mapPlayer),
    activeRound: activeRound ? mapRound(activeRound) : undefined,
  };
}

// ---------------------------------------------------------------------------
// listSessions
// ---------------------------------------------------------------------------

export async function listSessions(
  ctx: AuthContext,
  query: ListSessionsQuery,
): Promise<{ sessions: LiveSessionDto[]; total: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  // Default scope: sessions the caller can see (own + visible)
  const result = await repo.listSessions({
    hostId: query.hostId,
    classroomId: query.classroomId,
    orgId: query.orgId,
    gameMode: query.gameMode,
    status: query.status,
    visibility: query.visibility,
    page: query.page,
    pageSize: query.pageSize,
  });
  return {
    sessions: result.items.map(mapSession),
    total: result.total,
  };
}

// ---------------------------------------------------------------------------
// joinSession (by join code)
// ---------------------------------------------------------------------------

export async function joinSession(
  ctx: AuthContext,
  input: JoinSessionBody,
): Promise<{ session: LiveSessionDto; player: LivePlayerDto }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_JOIN)) {
    throw forbidden("No permission to join live quizzes");
  }

  // Find the lobby by join code
  const lobby = await lobbyService.findLobbyByCode(input.joinCode);
  if (!lobby) throw notFound("Lobby not found");
  if (lobby.status === "closed") {
    throw forbidden("Lobby is closed");
  }
  if (lobby.locked) {
    throw forbidden("Lobby is locked");
  }

  const session = await repo.findSessionById(lobby.sessionId);
  if (!session) throw notFound("Session not found");
  if (session.status !== "lobby" && session.status !== "countdown") {
    throw badRequest(`Cannot join session with status ${session.status}`);
  }

  // Verify password (with PIN brute-force protection — Phase 4D.5)
  if (lobby.passwordHash) {
    if (!input.password) {
      throw forbidden("Password required");
    }
    // Rate-limit password attempts: 5 per 5 minutes per join code
    const { pinAttemptLimiter } = await import("@/infra/rate-limiter");
    const rateLimit = pinAttemptLimiter.check(input.joinCode);
    if (!rateLimit.allowed) {
      log.warn("join.pin_brute_force_blocked", {
        joinCode: input.joinCode,
        remaining: rateLimit.remaining,
      });
      throw forbidden("Too many attempts. Please try again later.");
    }
    const bcrypt = await import("bcryptjs");
    const ok = await bcrypt.compare(input.password, lobby.passwordHash);
    if (!ok) throw forbidden("Invalid password");
    // Reset the limiter on successful auth
    pinAttemptLimiter.reset(input.joinCode);
  }

  // Capacity check
  const activeCount = await repo.countActivePlayers(session.id);
  if (activeCount >= session.maxPlayers && input.role === "player") {
    throw forbidden("Session is full");
  }

  // Resolve display name
  const user = await db.user.findUnique({
    where: { id: ctx.userId },
    select: { name: true, email: true },
  });
  if (!user) throw notFound("User not found");
  const displayName = input.displayName ?? user.name ?? user.email;

  // Re-join if already a player (e.g. reconnect after disconnect)
  const existing = await repo.findPlayerBySessionAndUser(session.id, ctx.userId);
  if (existing) {
    const updated = await repo.updatePlayer(existing.id, {
      status: "active",
      socketId: null,
      disconnectedAt: null,
      lastSeenAt: new Date(),
      leftAt: null,
    });
    eventBus.publish(
      buildEvent<PlayerReconnectedEvent>({
        type: PLAYER_RECONNECTED,
        actorId: ctx.userId,
        sessionId: session.id,
        playerId: existing.id,
        userId: ctx.userId,
      }),
    );
    return { session: mapSession(session), player: mapPlayer(updated) };
  }

  // Initialize mode-specific state
  const config = safeParse<GameModeConfig>(session.config, DEFAULT_GAME_MODE_CONFIG);
  const strategy = getGameMode(session.gameMode);
  const initialState = strategy.createSession({ userId: ctx.userId, displayName }, config);

  const player = await repo.createPlayer({
    sessionId: session.id,
    userId: ctx.userId,
    displayName,
    role: input.role,
    state: JSON.stringify(initialState),
  });

  eventBus.publish(
    buildEvent<PlayerJoinedEvent>({
      type: PLAYER_JOINED,
      actorId: ctx.userId,
      sessionId: session.id,
      playerId: player.id,
      userId: ctx.userId,
      displayName,
      role: input.role,
    }),
  );

  log.info("player.joined", { sessionId: session.id, playerId: player.id });

  return { session: mapSession(session), player: mapPlayer(player) };
}

// ---------------------------------------------------------------------------
// leaveSession
// ---------------------------------------------------------------------------

export async function leaveSession(
  ctx: AuthContext,
  sessionId: string,
): Promise<{ sessionId: string; status: string }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const player = await repo.findPlayerBySessionAndUser(sessionId, ctx.userId);
  if (!player) throw notFound("Player not in this session");

  await repo.updatePlayer(player.id, {
    status: "left",
    leftAt: new Date(),
    socketId: null,
  });

  eventBus.publish(
    buildEvent<PlayerLeftEvent>({
      type: PLAYER_LEFT,
      actorId: ctx.userId,
      sessionId,
      playerId: player.id,
      userId: ctx.userId,
      reason: "voluntary",
    }),
  );

  return { sessionId, status: "left" };
}

// ---------------------------------------------------------------------------
// reconnect (socket layer calls this when a player's socket reconnects)
// ---------------------------------------------------------------------------

export async function reconnectPlayer(
  ctx: AuthContext,
  sessionId: string,
  socketId: string,
): Promise<{ player: LivePlayerDto; session: LiveSessionDto; missedEventCount: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const player = await repo.findPlayerBySessionAndUser(sessionId, ctx.userId);
  if (!player) throw notFound("Player not in this session");

  // Phase 4C.1: detect duplicate socket connections from the same user.
  // If the player already has an active socketId, the old socket should be
  // cleaned up by the socket layer's disconnect handler; here we just
  // overwrite with the new socketId.
  const previousSocketId = player.socketId;
  const wasDisconnected = player.status === "disconnected";

  const lastSeenAt = player.lastSeenAt ?? new Date(0);
  const updated = await repo.updatePlayer(player.id, {
    socketId,
    lastSeenAt: new Date(),
    disconnectedAt: null,
    // Restore to active if they were disconnected (not if they left voluntarily)
    ...(wasDisconnected ? { status: "active" } : {}),
  });
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");

  // Phase 4C.1: count missed events since lastSeenAt so the client can
  // request a state sync if needed.
  const rounds = await repo.findRoundsBySession(sessionId);
  const missedEventCount = rounds.filter(
    (r: any) => new Date(r.startedAt) > lastSeenAt,
  ).length;

  eventBus.publish(
    buildEvent<PlayerReconnectedEvent>({
      type: PLAYER_RECONNECTED,
      actorId: ctx.userId,
      sessionId,
      playerId: player.id,
      userId: ctx.userId,
    }),
  );

  if (previousSocketId && previousSocketId !== socketId) {
    log.info("player.duplicate_socket_replaced", {
      sessionId,
      playerId: player.id,
      oldSocketId: previousSocketId,
      newSocketId: socketId,
    });
  }

  return { player: mapPlayer(updated), session: mapSession(session), missedEventCount };
}

// ---------------------------------------------------------------------------
// markPlayerDisconnected (socket layer calls this on disconnect)
// ---------------------------------------------------------------------------

export async function markPlayerDisconnected(
  sessionId: string,
  userId: string,
): Promise<void> {
  const player = await repo.findPlayerBySessionAndUser(sessionId, userId);
  if (!player) return;
  await repo.updatePlayer(player.id, {
    status: player.status === "left" ? "left" : "disconnected",
    socketId: null,
    disconnectedAt: new Date(),
  });
  log.info("player.disconnected", { sessionId, playerId: player.id });
}

// ---------------------------------------------------------------------------
// Host migration
// ---------------------------------------------------------------------------

export async function migrateHost(
  ctx: AuthContext,
  sessionId: string,
  newHostUserId: string,
  reason: string,
): Promise<LiveSessionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  // Only the system or a co-host can trigger migration
  const coHosts = safeParse<string[]>(session.coHostIds, []);
  if (!ctx.isSuperadmin && !coHosts.includes(ctx.userId) && ctx.userId !== session.hostId) {
    throw forbidden("Only a co-host can trigger host migration");
  }
  // Promote the new host
  const newHostPlayer = await repo.findPlayerBySessionAndUser(sessionId, newHostUserId);
  if (!newHostPlayer) throw notFound("New host not found in session");
  if (newHostPlayer.role === "spectator") {
    throw badRequest("Cannot promote a spectator to host");
  }

  const oldHostId = session.hostId;
  // Demote old host to co-host (if they're still around)
  const newCoHostIds = [...coHosts, oldHostId].filter((id) => id !== newHostUserId);

  await repo.updatePlayer(newHostPlayer.id, { role: "host" });
  // Demote old host player if exists
  const oldHostPlayer = await repo.findPlayerBySessionAndUser(sessionId, oldHostId);
  if (oldHostPlayer) {
    await repo.updatePlayer(oldHostPlayer.id, { role: "co_host" });
  }
  await repo.updateSession(sessionId, {
    hostId: newHostUserId,
    coHostIds: JSON.stringify(newCoHostIds),
  });

  eventBus.publish(
    buildEvent<HostMigratedEvent>({
      type: HOST_MIGRATED,
      actorId: ctx.userId,
      sessionId,
      oldHostId,
      newHostId: newHostUserId,
      reason,
    }),
  );

  const updated = await repo.findSessionById(sessionId);
  return mapSession(updated!);
}

// ---------------------------------------------------------------------------
// startSession (lobby → countdown → in_progress)
// ---------------------------------------------------------------------------

export async function startSession(
  ctx: AuthContext,
  sessionId: string,
  input: StartSessionBody,
): Promise<LiveSessionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) {
    throw forbidden("Only the host can start the session");
  }
  if (session.status !== "lobby") {
    throw badRequest(`Cannot start session with status ${session.status}`);
  }
  const activeCount = await repo.countActivePlayers(sessionId);
  if (activeCount < 1) {
    throw badRequest("Cannot start a session with no players");
  }
  // Battle mode requires exactly 2 players
  if (session.gameMode === "battle" && activeCount !== 2) {
    throw badRequest("Battle mode requires exactly 2 players");
  }

  // Lock the lobby
  await lobbyService.lockLobby(sessionId);

  // Transition to countdown
  const countdownEndsAt = new Date(Date.now() + input.countdownSeconds * 1000);
  await db.lobby.update({
    where: { sessionId },
    data: {
      status: "countdown",
      countdownEndsAt,
    },
  });
  await repo.updateSession(sessionId, {
    status: "countdown",
    startedAt: new Date(),
  });

  // After countdown, transition to in_progress (the socket layer handles the
  // delay; the REST endpoint returns immediately).
  await repo.updateSession(sessionId, { status: "in_progress" });

  const updated = await repo.findSessionById(sessionId);
  eventBus.publish(
    buildEvent<LiveSessionStartedEvent>({
      type: LIVE_SESSION_STARTED,
      actorId: ctx.userId,
      sessionId,
      hostId: session.hostId,
      playerCount: activeCount,
    }),
  );

  log.info("live_session.started", { sessionId, playerCount: activeCount });
  return mapSession(updated!);
}

// ---------------------------------------------------------------------------
// pauseSession / resumeSession
// ---------------------------------------------------------------------------

export async function pauseSession(ctx: AuthContext, sessionId: string): Promise<LiveSessionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) throw forbidden("Only the host can pause");
  if (session.status !== "in_progress") throw badRequest("Session is not in progress");

  const updated = await repo.updateSession(sessionId, { status: "paused" });
  eventBus.publish(
    buildEvent<LiveSessionPausedEvent>({
      type: LIVE_SESSION_PAUSED,
      actorId: ctx.userId,
      sessionId,
      hostId: session.hostId,
    }),
  );
  return mapSession(updated);
}

export async function resumeSession(ctx: AuthContext, sessionId: string): Promise<LiveSessionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) throw forbidden("Only the host can resume");
  if (session.status !== "paused") throw badRequest("Session is not paused");

  const updated = await repo.updateSession(sessionId, { status: "in_progress" });
  eventBus.publish(
    buildEvent<LiveSessionResumedEvent>({
      type: LIVE_SESSION_RESUMED,
      actorId: ctx.userId,
      sessionId,
      hostId: session.hostId,
    }),
  );
  return mapSession(updated);
}

// ---------------------------------------------------------------------------
// endSession (in_progress → finished)
// ---------------------------------------------------------------------------

export async function endSession(
  ctx: AuthContext,
  sessionId: string,
  cancel = false,
): Promise<LiveSessionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) {
    throw forbidden("Only the host can end the session");
  }
  if (session.status === "finished" || session.status === "cancelled") {
    throw badRequest("Session already ended");
  }

  if (cancel) {
    const updated = await repo.updateSession(sessionId, {
      status: "cancelled",
      finishedAt: new Date(),
    });
    eventBus.publish(
      buildEvent<LiveSessionCancelledEvent>({
        type: LIVE_SESSION_CANCELLED,
        actorId: ctx.userId,
        sessionId,
        hostId: session.hostId,
        reason: "host_cancelled",
      }),
    );
    return mapSession(updated);
  }

  // Finish the session: compute final leaderboard, apply rewards, save replay
  const finalLeaderboard = await finishSessionInternal(sessionId);

  const updated = await repo.updateSession(sessionId, {
    status: "finished",
    finishedAt: new Date(),
    leaderboardSnapshot: JSON.stringify(finalLeaderboard),
  });

  const playerCount = await repo.countAllPlayers(sessionId);
  const durationMs = session.startedAt
    ? Date.now() - session.startedAt.getTime()
    : 0;

  eventBus.publish(
    buildEvent<LiveSessionFinishedEvent>({
      type: LIVE_SESSION_FINISHED,
      actorId: ctx.userId,
      sessionId,
      hostId: session.hostId,
      durationMs,
      playerCount,
    }),
  );

  // Save replay (best-effort — don't fail the session end if it errors)
  try {
    await replayService.createReplay(sessionId);
  } catch (err) {
    log.warn("replay.save_failed", {
      sessionId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  log.info("live_session.finished", { sessionId, durationMs, playerCount });
  return mapSession(updated);
}

// ---------------------------------------------------------------------------
// startNextRound (host advances to the next question)
// ---------------------------------------------------------------------------

export async function startNextRound(
  ctx: AuthContext,
  sessionId: string,
): Promise<LiveRoundDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) throw forbidden("Only the host can advance rounds");
  if (session.status !== "in_progress") {
    throw badRequest("Session is not in progress");
  }
  const nextRoundNumber = session.currentRound + 1;
  if (nextRoundNumber > session.totalRounds) {
    throw badRequest("All rounds already played");
  }

  // Resolve the question for this round
  const config = safeParse<GameModeConfig>(session.config, DEFAULT_GAME_MODE_CONFIG);
  const lobby = await db.lobby.findUnique({ where: { sessionId } });
  const questionIds: string[] = lobby?.settings
    ? safeParse<{ questionIds?: string[] }>(lobby.settings, {}).questionIds ?? []
    : [];

  let questionId: string | null = null;
  let questionSnapshot: string | null = null;
  let questionType = "multiple_choice";
  let questionPayload: any = null;
  if (questionIds.length > 0 && nextRoundNumber - 1 < questionIds.length) {
    questionId = config.shuffleQuestions
      ? questionIds[Math.floor(Math.random() * questionIds.length)]!
      : questionIds[nextRoundNumber - 1]!;
    const question = await db.bankQuestion.findUnique({ where: { id: questionId } });
    if (question) {
      questionSnapshot = question.payload;
      questionType = question.questionType;
      try { questionPayload = JSON.parse(question.payload); } catch { /* ignore */ }
    }
  }

  const round = await repo.createRound({
    sessionId,
    roundNumber: nextRoundNumber,
    questionId,
    questionSnapshot,
    questionDurationMs: config.questionDurationMs,
    answerLockAt: new Date(Date.now() + config.questionDurationMs),
  });

  await repo.updateSession(sessionId, { currentRound: nextRoundNumber });

  // Initialize mode-specific round state
  const players = await repo.findActivePlayersBySession(sessionId);
  const strategy = getGameMode(session.gameMode);
  const roundCtx = {
    sessionId,
    roundNumber: nextRoundNumber,
    questionId,
    questionType,
    questionPayload,
    startedAt: new Date(round.startedAt),
    durationMs: config.questionDurationMs,
  };
  const modeResult = strategy.startRound(
    roundCtx,
    players.map((p: any) => ({
      playerId: p.id,
      modeState: safeParse<PlayerModeState>(p.state, { score: 0, modeState: {} }),
    })),
    config,
  );

  // Persist any mode state mutations
  for (const p of players) {
    const state = safeParse<PlayerModeState>((p as any).state, { score: 0, modeState: {} });
    await repo.updatePlayer(p.id, { state: JSON.stringify(state) });
  }

  eventBus.publish(
    buildEvent<RoundStartedEvent>({
      type: ROUND_STARTED,
      actorId: ctx.userId,
      sessionId,
      roundId: round.id,
      roundNumber: nextRoundNumber,
      questionId,
      durationMs: config.questionDurationMs,
    }),
  );

  return { ...mapRound(round), resultsSnapshot: modeResult.roundMetadata ?? {} } as LiveRoundDto;
}

// ---------------------------------------------------------------------------
// submitAnswer (player submits an answer for the current round)
// ---------------------------------------------------------------------------

export async function submitAnswer(
  ctx: AuthContext,
  sessionId: string,
  input: SubmitAnswerBody,
): Promise<LiveAnswerDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_JOIN)) {
    throw forbidden("No permission to submit answers");
  }
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (session.status !== "in_progress") {
    throw badRequest("Session is not in progress");
  }

  const player = await repo.findPlayerBySessionAndUser(sessionId, ctx.userId);
  if (!player) throw notFound("Player not in this session");
  if (player.status !== "active") {
    throw badRequest(`Cannot submit answer with status ${player.status}`);
  }

  const round = await repo.findCurrentRound(sessionId);
  if (!round) throw notFound("No active round");
  if (round.status !== "active") {
    throw badRequest("Round is not active");
  }
  // Lock check
  if (round.answerLockAt && new Date() > round.answerLockAt) {
    throw badRequest("Answer locked");
  }

  // Idempotency: if the participant already submitted an answer for this
  // round, return the existing answer instead of throwing. This makes the
  // endpoint safe to retry on network glitches (Phase 4C.1).
  const existing = await repo.findAnswer(round.id, player.id);
  if (existing) {
    log.info("answer.idempotent_return", { answerId: existing.id, roundId: round.id, playerId: player.id });
    return mapAnswer(existing);
  }

  // Auto-grade via the assessment auto-grader
  const questionPayload = round.questionSnapshot ? JSON.parse(round.questionSnapshot) : null;
  let isCorrect = false;
  if (questionPayload) {
    try {
      const result = gradeResponse(round.questionSnapshot ? (await db.bankQuestion.findUnique({ where: { id: round.questionId ?? "" } }))?.questionType ?? "multiple_choice" : "multiple_choice", questionPayload, input.answer, 1);
      isCorrect = result.isCorrect;
    } catch {
      isCorrect = false;
    }
  }

  // Delegate scoring + mode-specific consequences to the strategy
  const config = safeParse<GameModeConfig>(session.config, DEFAULT_GAME_MODE_CONFIG);
  const strategy = getGameMode(session.gameMode);
  const modeState = safeParse<PlayerModeState>(player.state, { score: 0, modeState: {} });
  const roundCtx = {
    sessionId,
    roundNumber: round.roundNumber,
    questionId: round.questionId,
    questionType: (await db.bankQuestion.findUnique({ where: { id: round.questionId ?? "" } }))?.questionType ?? "multiple_choice",
    questionPayload,
    startedAt: new Date(round.startedAt),
    durationMs: round.questionDurationMs,
  };
  const roundResult = strategy.processAnswer(
    {
      playerId: player.id,
      userId: ctx.userId,
      answer: input.answer,
      responseMs: input.responseMs,
      isCorrect,
    },
    { playerId: player.id, modeState },
    roundCtx,
    config,
  );

  // Persist the answer
  const answer = await repo.createAnswer({
    roundId: round.id,
    playerId: player.id,
    answer: JSON.stringify(input.answer),
    isCorrect,
    responseMs: input.responseMs,
    pointsAwarded: roundResult.pointsAwarded,
    metadata: roundResult.delta ? JSON.stringify(roundResult.delta) : undefined,
  });

  // Update player aggregates
  const newAnsweredCount = player.answeredCount + 1;
  const newCorrectCount = player.correctCount + (isCorrect ? 1 : 0);
  const newWrongCount = player.wrongCount + (isCorrect ? 0 : 1);
  const newTotalResponseMs = player.totalResponseMs + input.responseMs;
  const newAvgResponseMs = Math.round(newTotalResponseMs / newAnsweredCount);
  const newCurrentStreak = isCorrect ? player.currentStreak + 1 : 0;
  const newLongestStreak = Math.max(player.longestStreak, newCurrentStreak);
  const newAccuracy = newAnsweredCount > 0 ? newCorrectCount / newAnsweredCount : 0;
  // Persist mode state mutations (the strategy may have mutated modeState in place)
  await repo.updatePlayer(player.id, {
    state: JSON.stringify(modeState),
    score: modeState.score,
    accuracy: newAccuracy,
    correctCount: newCorrectCount,
    wrongCount: newWrongCount,
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    avgResponseMs: newAvgResponseMs,
    totalResponseMs: newTotalResponseMs,
    answeredCount: newAnsweredCount,
    lastSeenAt: new Date(),
  });

  // Elimination check
  if (roundResult.outcome === "eliminated") {
    await repo.updatePlayer(player.id, { status: "eliminated" });
    eventBus.publish(
      buildEvent<PlayerEliminatedEvent>({
        type: PLAYER_ELIMINATED,
        actorId: ctx.userId,
        sessionId,
        playerId: player.id,
        userId: ctx.userId,
        roundNumber: round.roundNumber,
        reason: "no_hearts",
      }),
    );
  }

  eventBus.publish(
    buildEvent<AnswerSubmittedEvent>({
      type: ANSWER_SUBMITTED,
      actorId: ctx.userId,
      sessionId,
      roundId: round.id,
      playerId: player.id,
      userId: ctx.userId,
      isCorrect,
      responseMs: input.responseMs,
      pointsAwarded: roundResult.pointsAwarded,
    }),
  );

  return mapAnswer(answer);
}

// ---------------------------------------------------------------------------
// finishRound (host ends the current round, compute leaderboard)
// ---------------------------------------------------------------------------

export async function finishRound(
  ctx: AuthContext,
  sessionId: string,
): Promise<{ round: LiveRoundDto; leaderboard: LeaderboardEntry[] }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) throw forbidden("Only the host can finish rounds");

  const round = await repo.findCurrentRound(sessionId);
  if (!round) throw notFound("No active round");
  if (round.status !== "active") throw badRequest("Round already finished");

  const config = safeParse<GameModeConfig>(session.config, DEFAULT_GAME_MODE_CONFIG);
  const strategy = getGameMode(session.gameMode);
  const players = await repo.findActivePlayersBySession(sessionId);
  const answers = await repo.findAnswersByRound(round.id);

  // Build round results
  const roundResults: any[] = [];
  for (const a of answers) {
    const player = players.find((p: any) => p.id === a.playerId);
    if (!player) continue;
    roundResults.push({
      playerId: a.playerId,
      isCorrect: a.isCorrect ?? false,
      responseMs: a.responseMs,
      pointsAwarded: a.pointsAwarded,
    });
  }

  const roundCtx = {
    sessionId,
    roundNumber: round.roundNumber,
    questionId: round.questionId,
    questionType: "multiple_choice",
    questionPayload: null,
    startedAt: new Date(round.startedAt),
    durationMs: round.questionDurationMs,
  };
  const finishResult = strategy.finishRound(
    roundCtx,
    roundResults,
    players.map((p: any) => ({
      playerId: p.id,
      modeState: safeParse<PlayerModeState>(p.state, { score: 0, modeState: {} }),
    })),
    config,
  );

  // Apply eliminations from finishRound (e.g. Royale no-answer players)
  if (finishResult.eliminated && finishResult.eliminated.length > 0) {
    for (const pid of finishResult.eliminated) {
      await repo.updatePlayer(pid, { status: "eliminated" });
      const p = players.find((x: any) => x.id === pid);
      if (p) {
        eventBus.publish(
          buildEvent<PlayerEliminatedEvent>({
            type: PLAYER_ELIMINATED,
            actorId: ctx.userId,
            sessionId,
            playerId: pid,
            userId: p.userId,
            roundNumber: round.roundNumber,
            reason: "no_answer",
          }),
        );
      }
    }
  }

  // Update round
  const updatedRound = await repo.updateRound(round.id, {
    status: "finished",
    endedAt: new Date(),
    answerCount: answers.length,
    correctCount: answers.filter((a: any) => a.isCorrect).length,
    resultsSnapshot: JSON.stringify(finishResult.resultsSnapshot),
  });

  // Compute leaderboard
  const previousLeaderboard = await leaderboardService.getLatestLeaderboard(sessionId);
  const leaderboard = strategy.calculateScores(
    players.map((p: any) => ({
      playerId: p.id,
      userId: p.userId,
      displayName: p.displayName,
      modeState: safeParse<PlayerModeState>(p.state, { score: 0, modeState: {} }),
      correctCount: p.correctCount,
      answeredCount: p.answeredCount,
      totalResponseMs: p.totalResponseMs,
      currentStreak: p.currentStreak,
    })),
    previousLeaderboard,
    config,
  );

  // Phase 4C.1: enrich each entry with additive metadata fields
  const previousRankMap = new Map<string, number>();
  if (previousLeaderboard) {
    previousLeaderboard.forEach((e, i) => previousRankMap.set(e.playerId, i + 1));
  }
  const playerById = new Map<string, any>(players.map((p: any) => [p.id, p]));
  for (const entry of leaderboard) {
    const p = playerById.get(entry.playerId);
    const prev = previousRankMap.get(entry.playerId);
    entry.previousRank = prev ?? null;
    entry.rankChange = prev != null ? prev - entry.rank : (entry.rankChange ?? 0);
    entry.correctAnswers = p?.correctCount ?? entry.correctAnswers;
    entry.wrongAnswers = p?.wrongCount ?? entry.wrongAnswers;
    entry.averageResponseMs = entry.avgResponseMs;
    entry.longestStreak = p?.longestStreak ?? entry.longestStreak;
    entry.isLeader = entry.rank === 1;
  }

  // Save leaderboard snapshot
  await leaderboardService.saveLeaderboardSnapshot({
    sessionId,
    roundNumber: round.roundNumber,
    entries: leaderboard,
  });
  await repo.updateSession(sessionId, {
    leaderboardSnapshot: JSON.stringify(leaderboard),
  });

  eventBus.publish(
    buildEvent<RoundFinishedEvent>({
      type: ROUND_FINISHED,
      actorId: ctx.userId,
      sessionId,
      roundId: round.id,
      roundNumber: round.roundNumber,
      answerCount: answers.length,
      correctCount: answers.filter((a: any) => a.isCorrect).length,
    }),
  );
  eventBus.publish(
    buildEvent<LeaderboardUpdatedEvent>({
      type: LEADERBOARD_UPDATED,
      actorId: ctx.userId,
      sessionId,
      roundNumber: round.roundNumber,
      topPlayerId: leaderboard[0]?.playerId ?? null,
      playerCount: leaderboard.length,
    }),
  );

  // Check if the session should auto-finish (Royale last-standing OR all rounds played)
  const aliveCount = players.filter((p: any) => p.status === "active").length;
  const shouldAutoFinish =
    session.currentRound >= session.totalRounds ||
    (session.gameMode === "royale" && aliveCount <= 1);
  if (shouldAutoFinish) {
    await endSession(ctx, sessionId, false);
  }

  return { round: mapRound(updatedRound), leaderboard };
}

// ---------------------------------------------------------------------------
// finishSessionInternal — computes final leaderboard + rewards
// ---------------------------------------------------------------------------

async function finishSessionInternal(sessionId: string): Promise<LeaderboardEntry[]> {
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  const config = safeParse<GameModeConfig>(session.config, DEFAULT_GAME_MODE_CONFIG);
  const strategy = getGameMode(session.gameMode);
  const players = await repo.findActivePlayersBySession(sessionId);
  const previousLeaderboard = await leaderboardService.getLatestLeaderboard(sessionId);

  const leaderboard = strategy.calculateScores(
    players.map((p: any) => ({
      playerId: p.id,
      userId: p.userId,
      displayName: p.displayName,
      modeState: safeParse<PlayerModeState>(p.state, { score: 0, modeState: {} }),
      correctCount: p.correctCount,
      answeredCount: p.answeredCount,
      totalResponseMs: p.totalResponseMs,
      currentStreak: p.currentStreak,
    })),
    previousLeaderboard,
    config,
  );

  // Phase 4C.1: enrich entries with additive metadata fields
  const previousRankMap = new Map<string, number>();
  if (previousLeaderboard) {
    previousLeaderboard.forEach((e, i) => previousRankMap.set(e.playerId, i + 1));
  }
  const playerById = new Map<string, any>(players.map((p: any) => [p.id, p]));
  for (const entry of leaderboard) {
    const p = playerById.get(entry.playerId);
    const prev = previousRankMap.get(entry.playerId);
    entry.previousRank = prev ?? null;
    entry.rankChange = prev != null ? prev - entry.rank : (entry.rankChange ?? 0);
    entry.correctAnswers = p?.correctCount ?? entry.correctAnswers;
    entry.wrongAnswers = p?.wrongCount ?? entry.wrongAnswers;
    entry.averageResponseMs = entry.avgResponseMs;
    entry.longestStreak = p?.longestStreak ?? entry.longestStreak;
    entry.isLeader = entry.rank === 1;
  }

  // Persist final ranks — batched into a single transaction (was N+1)
  if (leaderboard.length > 0) {
    await db.$transaction(
      leaderboard.map((entry, i) =>
        db.livePlayer.update({
          where: { id: entry.playerId },
          data: { finalRank: entry.rank },
        }),
      ),
    );
  }

  // Determine winner + apply rewards
  const winnerResult = strategy.determineWinner(
    leaderboard,
    players.map((p: any) => ({
      playerId: p.id,
      modeState: safeParse<PlayerModeState>(p.state, { score: 0, modeState: {} }),
    })),
    config,
  );
  // Phase 4C.1: mark the winner on the final leaderboard snapshot
  if (winnerResult.winnerPlayerId) {
    const winnerEntry = leaderboard.find((e) => e.playerId === winnerResult.winnerPlayerId);
    if (winnerEntry) winnerEntry.isWinner = true;
  }

  const rewards = strategy.applyRewards(
    leaderboard,
    { playerId: winnerResult.winnerPlayerId, userId: winnerResult.winnerUserId },
    config,
  );
  for (const reward of rewards) {
    await rewardService.grantReward({
      userId: reward.userId,
      sessionId,
      rewardType: reward.rewardType,
      amount: reward.amount,
      code: reward.code,
      reason: reward.reason,
      metadata: reward.metadata,
    });
  }

  return leaderboard;
}

// ---------------------------------------------------------------------------
// Phase 4C.1 — Host experience controls
// ---------------------------------------------------------------------------

/**
 * Pause the pre-game countdown. The Lobby remains in `countdown` status
 * but the countdown clock stops. Resume via `resumeCountdown`.
 */
export async function pauseCountdown(
  ctx: AuthContext,
  sessionId: string,
): Promise<{ sessionId: string; status: string; remainingMs: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) throw forbidden("Only the host can pause the countdown");
  if (session.status !== "countdown") {
    throw badRequest("Session is not in countdown phase");
  }
  const lobby = await db.lobby.findUnique({ where: { sessionId } });
  if (!lobby || !lobby.countdownEndsAt) throw badRequest("No active countdown to pause");
  const remainingMs = Math.max(0, lobby.countdownEndsAt.getTime() - Date.now());
  // Clear countdownEndsAt to "pause" — the socket layer reads this as paused.
  await db.lobby.update({
    where: { sessionId },
    data: { countdownEndsAt: null },
  });
  eventBus.publish(
    buildEvent<CountdownPausedEvent>({
      type: COUNTDOWN_PAUSED,
      actorId: ctx.userId,
      sessionId,
      hostId: session.hostId,
      remainingMs,
    }),
  );
  return { sessionId, status: session.status, remainingMs };
}

/**
 * Skip the remaining countdown and immediately transition to in_progress.
 */
export async function skipCountdown(
  ctx: AuthContext,
  sessionId: string,
): Promise<LiveSessionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) throw forbidden("Only the host can skip the countdown");
  if (session.status !== "countdown") {
    throw badRequest("Session is not in countdown phase");
  }
  await db.lobby.update({
    where: { sessionId },
    data: { countdownEndsAt: null, status: "closed" },
  });
  const updated = await repo.updateSession(sessionId, { status: "in_progress" });
  eventBus.publish(
    buildEvent<CountdownSkippedEvent>({
      type: COUNTDOWN_SKIPPED,
      actorId: ctx.userId,
      sessionId,
      hostId: session.hostId,
    }),
  );
  return mapSession(updated);
}

/**
 * Extend the current round's question timer by `addedMs` milliseconds.
 * The `answerLockAt` is pushed forward; participants get more time.
 */
export async function extendTimer(
  ctx: AuthContext,
  sessionId: string,
  addedMs: number,
): Promise<{ sessionId: string; roundId: string; newAnswerLockAt: string }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (addedMs <= 0 || addedMs > 5 * 60_000) {
    throw badRequest("addedMs must be between 1 and 300000");
  }
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) throw forbidden("Only the host can extend the timer");
  if (session.status !== "in_progress") {
    throw badRequest("Session is not in progress");
  }
  const round = await repo.findCurrentRound(sessionId);
  if (!round) throw notFound("No active round");
  if (round.status !== "active") throw badRequest("Round is not active");
  const currentLock = round.answerLockAt ?? new Date(Date.now() + round.questionDurationMs);
  const newLock = new Date(currentLock.getTime() + addedMs);
  await repo.updateRound(round.id, { answerLockAt: newLock });
  eventBus.publish(
    buildEvent<TimerExtendedEvent>({
      type: TIMER_EXTENDED,
      actorId: ctx.userId,
      sessionId,
      roundId: round.id,
      hostId: session.hostId,
      addedMs,
      newAnswerLockAt: newLock.toISOString(),
    }),
  );
  return { sessionId, roundId: round.id, newAnswerLockAt: newLock.toISOString() };
}

/**
 * End the current question early. The round is locked immediately; any
 * participants who haven't answered are treated as no-answer. The host
 * flows through to the same finishRound path.
 */
export async function endQuestionEarly(
  ctx: AuthContext,
  sessionId: string,
): Promise<{ sessionId: string; roundId: string; status: string }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) throw forbidden("Only the host can end the question early");
  if (session.status !== "in_progress") {
    throw badRequest("Session is not in progress");
  }
  const round = await repo.findCurrentRound(sessionId);
  if (!round) throw notFound("No active round");
  if (round.status !== "active") throw badRequest("Round is not active");
  // Move the answer lock to now so no new answers are accepted.
  await repo.updateRound(round.id, { answerLockAt: new Date() });
  eventBus.publish(
    buildEvent<QuestionEndedEarlyEvent>({
      type: QUESTION_ENDED_EARLY,
      actorId: ctx.userId,
      sessionId,
      roundId: round.id,
      hostId: session.hostId,
      roundNumber: round.roundNumber,
    }),
  );
  // Delegate to finishRound so leaderboard + state updates run normally.
  await finishRound(ctx, sessionId);
  return { sessionId, roundId: round.id, status: "finished" };
}

/**
 * Toggle a participant's chat-mute flag (future-compatible — chat isn't
 * implemented yet, but the mute state is tracked now so the socket layer
 * can enforce it when chat ships).
 */
export async function togglePlayerMute(
  ctx: AuthContext,
  sessionId: string,
  playerId: string,
  muted: boolean,
): Promise<{ playerId: string; muted: boolean }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) throw forbidden("Only the host can mute participants");
  const player = await repo.findPlayerById(playerId);
  if (!player || player.sessionId !== sessionId) throw notFound("Player not in this session");
  // Store mute flag in the player's state JSON.
  const state = safeParse<Record<string, unknown>>(player.state, {});
  state.__muted = muted;
  await repo.updatePlayer(playerId, { state: JSON.stringify(state) });
  eventBus.publish(
    buildEvent<PlayerMuteToggledEvent>({
      type: PLAYER_MUTE_TOGGLED,
      actorId: ctx.userId,
      sessionId,
      playerId,
      userId: player.userId,
      muted,
      byHostId: ctx.userId,
    }),
  );
  return { playerId, muted };
}

/**
 * Participant ready-check (Lobby phase). Participants mark themselves
 * ready; the host can query ready state and start the countdown only
 * when requirements are satisfied (see lobby service).
 */
export async function setPlayerReady(
  ctx: AuthContext,
  sessionId: string,
  ready: boolean,
): Promise<{ playerId: string; ready: boolean }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const player = await repo.findPlayerBySessionAndUser(sessionId, ctx.userId);
  if (!player) throw notFound("Player not in this session");
  const state = safeParse<Record<string, unknown>>(player.state, {});
  state.__ready = ready;
  await repo.updatePlayer(player.id, { state: JSON.stringify(state), lastSeenAt: new Date() });
  eventBus.publish(
    buildEvent<PlayerReadyEvent>({
      type: PLAYER_READY,
      actorId: ctx.userId,
      sessionId,
      playerId: player.id,
      userId: ctx.userId,
      ready,
    }),
  );
  return { playerId: player.id, ready };
}

/**
 * Sync state for a reconnecting participant. Returns the current Quiz
 * Session state + any missed events since their last seen timestamp.
 * Used by the socket layer on reconnect.
 */
export async function syncSessionState(
  ctx: AuthContext,
  sessionId: string,
  lastSeenAt: Date,
): Promise<{
  session: LiveSessionDto;
  activeRound: ReturnType<typeof mapRound> | null;
  leaderboard: LeaderboardEntry[];
  missedEventCount: number;
}> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const player = await repo.findPlayerBySessionAndUser(sessionId, ctx.userId);
  if (!player) throw notFound("Player not in this session");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  const activeRound = await repo.findCurrentRound(sessionId);
  // Count missed answers/events: events published after lastSeenAt.
  // We approximate by counting rounds that started after lastSeenAt.
  const rounds = await repo.findRoundsBySession(sessionId);
  const missedEventCount = rounds.filter((r: any) => new Date(r.startedAt) > lastSeenAt).length;
  // Restore player to active
  await repo.updatePlayer(player.id, {
    status: "active",
    lastSeenAt: new Date(),
    disconnectedAt: null,
    socketId: null,
  });
  // Get latest leaderboard
  const latestLb = await leaderboardService.getLatestLeaderboard(sessionId);
  eventBus.publish(
    buildEvent<SessionStateSyncedEvent>({
      type: SESSION_STATE_SYNCED,
      actorId: ctx.userId,
      sessionId,
      playerId: player.id,
      missedEventCount,
    }),
  );
  return {
    session: mapSession(session),
    activeRound: activeRound ? mapRound(activeRound) : null,
    leaderboard: latestLb ?? [],
    missedEventCount,
  };
}

// ---------------------------------------------------------------------------
// kickPlayer
// ---------------------------------------------------------------------------

export async function kickPlayer(
  ctx: AuthContext,
  sessionId: string,
  playerId: string,
): Promise<{ playerId: string; status: string }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) throw forbidden("Only the host can kick players");
  const player = await repo.findPlayerById(playerId);
  if (!player || player.sessionId !== sessionId) throw notFound("Player not in this session");
  if (player.role === "host") throw badRequest("Cannot kick the host");

  await repo.updatePlayer(playerId, {
    status: "left",
    leftAt: new Date(),
    socketId: null,
  });

  eventBus.publish(
    buildEvent<PlayerLeftEvent>({
      type: PLAYER_LEFT,
      actorId: ctx.userId,
      sessionId,
      playerId,
      userId: player.userId,
      reason: "kicked",
    }),
  );

  return { playerId, status: "left" };
}

// ---------------------------------------------------------------------------
// updateSession
// ---------------------------------------------------------------------------

export async function updateSession(
  ctx: AuthContext,
  sessionId: string,
  input: UpdateSessionBody,
): Promise<LiveSessionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");
  if (!isHost(ctx, session as any)) throw forbidden("Only the host can update the session");
  if (session.status !== "lobby") {
    throw badRequest("Cannot update a session that has already started");
  }
  const updated = await repo.updateSession(sessionId, {
    title: input.title,
    description: input.description,
    visibility: input.visibility,
    maxPlayers: input.maxPlayers,
    coHostIds: input.coHostIds ? JSON.stringify(input.coHostIds) : undefined,
  });
  return mapSession(updated);
}
