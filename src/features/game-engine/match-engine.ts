/**
 * Systems 1-2: Universal Match Engine + Lifecycle State Machine.
 * Server authoritative. No game-specific logic.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import type { Match, MatchSettings, MatchState, MatchPlayer, LifecycleValidationResult, LifecycleTransition } from "./types";

const log = getLogger("game-engine");

// ===========================================================================
// System 1 — Universal Match Engine
// ===========================================================================

// In-memory match store (in production, this would be Redis or similar)
const matches = new Map<string, Match>();

export function createMatch(input: {
  hostId: string; organizationId?: string | null; gameMode: string;
  settings?: Partial<MatchSettings>;
}): Match {
  const id = randomUUID();
  const settings: MatchSettings = {
    gameMode: input.gameMode,
    maxPlayers: input.settings?.maxPlayers ?? 50,
    minPlayers: input.settings?.minPlayers ?? 2,
    roundCount: input.settings?.roundCount ?? 5,
    questionPerRound: input.settings?.questionPerRound ?? 5,
    timePerQuestion: input.settings?.timePerQuestion ?? 30_000,
    allowLateJoin: input.settings?.allowLateJoin ?? true,
    allowSpectators: input.settings?.allowSpectators ?? true,
    isPrivate: input.settings?.isPrivate ?? false,
    pin: input.settings?.pin ?? null,
    organizationRestricted: input.settings?.organizationRestricted ?? false,
  };
  const match: Match = {
    id, hostId: input.hostId, organizationId: input.organizationId ?? null,
    gameMode: input.gameMode, state: "lobby",
    players: [{ userId: input.hostId, displayName: "Host", team: null, isReady: false, isHost: true, isEliminated: false, joinedAt: new Date().toISOString(), score: 0 }],
    spectators: [], settings,
    statistics: { totalRounds: 0, totalQuestions: 0, totalAnswers: 0, averageAnswerTimeMs: 0, dropoutCount: 0, reconnectCount: 0, spectatorPeakCount: 0, durationMs: 0 },
    currentRound: 0, currentQuestion: 0,
    createdAt: new Date().toISOString(), startedAt: null, finishedAt: null,
  };
  matches.set(id, match);
  log.info("match.created", { id, gameMode: input.gameMode });
  return match;
}

export function getMatch(id: string): Match | null { return matches.get(id) ?? null; }
export function listMatches(): Match[] { return Array.from(matches.values()); }
export function destroyMatch(id: string): boolean { return matches.delete(id); }

export function updateMatchState(id: string, state: MatchState): Match | null {
  const m = matches.get(id);
  if (!m) return null;
  m.state = state;
  if (state === "countdown" && !m.startedAt) m.startedAt = new Date().toISOString();
  if (state === "match_finished" || state === "cancelled") {
    m.finishedAt = new Date().toISOString();
    if (m.startedAt) m.statistics.durationMs = new Date(m.finishedAt).getTime() - new Date(m.startedAt).getTime();
  }
  matches.set(id, m);
  return m;
}

export function updateMatchStatistics(id: string, stats: Partial<Match["statistics"]>): Match | null {
  const m = matches.get(id);
  if (!m) return null;
  m.statistics = { ...m.statistics, ...stats };
  matches.set(id, m);
  return m;
}

// ===========================================================================
// System 2 — Lifecycle State Machine
// ===========================================================================

export const VALID_TRANSITIONS: Record<MatchState, MatchState[]> = {
  idle: ["lobby", "cancelled"],
  lobby: ["waiting_for_players", "cancelled"],
  waiting_for_players: ["ready_check", "lobby", "cancelled"],
  ready_check: ["countdown", "waiting_for_players", "cancelled"],
  countdown: ["round_starting", "lobby", "cancelled"],
  round_starting: ["question_active", "cancelled"],
  question_active: ["answer_collection", "cancelled"],
  answer_collection: ["answer_lock", "cancelled"],
  answer_lock: ["scoring", "cancelled"],
  scoring: ["animations", "cancelled"],
  animations: ["leaderboard", "cancelled"],
  leaderboard: ["round_finished", "cancelled"],
  round_finished: ["next_round", "match_finished", "cancelled"],
  next_round: ["round_starting", "cancelled"],
  match_finished: ["rewards"],
  rewards: ["replay_saved"],
  replay_saved: ["archived"],
  archived: [],
  cancelled: ["archived"],
};

export function validateTransition(from: MatchState, to: MatchState): LifecycleValidationResult {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  const valid = allowed.includes(to);
  return {
    valid, currentState: from, attemptedTransition: to,
    reason: valid ? null : `Invalid transition from ${from} to ${to}. Valid transitions: ${allowed.join(", ") || "none"}`,
  };
}

export function attemptTransition(matchId: string, targetState: MatchState): LifecycleTransition {
  const m = getMatch(matchId);
  if (!m) return { from: "idle" as MatchState, to: targetState, valid: false, reason: "Match not found" };
  const result = validateTransition(m.state, targetState);
  if (result.valid) updateMatchState(matchId, targetState);
  return { from: m.state, to: targetState, valid: result.valid, reason: result.reason };
}

export function getValidTransitions(state: MatchState): MatchState[] {
  return VALID_TRANSITIONS[state] ?? [];
}
