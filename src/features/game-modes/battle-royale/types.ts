/**
 * EduBek — Battle Royale Production Edition types.
 * Phase 6G.6: Tournament bracket, duel engine & championship platform.
 *
 * Architecture:
 *   Battle Royale is a 1v1 tournament system built ENTIRELY as a
 *   configuration / rules layer on top of the Universal Game Engine
 *   (Phase 6G.1). Every duel reuses the engine's createMatch,
 *   lifecycle, lobby, sessions, rounds, timers, sync, events, replay,
 *   spectators, reconnect, anti-cheat, score pipeline and analytics.
 *
 *   Battle Royale only registers: tournament rules, bracket configuration,
 *   duel rules, advancement rules, seeding strategies, championship logic,
 *   leaderboard strategy, achievements, UI state mapping, gameplay
 *   orchestration.
 *
 *   Zero Universal Game Engine code is duplicated or modified.
 *
 * Design constraint:
 *   Battle Royale MUST NOT implement its own quiz mechanics. Each duel is
 *   a standard engine-managed match; Battle Royale supplies tournament
 *   rules + orchestration only. This keeps the architecture consistent
 *   with Classic Quiz, Treasure Heist, Empire Builder and Quiz Royale,
 *   where the Universal Game Engine remains the single source of truth
 *   for multiplayer behavior.
 */

// ===========================================================================
// System 1 — Tournament Engine
// ===========================================================================

export type TournamentFormat = "single_elimination" | "double_elimination" | "custom_bracket";

export interface BattleRoyaleRules {
  gameMode: "battle_royale";
  format: TournamentFormat;
  minPlayers: number;
  maxPlayers: number;
  bracketSize: BracketSize;
  bronzeMatchEnabled: boolean;
  thirdPlaceMatchEnabled: boolean;
  reseedingEnabled: boolean;
  overtimeEnabled: boolean;
  overtimeMs: number;
  tieResolution: TieResolutionStrategy;
  allowSpectators: boolean;
  allowLateJoin: boolean;
  reconnectPolicy: "allow" | "deny" | "limited";
  reconnectGraceMs: number;
  hostControls: string[];
  organizationRestricted: boolean;
  /** Best-of-N questions per duel (e.g. 5 = Best of 5). */
  duelQuestionsPerMatch: number;
  duelTimePerQuestionMs: number;
  duelWinCondition: "highest_score" | "first_to_n" | "fastest_average";
  /** When first_to_n is used, N is the target correct answers. */
  duelTargetCorrect: number;
  /** Per-duel reward scoring. */
  basePointsPerCorrect: number;
  speedBonusFastMs: number;
  speedBonusFastPoints: number;
  speedBonusMediumMs: number;
  speedBonusMediumPoints: number;
}

// ===========================================================================
// System 2 — Bracket Engine
// ===========================================================================

export type BracketSize = 8 | 16 | 32 | 64 | 128 | 256;

export type BracketRoundName =
  | "round_of_256"
  | "round_of_128"
  | "round_of_64"
  | "round_of_32"
  | "round_of_16"
  | "quarterfinal"
  | "semifinal"
  | "final"
  | "bronze_match";

export interface BracketSlot {
  /** Stable slot id within the bracket (e.g. "R1-S1"). */
  id: string;
  roundIndex: number;
  roundName: BracketRoundName;
  slotIndex: number;
  /** Player assigned to this slot (null = TBD / bye). */
  playerId: string | null;
  playerDisplayName: string | null;
  seed: number | null;
  /** True when the slot is an automatic-advance bye. */
  isBye: boolean;
  /** Set when this slot's player has won the duel and advanced. */
  advancedToSlotId: string | null;
}

export interface BracketMatch {
  id: string;
  roundIndex: number;
  roundName: BracketRoundName;
  slotA: BracketSlot;
  slotB: BracketSlot;
  /** Engine match id once the duel is created. */
  engineMatchId: string | null;
  status: DuelStatus;
  winnerId: string | null;
  loserId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  /** Visual metadata for the bracket UI (position, parent slot ids). */
  visual: BracketVisual;
}

export interface BracketVisual {
  /** X position hint for rendering (column index). */
  column: number;
  /** Y position hint for rendering (row index within column). */
  row: number;
  /** Slot id of the next-round slot the winner advances to. */
  nextSlotId: string | null;
  /** Slot ids feeding into this slot (empty for first round). */
  sourceSlotIds: string[];
}

export interface Bracket {
  tournamentId: string;
  size: BracketSize;
  rounds: number;
  totalSlots: number;
  totalMatches: number;
  slots: BracketSlot[];
  matches: BracketMatch[];
  /** Champion slot id once the final is decided. */
  championSlotId: string | null;
  /** Runner-up slot id once the final is decided. */
  runnerUpSlotId: string | null;
  /** Bronze winner slot id (if bronze match enabled and played). */
  bronzeSlotId: string | null;
  createdAt: string;
}

// ===========================================================================
// System 3 — Seeding Engine
// ===========================================================================

export type SeedingStrategy =
  | "random"
  | "previous_score"
  | "teacher_defined"
  | "rating_based"
  | "organization_ranking"
  | "balanced_random";

export interface SeedingInput {
  userId: string;
  displayName: string;
  /** Optional previous score for previous_score strategy. */
  previousScore?: number;
  /** Optional rating for rating_based strategy. */
  rating?: number;
  /** Optional org rank for organization_ranking strategy. */
  organizationRank?: number;
  /** Optional teacher-defined seed for teacher_defined strategy. */
  teacherSeed?: number;
}

export interface SeedingResult {
  userId: string;
  displayName: string;
  seed: number;
  strategy: SeedingStrategy;
}

// ===========================================================================
// System 4 — Duel Engine
// ===========================================================================

export type DuelStatus =
  | "pending"
  | "ready"
  | "in_progress"
  | "completed"
  | "walkover"
  | "cancelled";

export interface DuelConfig {
  questionsPerMatch: number;
  timePerQuestionMs: number;
  winCondition: "highest_score" | "first_to_n" | "fastest_average";
  targetCorrect: number;
  overtimeEnabled: boolean;
  overtimeMs: number;
  tieBreaker: TieResolutionStrategy;
}

export interface DuelResult {
  duelId: string;
  engineMatchId: string;
  playerAId: string;
  playerBId: string;
  winnerId: string | null;
  loserId: string | null;
  scoreA: number;
  scoreB: number;
  correctA: number;
  correctB: number;
  avgSpeedMsA: number;
  avgSpeedMsB: number;
  /** Reason the duel ended (normal, walkover, forfeit, teacher_decision, etc.). */
  endReason: string;
  /** Structured loss reason for the loser (mirrors DeathReason pattern). */
  lossReason: DuelLossReason | null;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
}

export type DuelLossReason =
  | "lower_score"
  | "timeout"
  | "disconnected"
  | "forfeit"
  | "teacher_removed"
  | "tie_breaker_loss"
  | "no_show"
  | "rule_violation";

// ===========================================================================
// System 5 — Advancement Engine
// ===========================================================================

export type AdvancementEventKind =
  | "advanced"
  | "byes_assigned"
  | "walkover"
  | "champion_decided"
  | "runner_up_decided"
  | "bronze_decided";

export interface AdvancementEvent {
  id: string;
  tournamentId: string;
  kind: AdvancementEventKind;
  roundIndex: number;
  fromSlotId: string | null;
  toSlotId: string | null;
  playerId: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 6 — Bye Engine
// ===========================================================================

export interface ByeAssignment {
  slotId: string;
  playerId: string;
  roundIndex: number;
  reason: "bracket_imbalance" | "teacher_grant" | "walkover_no_opponent";
  advancedToSlotId: string | null;
  timestamp: string;
}

// ===========================================================================
// System 7 — Walkover Engine
// ===========================================================================

export type WalkoverReason =
  | "absent"
  | "disconnect_timeout"
  | "forfeit"
  | "teacher_removed"
  | "no_show";

export interface WalkoverRecord {
  id: string;
  tournamentId: string;
  duelId: string;
  absentPlayerId: string;
  advancingPlayerId: string;
  reason: WalkoverReason;
  auditNote: string;
  timestamp: string;
}

// ===========================================================================
// System 8 — Tie Resolution Engine
// ===========================================================================

export type TieResolutionStrategy =
  | "fastest_response"
  | "sudden_death"
  | "extra_question"
  | "teacher_decision";

export interface TieResolutionResult {
  duelId: string;
  strategy: TieResolutionStrategy;
  winnerId: string;
  loserId: string;
  /** Human-readable explanation (e.g. "Player A answered 3 questions in 4.2s avg"). */
  explanation: string;
  /** For teacher_decision: the teacher who decided. */
  decidedBy: string | null;
  timestamp: string;
}

// ===========================================================================
// System 9 — Championship Engine
// ===========================================================================

export type ChampionshipStage =
  | "pending"
  | "quarterfinals"
  | "semifinals"
  | "final"
  | "bronze_match"
  | "champion_crowned"
  | "tournament_complete";

export interface ChampionshipState {
  tournamentId: string;
  stage: ChampionshipStage;
  championId: string | null;
  championDisplayName: string | null;
  runnerUpId: string | null;
  runnerUpDisplayName: string | null;
  bronzeId: string | null;
  bronzeDisplayName: string | null;
  finalistCount: number;
  celebrationEvents: CelebrationEvent[];
  crownedAt: string | null;
}

export interface CelebrationEvent {
  id: string;
  kind: "champion_crowned" | "runner_up_recognized" | "bronze_decided" | "tournament_complete";
  playerId: string;
  displayName: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

// ===========================================================================
// System 10 — Leaderboards
// ===========================================================================

export type BattleRoyaleLeaderboardType =
  | "tournament_ranking"
  | "champion"
  | "runner_up"
  | "bronze"
  | "wins"
  | "losses"
  | "question_accuracy"
  | "response_speed"
  | "tournament_score"
  | "teacher_dashboard"
  | "final_standings";

export interface BattleRoyaleLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  seed: number | null;
  wins: number;
  losses: number;
  tournamentScore: number;
  accuracy: number;
  avgSpeedMs: number;
  finalRank: number | null;
  eliminated: boolean;
  eliminatedInRound: number | null;
}

// ===========================================================================
// System 11 — Achievements (18 total)
// ===========================================================================

export interface BattleRoyaleAchievement {
  id: string;
  name: string;
  description: string;
  condition: (s: BattleRoyaleAchievementStats) => boolean;
  xpReward: number;
}

export interface BattleRoyaleAchievementStats {
  won: boolean;
  isChampion: boolean;
  isRunnerUp: boolean;
  isBronze: boolean;
  duelsWon: number;
  duelsLost: number;
  perfectDuels: number;
  flawlessTournament: boolean;
  comebacks: number;
  fastestResponseMs: number;
  initialSeed: number | null;
  finalRank: number | null;
  totalCorrect: number;
  totalAnswered: number;
  longestWinStreak: number;
  upsetVictories: number;
  tournamentComplete: boolean;
  avgDuelDurationMs: number;
}

// ===========================================================================
// System 12 — Tournament Flow
// ===========================================================================

export type TournamentPhase =
  | "registration"
  | "seeding"
  | "bracket_generation"
  | "round_start"
  | "duel"
  | "validation"
  | "winner"
  | "advancement"
  | "bracket_update"
  | "next_round"
  | "final"
  | "champion_ceremony";

// ===========================================================================
// System 13 — Teacher Controls
// ===========================================================================

export type BattleRoyaleTeacherAction =
  | "pause_tournament"
  | "resume_tournament"
  | "restart_duel"
  | "skip_duel"
  | "force_advance"
  | "replace_player"
  | "grant_bye"
  | "freeze_bracket"
  | "reveal_bracket"
  | "hide_bracket"
  | "inject_match"
  | "emergency_stop"
  | "end_tournament";

export interface BattleRoyaleTeacherResult {
  action: BattleRoyaleTeacherAction;
  success: boolean;
  audited: boolean;
  eventId: string | null;
  message: string;
}

// ===========================================================================
// System 14 — Student UX
// ===========================================================================

export type BattleRoyaleStudentUXState =
  | "lobby"
  | "waiting"
  | "bracket"
  | "preparing"
  | "duel"
  | "victory"
  | "defeat"
  | "advanced"
  | "eliminated"
  | "watching"
  | "final"
  | "champion"
  | "disconnected"
  | "reconnect"
  | "paused"
  | "summary"
  | "replay"
  | "finished";

// ===========================================================================
// System 15 — Tournament Analytics
// ===========================================================================

export interface BattleRoyaleAnalytics {
  tournamentId: string;
  totalDuels: number;
  completedDuels: number;
  avgDuelDurationMs: number;
  bracketProgression: number;
  upsetVictories: number;
  seedingPerformance: Record<string, number>;
  disconnects: number;
  forfeits: number;
  walkovers: number;
  avgResponseTimeMs: number;
  avgAccuracy: number;
  completionRate: number;
  duelOutcomeDistribution: Record<string, number>;
  lossReasonDistribution: Record<string, number>;
}

// ===========================================================================
// System 16 — Replay Integration
// ===========================================================================

export interface BattleRoyaleReplayTimelineEntry {
  timestamp: string;
  event: string;
  details: string;
  tournamentStage: ChampionshipStage;
  duelId: string | null;
  lossReason: DuelLossReason | null;
}

// ===========================================================================
// System 17 — Spectator Experience
// ===========================================================================

export interface BattleRoyaleSpectatorView {
  tournamentId: string;
  liveBracket: Bracket;
  activeDuels: Array<{ duelId: string; playerA: string; playerB: string; roundName: string }>;
  championPrediction: Array<{ playerId: string; displayName: string; probability: number }>;
  tournamentTimeline: Array<{ timestamp: string; event: string }>;
  spectatorCount: number;
  readOnly: true;
}

// ===========================================================================
// System 18 — Accessibility
// ===========================================================================

export interface BattleRoyaleAccessibilityConfig {
  keyboard: boolean;
  screenReader: boolean;
  reducedMotion: boolean;
  colorBlind: boolean;
  largeUI: boolean;
  highContrast: boolean;
  captions: boolean;
  localization: boolean;
}

// ===========================================================================
// System 19 — Tournament Dashboard
// ===========================================================================

export interface BattleRoyaleDashboard {
  tournamentId: string;
  currentBracket: Bracket;
  activeMatches: number;
  waitingMatches: number;
  currentRound: number;
  championPrediction: Array<{ playerId: string; displayName: string; probability: number }>;
  teacherActions: number;
  avgLatencyMs: number;
  reconnects: number;
  matchHealth: "healthy" | "warning" | "critical";
  tournamentProgress: number;
  stage: ChampionshipStage;
  leaderboard: BattleRoyaleLeaderboardEntry[];
}

// ===========================================================================
// System 20 — Competitive Balance
// ===========================================================================

export type CompetitivePreset = "classroom" | "school" | "regional" | "national" | "championship";

export interface BalancePreset {
  name: CompetitivePreset;
  label: string;
  rules: Partial<BattleRoyaleRules>;
}

// ===========================================================================
// Tournament State (in-memory — no Prisma)
// ===========================================================================

export interface TournamentState {
  id: string;
  hostId: string;
  organizationId: string | null;
  rules: BattleRoyaleRules;
  preset: CompetitivePreset;
  registeredPlayers: SeedingInput[];
  seedingStrategy: SeedingStrategy;
  seedingResults: SeedingResult[];
  bracket: Bracket | null;
  championship: ChampionshipState;
  advancementEvents: AdvancementEvent[];
  byes: ByeAssignment[];
  walkovers: WalkoverRecord[];
  tieResolutions: TieResolutionResult[];
  duels: DuelResult[];
  phase: TournamentPhase;
  paused: boolean;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}
