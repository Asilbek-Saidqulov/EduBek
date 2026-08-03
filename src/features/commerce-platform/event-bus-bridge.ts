/** System 15 — Event Bus Bridge. Passive consumer + producer. */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import type { CommerceEventType } from "./types";

const log = getLogger("commerce.bridge");
const processedEventIds = new Set<string>();
const publishedEvents: Array<{ type: CommerceEventType; actorId: string | null; payload: Record<string, unknown>; timestamp: string }> = [];

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
 * NEVER calls back into other modules' services directly. Only records
 * marketplace/identity/org references into our own repository.
 */
function handleMarketplaceSale(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  // Reference-only — we keep a marketplace sale reference for commerce analytics
  // We do NOT own marketplace state.
  log.info("bridge.marketplace_sale", { saleId: p.saleId, listingId: p.listingId });
  markProcessed(e);
}

function handleIdentityCreated(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  log.debug("bridge.identity_created", { userId: p.userId });
  markProcessed(e);
}

function handleOrganizationCreated(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  log.debug("bridge.org_created", { orgId: p.organizationId });
  markProcessed(e);
}

function handleLiveOpsCampaign(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  log.debug("bridge.liveops_campaign", { campaignId: p.campaignId });
  markProcessed(e);
}

function handleConfigChange(e: GameEvent): void {
  if (isProcessed(e)) return;
  const p = e.payload as Record<string, unknown>;
  log.debug("bridge.config_change", { key: p.key });
  markProcessed(e);
}

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeCommerce(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  // Subscribe to GameEngine events that other platforms emit via StateTransition.
  // We pattern-match on payload.kind to route.
  unsubscribers.push(subscribe("StateTransition" as GameEventType, e => {
    try {
      const p = e.payload as Record<string, unknown>;
      const kind = (p.kind as string) ?? (p.opsEventType as string) ?? "";
      if (kind === "marketplace_sale" || kind === "MarketplaceSale") handleMarketplaceSale(e);
      else if (kind === "identity_created") handleIdentityCreated(e);
      else if (kind === "organization_created") handleOrganizationCreated(e);
      else if (kind === "liveops_campaign") handleLiveOpsCampaign(e);
      else if (kind === "config_change") handleConfigChange(e);
    } catch (err) {
      log.error("bridge.error", { err: String(err) });
    }
  }));
  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeCommerce(): void {
  for (const u of unsubscribers) { try { u(); } catch { /* noop */ } }
  unsubscribers.length = 0; isSubscribed = false; processedEventIds.clear();
}

export function isCommerceSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }
export function getBridgePublishedCount(): number { return publishedEvents.length; }
export function getPublishedEvents(): typeof publishedEvents { return publishedEvents.slice(); }

/**
 * Produces a commerce-owned event on the Game Engine event bus.
 * Consumers (Inventory, Progression, Competitive, Social, etc.) subscribe
 * and react. This module NEVER calls them directly.
 */
export function publishCommerceEvent(type: CommerceEventType, actorId: string | null, payload: Record<string, unknown>): void {
  publishedEvents.push({ type, actorId, payload, timestamp: new Date().toISOString() });
  emitEvent("commerce", "StateTransition" as GameEventType, actorId, { commerceEventType: type, ...payload });
  log.info("bridge.publish", { type, actorId });
}

export function _resetBridgeForTesting(): void {
  unsubscribeCommerce();
  processedEventIds.clear();
  publishedEvents.length = 0;
}
