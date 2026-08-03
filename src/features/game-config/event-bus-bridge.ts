/** System 16 — Event Bus Bridge. Passive consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import { receiveRecommendation } from "./experiments-dashboard";

const log = getLogger("game-config.bridge");
const processedEventIds = new Set<string>();

function isProcessed(e: GameEvent): boolean { return processedEventIds.has(e.id); }
function markProcessed(e: GameEvent): void { processedEventIds.add(e.id); if (processedEventIds.size > 10_000) { const f = processedEventIds.values().next().value; if (f) processedEventIds.delete(f); } }

function handleScoreUpdated(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  if ((p.action as string) === "recommendation") {
    receiveRecommendation({
      source: "game-intelligence",
      gameMode: "all",
      title: (p.title as string) ?? "Configuration recommendation",
      description: (p.description as string) ?? "",
      currentValue: p.currentValue ?? null,
      suggestedValue: p.suggestedValue ?? null,
    });
  }
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeConfig(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  unsubscribers.push(subscribe("ScoreUpdated" as GameEventType, e => { try { handleScoreUpdated(e); } catch (err) { log.error("bridge.error", { err: String(err) }); } }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeConfig(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
}

export function isConfigSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }

export function publishConfigEvent(type: string, actorId: string | null, payload: Record<string, unknown>): void {
  emitEvent("game-config", "StateTransition" as GameEventType, actorId, { configEventType: type, ...payload });
}

export function _resetBridgeForTesting(): void { unsubscribeConfig(); processedEventIds.clear(); }
