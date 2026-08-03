/** System 18 — Event Bus Bridge. Passive consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import type { IdentityEventType } from "./types";

const log = getLogger("identity.bridge");
const processedEventIds = new Set<string>();
const publishedEvents: Array<{ type: IdentityEventType; actorId: string | null; payload: Record<string, unknown>; timestamp: string }> = [];

function isProcessed(e: GameEvent): boolean { return processedEventIds.has(e.id); }
function markProcessed(e: GameEvent): void {
  processedEventIds.add(e.id);
  if (processedEventIds.size > 10_000) {
    const f = processedEventIds.values().next().value;
    if (f) processedEventIds.delete(f);
  }
}

/**
 * Passive consumers — react to events from other platforms.
 * NEVER calls back into other modules' services directly.
 */
function handleEvent(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  const kind = (p.kind as string) ?? (p.commerceEventType as string) ?? (p.notificationEventType as string) ?? (p.opsEventType as string) ?? "";
  log.debug("bridge.event", { type: e.type, kind, matchId: e.matchId });
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeIdentity(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  unsubscribers.push(subscribe("StateTransition" as GameEventType, e => {
    try { handleEvent(e); } catch (err) { log.error("bridge.error", { err: String(err) }); }
  }));
  unsubscribers.push(subscribe("PlayerJoined" as GameEventType, e => {
    try { handleEvent(e); } catch (err) { log.error("bridge.player_joined.error", { err: String(err) }); }
  }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeIdentity(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
}

export function isIdentitySubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }
export function getBridgePublishedCount(): number { return publishedEvents.length; }
export function getPublishedEvents(): typeof publishedEvents { return publishedEvents.slice(); }

/**
 * Produces an identity-owned event on the Game Engine event bus.
 * Consumers subscribe and react. This module NEVER calls them directly.
 */
export function publishIdentityEvent(type: IdentityEventType, actorId: string | null, payload: Record<string, unknown>): void {
  publishedEvents.push({ type, actorId, payload, timestamp: new Date().toISOString() });
  emitEvent("identity", "StateTransition" as GameEventType, actorId, { identityEventType: type, ...payload });
  log.info("bridge.publish", { type, actorId });
}

export function _resetBridgeForTesting(): void {
  unsubscribeIdentity();
  processedEventIds.clear();
  publishedEvents.length = 0;
}
