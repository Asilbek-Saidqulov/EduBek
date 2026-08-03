/**
 * EduBek — Event Contracts.
 *
 * Strongly typed contracts for every platform event. Each contract defines:
 *   - Event ID, display name, description
 *   - Producer (exactly ONE — the module that owns the event)
 *   - Consumers (unlimited — modules that subscribe)
 *   - Payload schema (deterministic, JSON-style)
 *   - Version, status, idempotency, ordering, persistence
 *   - Replay/audit support, deprecation info
 *
 * These contracts are REGISTERED in event-registry.ts, which becomes the
 * single source of truth for event definitions.
 *
 * Backward compatibility:
 *   - All existing engine GameEventType values remain valid
 *   - Existing event names are preserved
 *   - Current subscribers continue working unchanged
 *   - No gameplay behavior changes
 */
import type { EventContract } from "./event-types";

// ===========================================================================
// Universal Game Engine Events (Phase 6G.1)
// ===========================================================================

export const MATCH_CREATED_CONTRACT: EventContract = {
  eventId: "MatchCreated",
  displayName: "Match Created",
  description: "A new match was created in the Universal Game Engine.",
  producer: "universal_game_engine",
  consumers: ["analytics", "replay"],
  category: "gameplay",
  payloadType: "MatchCreatedPayload",
  schema: {
    fields: [
      { name: "matchId", type: "string", description: "The match ID", required: true, nullable: false },
      { name: "hostId", type: "string", description: "The host user ID", required: true, nullable: false },
      { name: "gameMode", type: "string", description: "The game mode ID", required: true, nullable: false },
    ],
    additionalProperties: true,
    required: ["matchId", "hostId", "gameMode"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { matchId: "m-123", hostId: "u-1", gameMode: "classic_quiz" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const MATCH_FINISHED_CONTRACT: EventContract = {
  eventId: "MatchFinished",
  displayName: "Match Finished",
  description: "A match has ended (completed, cancelled, or emergency-stopped).",
  producer: "universal_game_engine",
  consumers: ["player_progression", "competitive_platform", "analytics", "replay"],
  category: "gameplay",
  payloadType: "MatchFinishedPayload",
  schema: {
    fields: [
      { name: "gameMode", type: "string", description: "The game mode ID", required: true, nullable: false },
      { name: "result", type: "string", description: "Match result for the actor", required: false, nullable: true, enum: ["win", "loss", "draw", "participation"] },
      { name: "score", type: "number", description: "Final score", required: false, nullable: true },
      { name: "questionsCorrect", type: "number", description: "Number of correct answers", required: false, nullable: true },
      { name: "durationMs", type: "number", description: "Match duration in ms", required: false, nullable: true },
      { name: "opponentId", type: "string", description: "Opponent user ID (for 1v1)", required: false, nullable: true },
      { name: "isRanked", type: "boolean", description: "Whether ranked", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: ["gameMode"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { gameMode: "classic_quiz", result: "win", score: 500, durationMs: 60000 },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const PLAYER_JOINED_CONTRACT: EventContract = {
  eventId: "PlayerJoined",
  displayName: "Player Joined",
  description: "A player joined a match lobby.",
  producer: "universal_game_engine",
  consumers: ["analytics"],
  category: "gameplay",
  payloadType: "PlayerJoinedPayload",
  schema: {
    fields: [
      { name: "userId", type: "string", description: "The joining user ID", required: true, nullable: false },
      { name: "displayName", type: "string", description: "Display name", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: ["userId"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { userId: "u-2", displayName: "Bob" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const PLAYER_LEFT_CONTRACT: EventContract = {
  eventId: "PlayerLeft",
  displayName: "Player Left",
  description: "A player left a match (elimination, forfeit, disconnect, or voluntary leave).",
  producer: "universal_game_engine",
  consumers: ["player_progression", "competitive_platform", "analytics"],
  category: "gameplay",
  payloadType: "PlayerLeftPayload",
  schema: {
    fields: [
      { name: "reason", type: "string", description: "Leave reason", required: false, nullable: true, enum: ["eliminated", "forfeit", "rage_quit", "disconnected", "voluntary"] },
      { name: "deathReason", type: "string", description: "Structured death reason (Quiz Royale)", required: false, nullable: true },
      { name: "isRanked", type: "boolean", description: "Whether ranked", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: [],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { reason: "eliminated" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const PLAYER_DISCONNECTED_CONTRACT: EventContract = {
  eventId: "PlayerDisconnected",
  displayName: "Player Disconnected",
  description: "A player's network connection dropped.",
  producer: "universal_game_engine",
  consumers: ["competitive_platform", "analytics"],
  category: "gameplay",
  payloadType: "PlayerDisconnectedPayload",
  schema: {
    fields: [
      { name: "isRanked", type: "boolean", description: "Whether ranked", required: false, nullable: true },
      { name: "reason", type: "string", description: "Disconnect reason", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: [],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { isRanked: true, reason: "network_timeout" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const PLAYER_RECONNECTED_CONTRACT: EventContract = {
  eventId: "PlayerReconnected",
  displayName: "Player Reconnected",
  description: "A player reconnected after a disconnect.",
  producer: "universal_game_engine",
  consumers: ["analytics"],
  category: "gameplay",
  payloadType: "PlayerReconnectedPayload",
  schema: {
    fields: [
      { name: "reason", type: "string", description: "Reconnect reason", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: [],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { reason: "revived" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const ANSWER_SUBMITTED_CONTRACT: EventContract = {
  eventId: "AnswerSubmitted",
  displayName: "Answer Submitted",
  description: "A player submitted an answer to a question.",
  producer: "universal_game_engine",
  consumers: ["player_progression", "analytics"],
  category: "gameplay",
  payloadType: "AnswerSubmittedPayload",
  schema: {
    fields: [
      { name: "isCorrect", type: "boolean", description: "Whether the answer was correct", required: true, nullable: false },
      { name: "responseMs", type: "number", description: "Response time in ms", required: false, nullable: true },
      { name: "gameMode", type: "string", description: "Game mode ID", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: ["isCorrect"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { isCorrect: true, responseMs: 3200 },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const SCORE_UPDATED_CONTRACT: EventContract = {
  eventId: "ScoreUpdated",
  displayName: "Score Updated",
  description: "A player's score was updated (gain, loss, streak, comeback).",
  producer: "universal_game_engine",
  consumers: ["player_progression", "analytics"],
  category: "gameplay",
  payloadType: "ScoreUpdatedPayload",
  schema: {
    fields: [
      { name: "action", type: "string", description: "Score action", required: false, nullable: true, enum: ["comeback", "streak_bonus", "lose_life", "restore_life"] },
      { name: "streak", type: "number", description: "Current streak count", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: [],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { action: "streak_bonus", streak: 5 },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const ROUND_STARTED_CONTRACT: EventContract = {
  eventId: "RoundStarted",
  displayName: "Round Started",
  description: "A new round started in a match.",
  producer: "universal_game_engine",
  consumers: ["analytics"],
  category: "gameplay",
  payloadType: "RoundStartedPayload",
  schema: {
    fields: [
      { name: "roundIndex", type: "number", description: "Round number", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: [],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "strict",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { roundIndex: 1 },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const ROUND_FINISHED_CONTRACT: EventContract = {
  eventId: "RoundFinished",
  displayName: "Round Finished",
  description: "A round finished in a match.",
  producer: "universal_game_engine",
  consumers: ["analytics"],
  category: "gameplay",
  payloadType: "RoundFinishedPayload",
  schema: {
    fields: [
      { name: "roundIndex", type: "number", description: "Round number", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: [],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "strict",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { roundIndex: 1 },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const RESOURCE_CHANGED_CONTRACT: EventContract = {
  eventId: "ResourceChanged",
  displayName: "Resource Changed",
  description: "A resource (lives, shields, gold, etc.) was modified via the Resource Pipeline.",
  producer: "universal_game_engine",
  consumers: ["analytics"],
  category: "gameplay",
  payloadType: "ResourceChangedPayload",
  schema: {
    fields: [
      { name: "resourceType", type: "string", description: "Resource type (e.g., lives, gold, shield)", required: true, nullable: false },
      { name: "action", type: "string", description: "Resource action", required: false, nullable: true, enum: ["earned", "spent", "lost", "transferred", "init", "teacher_grant"] },
      { name: "amount", type: "number", description: "Amount changed", required: false, nullable: true },
      { name: "category", type: "string", description: "Resource category", required: false, nullable: true, enum: ["economy", "survival", "custom"] },
    ],
    additionalProperties: true,
    required: ["resourceType"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { resourceType: "lives", action: "spent", amount: 1, category: "survival" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const TEACHER_OVERRIDE_CONTRACT: EventContract = {
  eventId: "TeacherOverride",
  displayName: "Teacher Override",
  description: "A teacher performed an override action (pause, grant, force advance, etc.).",
  producer: "universal_game_engine",
  consumers: ["player_progression", "competitive_platform", "analytics", "replay"],
  category: "administration",
  payloadType: "TeacherOverridePayload",
  schema: {
    fields: [
      { name: "action", type: "string", description: "Teacher action", required: true, nullable: false },
      { name: "userId", type: "string", description: "Target user ID (if applicable)", required: false, nullable: true },
      { name: "success", type: "boolean", description: "Whether the action succeeded", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: ["action"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { action: "pause", success: true },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const STATE_TRANSITION_CONTRACT: EventContract = {
  eventId: "StateTransition",
  displayName: "State Transition",
  description: "A match lifecycle state transition occurred.",
  producer: "universal_game_engine",
  consumers: ["analytics"],
  category: "gameplay",
  payloadType: "StateTransitionPayload",
  schema: {
    fields: [
      { name: "kind", type: "string", description: "Transition kind", required: false, nullable: true },
      { name: "phase", type: "string", description: "New phase", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: [],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "strict",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { kind: "tournament_phase", phase: "duel" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const ANTI_CHEAT_FINDING_CONTRACT: EventContract = {
  eventId: "AntiCheatFinding",
  displayName: "Anti-Cheat Finding",
  description: "A potential cheat was detected by the engine's anti-cheat system.",
  producer: "universal_game_engine",
  consumers: ["competitive_platform", "analytics"],
  category: "administration",
  payloadType: "AntiCheatFindingPayload",
  schema: {
    fields: [
      { name: "kind", type: "string", description: "Cheat kind", required: true, nullable: false },
      { name: "severity", type: "string", description: "Severity level", required: false, nullable: true },
      { name: "description", type: "string", description: "Description", required: false, nullable: true },
    ],
    additionalProperties: true,
    required: ["kind"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { kind: "impossible_timestamp", severity: "high" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

// ===========================================================================
// Player Progression Events (Phase 6G.7)
// ===========================================================================

export const XP_AWARDED_CONTRACT: EventContract = {
  eventId: "XPAwarded",
  displayName: "XP Awarded",
  description: "XP was awarded to a player by the Player Progression Platform.",
  producer: "player_progression",
  consumers: ["analytics"],
  category: "progression",
  payloadType: "XPAwardedPayload",
  schema: {
    fields: [
      { name: "source", type: "string", description: "XP source", required: true, nullable: false },
      { name: "amount", type: "number", description: "XP amount", required: true, nullable: false },
      { name: "gameMode", type: "string", description: "Game mode (if applicable)", required: false, nullable: true },
      { name: "matchId", type: "string", description: "Match ID (if applicable)", required: false, nullable: true },
    ],
    additionalProperties: false,
    required: ["source", "amount"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "idempotency_key",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { source: "victory", amount: 100, gameMode: "classic_quiz" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const LEVEL_UP_CONTRACT: EventContract = {
  eventId: "LevelUp",
  displayName: "Level Up",
  description: "A player reached a new level.",
  producer: "player_progression",
  consumers: ["analytics", "notifications"],
  category: "progression",
  payloadType: "LevelUpPayload",
  schema: {
    fields: [
      { name: "newLevel", type: "number", description: "New level", required: true, nullable: false },
      { name: "previousLevel", type: "number", description: "Previous level", required: true, nullable: false },
    ],
    additionalProperties: false,
    required: ["newLevel", "previousLevel"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "causal",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { newLevel: 5, previousLevel: 4 },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const ACHIEVEMENT_UNLOCKED_CONTRACT: EventContract = {
  eventId: "AchievementUnlocked",
  displayName: "Achievement Unlocked",
  description: "A player unlocked an achievement.",
  producer: "player_progression",
  consumers: ["analytics", "notifications"],
  category: "progression",
  payloadType: "AchievementUnlockedPayload",
  schema: {
    fields: [
      { name: "achievementId", type: "string", description: "Achievement ID", required: true, nullable: false },
      { name: "category", type: "string", description: "Achievement category", required: false, nullable: true },
      { name: "rarity", type: "string", description: "Achievement rarity", required: false, nullable: true },
    ],
    additionalProperties: false,
    required: ["achievementId"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "idempotency_key",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { achievementId: "cq_first_win", category: "classic_quiz", rarity: "common" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const MILESTONE_REACHED_CONTRACT: EventContract = {
  eventId: "MilestoneReached",
  displayName: "Milestone Reached",
  description: "A player reached a career milestone.",
  producer: "player_progression",
  consumers: ["analytics", "notifications"],
  category: "progression",
  payloadType: "MilestoneReachedPayload",
  schema: {
    fields: [
      { name: "milestoneId", type: "string", description: "Milestone ID", required: true, nullable: false },
      { name: "currentValue", type: "number", description: "Current value", required: false, nullable: true },
      { name: "targetValue", type: "number", description: "Target value", required: false, nullable: true },
    ],
    additionalProperties: false,
    required: ["milestoneId"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "idempotency_key",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { milestoneId: "questions_100", currentValue: 100, targetValue: 100 },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

// ===========================================================================
// Competitive Platform Events (Phase 6G.8)
// ===========================================================================

export const RATING_CHANGED_CONTRACT: EventContract = {
  eventId: "RatingChanged",
  displayName: "Rating Changed",
  description: "A player's competitive rating was updated.",
  producer: "competitive_platform",
  consumers: ["analytics", "notifications"],
  category: "competition",
  payloadType: "RatingChangedPayload",
  schema: {
    fields: [
      { name: "gameMode", type: "string", description: "Game mode", required: true, nullable: false },
      { name: "beforeRating", type: "number", description: "Previous rating", required: true, nullable: false },
      { name: "afterRating", type: "number", description: "New rating", required: true, nullable: false },
      { name: "delta", type: "number", description: "Rating change", required: true, nullable: false },
      { name: "result", type: "string", description: "Match result", required: false, nullable: true, enum: ["win", "loss", "draw"] },
    ],
    additionalProperties: false,
    required: ["gameMode", "beforeRating", "afterRating", "delta"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "idempotency_key",
  orderingRequirement: "causal",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { gameMode: "classic_quiz", beforeRating: 1200, afterRating: 1232, delta: 32, result: "win" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const DIVISION_CHANGED_CONTRACT: EventContract = {
  eventId: "DivisionChanged",
  displayName: "Division Changed",
  description: "A player was promoted or demoted to a new division.",
  producer: "competitive_platform",
  consumers: ["analytics", "notifications"],
  category: "competition",
  payloadType: "DivisionChangedPayload",
  schema: {
    fields: [
      { name: "fromDivision", type: "string", description: "Previous division", required: true, nullable: false },
      { name: "toDivision", type: "string", description: "New division", required: true, nullable: false },
      { name: "kind", type: "string", description: "Change kind", required: false, nullable: true, enum: ["promotion", "demotion"] },
    ],
    additionalProperties: false,
    required: ["fromDivision", "toDivision"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "idempotency_key",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { fromDivision: "silver", toDivision: "gold", kind: "promotion" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const TOURNAMENT_FINISHED_CONTRACT: EventContract = {
  eventId: "TournamentFinished",
  displayName: "Tournament Finished",
  description: "A competitive tournament has ended.",
  producer: "competitive_platform",
  consumers: ["player_progression", "analytics", "notifications"],
  category: "competition",
  payloadType: "TournamentFinishedPayload",
  schema: {
    fields: [
      { name: "tournamentId", type: "string", description: "Tournament ID", required: true, nullable: false },
      { name: "championId", type: "string", description: "Champion user ID", required: false, nullable: true },
      { name: "runnerUpId", type: "string", description: "Runner-up user ID", required: false, nullable: true },
      { name: "format", type: "string", description: "Tournament format", required: false, nullable: true },
    ],
    additionalProperties: false,
    required: ["tournamentId"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "idempotency_key",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { tournamentId: "t-1", championId: "u-1", runnerUpId: "u-2", format: "single_elimination" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const SEASON_COMPLETED_CONTRACT: EventContract = {
  eventId: "SeasonCompleted",
  displayName: "Season Completed",
  description: "A competitive season has ended.",
  producer: "competitive_platform",
  consumers: ["player_progression", "analytics", "notifications"],
  category: "competition",
  payloadType: "SeasonCompletedPayload",
  schema: {
    fields: [
      { name: "seasonId", type: "string", description: "Season ID", required: true, nullable: false },
      { name: "seasonNumber", type: "number", description: "Season number", required: false, nullable: true },
      { name: "finalRank", type: "number", description: "Player's final rank", required: false, nullable: true },
    ],
    additionalProperties: false,
    required: ["seasonId"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "idempotency_key",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { seasonId: "s-1", seasonNumber: 1, finalRank: 42 },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const FAIR_PLAY_FINDING_CONTRACT: EventContract = {
  eventId: "FairPlayFinding",
  displayName: "Fair Play Finding",
  description: "A fair play violation was detected (findings only — never auto-bans).",
  producer: "competitive_platform",
  consumers: ["analytics", "administration"],
  category: "administration",
  payloadType: "FairPlayFindingPayload",
  schema: {
    fields: [
      { name: "kind", type: "string", description: "Violation kind", required: true, nullable: false },
      { name: "severity", type: "string", description: "Severity", required: false, nullable: true },
      { name: "description", type: "string", description: "Description", required: false, nullable: true },
    ],
    additionalProperties: false,
    required: ["kind"],
  },
  version: "1.0.0",
  status: "stable",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { kind: "queue_dodging", severity: "medium", description: "Cancelled 5 tickets" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

// ===========================================================================
// Future Module Events (reserved — not yet active)
// ===========================================================================

export const NOTIFICATION_SENT_CONTRACT: EventContract = {
  eventId: "NotificationSent",
  displayName: "Notification Sent",
  description: "A notification was sent to a user (future — Notifications Platform).",
  producer: "notifications",
  consumers: ["analytics"],
  category: "notifications",
  payloadType: "NotificationSentPayload",
  schema: {
    fields: [
      { name: "userId", type: "string", description: "Recipient user ID", required: true, nullable: false },
      { name: "kind", type: "string", description: "Notification kind", required: true, nullable: false },
      { name: "message", type: "string", description: "Notification message", required: false, nullable: true },
    ],
    additionalProperties: false,
    required: ["userId", "kind"],
  },
  version: "1.0.0",
  status: "experimental",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "optional",
  replaySupport: false,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { userId: "u-1", kind: "achievement_unlocked", message: "You unlocked Champion!" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const COSMETIC_UNLOCKED_CONTRACT: EventContract = {
  eventId: "CosmeticUnlocked",
  displayName: "Cosmetic Unlocked",
  description: "A cosmetic item was unlocked for a player (future — Cosmetics Platform).",
  producer: "cosmetics",
  consumers: ["analytics", "notifications"],
  category: "progression",
  payloadType: "CosmeticUnlockedPayload",
  schema: {
    fields: [
      { name: "userId", type: "string", description: "User ID", required: true, nullable: false },
      { name: "cosmeticId", type: "string", description: "Cosmetic item ID", required: true, nullable: false },
      { name: "kind", type: "string", description: "Cosmetic kind", required: false, nullable: true, enum: ["frame", "border", "banner", "avatar", "color_scheme"] },
    ],
    additionalProperties: false,
    required: ["userId", "cosmeticId"],
  },
  version: "1.0.0",
  status: "experimental",
  idempotencyStrategy: "idempotency_key",
  orderingRequirement: "none",
  persistenceRequirement: "required",
  replaySupport: true,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { userId: "u-1", cosmeticId: "frame_beta", kind: "frame" },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

export const AI_RECOMMENDATION_CONTRACT: EventContract = {
  eventId: "AIRecommendationGenerated",
  displayName: "AI Recommendation Generated",
  description: "An AI recommendation was generated (future — AI Director Platform).",
  producer: "ai_director",
  consumers: ["analytics", "notifications"],
  category: "ai",
  payloadType: "AIRecommendationPayload",
  schema: {
    fields: [
      { name: "userId", type: "string", description: "Target user ID", required: true, nullable: false },
      { name: "recommendation", type: "string", description: "Recommendation text", required: true, nullable: false },
      { name: "confidence", type: "number", description: "Confidence score (0-1)", required: false, nullable: true },
    ],
    additionalProperties: false,
    required: ["userId", "recommendation"],
  },
  version: "1.0.0",
  status: "experimental",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "optional",
  replaySupport: false,
  auditSupport: true,
  deprecated: false,
  replacementEventId: null,
  deprecationMessage: null,
  samplePayload: { userId: "u-1", recommendation: "Try Treasure Heist next", confidence: 0.85 },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

// ===========================================================================
// Deprecated Event Example (for testing versioning)
// ===========================================================================

export const LEGACY_SCORE_EVENT_CONTRACT: EventContract = {
  eventId: "LegacyScoreEvent",
  displayName: "Legacy Score Event (Deprecated)",
  description: "An old score event format, replaced by ScoreUpdated.",
  producer: "universal_game_engine",
  consumers: [],
  category: "gameplay",
  payloadType: "LegacyScorePayload",
  schema: {
    fields: [
      { name: "score", type: "number", description: "Score value", required: true, nullable: false },
    ],
    additionalProperties: false,
    required: ["score"],
  },
  version: "0.9.0",
  status: "deprecated",
  idempotencyStrategy: "event_id",
  orderingRequirement: "none",
  persistenceRequirement: "optional",
  replaySupport: true,
  auditSupport: true,
  deprecated: true,
  replacementEventId: "ScoreUpdated",
  deprecationMessage: "Use ScoreUpdated instead. Will be removed in v2.0.",
  samplePayload: { score: 500 },
  registeredAt: "2025-01-01T00:00:00.000Z",
};

// ===========================================================================
// All contracts export
// ===========================================================================

export const ALL_EVENT_CONTRACTS: EventContract[] = [
  MATCH_CREATED_CONTRACT,
  MATCH_FINISHED_CONTRACT,
  PLAYER_JOINED_CONTRACT,
  PLAYER_LEFT_CONTRACT,
  PLAYER_DISCONNECTED_CONTRACT,
  PLAYER_RECONNECTED_CONTRACT,
  ANSWER_SUBMITTED_CONTRACT,
  SCORE_UPDATED_CONTRACT,
  ROUND_STARTED_CONTRACT,
  ROUND_FINISHED_CONTRACT,
  RESOURCE_CHANGED_CONTRACT,
  TEACHER_OVERRIDE_CONTRACT,
  STATE_TRANSITION_CONTRACT,
  ANTI_CHEAT_FINDING_CONTRACT,
  XP_AWARDED_CONTRACT,
  LEVEL_UP_CONTRACT,
  ACHIEVEMENT_UNLOCKED_CONTRACT,
  MILESTONE_REACHED_CONTRACT,
  RATING_CHANGED_CONTRACT,
  DIVISION_CHANGED_CONTRACT,
  TOURNAMENT_FINISHED_CONTRACT,
  SEASON_COMPLETED_CONTRACT,
  FAIR_PLAY_FINDING_CONTRACT,
  NOTIFICATION_SENT_CONTRACT,
  COSMETIC_UNLOCKED_CONTRACT,
  AI_RECOMMENDATION_CONTRACT,
  LEGACY_SCORE_EVENT_CONTRACT,
];
