/**
 * Authoritative rules for EduBek live modes.
 * Solo UI and the Socket.IO engine should both use these helpers.
 */

export type LiveGameMode = "classic" | "heist" | "empire" | "royale" | "battle";

export const CLASSIC_BASE = 500;
export const CLASSIC_MAX = 1000;
export const HEIST_CORRECT_GOLD = 100;
export const HEIST_INVEST_WIN = 200;
export const HEIST_RAID_WIN = 300;
export const HEIST_RAID_LOSS = 100;
export const ROYALE_START_HEARTS = 3;
export const ROYALE_STREAK_FOR_SHIELD = 5;
export const BATTLE_DUEL_QUESTIONS = 5;

export const EMPIRE_TIERS = ["Hut", "Village", "Town", "City", "Empire"] as const;
export type EmpireTier = (typeof EMPIRE_TIERS)[number];

export const EMPIRE_UPGRADE_COST = [
  { wood: 0, stone: 0, gold: 0, food: 0 },
  { wood: 80, stone: 40, gold: 20, food: 40 },
  { wood: 140, stone: 100, gold: 60, food: 80 },
  { wood: 200, stone: 180, gold: 120, food: 140 },
  { wood: 280, stone: 260, gold: 200, food: 200 },
] as const;

export type Resources = { wood: number; stone: number; gold: number; food: number };

export function emptyResources(): Resources {
  return { wood: 20, stone: 20, gold: 10, food: 20 };
}

export function classicSpeedBonus(responseMs: number): number {
  const sec = Math.max(0, responseMs) / 1000;
  if (sec <= 3) return 500;
  if (sec <= 6) return 300;
  if (sec <= 10) return 100;
  return 0;
}

export function classicScore(isCorrect: boolean, responseMs: number) {
  if (!isCorrect) return { basePoints: 0, speedBonus: 0, totalPoints: 0 };
  const speedBonus = classicSpeedBonus(responseMs);
  return {
    basePoints: CLASSIC_BASE,
    speedBonus,
    totalPoints: Math.min(CLASSIC_MAX, CLASSIC_BASE + speedBonus),
  };
}

export function heistEarnOnCorrect(): number {
  return HEIST_CORRECT_GOLD;
}

export function resolveHeistInvest(rng = Math.random): { goldDelta: number; win: boolean } {
  const win = rng() < 0.5;
  return { win, goldDelta: win ? HEIST_INVEST_WIN : 0 };
}

export function resolveHeistRaid(rng = Math.random): { goldDelta: number; win: boolean } {
  const win = rng() < 0.5;
  return { win, goldDelta: win ? HEIST_RAID_WIN : -HEIST_RAID_LOSS };
}

export function resourcesForCorrectAnswer(rng = Math.random): Resources {
  const roll = () => 20 + Math.floor(rng() * 31);
  return { wood: roll(), stone: roll(), gold: Math.floor(roll() / 2), food: roll() };
}

export function canUpgradeEmpire(tierIndex: number, res: Resources): boolean {
  const next = EMPIRE_UPGRADE_COST[tierIndex + 1];
  if (!next) return false;
  return res.wood >= next.wood && res.stone >= next.stone && res.gold >= next.gold && res.food >= next.food;
}

export function applyEmpireUpgrade(tierIndex: number, res: Resources): { tierIndex: number; resources: Resources } {
  const nextCost = EMPIRE_UPGRADE_COST[tierIndex + 1];
  if (!nextCost || !canUpgradeEmpire(tierIndex, res)) return { tierIndex, resources: res };
  return {
    tierIndex: tierIndex + 1,
    resources: {
      wood: res.wood - nextCost.wood,
      stone: res.stone - nextCost.stone,
      gold: res.gold - nextCost.gold,
      food: res.food - nextCost.food,
    },
  };
}

export function empirePower(tierIndex: number, res: Resources): number {
  return tierIndex * 400 + res.wood + res.stone + res.gold * 2 + res.food;
}

export function applyRoyaleMistake(hearts: number, hasShield: boolean): { hearts: number; hasShield: boolean; eliminated: boolean } {
  if (hasShield) return { hearts, hasShield: false, eliminated: false };
  const next = Math.max(0, hearts - 1);
  return { hearts: next, hasShield: false, eliminated: next <= 0 };
}

export function royaleShieldEarned(streak: number): boolean {
  return streak > 0 && streak % ROYALE_STREAK_FOR_SHIELD === 0;
}

export function simulateBattleOpponent(isPlayerCorrect: boolean, playerMs: number, rng = Math.random) {
  const opponentCorrect = rng() < 0.62;
  const opponentMs = 2500 + Math.floor(rng() * 8000);
  const playerPts = classicScore(isPlayerCorrect, playerMs).totalPoints;
  const opponentPts = classicScore(opponentCorrect, opponentMs).totalPoints;
  return { opponentCorrect, opponentMs, playerPts, opponentPts };
}
