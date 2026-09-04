import {
  resolveHeistAction,
  type HeistAction,
} from "@/features/multiplayer/mode-rules";
import type { AuthoritativePlayer } from "@/features/multiplayer/types";

export function generateTreasureAnalytics(players: AuthoritativePlayer[]) {
  const gold = players.map((p) => p.modeState?.gold ?? p.score);
  return {
    richest: Math.max(0, ...gold),
    totalGold: gold.reduce((s, n) => s + n, 0),
  };
}

export function generateTreasureDashboard(players: AuthoritativePlayer[]) {
  return {
    analytics: generateTreasureAnalytics(players),
    vaults: players.map((p) => ({
      id: p.id,
      name: p.displayName,
      gold: p.modeState?.gold ?? 0,
      pending: p.modeState?.pendingGold ?? 0,
    })),
  };
}

export { resolveHeistAction };
export type { HeistAction };
export const generateTreasureMatchSummary = generateTreasureAnalytics;
export function buildTreasureLeaderboard(players: AuthoritativePlayer[] = []) {
  return generateTreasureDashboard(players).vaults;
}
export function getRules() {
  return { earnOnCorrect: 100, actions: ["save", "invest", "steal"] };
}
export function getTreasureHeistStatus() {
  return { mode: "heist", ready: true, ...getRules() };
}
export function getEventDefinitions() {
  return [
    { id: "invest_win", label: "Invest payout" },
    { id: "steal_fail", label: "Failed steal" },
  ];
}