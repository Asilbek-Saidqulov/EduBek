/** Systems 3 + 7 — Presence Platform + Community Reputation. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storePresence, getPresence, getAllPresences,
  storeReputation, getReputation, getAllReputations,
} from "./repository";
import type {
  Presence, PresenceStatus, RichPresence,
  ReputationScore, ReputationCategory, ReputationEvent,
} from "./types";

const log = getLogger("social-platform.presence");

// ===== System 3 — Presence Platform =====

export function setPresence(userId: string, status: PresenceStatus, rich?: RichPresence | null): Presence {
  const existing = getPresence(userId);
  const now = new Date().toISOString();
  const presence: Presence = {
    userId, status, richPresence: rich ?? existing?.richPresence ?? null,
    lastSeen: status === "offline" ? now : existing?.lastSeen ?? now,
    sessionRef: existing?.sessionRef ?? null, updatedAt: now,
  };
  storePresence(presence);
  return presence;
}

export function getPresenceForUser(userId: string): Presence | null { return getPresence(userId); }

export function getOnlineUsers(): Presence[] {
  return getAllPresences().filter(p => p.status !== "offline" && p.status !== "invisible");
}

export function getPresenceByStatus(status: PresenceStatus): Presence[] {
  return getAllPresences().filter(p => p.status === status);
}

export function setRichPresence(userId: string, rich: RichPresence): Presence | null {
  const p = getPresence(userId);
  if (!p) return null;
  p.richPresence = rich;
  p.updatedAt = new Date().toISOString();
  storePresence(p);
  return p;
}

export function goOffline(userId: string): Presence | null {
  return setPresence(userId, "offline");
}

export function isOnline(userId: string): boolean {
  const p = getPresence(userId);
  return p !== null && p.status !== "offline" && p.status !== "invisible";
}

export function getPresenceCount(): { online: number; offline: number; away: number; busy: number; playing: number } {
  const all = getAllPresences();
  return {
    online: all.filter(p => p.status === "online").length,
    offline: all.filter(p => p.status === "offline").length,
    away: all.filter(p => p.status === "away").length,
    busy: all.filter(p => p.status === "busy").length,
    playing: all.filter(p => p.status === "playing" || p.status === "in_match").length,
  };
}

// ===== System 7 — Community Reputation =====

const DEFAULT_CATEGORIES: ReputationCategory[] = [
  "sportsmanship", "mentor", "teacher_recognition", "helpful", "community_contributor", "fair_play",
];

export function initReputation(userId: string): ReputationScore {
  const existing = getReputation(userId);
  if (existing) return existing;
  const scores = {} as Record<ReputationCategory, number>;
  for (const cat of DEFAULT_CATEGORIES) scores[cat] = 0;
  const rep: ReputationScore = {
    userId, scores, totalScore: 0, reports: 0, warnings: 0,
    history: [], updatedAt: new Date().toISOString(),
  };
  storeReputation(rep);
  return rep;
}

export function getReputationForUser(userId: string): ReputationScore | null { return getReputation(userId); }
export function listAllReputations(): ReputationScore[] { return getAllReputations(); }

export function awardReputation(userId: string, category: ReputationCategory, delta: number, reason: string, awardedBy?: string | null): ReputationScore | null {
  const rep = getReputation(userId) ?? initReputation(userId);
  rep.scores[category] = Math.max(0, rep.scores[category] + delta);
  rep.totalScore = Object.values(rep.scores).reduce((s, v) => s + v, 0);
  const event: ReputationEvent = {
    id: randomUUID(), category, delta, reason,
    awardedBy: awardedBy ?? null, timestamp: new Date().toISOString(),
  };
  rep.history.push(event);
  rep.updatedAt = event.timestamp;
  storeReputation(rep);
  log.info("reputation.awarded", { userId, category, delta });
  return rep;
}

export function addReport(userId: string): ReputationScore | null {
  const rep = getReputation(userId) ?? initReputation(userId);
  rep.reports++;
  rep.updatedAt = new Date().toISOString();
  storeReputation(rep);
  return rep;
}

export function addWarning(userId: string, reason: string): ReputationScore | null {
  const rep = getReputation(userId) ?? initReputation(userId);
  rep.warnings++;
  rep.scores.fair_play = Math.max(0, rep.scores.fair_play - 5);
  rep.totalScore = Object.values(rep.scores).reduce((s, v) => s + v, 0);
  rep.history.push({
    id: randomUUID(), category: "fair_play", delta: -5, reason: `Warning: ${reason}`,
    awardedBy: null, timestamp: new Date().toISOString(),
  });
  rep.updatedAt = new Date().toISOString();
  storeReputation(rep);
  return rep;
}

export function applyDecay(userId: string, decayAmount: number = 1): ReputationScore | null {
  const rep = getReputation(userId);
  if (!rep) return null;
  for (const cat of DEFAULT_CATEGORIES) {
    rep.scores[cat] = Math.max(0, rep.scores[cat] - decayAmount);
  }
  rep.totalScore = Object.values(rep.scores).reduce((s, v) => s + v, 0);
  rep.updatedAt = new Date().toISOString();
  storeReputation(rep);
  return rep;
}

export function getTopReputableUsers(limit: number = 10): Array<{ userId: string; totalScore: number }> {
  return getAllReputations()
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit)
    .map(r => ({ userId: r.userId, totalScore: r.totalScore }));
}

export function getReputationByCategory(userId: string, category: ReputationCategory): number {
  return getReputation(userId)?.scores[category] ?? 0;
}
