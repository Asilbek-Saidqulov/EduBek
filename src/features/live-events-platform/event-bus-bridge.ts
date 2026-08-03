/** System 10 — Event Bridge. Passive Event Bus consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import { completeParticipant, updateParticipationObjective } from "./participation-objectives";
import { updateMilestoneProgress } from "./campaign-scheduler";
import type { LiveOpsEventType } from "./types";

const log = getLogger("live-events.bridge");
const processedEventIds = new Set<string>();

function isProcessed(e: GameEvent): boolean { return processedEventIds.has(e.id); }
function markProcessed(e: GameEvent): void { processedEventIds.add(e.id); if (processedEventIds.size > 10_000) { const f = processedEventIds.values().next().value; if (f) processedEventIds.delete(f); } }

function handleMatchFinished(e: GameEvent): void {
  if (isProcessed(e)) return;
  const userId = e.actorId;
  if (!userId) return;
  const p = e.payload as Record<string, unknown>;
  const eventId = (p.liveEventId as string) ?? null;
  if (eventId) {
    updateParticipationObjective(eventId, userId, "play_matches", 1);
    if ((p.result as string) === "win") updateParticipationObjective(eventId, userId, "win_matches", 1);
  }
  markProcessed(e);
}

function handleLevelUp(e: GameEvent): void {
  if (isProcessed(e)) return;
  const userId = e.actorId;
  if (!userId) return;
  const p = e.payload as Record<string, unknown>;
  const eventId = (p.liveEventId as string) ?? null;
  if (eventId) updateParticipationObjective(eventId, userId, "reach_level", (p.newLevel as number) ?? 0);
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeLiveEvents(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  unsubscribers.push(subscribe("MatchFinished" as GameEventType, e => { try { handleMatchFinished(e); } catch (err) { log.error("bridge.match.error", { err: String(err) }); } }));
  unsubscribers.push(subscribe("ScoreUpdated" as GameEventType, e => { try { handleLevelUp(e); } catch (err) { log.error("bridge.level.error", { err: String(err) }); } }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeLiveEvents(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
  log.info("bridge.unsubscribed");
}

export function isLiveEventsSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }

export function publishLiveOpsEvent(type: LiveOpsEventType, actorId: string | null, payload: Record<string, unknown>): void {
  emitEvent("liveops", "StateTransition" as GameEventType, actorId, { liveOpsEventType: type, ...payload });
  log.debug("liveops.event.published", { type, actorId });
}

export function _resetBridgeForTesting(): void { unsubscribeLiveEvents(); processedEventIds.clear(); }
