import {
  ROYALE_START_HEARTS,
  applyRoyaleMistake,
  royaleShieldEarned,
} from "@/features/multiplayer/mode-rules";
import type { AuthoritativePlayer } from "@/features/multiplayer/types";

export function generateRoyaleAnalytics(players: AuthoritativePlayer[]) {
  const alive = players.filter((p) => p.status !== "eliminated");
  return {
    alive: alive.length,
    eliminated: players.length - alive.length,
    winnerId: alive.length === 1 ? alive[0].id : null,
  };
}

export function generateRoyaleDashboard(players: AuthoritativePlayer[]) {
  return {
    analytics: generateRoyaleAnalytics(players),
    players: players.map((p) => ({
      id: p.id,
      name: p.displayName,
      hearts: p.modeState?.hearts ?? ROYALE_START_HEARTS,
      shield: !!p.modeState?.shield,
      status: p.status,
      streak: p.currentStreak,
    })),
  };
}

export { applyRoyaleMistake, royaleShieldEarned, ROYALE_START_HEARTS };
export const ROYALE_RULES = { startHearts: ROYALE_START_HEARTS, streakForShield: 5 };
export const generateRoyaleMatchSummary = generateRoyaleAnalytics;
export function buildRoyaleLeaderboard(players: AuthoritativePlayer[] = []) {
  return generateRoyaleDashboard(players).players;
}
export function getRules() {
  return ROYALE_RULES;
}
export function getRoyaleStatus() {
  return { mode: "royale", ...ROYALE_RULES };
}