/**
 * EduBek — Live Quiz Lobby service.
 *
 * The Lobby is created automatically when a LiveSession (Quiz Session)
 * is created (see live-session.createSession). This service exposes:
 *   • createLobbyForSession — internal API called by the Quiz Session service
 *   • findLobbyByCode — used by the join endpoint
 *   • lockLobby / unlockLobby — host controls
 *   • updateLobby — host updates visibility/max/settings
 *   • approveWaitingRoom — host admits waiting-room participants
 *
 * Events published:
 *   • LOBBY_CREATED
 *   • LOBBY_LOCKED
 */
import { randomInt } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  LOBBY_CREATED,
  LOBBY_LOCKED,
  type LobbyCreatedEvent,
  type LobbyLockedEvent,
} from "@/infra/event-bus/events";
import { db } from "@/lib/db";
import * as repo from "./repository";
import type { CreateLobbyInput, LobbyDto, LobbyStatus, LobbyVisibility, ReadyCheckDto } from "./types";
import type {
  ApproveWaitingRoomBody,
  ListLobbiesQuery,
  UpdateLobbyBody,
} from "./schema";

const log = getLogger("lobby-service");

// 6-digit numeric join code range (100000-999999).
// Cryptographically random — no sequential generation. The retry loop in
// `generateUniqueJoinCode` handles the (extremely unlikely) collision case.
const JOIN_CODE_MIN = 100_000;
const JOIN_CODE_MAX = 999_999; // inclusive

function generateJoinCode(): string {
  try {
    const n = randomInt(JOIN_CODE_MIN, JOIN_CODE_MAX + 1);
    return String(n);
  } catch {
    const n = Math.floor(Math.random() * (JOIN_CODE_MAX - JOIN_CODE_MIN + 1)) + JOIN_CODE_MIN;
    return String(n);
  }
}

async function generateUniqueJoinCode(): Promise<string> {
  // Try up to 10 times to find a unique code. With 900_000 possible codes
  // and SQLite's unique constraint, collisions are vanishingly rare.
  for (let i = 0; i < 10; i++) {
    const code = generateJoinCode();
    const existing = await repo.findLobbyByCode(code);
    if (!existing) return code;
  }
  // Extremely unlikely fallback — generate one more and accept the (still
  // negligible) collision risk rather than looping forever.
  return generateJoinCode();
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mapLobby(l: any): LobbyDto {
  const settings = safeParse<Record<string, unknown>>(l.settings, {});
  return {
    id: l.id,
    sessionId: l.sessionId,
    joinCode: l.joinCode,
    hasPassword: l.passwordHash !== null && l.passwordHash !== undefined,
    passwordHash: l.passwordHash,
    visibility: l.visibility as LobbyVisibility,
    maxPlayers: l.maxPlayers,
    waitingRoom: safeParse<string[]>(l.waitingRoom, []),
    settings,
    locked: l.locked,
    countdownEndsAt: l.countdownEndsAt ? l.countdownEndsAt.toISOString() : null,
    status: l.status as LobbyStatus,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    // Phase 4C.1 additive — read from settings JSON (no schema migration)
    minPlayers: (settings.minPlayers as number | undefined) ?? 2,
    maxSpectators: (settings.maxSpectators as number | undefined) ?? 100,
    lateJoinPolicy: (settings.lateJoinPolicy as "allow" | "deny" | "allow_during_round" | undefined) ?? "allow",
    requireReadyCheck: (settings.requireReadyCheck as boolean | undefined) ?? false,
    readyCount: (settings.readyCount as number | undefined) ?? 0,
    spectatorCount: (settings.spectatorCount as number | undefined) ?? 0,
  };
}

// ---------------------------------------------------------------------------
// createLobbyForSession (internal API)
// ---------------------------------------------------------------------------

export async function createLobbyForSession(input: CreateLobbyInput): Promise<LobbyDto> {
  const joinCode = await generateUniqueJoinCode();
  let passwordHash: string | undefined;
  if (input.password) {
    const bcrypt = await import("bcryptjs");
    passwordHash = await bcrypt.hash(input.password, 10);
  }
  // Phase 4C.1: merge additive fields into settings JSON (no schema migration)
  const settings = {
    ...(input.settings ?? {}),
    ...(input.minPlayers != null ? { minPlayers: input.minPlayers } : {}),
    ...(input.maxSpectators != null ? { maxSpectators: input.maxSpectators } : {}),
    ...(input.lateJoinPolicy != null ? { lateJoinPolicy: input.lateJoinPolicy } : {}),
    ...(input.requireReadyCheck != null ? { requireReadyCheck: input.requireReadyCheck } : {}),
  };
  const lobby = await repo.createLobby({
    sessionId: input.sessionId,
    joinCode,
    passwordHash,
    visibility: input.visibility,
    maxPlayers: input.maxPlayers,
    settings: JSON.stringify(settings),
  });

  eventBus.publish(
    buildEvent<LobbyCreatedEvent>({
      type: LOBBY_CREATED,
      actorId: undefined,
      lobbyId: lobby.id,
      sessionId: lobby.sessionId,
      joinCode: lobby.joinCode,
      visibility: lobby.visibility,
    }),
  );

  log.info("lobby.created", { lobbyId: lobby.id, joinCode: lobby.joinCode });
  return mapLobby(lobby);
}

// ---------------------------------------------------------------------------
// getLobby
// ---------------------------------------------------------------------------

export async function getLobby(
  ctx: AuthContext,
  sessionId: string,
): Promise<LobbyDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const lobby = await repo.findLobbyBySession(sessionId);
  if (!lobby) throw notFound("Lobby not found");
  return mapLobby(lobby);
}

// ---------------------------------------------------------------------------
// findLobbyByCode (used by the live-session join flow)
// ---------------------------------------------------------------------------

export async function findLobbyByCode(joinCode: string): Promise<LobbyDto | null> {
  const lobby = await repo.findLobbyByCode(joinCode.toUpperCase());
  return lobby ? mapLobby(lobby) : null;
}

// ---------------------------------------------------------------------------
// lockLobby / unlockLobby
// ---------------------------------------------------------------------------

export async function lockLobby(sessionId: string): Promise<LobbyDto> {
  const lobby = await repo.findLobbyBySession(sessionId);
  if (!lobby) throw notFound("Lobby not found");
  const updated = await repo.updateLobby(lobby.id, { locked: true });
  eventBus.publish(
    buildEvent<LobbyLockedEvent>({
      type: LOBBY_LOCKED,
      actorId: undefined,
      lobbyId: lobby.id,
      sessionId: lobby.sessionId,
    }),
  );
  return mapLobby(updated);
}

export async function unlockLobby(ctx: AuthContext, sessionId: string): Promise<LobbyDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const lobby = await repo.findLobbyBySession(sessionId);
  if (!lobby) throw notFound("Lobby not found");
  const session = await db.liveSession.findUnique({
    where: { id: sessionId },
    select: { hostId: true },
  });
  if (!session) throw notFound("Session not found");
  if (session.hostId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the host can unlock the lobby");
  }
  const updated = await repo.updateLobby(lobby.id, { locked: false });
  return mapLobby(updated);
}

// ---------------------------------------------------------------------------
// updateLobby
// ---------------------------------------------------------------------------

export async function updateLobby(
  ctx: AuthContext,
  sessionId: string,
  input: UpdateLobbyBody,
): Promise<LobbyDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const lobby = await repo.findLobbyBySession(sessionId);
  if (!lobby) throw notFound("Lobby not found");
  const session = await db.liveSession.findUnique({
    where: { id: sessionId },
    select: { hostId: true, status: true },
  });
  if (!session) throw notFound("Session not found");
  if (session.hostId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the host can update the lobby");
  }
  if (session.status !== "lobby") {
    throw badRequest("Cannot update a lobby for a session that has already started");
  }
  // Phase 4C.1: merge additive fields into existing settings JSON
  const existingSettings = safeParse<Record<string, unknown>>(lobby.settings, {});
  const newSettings = input.settings ?? existingSettings;
  if (input.minPlayers != null) newSettings.minPlayers = input.minPlayers;
  if (input.maxSpectators != null) newSettings.maxSpectators = input.maxSpectators;
  if (input.lateJoinPolicy != null) newSettings.lateJoinPolicy = input.lateJoinPolicy;
  if (input.requireReadyCheck != null) newSettings.requireReadyCheck = input.requireReadyCheck;
  const updated = await repo.updateLobby(lobby.id, {
    visibility: input.visibility,
    maxPlayers: input.maxPlayers,
    locked: input.locked,
    settings: JSON.stringify(newSettings),
  });
  return mapLobby(updated);
}

// ---------------------------------------------------------------------------
// approveWaitingRoom
// ---------------------------------------------------------------------------

export async function approveWaitingRoom(
  ctx: AuthContext,
  sessionId: string,
  input: ApproveWaitingRoomBody,
): Promise<{ approved: string[]; rejected: string[] }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const lobby = await repo.findLobbyBySession(sessionId);
  if (!lobby) throw notFound("Lobby not found");
  const session = await db.liveSession.findUnique({
    where: { id: sessionId },
    select: { hostId: true },
  });
  if (!session) throw notFound("Session not found");
  if (session.hostId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the host can approve waiting-room players");
  }
  const waiting = safeParse<string[]>(lobby.waitingRoom, []);
  const approved: string[] = [];
  const rejected: string[] = [];
  for (const uid of input.userIds) {
    if (waiting.includes(uid)) {
      if (input.approve) approved.push(uid);
      else rejected.push(uid);
    }
  }
  const newWaiting = waiting.filter((uid) => !approved.includes(uid) && !rejected.includes(uid));
  await repo.updateLobby(lobby.id, { waitingRoom: JSON.stringify(newWaiting) });
  // For approved players, the join flow will run normally on their next attempt.
  return { approved, rejected };
}

// ---------------------------------------------------------------------------
// listPublicLobbies
// ---------------------------------------------------------------------------

export async function listPublicLobbies(
  ctx: AuthContext,
  query: ListLobbiesQuery,
): Promise<{ lobbies: LobbyDto[]; total: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_JOIN)) {
    throw forbidden("No permission to browse lobbies");
  }
  // Only show public lobbies.
  const lobbies = await repo.findOpenLobbies();
  return {
    lobbies: lobbies.map(mapLobby),
    total: lobbies.length,
  };
}

// ---------------------------------------------------------------------------
// Phase 4C.1 — Ready check, start prerequisites, invite helpers
// ---------------------------------------------------------------------------

/**
 * Compute the ready-check summary for a Lobby. Reads each participant's
 * `state.__ready` flag (set via `live-session.setPlayerReady`).
 */
export async function getReadyCheck(
  ctx: AuthContext,
  sessionId: string,
): Promise<ReadyCheckDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const lobby = await repo.findLobbyBySession(sessionId);
  if (!lobby) throw notFound("Lobby not found");
  // Only the host or a participant can view the ready check.
  const session = await db.liveSession.findUnique({
    where: { id: sessionId },
    select: { hostId: true },
  });
  if (!session) throw notFound("Session not found");
  const isHost = session.hostId === ctx.userId || ctx.isSuperadmin;
  if (!isHost) {
    const participant = await db.livePlayer.findUnique({
      where: { sessionId_userId: { sessionId, userId: ctx.userId } },
      select: { id: true },
    });
    if (!participant) throw forbidden("Only the host or participants can view the ready check");
  }
  const participants = await db.livePlayer.findMany({
    where: { sessionId, role: { in: ["host", "co_host", "player"] } },
    select: { id: true, userId: true, displayName: true, state: true },
  });
  const settings = safeParse<Record<string, unknown>>(lobby.settings, {});
  const requireReadyCheck = (settings.requireReadyCheck as boolean | undefined) ?? false;
  let readyCount = 0;
  const participantDtos = participants.map((p: any) => {
    const state = safeParse<Record<string, unknown>>(p.state, {});
    const ready = state.__ready === true;
    if (ready) readyCount += 1;
    return {
      playerId: p.id,
      userId: p.userId,
      displayName: p.displayName,
      ready,
    };
  });
  return {
    sessionId,
    requireReadyCheck,
    totalParticipants: participants.length,
    readyCount,
    notReadyCount: participants.length - readyCount,
    ready: !requireReadyCheck || (participants.length > 0 && readyCount === participants.length),
    participants: participantDtos,
  };
}

/**
 * Check whether the Lobby satisfies all prerequisites for starting the
 * countdown. Returns a list of unsatisfied requirements (empty = ready).
 */
export async function canStartCountdown(
  ctx: AuthContext,
  sessionId: string,
): Promise<{ canStart: boolean; reasons: string[] }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const lobby = await repo.findLobbyBySession(sessionId);
  if (!lobby) throw notFound("Lobby not found");
  if (lobby.status !== "open") return { canStart: false, reasons: ["lobby_not_open"] };
  if (lobby.locked) return { canStart: false, reasons: ["lobby_locked"] };
  const session = await db.liveSession.findUnique({
    where: { id: sessionId },
    select: { hostId: true, status: true },
  });
  if (!session) throw notFound("Session not found");
  if (session.hostId !== ctx.userId && !ctx.isSuperadmin) {
    return { canStart: false, reasons: ["not_host"] };
  }
  if (session.status !== "lobby") {
    return { canStart: false, reasons: ["session_not_in_lobby"] };
  }
  const settings = safeParse<Record<string, unknown>>(lobby.settings, {});
  const minPlayers = (settings.minPlayers as number | undefined) ?? 2;
  const requireReadyCheck = (settings.requireReadyCheck as boolean | undefined) ?? false;
  const reasons: string[] = [];
  const activePlayers = await db.livePlayer.count({
    where: { sessionId, status: "active", role: { in: ["host", "co_host", "player"] } },
  });
  if (activePlayers < minPlayers) {
    reasons.push(`min_players_not_met (${activePlayers}/${minPlayers})`);
  }
  if (requireReadyCheck) {
    const readyCheck = await getReadyCheck(ctx, sessionId);
    if (!readyCheck.ready) {
      reasons.push(`ready_check_not_satisfied (${readyCheck.readyCount}/${readyCheck.totalParticipants})`);
    }
  }
  return { canStart: reasons.length === 0, reasons };
}

/**
 * Generate a copy-friendly PIN string for the Lobby. Returns the PIN
 * formatted for easy sharing (just the digits, no decoration).
 */
export async function getPinHelper(
  ctx: AuthContext,
  sessionId: string,
): Promise<{ pin: string; inviteLink: string; copyText: string }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const lobby = await repo.findLobbyBySession(sessionId);
  if (!lobby) throw notFound("Lobby not found");
  const session = await db.liveSession.findUnique({
    where: { id: sessionId },
    select: { hostId: true },
  });
  if (!session) throw notFound("Session not found");
  if (session.hostId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the host can view the PIN helper");
  }
  const pin = lobby.joinCode;
  const inviteLink = `https://edubek.app/join?pin=${pin}`;
  const copyText = `Join my EduBek Live Quiz! PIN: ${pin}  (${inviteLink})`;
  return { pin, inviteLink, copyText };
}
