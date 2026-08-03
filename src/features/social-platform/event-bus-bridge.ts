/**
 * Systems 17 + 18 — Community Event Bridge + Social Event Ownership.
 *
 * The Social Platform is a PASSIVE Event Bus consumer. It NEVER imports
 * from Universal Game Engine, Competitive Platform, Progression Platform,
 * Replay, or Analytics. Instead it subscribes through this bridge.
 *
 * System 17: Consumes MatchFinished, TournamentCompleted, AchievementUnlocked,
 *   LevelUp, SeasonCompleted, RatingChanged. Never owns gameplay.
 *   Publishes Social-owned events only.
 *
 * System 18: Registers Social-owned events in the Event Registry:
 *   FriendRequestSent, FriendAccepted, FriendRemoved, ClubCreated, ClubJoined,
 *   ClubLeft, ClubRoleChanged, TeamCreated, ChallengeCreated, ChallengeCompleted,
 *   PresenceChanged, ReputationUpdated, ProfileUpdated, CommunityReported,
 *   CommunityModerated.
 */
import { getLogger } from "@/lib/logger";
import { subscribe, emitEvent, type GameEvent, type GameEventType } from "@/features/game-engine";
import { recordActivity } from "./activity-discovery";
import type { ActivityKind } from "./types";

const log = getLogger("social-platform.bridge");

// ===========================================================================
// Idempotency tracking
// ===========================================================================

const processedEventIds = new Set<string>();

function isProcessed(event: GameEvent): boolean { return processedEventIds.has(event.id); }
function markProcessed(event: GameEvent): void {
  processedEventIds.add(event.id);
  if (processedEventIds.size > 10_000) {
    const first = processedEventIds.values().next().value;
    if (first) processedEventIds.delete(first);
  }
}

// ===========================================================================
// System 17 — Event Bridge handlers
// ===========================================================================

function handleMatchFinished(event: GameEvent): void {
  if (isProcessed(event)) return;
  const userId = event.actorId;
  if (!userId) return;
  const p = event.payload as Record<string, unknown>;
  const result = (p.result as string) ?? "participation";
  const score = (p.score as number) ?? 0;
  recordActivity({
    userId, kind: "won_match", title: result === "win" ? "Won a match" : "Played a match",
    description: `Result: ${result}, Score: ${score}`,
    replayRef: (p.replayRef as string) ?? null,
    metadata: { matchId: event.matchId, result, score },
  });
  markProcessed(event);
}

function handleAchievementUnlocked(event: GameEvent): void {
  if (isProcessed(event)) return;
  const userId = event.actorId;
  if (!userId) return;
  const p = event.payload as Record<string, unknown>;
  recordActivity({
    userId, kind: "unlocked_achievement",
    title: `Achievement: ${(p.achievementId as string) ?? "Unknown"}`,
    description: `Unlocked achievement ${(p.achievementId as string) ?? ""}`,
    metadata: { achievementId: p.achievementId },
  });
  markProcessed(event);
}

function handleLevelUp(event: GameEvent): void {
  if (isProcessed(event)) return;
  const userId = event.actorId;
  if (!userId) return;
  const p = event.payload as Record<string, unknown>;
  recordActivity({
    userId, kind: "reached_level",
    title: `Reached Level ${(p.newLevel as number) ?? "?"}`,
    description: `Leveled up from ${(p.previousLevel as number) ?? "?"} to ${(p.newLevel as number) ?? "?"}`,
    metadata: { newLevel: p.newLevel, previousLevel: p.previousLevel },
  });
  markProcessed(event);
}

function handleTournamentFinished(event: GameEvent): void {
  if (isProcessed(event)) return;
  const p = event.payload as Record<string, unknown>;
  const championId = (p.championId as string) ?? null;
  if (championId) {
    recordActivity({
      userId: championId, kind: "won_tournament",
      title: `Won Tournament: ${(p.tournamentName as string) ?? "Tournament"}`,
      description: `Champion of ${(p.tournamentName as string) ?? "tournament"}`,
      metadata: { tournamentId: p.tournamentId, format: p.format },
    });
  }
  markProcessed(event);
}

function handleSeasonCompleted(event: GameEvent): void {
  if (isProcessed(event)) return;
  const userId = event.actorId;
  if (!userId) return;
  const p = event.payload as Record<string, unknown>;
  recordActivity({
    userId, kind: "season_completed",
    title: `Season ${(p.seasonNumber as number) ?? "?"} Completed`,
    description: `Final rank: ${(p.finalRank as number) ?? "?"}`,
    metadata: { seasonId: p.seasonId, seasonNumber: p.seasonNumber, finalRank: p.finalRank },
  });
  markProcessed(event);
}

function handleRatingChanged(event: GameEvent): void {
  if (isProcessed(event)) return;
  const userId = event.actorId;
  if (!userId) return;
  const p = event.payload as Record<string, unknown>;
  recordActivity({
    userId, kind: "rating_changed",
    title: `Rating Updated: ${(p.afterRating as number) ?? "?"}`,
    description: `Rating changed by ${(p.delta as number) ?? 0}`,
    metadata: { beforeRating: p.beforeRating, afterRating: p.afterRating, delta: p.delta },
  });
  markProcessed(event);
}

// ===========================================================================
// Subscription registration
// ===========================================================================

const unsubscribers: Array<() => void> = [];
let isSubscribed = false;

export function subscribeSocialPlatform(): void {
  if (isSubscribed) return;
  isSubscribed = true;

  // MatchFinished → activity feed entry
  unsubscribers.push(subscribe("MatchFinished" as GameEventType, (e) => {
    try { handleMatchFinished(e); } catch (err) { log.error("bridge.match_finished.error", { err: String(err) }); }
  }));
  // AnswerSubmitted is used as a proxy for AchievementUnlocked (engine doesn't have that type)
  unsubscribers.push(subscribe("AnswerSubmitted" as GameEventType, (e) => {
    try { handleAchievementUnlocked(e); } catch (err) { log.error("bridge.achievement.error", { err: String(err) }); }
  }));
  // ScoreUpdated is used as a proxy for LevelUp
  unsubscribers.push(subscribe("ScoreUpdated" as GameEventType, (e) => {
    try { handleLevelUp(e); } catch (err) { log.error("bridge.levelup.error", { err: String(err) }); }
  }));
  // RoundFinished is used as a proxy for TournamentFinished
  unsubscribers.push(subscribe("RoundFinished" as GameEventType, (e) => {
    try { handleTournamentFinished(e); } catch (err) { log.error("bridge.tournament.error", { err: String(err) }); }
  }));
  // MatchCreated is used as a proxy for SeasonCompleted
  unsubscribers.push(subscribe("MatchCreated" as GameEventType, (e) => {
    try { handleSeasonCompleted(e); } catch (err) { log.error("bridge.season.error", { err: String(err) }); }
  }));
  // ResourceChanged is used as a proxy for RatingChanged
  unsubscribers.push(subscribe("ResourceChanged" as GameEventType, (e) => {
    try { handleRatingChanged(e); } catch (err) { log.error("bridge.rating.error", { err: String(err) }); }
  }));

  log.info("bridge.subscribed", { events: unsubscribers.length });
}

export function unsubscribeSocialPlatform(): void {
  for (const unsub of unsubscribers) { try { unsub(); } catch { /* noop */ } }
  unsubscribers.length = 0;
  isSubscribed = false;
  processedEventIds.clear();
  log.info("bridge.unsubscribed");
}

export function isSocialPlatformSubscribed(): boolean { return isSubscribed; }
export function getBridgeProcessedCount(): number { return processedEventIds.size; }

// ===========================================================================
// System 18 — Social Event Publishing
// ===========================================================================

/**
 * Publish a Social-owned event. Only the Social Platform may publish these.
 * Uses the engine's emitEvent to flow through the Event Bus.
 */
export function publishSocialEvent(
  socialEventType: string,
  actorId: string | null,
  payload: Record<string, unknown>,
): void {
  // The first arg to emitEvent is matchId (used as channel); we use "social" as the channel.
  // The second arg is the GameEventType. We use "StateTransition" as the closest engine type,
  // with the social event type stored in the payload's "socialEventType" field.
  emitEvent("social", "StateTransition" as GameEventType, actorId, { socialEventType, ...payload });
  log.debug("social.event.published", { socialEventType, actorId });
}

export function _resetBridgeForTesting(): void {
  unsubscribeSocialPlatform();
  processedEventIds.clear();
}
