/** Systems 8, 9, 10 — Replay Broadcasting + Highlight Engine + Streaming Integration. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeReplayItem, getReplayQueue, storeReplayState, getReplayState, storeHighlight, getHighlights, storeStream, getStreams } from "./repository";
import type { ReplayQueueItem, ReplayBroadcastState, Highlight, HighlightType, StreamIntegration, StreamingPlatform } from "./types";

const log = getLogger("broadcast.replay");

// ===== System 8 — Replay Broadcasting =====
export function addToReplayQueue(input: { matchId: string; replayId: string; title: string; duration?: number }): ReplayQueueItem {
  const item: ReplayQueueItem = {
    id: randomUUID(), matchId: input.matchId, replayId: input.replayId,
    title: input.title, addedAt: new Date().toISOString(), playedAt: null,
    bookmarked: false, slowMotion: false, duration: input.duration ?? 5000,
  };
  storeReplayItem(item);
  log.info("replay.queued", { matchId: input.matchId, replayId: input.replayId });
  return item;
}

export function getReplayQueueForMatch(matchId: string): ReplayQueueItem[] { return getReplayQueue(matchId); }
export function getPendingReplays(matchId: string): ReplayQueueItem[] { return getReplayQueue(matchId).filter(r => !r.playedAt); }
export function markReplayPlayed(matchId: string, replayId: string): ReplayQueueItem | null {
  const list = getReplayQueue(matchId);
  const item = list.find(r => r.replayId === replayId);
  if (!item) return null;
  item.playedAt = new Date().toISOString();
  return item;
}
export function bookmarkReplay(matchId: string, itemId: string): ReplayQueueItem | null {
  const list = getReplayQueue(matchId);
  const item = list.find(r => r.id === itemId);
  if (!item) return null;
  item.bookmarked = true;
  return item;
}
export function setSlowMotion(matchId: string, itemId: string, enabled: boolean): ReplayQueueItem | null {
  const list = getReplayQueue(matchId);
  const item = list.find(r => r.id === itemId);
  if (!item) return null;
  item.slowMotion = enabled;
  return item;
}

export function startReplayPlayback(itemId: string): ReplayBroadcastState {
  const state: ReplayBroadcastState = { currentItemId: itemId, isPlaying: true, position: 0, speed: 1 };
  storeReplayState(state);
  return state;
}
export function pauseReplayPlayback(itemId: string): ReplayBroadcastState | null {
  const state = getReplayState(itemId);
  if (!state) return null;
  state.isPlaying = false;
  storeReplayState(state);
  return state;
}
export function seekReplay(itemId: string, position: number): ReplayBroadcastState | null {
  const state = getReplayState(itemId);
  if (!state) return null;
  state.position = Math.max(0, position);
  storeReplayState(state);
  return state;
}
export function setReplaySpeed(itemId: string, speed: number): ReplayBroadcastState | null {
  const state = getReplayState(itemId);
  if (!state) return null;
  state.speed = Math.max(0.25, Math.min(4, speed));
  storeReplayState(state);
  return state;
}
export function getReplayPlaybackState(itemId: string): ReplayBroadcastState | null { return getReplayState(itemId); }

// ===== System 9 — Highlight Engine =====
export function createHighlight(input: { matchId: string; type: HighlightType; title: string; description: string; durationMs?: number; playerIds?: string[] }): Highlight {
  const h: Highlight = {
    id: randomUUID(), matchId: input.matchId, type: input.type,
    title: input.title, description: input.description,
    timestamp: new Date().toISOString(), durationMs: input.durationMs ?? 5000,
    playerIds: input.playerIds ?? [], bookmarked: false,
  };
  storeHighlight(h);
  log.info("highlight.created", { matchId: input.matchId, type: input.type });
  return h;
}

export function getMatchHighlights(matchId: string): Highlight[] { return getHighlights(matchId); }
export function getBookmarkedHighlights(matchId: string): Highlight[] { return getHighlights(matchId).filter(h => h.bookmarked); }
export function bookmarkHighlight(matchId: string, highlightId: string): Highlight | null {
  const list = getHighlights(matchId);
  const h = list.find(x => x.id === highlightId);
  if (!h) return null;
  h.bookmarked = true;
  return h;
}
export function getHighlightsByType(matchId: string, type: HighlightType): Highlight[] { return getHighlights(matchId).filter(h => h.type === type); }
export function supportsAllHighlightTypes(): HighlightType[] { return ["winner", "perfect_streak", "big_comeback", "final_duel", "championship", "world_record"]; }

// ===== System 10 — Streaming Integration =====
export function registerStream(input: { platform: StreamingPlatform; config?: Record<string, unknown>; streamKey?: string | null; matchId?: string | null }): StreamIntegration {
  const s: StreamIntegration = {
    id: randomUUID(), platform: input.platform, config: input.config ?? {},
    active: false, streamKey: input.streamKey ?? null, connectedAt: null, matchId: input.matchId ?? null,
  };
  storeStream(s);
  return s;
}

export function getMatchStreams(matchId: string): StreamIntegration[] { return getStreams(matchId); }
export function connectStream(streamId: string, matchId: string): StreamIntegration | null {
  const list = getStreams(matchId);
  const s = list.find(x => x.id === streamId);
  if (!s) return null;
  s.active = true; s.connectedAt = new Date().toISOString();
  return s;
}
export function disconnectStream(streamId: string, matchId: string): StreamIntegration | null {
  const list = getStreams(matchId);
  const s = list.find(x => x.id === streamId);
  if (!s) return null;
  s.active = false; s.connectedAt = null;
  return s;
}
export function supportsAllStreamingPlatforms(): StreamingPlatform[] { return ["obs", "rtmp", "ndi", "virtual_camera", "browser_source", "websocket_overlay"]; }
