/**
 * EduBek — Live Quiz Leaderboard module types.
 *
 * The leaderboard service persists snapshots of the Quiz Session
 * leaderboard after each round (and at Quiz Session end). The Quiz
 * Session service computes the leaderboard via the Game Mode strategy
 * and passes it here for persistence; the socket layer broadcasts the
 * same payload to clients in real-time.
 */

export interface LeaderboardSnapshotDto {
  id: string;
  sessionId: string;
  roundNumber: number;
  entries: LeaderboardEntryDto[];
  generatedAt: string;
  createdAt: string;
}

export interface LeaderboardEntryDto {
  playerId: string;
  userId: string;
  displayName: string;
  score: number;
  rank: number;
  accuracy: number;
  avgResponseMs: number;
  streak: number;
  modeDisplay?: Record<string, unknown>;
  rankChange?: number;
  eliminated?: boolean;
  // ---- Phase 4C.1 additive fields (all optional, backward-compatible) ----
  /** Rank in the previous leaderboard snapshot. Null for round 0. */
  previousRank?: number | null;
  /** Number of correct answers so far. */
  correctAnswers?: number;
  /** Number of wrong (or no-) answers so far. */
  wrongAnswers?: number;
  /** Average response time across all answers (alias of avgResponseMs). */
  averageResponseMs?: number;
  /** Longest correct-answer streak achieved so far. */
  longestStreak?: number;
  /** True if this participant is the current leader (rank 1) — convenience for UIs. */
  isLeader?: boolean;
  /** True if this participant is the declared winner (only set on the final snapshot). */
  isWinner?: boolean;
}

export interface SaveLeaderboardInput {
  sessionId: string;
  roundNumber: number;
  entries: Array<{
    playerId: string;
    userId: string;
    displayName: string;
    score: number;
    rank: number;
    accuracy: number;
    avgResponseMs: number;
    streak: number;
    modeDisplay?: Record<string, unknown>;
    rankChange?: number;
    eliminated?: boolean;
    // Phase 4C.1 additive
    previousRank?: number | null;
    correctAnswers?: number;
    wrongAnswers?: number;
    averageResponseMs?: number;
    longestStreak?: number;
    isLeader?: boolean;
    isWinner?: boolean;
  }>;
}
