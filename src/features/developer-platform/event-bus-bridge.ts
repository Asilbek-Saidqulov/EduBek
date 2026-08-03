/** System 19 — Event Bus Bridge. Passive consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import type { DeveloperEventType } from "./types";

const log = getLogger("developer.bridge");
const processedEventIds = new Set<string>();
const publishedEvents: Array<{ type: DeveloperEventType; actorId: string | null; payload: Record<string, unknown>; timestamp: string }> = [];

function isProcessed(e: GameEvent): boolean { return processedEventIds.has(e.id); }
function markProcessed(e: GameEvent): void {
  processedEventIds.add(e.id);
  if (processedEventIds.size > 10_000) { const f = processedEventIds.values().next().value; if (f) processedEventIds.delete(f); }
}

function handleEvent(e: GameEvent): void {
  if (isProcessed(e)) return;
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeDeveloper(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  unsubscribers.push(subscribe("StateTransition" as GameEventType, e => { try { handleEvent(e); } catch (err) { log.error("bridge.error", { err: String(err) }); } }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeDeveloper(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
}

export function isDeveloperSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }
export function getBridgePublishedCount(): number { return publishedEvents.length; }
export function getPublishedEvents(): typeof publishedEvents { return publishedEvents.slice(); }

export function publishDeveloperEvent(type: DeveloperEventType, actorId: string | null, payload: Record<string, unknown>): void {
  publishedEvents.push({ type, actorId, payload, timestamp: new Date().toISOString() });
  emitEvent("developer", "StateTransition" as GameEventType, actorId, { developerEventType: type, ...payload });
  log.info("bridge.publish", { type, actorId });
}

export function _resetBridgeForTesting(): void {
  unsubscribeDeveloper();
  processedEventIds.clear();
  publishedEvents.length = 0;
}
