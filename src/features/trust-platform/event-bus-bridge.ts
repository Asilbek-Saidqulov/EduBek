/** System 18 — Event Bus Bridge. Passive consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import type { TrustEventType } from "./types";

const log = getLogger("trust.bridge");
const processedEventIds = new Set<string>();
const publishedEvents: Array<{ type: TrustEventType; actorId: string | null; payload: Record<string, unknown>; timestamp: string }> = [];

function isProcessed(e: GameEvent): boolean { return processedEventIds.has(e.id); }
function markProcessed(e: GameEvent): void {
  processedEventIds.add(e.id);
  if (processedEventIds.size > 10_000) {
    const f = processedEventIds.values().next().value;
    if (f) processedEventIds.delete(f);
  }
}

/**
 * Passive consumers — react to AntiCheatFinding and similar events.
 * The Trust Platform creates safety signals from these events.
 * NEVER calls back into other modules' services directly.
 * NEVER performs automatic bans.
 */
function handleEvent(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  log.debug("bridge.event_observed", { type: e.type, matchId: e.matchId, actorId: e.actorId });
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeTrust(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  // Trust platform consumes safety-relevant events
  unsubscribers.push(subscribe("StateTransition" as GameEventType, e => {
    try { handleEvent(e); } catch (err) { log.error("bridge.statetransition.error", { err: String(err) }); }
  }));
  unsubscribers.push(subscribe("AntiCheatFinding" as GameEventType, e => {
    try { handleEvent(e); } catch (err) { log.error("bridge.anticheat.error", { err: String(err) }); }
  }));
  unsubscribers.push(subscribe("PlayerDisconnected" as GameEventType, e => {
    try { handleEvent(e); } catch (err) { log.error("bridge.disconnect.error", { err: String(err) }); }
  }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeTrust(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
}

export function isTrustSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }
export function getBridgePublishedCount(): number { return publishedEvents.length; }
export function getPublishedEvents(): typeof publishedEvents { return publishedEvents.slice(); }

/**
 * Produces a trust-owned event on the Game Engine event bus.
 */
export function publishTrustEvent(type: TrustEventType, actorId: string | null, payload: Record<string, unknown>): void {
  publishedEvents.push({ type, actorId, payload, timestamp: new Date().toISOString() });
  emitEvent("trust", "StateTransition" as GameEventType, actorId, { trustEventType: type, ...payload });
  log.info("bridge.publish", { type, actorId });
}

export function _resetBridgeForTesting(): void {
  unsubscribeTrust();
  processedEventIds.clear();
  publishedEvents.length = 0;
}
