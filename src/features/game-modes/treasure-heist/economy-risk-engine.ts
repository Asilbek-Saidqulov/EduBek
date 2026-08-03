/**
 * Systems 1-5: Treasure Rules, Gold Economy, Risk Decision Engine,
 * Protection System, Random Event Engine.
 * Reuses Game Engine Resource Pipeline + Event Bus. No engine duplication.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { registerResource, processResourceAction, getResourceBalance, emitEvent, getMatch } from "@/features/game-engine";
import type { TreasureHeistRules, EconomyAction, EconomyTransaction, RiskDecision, DecisionResult, DecisionWindow, ProtectionState, RandomEvent, RandomEventKind, RandomEventInstance } from "./types";

const log = getLogger("treasure-heist");

// ===========================================================================
// System 1 — Treasure Rules
// ===========================================================================

export const TREASURE_HEIST_RULES: TreasureHeistRules = {
  gameMode: "treasure_heist",
  minPlayers: 2, maxPlayers: 500,
  allowSpectators: true, allowLateJoin: true,
  reconnectPolicy: "allow",
  roundCount: 3, questionsPerRound: 5,
  timePerQuestionMs: 30_000,
  startingGold: 100, questionReward: 50,
  investSuccessProbability: 0.5, stealSuccessProbability: 0.5,
  stealAmount: 30, stealPenalty: 20,
  investMultiplier: 2,
  decisionTimeoutMs: 15_000,
  protectionShieldDurationMs: 30_000,
  protectionCooldownMs: 60_000, maxStealsPerMatch: 10,
  minimumBalanceProtection: 0, newPlayerProtectionRounds: 1,
  hostControls: ["pause", "resume", "skip", "freeze_decisions", "enable_events", "disable_events", "inject_event", "protect_player", "give_bonus", "deduct_gold", "reset_economy", "reveal_economy", "hide_economy", "end_match", "emergency_stop"],
  organizationRestricted: false,
  tieBreaker: "most_gold",
};

export function getRules(): TreasureHeistRules { return { ...TREASURE_HEIST_RULES }; }
export function validateRules(rules: Partial<TreasureHeistRules>): string[] {
  const errors: string[] = [];
  if (rules.minPlayers !== undefined && rules.minPlayers < 2) errors.push("minPlayers must be >= 2");
  if (rules.maxPlayers !== undefined && rules.maxPlayers > 500) errors.push("maxPlayers must be <= 500");
  if (rules.investSuccessProbability !== undefined && (rules.investSuccessProbability < 0 || rules.investSuccessProbability > 1)) errors.push("investSuccessProbability must be 0..1");
  if (rules.stealSuccessProbability !== undefined && (rules.stealSuccessProbability < 0 || rules.stealSuccessProbability > 1)) errors.push("stealSuccessProbability must be 0..1");
  if (rules.startingGold !== undefined && rules.startingGold < 0) errors.push("startingGold must be >= 0");
  return errors;
}

// ===========================================================================
// System 2 — Gold Economy (reuses Game Engine Resource Pipeline)
// ===========================================================================

export function initEconomy(matchId: string, userId: string): void {
  // Gold is an ECONOMY RESOURCE — registered with `category: "economy"`.
  // Internally still flows through the generic engine Resource Pipeline.
  // The category is metadata-only — see engine types.ts ResourceCategory.
  registerResource({ resourceType: "gold", displayName: "Gold", initialValue: TREASURE_HEIST_RULES.startingGold, maxValue: null, minValue: TREASURE_HEIST_RULES.minimumBalanceProtection, category: "economy" });
  // Set initial balance by earning starting gold
  processResourceAction({ matchId, userId, resourceType: "gold", action: "earned", amount: TREASURE_HEIST_RULES.startingGold });
  // Reset to starting gold (in case of re-init)
  const current = getResourceBalance(matchId, userId, "gold");
  if (current > TREASURE_HEIST_RULES.startingGold) {
    processResourceAction({ matchId, userId, resourceType: "gold", action: "spent", amount: current - TREASURE_HEIST_RULES.startingGold });
  }
}

export function executeEconomyAction(input: {
  matchId: string; userId: string; action: EconomyAction;
  amount: number; targetUserId?: string | null; reason?: string;
}): EconomyTransaction {
  const { matchId, userId, action, amount, targetUserId = null, reason = "" } = input;
  let engineAction: "earned" | "spent" | "transferred" | "lost";
  switch (action) {
    case "earn": case "bonus": case "recovery": case "invest_win": case "steal":
      engineAction = "earned"; break;
    case "spend": case "penalty": case "invest_loss":
      engineAction = "spent"; break;
    default:
      engineAction = "earned";
  }
  processResourceAction({ matchId, userId, resourceType: "gold", action: engineAction, amount });
  if (action === "steal" && targetUserId) {
    // Target loses gold
    processResourceAction({ matchId, userId: targetUserId, resourceType: "gold", action: "lost", amount });
  }
  const balance = getResourceBalance(matchId, userId, "gold");
  const tx: EconomyTransaction = {
    id: randomUUID(), matchId, userId, action, amount, balance,
    targetUserId, reason, timestamp: new Date().toISOString(),
  };
  emitEvent(matchId, "ResourceChanged", userId, { resourceType: "gold", action, amount, balance, targetUserId, reason });
  log.debug("economy.action", { action, userId, amount, balance });
  return tx;
}

export function getGoldBalance(matchId: string, userId: string): number {
  return getResourceBalance(matchId, userId, "gold");
}

// In-memory transaction history (complements engine resource history)
const transactionHistory = new Map<string, EconomyTransaction[]>();

export function recordTransaction(tx: EconomyTransaction): void {
  const list = transactionHistory.get(tx.matchId) ?? [];
  list.push(tx);
  transactionHistory.set(tx.matchId, list);
}

export function getTransactionHistory(matchId: string, userId?: string): EconomyTransaction[] {
  const list = transactionHistory.get(matchId) ?? [];
  return userId ? list.filter(t => t.userId === userId || t.targetUserId === userId) : list;
}

// ===========================================================================
// System 3 — Risk Decision Engine
// ===========================================================================

// Deterministic PRNG for reproducibility (seeded by matchId + questionIndex)
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  return Math.abs(Math.sin(hash)) % 1;
}

export function executeDecision(input: {
  matchId: string; userId: string; decision: RiskDecision;
  reward: number; targetUserId?: string | null;
  questionIndex: number; protection?: ProtectionState | null;
}): DecisionResult {
  const { matchId, userId, decision, reward, targetUserId = null, questionIndex, protection = null } = input;
  const seed = `${matchId}:${userId}:${questionIndex}:${decision}`;

  switch (decision) {
    case "save": {
      const tx = executeEconomyAction({ matchId, userId, action: "earn", amount: reward, reason: "correct_answer_saved" });
      recordTransaction(tx);
      emitEvent(matchId, "ScoreUpdated", userId, { decision: "save", gold: reward, balance: tx.balance });
      return { decision: "save", success: true, amount: reward, newBalance: tx.balance, targetUserId: null, message: `Saved ${reward} gold` };
    }
    case "invest": {
      const roll = seededRandom(seed);
      const success = roll < TREASURE_HEIST_RULES.investSuccessProbability;
      if (success) {
        const gained = reward * TREASURE_HEIST_RULES.investMultiplier;
        const tx = executeEconomyAction({ matchId, userId, action: "invest_win", amount: gained, reason: "investment_success" });
        recordTransaction(tx);
        emitEvent(matchId, "ScoreUpdated", userId, { decision: "invest", success: true, gold: gained, balance: tx.balance });
        return { decision: "invest", success: true, amount: gained, newBalance: tx.balance, targetUserId: null, message: `Investment succeeded! Gained ${gained} gold` };
      } else {
        const tx = executeEconomyAction({ matchId, userId, action: "invest_loss", amount: reward, reason: "investment_failed" });
        recordTransaction(tx);
        emitEvent(matchId, "ScoreUpdated", userId, { decision: "invest", success: false, goldLost: reward, balance: tx.balance });
        return { decision: "invest", success: false, amount: -reward, newBalance: tx.balance, targetUserId: null, message: `Investment failed! Lost ${reward} gold` };
      }
    }
    case "steal": {
      // Check protection
      if (protection?.shieldActive) {
        return { decision: "steal", success: false, amount: 0, newBalance: getGoldBalance(matchId, userId), targetUserId, message: "Target has active shield!" };
      }
      // Check steal limits
      if (protection && protection.stealsRemaining <= 0) {
        return { decision: "steal", success: false, amount: 0, newBalance: getGoldBalance(matchId, userId), targetUserId, message: "No steals remaining!" };
      }
      const roll = seededRandom(seed);
      const success = roll < TREASURE_HEIST_RULES.stealSuccessProbability;
      const stealAmount = Math.min(TREASURE_HEIST_RULES.stealAmount, targetUserId ? getGoldBalance(matchId, targetUserId) : 0);
      if (success && stealAmount > 0) {
        const tx = executeEconomyAction({ matchId, userId, action: "steal", amount: stealAmount, targetUserId, reason: "steal_success" });
        recordTransaction(tx);
        emitEvent(matchId, "ScoreUpdated", userId, { decision: "steal", success: true, gold: stealAmount, balance: tx.balance, target: targetUserId });
        return { decision: "steal", success: true, amount: stealAmount, newBalance: tx.balance, targetUserId, message: `Stole ${stealAmount} gold from target!` };
      } else {
        const penaltyTx = executeEconomyAction({ matchId, userId, action: "penalty", amount: TREASURE_HEIST_RULES.stealPenalty, reason: "steal_failed_penalty" });
        recordTransaction(penaltyTx);
        emitEvent(matchId, "ScoreUpdated", userId, { decision: "steal", success: false, penalty: TREASURE_HEIST_RULES.stealPenalty, balance: penaltyTx.balance });
        return { decision: "steal", success: false, amount: -TREASURE_HEIST_RULES.stealPenalty, newBalance: penaltyTx.balance, targetUserId, message: `Steal failed! Penalty: ${TREASURE_HEIST_RULES.stealPenalty} gold` };
      }
    }
  }
}

export function openDecisionWindow(input: { matchId: string; userId: string; questionIndex: number; reward: number }): DecisionWindow {
  const now = new Date();
  return {
    matchId: input.matchId, userId: input.userId, questionIndex: input.questionIndex,
    reward: input.reward, openedAt: now.toISOString(),
    closesAt: new Date(now.getTime() + TREASURE_HEIST_RULES.decisionTimeoutMs).toISOString(),
    decided: false, decision: null,
  };
}

export function closeDecisionWindow(window: DecisionWindow, decision: RiskDecision | null): DecisionWindow {
  window.decided = decision !== null;
  window.decision = decision;
  return window;
}

// ===========================================================================
// System 4 — Protection System
// ===========================================================================

const protectionStates = new Map<string, ProtectionState>();

export function getProtection(matchId: string, userId: string): ProtectionState {
  const key = `${matchId}:${userId}`;
  return protectionStates.get(key) ?? {
    userId, shieldActive: false, shieldExpiresAt: null,
    stealsRemaining: TREASURE_HEIST_RULES.maxStealsPerMatch,
    cooldownUntil: null, lastStealAt: null, protectedByTeacher: false,
  };
}

export function activateShield(matchId: string, userId: string): ProtectionState {
  const key = `${matchId}:${userId}`;
  const p = getProtection(matchId, userId);
  p.shieldActive = true;
  p.shieldExpiresAt = new Date(Date.now() + TREASURE_HEIST_RULES.protectionShieldDurationMs).toISOString();
  protectionStates.set(key, p);
  emitEvent(matchId, "ResourceChanged", userId, { protection: "shield_activated", expiresAt: p.shieldExpiresAt });
  return p;
}

export function checkShieldExpiry(matchId: string, userId: string): ProtectionState {
  const key = `${matchId}:${userId}`;
  const p = getProtection(matchId, userId);
  if (p.shieldActive && p.shieldExpiresAt && new Date(p.shieldExpiresAt) < new Date()) {
    p.shieldActive = false; p.shieldExpiresAt = null;
    protectionStates.set(key, p);
  }
  return p;
}

export function consumeSteal(matchId: string, userId: string): ProtectionState {
  const key = `${matchId}:${userId}`;
  const p = getProtection(matchId, userId);
  p.stealsRemaining = Math.max(0, p.stealsRemaining - 1);
  p.lastStealAt = new Date().toISOString();
  p.cooldownUntil = new Date(Date.now() + TREASURE_HEIST_RULES.protectionCooldownMs).toISOString();
  protectionStates.set(key, p);
  return p;
}

export function teacherProtect(matchId: string, userId: string): ProtectionState {
  const key = `${matchId}:${userId}`;
  const p = getProtection(matchId, userId);
  p.shieldActive = true; p.shieldExpiresAt = null; p.protectedByTeacher = true;
  protectionStates.set(key, p);
  return p;
}

// ===========================================================================
// System 5 — Random Event Engine
// ===========================================================================

const EVENT_DEFINITIONS: Record<RandomEventKind, RandomEvent> = {
  golden_chest: { id: "golden_chest", kind: "golden_chest", name: "Golden Chest", description: "A golden chest appears! Open it for bonus gold.", conditions: {}, effects: { goldBonus: 50 }, durationMs: 0, visibility: "public", priority: 10, active: false },
  treasure_map: { id: "treasure_map", kind: "treasure_map", name: "Treasure Map", description: "Follow the map to find hidden treasure.", conditions: {}, effects: { goldBonus: 100 }, durationMs: 0, visibility: "private", priority: 8, active: false },
  lucky_coin: { id: "lucky_coin", kind: "lucky_coin", name: "Lucky Coin", description: "A lucky coin boosts your next investment.", conditions: {}, effects: { investMultiplierBonus: 1 }, durationMs: 30000, visibility: "private", priority: 5, active: false },
  bandits: { id: "bandits", kind: "bandits", name: "Bandits", description: "Bandits attack! Lose gold.", conditions: {}, effects: { goldLoss: 30 }, durationMs: 0, visibility: "public", priority: 9, active: false },
  storm: { id: "storm", kind: "storm", name: "Storm", description: "A storm prevents all steals.", conditions: {}, effects: { blockSteals: true }, durationMs: 20000, visibility: "public", priority: 7, active: false },
  trap: { id: "trap", kind: "trap", name: "Trap", description: "A trap was set! Your next steal will fail.", conditions: {}, effects: { stealFailNext: true }, durationMs: 15000, visibility: "private", priority: 6, active: false },
  secret_vault: { id: "secret_vault", kind: "secret_vault", name: "Secret Vault", description: "A secret vault opens for the leader.", conditions: { isLeader: true }, effects: { goldBonus: 75 }, durationMs: 0, visibility: "private", priority: 8, active: false },
  tax_collector: { id: "tax_collector", kind: "tax_collector", name: "Tax Collector", description: "The tax collector takes 10% of everyone's gold.", conditions: {}, effects: { taxPercent: 10 }, durationMs: 0, visibility: "public", priority: 9, active: false },
  merchant: { id: "merchant", kind: "merchant", name: "Merchant", description: "A merchant offers a shield for gold.", conditions: {}, effects: { offerShield: true, cost: 25 }, durationMs: 15000, visibility: "public", priority: 4, active: false },
  treasure_hunter: { id: "treasure_hunter", kind: "treasure_hunter", name: "Treasure Hunter", description: "A treasure hunter joins — steals from the richest.", conditions: {}, effects: { stealFromRichest: 40 }, durationMs: 0, visibility: "public", priority: 7, active: false },
};

const activeEvents = new Map<string, RandomEventInstance[]>();

export function getEventDefinitions(): RandomEvent[] { return Object.values(EVENT_DEFINITIONS); }

export function triggerEvent(matchId: string, kind: RandomEventKind, targetUserId: string | null = null): RandomEventInstance {
  const event = { ...EVENT_DEFINITIONS[kind], active: true };
  const instance: RandomEventInstance = {
    event, targetUserId,
    triggeredAt: new Date().toISOString(),
    expiresAt: event.durationMs > 0 ? new Date(Date.now() + event.durationMs).toISOString() : null,
  };
  const list = activeEvents.get(matchId) ?? [];
  list.push(instance);
  activeEvents.set(matchId, list);
  emitEvent(matchId, "ResourceChanged", targetUserId, { event: kind, name: event.name, effects: event.effects });
  // Apply immediate effects
  if (targetUserId) {
    if (event.effects.goldBonus) executeEconomyAction({ matchId, userId: targetUserId, action: "bonus", amount: event.effects.goldBonus as number, reason: `event:${kind}` });
    if (event.effects.goldLoss) executeEconomyAction({ matchId, userId: targetUserId, action: "penalty", amount: event.effects.goldLoss as number, reason: `event:${kind}` });
    if (event.effects.offerShield) activateShield(matchId, targetUserId);
  }
  log.info("event.triggered", { kind, matchId, target: targetUserId });
  return instance;
}

export function getActiveEvents(matchId: string): RandomEventInstance[] {
  const list = activeEvents.get(matchId) ?? [];
  const now = new Date();
  return list.filter(e => !e.expiresAt || new Date(e.expiresAt) > now);
}

export function cleanupExpiredEvents(matchId: string): void {
  const list = activeEvents.get(matchId) ?? [];
  const now = new Date();
  const filtered = list.filter(e => !e.expiresAt || new Date(e.expiresAt) > now);
  activeEvents.set(matchId, filtered);
}
