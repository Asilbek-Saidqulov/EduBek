/** System 16 — Event Bus Bridge. Passive consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import { createHighlight } from "./replay-highlights-streaming";
import { transitionStage } from "./broadcast-production";

const log = getLogger("broadcast.bridge");
const processedEventIds = new Set<string>();

function isProcessed(e: GameEvent): boolean { return processedEventIds.has(e.id); }
function markProcessed(e: GameEvent): void { processedEventIds.add(e.id); if (processedEventIds.size > 10_000) { const f = processedEventIds.values().next().value; if (f) processedEventIds.delete(f); } }

function handleMatchFinished(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  const matchId = e.matchId;
  if ((p.result as string) === "win") {
    createHighlight({ matchId, type: "winner", title: "Winner!", description: `Winner declared in match ${matchId}`, playerIds: [e.actorId ?? ""] });
  }
  transitionStage(matchId, "winner_ceremony");
  markProcessed(e);
}

function handleRoundFinished(e: GameEvent): void {
  if (isProcessed(e)) return;
  transitionStage(e.matchId, "leaderboard");
  markProcessed(e);
}

function handleScoreUpdated(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  if ((p.action as string) === "comeback") {
    createHighlight({ matchId: e.matchId, type: "big_comeback", title: "Big Comeback!", description: "Player made a big comeback" });
  }
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeBroadcast(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  unsubscribers.push(subscribe("MatchFinished" as GameEventType, e => { try { handleMatchFinished(e); } catch (err) { log.error("bridge.match.error", { err: String(err) }); } }));
  unsubscribers.push(subscribe("RoundFinished" as GameEventType, e => { try { handleRoundFinished(e); } catch (err) { log.error("bridge.round.error", { err: String(err) }); } }));
  unsubscribers.push(subscribe("ScoreUpdated" as GameEventType, e => { try { handleScoreUpdated(e); } catch (err) { log.error("bridge.score.error", { err: String(err) }); } }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeBroadcast(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
}

export function isBroadcastSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }

export function publishBroadcastEvent(type: string, actorId: string | null, payload: Record<string, unknown>): void {
  emitEvent("broadcast", "StateTransition" as GameEventType, actorId, { broadcastEventType: type, ...payload });
}

export function _resetBridgeForTesting(): void { unsubscribeBroadcast(); processedEventIds.clear(); }
