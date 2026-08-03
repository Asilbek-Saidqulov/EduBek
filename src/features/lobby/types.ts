/**
 * EduBek — Live Quiz Lobby module types.
 *
 * A Lobby is the pre-Quiz-Session gathering place attached to every
 * LiveSession. Participants join via a 6-digit numeric `joinCode`; the
 * host can lock the Lobby, require a password, manage a waiting room,
 * and start a countdown.
 */

export type LobbyStatus = "open" | "countdown" | "closed";
export type LobbyVisibility = "private" | "classroom" | "org" | "public";

export interface LobbyDto {
  id: string;
  sessionId: string;
  joinCode: string;
  hasPassword: boolean;
  /** Internal — only exposed to the host. Hidden in API responses. */
  passwordHash?: string | null;
  visibility: LobbyVisibility;
  maxPlayers: number;
  waitingRoom: string[]; // userIds
  settings: Record<string, unknown>;
  locked: boolean;
  countdownEndsAt: string | null;
  status: LobbyStatus;
  createdAt: string;
  updatedAt: string;
  // ---- Phase 4C.1 additive fields (all optional, backward-compatible) ----
  /** Minimum participants required before the host can start the countdown. */
  minPlayers?: number;
  /** Maximum spectators allowed (default 100). */
  maxSpectators?: number;
  /** Late-join policy: 'allow' (default), 'deny', 'allow_during_round'. */
  lateJoinPolicy?: "allow" | "deny" | "allow_during_round";
  /** Whether the host requires all participants to mark ready before starting. */
  requireReadyCheck?: boolean;
  /** Number of participants currently marked ready (computed). */
  readyCount?: number;
  /** Number of currently-connected spectators (computed). */
  spectatorCount?: number;
}

export interface CreateLobbyInput {
  sessionId: string;
  password?: string;
  visibility: string;
  maxPlayers: number;
  settings: Record<string, unknown>;
  // Phase 4C.1 additive
  minPlayers?: number;
  maxSpectators?: number;
  lateJoinPolicy?: "allow" | "deny" | "allow_during_round";
  requireReadyCheck?: boolean;
}

/** Phase 4C.1: ready-check summary returned by `getReadyCheck`. */
export interface ReadyCheckDto {
  sessionId: string;
  requireReadyCheck: boolean;
  totalParticipants: number;
  readyCount: number;
  notReadyCount: number;
  ready: boolean;
  participants: Array<{
    playerId: string;
    userId: string;
    displayName: string;
    ready: boolean;
  }>;
}
