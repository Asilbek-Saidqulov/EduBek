/**
 * EduBek — Universal Game Engine types.
 * Phase 6G.1: Match lifecycle, players, sessions, synchronization, timers,
 * rounds, scoring pipeline, replay, reconnect, spectators, events, state
 * transitions. Server authoritative. No game-specific logic. No scoring formulas.
 * Every future game mode is a configuration layer on top of this engine.
 */

// ===========================================================================
// SYSTEM 1 — Universal Match Engine
// ===========================================================================
export type MatchState =
  | "idle" | "lobby" | "waiting_for_players" | "ready_check" | "countdown"
  | "round_starting" | "question_active" | "answer_collection" | "answer_lock"
  | "scoring" | "animations" | "leaderboard" | "round_finished" | "next_round"
  | "match_finished" | "rewards" | "replay_saved" | "archived" | "cancelled";

export interface MatchSettings {
  gameMode: string; maxPlayers: number; minPlayers: number;
  roundCount: number; questionPerRound: number;
  timePerQuestion: number; allowLateJoin: boolean; allowSpectators: boolean;
  isPrivate: boolean; pin: string | null; organizationRestricted: boolean;
}

export interface MatchStatistics {
  totalRounds: number; totalQuestions: number; totalAnswers: number;
  averageAnswerTimeMs: number; dropoutCount: number; reconnectCount: number;
  spectatorPeakCount: number; durationMs: number;
}

export interface Match {
  id: string; hostId: string; organizationId: string | null;
  gameMode: string; state: MatchState;
  players: MatchPlayer[]; spectators: string[];
  settings: MatchSettings; statistics: MatchStatistics;
  currentRound: number; currentQuestion: number;
  createdAt: string; startedAt: string | null; finishedAt: string | null;
}

export interface MatchPlayer {
  userId: string; displayName: string; team: string | null;
  isReady: boolean; isHost: boolean; isEliminated: boolean;
  joinedAt: string; score: number;
}

// ===========================================================================
// SYSTEM 2 — Lifecycle State Machine
// ===========================================================================
export interface LifecycleTransition {
  from: MatchState; to: MatchState; valid: boolean; reason: string | null;
}

export interface LifecycleValidationResult {
  valid: boolean; currentState: MatchState; attemptedTransition: MatchState;
  reason: string | null;
}

// ===========================================================================
// SYSTEM 3 — Lobby Engine
// ===========================================================================
export interface LobbyState {
  matchId: string; locked: boolean; playerCount: number;
  maxPlayers: number; minPlayers: number; isPrivate: boolean;
  pin: string | null; inviteLink: string | null;
  players: Array<{ userId: string; displayName: string; team: string | null; isReady: boolean }>;
}

export interface LobbyActionResult {
  success: boolean; lobby: LobbyState; message: string;
}

// ===========================================================================
// SYSTEM 4 — Player Session Engine
// ===========================================================================
export type SessionStatus = "connected" | "connecting" | "reconnecting" | "disconnected" | "inactive" | "left" | "eliminated" | "spectator";

export interface PlayerSession {
  userId: string; matchId: string; status: SessionStatus;
  heartbeatAt: string; ping: number; latencyMs: number;
  connectionQuality: "excellent" | "good" | "fair" | "poor";
  reconnectAttempts: number; lastDisconnectAt: string | null;
}

// ===========================================================================
// SYSTEM 5 — Ready Check Engine
// ===========================================================================
export interface ReadyCheckState {
  matchId: string; allReady: boolean; readyCount: number; notReadyCount: number;
  afkCount: number; disconnectedCount: number; totalCount: number;
  teacherOverride: boolean; canStart: boolean;
}

// ===========================================================================
// SYSTEM 6 — Round Engine
// ===========================================================================
export interface RoundInfo {
  roundNumber: number; matchId: string; state: string;
  questionCount: number; currentQuestionIndex: number;
  startedAt: string | null; finishedAt: string | null;
  durationMs: number | null;
}

// ===========================================================================
// SYSTEM 7 — Question Pipeline
// ===========================================================================
export type QuestionPhase = "preload" | "asset_preload" | "validation" | "published" | "answer_collection" | "answer_lock" | "answer_reveal" | "result_publish";

export interface QuestionState {
  questionId: string; matchId: string; roundNumber: number;
  questionIndex: number; phase: QuestionPhase;
  publishedAt: string | null; answerDeadline: string | null;
  answerLockAt: string | null; revealAt: string | null;
  collectedAnswers: number; totalPlayers: number;
}

// ===========================================================================
// SYSTEM 8 — Timer Engine
// ===========================================================================
export interface TimerState {
  matchId: string; type: "countdown" | "question" | "round" | "match";
  remaining: number; total: number; isPaused: boolean;
  startedAt: string | null; expiresAt: string | null;
  serverTime: string; driftMs: number; latencyCompensationMs: number;
  teacherOverride: boolean;
}

// ===========================================================================
// SYSTEM 9 — Synchronization Engine
// ===========================================================================
export interface SyncSnapshot {
  matchId: string; sequenceNumber: number; timestamp: string;
  matchState: MatchState; currentRound: number; currentQuestion: number;
  playerScores: Array<{ userId: string; score: number }>;
  timerRemaining: number;
}

export interface SyncEvent {
  matchId: string; sequenceNumber: number; type: string;
  timestamp: string; payload: Record<string, unknown>;
}

export interface SyncReport {
  matchId: string; lastSequenceNumber: number; snapshot: SyncSnapshot | null;
  pendingEvents: number; avgLatencyMs: number; driftMs: number;
  outOfOrderCount: number; duplicateCount: number;
}

// ===========================================================================
// SYSTEM 10 — Event Engine
// ===========================================================================
export type GameEventType =
  | "MatchCreated" | "PlayerJoined" | "PlayerLeft" | "PlayerKicked" | "PlayerBanned"
  | "ReadyChanged" | "CountdownStarted" | "RoundStarted" | "QuestionShown"
  | "AnswerSubmitted" | "AnswerLocked" | "TimerExpired" | "TimerPaused" | "TimerResumed"
  | "RoundFinished" | "MatchFinished" | "ReplaySaved" | "PlayerDisconnected"
  | "PlayerReconnected" | "SpectatorJoined" | "SpectatorLeft" | "ScoreUpdated"
  | "ResourceChanged" | "StateTransition" | "TeacherOverride" | "AntiCheatFinding";

export interface GameEvent {
  id: string; matchId: string; type: GameEventType;
  sequenceNumber: number; timestamp: string;
  actorId: string | null; payload: Record<string, unknown>;
}

// ===========================================================================
// SYSTEM 11 — Score Pipeline Foundation
// ===========================================================================
export interface ScoreEvent {
  matchId: string; userId: string; roundNumber: number; questionIndex: number;
  eventType: string; rawValue: number; normalizedValue: number | null;
  validated: boolean; timestamp: string;
}

export interface ScorePipelineReport {
  matchId: string; totalEvents: number; validatedEvents: number;
  rejectedEvents: number; publishedEvents: number;
}

// ===========================================================================
// SYSTEM 12 — Resource Pipeline Foundation
// ===========================================================================
export type ResourceAction = "earned" | "spent" | "transferred" | "lost";

/**
 * Conceptual category for a registered resource. This is a METADATA field only —
 * the engine's Resource Pipeline treats all resources identically internally
 * (same earn/spend/transfer/lost mechanics). The category exists for:
 *   - Documentation: makes the architecture's resource taxonomy explicit
 *   - UI grouping: dashboards can group economy vs survival resources
 *   - Analytics: reports can break down resource flow by category
 *   - Future tooling: validators, dashboards, and balance tools can reason
 *     about resource semantics without modifying engine logic
 *
 * Conceptual hierarchy:
 *
 *   Engine Resource Pipeline
 *   ├── Economy Resources  — spendable/earnable currencies (Gold, Wood, Stone,
 *   │                        Food, Energy, …). Used by Treasure Heist, Empire
 *   │                        Builder, and future economy-driven modes.
 *   ├── Survival Resources — determine player survival (Lives, Shields).
 *   │                        Used by Quiz Royale and future survival modes.
 *   │                        Internally still flows through Resource Pipeline.
 *   └── Custom Resources   — game-mode-specific resources not fitting either
 *                             bucket (e.g. a future "Mana" or "Inspiration").
 *
 * Adding `category` is OPTIONAL and non-breaking. Existing callers that omit
 * it are treated as `category: "custom"`.
 */
export type ResourceCategory = "economy" | "survival" | "custom";

export interface ResourceEvent {
  matchId: string; userId: string; resourceType: string;
  action: ResourceAction; amount: number; balance: number;
  timestamp: string; metadata: Record<string, unknown>;
}

export interface ResourceRegistration {
  resourceType: string; displayName: string; initialValue: number;
  maxValue: number | null; minValue: number;
  /** Optional conceptual category. Defaults to "custom" when omitted. */
  category?: ResourceCategory;
}

/**
 * Death reason taxonomy — structured WHY a player was eliminated.
 *
 * Production games record WHY a player died, not just THAT they died. This
 * structured field powers:
 *   - Analytics: distribution of death causes per match / per cohort
 *   - Replay: clearer timeline annotations ("Alice timed out", "Bob was AFK")
 *   - Tournaments: dispute resolution evidence
 *   - Anti-cheat: distinguish "disconnected" from "rule_violation"
 *   - Moderation: surface repeated AFK / rule violations for review
 *
 * The engine does NOT interpret or branch on these reasons — they are pure
 * metadata stored on elimination records and emitted via events. Game modes
 * choose which `DeathReason` applies to each elimination path.
 */
export type DeathReason =
  | "wrong_answer"        // Player answered incorrectly and ran out of lives
  | "timeout"             // Player failed to answer in time
  | "disconnected"        // Player lost network connection
  | "teacher_removed"     // Teacher/host manually removed the player
  | "afk"                 // Player was inactive for too long (away-from-keyboard)
  | "manual_elimination"  // Eliminated by an explicit game-mode action (e.g. sudden death)
  | "rule_violation"      // Player violated a game rule (cheating, abuse, etc.)
  | "reconnect_expired";  // Player disconnected and grace period elapsed

/** Canonical list of all DeathReason values. Useful for validation + UI. */
export const DEATH_REASONS: readonly DeathReason[] = [
  "wrong_answer",
  "timeout",
  "disconnected",
  "teacher_removed",
  "afk",
  "manual_elimination",
  "rule_violation",
  "reconnect_expired",
] as const;

/** Type guard: returns true if `value` is a valid DeathReason. */
export function isDeathReason(value: string): value is DeathReason {
  return (DEATH_REASONS as readonly string[]).includes(value);
}

// ===========================================================================
// SYSTEM 13 — Replay Engine Foundation
// ===========================================================================
export interface ReplayRecord {
  matchId: string; events: GameEvent[]; stateTransitions: LifecycleTransition[];
  totalEvents: number; durationMs: number; participants: string[];
  createdAt: string;
}

export interface ReplayState {
  matchId: string; currentTime: number; totalTime: number;
  isPlaying: boolean; speed: number; currentEventIndex: number;
  reconstructedState: Record<string, unknown>;
}

// ===========================================================================
// SYSTEM 14 — Spectator Engine
// ===========================================================================
export interface SpectatorSession {
  userId: string; matchId: string; role: "teacher" | "admin" | "parent" | "tournament_viewer" | "observer";
  joinedAt: string; read: boolean;
}

// ===========================================================================
// SYSTEM 15 — Reconnect Engine
// ===========================================================================
export interface RecoveryState {
  userId: string; matchId: string; recovered: boolean;
  recoveredState: Record<string, unknown>; recoveredScore: number;
  recoveredQuestion: number; recoveredTimer: number;
  missingEvents: number; recoveryTimeMs: number;
}

// ===========================================================================
// SYSTEM 16 — Anti-Cheat Foundation
// ===========================================================================
export type CheatKind = "impossible_timestamp" | "duplicate_submission" | "answer_spam" | "multiple_submissions" | "modified_packet";

export interface CheatFinding {
  id: string; matchId: string; userId: string; kind: CheatKind;
  severity: "low" | "medium" | "high" | "critical";
  description: string; evidence: string; timestamp: string;
}

// ===========================================================================
// SYSTEM 17 — Match Recorder
// ===========================================================================
export interface MatchRecord {
  matchId: string; events: number; statistics: MatchStatistics;
  participants: string[]; timeline: Array<{ timestamp: string; event: string; details: string }>;
  performance: { avgLatencyMs: number; maxLatencyMs: number; serverLoad: number };
  recordedAt: string;
}

// ===========================================================================
// SYSTEM 18 — Universal Game Analytics
// ===========================================================================
export interface GameAnalyticsReport {
  generatedAt: string;
  totalMatches: number; activeMatches: number; completedMatches: number;
  totalPlayers: number; peakConcurrentPlayers: number;
  avgMatchDurationMs: number; avgLatencyMs: number;
  dropoutRate: number; reconnectRate: number;
  avgQuestionTimeMs: number; avgAnswerTimeMs: number;
  spectatorCount: number; teacherInterventions: number;
  completionRate: number;
}
