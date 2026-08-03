/** System 13 — Event Bus Bridge. Passive consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import type { NotificationEventType } from "./types";

const log = getLogger("notifications.bridge");
const processedEventIds = new Set<string>();
const publishedEvents: Array<{ type: NotificationEventType; actorId: string | null; payload: Record<string, unknown>; timestamp: string }> = [];

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
function handleGameEvent(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  const kind = (p.kind as string) ?? (p.commerceEventType as string) ?? (p.opsEventType as string) ?? (p.liveOpsEventType as string) ?? "";
  // We pattern-match on event kind to know what kind of notification might be needed.
  // However, this module only records the fact — actual routing happens through RoutingRule registry.
  log.debug("bridge.event", { type: e.type, kind, matchId: e.matchId });
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeNotifications(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  unsubscribers.push(subscribe("StateTransition" as GameEventType, e => {
    try { handleGameEvent(e); } catch (err) { log.error("bridge.error", { err: String(err) }); }
  }));
  unsubscribers.push(subscribe("MatchFinished" as GameEventType, e => {
    try { handleGameEvent(e); } catch (err) { log.error("bridge.match_finished.error", { err: String(err) }); }
  }));
  unsubscribers.push(subscribe("AntiCheatFinding" as GameEventType, e => {
    try { handleGameEvent(e); } catch (err) { log.error("bridge.anticheat.error", { err: String(err) }); }
  }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeNotifications(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
}

export function isNotificationsSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }
export function getBridgePublishedCount(): number { return publishedEvents.length; }
export function getPublishedEvents(): typeof publishedEvents { return publishedEvents.slice(); }

/**
 * Produces a notification-owned event on the Game Engine event bus.
 * Consumers subscribe and react. This module NEVER calls them directly.
 */
export function publishNotificationEvent(type: NotificationEventType, actorId: string | null, payload: Record<string, unknown>): void {
  publishedEvents.push({ type, actorId, payload, timestamp: new Date().toISOString() });
  emitEvent("notifications", "StateTransition" as GameEventType, actorId, { notificationEventType: type, ...payload });
  log.info("bridge.publish", { type, actorId });
}

export function _resetBridgeForTesting(): void {
  unsubscribeNotifications();
  processedEventIds.clear();
  publishedEvents.length = 0;
}
