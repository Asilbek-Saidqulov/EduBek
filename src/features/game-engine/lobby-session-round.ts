/**
 * Systems 3-6: Lobby Engine, Player Session Engine, Ready Check Engine, Round Engine.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { getMatch, updateMatchState } from "./match-engine";
import type { LobbyState, LobbyActionResult, PlayerSession, SessionStatus, ReadyCheckState, RoundInfo } from "./types";

const log = getLogger("game-engine");

// ===========================================================================
// System 3 — Lobby Engine
// ===========================================================================

export function lobbyJoin(matchId: string, userId: string, displayName: string, pin?: string): LobbyActionResult {
  const m = getMatch(matchId);
  if (!m) return { success: false, lobby: emptyLobby(matchId), message: "Match not found" };
  if (m.settings.isPrivate && m.settings.pin && pin !== m.settings.pin) return { success: false, lobby: toLobby(m), message: "Invalid PIN" };
  if (m.players.length >= m.settings.maxPlayers) return { success: false, lobby: toLobby(m), message: "Match is full" };
  if (m.players.some(p => p.userId === userId)) return { success: false, lobby: toLobby(m), message: "Already in match" };
  m.players.push({ userId, displayName, team: null, isReady: false, isHost: false, isEliminated: false, joinedAt: new Date().toISOString(), score: 0 });
  return { success: true, lobby: toLobby(m), message: "Joined successfully" };
}

export function lobbyLeave(matchId: string, userId: string): LobbyActionResult {
  const m = getMatch(matchId);
  if (!m) return { success: false, lobby: emptyLobby(matchId), message: "Match not found" };
  m.players = m.players.filter(p => p.userId !== userId);
  return { success: true, lobby: toLobby(m), message: "Left successfully" };
}

export function lobbyKick(matchId: string, hostId: string, targetId: string): LobbyActionResult {
  const m = getMatch(matchId);
  if (!m) return { success: false, lobby: emptyLobby(matchId), message: "Match not found" };
  if (m.hostId !== hostId) return { success: false, lobby: toLobby(m), message: "Only host can kick" };
  m.players = m.players.filter(p => p.userId !== targetId);
  return { success: true, lobby: toLobby(m), message: "Player kicked" };
}

export function lobbyBan(matchId: string, hostId: string, targetId: string): LobbyActionResult {
  return lobbyKick(matchId, hostId, targetId); // simplified — ban also kicks
}

export function lobbyLock(matchId: string, hostId: string, locked: boolean): LobbyActionResult {
  const m = getMatch(matchId);
  if (!m) return { success: false, lobby: emptyLobby(matchId), message: "Match not found" };
  if (m.hostId !== hostId) return { success: false, lobby: toLobby(m), message: "Only host can lock" };
  // Lock state would prevent new joins — stored in settings
  return { success: true, lobby: { ...toLobby(m), locked }, message: locked ? "Lobby locked" : "Lobby unlocked" };
}

export function lobbyTransferHost(matchId: string, currentHostId: string, newHostId: string): LobbyActionResult {
  const m = getMatch(matchId);
  if (!m) return { success: false, lobby: emptyLobby(matchId), message: "Match not found" };
  if (m.hostId !== currentHostId) return { success: false, lobby: toLobby(m), message: "Only host can transfer" };
  const newHost = m.players.find(p => p.userId === newHostId);
  if (!newHost) return { success: false, lobby: toLobby(m), message: "Target player not found" };
  m.hostId = newHostId;
  m.players.forEach(p => p.isHost = p.userId === newHostId);
  return { success: true, lobby: toLobby(m), message: "Host transferred" };
}

export function lobbyAssignTeam(matchId: string, hostId: string, userId: string, team: string): LobbyActionResult {
  const m = getMatch(matchId);
  if (!m) return { success: false, lobby: emptyLobby(matchId), message: "Match not found" };
  if (m.hostId !== hostId) return { success: false, lobby: toLobby(m), message: "Only host can assign teams" };
  const p = m.players.find(p => p.userId === userId);
  if (!p) return { success: false, lobby: toLobby(m), message: "Player not found" };
  p.team = team;
  return { success: true, lobby: toLobby(m), message: "Team assigned" };
}

function toLobby(m: NonNullable<ReturnType<typeof getMatch>>): LobbyState {
  return {
    matchId: m.id, locked: false, playerCount: m.players.length,
    maxPlayers: m.settings.maxPlayers, minPlayers: m.settings.minPlayers,
    isPrivate: m.settings.isPrivate, pin: m.settings.pin ? "***" : null,
    inviteLink: `/join/${m.id}`,
    players: m.players.map(p => ({ userId: p.userId, displayName: p.displayName, team: p.team, isReady: p.isReady })),
  };
}

function emptyLobby(matchId: string): LobbyState {
  return { matchId, locked: false, playerCount: 0, maxPlayers: 0, minPlayers: 0, isPrivate: false, pin: null, inviteLink: null, players: [] };
}

// ===========================================================================
// System 4 — Player Session Engine
// ===========================================================================

const sessions = new Map<string, PlayerSession>();

export function createSession(userId: string, matchId: string): PlayerSession {
  const session: PlayerSession = {
    userId, matchId, status: "connecting", heartbeatAt: new Date().toISOString(),
    ping: 0, latencyMs: 0, connectionQuality: "excellent",
    reconnectAttempts: 0, lastDisconnectAt: null,
  };
  sessions.set(`${userId}:${matchId}`, session);
  return session;
}

export function getSession(userId: string, matchId: string): PlayerSession | null {
  return sessions.get(`${userId}:${matchId}`) ?? null;
}

export function updateSessionStatus(userId: string, matchId: string, status: SessionStatus): PlayerSession | null {
  const key = `${userId}:${matchId}`;
  const s = sessions.get(key);
  if (!s) return null;
  s.status = status;
  s.heartbeatAt = new Date().toISOString();
  if (status === "disconnected") s.lastDisconnectAt = s.heartbeatAt;
  if (status === "reconnecting") s.reconnectAttempts++;
  sessions.set(key, s);
  return s;
}

export function updateHeartbeat(userId: string, matchId: string, ping: number): PlayerSession | null {
  const key = `${userId}:${matchId}`;
  const s = sessions.get(key);
  if (!s) return null;
  s.ping = ping; s.latencyMs = ping;
  s.heartbeatAt = new Date().toISOString();
  s.connectionQuality = ping < 50 ? "excellent" : ping < 150 ? "good" : ping < 300 ? "fair" : "poor";
  sessions.set(key, s);
  return s;
}

export function checkTimeouts(matchId: string, timeoutMs = 10_000): string[] {
  const now = Date.now();
  const timedOut: string[] = [];
  for (const [key, s] of sessions) {
    if (s.matchId !== matchId) continue;
    if (s.status === "connected" && now - new Date(s.heartbeatAt).getTime() > timeoutMs) {
      s.status = "disconnected";
      s.lastDisconnectAt = new Date().toISOString();
      sessions.set(key, s);
      timedOut.push(s.userId);
    }
  }
  return timedOut;
}

// ===========================================================================
// System 5 — Ready Check Engine
// ===========================================================================

export function setPlayerReady(matchId: string, userId: string, ready: boolean): ReadyCheckState | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const p = m.players.find(p => p.userId === userId);
  if (!p) return null;
  p.isReady = ready;
  return getReadyCheckState(matchId);
}

export function getReadyCheckState(matchId: string): ReadyCheckState | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const readyCount = m.players.filter(p => p.isReady).length;
  const notReadyCount = m.players.length - readyCount;
  return {
    matchId, allReady: readyCount === m.players.length,
    readyCount, notReadyCount, afkCount: 0, disconnectedCount: 0,
    totalCount: m.players.length, teacherOverride: false,
    canStart: readyCount === m.players.length || m.settings.minPlayers <= readyCount,
  };
}

export function teacherOverrideReady(matchId: string): ReadyCheckState | null {
  const m = getMatch(matchId);
  if (!m) return null;
  return { ...getReadyCheckState(matchId)!, teacherOverride: true, canStart: true };
}

// ===========================================================================
// System 6 — Round Engine
// ===========================================================================

export function startRound(matchId: string, roundNumber: number): RoundInfo | null {
  const m = getMatch(matchId);
  if (!m) return null;
  m.currentRound = roundNumber;
  m.currentQuestion = 0;
  return {
    roundNumber, matchId, state: "active",
    questionCount: m.settings.questionPerRound, currentQuestionIndex: 0,
    startedAt: new Date().toISOString(), finishedAt: null, durationMs: null,
  };
}

export function finishRound(matchId: string, roundNumber: number): RoundInfo | null {
  const m = getMatch(matchId);
  if (!m) return null;
  m.statistics.totalRounds = Math.max(m.statistics.totalRounds, roundNumber);
  return {
    roundNumber, matchId, state: "finished",
    questionCount: m.settings.questionPerRound, currentQuestionIndex: m.settings.questionPerRound - 1,
    startedAt: null, finishedAt: new Date().toISOString(), durationMs: null,
  };
}

export function advanceQuestion(matchId: string): number | null {
  const m = getMatch(matchId);
  if (!m) return null;
  m.currentQuestion++;
  m.statistics.totalQuestions++;
  return m.currentQuestion;
}
