/** System 25 — Event Bus Bridge. Passive consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import type { TelemetryEventType } from "./types";

const log = getLogger("telemetry.bridge");
const processedEventIds = new Set<string>();
const publishedEvents: Array<{ type: TelemetryEventType; actorId: string | null; payload: Record<string, unknown>; timestamp: string }> = [];

function isProcessed(e: GameEvent): boolean { return processedEventIds.has(e.id); }
function markProcessed(e: GameEvent): void {
  processedEventIds.add(e.id);
  if (processedEventIds.size > 10_000) {
    const f = processedEventIds.values().next().value;
    if (f) processedEventIds.delete(f);
  }
}

/**
 * Passive consumers — record EVERY event that flows through the bus.
 * Telemetry is the only platform that should observe everything.
 * NEVER calls back into other modules' services directly.
 */
function handleEvent(e: GameEvent): void {
  if (isProcessed(e)) return;
  // Telemetry records the event — does NOT act on it
  const p = e.payload as Record<string, unknown>;
  log.debug("bridge.event_observed", { type: e.type, matchId: e.matchId, actorId: e.actorId, payloadKeys: Object.keys(p) });
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeTelemetry(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  // Telemetry observes EVERY engine event
  unsubscribers.push(subscribe("StateTransition" as GameEventType, e => {
    try { handleEvent(e); } catch (err) { log.error("bridge.statetransition.error", { err: String(err) }); }
  }));
  unsubscribers.push(subscribe("MatchCreated" as GameEventType, e => { try { handleEvent(e); } catch { /* noop */ } }));
  unsubscribers.push(subscribe("MatchFinished" as GameEventType, e => { try { handleEvent(e); } catch { /* noop */ } }));
  unsubscribers.push(subscribe("AntiCheatFinding" as GameEventType, e => { try { handleEvent(e); } catch { /* noop */ } }));
  unsubscribers.push(subscribe("PlayerJoined" as GameEventType, e => { try { handleEvent(e); } catch { /* noop */ } }));
  unsubscribers.push(subscribe("PlayerLeft" as GameEventType, e => { try { handleEvent(e); } catch { /* noop */ } }));
  unsubscribers.push(subscribe("PlayerDisconnected" as GameEventType, e => { try { handleEvent(e); } catch { /* noop */ } }));
  unsubscribers.push(subscribe("PlayerReconnected" as GameEventType, e => { try { handleEvent(e); } catch { /* noop */ } }));
  unsubscribers.push(subscribe("ScoreUpdated" as GameEventType, e => { try { handleEvent(e); } catch { /* noop */ } }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeTelemetry(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
}

export function isTelemetrySubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }
export function getBridgePublishedCount(): number { return publishedEvents.length; }
export function getPublishedEvents(): typeof publishedEvents { return publishedEvents.slice(); }

/**
 * Produces a telemetry-owned event on the Game Engine event bus.
 */
export function publishTelemetryEvent(type: TelemetryEventType, actorId: string | null, payload: Record<string, unknown>): void {
  publishedEvents.push({ type, actorId, payload, timestamp: new Date().toISOString() });
  emitEvent("telemetry", "StateTransition" as GameEventType, actorId, { telemetryEventType: type, ...payload });
  log.info("bridge.publish", { type, actorId });
}

export function _resetBridgeForTesting(): void {
  unsubscribeTelemetry();
  processedEventIds.clear();
  publishedEvents.length = 0;
}
