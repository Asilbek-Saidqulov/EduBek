/**
 * EduBek — Live Quiz repository (Quiz Session persistence).
 *
 * The ONLY layer in this feature that imports `db`. Services compose
 * these primitives; routes never touch the data layer directly.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface CreateSessionInput {
  hostId: string;
  orgId?: string;
  classroomId?: string;
  resourceId?: string;
  assessmentId?: string;
  gameMode: string;
  config: string;
  title: string;
  description?: string;
  visibility: string;
  maxPlayers: number;
  totalRounds: number;
}

export async function createSession(input: CreateSessionInput) {
  return db.liveSession.create({
    data: {
      hostId: input.hostId,
      orgId: input.orgId ?? null,
      classroomId: input.classroomId ?? null,
      resourceId: input.resourceId ?? null,
      assessmentId: input.assessmentId ?? null,
      gameMode: input.gameMode,
      config: input.config,
      title: input.title,
      description: input.description ?? null,
      status: "lobby",
      visibility: input.visibility,
      maxPlayers: input.maxPlayers,
      totalRounds: input.totalRounds,
    },
  });
}

export async function findSessionById(id: string) {
  return db.liveSession.findUnique({ where: { id } });
}

export async function findSessionByCode(code: string) {
  return db.liveSession.findUnique({ where: { code } });
}

export async function findSessionWithPlayers(id: string) {
  return db.liveSession.findUnique({
    where: { id },
    include: {
      players: { orderBy: { score: "desc" } },
    },
  });
}

export interface ListSessionsInput {
  hostId?: string;
  classroomId?: string;
  orgId?: string;
  gameMode?: string;
  status?: string;
  visibility?: string;
  page: number;
  pageSize: number;
}

export async function listSessions(input: ListSessionsInput) {
  const where: Record<string, unknown> = {};
  if (input.hostId) where.hostId = input.hostId;
  if (input.classroomId) where.classroomId = input.classroomId;
  if (input.orgId) where.orgId = input.orgId;
  if (input.gameMode) where.gameMode = input.gameMode;
  if (input.status) where.status = input.status;
  if (input.visibility) where.visibility = input.visibility;
  const [items, total] = await Promise.all([
    db.liveSession.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: { _count: { select: { players: true } } },
    }),
    db.liveSession.count({ where }),
  ]);
  return { items, total };
}

export async function updateSession(id: string, data: {
  title?: string;
  description?: string | null;
  visibility?: string;
  maxPlayers?: number;
  coHostIds?: string;
  status?: string;
  currentRound?: number;
  leaderboardSnapshot?: string;
  currentHostSocketId?: string | null;
  startedAt?: Date;
  finishedAt?: Date;
  hostId?: string;
}) {
  return db.liveSession.update({ where: { id }, data });
}

export async function archiveSession(id: string) {
  return db.liveSession.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export interface CreatePlayerInput {
  sessionId: string;
  userId: string;
  displayName: string;
  role: string;
  state: string;
}

export async function createPlayer(input: CreatePlayerInput) {
  return db.livePlayer.create({
    data: {
      sessionId: input.sessionId,
      userId: input.userId,
      displayName: input.displayName,
      role: input.role,
      status: "active",
      state: input.state,
    },
  });
}

export async function findPlayerById(id: string) {
  return db.livePlayer.findUnique({ where: { id } });
}

export async function findPlayerBySessionAndUser(sessionId: string, userId: string) {
  return db.livePlayer.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
}

export async function findPlayersBySession(sessionId: string) {
  return db.livePlayer.findMany({
    where: { sessionId },
    orderBy: { score: "desc" },
  });
}

export async function findActivePlayersBySession(sessionId: string) {
  return db.livePlayer.findMany({
    where: { sessionId, status: { in: ["active", "eliminated"] } },
    orderBy: { score: "desc" },
  });
}

export async function countActivePlayers(sessionId: string): Promise<number> {
  return db.livePlayer.count({
    where: { sessionId, status: "active" },
  });
}

export async function countAllPlayers(sessionId: string): Promise<number> {
  return db.livePlayer.count({
    where: { sessionId, status: { in: ["active", "eliminated"] } },
  });
}

export async function updatePlayer(id: string, data: {
  status?: string;
  state?: string;
  score?: number;
  accuracy?: number;
  correctCount?: number;
  wrongCount?: number;
  currentStreak?: number;
  longestStreak?: number;
  avgResponseMs?: number;
  totalResponseMs?: number;
  answeredCount?: number;
  finalRank?: number | null;
  socketId?: string | null;
  lastSeenAt?: Date;
  disconnectedAt?: Date | null;
  leftAt?: Date | null;
  role?: string;
}) {
  return db.livePlayer.update({ where: { id }, data });
}

export async function bulkUpdatePlayerStates(
  updates: Array<{ id: string; state: string; score?: number }>,
): Promise<void> {
  if (updates.length === 0) return;
  await db.$transaction(
    updates.map((u) =>
      db.livePlayer.update({
        where: { id: u.id },
        data: {
          state: u.state,
          ...(u.score !== undefined ? { score: u.score } : {}),
        },
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------

export interface CreateRoundInput {
  sessionId: string;
  roundNumber: number;
  questionId?: string | null;
  questionSnapshot?: string | null;
  questionDurationMs: number;
  answerLockAt?: Date;
  revealAt?: Date;
}

export async function createRound(input: CreateRoundInput) {
  return db.liveRound.create({
    data: {
      sessionId: input.sessionId,
      roundNumber: input.roundNumber,
      questionId: input.questionId ?? null,
      questionSnapshot: input.questionSnapshot ?? null,
      questionDurationMs: input.questionDurationMs,
      answerLockAt: input.answerLockAt ?? null,
      revealAt: input.revealAt ?? null,
    },
  });
}

export async function findRoundById(id: string) {
  return db.liveRound.findUnique({ where: { id } });
}

export async function findRoundBySessionAndNumber(sessionId: string, roundNumber: number) {
  return db.liveRound.findUnique({
    where: { sessionId_roundNumber: { sessionId, roundNumber } },
  });
}

export async function findRoundsBySession(sessionId: string) {
  return db.liveRound.findMany({
    where: { sessionId },
    orderBy: { roundNumber: "asc" },
  });
}

export async function findCurrentRound(sessionId: string) {
  return db.liveRound.findFirst({
    where: { sessionId, status: "active" },
    orderBy: { roundNumber: "desc" },
  });
}

export async function updateRound(id: string, data: {
  endedAt?: Date;
  answerLockAt?: Date;
  revealAt?: Date;
  answerCount?: number;
  correctCount?: number;
  resultsSnapshot?: string;
  status?: string;
}) {
  return db.liveRound.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

export interface CreateAnswerInput {
  roundId: string;
  playerId: string;
  answer?: string;
  isCorrect?: boolean;
  responseMs: number;
  pointsAwarded: number;
  metadata?: string;
}

export async function createAnswer(input: CreateAnswerInput) {
  return db.liveAnswer.create({
    data: {
      roundId: input.roundId,
      playerId: input.playerId,
      answer: input.answer ?? null,
      isCorrect: input.isCorrect ?? null,
      responseMs: input.responseMs,
      pointsAwarded: input.pointsAwarded,
      metadata: input.metadata ?? null,
    },
  });
}

export async function findAnswer(roundId: string, playerId: string) {
  return db.liveAnswer.findUnique({
    where: { roundId_playerId: { roundId, playerId } },
  });
}

export async function findAnswersByRound(roundId: string) {
  return db.liveAnswer.findMany({
    where: { roundId },
    orderBy: { responseMs: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Leaderboard snapshots
// ---------------------------------------------------------------------------

export async function createLeaderboardSnapshot(input: {
  sessionId: string;
  roundNumber: number;
  entries: string;
}) {
  return db.liveLeaderboard.create({ data: input });
}

export async function findLatestLeaderboard(sessionId: string) {
  return db.liveLeaderboard.findFirst({
    where: { sessionId },
    orderBy: { roundNumber: "desc" },
  });
}

export async function findLeaderboardHistory(sessionId: string) {
  return db.liveLeaderboard.findMany({
    where: { sessionId },
    orderBy: { roundNumber: "asc" },
  });
}
