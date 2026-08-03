/**
 * Competitive Platform — Event Bus Bridge.
 *
 * This module subscribes the Competitive Platform to the Universal Game
 * Engine Event Bus. It is the SOLE integration point between the engine
 * and the competitive platform.
 *
 * Architecture:
 *
 *                    Universal Game Engine
 *                             │
 *                      Engine Event Bus
 *                             │
 *       ┌──────────────┬──────────────┬──────────────┬──────────────┐
 *       │              │              │              │
 *       ▼              ▼              ▼              ▼
 *  Player          Competitive    Analytics     Hall of Fame
 *  Progression     Platform
 *
 * Ownership boundaries:
 *   - Competitive Platform owns: rating, division, league, matchmaking,
 *     queue, tournament (competitive-side), championship, fair play,
 *     leaderboard, season (competitive-side), olympiad, hall of fame.
 *   - Competitive Platform NEVER owns: XP, level, achievements, badges,
 *     titles, milestones, career stats, missions, rewards (progression-side).
 *   - Competitive Platform NEVER imports from player-progression.
 *   - Competitive Platform NEVER calls awardXP / grantReward / updateLevel /
 *     unlockAchievement or any progression API.
 *   - Competitive Platform NEVER modifies any game-mode state.
 *
 * Event-driven processing:
 *   - This bridge subscribes to engine GameEventType values.
 *   - When an event arrives, the bridge calls internal competitive APIs
 *     (applyRatingUpdate, getPromotionState, reportFairPlayFinding, etc.).
 *   - Each event is processed independently — order does not affect
 *     correctness because every handler is idempotent.
 *   - Duplicate events remain idempotent: applying the same rating update
 *     for the same matchId twice is a no-op.
 *
 * Integration rules (strict):
 *   - Universal Game Engine untouched — only consume `subscribe()` + `getEvents()`.
 *   - All 5 game modes untouched — they emit events via the engine; we listen.
 *   - No direct service-to-service calls.
 *   - No circular dependencies.
 */
import { getLogger } from "@/lib/logger";
import { subscribe, type GameEvent, type GameEventType } from "@/features/game-engine";
import {
  createCompetitiveProfile, applyRatingUpdate, getCompetitiveProfile,
  createMatchmakingTicket, getTicket,
} from "./rating-matchmaking";
import {
  reportFairPlayFinding, addHallOfFameEntry,
} from "./leaderboards-analytics";
import type { GameModeId, FairPlayViolationKind, FairPlaySeverity } from "./types";

const log = getLogger("competitive-platform.bridge");

// ===========================================================================
// Idempotency tracking — prevents duplicate rating updates for the same event
// ===========================================================================

const processedEventIds = new Set<string>();

function isProcessed(event: GameEvent): boolean {
  return processedEventIds.has(event.id);
}

function markProcessed(event: GameEvent): void {
  processedEventIds.add(event.id);
  if (processedEventIds.size > 10_000) {
    const first = processedEventIds.values().next().value;
    if (first) processedEventIds.delete(first);
  }
}

// ===========================================================================
// Event → Competitive mapping
// ===========================================================================

/**
 * Maps engine GameEventType values to competitive actions.
 * Each handler is IDEMPOTENT — calling it twice with the same event is a no-op.
 */

function handleMatchFinished(event: GameEvent): void {
  if (isProcessed(event)) return;
  const p = event.payload as Record<string, unknown>;
  const userId = event.actorId;
  if (!userId) return;
  const gameMode = (p.gameMode as GameModeId) ?? "classic_quiz";
  const result = (p.result as "win" | "loss" | "draw") ?? "participation";
  const opponentId = (p.opponentId as string) ?? null;
  const isRanked = (p.isRanked as boolean) ?? false;

  // Auto-create competitive profile if missing
  createCompetitiveProfile(userId, userId);

  // Apply rating update ONLY for ranked matches with a known opponent
  if (isRanked && opponentId && (result === "win" || result === "loss" || result === "draw")) {
    createCompetitiveProfile(opponentId, opponentId);
    applyRatingUpdate({
      userId,
      opponentId,
      gameMode,
      result,
    });
  }

  markProcessed(event);
  log.debug("bridge.match_finished", { userId, gameMode, result, isRanked, eventId: event.id });
}

function handlePlayerDisconnected(event: GameEvent): void {
  if (isProcessed(event)) return;
  const userId = event.actorId;
  if (!userId) return;
  // Detect potential disconnect abuse — produces a finding only, never bans
  const p = event.payload as Record<string, unknown>;
  const matchId = event.matchId;
  const wasRanked = (p.isRanked as boolean) ?? false;
  if (wasRanked) {
    reportFairPlayFinding({
      userId,
      kind: "disconnect_abuse" as FairPlayViolationKind,
      severity: "low" as FairPlaySeverity,
      description: `Player disconnected from ranked match ${matchId}`,
      evidence: `Event ${event.id}, match ${matchId}`,
    });
  }
  markProcessed(event);
  log.debug("bridge.player_disconnected", { userId, matchId, eventId: event.id });
}

function handlePlayerLeft(event: GameEvent): void {
  if (isProcessed(event)) return;
  // Player left could be a forfeit — detect potential intentional forfeit
  const p = event.payload as Record<string, unknown>;
  const userId = event.actorId;
  if (!userId) return;
  const reason = (p.reason as string) ?? "";
  if (reason === "forfeit" || reason === "rage_quit") {
    reportFairPlayFinding({
      userId,
      kind: "intentional_forfeit" as FairPlayViolationKind,
      severity: "medium" as FairPlaySeverity,
      description: `Player forfeited match ${event.matchId}`,
      evidence: `Reason: ${reason}, event ${event.id}`,
    });
  }
  markProcessed(event);
}

function handleTeacherOverride(event: GameEvent): void {
  if (isProcessed(event)) return;
  // Teacher overrides that affect competitive state (e.g., force_advance,
  // rating_adjustment) are recorded. The actual competitive mutation is
  // performed by the admin API directly — this bridge only records audit.
  const p = event.payload as Record<string, unknown>;
  const action = (p.action as string) ?? "";
  if (action === "rating_adjustment" || action === "force_advance") {
    log.info("bridge.teacher_override.competitive", { action, eventId: event.id });
  }
  markProcessed(event);
}

// ===========================================================================
// Subscription registration
// ===========================================================================

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

/**
 * Subscribe the Competitive Platform to the engine Event Bus.
 * Idempotent — calling this multiple times has no effect.
 *
 * This is the ONLY entry point for engine → competitive integration.
 * Once subscribed, the platform autonomously processes events.
 */
export function subscribeCompetitivePlatform(): void {
  if (isSubscribed) return;
  isSubscribed = true;

  // MatchFinished → apply rating update for ranked matches
  unsubscribers.push(subscribe("MatchFinished" as GameEventType, (event) => {
    try { handleMatchFinished(event); } catch (err) { log.error("bridge.match_finished.error", { err: String(err), eventId: event.id }); }
  }));

  // PlayerDisconnected → fair play finding (disconnect abuse)
  unsubscribers.push(subscribe("PlayerDisconnected" as GameEventType, (event) => {
    try { handlePlayerDisconnected(event); } catch (err) { log.error("bridge.player_disconnected.error", { err: String(err), eventId: event.id }); }
  }));

  // PlayerLeft → detect intentional forfeit
  unsubscribers.push(subscribe("PlayerLeft" as GameEventType, (event) => {
    try { handlePlayerLeft(event); } catch (err) { log.error("bridge.player_left.error", { err: String(err), eventId: event.id }); }
  }));

  // TeacherOverride → audit competitive-relevant overrides
  unsubscribers.push(subscribe("TeacherOverride" as GameEventType, (event) => {
    try { handleTeacherOverride(event); } catch (err) { log.error("bridge.teacher_override.error", { err: String(err), eventId: event.id }); }
  }));

  log.info("bridge.subscribed", { events: unsubscribers.length });
}

/**
 * Unsubscribe the Competitive Platform from the engine Event Bus.
 * Primarily for tests — production never calls this.
 */
export function unsubscribeCompetitivePlatform(): void {
  for (const unsub of unsubscribers) {
    try { unsub(); } catch { /* noop */ }
  }
  unsubscribers.length = 0;
  isSubscribed = false;
  processedEventIds.clear();
  log.info("bridge.unsubscribed");
}

/**
 * Returns whether the bridge is currently subscribed.
 */
export function isCompetitivePlatformSubscribed(): boolean {
  return isSubscribed;
}

/**
 * Returns the number of events processed (for diagnostics).
 */
export function getProcessedEventCount(): number {
  return processedEventIds.size;
}

// ===========================================================================
// Reset for testing
// ===========================================================================

export function _resetBridgeForTesting(): void {
  unsubscribeCompetitivePlatform();
  processedEventIds.clear();
}
