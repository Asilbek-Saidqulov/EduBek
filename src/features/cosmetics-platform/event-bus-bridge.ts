/** Event Bus Bridge — passive consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import { grantItem, revokeItem, expireItem } from "./inventory-transactions";

const log = getLogger("cosmetics.bridge");
const processedEventIds = new Set<string>();

function isProcessed(e: GameEvent): boolean { return processedEventIds.has(e.id); }
function markProcessed(e: GameEvent): void { processedEventIds.add(e.id); if (processedEventIds.size > 10_000) { const f = processedEventIds.values().next().value; if (f) processedEventIds.delete(f); } }

function handleRewardGranted(e: GameEvent): void {
  if (isProcessed(e)) return;
  const userId = e.actorId;
  if (!userId) return;
  const p = e.payload as Record<string, unknown>;
  const cosmeticId = (p.cosmeticId as string) ?? null;
  if (cosmeticId) grantItem(userId, cosmeticId, "reward");
  markProcessed(e);
}

function handleAchievementUnlocked(e: GameEvent): void {
  if (isProcessed(e)) return;
  const userId = e.actorId;
  if (!userId) return;
  const p = e.payload as Record<string, unknown>;
  const cosmeticId = (p.cosmeticId as string) ?? null;
  if (cosmeticId) grantItem(userId, cosmeticId, "achievement");
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeCosmetics(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  unsubscribers.push(subscribe("ResourceChanged" as GameEventType, e => { try { handleRewardGranted(e); } catch (err) { log.error("bridge.reward.error", { err: String(err) }); } }));
  unsubscribers.push(subscribe("AnswerSubmitted" as GameEventType, e => { try { handleAchievementUnlocked(e); } catch (err) { log.error("bridge.achievement.error", { err: String(err) }); } }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeCosmetics(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
}

export function isCosmeticsSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }

export function publishCosmeticEvent(type: string, actorId: string | null, payload: Record<string, unknown>): void {
  emitEvent("cosmetics", "StateTransition" as GameEventType, actorId, { cosmeticEventType: type, ...payload });
}

export function _resetBridgeForTesting(): void { unsubscribeCosmetics(); processedEventIds.clear(); }
