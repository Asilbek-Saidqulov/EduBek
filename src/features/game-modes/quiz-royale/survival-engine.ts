/**
 * Systems 1-5: Rules, Lives, Shields, Elimination, Survival Progression.
 * Reuses Game Engine Resource Pipeline + Event Bus. No engine duplication.
 *
 * Resource categories:
 *   Lives  → registered as `category: "survival"`
 *   Shield → registered as `category: "survival"`
 *   (Both still flow through the generic Resource Pipeline; the category is
 *    metadata-only — see engine types.ts ResourceCategory docs.)
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { registerResource, processResourceAction, getResourceBalance, emitEvent, getMatch } from "@/features/game-engine";
import type { DeathReason } from "@/features/game-engine";
import type { RoyaleRules, LifeEvent, PlayerLifeState, PlayerShieldState, EliminationRecord, SurvivalState } from "./types";

const log = getLogger("quiz-royale");

// ===========================================================================
// System 1 — Rules
// ===========================================================================

export const ROYALE_RULES: RoyaleRules = {
  gameMode: "quiz_royale", minPlayers: 2, maxPlayers: 100,
  allowSpectators: true, allowLateJoin: false, reconnectPolicy: "limited",
  roundCount: 10, questionsPerRound: 1, timePerQuestionMs: 20_000,
  startingLives: 3, maxLives: 5,
  shieldMaxCount: 2, shieldCooldownMs: 15_000, shieldExpirationMs: null,
  revivalEnabled: true, revivalCost: 2,
  eliminationThreshold: 0, overtimeEnabled: true, overtimeMs: 10_000,
  reconnectGraceMs: 15_000, tieResolution: "sudden_death",
  hostControls: ["pause", "resume", "freeze", "revive_player", "grant_life", "remove_life", "grant_shield", "remove_shield", "skip", "reveal", "hide", "emergency_stop", "end_match"],
  organizationRestricted: false,
};

export function getRules(): RoyaleRules { return { ...ROYALE_RULES }; }

export const BALANCE_PRESETS: Array<{ name: string; rules: Partial<RoyaleRules> }> = [
  { name: "Casual", rules: { startingLives: 5, maxLives: 7, timePerQuestionMs: 30_000, shieldMaxCount: 3 } },
  { name: "Standard", rules: { ...ROYALE_RULES } },
  { name: "Hardcore", rules: { startingLives: 1, maxLives: 3, timePerQuestionMs: 15_000, shieldMaxCount: 1, revivalEnabled: false } },
  { name: "Marathon", rules: { startingLives: 3, maxLives: 5, roundCount: 20, timePerQuestionMs: 20_000 } },
];

// ===========================================================================
// System 2 — Lives System (reuses engine Resource Pipeline)
// ===========================================================================

const lifeStates = new Map<string, PlayerLifeState>();

export function initLives(matchId: string, userId: string): PlayerLifeState {
  const key = `${matchId}:${userId}`;
  // Lives is a SURVIVAL RESOURCE — registered with `category: "survival"`.
  // Internally still flows through the generic engine Resource Pipeline.
  registerResource({ resourceType: "lives", displayName: "Lives", initialValue: 0, maxValue: ROYALE_RULES.maxLives, minValue: 0, category: "survival" });
  processResourceAction({ matchId, userId, resourceType: "lives", action: "earned", amount: ROYALE_RULES.startingLives });
  const state: PlayerLifeState = {
    userId, matchId, lives: ROYALE_RULES.startingLives, maxLives: ROYALE_RULES.maxLives,
    isEliminated: false, eliminatedAt: null, deathReason: null, history: [],
  };
  lifeStates.set(key, state);
  emitEvent(matchId, "ResourceChanged", userId, { resourceType: "lives", action: "init", lives: ROYALE_RULES.startingLives, category: "survival" });
  return state;
}

export function getLifeState(matchId: string, userId: string): PlayerLifeState | null {
  return lifeStates.get(`${matchId}:${userId}`) ?? null;
}

export function getLives(matchId: string, userId: string): number {
  return getResourceBalance(matchId, userId, "lives");
}

/**
 * Lose one life. The `reason` is the structured DeathReason from the engine
 * taxonomy. If the loss brings the player to 0 lives, the player is marked
 * eliminated and `state.deathReason` is set to `reason`.
 */
export function loseLife(matchId: string, userId: string, reason: DeathReason, freeTextReason?: string): PlayerLifeState | null {
  const key = `${matchId}:${userId}`;
  const state = lifeStates.get(key);
  if (!state || state.isEliminated) return state ?? null;
  const before = state.lives;
  processResourceAction({ matchId, userId, resourceType: "lives", action: "spent", amount: 1 });
  state.lives = getLives(matchId, userId);
  const event: LifeEvent = { id: randomUUID(), matchId, userId, action: "lose", livesBefore: before, livesAfter: state.lives, reason: freeTextReason ?? reason, timestamp: new Date().toISOString() };
  state.history.push(event);
  emitEvent(matchId, "ScoreUpdated", userId, { action: "lose_life", lives: state.lives, deathReason: reason, reason: freeTextReason ?? reason });
  if (state.lives <= ROYALE_RULES.eliminationThreshold) {
    state.isEliminated = true;
    state.eliminatedAt = new Date().toISOString();
    state.deathReason = reason;
    const deathEvent: LifeEvent = { ...event, id: randomUUID(), action: "elimination", livesAfter: 0 };
    state.history.push(deathEvent);
    emitEvent(matchId, "PlayerLeft", userId, { reason: "eliminated", deathReason: reason, lives: 0 });
  }
  lifeStates.set(key, state);
  return state;
}

export function restoreLife(matchId: string, userId: string, reason: string): PlayerLifeState | null {
  const key = `${matchId}:${userId}`;
  const state = lifeStates.get(key);
  if (!state || state.lives >= state.maxLives) return state ?? null;
  const before = state.lives;
  processResourceAction({ matchId, userId, resourceType: "lives", action: "earned", amount: 1 });
  state.lives = Math.min(state.maxLives, getLives(matchId, userId));
  const event: LifeEvent = { id: randomUUID(), matchId, userId, action: "restore", livesBefore: before, livesAfter: state.lives, reason, timestamp: new Date().toISOString() };
  state.history.push(event);
  emitEvent(matchId, "ScoreUpdated", userId, { action: "restore_life", lives: state.lives });
  lifeStates.set(key, state);
  return state;
}

export function grantLife(matchId: string, userId: string): PlayerLifeState | null {
  return restoreLife(matchId, userId, "teacher_grant");
}

export function revivePlayer(matchId: string, userId: string): PlayerLifeState | null {
  const key = `${matchId}:${userId}`;
  const state = lifeStates.get(key);
  if (!state || !state.isEliminated) return state ?? null;
  if (!ROYALE_RULES.revivalEnabled) return state;
  state.isEliminated = false;
  state.eliminatedAt = null;
  state.deathReason = null;
  processResourceAction({ matchId, userId, resourceType: "lives", action: "earned", amount: ROYALE_RULES.revivalCost });
  state.lives = Math.min(state.maxLives, getLives(matchId, userId));
  const event: LifeEvent = { id: randomUUID(), matchId, userId, action: "revive", livesBefore: 0, livesAfter: state.lives, reason: "revival", timestamp: new Date().toISOString() };
  state.history.push(event);
  emitEvent(matchId, "PlayerReconnected", userId, { reason: "revived", lives: state.lives });
  lifeStates.set(key, state);
  return state;
}

// ===========================================================================
// System 3 — Shield System
// ===========================================================================

const shieldStates = new Map<string, PlayerShieldState>();

export function initShields(matchId: string, userId: string): PlayerShieldState {
  // Shields are a SURVIVAL RESOURCE — conceptually paired with Lives.
  // Registered with `category: "survival"` for taxonomy + dashboards.
  // Internally still flows through the generic engine Resource Pipeline.
  registerResource({ resourceType: "shield", displayName: "Shield", initialValue: 0, maxValue: ROYALE_RULES.shieldMaxCount, minValue: 0, category: "survival" });
  const state: PlayerShieldState = { userId, matchId, shields: 0, maxShields: ROYALE_RULES.shieldMaxCount, cooldownUntil: null, expirationAt: ROYALE_RULES.shieldExpirationMs ? new Date(Date.now() + ROYALE_RULES.shieldExpirationMs).toISOString() : null, lastUsedAt: null };
  shieldStates.set(`${matchId}:${userId}`, state);
  return state;
}

export function getShieldState(matchId: string, userId: string): PlayerShieldState | null {
  return shieldStates.get(`${matchId}:${userId}`) ?? null;
}

export function earnShield(matchId: string, userId: string): PlayerShieldState | null {
  const key = `${matchId}:${userId}`;
  const state = shieldStates.get(key);
  if (!state || state.shields >= state.maxShields) return state ?? null;
  state.shields++;
  // Mirror into engine Resource Pipeline so dashboards/analytics see a unified flow.
  processResourceAction({ matchId, userId, resourceType: "shield", action: "earned", amount: 1 });
  emitEvent(matchId, "ResourceChanged", userId, { resourceType: "shield", action: "earned", shields: state.shields, category: "survival" });
  shieldStates.set(key, state);
  return state;
}

export function consumeShield(matchId: string, userId: string): { consumed: boolean; state: PlayerShieldState | null } {
  const key = `${matchId}:${userId}`;
  const state = shieldStates.get(key);
  if (!state || state.shields <= 0) return { consumed: false, state };
  if (state.cooldownUntil && new Date(state.cooldownUntil) > new Date()) return { consumed: false, state };
  state.shields--;
  state.lastUsedAt = new Date().toISOString();
  state.cooldownUntil = new Date(Date.now() + ROYALE_RULES.shieldCooldownMs).toISOString();
  processResourceAction({ matchId, userId, resourceType: "shield", action: "spent", amount: 1 });
  emitEvent(matchId, "ResourceChanged", userId, { resourceType: "shield", action: "spent", shields: state.shields, category: "survival" });
  shieldStates.set(key, state);
  return { consumed: true, state };
}

export function grantShield(matchId: string, userId: string): PlayerShieldState | null {
  const key = `${matchId}:${userId}`;
  const state = shieldStates.get(key) ?? initShields(matchId, userId);
  const before = state.shields;
  state.shields = Math.min(state.maxShields, state.shields + 1);
  const gained = state.shields - before;
  if (gained > 0) processResourceAction({ matchId, userId, resourceType: "shield", action: "earned", amount: gained });
  emitEvent(matchId, "ResourceChanged", userId, { resourceType: "shield", action: "teacher_grant", shields: state.shields, category: "survival" });
  shieldStates.set(key, state);
  return state;
}

// ===========================================================================
// System 4 — Elimination Engine
// ===========================================================================

/**
 * Eliminate a player with a structured DeathReason. The death reason is
 * propagated to the player's life state and to the EliminationRecord, where
 * it becomes queryable for analytics, replay annotations, tournament
 * dispute resolution, anti-cheat differentiation, and moderation review.
 */
export function eliminatePlayer(matchId: string, userId: string, deathReason: DeathReason, freeTextReason?: string): EliminationRecord | null {
  const state = loseLife(matchId, userId, deathReason, freeTextReason);
  if (!state || !state.isEliminated) return null;
  const m = getMatch(matchId);
  const survivors = m?.players.filter(p => !getLifeState(matchId, p.userId)?.isEliminated).length ?? 0;
  return { userId, matchId, eliminatedAt: state.eliminatedAt!, deathReason, reason: freeTextReason ?? deathReason, rank: survivors + 1, livesRemaining: 0 };
}

/** Convenience wrapper for timeout-driven elimination. */
export function checkTimeoutElimination(matchId: string, userId: string): EliminationRecord | null {
  return eliminatePlayer(matchId, userId, "timeout");
}

/** Convenience wrappers for the other DeathReasons. These make call sites
 *  self-documenting and prevent ad-hoc string coupling. */
export function eliminateForWrongAnswer(matchId: string, userId: string): EliminationRecord | null {
  return eliminatePlayer(matchId, userId, "wrong_answer");
}
export function eliminateForDisconnect(matchId: string, userId: string): EliminationRecord | null {
  return eliminatePlayer(matchId, userId, "disconnected");
}
export function eliminateForAfk(matchId: string, userId: string): EliminationRecord | null {
  return eliminatePlayer(matchId, userId, "afk");
}
export function eliminateForTeacherRemoved(matchId: string, userId: string, note?: string): EliminationRecord | null {
  return eliminatePlayer(matchId, userId, "teacher_removed", note);
}
export function eliminateForManualAction(matchId: string, userId: string, note?: string): EliminationRecord | null {
  return eliminatePlayer(matchId, userId, "manual_elimination", note);
}
export function eliminateForRuleViolation(matchId: string, userId: string, note?: string): EliminationRecord | null {
  return eliminatePlayer(matchId, userId, "rule_violation", note);
}
export function eliminateForReconnectExpired(matchId: string, userId: string): EliminationRecord | null {
  return eliminatePlayer(matchId, userId, "reconnect_expired");
}

export function checkFinalSurvivor(matchId: string): string | null {
  const sv = getSurvivalState(matchId);
  if (sv) {
    const alive = sv.currentSurvivors.filter(id => { const ls = getLifeState(matchId, id); return ls && !ls.isEliminated; });
    return alive.length === 1 ? alive[0] : null;
  }
  // Fallback to match players
  const m = getMatch(matchId);
  if (!m) return null;
  const survivors = m.players.filter(p => {
    const ls = getLifeState(matchId, p.userId);
    return ls && !ls.isEliminated;
  });
  return survivors.length === 1 ? survivors[0].userId : null;
}

// ===========================================================================
// System 5 — Survival Progression
// ===========================================================================

const survivalStates = new Map<string, SurvivalState>();

export function initSurvivalState(matchId: string, playerIds?: string[]): SurvivalState {
  const m = getMatch(matchId);
  const survivors = playerIds ?? m?.players.map(p => p.userId) ?? [];
  const state: SurvivalState = {
    matchId, currentSurvivors: survivors,
    eliminatedPlayers: [], eliminationOrder: [], longestSurvivalMs: 0,
    shieldUsageCount: 0, comebackCount: 0, dangerStates: [],
  };
  survivalStates.set(matchId, state);
  return state;
}

export function getSurvivalState(matchId: string): SurvivalState | null {
  return survivalStates.get(matchId) ?? null;
}

export function recordElimination(matchId: string, record: EliminationRecord): void {
  const state = survivalStates.get(matchId);
  if (!state) return;
  state.eliminatedPlayers.push(record);
  state.eliminationOrder.push(record.userId);
  state.currentSurvivors = state.currentSurvivors.filter(id => id !== record.userId);
  survivalStates.set(matchId, state);
}

export function recordShieldUsage(matchId: string): void {
  const state = survivalStates.get(matchId);
  if (state) { state.shieldUsageCount++; survivalStates.set(matchId, state); }
}

export function recordComeback(matchId: string): void {
  const state = survivalStates.get(matchId);
  if (state) { state.comebackCount++; survivalStates.set(matchId, state); }
}

export function checkDangerState(matchId: string, userId: string): boolean {
  const state = getLifeState(matchId, userId);
  return state !== null && state.lives === 1 && !state.isEliminated;
}
