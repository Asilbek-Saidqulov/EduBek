/**
 * EduBek — Live Quiz Tournament module types.
 *
 * A Tournament is a bracket-system competition: N participants
 * register, the bracket is generated (single-elimination by default),
 * and each match is a 1v1 LiveSession using the "battle" Game Mode
 * (Battle Royale). The winner of each match advances to the next round
 * until only one champion remains.
 *
 * The Tournament model itself stores the bracket structure as a JSON
 * tree; TournamentMatch rows reference the LiveSessions that decide
 * each match.
 */

export type TournamentFormat = "single_elimination" | "double_elimination" | "round_robin";
export type TournamentStatus = "draft" | "registration" | "in_progress" | "finished" | "cancelled";

export interface TournamentDto {
  id: string;
  name: string;
  description: string | null;
  hostId: string;
  orgId: string | null;
  classroomId: string | null;
  /** Internal id (e.g. "battle") — used by the strategy registry. */
  gameMode: string;
  /** Display name (e.g. "Battle Royale") — for tournament UI/labels. */
  gameModeName: string;
  format: TournamentFormat;
  bracketSize: number;
  status: TournamentStatus;
  participants: string[]; // userIds
  championId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  bracket: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // ---- Phase 4C.1 additive fields (all optional, backward-compatible) ----
  /** Scheduled start time (host can set this; check-in window opens before it). */
  scheduledStartAt?: string | null;
  /** Check-in window opens this many minutes before scheduledStartAt. */
  checkInWindowMinutes?: number;
  /** Late-registration closes at this time (participants can't join after). */
  lateRegistrationClosesAt?: string | null;
  /** Whether automatic winner advancement is enabled (default true). */
  autoAdvancement?: boolean;
  /** Number of completed matches (computed). */
  completedMatchCount?: number;
  /** Number of pending matches (computed). */
  pendingMatchCount?: number;
}

/** Phase 4C.1: tournament statistics summary. */
export interface TournamentStatsDto {
  tournamentId: string;
  totalParticipants: number;
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  byesAwarded: number;
  averageMatchDurationMs: number;
  championId: string | null;
  /** Per-participant performance summary. */
  participantStats: Array<{
    userId: string;
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    eliminatedRound: number | null;
  }>;
}

/** Phase 4C.1: match history entry. */
export interface MatchHistoryDto {
  matchId: string;
  roundNumber: number;
  matchNumber: number;
  player1Id: string;
  player2Id: string | null;
  winnerId: string | null;
  score1: number | null;
  score2: number | null;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
}

export interface TournamentMatchDto {
  id: string;
  tournamentId: string;
  roundNumber: number;
  matchNumber: number;
  player1Id: string;
  player2Id: string | null;
  session1Id: string | null;
  session2Id: string | null;
  winnerId: string | null;
  score1: number | null;
  score2: number | null;
  status: string;
  scheduledAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Bracket {
  rounds: Array<{
    roundNumber: number;
    name: string;
    matches: Array<{
      matchId: string;
      player1Id: string | null;
      player2Id: string | null;
      winnerId: string | null;
      sessionId: string | null;
    }>;
  }>;
}
