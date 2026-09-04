import {
  EMPIRE_TIERS,
  tryEmpireUpgrade,
  empirePower,
} from "@/features/multiplayer/mode-rules";
import type { AuthoritativePlayer } from "@/features/multiplayer/types";

export const BUILDING_DEFS = EMPIRE_TIERS.map((name, index) => ({ name, index }));

export function generateEmpireAnalytics(players: AuthoritativePlayer[]) {
  return {
    maxTier: Math.max(0, ...players.map((p) => p.modeState?.empireTier ?? 0)),
    powers: players.map((p) => empirePower(p.modeState?.empireTier ?? 0, p.modeState?.resources ?? { wood: 0, stone: 0, gold: 0, food: 0 })),
  };
}

export function generateEmpireDashboard(players: AuthoritativePlayer[]) {
  return {
    analytics: generateEmpireAnalytics(players),
    empires: players.map((p) => ({
      id: p.id,
      name: p.displayName,
      tier: EMPIRE_TIERS[p.modeState?.empireTier ?? 0],
      resources: p.modeState?.resources,
      power: p.score,
    })),
  };
}

export { tryEmpireUpgrade, empirePower };
export const RESOURCE_CONFIGS = { wood: { start: 20 }, stone: { start: 20 }, gold: { start: 10 }, food: { start: 20 } };
export const UPGRADE_DEFS = [
  { from: "Hut", to: "Village" },
  { from: "Village", to: "Town" },
  { from: "Town", to: "City" },
  { from: "City", to: "Empire" },
];
export const EMPIRE_EVENTS = [{ id: "harvest" }, { id: "storm" }];
export const generateEmpireMatchSummary = generateEmpireAnalytics;
export function buildEmpireLeaderboard(players: AuthoritativePlayer[] = []) {
  return generateEmpireDashboard(players).empires;
}
export function produceResources() {
  return { wood: 20, stone: 20, gold: 10, food: 20 };
}
export function getRules() {
  return { tiers: EMPIRE_TIERS, upgrades: UPGRADE_DEFS };
}
export function getEmpireStatus() {
  return { mode: "empire", ready: true };
}