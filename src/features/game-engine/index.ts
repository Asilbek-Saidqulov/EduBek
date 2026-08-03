/** Game Engine barrel export. Phase 6G.1. */
export { createMatch, getMatch, listMatches, destroyMatch, updateMatchState, updateMatchStatistics, validateTransition, attemptTransition, getValidTransitions, VALID_TRANSITIONS,
  lobbyJoin, lobbyLeave, lobbyKick, lobbyBan, lobbyLock, lobbyTransferHost, lobbyAssignTeam, createSession, getSession, updateSessionStatus, updateHeartbeat, checkTimeouts, setPlayerReady, getReadyCheckState, teacherOverrideReady, startRound, finishRound, advanceQuestion,
  preloadQuestion, advanceQuestionPhase, recordAnswer, startTimer, getTimer, pauseTimer, resumeTimer, extendTimer, syncTimer, nextSequenceNumber, createSyncSnapshot, recordSyncEvent, getSyncReport, validateSyncEvent, emitEvent, getEvents, subscribe, clearEvents,
  receiveScoreEvent, validateScoreEvent, normalizeScoreEvent, getScorePipelineReport, registerResource, processResourceAction, getResourceBalance, getResourceHistory, saveReplay, getReplay, createReplayState, stepReplay, addSpectator, removeSpectator, getSpectators, recoverPlayer, detectCheat, getCheatFindings, checkDuplicateSubmission, checkImpossibleTimestamp, recordMatch, getMatchRecord, generateGameAnalytics,
} from "./service";

// Runtime values + type guard from types module (cannot go in `export type` block)
export { DEATH_REASONS, isDeathReason } from "./types";

export type {
  MatchState, MatchSettings, MatchStatistics, Match, MatchPlayer,
  LifecycleTransition, LifecycleValidationResult,
  LobbyState, LobbyActionResult,
  SessionStatus, PlayerSession,
  ReadyCheckState,
  RoundInfo,
  QuestionPhase, QuestionState,
  TimerState,
  SyncSnapshot, SyncEvent, SyncReport,
  GameEventType, GameEvent,
  ScoreEvent, ScorePipelineReport,
  ResourceAction, ResourceEvent, ResourceRegistration, ResourceCategory,
  DeathReason,
  ReplayRecord, ReplayState,
  SpectatorSession,
  RecoveryState,
  CheatKind, CheatFinding,
  MatchRecord,
  GameAnalyticsReport,
} from "./types";

// Event Registry — governance layer for the Event-Driven Architecture.
// Sits alongside the Event Bus; provides discoverability, validation,
// contracts, ownership, versioning, and documentation. See:
//   src/features/game-engine/events/index.ts
//   docs/gaming-platform-architecture.md
export * from "./events";
