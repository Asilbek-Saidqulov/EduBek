/** System 17 — Event Bus Bridge. Passive consumer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import { recordTelemetry, computeTelemetrySummary } from "./telemetry-balance";
import { raiseHealthAlert } from "./intelligence-dashboard";

const log = getLogger("intelligence.bridge");
const processedEventIds = new Set<string>();

function isProcessed(e: GameEvent): boolean { return processedEventIds.has(e.id); }
function markProcessed(e: GameEvent): void { processedEventIds.add(e.id); if (processedEventIds.size > 10_000) { const f = processedEventIds.values().next().value; if (f) processedEventIds.delete(f); } }

function handleMatchFinished(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  recordTelemetry({
    matchId: e.matchId, userId: e.actorId,
    gameMode: (p.gameMode as string) ?? "classic_quiz",
    eventType: "match_finished", durationMs: (p.durationMs as number) ?? null,
    value: (p.score as number) ?? null,
    metadata: { result: p.result },
  });
  computeTelemetrySummary(e.matchId);
  markProcessed(e);
}

function handleAnswerSubmitted(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  recordTelemetry({
    matchId: e.matchId, userId: e.actorId,
    gameMode: (p.gameMode as string) ?? "classic_quiz",
    eventType: "answer_submitted",
    durationMs: (p.responseMs as number) ?? null,
    value: (p.isCorrect as boolean) ? 1 : 0,
    metadata: {},
  });
  markProcessed(e);
}

function handlePlayerDisconnected(e: GameEvent): void {
  if (isProcessed(e)) return;
  recordTelemetry({
    matchId: e.matchId, userId: e.actorId,
    gameMode: "unknown", eventType: "disconnect",
    metadata: {},
  });
  markProcessed(e);
}

function handleScoreUpdated(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  if ((p.action as string) === "comeback") {
    recordTelemetry({
      matchId: e.matchId, userId: e.actorId,
      gameMode: "unknown", eventType: "comeback",
      metadata: {},
    });
  }
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeIntelligence(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  unsubscribers.push(subscribe("MatchFinished" as GameEventType, e => { try { handleMatchFinished(e); } catch (err) { log.error("bridge.match.error", { err: String(err) }); } }));
  unsubscribers.push(subscribe("AnswerSubmitted" as GameEventType, e => { try { handleAnswerSubmitted(e); } catch (err) { log.error("bridge.answer.error", { err: String(err) }); } }));
  unsubscribers.push(subscribe("PlayerDisconnected" as GameEventType, e => { try { handlePlayerDisconnected(e); } catch (err) { log.error("bridge.disconnect.error", { err: String(err) }); } }));
  unsubscribers.push(subscribe("ScoreUpdated" as GameEventType, e => { try { handleScoreUpdated(e); } catch (err) { log.error("bridge.score.error", { err: String(err) }); } }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeIntelligence(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
}

export function isIntelligenceSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }

export function publishIntelligenceEvent(type: string, actorId: string | null, payload: Record<string, unknown>): void {
  emitEvent("intelligence", "StateTransition" as GameEventType, actorId, { intelligenceEventType: type, ...payload });
}

export function _resetBridgeForTesting(): void { unsubscribeIntelligence(); processedEventIds.clear(); }
