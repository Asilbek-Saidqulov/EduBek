/**
 * Systems 11-18: Score Pipeline, Resource Pipeline, Replay, Spectators,
 * Reconnect, Anti-Cheat, Match Recorder, Game Analytics.
 * No scoring formulas. No game-specific resources. Deterministic.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { getMatch, listMatches } from "./match-engine";
import { getEvents } from "./pipeline-sync-events";
import type { ScoreEvent, ScorePipelineReport, ResourceEvent, ResourceRegistration, ReplayRecord, ReplayState, SpectatorSession, RecoveryState, CheatFinding, CheatKind, MatchRecord, GameAnalyticsReport } from "./types";

const log = getLogger("game-engine");

// ===========================================================================
// System 11 — Score Pipeline Foundation (NO scoring formulas)
// ===========================================================================

const scoreEvents = new Map<string, ScoreEvent[]>();

export function receiveScoreEvent(input: { matchId: string; userId: string; roundNumber: number; questionIndex: number; eventType: string; rawValue: number }): ScoreEvent {
  const event: ScoreEvent = {
    matchId: input.matchId, userId: input.userId, roundNumber: input.roundNumber,
    questionIndex: input.questionIndex, eventType: input.eventType, rawValue: input.rawValue,
    normalizedValue: null, validated: false, timestamp: new Date().toISOString(),
  };
  const events = scoreEvents.get(input.matchId) ?? [];
  events.push(event);
  scoreEvents.set(input.matchId, events);
  return event;
}

export function validateScoreEvent(event: ScoreEvent): ScoreEvent {
  event.validated = event.rawValue >= 0 && !isNaN(event.rawValue);
  return event;
}

export function normalizeScoreEvent(event: ScoreEvent, normalizeFn?: (raw: number) => number): ScoreEvent {
  event.normalizedValue = normalizeFn ? normalizeFn(event.rawValue) : event.rawValue;
  return event;
}

export function getScorePipelineReport(matchId: string): ScorePipelineReport {
  const events = scoreEvents.get(matchId) ?? [];
  return {
    matchId, totalEvents: events.length,
    validatedEvents: events.filter(e => e.validated).length,
    rejectedEvents: events.filter(e => !e.validated).length,
    publishedEvents: events.filter(e => e.validated && e.normalizedValue !== null).length,
  };
}

// ===========================================================================
// System 12 — Resource Pipeline Foundation (NO game-specific resources)
// ===========================================================================

const resourceRegistry = new Map<string, ResourceRegistration>();
const resourceEvents = new Map<string, ResourceEvent[]>();
const resourceBalances = new Map<string, Map<string, number>>(); // matchId → userId:resourceType → balance

export function registerResource(reg: ResourceRegistration): void {
  resourceRegistry.set(reg.resourceType, reg);
}

export function processResourceAction(input: { matchId: string; userId: string; resourceType: string; action: ResourceEvent["action"]; amount: number }): ResourceEvent {
  const reg = resourceRegistry.get(input.resourceType);
  const matchBalances = resourceBalances.get(input.matchId) ?? new Map<string, number>();
  const key = `${input.userId}:${input.resourceType}`;
  let balance = matchBalances.get(key) ?? reg?.initialValue ?? 0;
  switch (input.action) {
    case "earned": balance += input.amount; break;
    case "spent": balance = Math.max(reg?.minValue ?? 0, balance - input.amount); break;
    case "transferred": balance -= input.amount; break;
    case "lost": balance = Math.max(reg?.minValue ?? 0, balance - input.amount); break;
  }
  if (reg?.maxValue) balance = Math.min(reg.maxValue, balance);
  matchBalances.set(key, balance);
  resourceBalances.set(input.matchId, matchBalances);
  const event: ResourceEvent = { matchId: input.matchId, userId: input.userId, resourceType: input.resourceType, action: input.action, amount: input.amount, balance, timestamp: new Date().toISOString(), metadata: {} };
  const events = resourceEvents.get(input.matchId) ?? [];
  events.push(event);
  resourceEvents.set(input.matchId, events);
  return event;
}

export function getResourceBalance(matchId: string, userId: string, resourceType: string): number {
  return resourceBalances.get(matchId)?.get(`${userId}:${resourceType}`) ?? 0;
}

export function getResourceHistory(matchId: string, userId?: string): ResourceEvent[] {
  const events = resourceEvents.get(matchId) ?? [];
  return userId ? events.filter(e => e.userId === userId) : events;
}

// ===========================================================================
// System 13 — Replay Engine Foundation
// ===========================================================================

const replays = new Map<string, ReplayRecord>();

export function saveReplay(matchId: string): ReplayRecord | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const events = getEvents(matchId);
  const record: ReplayRecord = {
    matchId, events, stateTransitions: [], totalEvents: events.length,
    durationMs: m.statistics.durationMs,
    participants: m.players.map(p => p.userId),
    createdAt: new Date().toISOString(),
  };
  replays.set(matchId, record);
  log.info("replay.saved", { matchId, events: events.length });
  return record;
}

export function getReplay(matchId: string): ReplayRecord | null { return replays.get(matchId) ?? null; }

export function createReplayState(matchId: string): ReplayState {
  return { matchId, currentTime: 0, totalTime: getReplay(matchId)?.durationMs ?? 0, isPlaying: false, speed: 1, currentEventIndex: 0, reconstructedState: {} };
}

export function stepReplay(state: ReplayState, forward: boolean): ReplayState {
  const replay = getReplay(state.matchId);
  if (!replay) return state;
  state.currentEventIndex = forward ? Math.min(replay.events.length - 1, state.currentEventIndex + 1) : Math.max(0, state.currentEventIndex - 1);
  return state;
}

// ===========================================================================
// System 14 — Spectator Engine
// ===========================================================================

const spectators = new Map<string, SpectatorSession[]>();

export function addSpectator(matchId: string, userId: string, role: SpectatorSession["role"]): SpectatorSession {
  const session: SpectatorSession = { userId, matchId, role, joinedAt: new Date().toISOString(), read: true };
  const list = spectators.get(matchId) ?? [];
  list.push(session);
  spectators.set(matchId, list);
  return session;
}

export function removeSpectator(matchId: string, userId: string): boolean {
  const list = spectators.get(matchId);
  if (!list) return false;
  const filtered = list.filter(s => s.userId !== userId);
  spectators.set(matchId, filtered);
  return true;
}

export function getSpectators(matchId: string): SpectatorSession[] { return spectators.get(matchId) ?? []; }

// ===========================================================================
// System 15 — Reconnect Engine
// ===========================================================================

export function recoverPlayer(matchId: string, userId: string): RecoveryState {
  const m = getMatch(matchId);
  const player = m?.players.find(p => p.userId === userId);
  const start = Date.now();
  const recovery: RecoveryState = {
    userId, matchId, recovered: !!m && !!player,
    recoveredState: m ? { state: m.state, round: m.currentRound, question: m.currentQuestion } : {},
    recoveredScore: player?.score ?? 0,
    recoveredQuestion: m?.currentQuestion ?? 0,
    recoveredTimer: 0, missingEvents: 0,
    recoveryTimeMs: Date.now() - start,
  };
  log.info("reconnect.recovered", { matchId, userId, recovered: recovery.recovered });
  return recovery;
}

// ===========================================================================
// System 16 — Anti-Cheat Foundation (deterministic only, never auto-ban)
// ===========================================================================

const cheatFindings = new Map<string, CheatFinding[]>();

export function detectCheat(input: { matchId: string; userId: string; kind: CheatKind; description: string; evidence: string; severity?: CheatFinding["severity"] }): CheatFinding {
  const finding: CheatFinding = {
    id: randomUUID(), matchId: input.matchId, userId: input.userId, kind: input.kind,
    severity: input.severity ?? "medium", description: input.description,
    evidence: input.evidence, timestamp: new Date().toISOString(),
  };
  const list = cheatFindings.get(input.matchId) ?? [];
  list.push(finding);
  cheatFindings.set(input.matchId, list);
  log.warn("anti_cheat.finding", { kind: input.kind, matchId: input.matchId, userId: input.userId });
  return finding;
}

export function getCheatFindings(matchId: string): CheatFinding[] { return cheatFindings.get(matchId) ?? []; }

export function checkDuplicateSubmission(matchId: string, userId: string, questionIndex: number, existingAnswers: Array<{ userId: string; questionIndex: number }>): CheatFinding | null {
  const dupes = existingAnswers.filter(a => a.userId === userId && a.questionIndex === questionIndex);
  if (dupes.length > 1) {
    return detectCheat({ matchId, userId, kind: "duplicate_submission", description: `Multiple submissions for question ${questionIndex}`, evidence: `${dupes.length} submissions`, severity: "high" });
  }
  return null;
}

export function checkImpossibleTimestamp(matchId: string, userId: string, submitTime: number, questionPublishTime: number): CheatFinding | null {
  if (submitTime < questionPublishTime) {
    return detectCheat({ matchId, userId, kind: "impossible_timestamp", description: "Answer submitted before question was published", evidence: `submit=${submitTime} publish=${questionPublishTime}`, severity: "critical" });
  }
  return null;
}

// ===========================================================================
// System 17 — Match Recorder
// ===========================================================================

const matchRecords = new Map<string, MatchRecord>();

export function recordMatch(matchId: string): MatchRecord | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const events = getEvents(matchId);
  const record: MatchRecord = {
    matchId, events: events.length, statistics: m.statistics,
    participants: m.players.map(p => p.userId),
    timeline: events.slice(0, 100).map(e => ({ timestamp: e.timestamp, event: e.type, details: JSON.stringify(e.payload).slice(0, 100) })),
    performance: { avgLatencyMs: 0, maxLatencyMs: 0, serverLoad: 0 },
    recordedAt: new Date().toISOString(),
  };
  matchRecords.set(matchId, record);
  return record;
}

export function getMatchRecord(matchId: string): MatchRecord | null { return matchRecords.get(matchId) ?? null; }

// ===========================================================================
// System 18 — Universal Game Analytics
// ===========================================================================

export function generateGameAnalytics(): GameAnalyticsReport {
  const matches = listMatches();
  const completed = matches.filter(m => m.state === "archived" || m.state === "match_finished");
  const active = matches.filter(m => m.state !== "archived" && m.state !== "cancelled" && m.state !== "lobby");
  const totalPlayers = matches.reduce((s, m) => s + m.players.length, 0);
  const peakConcurrent = Math.max(...matches.map(m => m.players.length), 0);
  const avgDuration = completed.length > 0 ? Math.round(completed.reduce((s, m) => s + m.statistics.durationMs, 0) / completed.length) : 0;
  const totalDropouts = matches.reduce((s, m) => s + m.statistics.dropoutCount, 0);
  const totalReconnects = matches.reduce((s, m) => s + m.statistics.reconnectCount, 0);
  const totalSpectators = matches.reduce((s, m) => s + m.spectators.length, 0);
  return {
    generatedAt: new Date().toISOString(),
    totalMatches: matches.length, activeMatches: active.length, completedMatches: completed.length,
    totalPlayers, peakConcurrentPlayers: peakConcurrent,
    avgMatchDurationMs: avgDuration, avgLatencyMs: 0,
    dropoutRate: totalPlayers > 0 ? Math.round((totalDropouts / totalPlayers) * 100) / 100 : 0,
    reconnectRate: totalPlayers > 0 ? Math.round((totalReconnects / totalPlayers) * 100) / 100 : 0,
    avgQuestionTimeMs: 0, avgAnswerTimeMs: 0,
    spectatorCount: totalSpectators, teacherInterventions: 0,
    completionRate: matches.length > 0 ? Math.round((completed.length / matches.length) * 100) / 100 : 0,
  };
}
