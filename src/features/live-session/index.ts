/**
 * EduBek — Live Quiz feature barrel export (Quiz Session module).
 */
export {
  createSession,
  getSession,
  listSessions,
  joinSession,
  leaveSession,
  reconnectPlayer,
  markPlayerDisconnected,
  migrateHost,
  startSession,
  pauseSession,
  resumeSession,
  endSession,
  startNextRound,
  submitAnswer,
  finishRound,
  kickPlayer,
  updateSession,
  // Phase 4C.1 — host experience + recovery
  pauseCountdown,
  skipCountdown,
  extendTimer,
  endQuestionEarly,
  togglePlayerMute,
  setPlayerReady,
  syncSessionState,
} from "./service";

export {
  createSessionBodySchema,
  joinSessionBodySchema,
  updateSessionBodySchema,
  submitAnswerBodySchema,
  startSessionBodySchema,
  listSessionsQuerySchema,
  gameModeSchema,
  type CreateSessionBody,
  type JoinSessionBody,
  type UpdateSessionBody,
  type SubmitAnswerBody,
  type StartSessionBody,
  type ListSessionsQuery,
} from "./schema";

export type {
  LiveSessionStatus,
  LiveSessionVisibility,
  LivePlayerRole,
  LivePlayerStatus,
  LiveRoundStatus,
  LiveSessionDto,
  LivePlayerDto,
  LiveRoundDto,
  LiveAnswerDto,
  LiveSessionWithPlayersDto,
  JoinSessionInput,
  CreateSessionInput,
  SubmitAnswerInput,
} from "./types";
