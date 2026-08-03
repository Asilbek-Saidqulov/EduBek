/** System 17 — Event Bus Bridge. Passive consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import type { SearchEventType } from "./types";

const log = getLogger("search.bridge");
const processedEventIds = new Set<string>();
const publishedEvents: Array<{ type: SearchEventType; actorId: string | null; payload: Record<string, unknown>; timestamp: string }> = [];

function isProcessed(e: GameEvent): boolean { return processedEventIds.has(e.id); }
function markProcessed(e: GameEvent): void { processedEventIds.add(e.id); if (processedEventIds.size > 10_000) { const f = processedEventIds.values().next().value; if (f) processedEventIds.delete(f); } }
function handleEvent(e: GameEvent): void { if (isProcessed(e)) return; markProcessed(e); }

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeSearch(): void {
  if (isSubscribed) return; isSubscribed = true;
  unsubscribers.push(subscribe("StateTransition" as GameEventType, e => { try { handleEvent(e); } catch (err) { log.error("bridge.error", { err: String(err) }); } }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}
export function unsubscribeSearch(): void { for (const u of unsubscribers) { try { u(); } catch {} } unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear(); }
export function isSearchSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }
export function getBridgePublishedCount(): number { return publishedEvents.length; }
export function getPublishedEvents(): typeof publishedEvents { return publishedEvents.slice(); }

export function publishSearchEvent(type: SearchEventType, actorId: string | null, payload: Record<string, unknown>): void {
  publishedEvents.push({ type, actorId, payload, timestamp: new Date().toISOString() });
  emitEvent("search", "StateTransition" as GameEventType, actorId, { searchEventType: type, ...payload });
  log.info("bridge.publish", { type, actorId });
}

export function _resetBridgeForTesting(): void { unsubscribeSearch(); processedEventIds.clear(); publishedEvents.length = 0; }
