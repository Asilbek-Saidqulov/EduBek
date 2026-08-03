/**
 * EduBek — Live Quiz domain types (DTOs).
 *
 * A LiveSession is the persistence model for a Quiz Session — one
 * running instance of Live Quiz. Every round, answer, leaderboard
 * snapshot, and reward references it.
 *
 * Note: the Prisma model is named `LiveSession` and that name does not
 * change (renaming would require a migration). The product term shown
 * to users is "Quiz Session"; the persistence term used in code is
 * `LiveSession`. DTOs bridge the two.
 */

export type LiveSessionStatus =
  | "lobby"
  | "countdown"
  | "in_progress"
  | "paused"
  | "finished"
  | "cancelled";

export type LiveSessionVisibility = "private" | "classroom" | "org" | "public";

export type LivePlayerRole = "host" | "co_host" | "player" | "spectator";
export type LivePlayerStatus = "active" | "eliminated" | "disconnected" | "left";

export type LiveRoundStatus = "active" | "finished";

export interface LiveSessionDto {
  id: string;
  code: string;
  hostId: string;
  coHostIds: string[];
  orgId: string | null;
  classroomId: string | null;
  resourceId: string | null;
  assessmentId: string | null;
  /** Stable internal identifier (e.g. "classic") — used by the strategy registry. */
  gameMode: string;
  /** Human-friendly display name (e.g. "Classic Quiz") — for UI/analytics/replay. */
  gameModeName: string;
  config: Record<string, unknown>;
  title: string;
  description: string | null;
  status: LiveSessionStatus;
  visibility: LiveSessionVisibility;
  maxPlayers: number;
  currentRound: number;
  totalRounds: number;
  leaderboardSnapshot: Record<string, unknown>;
  startedAt: string | null;
  finishedAt: string | null;
  currentHostSocketId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LivePlayerDto {
  id: string;
  sessionId: string;
  userId: string;
  displayName: string;
  role: LivePlayerRole;
  status: LivePlayerStatus;
  state: Record<string, unknown>;
  score: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  currentStreak: number;
  longestStreak: number;
  avgResponseMs: number;
  answeredCount: number;
  finalRank: number | null;
  socketId: string | null;
  lastSeenAt: string;
  disconnectedAt: string | null;
  joinedAt: string;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LiveRoundDto {
  id: string;
  sessionId: string;
  roundNumber: number;
  questionId: string | null;
  questionSnapshot: Record<string, unknown> | null;
  startedAt: string;
  endedAt: string | null;
  questionDurationMs: number;
  answerLockAt: string | null;
  revealAt: string | null;
  answerCount: number;
  correctCount: number;
  resultsSnapshot: Record<string, unknown>;
  status: LiveRoundStatus;
}

export interface LiveAnswerDto {
  id: string;
  roundId: string;
  playerId: string;
  answer: unknown;
  isCorrect: boolean | null;
  responseMs: number;
  pointsAwarded: number;
  metadata: Record<string, unknown> | null;
  submittedAt: string;
}

export interface LiveSessionWithPlayersDto extends LiveSessionDto {
  players: LivePlayerDto[];
  activeRound?: LiveRoundDto;
}

export interface JoinSessionInput {
  joinCode: string;
  password?: string;
  displayName?: string;
  role?: LivePlayerRole;
}

export interface CreateSessionInput {
  title: string;
  description?: string;
  gameMode: string;
  config?: Record<string, unknown>;
  classroomId?: string;
  resourceId?: string;
  assessmentId?: string;
  orgId?: string;
  visibility?: LiveSessionVisibility;
  maxPlayers?: number;
  password?: string;
  questionIds?: string[];
}

export interface SubmitAnswerInput {
  roundId: string;
  answer: unknown;
  responseMs: number;
}
