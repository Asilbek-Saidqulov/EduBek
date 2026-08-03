/** Systems 3, 4 — Broadcast Controller + Production Stage Manager. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeBroadcast, getBroadcast, storeStageState, getStageState } from "./repository";
import type { BroadcastController, BroadcastState, BroadcastStateChange, ProductionStageState, ProductionStage, StageTransition } from "./types";

const log = getLogger("broadcast.production");

// ===== System 3 — Broadcast Controller =====
export function initBroadcast(matchId: string): BroadcastController {
  const existing = getBroadcast(matchId);
  if (existing) return existing;
  const bc: BroadcastController = { id: randomUUID(), matchId, state: "standby", startedAt: null, endedAt: null, stateHistory: [] };
  storeBroadcast(bc);
  return bc;
}

const VALID_BC_TRANSITIONS: Record<BroadcastState, BroadcastState[]> = {
  standby: ["countdown", "live", "emergency_stop"],
  countdown: ["live", "standby", "emergency_stop"],
  live: ["paused", "commercial_break", "ended", "emergency_stop"],
  paused: ["live", "ended", "emergency_stop"],
  commercial_break: ["live", "ended", "emergency_stop"],
  ended: [],
  emergency_stop: ["standby", "ended"],
};

export function transitionBroadcast(matchId: string, toState: BroadcastState, performedBy: string, reason: string): BroadcastController | null {
  const bc = getBroadcast(matchId);
  if (!bc) return null;
  if (!VALID_BC_TRANSITIONS[bc.state]?.includes(toState)) return null;
  const now = new Date().toISOString();
  const change: BroadcastStateChange = { id: randomUUID(), fromState: bc.state, toState, timestamp: now, performedBy, reason };
  bc.stateHistory.push(change);
  bc.state = toState;
  if (toState === "live" && !bc.startedAt) bc.startedAt = now;
  if (toState === "ended") bc.endedAt = now;
  storeBroadcast(bc);
  log.info("broadcast.transition", { matchId, toState, performedBy });
  return bc;
}

export function getBroadcastStatus(matchId: string): BroadcastController | null { return getBroadcast(matchId); }
export function canTransitionBroadcast(from: BroadcastState, to: BroadcastState): boolean { return VALID_BC_TRANSITIONS[from]?.includes(to) ?? false; }
export function emergencyStop(matchId: string, performedBy: string): BroadcastController | null { return transitionBroadcast(matchId, "emergency_stop", performedBy, "Emergency stop"); }

// ===== System 4 — Production Stage Manager =====
export function initProductionStage(matchId: string): ProductionStageState {
  const existing = getStageState(matchId);
  if (existing) return existing;
  const ps: ProductionStageState = { id: randomUUID(), matchId, currentStage: "intro", previousStage: null, stageHistory: [], startedAt: new Date().toISOString() };
  storeStageState(ps);
  return ps;
}

const STAGE_ORDER: ProductionStage[] = ["intro", "countdown", "lobby", "question", "leaderboard", "intermission", "final", "winner_ceremony", "closing"];

export function transitionStage(matchId: string, toStage: ProductionStage): ProductionStageState | null {
  const ps = getStageState(matchId);
  if (!ps) return null;
  const now = new Date().toISOString();
  const transition: StageTransition = { id: randomUUID(), fromStage: ps.currentStage, toStage, timestamp: now, durationMs: 0 };
  ps.previousStage = ps.currentStage;
  ps.currentStage = toStage;
  ps.stageHistory.push(transition);
  storeStageState(ps);
  log.info("stage.transition", { matchId, toStage });
  return ps;
}

export function getProductionStage(matchId: string): ProductionStageState | null { return getStageState(matchId); }
export function getNextStage(matchId: string): ProductionStage | null {
  const ps = getStageState(matchId);
  if (!ps) return null;
  const idx = STAGE_ORDER.indexOf(ps.currentStage);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}
export function getStageOrder(): ProductionStage[] { return [...STAGE_ORDER]; }
