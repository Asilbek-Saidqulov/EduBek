/**
 * Player Progression — Event Bus Bridge.
 *
 * This module subscribes the Player Progression Platform to the Universal
 * Game Engine Event Bus. It is the SOLE integration point between the
 * engine and the progression platform.
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
 *       │
 *       ▼
 *  Player Profile
 *
 * Ownership boundaries:
 *   - Player Progression owns: XP, levels, achievements, badges, titles,
 *     milestones, career stats, seasons (progression-side), missions, rewards.
 *   - Player Progression NEVER owns: rating, division, league, matchmaking,
 *     tournaments (competitive-side), fair play.
 *   - Player Progression NEVER imports from competitive-platform.
 *   - Player Progression NEVER modifies any game-mode state.
 *   - Player Progression NEVER calls any competitive API.
 *
 * Event-driven processing:
 *   - This bridge subscribes to engine GameEventType values.
 *   - When an event arrives, the bridge calls internal progression APIs
 *     (awardXP, grantReward, recordMatchResult, updateMilestones, etc.).
 *   - Each event is processed independently — order does not affect
 *     correctness because every handler is idempotent.
 *   - Duplicate events remain idempotent: awarding XP for the same matchId
 *     twice is a no-op (the matchId is tracked in XP event metadata).
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
  awardXP, recordMatchResult, updateMilestones,
} from "./progression-engine";
import {
  checkAchievementConditions,
} from "./achievement-profile";
import {
  recordLevelUpTimeline, recordAchievementTimeline,
} from "./dashboard-analytics";
import type { GameModeId } from "./types";

const log = getLogger("player-progression.bridge");

// ===========================================================================
// Idempotency tracking — prevents duplicate XP for the same event
// ===========================================================================

/** Set of event IDs already processed by this bridge. */
const processedEventIds = new Set<string>();

/** Returns true if this event has already been processed. */
function isProcessed(event: GameEvent): boolean {
  return processedEventIds.has(event.id);
}

/** Marks an event as processed. */
function markProcessed(event: GameEvent): void {
  processedEventIds.add(event.id);
  // Cap memory usage at 10,000 entries (LRU-style eviction would be better
  // in production, but this is sufficient for in-memory testing).
  if (processedEventIds.size > 10_000) {
    const first = processedEventIds.values().next().value;
    if (first) processedEventIds.delete(first);
  }
}

// ===========================================================================
// Event → Progression mapping
// ===========================================================================

/**
 * Maps engine GameEventType values to progression actions.
 * Each handler is IDEMPOTENT — calling it twice with the same event is a no-op.
 */

function handleMatchFinished(event: GameEvent): void {
  if (isProcessed(event)) return;
  const p = event.payload as Record<string, unknown>;
  const userId = event.actorId;
  if (!userId) return;
  // Profile is auto-created by recordMatchResult if it doesn't exist.
  // We do NOT check for an existing profile here — that would skip
  // legitimate first-match events for new players.

  const gameMode = (p.gameMode as GameModeId) ?? "classic_quiz";
  const result = (p.result as "win" | "loss" | "draw" | "participation") ?? "participation";
  const score = (p.score as number) ?? 0;
  const questionsAnswered = (p.questionsAnswered as number) ?? 0;
  const questionsCorrect = (p.questionsCorrect as number) ?? 0;
  const durationMs = (p.durationMs as number) ?? 0;
  const isTournament = (p.isTournament as boolean) ?? false;
  const tournamentResult = (p.tournamentResult as "champion" | "runner_up" | "semifinal" | "bronze" | null) ?? null;

  // Record career stats — idempotent because recordMatchResult tracks by matchId in history
  recordMatchResult({
    userId,
    gameMode,
    result,
    score,
    questionsAnswered,
    questionsCorrect,
    durationMs,
    matchId: event.matchId,
    isTournament,
    tournamentResult,
    replayAvailable: (p.replayAvailable as boolean) ?? false,
  });

  // Award participation XP
  awardXP({
    userId,
    source: "participation",
    gameMode,
    matchId: event.matchId,
    metadata: { eventId: event.id },
  });

  // Award victory XP if the player won
  if (result === "win") {
    awardXP({
      userId,
      source: "victory",
      gameMode,
      matchId: event.matchId,
      metadata: { eventId: event.id },
    });
  }

  // Award question_correct XP
  if (questionsCorrect > 0) {
    awardXP({
      userId,
      source: "question_correct",
      amount: 10 * questionsCorrect, // base amount × correct count
      gameMode,
      matchId: event.matchId,
      metadata: { eventId: event.id, count: questionsCorrect },
    });
  }

  // Update milestones based on career stats
  updateMilestones(userId, {});

  markProcessed(event);
  log.debug("bridge.match_finished", { userId, gameMode, result, eventId: event.id });
}

function handleAnswerSubmitted(event: GameEvent): void {
  if (isProcessed(event)) return;
  const p = event.payload as Record<string, unknown>;
  const userId = event.actorId;
  if (!userId) return;
  const isCorrect = (p.isCorrect as boolean) ?? false;
  const gameMode = (p.gameMode as GameModeId) ?? null;

  if (isCorrect) {
    awardXP({
      userId,
      source: "question_correct",
      gameMode,
      matchId: event.matchId,
      metadata: { eventId: event.id },
    });
    markProcessed(event);
  }
}

function handlePlayerLeft(event: GameEvent): void {
  if (isProcessed(event)) return;
  // Player left — could be elimination, disconnect, or forfeit.
  // Player Progression only records participation; competitive handling
  // (rating adjustment) is done by the Competitive Platform independently.
  const userId = event.actorId;
  if (!userId) return;
  markProcessed(event);
  log.debug("bridge.player_left", { userId, eventId: event.id });
}

function handleTeacherOverride(event: GameEvent): void {
  if (isProcessed(event)) return;
  const p = event.payload as Record<string, unknown>;
  const action = (p.action as string) ?? "";
  // Teacher awards are mapped to XP via the "teacher_award" source
  if (action === "grant_life" || action === "grant_shield" || action === "revive_player") {
    const userId = (p.userId as string) ?? event.actorId;
    if (userId) {
      awardXP({
        userId,
        source: "teacher_award",
        matchId: event.matchId,
        metadata: { eventId: event.id, action },
      });
    }
  }
  markProcessed(event);
}

function handleScoreUpdated(event: GameEvent): void {
  if (isProcessed(event)) return;
  // Score updates contain streak + comeback info that can trigger XP bonuses
  const p = event.payload as Record<string, unknown>;
  const userId = event.actorId;
  if (!userId) return;
  const action = (p.action as string) ?? "";
  if (action === "comeback") {
    awardXP({
      userId,
      source: "comeback",
      matchId: event.matchId,
      metadata: { eventId: event.id },
    });
  }
  if (action === "streak_bonus") {
    awardXP({
      userId,
      source: "streak_bonus",
      matchId: event.matchId,
      metadata: { eventId: event.id, streak: p.streak },
    });
  }
  markProcessed(event);
}

// ===========================================================================
// Subscription registration
// ===========================================================================

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

/**
 * Subscribe the Player Progression Platform to the engine Event Bus.
 * Idempotent — calling this multiple times has no effect.
 *
 * This is the ONLY entry point for engine → progression integration.
 * Once subscribed, the platform autonomously processes events.
 */
export function subscribePlayerProgression(): void {
  if (isSubscribed) return;
  isSubscribed = true;

  // MatchFinished → record career stats + award XP
  unsubscribers.push(subscribe("MatchFinished" as GameEventType, (event) => {
    try { handleMatchFinished(event); } catch (err) { log.error("bridge.match_finished.error", { err: String(err), eventId: event.id }); }
  }));

  // AnswerSubmitted → award question_correct XP
  unsubscribers.push(subscribe("AnswerSubmitted" as GameEventType, (event) => {
    try { handleAnswerSubmitted(event); } catch (err) { log.error("bridge.answer_submitted.error", { err: String(err), eventId: event.id }); }
  }));

  // PlayerLeft → mark participation
  unsubscribers.push(subscribe("PlayerLeft" as GameEventType, (event) => {
    try { handlePlayerLeft(event); } catch (err) { log.error("bridge.player_left.error", { err: String(err), eventId: event.id }); }
  }));

  // TeacherOverride → teacher awards
  unsubscribers.push(subscribe("TeacherOverride" as GameEventType, (event) => {
    try { handleTeacherOverride(event); } catch (err) { log.error("bridge.teacher_override.error", { err: String(err), eventId: event.id }); }
  }));

  // ScoreUpdated → comeback + streak bonuses
  unsubscribers.push(subscribe("ScoreUpdated" as GameEventType, (event) => {
    try { handleScoreUpdated(event); } catch (err) { log.error("bridge.score_updated.error", { err: String(err), eventId: event.id }); }
  }));

  log.info("bridge.subscribed", { events: unsubscribers.length });
}

/**
 * Unsubscribe the Player Progression Platform from the engine Event Bus.
 * Primarily for tests — production never calls this.
 */
export function unsubscribePlayerProgression(): void {
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
export function isPlayerProgressionSubscribed(): boolean {
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
  unsubscribePlayerProgression();
  processedEventIds.clear();
}
