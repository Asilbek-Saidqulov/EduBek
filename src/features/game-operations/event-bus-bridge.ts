/** System 14 — Event Bus Bridge. Passive consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import { createAlert } from "./incident-management";

const log = getLogger("game-ops.bridge");
const processedEventIds = new Set<string>();

function isProcessed(e: GameEvent): boolean { return processedEventIds.has(e.id); }
function markProcessed(e: GameEvent): void { processedEventIds.add(e.id); if (processedEventIds.size > 10_000) { const f = processedEventIds.values().next().value; if (f) processedEventIds.delete(f); } }

function handleAntiCheatFinding(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  const kind = (p.kind as string) ?? "unknown";
  const severity = (p.severity as string) ?? "medium";
  createAlert({
    severity: severity === "critical" ? "critical" : severity === "high" ? "high" : "medium",
    title: `Anti-cheat finding: ${kind}`,
    description: `Anti-cheat detected: ${p.description ?? kind}`,
    source: "engine:anti_cheat",
  });
  markProcessed(e);
}

function handlePlayerDisconnected(e: GameEvent): void {
  if (isProcessed(e)) return;
  // Could create alerts for mass disconnects in production
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeOps(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  unsubscribers.push(subscribe("AntiCheatFinding" as GameEventType, e => { try { handleAntiCheatFinding(e); } catch (err) { log.error("bridge.anticheat.error", { err: String(err) }); } }));
  unsubscribers.push(subscribe("PlayerDisconnected" as GameEventType, e => { try { handlePlayerDisconnected(e); } catch (err) { log.error("bridge.disconnect.error", { err: String(err) }); } }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeOps(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
}

export function isOpsSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }

export function publishOpsEvent(type: string, actorId: string | null, payload: Record<string, unknown>): void {
  emitEvent("game-ops", "StateTransition" as GameEventType, actorId, { opsEventType: type, ...payload });
}

export function _resetBridgeForTesting(): void { unsubscribeOps(); processedEventIds.clear(); }
