/**
 * Systems 7-10: Question Pipeline, Timer Engine, Sync Engine, Event Engine.
 * Server authoritative. Deterministic.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { getMatch } from "./match-engine";
import type { QuestionState, QuestionPhase, TimerState, SyncSnapshot, SyncEvent, SyncReport, GameEvent, GameEventType } from "./types";

const log = getLogger("game-engine");

// ===========================================================================
// System 7 — Question Pipeline
// ===========================================================================

export function preloadQuestion(matchId: string, questionId: string, roundNumber: number, questionIndex: number): QuestionState {
  return { questionId, matchId, roundNumber, questionIndex, phase: "preload", publishedAt: null, answerDeadline: null, answerLockAt: null, revealAt: null, collectedAnswers: 0, totalPlayers: getMatch(matchId)?.players.length ?? 0 };
}

export function advanceQuestionPhase(state: QuestionState, phase: QuestionPhase, durationMs?: number): QuestionState {
  const now = new Date().toISOString();
  switch (phase) {
    case "published": state.publishedAt = now; state.answerDeadline = durationMs ? new Date(Date.now() + durationMs).toISOString() : null; break;
    case "answer_lock": state.answerLockAt = now; break;
    case "answer_reveal": state.revealAt = now; break;
  }
  state.phase = phase;
  return state;
}

export function recordAnswer(state: QuestionState): QuestionState {
  state.collectedAnswers++;
  return state;
}

// ===========================================================================
// System 8 — Timer Engine
// ===========================================================================

const timers = new Map<string, TimerState>();

export function startTimer(matchId: string, type: TimerState["type"], durationMs: number): TimerState {
  const timer: TimerState = {
    matchId, type, remaining: durationMs, total: durationMs,
    isPaused: false, startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + durationMs).toISOString(),
    serverTime: new Date().toISOString(),
    driftMs: 0, latencyCompensationMs: 0, teacherOverride: false,
  };
  timers.set(`${matchId}:${type}`, timer);
  return timer;
}

export function getTimer(matchId: string, type: TimerState["type"]): TimerState | null {
  return timers.get(`${matchId}:${type}`) ?? null;
}

export function pauseTimer(matchId: string, type: TimerState["type"]): TimerState | null {
  const key = `${matchId}:${type}`;
  const t = timers.get(key);
  if (!t || t.isPaused) return t ?? null;
  t.isPaused = true;
  t.remaining = t.expiresAt ? Math.max(0, new Date(t.expiresAt).getTime() - Date.now()) : 0;
  t.expiresAt = null;
  timers.set(key, t);
  return t;
}

export function resumeTimer(matchId: string, type: TimerState["type"]): TimerState | null {
  const key = `${matchId}:${type}`;
  const t = timers.get(key);
  if (!t || !t.isPaused) return t ?? null;
  t.isPaused = false;
  t.expiresAt = new Date(Date.now() + t.remaining).toISOString();
  timers.set(key, t);
  return t;
}

export function extendTimer(matchId: string, type: TimerState["type"], extraMs: number, teacherOverride = false): TimerState | null {
  const key = `${matchId}:${type}`;
  const t = timers.get(key);
  if (!t) return null;
  t.remaining += extraMs;
  t.total += extraMs;
  if (t.expiresAt) t.expiresAt = new Date(new Date(t.expiresAt).getTime() + extraMs).toISOString();
  t.teacherOverride = teacherOverride;
  timers.set(key, t);
  return t;
}

export function syncTimer(matchId: string, type: TimerState["type"], clientTime: number): TimerState | null {
  const key = `${matchId}:${type}`;
  const t = timers.get(key);
  if (!t) return null;
  const serverTime = Date.now();
  t.driftMs = clientTime - serverTime;
  t.latencyCompensationMs = Math.abs(t.driftMs) / 2;
  t.serverTime = new Date(serverTime).toISOString();
  timers.set(key, t);
  return t;
}

// ===========================================================================
// System 9 — Synchronization Engine
// ===========================================================================

const sequenceNumbers = new Map<string, number>();
const syncEvents = new Map<string, SyncEvent[]>();

export function nextSequenceNumber(matchId: string): number {
  const current = sequenceNumbers.get(matchId) ?? 0;
  const next = current + 1;
  sequenceNumbers.set(matchId, next);
  return next;
}

export function createSyncSnapshot(matchId: string): SyncSnapshot | null {
  const m = getMatch(matchId);
  if (!m) return null;
  return {
    matchId, sequenceNumber: nextSequenceNumber(matchId), timestamp: new Date().toISOString(),
    matchState: m.state, currentRound: m.currentRound, currentQuestion: m.currentQuestion,
    playerScores: m.players.map(p => ({ userId: p.userId, score: p.score })),
    timerRemaining: getTimer(matchId, "question")?.remaining ?? 0,
  };
}

export function recordSyncEvent(matchId: string, type: string, payload: Record<string, unknown>): SyncEvent {
  const seq = nextSequenceNumber(matchId);
  const event: SyncEvent = { matchId, sequenceNumber: seq, type, timestamp: new Date().toISOString(), payload };
  const events = syncEvents.get(matchId) ?? [];
  events.push(event);
  syncEvents.set(matchId, events);
  return event;
}

export function getSyncReport(matchId: string, avgLatencyMs = 0): SyncReport {
  const events = syncEvents.get(matchId) ?? [];
  const lastSeq = sequenceNumbers.get(matchId) ?? 0;
  return {
    matchId, lastSequenceNumber: lastSeq, snapshot: createSyncSnapshot(matchId),
    pendingEvents: events.length, avgLatencyMs, driftMs: 0,
    outOfOrderCount: 0, duplicateCount: 0,
  };
}

export function validateSyncEvent(event: SyncEvent, expectedSeq: number): { valid: boolean; reason: string | null } {
  if (event.sequenceNumber < expectedSeq) return { valid: false, reason: "Duplicate event (sequence number too low)" };
  if (event.sequenceNumber > expectedSeq + 1) return { valid: false, reason: "Out-of-order event (gap in sequence)" };
  return { valid: true, reason: null };
}

// ===========================================================================
// System 10 — Event Engine
// ===========================================================================

const eventBus = new Map<string, GameEvent[]>();
const listeners = new Map<GameEventType, Array<(event: GameEvent) => void>>();

export function emitEvent(matchId: string, type: GameEventType, actorId: string | null, payload: Record<string, unknown>): GameEvent {
  const seq = nextSequenceNumber(matchId);
  const event: GameEvent = { id: randomUUID(), matchId, type, sequenceNumber: seq, timestamp: new Date().toISOString(), actorId, payload };
  const events = eventBus.get(matchId) ?? [];
  events.push(event);
  eventBus.set(matchId, events);
  // Notify listeners
  const handlers = listeners.get(type) ?? [];
  for (const h of handlers) { try { h(event); } catch { /* noop */ } }
  log.debug("event.emit", { type, matchId, seq });
  return event;
}

export function getEvents(matchId: string, sinceSeq?: number): GameEvent[] {
  const events = eventBus.get(matchId) ?? [];
  return sinceSeq ? events.filter(e => e.sequenceNumber > sinceSeq) : events;
}

export function subscribe(type: GameEventType, handler: (event: GameEvent) => void): () => void {
  if (!listeners.has(type)) listeners.set(type, []);
  listeners.get(type)!.push(handler);
  return () => { const arr = listeners.get(type); if (arr) { const idx = arr.indexOf(handler); if (idx >= 0) arr.splice(idx, 1); } };
}

export function clearEvents(matchId: string): void { eventBus.delete(matchId); }
