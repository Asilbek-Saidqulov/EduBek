/**
 * EduBek — Live Quiz Lobby feature barrel export.
 */
export {
  createLobbyForSession,
  getLobby,
  findLobbyByCode,
  lockLobby,
  unlockLobby,
  updateLobby,
  approveWaitingRoom,
  listPublicLobbies,
  // Phase 4C.1 additive
  getReadyCheck,
  canStartCountdown,
  getPinHelper,
} from "./service";

export {
  updateLobbyBodySchema,
  approveWaitingRoomBodySchema,
  listLobbiesQuerySchema,
  type UpdateLobbyBody,
  type ApproveWaitingRoomBody,
  type ListLobbiesQuery,
} from "./schema";

export type {
  LobbyDto,
  LobbyStatus,
  LobbyVisibility,
  CreateLobbyInput,
  ReadyCheckDto,
} from "./types";
