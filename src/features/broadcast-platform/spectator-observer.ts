/** Systems 1, 2 — Spectator Platform + Observer Platform. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeSpectator, getSpectators, storeObserver, getObservers } from "./repository";
import type { Spectator, SpectatorRole, LatencyMode, SpectatorPermissions, ObserverSlot, ObserverPriority } from "./types";

const log = getLogger("broadcast.spectator");

// ===== System 1 — Spectator Platform =====
export const DEFAULT_PERMISSIONS: Record<SpectatorRole, SpectatorPermissions> = {
  teacher: { canChat: true, canReact: true, canSeeReplay: true, canSeeStats: true, canFollowPlayer: true, canUseFreeCamera: true },
  parent: { canChat: false, canReact: true, canSeeReplay: true, canSeeStats: true, canFollowPlayer: true, canUseFreeCamera: false },
  guest: { canChat: false, canReact: true, canSeeReplay: false, canSeeStats: true, canFollowPlayer: true, canUseFreeCamera: false },
  tournament_viewer: { canChat: true, canReact: true, canSeeReplay: true, canSeeStats: true, canFollowPlayer: true, canUseFreeCamera: true },
  organization_viewer: { canChat: true, canReact: true, canSeeReplay: true, canSeeStats: true, canFollowPlayer: true, canUseFreeCamera: false },
  anonymous: { canChat: false, canReact: false, canSeeReplay: false, canSeeStats: false, canFollowPlayer: false, canUseFreeCamera: false },
};

export function joinAsSpectator(input: { userId: string; role: SpectatorRole; matchId: string; latencyMode?: LatencyMode }): Spectator {
  const spectator: Spectator = {
    id: randomUUID(), userId: input.userId, role: input.role, matchId: input.matchId,
    joinedAt: new Date().toISOString(), leftAt: null, followingPlayerId: null,
    freeCamera: false, syncEnabled: true, latencyMode: input.latencyMode ?? "normal",
    permissions: DEFAULT_PERMISSIONS[input.role],
  };
  storeSpectator(spectator);
  log.info("spectator.joined", { userId: input.userId, matchId: input.matchId, role: input.role });
  return spectator;
}

export function leaveSpectator(matchId: string, spectatorId: string): Spectator | null {
  const list = getSpectators(matchId);
  const s = list.find(x => x.id === spectatorId);
  if (!s || s.leftAt) return null;
  s.leftAt = new Date().toISOString();
  storeSpectator(s);
  return s;
}

export function followPlayer(matchId: string, spectatorId: string, playerId: string): Spectator | null {
  const list = getSpectators(matchId);
  const s = list.find(x => x.id === spectatorId);
  if (!s || !s.permissions.canFollowPlayer) return null;
  s.followingPlayerId = playerId;
  storeSpectator(s);
  return s;
}

export function setFreeCamera(matchId: string, spectatorId: string, enabled: boolean): Spectator | null {
  const list = getSpectators(matchId);
  const s = list.find(x => x.id === spectatorId);
  if (!s || !s.permissions.canUseFreeCamera) return null;
  s.freeCamera = enabled;
  storeSpectator(s);
  return s;
}

export function setLatencyMode(matchId: string, spectatorId: string, mode: LatencyMode): Spectator | null {
  const list = getSpectators(matchId);
  const s = list.find(x => x.id === spectatorId);
  if (!s) return null;
  s.latencyMode = mode;
  storeSpectator(s);
  return s;
}

export function setSyncEnabled(matchId: string, spectatorId: string, enabled: boolean): Spectator | null {
  const list = getSpectators(matchId);
  const s = list.find(x => x.id === spectatorId);
  if (!s) return null;
  s.syncEnabled = enabled;
  storeSpectator(s);
  return s;
}

export function getMatchSpectators(matchId: string): Spectator[] { return getSpectators(matchId).filter(s => !s.leftAt); }
export function getActiveSpectatorCount(matchId: string): number { return getMatchSpectators(matchId).length; }
export function getSpectatorById(matchId: string, spectatorId: string): Spectator | null { return getSpectators(matchId).find(s => s.id === spectatorId) ?? null; }

// ===== System 2 — Observer Platform =====
export function assignObserver(input: { observerId: string; priority: ObserverPriority; matchId: string; cameraId?: string | null }): ObserverSlot {
  const slot: ObserverSlot = {
    id: randomUUID(), observerId: input.observerId, priority: input.priority,
    cameraId: input.cameraId ?? null, synced: true, matchId: input.matchId,
    assignedAt: new Date().toISOString(),
  };
  storeObserver(slot);
  log.info("observer.assigned", { observerId: input.observerId, matchId: input.matchId, priority: input.priority });
  return slot;
}

export function getMatchObservers(matchId: string): ObserverSlot[] { return getObservers(matchId); }
export function syncObserver(matchId: string, observerId: string): ObserverSlot | null {
  const list = getObservers(matchId);
  const o = list.find(x => x.observerId === observerId);
  if (!o) return null;
  o.synced = true;
  storeObserver(o);
  return o;
}
export function assignCameraToObserver(matchId: string, observerId: string, cameraId: string): ObserverSlot | null {
  const list = getObservers(matchId);
  const o = list.find(x => x.observerId === observerId);
  if (!o) return null;
  o.cameraId = cameraId;
  storeObserver(o);
  return o;
}
export function removeObserver(matchId: string, observerId: string): boolean {
  const list = getObservers(matchId);
  const idx = list.findIndex(x => x.observerId === observerId);
  if (idx < 0) return false;
  list.splice(idx, 1);
  return true;
}
