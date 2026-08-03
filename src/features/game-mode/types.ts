/**
 * EduBek — Game Mode Strategy interface.
 *
 * EduBek is the platform. Live Quiz is one feature. Inside Live Quiz
 * there are multiple Game Modes. Every Game Mode (Classic Quiz, Treasure
 * Heist, Empire Builder, Quiz Royale, Battle Royale, plus any future
 * custom Game Mode) implements this interface.
 *
 * The Live Quiz Engine loads the proper strategy via `getGameMode(mode)`
 * and delegates all Game-Mode-specific rules to it. The engine itself
 * never branches on the Game Mode name — there are no if/else chains
 * and no switch statements.
 *
 * Lifecycle:
 *   createSession()  → initialize Game-Mode-specific state on each player
 *   startRound()     → prepare the round (e.g. deal resources, hearts)
 *   processAnswer()  → grade the answer + apply Game-Mode-specific scoring
 *   finishRound()    → aggregate per-round results
 *   calculateScores()→ recompute the leaderboard
 *   determineWinner()→ pick the winner (and any eliminations)
 *   applyRewards()   → grant XP/coins/achievements via the reward service
 *   finishGame()     → finalize Game-Mode-specific state (e.g. empire stats)
 *
 * Adding a new Game Mode:
 *   1. Implement `GameModeStrategy` in `src/features/game-mode/modes/<name>.ts`.
 *   2. Register it in `src/features/game-mode/registry.ts`.
 *   3. Done. No engine changes required.
 */

import type { QuestionPayload } from "@/features/question-bank/types";

// ---------------------------------------------------------------------------
// Mode configuration
// ---------------------------------------------------------------------------

export interface GameModeConfig {
  /** Total rounds in the session. */
  totalRounds: number;
  /** Per-question time limit in milliseconds. */
  questionDurationMs: number;
  /** Whether to shuffle question order. */
  shuffleQuestions: boolean;
  /** Whether to shuffle answer options within each question. */
  shuffleAnswers: boolean;
  /** Reveal correct answer after each round. */
  revealAfterRound: boolean;
  /** Show a leaderboard screen after each round. */
  leaderboardAfterRound: boolean;
  /** Game-Mode-specific tuning knobs (e.g. hearts count, starting gold). */
  modeParams?: Record<string, unknown>;
}

export const DEFAULT_GAME_MODE_CONFIG: GameModeConfig = {
  totalRounds: 10,
  questionDurationMs: 30_000,
  shuffleQuestions: false,
  shuffleAnswers: false,
  revealAfterRound: true,
  leaderboardAfterRound: true,
};

// ---------------------------------------------------------------------------
// Participant state (Game-Mode-agnostic shell + Game-Mode-specific extension)
// ---------------------------------------------------------------------------

export interface PlayerModeState {
  /** Game-Mode-agnostic scoring — every Game Mode updates this. */
  score: number;
  /** Game-Mode-specific state blob (hearts, gold, empire, etc.). */
  modeState: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Round / Answer inputs
// ---------------------------------------------------------------------------

export interface RoundContext {
  sessionId: string;
  roundNumber: number;
  questionId: string | null;
  questionType: string;
  questionPayload: QuestionPayload | null;
  startedAt: Date;
  durationMs: number;
}

export interface AnswerInput {
  playerId: string;
  userId: string;
  answer: unknown;
  responseMs: number;
  isCorrect: boolean;
}

export interface RoundResult {
  playerId: string;
  isCorrect: boolean;
  responseMs: number;
  pointsAwarded: number;
  /** Game-Mode-specific outcome tag (e.g. 'eliminated', 'shield_blocked', 'stolen_from'). */
  outcome?: string;
  /** Game-Mode-specific per-participant delta (gold delta, hearts delta, etc.). */
  delta?: { [key: string]: number | undefined };
}

// ---------------------------------------------------------------------------
// Leaderboard entry shape returned by calculateScores
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  playerId: string;
  userId: string;
  displayName: string;
  score: number;
  rank: number;
  accuracy: number;
  avgResponseMs: number;
  streak: number;
  /** Game-Mode-specific display data (hearts, gold, empire power, etc.). */
  modeDisplay?: Record<string, unknown>;
  /** Change in rank since the previous leaderboard snapshot (-N, 0, +N). */
  rankChange?: number;
  eliminated?: boolean;
  // ---- Phase 4C.1 additive fields (all optional, backward-compatible) ----
  /** Rank in the previous leaderboard snapshot. Null for round 0. */
  previousRank?: number | null;
  /** Number of correct answers so far. */
  correctAnswers?: number;
  /** Number of wrong (or no-) answers so far. */
  wrongAnswers?: number;
  /** Alias of avgResponseMs (kept for clarity in DTOs). */
  averageResponseMs?: number;
  /** Longest correct-answer streak achieved so far. */
  longestStreak?: number;
  /** True if this participant is the current leader (rank 1). */
  isLeader?: boolean;
  /** True if this participant is the declared winner (final snapshot only). */
  isWinner?: boolean;
}

// ---------------------------------------------------------------------------
// Reward spec — passed to the reward service by applyRewards
// ---------------------------------------------------------------------------

export interface RewardSpec {
  userId: string;
  rewardType: "xp" | "coins" | "achievement" | "streak" | "badge" | "season_points" | "title";
  amount?: number;
  code?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Strategy interface
// ---------------------------------------------------------------------------

/**
 * Optional Game Mode metadata. Phase 4C.1 introduces these as additive
 * fields on the strategy — modes that don't override them get sensible
 * defaults (see `DEFAULT_GAME_MODE_METADATA`).
 *
 * This is metadata only. Game logic remains unchanged.
 */
export interface GameModeMetadata {
  /** Difficulty rating for UI badges: "easy" | "medium" | "hard". */
  difficulty?: "easy" | "medium" | "hard";
  /** Recommended participant count (e.g. 2 for Battle Royale, 50 for Classic Quiz). */
  recommendedPlayers?: number;
  /** Estimated total Quiz Session duration in seconds (for lobby UI). */
  estimatedDurationSec?: number;
  /**
   * Phase 4E.3: Translation key for the display name (e.g. "gameModes.classic").
   * The frontend resolves this to a localized string.
   */
  displayNameKey?: string;
  /**
   * Phase 4E.3: Translation key for the description.
   */
  descriptionKey?: string;
  /** Whether this Game Mode supports team-based play (reserved for future team modes). */
  supportsTeams?: boolean;
  /** Whether this Game Mode is suitable for tournament brackets. */
  supportsTournament?: boolean;
  /** Whether spectators get a meaningful view of this Game Mode. */
  supportsSpectators?: boolean;
  /** Whether replays are useful for this Game Mode (always true today). */
  supportsReplay?: boolean;
  /** One-line description for compact UI surfaces (cards, dropdowns). */
  shortDescription?: string;
  /** Icon name from the lucide-react icon set (e.g. "trophy", "swords", "crown"). */
  iconName?: string;
  /** Theme color as a hex string (e.g. "#3b82f6") for UI theming. */
  themeColor?: string;
}

export const DEFAULT_GAME_MODE_METADATA: GameModeMetadata = {
  difficulty: "medium",
  recommendedPlayers: 10,
  estimatedDurationSec: 600,
  supportsTeams: false,
  supportsTournament: true,
  supportsSpectators: true,
  supportsReplay: true,
  shortDescription: "",
  iconName: "gamepad",
  themeColor: "#3b82f6",
};

export interface GameModeStrategy {
  /** Stable identifier — matches the value stored on `LiveSession.gameMode`. */
  readonly id: string;
  /** Human-friendly name (used in UI + analytics). */
  readonly name: string;
  /** Short description for the lobby UI. */
  readonly description: string;
  /**
   * Optional metadata for UI/analytics (Phase 4C.1). Strategies that
   * don't define this fall back to `DEFAULT_GAME_MODE_METADATA`.
   */
  readonly metadata?: GameModeMetadata;

  /**
   * Initialize Game-Mode-specific state for a participant joining the
   * Quiz Session. Returns the initial `PlayerModeState` to be persisted
   * on the participant row.
   *
   * Called when a participant joins (Lobby → Quiz Session transition).
   */
  createSession(player: { userId: string; displayName: string }, config: GameModeConfig): PlayerModeState;

  /**
   * Prepare the upcoming round. May mutate Game-Mode state (e.g. deal
   * a random event card in Empire Builder). Returns the round-level
   * metadata to be broadcast to participants (e.g. the random event
   * name).
   */
  startRound(ctx: RoundContext, players: Array<{ playerId: string; modeState: PlayerModeState }>, config: GameModeConfig): {
    roundMetadata?: Record<string, unknown>;
  };

  /**
   * Grade a single participant's answer + compute the points/Game-Mode-delta.
   *
   * The base answer correctness (`isCorrect`) is computed by the engine
   * via the assessment auto-grader — the strategy does NOT re-grade the
   * answer. The strategy decides how to translate correctness into
   * points + Game-Mode-specific consequences (e.g. lose a heart in
   * Quiz Royale).
   */
  processAnswer(
    input: AnswerInput,
    player: { playerId: string; modeState: PlayerModeState },
    ctx: RoundContext,
    config: GameModeConfig,
  ): RoundResult;

  /**
   * Aggregate per-round results. Called after all players have answered
   * (or the timer expired). Returns the round-level summary to broadcast.
   */
  finishRound(
    ctx: RoundContext,
    results: RoundResult[],
    players: Array<{ playerId: string; modeState: PlayerModeState }>,
    config: GameModeConfig,
  ): {
    resultsSnapshot: Record<string, RoundResult>;
    /** Players to eliminate this round (e.g. Royale mode). */
    eliminated?: string[];
    roundMetadata?: Record<string, unknown>;
  };

  /**
   * Recompute the leaderboard. Called after every round.
   * Returns the full sorted leaderboard.
   */
  calculateScores(
    players: Array<{
      playerId: string;
      userId: string;
      displayName: string;
      modeState: PlayerModeState;
      correctCount: number;
      answeredCount: number;
      totalResponseMs: number;
      currentStreak: number;
    }>,
    previousLeaderboard: LeaderboardEntry[] | null,
    config: GameModeConfig,
  ): LeaderboardEntry[];

  /**
   * Pick the winner(s). Called when the session ends (all rounds done OR
   * only one player left in elimination modes).
   */
  determineWinner(
    leaderboard: LeaderboardEntry[],
    players: Array<{ playerId: string; modeState: PlayerModeState }>,
    config: GameModeConfig,
  ): {
    winnerPlayerId: string | null;
    winnerUserId: string | null;
    finalists: string[];
    reason: string;
  };

  /**
   * Grant rewards to players. Called after determineWinner.
   * The strategy returns the list of rewards to grant; the engine passes
   * them to the reward service which persists them + publishes events.
   */
  applyRewards(
    leaderboard: LeaderboardEntry[],
    winner: { playerId: string | null; userId: string | null },
    config: GameModeConfig,
  ): RewardSpec[];

  /**
   * Finalize Game-Mode state. Called when the Quiz Session transitions to `finished`.
   * Returns a final Game-Mode-state snapshot for the Replay.
   */
  finishGame(
    leaderboard: LeaderboardEntry[],
    config: GameModeConfig,
  ): { finalSnapshot: Record<string, unknown> };
}
