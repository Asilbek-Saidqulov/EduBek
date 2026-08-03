/** Systems 11, 12, 13, 14, 15, 17, 18 — Tournament Production, Audience, Commentary, Analytics, Dashboard, Developer. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeTournamentProduction, getTournamentProduction, storeReaction, getReactions, storeCommentary, getCommentary, getObservers, getSpectators, getReplayQueue, getHighlights, getOverlays, getCameras, getBroadcast, getStageState } from "./repository";
import { getMatchSpectators } from "./spectator-observer";
import type { TournamentProduction, ProductionStage, AudienceReaction, ReactionType, CommentaryData, BroadcastAnalytics, ProductionDashboard, BroadcastDeveloperIntegration, BroadcastState } from "./types";
import { getNextStage } from "./broadcast-production";

const log = getLogger("broadcast.dashboard");

// ===== System 11 — Tournament Production =====
export function createTournamentProduction(input: { tournamentId: string; currentStage?: ProductionStage }): TournamentProduction {
  const tp: TournamentProduction = {
    id: randomUUID(), tournamentId: input.tournamentId,
    currentStage: input.currentStage ?? "intro",
    matchSchedule: [], bracketPresentation: false, awardsCeremony: false,
  };
  storeTournamentProduction(tp);
  return tp;
}
export function getTournamentProductionById(tournamentId: string): TournamentProduction | null { return getTournamentProduction(tournamentId); }
export function addScheduledMatch(tournamentId: string, matchId: string, scheduledTime: string): TournamentProduction | null {
  const tp = getTournamentProduction(tournamentId);
  if (!tp) return null;
  tp.matchSchedule.push({ matchId, scheduledTime, status: "scheduled" });
  return tp;
}
export function setMatchOnDeck(tournamentId: string, matchId: string): TournamentProduction | null {
  const tp = getTournamentProduction(tournamentId);
  if (!tp) return null;
  const m = tp.matchSchedule.find(x => x.matchId === matchId);
  if (m) m.status = "on_deck";
  return tp;
}
export function setMatchLive(tournamentId: string, matchId: string): TournamentProduction | null {
  const tp = getTournamentProduction(tournamentId);
  if (!tp) return null;
  const m = tp.matchSchedule.find(x => x.matchId === matchId);
  if (m) m.status = "live";
  return tp;
}
export function setMatchCompleted(tournamentId: string, matchId: string): TournamentProduction | null {
  const tp = getTournamentProduction(tournamentId);
  if (!tp) return null;
  const m = tp.matchSchedule.find(x => x.matchId === matchId);
  if (m) m.status = "completed";
  return tp;
}
export function setBracketPresentation(tournamentId: string, enabled: boolean): TournamentProduction | null {
  const tp = getTournamentProduction(tournamentId);
  if (!tp) return null;
  tp.bracketPresentation = enabled;
  return tp;
}
export function setAwardsCeremony(tournamentId: string, enabled: boolean): TournamentProduction | null {
  const tp = getTournamentProduction(tournamentId);
  if (!tp) return null;
  tp.awardsCeremony = enabled;
  return tp;
}

// ===== System 12 — Audience Experience =====
export function submitReaction(input: { matchId: string; userId: string; type: ReactionType; content: string }): AudienceReaction {
  const r: AudienceReaction = { id: randomUUID(), matchId: input.matchId, userId: input.userId, type: input.type, content: input.content, timestamp: new Date().toISOString() };
  storeReaction(r);
  return r;
}
export function getMatchReactions(matchId: string): AudienceReaction[] { return getReactions(matchId); }
export function getReactionsByType(matchId: string, type: ReactionType): AudienceReaction[] { return getReactions(matchId).filter(r => r.type === type); }
export function getReactionCount(matchId: string): number { return getReactions(matchId).length; }

// ===== System 13 — Commentary Support =====
export function generateCommentary(matchId: string): CommentaryData {
  const existing = getCommentary(matchId);
  if (existing) return existing;
  const commentary: CommentaryData = {
    matchId, playerCards: [], talkingPoints: [], timeline: [], interestingFacts: [],
  };
  storeCommentary(commentary);
  return commentary;
}
export function addPlayerCard(matchId: string, userId: string, displayName: string, stats: Record<string, unknown>): CommentaryData | null {
  const c = getCommentary(matchId) ?? generateCommentary(matchId);
  c.playerCards.push({ userId, displayName, stats });
  storeCommentary(c);
  return c;
}
export function addTalkingPoint(matchId: string, point: string): CommentaryData | null {
  const c = getCommentary(matchId) ?? generateCommentary(matchId);
  c.talkingPoints.push(point);
  storeCommentary(c);
  return c;
}
export function addTimelineEntry(matchId: string, timestamp: string, event: string): CommentaryData | null {
  const c = getCommentary(matchId) ?? generateCommentary(matchId);
  c.timeline.push({ timestamp, event });
  storeCommentary(c);
  return c;
}
export function addInterestingFact(matchId: string, fact: string): CommentaryData | null {
  const c = getCommentary(matchId) ?? generateCommentary(matchId);
  c.interestingFacts.push(fact);
  storeCommentary(c);
  return c;
}
export function getCommentaryData(matchId: string): CommentaryData | null { return getCommentary(matchId); }

// ===== System 14 — Broadcast Analytics =====
export function generateBroadcastAnalytics(matchId: string): BroadcastAnalytics {
  return {
    matchId, viewers: getMatchSpectators(matchId).length, peakViewers: 0,
    watchTimeMs: 0, overlayUsage: {}, replayUsage: getReplayQueue(matchId).length,
    dropOffs: 0, avgLatencyMs: 0,
  };
}

// ===== System 15 — Production Dashboard =====
export function generateProductionDashboard(matchId: string): ProductionDashboard {
  const bc = getBroadcast(matchId);
  const ps = getStageState(matchId);
  const cameras = getCameras(matchId);
  const activeCamera = cameras.find(c => c.active);
  const replayQueue = getReplayQueue(matchId);
  const upcomingStage = getNextStage(matchId);
  const alerts: Array<{ id: string; severity: string; message: string }> = [];
  const state = bc?.state ?? "standby";
  if (state === "emergency_stop") alerts.push({ id: randomUUID(), severity: "critical", message: "Emergency stop active" });
  if (getMatchSpectators(matchId).length === 0 && state === "live") alerts.push({ id: randomUUID(), severity: "warning", message: "Live broadcast with no spectators" });
  return {
    matchId, broadcastState: state as BroadcastState,
    currentStage: ps?.currentStage ?? "intro",
    observerCount: getObservers(matchId).length,
    currentCamera: activeCamera?.mode ?? "auto_camera",
    streamingHealth: "healthy",
    replayQueueLength: replayQueue.length,
    upcomingStage, alerts,
  };
}

// ===== System 17 — Developer Integration =====
export function getDeveloperIntegration(): BroadcastDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/broadcast/status", method: "GET", description: "Broadcast status", authRequired: true },
      { path: "/api/broadcast/spectators", method: "GET", description: "Active spectators", authRequired: true },
      { path: "/api/broadcast/observers", method: "GET", description: "Observer slots", authRequired: true },
      { path: "/api/broadcast/production", method: "GET", description: "Production stage", authRequired: true },
      { path: "/api/broadcast/overlays", method: "GET", description: "Overlay state", authRequired: true },
      { path: "/api/broadcast/replay", method: "GET", description: "Replay queue", authRequired: true },
      { path: "/api/broadcast/highlights", method: "GET", description: "Match highlights", authRequired: true },
      { path: "/api/broadcast/dashboard", method: "GET", description: "Production dashboard", authRequired: true },
    ],
    eventContracts: ["BroadcastStarted", "BroadcastEnded", "HighlightPublished", "ObserverJoined", "ProductionStageChanged"],
    extensionHooks: [
      { id: "hook_broadcast_started", name: "On Broadcast Started", triggerEvent: "BroadcastStarted" },
      { id: "hook_highlight_published", name: "On Highlight Published", triggerEvent: "HighlightPublished" },
      { id: "hook_stage_changed", name: "On Production Stage Changed", triggerEvent: "ProductionStageChanged" },
    ],
    sdkMetadata: { version: "1.0.0", language: "TypeScript", docsUrl: "https://docs.edubek.dev/broadcast" },
  };
}
