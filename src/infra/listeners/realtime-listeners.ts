/**
 * EduBek — Live Quiz realtime listeners.
 *
 * Subscribes to Live Quiz Engine domain events and broadcasts them to
 * the corresponding Socket.IO rooms. The listener is registered lazily
 * by the event bus on the first publish (see register.ts).
 *
 * Why a listener (and not direct broadcast calls inside the service)?
 * The service should not know about Socket.IO — it publishes events,
 * and the listener translates them to socket broadcasts. This keeps
 * the service testable in isolation and lets us swap transports (e.g.
 * add a webhook notifier) without touching the service.
 */
import { eventBus } from "@/infra/event-bus";
import {
  ANSWER_SUBMITTED,
  HOST_MIGRATED,
  LEADERBOARD_UPDATED,
  LIVE_SESSION_CANCELLED,
  LIVE_SESSION_FINISHED,
  LIVE_SESSION_PAUSED,
  LIVE_SESSION_RESUMED,
  LIVE_SESSION_STARTED,
  PLAYER_ELIMINATED,
  PLAYER_JOINED,
  PLAYER_LEFT,
  PLAYER_RECONNECTED,
  ROUND_FINISHED,
  ROUND_STARTED,
} from "@/infra/event-bus/events";
import { broadcastToLobby, broadcastToSession, broadcastLeaderboard } from "@/infra/realtime";
import { getLogger } from "@/lib/logger";

const log = getLogger("realtime-listeners");

export function registerRealtimeListeners(): void {
  // Lobby events
  eventBus.subscribe(PLAYER_JOINED, (event: any) => {
    broadcastToLobby(event.sessionId, "lobby:player_joined", {
      playerId: event.playerId,
      displayName: event.displayName,
    });
  });
  eventBus.subscribe(PLAYER_LEFT, (event: any) => {
    broadcastToLobby(event.sessionId, "lobby:player_left", {
      playerId: event.playerId,
    });
  });
  eventBus.subscribe(PLAYER_RECONNECTED, (event: any) => {
    broadcastToSession(event.sessionId, "session:player_reconnected", {
      playerId: event.playerId,
    });
  });

  // Session lifecycle
  eventBus.subscribe(LIVE_SESSION_STARTED, (event: any) => {
    broadcastToSession(event.sessionId, "session:started", {
      sessionId: event.sessionId,
      playerCount: event.playerCount,
    });
  });
  eventBus.subscribe(LIVE_SESSION_PAUSED, (event: any) => {
    broadcastToSession(event.sessionId, "session:paused", {});
  });
  eventBus.subscribe(LIVE_SESSION_RESUMED, (event: any) => {
    broadcastToSession(event.sessionId, "session:resumed", {});
  });
  eventBus.subscribe(LIVE_SESSION_FINISHED, (event: any) => {
    broadcastToSession(event.sessionId, "session:finished", {
      finalLeaderboard: {}, // The client fetches the full leaderboard via REST
    });
  });
  eventBus.subscribe(LIVE_SESSION_CANCELLED, (event: any) => {
    broadcastToSession(event.sessionId, "session:cancelled", { reason: event.reason });
  });
  eventBus.subscribe(HOST_MIGRATED, (event: any) => {
    broadcastToSession(event.sessionId, "session:host_migrated", { newHostId: event.newHostId });
  });

  // Round events
  eventBus.subscribe(ROUND_STARTED, (event: any) => {
    broadcastToSession(event.sessionId, "round:started", {
      roundId: event.roundId,
      roundNumber: event.roundNumber,
      questionId: event.questionId,
      questionSnapshot: null, // The client fetches the question via REST
      durationMs: event.durationMs,
      answerLockAt: new Date(Date.now() + event.durationMs).toISOString(),
    });
  });
  eventBus.subscribe(ROUND_FINISHED, (event: any) => {
    broadcastToSession(event.sessionId, "round:finished", {
      roundId: event.roundId,
      roundNumber: event.roundNumber,
      results: {},
    });
  });
  eventBus.subscribe(ANSWER_SUBMITTED, (event: any) => {
    broadcastToSession(event.sessionId, "round:answer_received", {
      playerId: event.playerId,
      responseMs: event.responseMs,
    });
  });
  eventBus.subscribe(PLAYER_ELIMINATED, (event: any) => {
    broadcastToSession(event.sessionId, "session:player_eliminated", {
      playerId: event.playerId,
      roundNumber: event.roundNumber,
    });
  });

  // Leaderboard
  eventBus.subscribe(LEADERBOARD_UPDATED, (event: any) => {
    // The actual leaderboard entries are fetched via REST; we just send the
    // signal that an update happened. The client can then call
    // GET /api/live/sessions/[id]/leaderboard to get the latest snapshot.
    broadcastLeaderboard(event.sessionId, event.roundNumber, []);
  });

  log.debug("realtime.listeners_registered");
}
